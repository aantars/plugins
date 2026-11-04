import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren, Timer, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Baselines, CtxOptimal, CtxRow, GitInfo, LimitRow, UsageSnapshot } from '../types'

// A terminal status line, ported to an always-visible band above the prompt.
// Data comes from $.session.usage() / session.measure (the status line's own figures),
// $.session.root() / $.session.cwd() and git through $.process.run.

const snapshot = atom({ plugin: 'usage-limits-band', key: 'snapshot' } as const, null)
const git = atom({ plugin: 'usage-limits-band', key: 'git' } as const, null)
const baselines = atom({ plugin: 'usage-limits-band', key: 'baselines' } as const, {})
const tick = atom({ plugin: 'usage-limits-band', key: 'tick' } as const, 0)
const optimal = atom({ plugin: 'usage-limits-band', key: 'optimal' } as const, { pct: 50, tokens: 200000 })
const collapsed = atom({ plugin: 'usage-limits-band', key: 'collapsed' } as const, false)

const GIT_TTL_MS = 5000
const TICK_MS = 30000

const RED = 'red'
const YELLOW = 'yellow'
const GREEN = 'green'
const ORANGE = '#ff8700'
const BLUE = '#b1b9f9'

const WINDOWS: Record<string, { label: string; icon: string; seconds: number }> = {
  five_hour: { label: '5h', icon: '\u{1F680}', seconds: 5 * 3600 },
  seven_day: { label: 'Weekly', icon: '\u{1F319}', seconds: 7 * 86400 },
}
const ORDER = ['five_hour', 'seven_day']

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ---------- pure helpers ----------

export function basename(p: string): string {
  const parts = p.replace(/[\\/]+$/, '').split(/[\\/]/)
  return parts[parts.length - 1] ?? ''
}

/** Math.Round(x, 0, MidpointRounding.AwayFromZero) */
export function roundAway(x: number): number {
  return Math.sign(x) * Math.round(Math.abs(x))
}

/** resets_at as epoch seconds; accepts epoch seconds or ISO-8601. */
export function parseResets(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  const s = String(v)
  if (/^\s*-?\d+(\.\d+)?\s*$/.test(s)) return Number(s)
  const ms = Date.parse(s)
  return Number.isNaN(ms) ? undefined : ms / 1000
}

export function bar(filled: number): string {
  const n = Math.max(0, Math.min(10, filled))
  return '█'.repeat(n) + '░'.repeat(10 - n)
}

export function formatTokens(tokens: number | undefined, percent: number | undefined): string {
  if (tokens === undefined) return `${roundAway(percent ?? 0)}%`
  if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(1)}M`
  if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}k`
  return `${Math.trunc(tokens)}`
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, seconds)
  const days = s / 86400
  const hours = s / 3600
  if (days >= 1) return `${Math.floor(days)}d${Math.floor((s % 86400) / 3600)}h`
  if (hours >= 1) return `${Math.floor(hours)}h${Math.floor((s % 3600) / 60)}m`
  return `${Math.ceil(s / 60)}m`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** Local "ddd dd/MM HH:mm", e.g. "Fri 17/10 14:00". */
