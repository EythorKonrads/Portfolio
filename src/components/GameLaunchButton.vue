<script setup>
import { ref } from 'vue';
import { useGameLaunch } from '@/composables/useGameLaunch';

// The game from the header: starts the same Launch as Mini Earth, gliding
// from the photo out to the game's Earth. Looks like the section links
// beside it (they pass their class in), but it's an action, so a button.
const button = ref(null);
const { requestLaunch } = useGameLaunch();
// Start fetching the game's code as soon as someone shows interest
const preload = () => import('./GameScreen.vue');
</script>

<template>
  <button
    ref="button"
    type="button"
    class="game-launch-button"
    data-cy="headerPlay"
    @pointerenter="preload"
    @focus="preload"
    @click="requestLaunch(button)"
  >
    Mini-game
  </button>
</template>

<style scoped>
/* Only undoes the button's own look; the link look comes from its class */
.game-launch-button {
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;
}
</style>
