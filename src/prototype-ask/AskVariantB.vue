<script setup>
// PROTOTYPE (issue #140) B: "Own section". The first section of the content
// column, above Experience: a thread of questions and answers, suggested
// questions to start, and the input at the bottom.
import { nextTick, ref, watch } from 'vue';
import { useAskPrototype } from './useAskPrototype';

const { history, loading, notice, limit, limitMessage, palette, ask, clear } =
  useAskPrototype();
const question = ref('');
const input = ref(null);
const thread = ref(null);
const showNewPill = ref(false);
// Each one answerable from the site's content or the About file, so a
// suggestion never ends in "I don't know". Three are picked at random.
const SUGGESTION_POOL = [
  'What is his strongest stack?',
  'What kind of role is he looking for?',
  'What has he built recently?',
  'Is he open to full-stack roles?',
  'Can he work part-time?',
  'Where is he based?',
  'Does he work remotely?',
  'When can he start?',
  'Has he led a team?',
  'What did he do at Render?',
  'What does he do at Norduo?',
  'Has he worked with React?',
  'Does he know TypeScript?',
  'Has he done any back-end work?',
  'Where did he study?',
  'What languages does he speak?',
  'How does he like to work?',
  'What is Defend Earth?',
  'Did he build this site himself?',
  'Does he write tests?',
  'Has he worked with WordPress?',
  'What does he do outside work?',
  'How many years of experience does he have?',
  'How do I contact him?',
];
const shuffled = [...SUGGESTION_POOL].sort(() => Math.random() - 0.5);
const SUGGESTED = shuffled.slice(0, 3);

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
  <section id="ask" class="ask-b" :data-palette="palette" data-cy="ask">
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

      <!-- At a limit the form gives way to the message, until it resets -->
      <p v-if="limit" class="ask-b__limit" role="status">
        <span class="ask-b__limit-icon" aria-hidden="true">⏳</span>
        {{ limitMessage[limit] }}
      </p>
      <form v-else class="ask-b__form" @submit.prevent="submit()">
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
      <!-- Left: count above the links. Right: the note, one sentence a line -->
      <div class="ask-b__meta">
        <div class="ask-b__side">
          <span v-if="!limit" class="ask-b__count">
            {{ question.length }}/300
          </span>
          <span class="ask-b__links">
            <a href="#privacy">Privacy</a>
            <template v-if="history.length">
              ·
              <button type="button" class="ask-b__clear" @click="clear">
                Clear chat
              </button>
            </template>
          </span>
        </div>
        <p class="ask-b__note">
          <span>Answers are AI-generated from this site and can be wrong.</span>
          <span>Questions it can't answer may be saved.</span>
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
/* The card. No top padding: the thread scrolls right up to its rounded top
   edge, so nothing is cut off mid-card. */
.ask-b__box {
  margin-top: 1rem;
  padding: 0 1.25rem 1rem;
  border-radius: 12px;
  background: var(--color-card);
  box-shadow: var(--color-card-shadow) 0 2px 8px;
  overflow: hidden;
}
.ask-b__empty {
  padding-top: 1.25rem;
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
/* Page scrolling carries on once the thread hits its end */
.ask-b__thread {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 320px;
  margin: 0;
  padding: 1.25rem 0 0;
  overflow-y: auto;
  list-style: none;
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
/* Bordered, so it still reads on the light theme's white card */
.ask-b__bubble--a {
  align-self: flex-start;
  background: var(--color-background);
  border: 1px solid var(--color-accent-soft-hover);
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
.ask-b__limit {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  margin: 1rem 0 0;
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-accent-soft-hover);
  border-radius: 8px;
  background: var(--color-accent-soft);
  color: var(--color-hdln);
  line-height: 1.45;
}
.ask-b__form {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
/* Send matches this starting height; resizing only grows the textarea */
.ask-b__input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  height: 4rem;
  min-height: 4rem;
  max-height: 12rem;
  resize: vertical;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-accent-soft-hover);
  border-radius: 8px;
  background: var(--color-background);
  color: inherit;
  font: inherit;
  line-height: 1.4;
}
.ask-b__input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
}
.ask-b__send {
  box-sizing: border-box;
  height: 4rem;
  padding: 0 1.25rem;
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
/* Greyed rather than a faded accent, which turns lavender on white */
.ask-b__send:disabled {
  background: var(--color-accent-soft-hover);
  color: var(--color-text-muted);
  cursor: default;
}
.ask-b__meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-top: 0.375rem;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}
.ask-b__side {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.ask-b__links a,
.ask-b__clear {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-link);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}
.ask-b__links a:hover,
.ask-b__clear:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}
.ask-b__note {
  display: flex;
  flex-direction: column;
  margin: 0;
  text-align: right;
}

/* PROTOTYPE palettes, all from existing theme tokens */
/* Solid accent: the visitor's bubble in the accent, answers on a raised
   surface, Send in the heading colour so it differs from the bubble */
[data-palette='solid'] {
  .ask-b__bubble--q {
    background: var(--color-chip-selected-bg);
    color: var(--color-chip-selected-text);
  }
  .ask-b__bubble--a {
    background: var(--color-surface-raised);
    border-color: transparent;
  }
  .ask-b__send:not(:disabled) {
    background: var(--color-hdln);
    color: var(--color-background);
  }
}
/* Quiet: no card; answers are the white cards instead, questions soft */
[data-palette='quiet'] {
  .ask-b__box {
    padding: 0;
    background: none;
    box-shadow: none;
    overflow: visible;
  }
  .ask-b__thread {
    padding: 1.25rem 0.25rem 0.5rem;
  }
  .ask-b__bubble--q {
    background: var(--color-surface-raised);
  }
  .ask-b__bubble--a {
    background: var(--color-card);
    border-color: transparent;
    box-shadow: var(--color-card-shadow) 0 2px 8px;
  }
  .ask-b__input {
    background: var(--color-card);
  }
}
/* Neutral: grey for the visitor, plain text with an accent rule for
   answers; colour only on Send */
[data-palette='neutral'] {
  .ask-b__bubble--q {
    background: var(--color-background-overlay);
    color: var(--color-text);
  }
  .ask-b__bubble--a {
    max-width: 100%;
    background: none;
    border: none;
    border-left: 2px solid var(--color-accent);
    border-radius: 0;
  }
  .ask-b__input {
    background: var(--color-card);
  }
}

@media screen and (max-width: 600px) {
  /* The header no longer spaces it from the Hero, like .home__experience */
  .ask-b {
    margin-top: 2em;
    margin-bottom: 0;
  }
  .ask-b__box {
    padding: 0 1rem 0.875rem;
  }
  .ask-b__thread {
    max-height: 55vh;
    padding-top: 1rem;
  }
  .ask-b__empty {
    padding-top: 1rem;
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
    align-items: stretch;
  }
  .ask-b__send {
    height: 2.75rem;
  }
}
</style>
