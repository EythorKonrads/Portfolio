<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  // Where the game is, filled into a bug report
  wave: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
});
defineEmits(['resume', 'scoreboard', 'end']);

// A new GitHub issue, started with the game's state and the browser, which
// are the first things needed to look into a bug
const bugReportUrl = computed(() => {
  const body = [
    '**What happened?**',
    '',
    '',
    '**What did you expect to happen?**',
    '',
    '',
    '---',
    `Wave ${props.wave}, Score ${props.score}`,
    `Browser: ${navigator.userAgent}`,
  ].join('\n');
  const params = new URLSearchParams({
    title: 'Game bug: ',
    labels: 'needs-triage',
    body,
  });
  return `https://github.com/EythorKonrads/Portfolio/issues/new?${params}`;
});
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
      <a
        :href="bugReportUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="game-button game-button--quiet game-menu__link"
        aria-label="Report a bug on GitHub (opens in a new tab)"
        data-cy="menuBugReport"
      >
        Report a bug
        <Icon name="external-link" :icon="false" class="game-menu__link-icon" />
      </a>
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
.game-menu__link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.game-menu__link-icon {
  width: 0.9em;
  height: 0.9em;
}
</style>
