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
    "You've reached the limit of 20 questions for this hour. Try again later.",
  dayLimit: 'Ask has answered all it can for today. Try again tomorrow.',
  error: 'Something went wrong. Try again in a moment.',
  unavailable: "Ask isn't available here.",
};

// Shared by all variants, so switching variant keeps the history
const history = ref([]);
const loading = ref(false);
const notice = ref('');
const nextReply = ref('answer');
let canned = 0;

export function useAskPrototype() {
  async function ask(question) {
    const text = question.trim();
    if (!text || loading.value) return;
    loading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 900));
    const kind = nextReply.value;
    const isAnswer = kind === 'answer';
    const entry = {
      question: text,
      kind,
      answer: isAnswer ? CANNED[canned++ % CANNED.length] : MESSAGES[kind],
    };
    // Limits and errors aren't answers: shown as a notice, not in the history
    if (isAnswer || kind === 'unanswered') {
      history.value.push(entry);
      notice.value = '';
    } else {
      notice.value = entry.answer;
    }
    loading.value = false;
    return entry;
  }
  function clear() {
    history.value = [];
    notice.value = '';
  }
  return { history, loading, notice, nextReply, ask, clear };
}
