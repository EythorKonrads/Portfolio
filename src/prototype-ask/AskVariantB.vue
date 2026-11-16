<script setup>
// PROTOTYPE (issue #140) B: "Own section". The first section of the content
// column, above Experience: a thread of questions and answers, suggested
// questions to start, and the input at the bottom.
import { nextTick, ref, watch } from 'vue';
import { useAskPrototype } from './useAskPrototype';

const { history, loading, notice, ask, clear } = useAskPrototype();
const question = ref('');
const input = ref(null);
const thread = ref(null);
const showNewPill = ref(false);
const SUGGESTED = [
  'What is his strongest stack?',
  'What kind of role is he looking for?',
  'What has he built recently?',
];

// Within this many px of the bottom counts as "at the bottom"
const BOTTOM_SLACK = 24;
const atBottom = () => {
  const el = thread.value;
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLACK;
};
function scrollToBottom() {
  const el = thread.value;
  if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  showNewPill.value = false;
}
function onThreadScroll() {
  if (atBottom()) showNewPill.value = false;
}

// A new answer: follow it if the visitor is at the bottom, otherwise tell
// them there's something new below
watch(
  () => history.value.length,
  async () => {
    const follow = atBottom();
    await nextTick();
    if (follow) scrollToBottom();
    else showNewPill.value = true;
  }
);

async function submit(text = question.value) {
  if (!text.trim() || loading.value) return;
  question.value = '';
  input.value?.focus();
  const asking = ask(text);
  // Their own question always scrolls into view, with the "Thinking…" line
  await nextTick();
  scrollToBottom();
  await asking;
  input.value?.focus();
}
function onEnter(event) {
  // Enter sends; Shift+Enter is a new line
  if (event.shiftKey) return;
  event.preventDefault();
  submit();
}
</script>

<template>
  <section id="ask" class="ask-b" data-cy="ask">
    <div class="ask-b__hdln">
      <h2>Ask about me</h2>
      <div class="ask-b__line"></div>
    </div>

    <div class="ask-b__box">
      <div v-if="!history.length && !loading" class="ask-b__empty">
        <p>Ask anything about my work, skills or what I'm looking for.</p>
        <div class="ask-b__chips">
          <button
            v-for="s in SUGGESTED"
            :key="s"
            type="button"
            class="ask-b__chip"
            @click="submit(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div v-else class="ask-b__thread-wrap">
        <button
          v-if="history.length"
          type="button"
          class="ask-b__clear"
          @click="clear"
        >
          Clear
        </button>
        <ol
          ref="thread"
          class="ask-b__thread"
          aria-live="polite"
          @scroll="onThreadScroll"
        >
          <li v-for="(entry, i) in history" :key="i" class="ask-b__pair">
            <p class="ask-b__bubble ask-b__bubble--q">{{ entry.question }}</p>
            <p
              class="ask-b__bubble ask-b__bubble--a"
              :class="{ 'ask-b__bubble--unknown': entry.kind === 'unanswered' }"
            >
              {{ entry.answer }}
            </p>
          </li>
          <li v-if="loading" class="ask-b__pair">
            <p class="ask-b__bubble ask-b__bubble--a ask-b__typing">
              Thinking…
            </p>
          </li>
        </ol>
        <button
          v-if="showNewPill"
          type="button"
          class="ask-b__new"
          @click="scrollToBottom"
        >
          New message ↓
        </button>
      </div>

      <p v-if="notice" class="ask-b__notice" role="status">{{ notice }}</p>

      <form class="ask-b__form" @submit.prevent="submit()">
        <textarea
          ref="input"
          v-model="question"
          class="ask-b__input"
          rows="2"
          maxlength="300"
          aria-label="Your question"
          placeholder="Type a question…"
          @keydown.enter="onEnter"
        ></textarea>
        <button
          class="ask-b__send"
          :disabled="loading || !question.trim()"
          aria-label="Send"
        >
          Send
        </button>
      </form>
      <div class="ask-b__meta">
        <span class="ask-b__count">{{ question.length }}/300</span>
        <p class="ask-b__note">
          AI-generated from this site's content, so it can get things wrong.
          Unanswered questions may be saved.
          <a href="#privacy">Privacy</a>
        </p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/* Same frame as Experience and Education */
