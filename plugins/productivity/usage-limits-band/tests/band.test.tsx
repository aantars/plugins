import { describe, expect, test } from 'claude-code/testing'

import { bar, basename, formatDuration, formatTokens, limitView, parseResets, roundAway } from '../hooks/register'

const NOW_S = 1_760_000_000 // fixed epoch seconds

const BAND = { plugin: 'usage-limits-band', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 6, bodyColumns: 160, scroll: { offset: 0, bodyRows: 6 }, view: {} } } as const

describe('helpers', () => {
  test('formats like the terminal status line', async () => {
    expect(formatTokens(85_300, 40)).toBe('85.3k')
    expect(formatTokens(1_234_567, 40)).toBe('1.2M')
    expect(formatTokens(512, 1)).toBe('512')
    expect(formatTokens(undefined, 42.5)).toBe('43%')
    expect(formatDuration(4 * 86400 + 5 * 3600 + 100)).toBe('4d5h')
    expect(formatDuration(3600 + 20 * 60 + 5)).toBe('1h20m')
    expect(formatDuration(29 * 60 + 1)).toBe('30m')
    expect(bar(4)).toBe('████░░░░░░')
    expect(roundAway(42.5)).toBe(43)
    expect(parseResets(1760000000)).toBe(1760000000)
    expect(parseResets('2025-10-09T08:53:20Z')).toBe(1760000000)
    expect(basename('C:\\Users\\x\\my-project\\')).toBe('my-project')
  })

  test('projection: window average with ~, capped at reset', async () => {
    const v = limitView({ kind: 'five_hour', percentUsed: 42, resetsAt: NOW_S + 3 * 3600 }, undefined, NOW_S)
    expect(v.approx).toBe(true)
    expect(formatDuration(v.timeToLimit ?? -1)).toBe('2h45m')
    expect(v.color).toBe('green')
  })

  test('projection: session rate, red when far before reset', async () => {
    const v = limitView(
      { kind: 'five_hour', percentUsed: 80, resetsAt: NOW_S + 4 * 3600 },
      { pct: 70, t: NOW_S - 600 },
      NOW_S,
    )
    expect(v.approx).toBe(false)
    expect(formatDuration(v.timeToLimit ?? -1)).toBe('20m')
    expect(v.color).toBe('red')
  })

  test('limit hit', async () => {
    const v = limitView({ kind: 'seven_day', percentUsed: 100, resetsAt: NOW_S + 3600 }, undefined, NOW_S)
    expect(v.hit).toBe(true)
  })

  test('module clock is local time (CET/CEST expected)', async () => {
    expect([-60, -120]).toContain(new Date().getTimezoneOffset())
  })
})

function engine(on: any, opts: { top?: string; head?: string; root: string }) {
  on('clock.now', () => ({ value: NOW_S * 1000 }))
  on('env.get', () => ({ value: undefined }))
  on('session.cwd', () => ({ value: opts.root }))
  on('session.root', () => ({ value: opts.root }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { tokens: 85_300, window: 1_000_000, percent: 9 },
      rateLimits: [
        { kind: 'seven_day', percentUsed: 18, resetsAt: new Date((NOW_S + 4 * 86400) * 1000).toISOString() },
        { kind: 'five_hour', percentUsed: 42, resetsAt: new Date((NOW_S + 3 * 3600) * 1000).toISOString() },
      ],
    },
  }))
  on('process.run', (_: unknown, e: any) => {
    const argv: string[] = e.argv
    const out = argv.includes('--show-toplevel') ? opts.top : opts.head
    return { value: out === undefined ? { exitCode: 128, stdout: '', stderr: 'fatal' } : { exitCode: 0, stdout: `${out}\n`, stderr: '' } }
  })
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
}

test('band: two lines with repo and branch', async ($, on) => {
  engine(on, { root: 'C:\\w\\my-project', top: 'C:/w/acme-tools', head: 'feature/login' })
  await $.session.start({ cwd: 'C:\\w\\my-project', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: 'my-project' })).toBeFalsy()
  for (const t of ['acme-tools', 'feature/login', '85.3k ', '(42%)', '(18%)', 'Weekly']) {
    expect(await ui.find({ type: 'Text', text: t })).toBeTruthy()
  }
  expect(await ui.find({ type: 'Text', text: /~limit in 2h45m/ })).toBeTruthy()
  await ui.unmount()
})

test('band: no repo hides repo and branch', async ($, on) => {
  engine(on, { root: 'C:\\w\\my-project', top: undefined, head: undefined })
  await $.session.start({ cwd: 'C:\\w\\my-project', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /acme|feature/ })).toBeFalsy()
  await ui.unmount()
})

test('band: detached HEAD', async ($, on) => {
  engine(on, { root: 'C:\\w\\proj', top: 'C:/w/proj', head: 'HEAD' })
  await $.session.start({ cwd: 'C:\\w\\proj', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: '(detached)' })).toBeTruthy()
  await ui.unmount()
})

test('band: each limit on its own line', async ($, on) => {
  engine(on, { root: 'C:\w\proj', top: 'C:/w/proj', head: 'main' })
  await $.session.start({ cwd: 'C:\w\proj', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const five = await ui.find({ type: 'Text', text: /5h/ })
  const week = await ui.find({ type: 'Text', text: /Weekly/ })
  expect(five?.text).not.toMatch(/Weekly/)
  expect(week?.text).not.toMatch(/5h/)
  await ui.unmount()
})

test('band: hidden on the terminal', async ($, on) => {
  engine(on, { root: 'C:\w\proj', top: 'C:/w/proj', head: 'main' })
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  await $.session.start({ cwd: 'C:\w\proj', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Weekly|5h/ })).toBeFalsy()
  expect((await ui.find({ type: 'Text', text: 'engine' }))?.text).toBe('engine')
  await ui.unmount()
})

test('band: Hide collapses to a Show button and back', async ($, on) => {
  engine(on, { root: 'C:\w\proj', top: 'C:/w/proj', head: 'main' })
  await $.session.start({ cwd: 'C:\w\proj', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'toggle' })
  expect(await ui.find({ type: 'Text', text: /Weekly/ })).toBeFalsy()
  expect(await ui.find({ type: 'Button', key: 'toggle' })).toBeTruthy()
  await ui.press({ key: 'toggle' })
  expect(await ui.find({ type: 'Text', text: /Weekly/ })).toBeTruthy()
  await ui.unmount()
})
