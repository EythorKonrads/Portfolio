<script setup>
// PROTOTYPE (issue #140) B: "Own section". The first section of the content
// column, above Experience: a thread of questions and answers, suggested
// questions to start, and the input at the bottom.
import { ref } from 'vue';
import { useAskPrototype } from './useAskPrototype';

defineOptions({ label: 'Own section' });

const { history, loading, notice, ask } = useAskPrototype();
const question = ref('');
const SUGGESTED = [
  'Is he available?',
  'What is his strongest stack?',
  'Does he speak Danish?',
];

async function submit(text = question.value) {
  question.value = '';
  await ask(text);
}
</script>

<template>
  <section id="ask" class="ask-b">
    <div class="ask-b__hdln">
      <h2>Ask about me</h2>
      <div class="ask-b__line"></div>
    </div>
    <div class="ask-b__card">
      <div v-if="!history.length" class="ask-b__empty">
        <p>Ask anything about my work, skills or what I'm looking for.</p>
        <div class="ask-b__chips">
          <button
            v-for="s in SUGGESTED"
            :key="s"
            class="ask-b__chip"
            :disabled="loading"
            @click="submit(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>
      <ol v-else class="ask-b__thread" aria-live="polite">
        <li v-for="(entry, i) in history" :key="i" class="ask-b__pair">
          <p class="ask-b__bubble ask-b__bubble--q">{{ entry.question }}</p>
          <p
            class="ask-b__bubble ask-b__bubble--a"
            :class="{ 'ask-b__bubble--unknown': entry.kind === 'unanswered' }"
          >
            {{ entry.answer }}
          </p>
        </li>
      </ol>
      <p v-if="loading" class="ask-b__typing">Thinking…</p>
      <p v-if="notice" class="ask-b__notice" role="status">{{ notice }}</p>
      <form class="ask-b__form" @submit.prevent="submit()">
        <input
          v-model="question"
          class="ask-b__input"
          maxlength="300"
          aria-label="Your question"
          placeholder="Type a question…"
          :disabled="loading"
        />
        <span class="ask-b__count">{{ question.length }}/300</span>
        <button class="ask-b__send" :disabled="loading || !question.trim()">
          Send
        </button>
      </form>
      <p class="ask-b__note">
        Answers are written by AI from this site and may be wrong. Questions it
        can't answer may be saved to improve it.
      </p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.ask-b {
  scroll-margin-top: var(--header-height);
  margin-bottom: 2em;

  .ask-b__hdln {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .ask-b__line {
    flex: 1;
    height: 1px;
    background: var(--color-accent-soft);
  }
  .ask-b__card {
    padding: 1.25rem;
    border-radius: 12px;
    background: var(--color-card);
    box-shadow: var(--color-card-shadow) 0 2px 8px;
  }
  .ask-b__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .ask-b__chip {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-accent-soft);
    border-radius: 999px;
    background: none;
    color: var(--color-link);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .ask-b__thread {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 320px;
    overflow-y: auto;
    list-style: none;
    padding: 0;
  }
  .ask-b__pair {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .ask-b__bubble {
    max-width: 80%;
    padding: 0.5rem 0.875rem;
    border-radius: 14px;
  }
  .ask-b__bubble--q {
    align-self: flex-end;
    background: var(--color-accent);
    color: var(--color-background);
  }
  .ask-b__bubble--a {
    align-self: flex-start;
    background: var(--color-background);
  }
  .ask-b__bubble--unknown {
    font-style: italic;
  }
  .ask-b__typing,
  .ask-b__notice {
    margin-top: 0.75rem;
    color: var(--color-link);
  }
  .ask-b__form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .ask-b__input {
    flex: 1;
    min-width: 0;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--color-accent-soft);
    border-radius: 8px;
    background: var(--color-background);
    color: inherit;
    font: inherit;
  }
  .ask-b__count {
    font-size: 0.75rem;
    opacity: 0.6;
  }
  .ask-b__send {
    padding: 0.625rem 1.125rem;
    border: none;
    border-radius: 8px;
    background: var(--color-accent);
    color: var(--color-background);
    font: inherit;
    cursor: pointer;
  }
  .ask-b__send:disabled,
  .ask-b__chip:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ask-b__note {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    opacity: 0.7;
  }
}
</style>
