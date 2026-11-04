# The canonical install block

One install story, one wording. `README.md` and `README.es.md` must say **this** and nothing else (the Spanish README carries the same commands with translated prose). Change it here first, then propagate to both READMEs in the same change. `<plugin>` stands for a plugin's `name` in `plugin.json`.

## Routes

This repo is its own marketplace: `.claude-plugin/marketplace.json` (marketplace `aantars-plugins`) lists every promoted plugin. It is not in `claude-plugins-official`, so every route starts by adding the `aantars/plugins` marketplace. Installed plugins update only when the `version` in their `plugin.json` changes: bump it on every release.

| Agent | Route | Updates itself? |
| --- | --- | --- |
| Claude Code (CLI, in-session, Desktop Code tab) | `aantars-plugins` marketplace | Only after you turn on auto-update for the marketplace; otherwise run the update commands |
| Codex, skills.sh, other agents | Not supported | Mods run on Claude Code's hooks-module API only |

Never promise "instant".

## Claude Code (CLI)

<canonical-block name="claude-code">

```bash
claude plugin marketplace add aantars/plugins
claude plugin install <plugin>@aantars-plugins
```

Installed at the user scope, the plugin also loads in the sessions the Desktop app starts.

</canonical-block>

## Claude Code (in a session)

<canonical-block name="claude-code-in-session">

```text
/plugin marketplace add aantars/plugins
/plugin install <plugin>@aantars-plugins
```

Then run `/reload-plugins` or start a new session.

</canonical-block>

## Claude Desktop (Code tab)

<canonical-block name="claude-desktop">

1. Open **Customize**, select **Plugins**, then **Add** > **Add marketplace**.
2. Add `aantars/plugins`.
3. Find **<plugin>** in the list and install it.
4. Start or resume a **Code** session (not Chat or Cowork).

</canonical-block>

## Updating and uninstalling

<canonical-block name="update-uninstall">

| Route | Update | Uninstall |
| --- | --- | --- |
| Claude Code | `claude plugin marketplace update aantars-plugins`, then `claude plugin update <plugin>@aantars-plugins`. Or turn on auto-update for the `aantars-plugins` marketplace in `/plugin` > **Marketplaces**. | `claude plugin uninstall <plugin>@aantars-plugins`, then `claude plugin marketplace remove aantars-plugins` |
| Claude Desktop | **Customize** > **Plugins**, open **<plugin>** and update it | Same place, uninstall it |

</canonical-block>

## Running a mod from a local folder

<canonical-block name="local-folder">

To try a change before it is released, point Claude Code at the plugin folder instead of installing it: `claude --plugin-dir <folder>` for one terminal session, or `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json` for every session, the Desktop app's included. Do not combine this with an installed copy of the same plugin, or it loads twice.

</canonical-block>
