<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { RouterLink } from 'vue-router';
import suggestionPool from '@/assets/ask-suggestions.json';
import { useTurnstile } from '@/composables/useTurnstile';

const MAX_LENGTH = 300;
const COUNT_WARN = 280;
const STORAGE_KEY = 'ask-history';
// Within this many px of the bottom counts as "at the bottom"
const BOTTOM_SLACK = 24;
const ANSWER_STATUSES = ['answered', 'unknown', 'offTopic'];
// The Worker sends codes only; these are the words, keyed by `error`
const MESSAGES = {
  unavailable:
    "Ask isn't working right now. Try again later, or email hello@eythorkonrads.com.",
  hourLimit:
    "You've hit the limit of 20 questions an hour. You can ask again at {time}.",
  dayLimit:
    "Ask has answered all the questions it can for today. It's back at {time}, or email hello@eythorkonrads.com.",
};

function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const { getToken, getInteractiveToken } = useTurnstile();

// Kept for the tab's life, so it survives a trip to /privacy and back
const history = ref(loadHistory());
watch(
  history,
  (entries) => {
    try {
      if (entries.length) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage is blocked, so the chat ends with the page
    }
  },
  { deep: true }
);

const question = ref('');
// The question waiting for its answer
const asking = ref(null);
// The question waiting for a visible Turnstile check
const checking = ref(null);
const unavailable = ref(false);
// At a limit, the message that replaces the input until `retryAt`
const limitMessage = ref(null);
let limitTimer;

const input = ref(null);
const thread = ref(null);
const turnstileSlot = ref(null);
const showNewPill = ref(false);

const alert = computed(() => {
  if (limitMessage.value) return { icon: '⏳', text: limitMessage.value };
  if (unavailable.value) return { icon: '⚠️', text: MESSAGES.unavailable };
  return null;
});

// Three random picks, never one already asked
const pickSuggestions = () => {
  const asked = new Set(history.value.map((entry) => entry.question));
  return suggestionPool
    .filter((q) => !asked.has(q))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
};
const suggested = ref(pickSuggestions());
watch(
  () => history.value.length,
  () => (suggested.value = pickSuggestions())
);

// Split text into plain and email parts, so emails render as mailto links
const EMAIL = /([\w.+-]+@[\w-]+\.[\w.]+\w)/;
const withEmailLinks = (text) =>
  text
    .split(EMAIL)
    .filter(Boolean)
    .map((value) => ({ value, email: EMAIL.test(value) }));

// An answer is followed only if the visitor stayed at the bottom
let following = true;
// Set while a smooth scroll to the bottom is on its way, so its own scroll
// events don't count as the visitor scrolling up
let autoScrolling = false;

const atBottom = () => {
  const el = thread.value;
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLACK;
};

function scrollToBottom() {
  showNewPill.value = false;
  following = true;
  const el = thread.value;
  if (!el || atBottom()) return;
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  autoScrolling = true;
  el.scrollTo({
    top: el.scrollHeight,
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
}

function onThreadScroll() {
  if (atBottom()) {
    following = true;
    autoScrolling = false;
    showNewPill.value = false;
  } else if (!autoScrolling) {
    following = false;
  }
}

// What a reply means for the page: an answer, a limit, a Turnstile retry,
// or Unavailable for anything else
async function post(text, token) {
  let response;
  try {
    response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text, token }),
    });
  } catch {
    return { kind: 'unavailable' };
  }
  if (response.status === 403) return { kind: 'turnstile' };
  const body = await response.json().catch(() => null);
  if (
    response.status === 200 &&
    ANSWER_STATUSES.includes(body?.status) &&
    typeof body.answer === 'string'
  ) {
    return { kind: 'answer', status: body.status, answer: body.answer };
  }
  const retryAt = new Date(body?.retryAt);
  if (
    response.status === 429 &&
    ['hourLimit', 'dayLimit'].includes(body?.error) &&
    !Number.isNaN(retryAt.getTime())
  ) {
    return { kind: 'limit', error: body.error, retryAt };
  }
  return { kind: 'unavailable' };
}

