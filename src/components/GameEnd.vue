<script setup>
defineProps({
  score: { type: Number, required: true },
  wave: { type: Number, required: true },
});
defineEmits(['again', 'close']);
</script>

<!-- Laid out like the Shop: a centred title, then cards, then the buttons -->
<template>
  <div class="game-end game-panel" data-cy="gameEnd">
    <h2 class="game-panel__title game-end__title">Earth has fallen</h2>
    <ul class="game-end__stats">
      <li class="game-end__stat game-end__stat--head">
        <span class="game-end__label">Score</span>
        <strong class="game-end__value" data-cy="gameEndScore">{{
          score.toLocaleString()
        }}</strong>
      </li>
      <li class="game-end__stat">
        <span class="game-end__label">Reached</span>
        <strong class="game-end__value">Wave {{ wave }}</strong>
      </li>
    </ul>
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
/* Sizes match the Shop's (GameShop.vue), so the two read as one set */
.game-end {
  width: min(100%, 23rem);
}
.game-end__title {
  text-align: center;
}
.game-end__stats {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
  padding: 0;
  list-style: none;
}
.game-end__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.75rem 0.5rem;
  border: 1px solid var(--color-game-panel-border);
  border-radius: 0.5rem;
}
.game-end__stat--head {
  background: var(--color-game-key);
}
.game-end__label {
  opacity: 0.6;
  font-size: 0.8em;
  line-height: 1;
}
.game-end__value {
  font-size: 1.2rem;
  line-height: 1.3;
  white-space: nowrap;
}
.game-end__stat--head .game-end__value {
  font-size: 1.6rem;
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
