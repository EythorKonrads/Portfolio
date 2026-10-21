<script setup>
import { ref } from 'vue';
import BasePopup from './BasePopup.vue';
import TagChip from './TagChip.vue';
import { useTagFilter, useTagFilterQuery } from '@/composables/useTagFilter';

const { allTags, selectedTags, hasFilter, clearTags } = useTagFilter();
useTagFilterQuery();

const isOpen = ref(false);
</script>

<template>
  <div class="tag-filter" data-cy="tagFilter">
    <!-- v-reveal on the button, not the root: a transform on the root would
         break the popup's fixed backdrop while it animates -->
    <button
      v-reveal
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
          <li v-for="tag in allTags" :key="tag.tag">
            <TagChip :tag="tag" data-cy="filterTag">
              <span class="tag-filter__count">{{ tag.count }}</span>
            </TagChip>
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
  display: flex;
  justify-content: flex-end;
}
.tag-filter__button,
.tag-filter__clear {
  border: 0;
  font: inherit;
  font-weight: 500;
  padding: 0.5em 1.25em;
  cursor: pointer;
  border-radius: 9999px;
  box-sizing: border-box;
  color: #9393e8;
  background-color: rgba(147, 147, 232, 0.1);
  transition: background-color 0.3s ease;
}
/* Keep the reveal fade from animations.scss alongside the hover transition */
.tag-filter__button.reveal {
  transition:
    opacity var(--anim-duration) var(--anim-ease) var(--reveal-delay, 0ms),
    transform var(--anim-duration) var(--anim-ease) var(--reveal-delay, 0ms),
    background-color 0.3s ease;
}
@media (prefers-reduced-motion: reduce) {
  .tag-filter__button.reveal {
    transition: background-color 0.3s ease;
  }
}
.tag-filter__button:hover,
.tag-filter__clear:hover:not(:disabled) {
  background-color: rgba(147, 147, 232, 0.2);
}
.tag-filter__button {
  display: inline-flex;
  align-items: center;
  gap: 0.375em;
}
.tag-filter__button-icon {
  width: 1em;
  height: 1em;
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.75em 0.625em;
  list-style: none;
  padding: 0;
  margin: 0;
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
.tag-filter__clear:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
