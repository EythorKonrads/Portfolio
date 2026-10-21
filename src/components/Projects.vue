<script setup>
import { computed } from 'vue';
import ProjectsItem from './ProjectsItem.vue';
import projects from '@/assets/projects.json';
import { useTagFilter } from '@/composables/useTagFilter';

const { matches, hasFilter } = useTagFilter();
const visibleProjects = computed(() =>
  projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => matches(project.technologies))
);
</script>

<template>
  <div id="projects" class="projects" data-cy="projects">
    <div v-reveal class="projects__hdln">
      <h2>Projects</h2>
      <div class="projects__line reveal-line"></div>
    </div>
    <div class="projects__list">
      <ProjectsItem
        v-for="{ project, index } in visibleProjects"
        :key="index"
        :project="project"
      />
    </div>
    <p
      v-if="!visibleProjects.length"
      class="projects__empty"
      data-cy="projectsEmpty"
    >
      No projects match the selected filters.
    </p>
    <p v-if="!hasFilter" v-reveal class="projects__more">
      More projects to showcase soon...
    </p>
  </div>
</template>

<style lang="scss" scoped>
.projects {
  margin-top: 2rem;
  padding: 0 2rem;
}
.projects__hdln {
  font-size: 1.75rem;
  font-weight: 600;
  width: auto;

  h2 {
    width: auto;
    display: inline-block;
  }
}
.projects__line {
  height: 1px;
  width: 100%;
  margin-bottom: 1rem;
  background-color: var(--color-rule);
}
.projects__list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.projects__more {
  margin-top: 1.5rem;
  font-size: 1rem;
  color: var(--color-text-muted);
  text-align: center;
}
.projects__empty {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>
