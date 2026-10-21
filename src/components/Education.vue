<script setup>
import { computed } from 'vue';
import EducationItem from './EducationItem.vue';
import educations from '@/assets/educations.json';
import languages from '@/assets/languages.json';
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
    <div v-reveal class="education__languages" data-cy="languages">
      <h3 class="education__languages-hdln">Languages</h3>
      <ul class="education__languages-list">
        <li
          v-for="{ language, level } in languages"
          :key="language"
          class="education__language"
          data-cy="language"
        >
          <span class="education__language-name">{{ language }}</span>
          <span class="education__language-level">{{ level }}</span>
        </li>
      </ul>
    </div>
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
  background-color: white;
}
.education__empty {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  color: rgba(100, 116, 139, 1);
}
/* Sized to match an education entry, with the date-style label */
.education__languages {
  padding: 0.625rem 0;
}
.education__languages-hdln {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  color: #9393e8;
}
.education__languages-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.75rem;
  list-style: none;
  padding: 0;
  margin: 0.375rem 0 0;
}
.education__language {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
}
.education__language-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-hdln);
}
.education__language-level {
  font-size: 0.9rem;
  color: rgba(100, 116, 139, 1);
}
</style>