.ask-b {
  padding: 0 2rem;
  margin-bottom: 2em;
  scroll-margin-top: var(--header-height);
}
.ask-b__hdln {
  font-size: 1.75rem;
  font-weight: 600;
  width: auto;

  h2 {
    width: auto;
    display: inline-block;
  }
}
.ask-b__line {
  height: 1px;
  width: 100%;
  background-color: var(--color-rule);
}
.ask-b__box {
  margin-top: 1rem;
}
.ask-b__empty p {
  margin: 0;
  color: var(--color-text-muted);
}
.ask-b__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.ask-b__chip {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-accent-soft-hover);
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-chip-text);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.ask-b__chip:hover {
  background: var(--color-accent-soft-hover);
}
.ask-b__thread-wrap {
  position: relative;
}
.ask-b__clear {
  position: absolute;
  top: -2.25rem;
  right: 0;
  border: none;
  background: none;
  color: var(--color-link);
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}
.ask-b__clear:hover {
  color: var(--color-link-hover);
}
.ask-b__thread {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 320px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  overscroll-behavior: contain;
}
.ask-b__pair {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.ask-b__bubble {
  max-width: 80%;
  margin: 0;
  padding: 0.5rem 0.875rem;
  border-radius: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
/* The visitor's own question: the soft accent, so Send stays the strong one */
.ask-b__bubble--q {
  align-self: flex-end;
  background: var(--color-accent-soft-hover);
  color: var(--color-hdln);
}
.ask-b__bubble--a {
  align-self: flex-start;
  background: var(--color-card);
}
.ask-b__bubble--unknown {
  font-style: italic;
}
.ask-b__typing {
  color: var(--color-text-muted);
}
.ask-b__new {
  position: absolute;
  left: 50%;
  bottom: 0.5rem;
  transform: translateX(-50%);
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-background);
  font: inherit;
  font-size: 0.8125rem;
  box-shadow: var(--color-box-shadow) 0 2px 8px;
  cursor: pointer;
}
.ask-b__notice {
  margin: 0.75rem 0 0;
  color: var(--color-link);
}
.ask-b__form {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  margin-top: 1rem;
}
.ask-b__input {
  flex: 1;
  min-width: 0;
  resize: vertical;
  min-height: 3.25rem;
  max-height: 10rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-accent-soft-hover);
  border-radius: 8px;
  background: var(--color-card);
  color: inherit;
  font: inherit;
  line-height: 1.4;
}
.ask-b__input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
}
.ask-b__send {
  align-self: flex-end;
  padding: 0.625rem 1.125rem;
  border: none;
  border-radius: 8px;
  background: var(--color-accent);
  color: var(--color-background);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    filter 0.2s ease,
    transform 0.1s ease;
}
.ask-b__send:hover:not(:disabled) {
  filter: brightness(1.15);
}
.ask-b__send:active:not(:disabled) {
  transform: translateY(1px);
}
.ask-b__send:disabled {
  opacity: 0.5;
  cursor: default;
}
.ask-b__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin-top: 0.25rem;
}
.ask-b__count {
  flex-shrink: 0;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}
.ask-b__note {
  margin: 0;
  max-width: 28rem;
  text-align: right;
  font-size: 0.6875rem;
  line-height: 1.4;
  color: var(--color-text-muted);
}
.ask-b__note a {
  color: inherit;
  text-decoration: underline;
}

@media screen and (max-width: 600px) {
  .ask-b {
    padding: 0 1rem;
  }
  .ask-b__hdln {
    font-size: 1.5rem;
  }
  .ask-b__thread {
    max-height: 55vh;
  }
  .ask-b__bubble {
    max-width: 90%;
  }
  .ask-b__chip {
    font-size: 0.8125rem;
  }
  /* Stacked: the textarea gets the full width, Send sits under it */
  .ask-b__form {
    flex-direction: column;
  }
  .ask-b__send {
    align-self: stretch;
  }
  .ask-b__meta {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
  }
}
</style>
