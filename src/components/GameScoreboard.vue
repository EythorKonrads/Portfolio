<script setup>
import { onMounted, ref } from 'vue';
import { fetchBoard } from '@/game/scoreboardApi';
import ScoreboardList from './ScoreboardList.vue';

// The Scoreboard on its own, opened from the Menu while the game is paused
defineEmits(['back']);

// 'loading', 'ready' or 'offline'
const state = ref('loading');
const board = ref([]);
const backButton = ref(null);

onMounted(async () => {
  backButton.value?.focus();
  const data = await fetchBoard();
  if (!data) {
    state.value = 'offline';
    return;
  }
  board.value = data.board;
  state.value = 'ready';
});
</script>

<template>
  <div class="game-scoreboard game-panel" data-cy="gameScoreboard">
    <h2 class="game-panel__title game-scoreboard__title">Top 10</h2>
    <p v-if="state === 'loading'" class="game-scoreboard__note">Loading…</p>
    <p
      v-else-if="state === 'offline'"
      class="game-scoreboard__note"
      data-cy="scoreboardOffline"
    >
      The scoreboard isn't available right now.
    </p>
    <ScoreboardList v-else :board="board" />
    <button
      ref="backButton"
      type="button"
      class="game-button game-button--quiet game-scoreboard__back"
      data-cy="scoreboardBack"
      @click="$emit('back')"
    >
      Back
    </button>
  </div>
</template>

<style lang="scss" scoped>
/* The same width as the Shop and the end screen */
.game-scoreboard {
  width: min(100%, 23rem);
}
.game-scoreboard__title {
  text-align: center;
}
.game-scoreboard__note {
  margin: 0.25rem 0;
  font-size: 0.9em;
  text-align: center;
  opacity: 0.75;
}
.game-scoreboard__back {
  margin-top: 1.25rem;
}
</style>
