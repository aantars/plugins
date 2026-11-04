# Writing docs pages

Every plugin in a promoted bucket (`productivity/`, `engineering/`) has a human-facing docs page in two languages: `docs/<bucket>/<name>.md` (English) and `docs/<bucket>/<name>.es.md` (Spanish, Spain). The docs tree mirrors the promoted bucket folders. The page orients one reader around one plugin: what it does, when it helps and what to expect. It is not a copy of the hooks module.

Create or re-sync both pages whenever a promoted plugin is added, renamed, or changes behaviour. A rename moves both files. A plugin removed outright keeps its pages, opened with a `> **Archived.** ...` notice naming the version it was removed in and any replacement.

**Every link is absolute**: `https://github.com/aantars/plugins/blob/main/...` for repo files, full URLs for everything else. Pages may be read outside the repo, where relative links break.

**No install commands.** Install wording lives in the READMEs, copied from [install-block.md](./install-block.md). Point to the README for how to install.

There is no H1.

## Page template

Keep this order. `What it does`, `Where it shows` and `Where it fits` are always present; the others only when they have real content.

<page-template>

## What it does

One or two plain paragraphs. Lead with the plugin's one-sentence job, then state its **defining constraint** as a plain sentence.

## Where it shows

Which surfaces draw it (terminal, Desktop Code tab, VS Code, mobile) and where on screen. A sample of what it draws, in a code block.

## Prerequisites

Only when the plugin needs something in place: a tool on PATH, a setting. Omit the heading otherwise.

## <free-form middle>

One to three short sections that make it click: what each part means, the controls it offers, the settings it reads. Use tables for branches.

## Common questions

Real questions, sharpest first, each in bold with the answer below. Say the unflattering thing where it is true. Omit the heading when there is nothing worth answering.

## It's working if

A few bullets the reader can check on their own screen.

## Where it fits

One or two sentences: the plugin's role and the one or two neighbours that matter, linked absolutely.

</page-template>

## Conventions

- Branches go in a table or a list, never in a paragraph.
- Never name the author. State claims about the plugin plainly.
- Keep the page short: no spare headings, no restated links.
- The Spanish page says the same as the English one, written as natural Spanish. Change both in the same change.
