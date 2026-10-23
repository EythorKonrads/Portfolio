<script setup>
import { computed } from 'vue';
import ExperienceJob from './ExperienceJob.vue';
import jobs from '@/assets/jobs.json';
import { useTagFilter } from '@/composables/useTagFilter';

const { matches } = useTagFilter();
const visibleJobs = computed(() =>
  jobs
    .map((job, index) => ({ job, index }))
    .filter(({ job }) => matches(job.tags))
);
</script>

<template>
  <div id="experience" class="experience" data-cy="experience">
    <div v-reveal class="experience__hdln">
      <h2>Experience</h2>
      <div class="experience__line reveal-line"></div>
    </div>
    <ExperienceJob
      v-for="{ job, index } in visibleJobs"
      :key="index"
      v-reveal
      :job="job"
    />
    <p
      v-if="!visibleJobs.length"
      class="experience__empty"
      data-cy="experienceEmpty"
    >
      No experience matches the selected filters.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.experience {
  padding: 0 2rem;
}
.experience__hdln {
  font-size: 1.75rem;
  font-weight: 600;
  width: auto;

  h2 {
    width: auto;
    display: inline-block;
  }
}
.experience__line {
  height: 1px;
  width: 100%;
  background-color: var(--color-rule);
}
.experience__empty {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>
