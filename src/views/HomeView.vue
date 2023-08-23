<script setup>
import Hero from '../components/Hero.vue'
import Experience from '../components/Experience.vue'
import Projects from '../components/Projects.vue'
</script>

<template>
    <div class="home">
        <Hero class="home__hero" />
        <div class="home__wrapper">
            <Projects class="home__cases" />
            <Experience class="home__experience" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.home {
    background-color: rgba(15, 23, 42, 1);
    min-height: 100vh;
    height: 100%;
    width: 100%;
    max-height: 100vh;
    max-width: 100vw;
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;

    .home__hero {
        z-index: 2;
    }
    .home__wrapper {
        max-height: 100vh;
        overflow: auto;
        padding: 2em;
        box-sizing: border-box;
    }

    @media screen and (max-width: 900px) {
        .home__wrapper {
            padding: 2em 0;
        }
    }
    @media screen and (max-width: 600px) {
        align-items: center;
        justify-content: space-between;
        flex-direction: column;
        max-height: none;

        .home__wrapper {
            max-height: none;
            overflow: visible;
        }
    }
}
</style>
