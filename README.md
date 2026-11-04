**English** | [Español](./README.es.md)

# aantars plugins

Claude Code plugins I use for everyday work, packaged as a marketplace you can install from the terminal or the Claude Desktop app.

The first one is **usage-limits-band**: a small band above the prompt in the Desktop **Code** tab that keeps your usage in sight. It shows the git repo and branch you are on, how full the context window is, and your 5-hour and weekly limits, with a projection of when you will hit each one at your current pace. More plugins will follow.

## Installation

These plugins are mods: they run on Claude Code's hooks-module API, so they work in Claude Code (terminal and the Desktop Code tab) and not in Codex or other agents. The hooks-module API is in early access and may change between Claude Code releases.

<details>
<summary><strong>Claude Code (CLI)</strong></summary>

```bash
claude plugin marketplace add aantars/plugins
claude plugin install usage-limits-band@aantars-plugins
```

Installed at the user scope, the plugin also loads in the sessions the Desktop app starts.

</details>

<details>
<summary><strong>Claude Code (in a session)</strong></summary>

```text
/plugin marketplace add aantars/plugins
/plugin install usage-limits-band@aantars-plugins
```

Then run `/reload-plugins` or start a new session.

</details>

<details>
<summary><strong>Claude Desktop (Code tab)</strong></summary>

1. Open **Customize**, select **Plugins**, then **Add** > **Add marketplace**.
2. Add `aantars/plugins`.
3. Find **usage-limits-band** in the list and install it.
4. Start or resume a **Code** session (not Chat or Cowork).

</details>

<details>
<summary><strong>Running it from a local folder</strong> (to try changes)</summary>

To try a change before it is released, point Claude Code at the plugin folder instead of installing it: `claude --plugin-dir <folder>` for one terminal session, or `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json` for every session, the Desktop app's included. Do not combine this with an installed copy of the same plugin, or it loads twice.

</details>

## Reference

### Productivity

Everyday workflow tools, not code-specific.

- **[usage-limits-band](./plugins/productivity/usage-limits-band)**: Always-visible band in the Desktop Code tab with repo, branch, context fill, and the 5-hour and weekly limits with a projection of when you will hit them. Hidden in the terminal, where your own status line does the job. [Docs](./docs/productivity/usage-limits-band.md)

## Updating and uninstalling

| Route | Update | Uninstall |
| --- | --- | --- |
| Claude Code | `claude plugin marketplace update aantars-plugins`, then `claude plugin update usage-limits-band@aantars-plugins`. Or turn on auto-update for the `aantars-plugins` marketplace in `/plugin` > **Marketplaces**. | `claude plugin uninstall usage-limits-band@aantars-plugins`, then `claude plugin marketplace remove aantars-plugins` |
| Claude Desktop | **Customize** > **Plugins**, open **usage-limits-band** and update it | Same place, uninstall it |

## License

[MIT](./LICENSE)
