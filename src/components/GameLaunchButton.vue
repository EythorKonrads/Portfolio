<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { GLOW, paintEarthCanvas } from '@/game/earth';
import { useTheme } from '@/composables/useTheme';
import { useGameLaunch } from '@/composables/useGameLaunch';

// The game from the header: a small Earth that starts the same Launch as
// Mini Earth, gliding from the photo out to the game's Earth
const button = ref(null);
const globe = ref(null);
const { requestLaunch } = useGameLaunch();
// Start fetching the game's code as soon as someone shows interest
const preload = () => import('./GameScreen.vue');

const { theme } = useTheme();
// Sized in CSS; offsetWidth isn't affected by the reveal's transform
const paint = () =>
  paintEarthCanvas(globe.value, globe.value.offsetWidth || 24 * GLOW);
onMounted(paint);
watch(theme, () => nextTick(paint));
</script>

<template>
  <button
    ref="button"
    v-reveal
    type="button"
    class="game-launch-button"
    aria-label="Play Defend Earth, a game"
    title="Play Defend Earth"
    data-cy="headerPlay"
    @pointerenter="preload"
    @focus="preload"
    @click="requestLaunch(button)"
  >
    <canvas
      ref="globe"
      class="game-launch-button__globe"
      aria-hidden="true"
    ></canvas>
  </button>
</template>

<style scoped>
/* Same look as the theme toggle beside it */
.game-launch-button {
  /* The page's muted Earth, as on Mini Earth */
  --color-game-earth: var(--color-background);
  --color-game-earth-outline: var(--color-text-muted);
  --color-game-land: var(--color-gray);
  --color-game-atmosphere: var(--color-accent-soft);
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
  background-color: var(--color-accent-soft);
  transition: background-color 0.3s ease;
}
/* Keep the reveal fade from animations.scss alongside the hover transition */
.game-launch-button.reveal {
  transition:
    opacity var(--anim-duration) var(--anim-ease) var(--reveal-delay, 0ms),
    transform var(--anim-duration) var(--anim-ease) var(--reveal-delay, 0ms),
    background-color 0.3s ease;
}
@media (prefers-reduced-motion: reduce) {
  .game-launch-button.reveal {
    transition: background-color 0.3s ease;
  }
}
.game-launch-button:hover {
  background-color: var(--color-accent-soft-hover);
}
/* Match the theme toggle's mobile size */
@media screen and (max-width: 600px) {
  .game-launch-button {
    font-size: 0.875rem;
    width: calc(1lh + 0.75em);
    height: calc(1lh + 0.75em);
  }
}
.game-launch-button__globe {
  /* Room for the atmosphere glow around the globe */
  width: 1.8em;
  height: 1.8em;
}
</style>
