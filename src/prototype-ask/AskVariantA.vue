<script setup>
// PROTOTYPE (issue #140) A: "In the Hero". A compact box under the bio;
// only the latest answer shows, earlier ones fold away.
import { computed, ref } from 'vue';
import { useAskPrototype } from './useAskPrototype';

defineOptions({ label: 'In the Hero' });

const { history, loading, notice, ask } = useAskPrototype();
const question = ref('');
const latest = computed(() => history.value.at(-1));
const earlier = computed(() => history.value.slice(0, -1).reverse());

async function submit() {
  await ask(question.value);
  question.value = '';
}
</script>

<template>
  <div class="ask-a">
    <form class="ask-a__form" @submit.prevent="submit">
      <label class="ask-a__label" for="ask-a-input">Ask about me</label>
      <div class="ask-a__row">
        <input
          id="ask-a-input"
          v-model="question"
          class="ask-a__input"
          maxlength="300"
          placeholder="e.g. Is he open to full-stack roles?"
          :disabled="loading"
        />
        <button class="ask-a__send" :disabled="loading || !question.trim()">
          {{ loading ? '…' : 'Ask' }}
        </button>
      </div>
    </form>
    <p v-if="notice" class="ask-a__notice" role="status">{{ notice }}</p>
    <div v-if="latest" class="ask-a__latest" aria-live="polite">
      <p class="ask-a__q">{{ latest.question }}</p>
      <p class="ask-a__answer">{{ latest.answer }}</p>
    </div>
    <details v-if="earlier.length" class="ask-a__earlier">
      <summary>Earlier questions ({{ earlier.length }})</summary>
      <div v-for="(entry, i) in earlier" :key="i" class="ask-a__item">
        <p class="ask-a__q">{{ entry.question }}</p>
        <p class="ask-a__answer">{{ entry.answer }}</p>
      </div>
    </details>
    <p class="ask-a__note">
      Answers are written by AI from this site. Questions it can't answer may
      be saved to improve it.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.ask-a {
  width: 100%;
  margin-top: 1.5rem;
  font-size: 0.875rem;

  .ask-a__label {
    display: block;
    margin-bottom: 0.375rem;
    color: var(--color-hdln);
    font-weight: 600;
  }
  .ask-a__row {
    display: flex;
    gap: 0.375rem;
  }
  .ask-a__input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-accent-soft);
    border-radius: 999px;
    background: var(--color-background);
    color: inherit;
    font: inherit;
  }
  .ask-a__send {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 999px;
    background: var(--color-accent);
    color: var(--color-background);
    font: inherit;
    cursor: pointer;
  }
  .ask-a__send:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ask-a__latest,
  .ask-a__item {
    margin-top: 0.75rem;
  }
  .ask-a__q {
    font-weight: 600;
  }
  .ask-a__answer {
    margin-top: 0.25rem;
  }
  .ask-a__notice {
    margin-top: 0.5rem;
    color: var(--color-link);
  }
  .ask-a__earlier {
    margin-top: 0.75rem;
  }
  .ask-a__earlier summary {
    cursor: pointer;
    color: var(--color-link);
  }
  .ask-a__note {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    opacity: 0.7;
  }
}
</style>
