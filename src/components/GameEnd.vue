<script setup>
defineProps({
  score: { type: Number, required: true },
  wave: { type: Number, required: true },
});
defineEmits(['again', 'close']);
</script>

<template>
  <div class="game-end game-panel" data-cy="gameEnd">
    <h2 class="game-panel__title">Earth has fallen</h2>
    <p class="game-end__score">
      Score <strong data-cy="gameEndScore">{{ score.toLocaleString() }}</strong>
    </p>
    <p class="game-end__wave">You held out until Wave {{ wave }}.</p>
    <div class="game-end__actions">
      <a
        href="mailto:kh.krimper@gmail.com"
        class="game-button"
        data-cy="gameEndTalk"
      >
        Let's talk
      </a>
      <button
        type="button"
        class="game-button game-button--quiet"
        data-cy="gameEndAgain"
        @click="$emit('again')"
      >
        Play again
      </button>
    </div>
    <button
      type="button"
      class="game-end__close"
      data-cy="gameEndClose"
      @click="$emit('close')"
    >
      Back to the page
    </button>
  </div>
</template>

<style lang="scss" scoped>
.game-end__score {
  margin: 0;
  font-size: 1.4rem;
}
.game-end__wave {
  margin: 0.25rem 0 1.25rem;
  opacity: 0.75;
}
.game-end__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.game-end__close {
  display: block;
  margin: 1rem auto 0;
  padding: 0.25rem;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  opacity: 0.75;
  cursor: pointer;
}
</style>
