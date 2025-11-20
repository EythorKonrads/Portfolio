<script setup>
import ProjectsItem from './ProjectsItem.vue';
import projects from '@/assets/projects.json';
</script>

<template>
  <div id="projects" class="projects">
    <div class="projects__hdln">
      <h2>Projects</h2>
      <div class="projects__line"></div>
    </div>
    <div class="projects__list">
      <ProjectsItem
        v-for="(project, key) in projects"
        :key="key"
        :project="project"
      />
    </div>
    <p class="projects__more">More projects to showcase soon...</p>
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
  background-color: white;
}
.projects__list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.projects__more {
  margin-top: 1.5rem;
  font-size: 1rem;
  color: rgba(100, 116, 139, 1);
  text-align: center;
}
</style>
