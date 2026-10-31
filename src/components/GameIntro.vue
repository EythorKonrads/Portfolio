<script setup>
import { onMounted, ref } from 'vue';

// Touch screens steer with a finger, so they get different instructions
defineProps({
  touch: { type: Boolean, default: false },
});
defineEmits(['start']);

const startButton = ref(null);
// Enter or Space starts straight away
onMounted(() => startButton.value?.focus());
</script>

<template>
  <div class="game-intro game-panel" data-cy="gameIntro">
    <h2 class="game-intro__title">Defend Earth</h2>
    <p class="game-intro__goal">
      Asteroids are heading for Earth. Shoot them before they hit, and keep as
      many of its 8 billion people alive as you can.
    </p>

    <div v-if="touch" class="game-intro__touch" data-cy="gameIntroTouch">
      <p>
        <strong>Touch and hold</strong> to fly towards your finger. The Ship
        fires by itself.
      </p>
    </div>
    <dl v-else class="game-intro__controls" data-cy="gameIntroKeys">
      <div class="game-intro__control">
        <dt class="game-intro__keys game-intro__keys--arrows">
          <kbd class="game-intro__key game-intro__key--up">↑</kbd>
          <kbd class="game-intro__key game-intro__key--left">←</kbd>
          <kbd class="game-intro__key game-intro__key--right">→</kbd>
        </dt>
        <dd class="game-intro__action">
          <span><strong>←&nbsp;→</strong> turn the Ship</span>
          <span><strong>↑</strong> fire the engine</span>
          <span class="game-intro__alt">or A, D and W</span>
        </dd>
      </div>
      <div class="game-intro__control">
        <dt class="game-intro__keys">
          <kbd class="game-intro__key game-intro__key--space">Space</kbd>
        </dt>
        <dd class="game-intro__action">Shoot</dd>
      </div>
      <div class="game-intro__control">
        <dt class="game-intro__keys">
          <kbd class="game-intro__key">Esc</kbd>
        </dt>
        <dd class="game-intro__action">Pause</dd>
      </div>
    </dl>

    <button
      ref="startButton"
      type="button"
      class="game-button"
      data-cy="gameIntroStart"
      @click="$emit('start')"
    >
      Start
    </button>
  </div>
</template>

<style lang="scss" scoped>
.game-intro {
  width: min(100%, 26rem);
  text-align: center;
}
.game-intro__title {
  margin: 0 0 0.5rem;
  font-size: 1.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.game-intro__goal {
  margin: 0 0 1.25rem;
  opacity: 0.85;
}
.game-intro__touch {
  margin-bottom: 1.25rem;

  p {
    margin: 0;
  }
}
.game-intro__controls {
  display: grid;
  gap: 1rem;
  margin: 0 0 1.25rem;
}
.game-intro__control {
  display: grid;
  grid-template-columns: 8.5rem 1fr;
  align-items: center;
  gap: 1rem;
  text-align: left;
}
.game-intro__keys {
  display: flex;
  justify-content: center;
}
/* An upside-down T, like the arrow keys on a keyboard */
.game-intro__keys--arrows {
  display: grid;
  grid-template-columns: repeat(3, 2.5rem);
  grid-template-areas:
    '. up .'
    'left . right';
  gap: 0.3rem;
}
.game-intro__key {
  display: grid;
  place-items: center;
  min-width: 2.5rem;
  height: 2.5rem;
  box-sizing: border-box;
  padding: 0 0.6rem;
  border: 1px solid var(--color-game-panel-border);
  border-bottom-width: 3px;
  border-radius: 0.4rem;
  background: var(--color-game-key);
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
}
.game-intro__key--up {
  grid-area: up;
}
.game-intro__key--left {
  grid-area: left;
}
.game-intro__key--right {
  grid-area: right;
}
.game-intro__key--space {
  width: 8rem;
}
.game-intro__action {
  display: grid;
  margin: 0;
}
.game-intro__alt {
  font-size: 0.85em;
  opacity: 0.65;
}
</style>