export function formatClock(epoch: number): string {
  const d = new Date(epoch * 1000)
  return `${DAYS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ctxColor(c: CtxRow, opt: CtxOptimal): string {
  const pct = c.percent ?? 0
  let ratio: number
  if (c.window && c.window > 0 && c.tokens !== undefined) {
    ratio = c.tokens / Math.min((c.window * opt.pct) / 100, opt.tokens)
  } else {
    ratio = pct / opt.pct
  }
  return ratio >= 1 ? RED : ratio >= 0.9 ? ORANGE : GREEN
}

export type LimitView = {
  used: number
  hit: boolean
  approx: boolean
  timeToLimit?: number
  color?: string
  clock?: string
}

export function limitView(l: LimitRow, base: { pct: number; t: number } | undefined, now: number): LimitView {
  const used = l.percentUsed
  if (l.resetsAt === undefined) return { used, hit: false, approx: false }
  const clock = formatClock(l.resetsAt)
  if (used >= 100) return { used, hit: true, approx: false, clock }

  const remaining = Math.max(0, l.resetsAt - now)
  let rate = 0
  let approx = false
  if (base) {
    const dt = now - base.t
    const dp = used - base.pct
    if (dt >= 60 && dp > 0) rate = dp / dt
  }
  if (rate <= 0) {
    const windowSec = WINDOWS[l.kind]?.seconds
    if (windowSec) {
      const elapsed = now - (l.resetsAt - windowSec)
      if (elapsed >= 60 && used > 0) {
        rate = used / elapsed
        approx = true
      }
    }
  }
  const timeToLimit = rate > 0 ? Math.min((100 - used) / rate, remaining) : remaining
  const color = timeToLimit < remaining * 0.1 ? RED : timeToLimit < remaining * 0.4 ? YELLOW : GREEN
  return { used, hit: false, approx, timeToLimit, color, clock }
}

// ---------- engine-facing ----------

function toLimits(rows: readonly SessionRateLimit[]): LimitRow[] {
  return rows
    .filter(r => r.kind in WINDOWS)
    .map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: parseResets(r.resetsAt) }))
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
}

function toCtx(c: SessionContextUsage): CtxRow | null {
  if (c.percent === undefined) return null
  return { tokens: c.tokens, window: c.window, percent: c.percent }
}

async function store($: EngineInterface, limits: LimitRow[], ctx: CtxRow | null) {
  const now = (await $.clock.now()) / 1000
  // Per-session baseline per window; reset on a new window or a drop in usage.
  await update($, baselines, prev => {
    const nextB: Baselines = { ...prev }
    for (const l of limits) {
      if (l.resetsAt === undefined) continue
      const b = prev[l.kind]
      if (!b || Math.abs(b.resets - l.resetsAt) > 300 || l.percentUsed < b.pct) {
        nextB[l.kind] = { pct: l.percentUsed, t: now, resets: l.resetsAt }
      }
    }
    return nextB
  })
  const snap: UsageSnapshot = { limits, ctx }
  await update($, snapshot, () => snap)
}

async function gitLine($: EngineInterface, cwd: string, args: string[]): Promise<string | undefined> {
  try {
    const r = await $.process.run(['git', '-C', cwd, '-c', 'core.optionalLocks=false', ...args], { timeoutMs: 5000 })
    if (r.exitCode !== 0) return undefined
    const line = r.stdout.split(/\r?\n/)[0]?.trim()
    return line ? line : undefined
  } catch {
    return undefined
  }
}

async function refreshGit($: EngineInterface, force = false) {
  const cwd = await $.session.cwd()
  const now = await $.clock.now()
  const cached = await read($, git)
  if (!force && cached && cached.cwd === cwd && now - cached.at < GIT_TTL_MS) return

  let root = ''
  try {
    root = await $.session.root()
  } catch {}
  const project = basename(root || cwd)

  const [top, head] = await Promise.all([
    gitLine($, cwd, ['rev-parse', '--show-toplevel']),
    gitLine($, cwd, ['rev-parse', '--abbrev-ref', 'HEAD']),
  ])
  const info: GitInfo = {
    cwd,
    project,
    repo: top ? basename(top) : undefined,
    branch: head === undefined ? undefined : head === 'HEAD' ? '(detached)' : head,
    at: now,
  }
  await update($, git, () => info)
}

async function refreshUsage($: EngineInterface) {
  const u = await $.session.usage()
  await store($, toLimits(u.rateLimits), toCtx(u.context))
}

async function readOptimal($: EngineInterface) {
  const pctRaw = await $.env.get('CLAUDE_CTX_OPTIMAL_PCT')
  const tokRaw = await $.env.get('CLAUDE_CTX_OPTIMAL_TOKENS')
  const pct = Number(pctRaw)
  const tokens = Number(tokRaw)
  const opt: CtxOptimal = {
    pct: pctRaw && Number.isFinite(pct) && pct > 0 ? pct : 50,
    tokens: tokRaw && Number.isFinite(tokens) && tokens > 0 ? tokens : 200000,
  }
  await update($, optimal, () => opt)
}

export const register: Register = on => {
  let timer: Timer | undefined

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await readOptimal($)
    await Promise.all([refreshUsage($), refreshGit($, true)])
    timer?.cancel()
    // Redraws "limit in …" and re-checks git (branch switches outside a turn).
    timer = $.clock.every(TICK_MS, () => {
      void update($, tick, n => n + 1)
      void refreshGit($)
    })
    return result
  })

  on('session.attach', async ($, e, next) => {
    const result = await next(e)
    await refreshGit($, true)
    return result
  })

  on('session.measure', async ($, e, next) => {
    await store($, toLimits(e.rateLimits), toCtx(e.context))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await refreshGit($)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // The CLI keeps its own status line; the band is for the desktop app only.
    if (e.surface === 'terminal' || e.props.hasSurvey) return next(e)

    const [snap, g, bases, opt, isCollapsed] = await Promise.all([
      read($, snapshot),
      read($, git),
      read($, baselines),
      read($, optimal),
      read($, collapsed),
    ])
    await read($, tick) // subscribe to the periodic redraw
    const now = (await $.clock.now()) / 1000
    const { Box, Text, Button } = $.ui.resolve(e)

    const toggle = (
      <Button
        key="toggle"
        label={isCollapsed ? 'Show usage' : 'Hide'}
        plain
        dimColor
        onPress={() => update($, collapsed, v => !v)}
      />
    )
    if (isCollapsed) return <Box flexDirection="row">{toggle}</Box>

    const sep = (k: string) => (
      <Text key={k} dimColor>
        {' | '}
      </Text>
    )
    const join = (parts: RenderChildren[]) => {
      const out: RenderChildren[] = []
      parts.forEach((p, i) => {
        if (i > 0) out.push(sep(`s${i}`))
        out.push(p)
      })
      return out
    }

    // Line 1: repo | branch | context
    const line1: RenderChildren[] = []
    if (g?.repo) line1.push(<Text key="repo">{g.repo}</Text>)
    if (g?.branch) line1.push(<Text key="branch" dimColor>{g.branch}</Text>)
    const c = snap?.ctx
    if (c && c.percent !== undefined) {
      const tokens =
        c.tokens !== undefined ? c.tokens : c.window ? (c.percent / 100) * c.window : undefined
      const filled = Math.round(c.percent / 10)
      line1.push(
        <Text key="ctx">
          {`${formatTokens(tokens, c.percent)} `}
          <Text color={ctxColor({ ...c, tokens }, opt)}>{bar(filled)}</Text>
        </Text>,
      )
    }

    // One line per limit: 5h, then Weekly
    const limitLines: RenderChildren[] = []
    for (const l of snap?.limits ?? []) {
      const w = WINDOWS[l.kind]
      if (!w) continue
      const v = limitView(l, bases[l.kind], now)
      const filled = Math.round(Math.max(0, Math.min(100, l.percentUsed)) / 10)
      const head = [
        <Text key="ic">{`${w.icon} `}</Text>,
        <Text key="lb" bold>{w.label}</Text>,
        <Text key="sp">{' '}</Text>,
        <Text key="bar" color={BLUE}>{bar(filled)}</Text>,
        <Text key="pct" bold>{` (${roundAway(l.percentUsed)}%)`}</Text>,
      ]
      let tail: RenderChildren[] = []
      if (v.hit) {
        tail = [
          <Text key="hit" color={RED}>{' limit hit'}</Text>,
          <Text key="rc" dimColor>{` (reset ${v.clock})`}</Text>,
        ]
      } else if (v.timeToLimit !== undefined) {
        tail = [
          <Text key="ar">{' -> '}</Text>,
          <Text key="li" color={v.color}>{`${v.approx ? '~' : ''}limit in ${formatDuration(v.timeToLimit)}`}</Text>,
          <Text key="ck" dimColor>{` (${v.clock})`}</Text>,
        ]
      }
      limitLines.push(
        <Box key={l.kind} flexDirection="row">
          <Text>
            {head}
            {tail}
          </Text>
        </Box>,
      )
    }

    if (line1.length === 0 && limitLines.length === 0) return next(e)

    return (
      <Box flexDirection="column">
        <Box key="l1" flexDirection="row">
          {join(line1)}
          {line1.length > 0 ? <Text key="gap">{'   '}</Text> : null}
          {toggle}
        </Box>
        {limitLines}
      </Box>
    )
  })
}
