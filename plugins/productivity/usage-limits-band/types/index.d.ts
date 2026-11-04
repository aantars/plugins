export type LimitRow = { kind: string; percentUsed: number; resetsAt?: number }
export type CtxRow = { tokens?: number; window?: number; percent?: number }
export type UsageSnapshot = { limits: LimitRow[]; ctx: CtxRow | null }
export type GitInfo = { cwd: string; project: string; repo?: string; branch?: string; at: number }
export type Baseline = { pct: number; t: number; resets: number }
export type Baselines = Record<string, Baseline>
export type CtxOptimal = { pct: number; tokens: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-limits-band': {
      snapshot: UsageSnapshot | null
      git: GitInfo | null
      baselines: Baselines
      tick: number
      optimal: CtxOptimal
      collapsed: boolean
    }
  }
}
