<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';
import { useTheme } from '@/composables/useTheme';

const { theme, toggleTheme } = useTheme();
const nextTheme = computed(() => (theme.value === 'dark' ? 'light' : 'dark'));
// Shows what a click switches to: the sun in dark mode, the moon in light
const iconName = computed(() => (theme.value === 'dark' ? 'sun' : 'moon'));
</script>

<template>
  <button
    v-reveal
    type="button"
    class="theme-toggle"
    data-cy="themeToggle"
    :data-theme="theme"
    :aria-label="`Switch to ${nextTheme} theme`"
    :title="`Switch to ${nextTheme} theme`"
    @click="toggleTheme"
  >
    <!-- Icon loads its SVG once, so key it to swap icons -->
    <Icon
      :key="iconName"
      :name="iconName"
      :icon="false"
      class="theme-toggle__icon"
    />
  </button>
</template>

<style scoped>
/* Same look as the filter button beside it, as a circle */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.6em;
  height: 2.6em;
  padding: 0;
  border: 0;
  border-radius: 50%;
  font: inherit;
  cursor: pointer;
  color: var(--color-accent);
  background-color: var(--color-accent-soft);
  transition: background-color 0.3s ease;
}
/* Keep the reveal fade from animations.scss alongside the hover transition */
.theme-toggle.reveal {
  transition:
    opacity var(--anim-duration) var(--anim-ease) var(--reveal-delay, 0ms),
    transform var(--anim-duration) var(--anim-ease) var(--reveal-delay, 0ms),
    background-color 0.3s ease;
}
@media (prefers-reduced-motion: reduce) {
  .theme-toggle.reveal {
    transition: background-color 0.3s ease;
  }
}
.theme-toggle:hover {
  background-color: var(--color-accent-soft-hover);
}
@media screen and (max-width: 360px) {
  .theme-toggle {
    width: 2.25em;
    height: 2.25em;
  }
}
.theme-toggle__icon {
  width: 1.15em;
  height: 1.15em;
}
</style>
