// Shared state for filtering jobs, educations and projects by tag.
// State lives at module level so every component sees the same selection.
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import jobs from '@/assets/jobs.json';
import educations from '@/assets/educations.json';
import projects from '@/assets/projects.json';

// Projects store their tags under `technologies`, the rest under `tags`
const taggedItems = [
  ...jobs.map((job) => job.tags ?? []),
  ...educations.map((education) => education.tags ?? []),
  ...projects.map((project) => project.technologies ?? []),
];

// Every unique tag with the number of items using it, sorted by title
const allTags = (() => {
  const byTag = new Map();
  taggedItems.forEach((tags) => {
    new Map(tags.map((tag) => [tag.tag, tag])).forEach(({ tag, title }) => {
      const entry = byTag.get(tag) ?? { tag, title, count: 0 };
      entry.count += 1;
      byTag.set(tag, entry);
    });
  });
  return [...byTag.values()].sort((a, b) => a.title.localeCompare(b.title));
})();

const tagTitles = new Map(allTags.map(({ tag, title }) => [tag, title]));

const selectedTags = ref([]);
const hasFilter = computed(() => selectedTags.value.length > 0);

function isSelected(tag) {
  return selectedTags.value.includes(tag);
}

function toggleTag(tag) {
  selectedTags.value = isSelected(tag)
    ? selectedTags.value.filter((selected) => selected !== tag)
    : [...selectedTags.value, tag];
}

function clearTags() {
  selectedTags.value = [];
}

// True when nothing is selected or the item has any of the selected tags
function matches(itemTags = []) {
  return !hasFilter.value || itemTags.some(({ tag }) => isSelected(tag));
}

export function useTagFilter() {
  return {
    allTags,
    selectedTags,
    hasFilter,
    isSelected,
    toggleTag,
    clearTags,
    matches,
  };
}

function parseQuery(value) {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
  return [...new Set(raw.split(','))].filter((tag) => tagTitles.has(tag));
}

// Keeps the selection in the `?tags=` query so filtered views can be shared
export function useTagFilterQuery() {
  const route = useRoute();
  const router = useRouter();

  watch(
    () => route.query.tags,
    (value) => {
      const tags = parseQuery(value);
      if (tags.join(',') !== selectedTags.value.join(',')) {
        selectedTags.value = tags;
      }
    },
    { immediate: true }
  );

  watch(selectedTags, (tags) => {
    const value = tags.length ? tags.join(',') : undefined;
    if (value === route.query.tags) return;
    router.replace({ query: { ...route.query, tags: value } });
  });
}
