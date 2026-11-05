## What it does

`usage-limits-band` keeps your Claude usage in sight while you work in the Claude Desktop **Code** tab. It draws a small band above the prompt with the git repo and branch of the chat in front of you, how full its context window is, and your 5-hour and weekly limits, each with a projection of when you will run out at your current pace.

It only shows figures Claude Code itself reports: the same context and rate-limit data the terminal status line receives. Where a figure is missing (no repo, no rate-limit reading yet), that part of the band is left out rather than guessed.

## Where it shows

The band draws in the Desktop **Code** tab only. In the terminal it draws nothing, so a status line you already have there is not duplicated.

```
acme-tools | feature/login | 85.3k ████░░░░░░                     [ Hide ]
🚀 5h ████░░░░░░ (42%) -> limit in 1h20m (Fri 17/10 14:00)
🌙 Weekly ██░░░░░░░░ (18%) -> ~limit in 4d5h (Mon 20/10 09:00)
```

Each chat has its own band, computed from that chat's own folder, so switching chats shows the other chat's repo and context.

## Prerequisites

- `git` on your `PATH`, for the repo and branch. Without it, those two parts are left out and the rest still works.
- A Claude subscription plan for the 5-hour and weekly lines. On API billing there are no rate-limit windows to show, and those lines are left out.

## Reading the band

| Part | What it means |
| --- | --- |
| Repo | Name of the git repository's top folder for the chat's directory |
| Branch | Current branch, in grey; `(detached)` when HEAD is not on a branch |
| Context | Tokens the last response was answered over, then a 10-cell bar of the window used |
| 🚀 5h / 🌙 Weekly | A 10-cell bar of the window used and its percentage |
| `-> limit in 1h20m` | How long until you hit the limit at your current pace, capped at the reset |
| `~` before it | No pace measured in this chat yet, so the window's average pace is used |
| Clock in brackets | When the window resets, in your local time |
| `limit hit` | The window is used up; the bracket shows when it resets |

The context bar turns orange in the last 10% before an "optimal" size and red past it. The optimal size is the smaller of half the context window and 200,000 tokens. Set `CLAUDE_CTX_OPTIMAL_PCT` and `CLAUDE_CTX_OPTIMAL_TOKENS` to change those two numbers.

The `limit in` text is green while the projected limit is well after the reset, yellow when it falls before the last 40% of the time left, and red when it falls before the last 10%.

**Hide**, a button at the right edge of the first line, folds the band to a single **Show usage** button at the same spot. The choice lasts for that chat; a new chat starts with the band open.

## Common questions

**Why does the band say nothing about limits right after I open a chat?**
The rate-limit figures arrive with the first response. Until then only the repo, branch and context (if known) are shown.

**How accurate is the projection?**
It is a straight-line estimate. Each chat measures its own pace from the moment it first sees a window; until it has seen at least a minute and some usage, it falls back to the window's average, marked with `~`. A burst of heavy work moves it quickly.

**Does it run git all the time?**
No. It asks git when the chat starts, when you come back to it, after each turn and every 30 seconds, and reuses the answer for 5 seconds. It never runs git while drawing, so the interface does not wait for it.

## It's working if

- The first line shows the repo and branch you see in your terminal for that folder.
- After a response, the 5h and Weekly lines appear with percentages that match **Settings** > **Usage**.
- **Hide** folds the band and **Show usage** brings it back.
- In a terminal session, the band does not appear.

## Where it fits

A standalone companion for the Desktop Code tab. It mirrors what a terminal [status line](https://code.claude.com/docs/en/statusline) can show, for the place where there is no status line.
