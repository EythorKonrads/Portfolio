// The site's color theme, shared by every component that uses it.
// index.html applies the saved choice before the first paint; this keeps
// <html data-theme>, localStorage and the browser bar color in sync.
import { ref, watch } from 'vue';

const STORAGE_KEY = 'theme';

const theme = ref(
  document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark'
);

function applyTheme(value) {
  const root = document.documentElement;
  root.setAttribute('data-theme', value);
  // Color the mobile browser bar like the page behind it
  const background = getComputedStyle(root)
    .getPropertyValue('--color-background')
    .trim();
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', background);
}

applyTheme(theme.value);

watch(theme, (value) => {
  applyTheme(value);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts this visit
  }
});

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

export function useTheme() {
  return { theme, toggleTheme };
}
