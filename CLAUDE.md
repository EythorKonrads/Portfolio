# Project overview
Personal portfolio site for Eythor Konradsson (ekonrads.com): a single page
with a hero, Experience, Education and Projects, plus a tag filter and a
sticky section nav.

- Stack: Vue 3 (`<script setup>`), Vite, SCSS, Cypress for e2e tests.
  Deployed on Netlify, which builds with Node 24 (`netlify.toml`).
- `src/assets/*.json`: the site's content (jobs, educations, projects).
- `src/components/`: one component per piece of UI; `src/views/HomeView.vue`
  puts the page together.
- `src/composables/`: shared state, e.g. `useTagFilter.js`.
- `src/scss/base/`: global styles; `variables.scss` holds the colors.
- `src/assets/icons/`: SVG icons, rendered with `Icon.vue`.
- `public/`: files served as-is (favicons, manifest, link preview image).

# Commands
- `npm run dev`: dev server at http://localhost:5173.
- `npm run test:e2e`: build, then run every Cypress spec against the preview
  server. CI runs the same thing on every PR.
- One spec, after `npx vite build`:
  `npx start-server-and-test 'vite preview --port 4173 --strictPort' http://localhost:4173 'cypress run --e2e -b electron --spec cypress/e2e/<name>.cy.js --config baseUrl=http://localhost:4173'`
- `npm run test:e2e:dev`: Cypress's interactive runner against the dev server.
- `npx eslint .`: lint without fixing (`npm run lint` fixes).
- `npm run format`: format `src/` with Prettier.

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
- `.claude/settings.json` pre-approves routine commands (tests, lint, git on
  `claude/*` branches, opening PRs) and blocks pushing to `master`, force
  pushes and merging PRs. Keep commands simple (no `cd … &&` chains) so they
  match those rules.

# Pull requests
- One PR per change, each on its own branch from `master`. Only stack a PR on
  another branch when it can't be done without it, and say so at the top.
- Description sections: **Summary** (what changed and why), **Tests** (specs
  added or changed, and the `npm run test:e2e` result), and **Check by eye**
  (anything Cypress can't judge).
- If PRs will conflict with each other, say which and in which files.

# Conventional Commits
Follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification when naming branches, writing commit messages and titling pull requests.

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`,
  `ci`, `chore`, `revert`.
- Commit messages: `<type>[optional scope]: <description>`,
  e.g. `fix(hero): correct link color on hover`.
  Mark breaking changes with `!` after the type/scope or a `BREAKING CHANGE:` footer.
- Pull request titles: use the same format as a commit message,
  e.g. `feat(jobs): add bullet lists to job entries`.
- Branch names: `claude/<type>/<short-description>` in kebab-case,
  e.g. `claude/feat/project-filters`.

# Testing
The Cypress e2e suite (`cypress/e2e/`) is the source of truth for whether the
site works. Rely on it instead of checking things by hand in a browser.

- After any change to `src/`, run `npm run test:e2e` (it builds first, then
  runs every spec against the preview server) and make sure it passes before
  committing.
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

# Code style
- Prettier (`.prettierrc`) and ESLint must pass before committing.
- Components use `<script setup>` and `<style scoped>`; match the file you're
  editing.
- Class names are BEM-style: `block__element--modifier`, with the component
  name as the block (e.g. `tag-filter__button`).
- Colors come from the CSS variables in `src/scss/base/variables.scss`. Don't
  add hardcoded colors; add a variable if none fits.
- Comments explain why, not what, and are kept short.

# Accessibility
- Icon-only links and buttons need an `aria-label`; the icon itself is
  decorative (`aria-hidden="true"`).
- Links with `target="_blank"` need `rel="noopener noreferrer"`, and their
  label should say they open in a new tab.
- Text needs at least 4.5:1 contrast against its background.
- Use real `<button>` and `<a>` elements so everything works from the keyboard.

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
