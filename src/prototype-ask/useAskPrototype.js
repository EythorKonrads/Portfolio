// PROTOTYPE (issue #140): throwaway, never merged. Fakes /api/ask so the
// three placement variants can be judged with every kind of reply.
import { ref } from 'vue';

export const REPLIES = {
  answer: 'Answer',
  unanswered: 'Unanswered',
  hourLimit: 'Hour limit',
  dayLimit: 'Day limit',
  error: 'Error',
  unavailable: 'Unavailable',
};

const CANNED = [
  'Eythor works mostly with Vue, JavaScript, SCSS and Cypress, and also with TypeScript, React and Cloudflare.',
  'Yes. Eythor is available for front-end, full-stack or lead roles, full-time or 80%, hybrid or on-site in the greater Copenhagen area.',
  'He led front-end at Render from 2020 to 2025, where he was a lead/senior front-end developer.',
];

const MESSAGES = {
  unanswered:
    "I don't know that one. Ask Eythor directly at hello@eythorkonrads.com.",
  hourLimit:
    "You've asked 20 questions this hour, the most Ask takes. You can ask again in an hour.",
  dayLimit:
    "Ask has answered all the questions it can for today. Try again tomorrow, or email hello@eythorkonrads.com.",
  error: 'Something went wrong. Try again in a moment.',
  unavailable: "Ask isn't available here.",
};

// Shared by all variants, so switching variant keeps the history
const history = ref([]);
const loading = ref(false);
const notice = ref('');
const nextReply = ref('answer');
// The real limits from issue #139. Reaching one blocks asking until reset.
export const PER_HOUR = 20;
export const PER_DAY = 100;
const askedThisHour = ref(0);
const askedToday = ref(0);
const limit = ref(null); // null | 'hourLimit' | 'dayLimit'
let canned = 0;

export function useAskPrototype() {
  async function ask(question) {
    const text = question.trim();
    if (!text || loading.value || limit.value) return;
    loading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 900));
    const kind = nextReply.value;
    loading.value = false;
    if (kind === 'hourLimit' || kind === 'dayLimit') {
      limit.value = kind;
      notice.value = '';
      return;
    }
    if (kind === 'error' || kind === 'unavailable') {
      notice.value = MESSAGES[kind];
      return;
    }
    history.value.push({
      question: text,
      kind,
      answer:
        kind === 'answer' ? CANNED[canned++ % CANNED.length] : MESSAGES[kind],
    });
    notice.value = '';
    askedThisHour.value++;
    askedToday.value++;
    // The API says how many are left, so the box locks right after the last
    if (askedToday.value >= PER_DAY) limit.value = 'dayLimit';
    else if (askedThisHour.value >= PER_HOUR) limit.value = 'hourLimit';
  }
  function clear() {
    history.value = [];
    notice.value = '';
  }
  // Prototype controls for the switcher
  function nearLimit() {
    askedThisHour.value = PER_HOUR - 1;
  }
  function resetLimits() {
    askedThisHour.value = 0;
    askedToday.value = 0;
    limit.value = null;
    nextReply.value = 'answer';
  }
  return {
    history,
    loading,
    notice,
    nextReply,
    limit,
    limitMessage: MESSAGES,
    askedThisHour,
    askedToday,
    ask,
    clear,
    nearLimit,
    resetLimits,
  };
}