// Shows the visible widget in place of the input until it passes
async function checkInteractively(text) {
  checking.value = text;
  await nextTick();
  try {
    return await getInteractiveToken(turnstileSlot.value);
  } finally {
    checking.value = null;
  }
}

async function ask(text) {
  try {
    let token;
    try {
      token = await getToken();
    } catch (error) {
      if (error.reason !== 'interactive') throw error;
      token = await checkInteractively(text);
    }
    const result = await post(text, token);
    if (result.kind !== 'turnstile') return result;
    // One visible check after a 403; a second 403 is Unavailable
    const retry = await post(text, await checkInteractively(text));
    return retry.kind === 'turnstile' ? { kind: 'unavailable' } : retry;
  } catch {
    return { kind: 'unavailable' };
  }
}

function showLimit({ error, retryAt }) {
  const time = new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
  }).format(retryAt);
  limitMessage.value = MESSAGES[error].replace('{time}', time);
  clearTimeout(limitTimer);
  limitTimer = setTimeout(
    () => (limitMessage.value = null),
    retryAt - Date.now()
  );
}

async function submit(text = question.value) {
  const trimmed = text.trim();
  if (!trimmed || asking.value !== null) return;
  question.value = '';
  unavailable.value = false;
  asking.value = trimmed;
  input.value?.focus();
  // Their own question always scrolls into view, with "Thinking…"
  await nextTick();
  scrollToBottom();

  const result = await ask(trimmed);
  asking.value = null;
  if (result.kind === 'answer') {
    history.value.push({
      question: trimmed,
      status: result.status,
      answer: result.answer,
    });
    await nextTick();
    if (following) scrollToBottom();
    else showNewPill.value = true;
  } else if (result.kind === 'limit') {
    showLimit(result);
  } else {
    unavailable.value = true;
    // Given back to try again, unless they've started a new one
    if (!question.value) question.value = trimmed;
  }
  await nextTick();
  input.value?.focus();
}

function onEnter(event) {
  // Enter sends; Shift+Enter is a new line
  if (event.shiftKey || event.isComposing) return;
  event.preventDefault();
  submit();
}

function clear() {
  history.value = [];
  unavailable.value = false;
  showNewPill.value = false;
}

onMounted(() => {
  // A restored chat opens at its latest answer
  if (thread.value) thread.value.scrollTop = thread.value.scrollHeight;
});

onBeforeUnmount(() => clearTimeout(limitTimer));
</script>

