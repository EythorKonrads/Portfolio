<script setup>
import ExperienceJob from './ExperienceJob.vue'
import jobs from '@/assets/jobs.json'
</script>

<template>
    <div class="expirience">
        <div class="expirience__hdln">
            <h2>Experience</h2>
            <div class="expirience__line"></div>
        </div>
        <ExperienceJob
            v-for="(job, key) in jobs"
            :key="key"
            :job="job"
        />
    </div>
</template>

<style lang="scss" scoped>
.expirience {
    padding: 0 2rem;
}
.expirience__hdln {
    font-size: 1.75rem;
    font-weight: 600;
    width: auto;

    h2 {
        width: auto;
        display: inline-block;
    }
}
.expirience__line {
    height: 1px;
    width: 100%;
    background-color: white;
}
</style>
