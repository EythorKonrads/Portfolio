<script setup>
// PROTOTYPE (issue #140): floating bar to flip variants (← / → keys too) and
// pick what the fake /api/ask replies next. Dev builds only.
import { onBeforeUnmount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { REPLIES, useAskPrototype } from './useAskPrototype';

const props = defineProps({
  variants: { type: Object, required: true }, // { A: 'In the Hero', ... }
  current: { type: String, required: true },
});

const route = useRoute();
const router = useRouter();
const {
  nextReply,
  history,
  notice,
  limit,
  askedThisHour,
  askedToday,
  nearLimit,
  resetLimits,
} = useAskPrototype();
const keys = Object.keys(props.variants);

function go(step) {
  const i = (keys.indexOf(props.current) + step + keys.length) % keys.length;
  router.replace({ query: { ...route.query, variant: keys[i] } });
}
function onKey(event) {
  const t = event.target;
  if (t.closest?.('input, textarea, select, [contenteditable]')) return;
  if (event.key === 'ArrowLeft') go(-1);
  if (event.key === 'ArrowRight') go(1);
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="proto-bar">
    <button aria-label="Previous variant" @click="go(-1)">←</button>
    <span class="proto-bar__label">
      {{ current }} ({{ variants[current] }})
    </span>
    <button aria-label="Next variant" @click="go(1)">→</button>
    <label class="proto-bar__reply">
      Next reply
      <select v-model="nextReply">
        <option v-for="(label, key) in REPLIES" :key="key" :value="key">
          {{ label }}
        </option>
      </select>
    </label>
    <button @click="nearLimit">19 asked</button>
    <button @click="resetLimits">Reset limits</button>
    <span class="proto-bar__state">
      hour {{ askedThisHour }}/20 · day {{ askedToday }}/100 · limit:
      {{ limit ?? 'none' }} · history: {{ history.length }} · notice:
      {{ notice ? 'yes' : 'no' }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
/* Deliberately off-design so it reads as tooling, not part of the page */
.proto-bar {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  z-index: 1000;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: calc(100vw - 2rem);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: var(--color-black);
  color: var(--color-white);
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow-x: auto;
  box-shadow: var(--color-box-shadow) 0 4px 16px;

  button,
  select {
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  select {
    background: var(--color-black);
  }
  .proto-bar__state {
    opacity: 0.6;
  }
}
</style>
