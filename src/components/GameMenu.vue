<script setup>
defineEmits(['resume', 'scoreboard', 'end']);
</script>

<template>
  <div class="game-menu game-panel" data-cy="gameMenu">
    <h2 class="game-panel__title">Paused</h2>
    <div class="game-menu__actions">
      <button
        type="button"
        class="game-button"
        data-cy="menuResume"
        @click="$emit('resume')"
      >
        Resume
      </button>
      <button
        type="button"
        class="game-button game-button--quiet"
        data-cy="menuScoreboard"
        @click="$emit('scoreboard')"
      >
        Scoreboard
      </button>
      <button
        type="button"
        class="game-button game-button--quiet"
        data-cy="menuEnd"
        @click="$emit('end')"
      >
        End game
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game-menu__actions {
  display: grid;
  gap: 0.5rem;
}
</style>
