// Fades elements in the first time they scroll into view.
// Usage: <div v-reveal> — styles live in scss/base/animations.scss

const STAGGER_MS = 70;
const MAX_STAGGER_MS = 350;
// Let the hero entrance start before the first batch on page load
const INITIAL_DELAY_MS = 250;

let observer;
let isFirstBatch = true;

function reveal(entries) {
  const visible = entries.filter((entry) => entry.isIntersecting);
  const offset = isFirstBatch ? INITIAL_DELAY_MS : 0;
  isFirstBatch = false;

  visible.forEach((entry, index) => {
    const delay = offset + Math.min(index * STAGGER_MS, MAX_STAGGER_MS);
    entry.target.style.setProperty('--reveal-delay', `${delay}ms`);
    entry.target.classList.add('is-revealed');
    observer.unobserve(entry.target);
  });
}

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(reveal, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.1,
    });
  }
  return observer;
}

export default {
  mounted(el) {
    if (!('IntersectionObserver' in window)) return;
    el.classList.add('reveal');
    getObserver().observe(el);
  },
  unmounted(el) {
    observer?.unobserve(el);
  },
};
