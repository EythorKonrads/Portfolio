<script setup>
import { computed, onMounted, ref } from 'vue';
import { qualifies } from '@/game/scoreboard';
import { fetchBoard, submitScore } from '@/game/scoreboardApi';

const props = defineProps({
  score: { type: Number, required: true },
  wave: { type: Number, required: true },
  // Seconds played, which the scoreboard checks against the Wave
  time: { type: Number, default: 0 },
});
defineEmits(['again', 'close']);

// The shared top 10: 'loading', 'ready' or 'offline'
const state = ref('loading');
const board = ref([]);
const rank = ref(0);
const initials = ref('');
const isSaving = ref(false);
const saveFailed = ref(false);

onMounted(async () => {
  const data = await fetchBoard();
  if (!data) {
    state.value = 'offline';
    return;
  }
  board.value = data.board;
  state.value = 'ready';
});

const canEnter = computed(
  () =>
    state.value === 'ready' &&
    !rank.value &&
    qualifies(board.value, props.score)
);

// Arcade style: A–Z only, always capitals
function onInitials(event) {
  initials.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, '');
  event.target.value = initials.value;
}

async function save() {
  if (initials.value.length !== 3 || isSaving.value) return;
  isSaving.value = true;
  saveFailed.value = false;
  const data = await submitScore({
    initials: initials.value,
    score: props.score,
    wave: props.wave,
    time: props.time,
  });
  isSaving.value = false;
  if (!data?.rank) {
    saveFailed.value = true;
    return;
  }
  board.value = data.board;
  rank.value = data.rank;
}
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

    <section class="game-end__board" data-cy="scoreboard">
      <h3 class="game-end__board-title">Top 10</h3>
      <p v-if="state === 'loading'" class="game-end__note">Loading…</p>
      <p
        v-else-if="state === 'offline'"
        class="game-end__note"
        data-cy="scoreboardOffline"
      >
        The scoreboard isn't available right now.
      </p>
      <template v-else>
        <form
          v-if="canEnter"
          class="game-end__entry"
          data-cy="scoreEntry"
          @submit.prevent="save"
        >
          <label for="game-end-initials" class="game-end__entry-label">
            You made the top 10! Your initials:
          </label>
          <div class="game-end__entry-row">
            <input
              id="game-end-initials"
              class="game-end__initials"
              :value="initials"
              maxlength="3"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              data-cy="scoreInitials"
              @input="onInitials"
            />
            <button
              type="submit"
              class="game-button game-button--small"
              :disabled="initials.length !== 3 || isSaving"
              data-cy="scoreSave"
            >
              Save
            </button>
          </div>
          <p v-if="saveFailed" class="game-end__note" data-cy="scoreSaveFailed">
            Couldn't save your score. Try again?
          </p>
        </form>
        <p v-else-if="!rank" class="game-end__note" data-cy="scoreWhyNot">
          {{
            score > 0
              ? "Your Score didn't make the top 10 this time."
              : 'Destroy an Asteroid to get a Score onto the board.'
          }}
        </p>
        <ol v-if="board.length" class="game-end__list" data-cy="scoreList">
          <li
            v-for="(entry, i) in board"
            :key="`${entry.date}-${entry.initials}`"
            class="game-end__row"
            :class="{ 'game-end__row--you': i + 1 === rank }"
            data-cy="scoreRow"
          >
            <span class="game-end__place">{{ i + 1 }}</span>
            <span class="game-end__who">{{ entry.initials }}</span>
            <span class="game-end__points">{{
              entry.score.toLocaleString()
            }}</span>
          </li>
        </ol>
        <p v-else class="game-end__note">No scores yet.</p>
      </template>
    </section>

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
.game-end__board {
  margin: 0 0 1.25rem;
}
.game-end__board-title {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  opacity: 0.75;
}
.game-end__note {
  margin: 0.25rem 0;
  font-size: 0.9em;
  text-align: center;
  opacity: 0.75;
}
.game-end__entry {
  margin: 0 0 0.75rem;
  text-align: center;
}
.game-end__entry-label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
}
.game-end__entry-row {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
/* Three big letters, like an arcade cabinet */
.game-end__initials {
  width: 5.5em;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--color-game-panel-border);
  border-radius: 0.4rem;
  background: var(--color-game-key);
  color: var(--color-game-text);
  font-family: Orbitron, var(--font-body);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-align: center;
  text-transform: uppercase;
}
.game-end__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.game-end__row {
  display: grid;
  grid-template-columns: 2rem 1fr auto;
  gap: 0.5rem;
  padding: 0.15rem 0.6rem;
  border-radius: 0.3rem;
  font-variant-numeric: tabular-nums;
}
.game-end__row--you {
  background: var(--color-game-key);
  color: var(--color-game-button);
  font-weight: 700;
}
.game-end__place {
  opacity: 0.6;
}
.game-end__who {
  font-family: Orbitron, var(--font-body);
  letter-spacing: 0.15em;
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
