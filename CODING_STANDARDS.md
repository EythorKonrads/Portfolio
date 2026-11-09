# Coding standards

Rules for writing and reviewing changed code.

## Tests

- A deleted feature's tests are deleted with it.

## Code style

- Components use `<script setup>` and `<style scoped>`; match the file you're
  editing.
- Class names are BEM-style: `block__element--modifier`, with the component
  name as the block (e.g. `tag-filter__button`).
- Colors come from the CSS variables in `src/scss/base/variables.scss`. Don't
  add hardcoded colors; add a variable if none fits.
- Comments explain why, not what, and are kept short.

## Accessibility

- Icon-only links and buttons need an `aria-label`; the icon itself is
  decorative (`aria-hidden="true"`).
- Links with `target="_blank"` need `rel="noopener noreferrer"`, and their
  label should say they open in a new tab.
- Text needs at least 4.5:1 contrast against its background.
- Use real `<button>` and `<a>` elements so everything works from the keyboard.
- The game is exempt from these rules inside its own screen; the button that
  starts it is not (`docs/adr/0002-game-skips-accessibility.md`).
