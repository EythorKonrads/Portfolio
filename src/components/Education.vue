<script setup>
import ExperienceJob from './EducationItem.vue'
import educations from '@/assets/educations.json'
</script>

<template>
    <div class="education">
        <div class="education__hdln">
            <h2>Education</h2>
            <div class="education__line"></div>
        </div>
        <ExperienceJob
            v-for="(education, key) in educations"
            :key="key"
            :education="education"
        />
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
</style>
