<script setup>
import Icon from './Icon.vue';
import { useTagFilter } from '@/composables/useTagFilter';

// A tag pill that toggles the tag filter when clicked.
// Shows an x while selected to signal that clicking removes it.
const props = defineProps({
  tag: {
    type: Object,
    required: true,
  },
});

const { isSelected, toggleTag } = useTagFilter();
</script>

<template>
  <!-- .stop so clicking a tag on a project card doesn't open its popup -->
  <button
    type="button"
    class="tag-chip"
    :class="{ 'tag-chip--selected': isSelected(props.tag.tag) }"
    :data-tag="props.tag.tag"
    :aria-pressed="isSelected(props.tag.tag)"
    :title="`Filter by ${props.tag.title}`"
    @click.stop="toggleTag(props.tag.tag)"
  >
    {{ props.tag.title }}
    <slot></slot>
    <Icon
      v-if="isSelected(props.tag.tag)"
      name="close"
      class="tag-chip__remove"
      data-cy="tagChipRemove"
    />
  </button>
</template>

<style scoped>
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375em;
  padding: 0.25em 0.75em;
  border: 0;
  border-radius: 9999px;
  box-sizing: border-box;
  font: inherit;
  line-height: inherit;
  color: var(--color-accent);
  background-color: var(--color-accent-soft);
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
.tag-chip:hover {
  background-color: var(--color-accent-soft-hover);
}
.tag-chip--selected,
.tag-chip--selected:hover {
  color: var(--color-chip-selected-text);
  background-color: var(--color-chip-selected-bg);
}
.tag-chip__remove.icon {
  width: 0.75em;
  height: 0.75em;
}
.tag-chip__remove :deep(path) {
  fill: currentColor;
}
</style>
