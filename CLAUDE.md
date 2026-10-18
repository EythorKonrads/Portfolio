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
