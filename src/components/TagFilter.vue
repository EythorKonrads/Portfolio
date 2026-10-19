<script setup>
import { ref } from 'vue';
import BasePopup from './BasePopup.vue';
import Icon from './Icon.vue';
import { useTagFilter, useTagFilterQuery } from '@/composables/useTagFilter';

const {
  allTags,
  selectedTags,
  hasFilter,
  isSelected,
  toggleTag,
  clearTags,
  tagTitle,
} = useTagFilter();
useTagFilterQuery();

const isOpen = ref(false);
</script>

<template>
  <div class="tag-filter" data-cy="tagFilter">
    <button
      type="button"
      class="tag-filter__button"
      data-cy="filterButton"
      aria-haspopup="dialog"
      @click="isOpen = true"
    >
      <Filter class="tag-filter__button-icon" />
      Filter
      <span v-if="hasFilter" data-cy="filterCount">
        ({{ selectedTags.length }})
      </span>
    </button>

    <ul v-if="hasFilter" class="tag-filter__active" data-cy="filterActive">
      <li v-for="tag in selectedTags" :key="tag">
        <button
          type="button"
          class="tag-filter__chip tag-filter__chip--selected"
          data-cy="filterActiveTag"
          :data-tag="tag"
          :aria-label="`Remove ${tagTitle(tag)} filter`"
          @click="toggleTag(tag)"
        >
          {{ tagTitle(tag) }}
          <Icon name="close" class="tag-filter__remove-icon" />
        </button>
      </li>
    </ul>

    <BasePopup
      :is-open="isOpen"
      size="small"
      cy="filterPopup"
      label="Filter by technology"
      @close="isOpen = false"
    >
      <div class="tag-filter__popup">
        <h3 class="tag-filter__title">Filter by technology</h3>
        <p class="tag-filter__desc">
          Show experience, education and projects that use any of the selected
          technologies.
        </p>
        <ul class="tag-filter__tags">
          <li v-for="{ tag, title, count } in allTags" :key="tag">
            <button
              type="button"
              class="tag-filter__chip"
              data-cy="filterTag"
              :data-tag="tag"
              :class="{ 'tag-filter__chip--selected': isSelected(tag) }"
              :aria-pressed="isSelected(tag)"
              @click="toggleTag(tag)"
            >
              {{ title }}
              <span class="tag-filter__count">{{ count }}</span>
            </button>
          </li>
        </ul>
        <div class="tag-filter__actions">
          <button
            type="button"
            class="tag-filter__clear"
            data-cy="filterClear"
            :disabled="!hasFilter"
            @click="clearTags"
          >
            Clear all
          </button>
        </div>
      </div>
    </BasePopup>
  </div>
</template>

<style scoped>
.tag-filter {
  padding: 0 2rem;
  margin-bottom: 1.5rem;
}
.tag-filter__button,
.tag-filter__chip,
.tag-filter__clear {
  border: 0;
  font: inherit;
  cursor: pointer;
  border-radius: 9999px;
  box-sizing: border-box;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
.tag-filter__button {
  display: inline-flex;
  align-items: center;
  gap: 0.375em;
  padding: 0.5em 1.25em;
  font-weight: 500;
  color: #9393e8;
  background-color: rgba(147, 147, 232, 0.1);
}
.tag-filter__button:hover {
  background-color: rgba(147, 147, 232, 0.2);
}
.tag-filter__button-icon {
  width: 1em;
  height: 1em;
}
.tag-filter__active,
.tag-filter__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375em;
  list-style: none;
  padding: 0;
  margin: 0;
}
.tag-filter__active {
  margin-top: 0.75em;
  font-size: 0.8rem;
}
.tag-filter__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375em;
  padding: 0.25em 0.75em;
  color: #9393e8;
  background-color: rgba(147, 147, 232, 0.1);
}
.tag-filter__chip:hover {
  background-color: rgba(147, 147, 232, 0.2);
}
.tag-filter__chip--selected,
.tag-filter__chip--selected:hover {
  color: white;
  background-color: rgba(147, 147, 232, 0.45);
}
.tag-filter__remove-icon.icon {
  width: 0.75em;
  height: 0.75em;
}
.tag-filter__remove-icon :deep(path) {
  fill: currentColor;
}
.tag-filter__popup {
  width: 100%;
  /* Pull the content up beside the sticky close button */
  padding: 1.75rem 2rem 2rem;
  margin-top: -2.3rem;
  box-sizing: border-box;
}
.tag-filter__title {
  margin: 0 3rem 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}
.tag-filter__desc {
  margin: 0 0 1.25rem;
  font-size: 0.9rem;
  color: rgba(100, 116, 139, 1);
}
.tag-filter__tags {
  font-size: 0.9rem;
}
.tag-filter__count {
  font-size: 0.8em;
  opacity: 0.7;
}
.tag-filter__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
.tag-filter__clear {
  padding: 0.5em 1.25em;
  font-weight: 500;
  color: #9393e8;
  background-color: rgba(147, 147, 232, 0.1);
}
.tag-filter__clear:hover:not(:disabled) {
  background-color: rgba(147, 147, 232, 0.2);
}
.tag-filter__clear:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
