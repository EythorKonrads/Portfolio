<script setup>
import Project from './Project.vue'
import projects from '@/assets/projects.json'
</script>
<template>
    <div class="projects">
        <div class="projects__hdln">
            <h2>Projects</h2>
            <div class="projects__line"></div>
        </div>
        <ul
            v-if="projects"
            class="projects__list"
        >
            <li
                v-for="project in projects"
                :key="project.description"
            >
                <Project :project="project" />
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
.projects {
    padding: 0 2rem 2rem;
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
    background-color: white;
}
</style>
