<script setup>
import { computed } from 'vue';
import EducationItem from './EducationItem.vue';
import educations from '@/assets/educations.json';
import { useTagFilter } from '@/composables/useTagFilter';

const { matches } = useTagFilter();
const visibleEducations = computed(() =>
  educations
    .map((education, index) => ({ education, index }))
    .filter(({ education }) => matches(education.tags))
);
</script>

<template>
  <div id="education" class="education" data-cy="education">
    <div v-reveal class="education__hdln">
      <h2>Education</h2>
      <div class="education__line reveal-line"></div>
    </div>
    <EducationItem
      v-for="{ education, index } in visibleEducations"
      :key="index"
      v-reveal
      :education="education"
    />
    <p
      v-if="!visibleEducations.length"
      class="education__empty"
      data-cy="educationEmpty"
    >
      No education matches the selected filters.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.education {
  padding: 0 2rem;
}
.education__hdln {
  font-size: 1.75rem;
  font-weight: 600;
  width: auto;

  h2 {
    width: auto;
    display: inline-block;
  }
}
.education__line {
  height: 1px;
  width: 100%;
  background-color: var(--color-rule);
}
.education__empty {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>
