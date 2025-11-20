<script setup>
import ExperienceJob from './ExperienceJob.vue';
import jobs from '@/assets/jobs.json';
</script>

<template>
  <div id="experience" class="experience">
    <div class="experience__hdln">
      <h2>Experience</h2>
      <div class="experience__line"></div>
    </div>
    <ExperienceJob v-for="(job, key) in jobs" :key="key" :job="job" />
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
  background-color: white;
}
</style>