<template>
  <section id="ask" class="ask" data-cy="ask">
    <div v-reveal class="ask__hdln">
      <h2>Ask about me</h2>
      <div class="ask__line reveal-line"></div>
    </div>

    <div v-reveal class="ask__card">
      <p
        v-if="!history.length && !asking"
        class="ask__empty"
        data-cy="askEmpty"
      >
        Ask anything about my work, skills or what I'm looking for.
      </p>

      <div v-else class="ask__thread-wrap">
        <ol
          ref="thread"
          class="ask__thread"
          aria-live="polite"
          data-cy="askThread"
          @scroll="onThreadScroll"
        >
          <li v-for="(entry, i) in history" :key="i" class="ask__pair">
            <p class="ask__bubble ask__bubble--question" data-cy="askQuestion">
              {{ entry.question }}
            </p>
            <p
              class="ask__bubble ask__bubble--answer"
              :class="{ 'ask__bubble--unknown': entry.status === 'unknown' }"
              data-cy="askAnswer"
            >
              <template
                v-for="(part, j) in withEmailLinks(entry.answer)"
                :key="j"
              >
                <a v-if="part.email" :href="`mailto:${part.value}`">{{
                  part.value
                }}</a>
                <template v-else>{{ part.value }}</template>
              </template>
            </p>
          </li>
          <li v-if="asking && !checking" class="ask__pair">
            <p class="ask__bubble ask__bubble--question" data-cy="askQuestion">
              {{ asking }}
            </p>
            <p
              class="ask__bubble ask__bubble--answer ask__thinking"
              data-cy="askThinking"
            >
              Thinking…
            </p>
          </li>
        </ol>
        <button
          v-if="showNewPill"
          type="button"
          class="ask__new"
          data-cy="askNewPill"
          @click="scrollToBottom"
        >
          New message ↓
        </button>
      </div>

      <!-- One fixed slot, before and after the first question, so nothing
           jumps. Old picks fade out on send; new ones fade in one by one
           once the answer is in. -->
      <div v-if="!limitMessage" class="ask__chips-slot">
        <!-- duration: the staggered chips run longer than the wrapper -->
        <Transition
          name="chips"
          mode="out-in"
          :duration="{ enter: 500, leave: 200 }"
        >
          <div
            v-if="!asking && !checking && suggested.length"
            :key="suggested.join('|')"
            class="ask__chips"
          >
            <button
              v-for="(suggestion, i) in suggested"
              :key="suggestion"
              type="button"
              class="ask__chip"
              :style="{ '--i': i }"
              data-cy="askChip"
              @click="submit(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </Transition>
      </div>

      <p v-if="alert" class="ask__alert" role="status" data-cy="askAlert">
        <span aria-hidden="true">{{ alert.icon }}</span>
        <span>
          <template v-for="(part, j) in withEmailLinks(alert.text)" :key="j">
            <a v-if="part.email" :href="`mailto:${part.value}`">{{
              part.value
            }}</a>
            <template v-else>{{ part.value }}</template>
          </template>
        </span>
      </p>

      <div v-if="checking" class="ask__turnstile" data-cy="askTurnstile">
        <p class="ask__turnstile-why">
          One quick check before we send “{{ checking }}”
        </p>
        <div ref="turnstileSlot"></div>
      </div>
      <form
        v-else-if="!limitMessage"
        class="ask__form"
        data-cy="askForm"
        @submit.prevent="submit()"
      >
        <textarea
          ref="input"
          v-model="question"
          class="ask__input"
          rows="2"
          :maxlength="MAX_LENGTH"
          aria-label="Your question"
          placeholder="Type a question…"
          data-cy="askInput"
          @keydown.enter="onEnter"
        ></textarea>
        <button
          class="ask__send"
          :disabled="!!asking || !question.trim()"
          data-cy="askSend"
        >
          Send
        </button>
      </form>

      <!-- Left: the counter above the links. Right: the small print. -->
      <div class="ask__meta">
        <div class="ask__side">
          <span
            v-if="!limitMessage && !checking"
            class="ask__count"
            :class="{ 'ask__count--warn': question.length >= COUNT_WARN }"
            data-cy="askCounter"
          >
            {{ question.length }}/{{ MAX_LENGTH }}
          </span>
          <span>
            <RouterLink to="/privacy" class="ask__link" data-cy="askPrivacy"
              >Privacy</RouterLink
            >
            <template v-if="history.length">
              ·
              <button
                type="button"
                class="ask__link"
                data-cy="askClear"
                @click="clear"
              >
                Clear chat
              </button>
            </template>
          </span>
        </div>
        <p class="ask__note">
          <span
            >Answered by Claude, an AI from Anthropic, using this site. Answers
            can be wrong.</span
          >
          <span
            >Questions go to Anthropic in the US; ones it can't answer are kept
            90 days. Please don't include personal details.</span
          >
        </p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/* Same frame as Experience and Education */
.ask {
  padding: 0 2rem;
}
.ask__hdln {
  font-size: 1.75rem;
  font-weight: 600;
  width: auto;

  h2 {
    width: auto;
    display: inline-block;
  }
}
.ask__line {
  height: 1px;
  width: 100%;
  background-color: var(--color-rule);
}
/* No top padding: the thread scrolls right up to the card's rounded top
   edge, so nothing is cut off mid-card */
