# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hebrew (RTL) promotional landing page for the "מפתחי AI 16" course (cohort 16) at the Hebrew University of Jerusalem.

The whole site is one static file, `index.html`. It has inline CSS and loads the Heebo font from Google Fonts. There is no JavaScript, no build step, no package manager and no tests. To preview it, open the file in a browser (`Start-Process index.html`).

## Structure and conventions

- Sections are anchored by id: `#about`, `#syllabus`, `#audience`, `#faq`, `#register`. The nav links point at these ids, so renaming an id means updating its nav link too.
- Colors and the radius are CSS custom properties on `:root`. Use those variables instead of hard-coded colors.
- The site uses a single responsive breakpoint at 720px; below it the nav links are hidden.
- `.alt` sections alternate the background color.
- The FAQ uses native `<details>`/`<summary>` and needs no JavaScript.
- Real course data has not been supplied. Placeholders sit in square brackets (`[X]`, `[תאריך פתיחה]`, `[מחיר]`, `[שם הקמפוס]`), plus `REPLACE@mail.huji.ac.il` in the registration `mailto`. Each block that contains them is marked with an HTML `<!-- TODO -->` comment. Don't invent real dates, prices or contacts.
- The syllabus is a generic draft, not the official curriculum.
- All user-facing copy is in Hebrew.

## Workflow (required)

1. **Models:** do the planning with Opus 5.5 (`claude-opus-5-5`) and the implementation with Sonnet 5.5 (`claude-sonnet-5-5`), for example by delegating implementation to a subagent with `model: sonnet`.
2. **Testing:** after writing code, test it and also run regression checks that the existing sections, nav anchors, RTL layout and mobile breakpoint still work.
3. **Security:** after the tests pass, run the `security-review` skill.
4. **Commit:** after every code change, commit (conventional commits: `feat:`, `fix:`, …) on the `dev` branch. Merge into `main` only for releases.
5. **Obsidian:** when the agent finishes a task, document every change in the Obsidian vault under `HUJI_AI_DEV_16_WEBSITE/`. Append to `ACTION_LOG.md` (date · tool · what changed), and update the decisions and TODO list in `README.md` when they change. Logging is manual; no hook is set up.
6. **Git/GitHub:** the project uses a git repo plus a GitHub remote with two branches, `main` and `dev`. If the repo doesn't exist yet, create it before the first commit.
