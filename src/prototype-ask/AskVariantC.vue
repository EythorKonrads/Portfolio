<script setup>
// PROTOTYPE (issue #140) C: "Floating button". A round button in the corner
// on every scroll position; it opens a panel (a full-screen sheet on phones)
// with the history and the input.
import { nextTick, ref } from 'vue';
import { useAskPrototype } from './useAskPrototype';

defineOptions({ label: 'Floating button' });

const { history, loading, notice, ask, clear } = useAskPrototype();
const open = ref(false);
const question = ref('');
const input = ref(null);

async function toggle() {
  open.value = !open.value;
  if (open.value) {
    await nextTick();
    input.value?.focus();
  }
}
async function submit() {
  const text = question.value;
  question.value = '';
  await ask(text);
}
</script>

<template>
  <div class="ask-c" @keydown.esc="open = false">
    <div
      v-if="open"
      class="ask-c__panel"
      role="dialog"
      aria-label="Ask about me"
    >
      <header class="ask-c__top">
        <strong>Ask about Eythor</strong>
        <button v-if="history.length" class="ask-c__link" @click="clear">
          Clear
        </button>
        <button class="ask-c__close" aria-label="Close" @click="open = false">
          ✕
        </button>
      </header>
      <div class="ask-c__body" aria-live="polite">
        <p v-if="!history.length" class="ask-c__hint">
          Hi! Ask me about Eythor's work, education, projects or skills.
        </p>
        <div v-for="(entry, i) in history" :key="i" class="ask-c__pair">
          <p class="ask-c__q">You: {{ entry.question }}</p>
          <p class="ask-c__a">{{ entry.answer }}</p>
        </div>
        <p v-if="loading" class="ask-c__hint">Thinking…</p>
        <p v-if="notice" class="ask-c__notice" role="status">{{ notice }}</p>
      </div>
      <form class="ask-c__form" @submit.prevent="submit">
        <textarea
          ref="input"
          v-model="question"
          class="ask-c__input"
          rows="2"
          maxlength="300"
          aria-label="Your question"
          placeholder="Your question…"
          :disabled="loading"
          @keydown.enter.exact.prevent="submit"
        ></textarea>
        <button class="ask-c__send" :disabled="loading || !question.trim()">
          Ask
        </button>
      </form>
      <p class="ask-c__note">
        AI answers from this site. Unanswered questions may be saved.
      </p>
    </div>
    <button
      class="ask-c__fab"
      :aria-expanded="open"
      aria-label="Ask about me"
      @click="toggle"
    >
      {{ open ? '✕' : '?' }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.ask-c {
  position: fixed;
  right: 1.5rem;
  bottom: 5rem;
  z-index: 50;

  .ask-c__fab {
    display: block;
    margin-left: auto;
    width: 56px;
    height: 56px;
    border: none;
    border-radius: 50%;
    background: var(--color-accent);
    color: var(--color-background);
    font-size: 1.5rem;
    box-shadow: var(--color-box-shadow) 0 4px 12px;
    cursor: pointer;
  }
  .ask-c__panel {
    display: flex;
    flex-direction: column;
    width: 360px;
    max-height: 70vh;
    margin-bottom: 0.75rem;
    border-radius: 14px;
    background: var(--color-card);
    box-shadow: var(--color-box-shadow) 0 8px 24px;
    overflow: hidden;
  }
  .ask-c__top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--color-accent-soft);
  }
  .ask-c__top strong {
    flex: 1;
  }
  .ask-c__link,
  .ask-c__close {
    border: none;
    background: none;
    color: var(--color-link);
    font: inherit;
    cursor: pointer;
  }
  .ask-c__body {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    font-size: 0.875rem;
  }
  .ask-c__pair + .ask-c__pair {
    margin-top: 0.875rem;
  }
  .ask-c__q {
    font-weight: 600;
  }
  .ask-c__a {
    margin-top: 0.25rem;
  }
  .ask-c__hint {
    opacity: 0.7;
  }
  .ask-c__notice {
    margin-top: 0.75rem;
    color: var(--color-link);
  }
  .ask-c__form {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem 0;
  }
  .ask-c__input {
    flex: 1;
    resize: none;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-accent-soft);
    border-radius: 8px;
    background: var(--color-background);
    color: inherit;
    font: inherit;
  }
  .ask-c__send {
    padding: 0 1rem;
    border: none;
    border-radius: 8px;
    background: var(--color-accent);
    color: var(--color-background);
    font: inherit;
    cursor: pointer;
  }
  .ask-c__send:disabled {
    opacity: 0.5;
  }
  .ask-c__note {
    padding: 0.5rem 1rem 0.875rem;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  @media screen and (max-width: 600px) {
    right: 1rem;
    bottom: 4.5rem;

    .ask-c__panel {
      position: fixed;
      inset: 0;
      width: auto;
      max-height: none;
      margin: 0;
      border-radius: 0;
    }
  }
}
</style>
