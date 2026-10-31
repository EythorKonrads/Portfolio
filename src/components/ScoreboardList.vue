<script setup>
// The Scoreboard's rows, shared by the end screen and the Menu's Scoreboard
defineProps({
  board: { type: Array, required: true },
  // Place of the player's own entry to highlight (1 is the top), or 0
  rank: { type: Number, default: 0 },
});
</script>

<template>
  <ol v-if="board.length" class="scoreboard-list" data-cy="scoreList">
    <li
      v-for="(entry, i) in board"
      :key="`${entry.date}-${entry.initials}`"
      class="scoreboard-list__row"
      :class="{ 'scoreboard-list__row--you': i + 1 === rank }"
      data-cy="scoreRow"
    >
      <span class="scoreboard-list__place">{{ i + 1 }}</span>
      <span class="scoreboard-list__who">{{ entry.initials }}</span>
      <span>{{ entry.score.toLocaleString() }}</span>
    </li>
  </ol>
  <p v-else class="scoreboard-list__empty">No scores yet.</p>
</template>

<style lang="scss" scoped>
.scoreboard-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.scoreboard-list__row {
  display: grid;
  grid-template-columns: 2rem 1fr auto;
  gap: 0.5rem;
  padding: 0.15rem 0.6rem;
  border-radius: 0.3rem;
  font-variant-numeric: tabular-nums;
}
.scoreboard-list__row--you {
  background: var(--color-game-key);
  color: var(--color-game-button);
  font-weight: 700;
}
.scoreboard-list__place {
  opacity: 0.6;
}
.scoreboard-list__who {
  font-family: Orbitron, var(--font-body);
  letter-spacing: 0.15em;
}
.scoreboard-list__empty {
  margin: 0.25rem 0;
  font-size: 0.9em;
  text-align: center;
  opacity: 0.75;
}
</style>