.ask__card {
  container: ask-card / inline-size;
  margin-top: 1rem;
  padding: 0 1.25rem 1rem;
  border-radius: 12px;
  background: var(--color-card);
  box-shadow: var(--color-card-shadow) 0 2px 8px;
  overflow: hidden;
}
/* A white card on the light page barely shows, so tint it like the Hero */
[data-theme='light'] .ask__card {
  background: color-mix(in srgb, var(--color-hdln) 7%, transparent);
}
[data-theme='light'] .ask__input {
  background: var(--color-card);
}
.ask__empty {
  margin: 0;
  padding-top: 1.25rem;
  color: var(--color-text-muted);
}
.ask__thread-wrap {
  position: relative;
}
/* Page scrolling carries on once the thread hits its end */
.ask__thread {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 320px;
  margin: 0;
  padding: 1.25rem 0 0;
  overflow-y: auto;
  list-style: none;
}
.ask__pair {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.ask__bubble {
  max-width: 80%;
  margin: 0;
  padding: 0.5rem 0.875rem;
  border-radius: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
/* The soft accent, so Send stays the strong one */
.ask__bubble--question {
  align-self: flex-end;
  background: var(--color-accent-soft-hover);
  color: var(--color-hdln);
}
/* Bordered, so it still reads on the light theme's card */
.ask__bubble--answer {
  align-self: flex-start;
  background: var(--color-background);
  border: 1px solid var(--color-accent-soft-hover);
}
.ask__bubble--unknown {
  font-style: italic;
}
.ask__bubble a,
.ask__alert a {
  color: var(--color-link-hover);
  text-decoration: underline;
}
.ask__thinking {
  color: var(--color-text-muted);
}
.ask__new {
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
/* Three chips, one per row, so the slot is the same height at any width */
.ask__chips-slot {
  --chip-height: 2.125rem;
  --chip-gap: 0.5rem;
  height: calc(3 * var(--chip-height) + 2 * var(--chip-gap));
  margin-top: 1rem;
}
.ask__chips {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--chip-gap);
  /* Chips too long for the card scroll sideways instead of being cut off */
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
/* A wide card has room for one row, so the slot is one chip tall there */
@container ask-card (min-width: 640px) {
  .ask__chips-slot {
    height: var(--chip-height);
  }
  .ask__chips {
    flex-direction: row;
  }
}
.ask__chip {
  flex-shrink: 0;
  height: var(--chip-height);
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-accent-soft-hover);
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-chip-text);
  font: inherit;
  font-size: 0.875rem;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.ask__chip:hover {
  background: var(--color-accent-soft-hover);
}
/* Old picks leave together; new ones arrive one after another. Leaving ones
   can't be clicked, since a question is already on its way. */
.chips-leave-active .ask__chip {
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.chips-enter-active .ask__chip {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  transition-delay: calc(var(--i) * 80ms);
}
.chips-leave-to .ask__chip,
.chips-enter-from .ask__chip {
  opacity: 0;
  transform: translateY(6px);
}
@media (prefers-reduced-motion: reduce) {
  .chips-leave-to .ask__chip,
  .chips-enter-from .ask__chip {
    transform: none;
  }
}
/* Unavailable and the limits share one box */
.ask__alert {
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
.ask__turnstile {
  margin-top: 1rem;
}
.ask__turnstile-why {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.ask__form {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
/* Send matches this starting height; resizing only grows the textarea */
.ask__input {
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
.ask__input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
}
.ask__send {
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
.ask__send:hover:not(:disabled) {
  filter: brightness(1.15);
}
.ask__send:active:not(:disabled) {
  transform: translateY(1px);
}
/* Greyed rather than a faded accent, which turns lavender on white */
.ask__send:disabled {
  background: var(--color-accent-soft-hover);
  color: var(--color-text-muted);
  cursor: default;
}
.ask__meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-top: 0.375rem;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}
.ask__side {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.ask__count--warn {
  color: var(--color-warning);
  font-weight: 600;
}
.ask__link {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-link);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}
.ask__link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}
.ask__note {
  display: flex;
  flex-direction: column;
  margin: 0;
  text-align: right;
}

@media screen and (max-width: 600px) {
  .ask__card {
    padding: 0 1rem 0.875rem;
  }
  .ask__thread {
    max-height: 55vh;
    padding-top: 1rem;
  }
  .ask__empty {
    padding-top: 1rem;
  }
  .ask__bubble {
    max-width: 90%;
  }
  .ask__chip {
    font-size: 0.8125rem;
  }
  /* Stacked: the textarea gets the full width, Send sits under it */
  .ask__form {
    flex-direction: column;
    align-items: stretch;
  }
  .ask__send {
    height: 2.75rem;
  }
}
</style>
