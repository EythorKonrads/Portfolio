# Working principles

- If my request is ambiguous or has several readings, stop and ask one
  clarifying question, naming what's unclear, before doing anything.
- Write the minimum code that solves the problem, with features, abstractions
  and configurability limited to what was asked.
- Every changed line traces to my request. Match the existing style, remove
  only what your own change orphaned, and mention unrelated dead code rather
  than deleting it.
- Turn each task into a check you can verify, such as a test that reproduces
  the bug, and loop until it passes.
- In chat replies to me, be extremely concise; sacrifice grammar for
  concision. This doesn't apply to commit messages, PR descriptions or docs,
  which are written in full sentences.

# Project overview

Personal portfolio site for Eythor Konradsson (eythorkonrads.com): a single page
with a hero, Experience, Education and Projects, plus a tag filter and a
sticky section nav.

- `src/assets/*.json`: the site's content (jobs, educations, projects).
- Deployed on Cloudflare Workers (`wrangler.jsonc`), with Scores in D1
  (`docs/scoreboard.md`).

# Commands

- `npm run dev`: dev server at http://localhost:5173.
- `npm run test:e2e`: build, then run every Cypress spec against the preview
  server. CI runs the same thing on every PR.
- One spec: `npm run test:e2e -- --spec cypress/e2e/<name>.cy.js`.
- `npm run test:e2e:dev`: Cypress's interactive runner against the dev server.
- `npm run test:component`: Cypress component specs (`cypress/component/`),
  served by Vite with no build. CI runs these too.
- `npm run test:e2e:quiet`, `npm run test:component:quiet`: the same runs with
  short output, and failures still print in full. Agents use these by default.
- `npx eslint .`: lint without fixing (`npm run lint` fixes).

# Generated files

Don't edit these by hand:

- `src/components.d.ts`: written by `unplugin-vue-components` on every build.
  Commit the regenerated file when components are added or removed.
- `package-lock.json`: change it only through `npm install` / `npm uninstall`
  / `npm audit fix`.

# Git rules

- This repo's main branch is `master`.
- Never commit to, merge into, or push to `master`.
- Before making any changes, check the current branch. If it is `master`,
  create a new branch named `claude/<type>/<short-description>` and switch to it.
- Leave merging into `master` to me (via pull request).
- One worktree per issue, named `issue-<n>` and created from `origin/master`.
  Each session works only in its own worktree, on branches it created.
- Committing on a `claude/*` branch is fine without asking. Ask me before
  pushing or opening a pull request, every time.
- `.claude/settings.json` pre-approves routine commands (tests, lint, git on
  `claude/*` branches, opening PRs) and blocks pushing to `master`, force
  pushes and merging PRs. Keep commands simple (no `cd … &&` chains) so they
  match those rules.

# Pull requests

- One PR per change, each on its own branch from `master`. Only stack a PR on
  another branch when it can't be done without it, and say so at the top.
- Description sections: **Summary** (what changed and why), **Tests** (specs
  added or changed, and the `npm run test:e2e` result), and **Check by eye**
  (anything Cypress can't judge). These override the `pr` skill's template.
- If PRs will conflict with each other, say which and in which files.

# Conventional Commits

Commit messages, PR titles and the `<type>` in branch names follow
[Conventional Commits](https://www.conventionalcommits.org/), e.g.
`fix(hero): correct link color on hover`. Branch descriptions are kebab-case.

# Testing

The Cypress e2e suite (`cypress/e2e/`) is the source of truth for whether the
site works. Rely on it instead of checking things by hand in a browser.

- After any change to `src/`, run `npm run test:e2e` (it builds first, then
  runs every spec against the preview server) and `npm run test:component`,
  and make sure both pass before committing.
- Prettier (`.prettierrc`) and ESLint must pass before committing.
- Component specs (`cypress/component/`) mount one component, or import a
  plain module such as the game's rules (`src/game/`) and test it directly.
  Use them for logic and single components; use e2e for flows on the page.
- When adding or changing a feature, add or update the matching spec in the
  same change. Specs read content from `src/assets/*.json`, so content-only
  edits need no test changes.
- Select elements with `data-cy` attributes, not CSS classes. Add a `data-cy`
  to any new element a test needs.
- Visit the page with `cy.visitHome()` (`cypress/support/commands.js`); it fails
  the test on any `console.error`.
- Elements below the fold start hidden until scrolled to (`v-reveal`), so
  `scrollIntoView()` before asserting `be.visible`.
- If a test fails, fix the code, not the test, unless the test is wrong. Say
  which it was.
- Cypress can't judge how something looks or feels (spacing, animation
  smoothness). Call that out for me to check rather than taking screenshots.
- Tests run on Linux in CI, where scrollbars take up width (they don't on
  macOS). Compare widths against `document.documentElement.clientWidth`
  rather than the viewport width.
- `Cypress.env()` was removed in Cypress 16; use `Cypress.expose()` or
  `cy.env()`.

# Coding standards

`CODING_STANDARDS.md`: code style, accessibility and other rules for changed
code. Read it before writing or reviewing code.

# Dependencies

- Prefer plain HTML, CSS and Vue over adding a package. Don't add UI component
  libraries; a whole library was once pulled in for one link and three icons.
- New icons go in `src/assets/icons/` as SVG files.
- Explain in the PR why any new dependency is needed.

# Gotchas

- On desktop the content column (`.home__wrapper`) scrolls and the page
  doesn't; below 600px the whole page scrolls. Scroll code and tests must
  handle both.
- Don't put a CSS `transform` (including `v-reveal`) on an element that
  contains a popup: it breaks the popup's fixed backdrop. Put `v-reveal` on a
  child instead, as `TagFilter.vue` does.
- Education and Projects are shorter than the screen, so they can't scroll all
  the way up to the sticky header.
- PRs that only change docs or tooling skip CI (`paths-ignore` in
  `.github/workflows/ci.yml`) and the Cloudflare deploy (build watch paths, set
  in the dashboard: Settings > Build). When adding a file that affects the site
  or the tests, check it isn't covered by either list.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels, each named after its role (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
