# Git rules
- This repo's main branch is `master`.
- Never commit to, merge into, or push to `master`.
- Before making any changes, check the current branch. If it is `master`,
  create a new branch named `claude/<type>/<short-description>` and switch to it.
- Leave merging into `master` to me (via pull request).

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
