<script setup>
import Hero from '../components/Hero.vue';
import Experience from '../components/Experience.vue';
import Education from '../components/Education.vue';
import Projects from '../components/Projects.vue';
import TagFilter from '../components/TagFilter.vue';
import SectionNav from '../components/SectionNav.vue';
</script>

<template>
  <div class="home">
    <Hero class="home__hero" />
    <div class="home__wrapper" data-cy="homeWrapper">
      <header class="home__header" data-cy="homeHeader">
        <SectionNav />
        <TagFilter class="home__filter" />
      </header>
      <Experience class="home__experience" />
      <Education class="home__education" />
      <Projects class="home__projects" />
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
    /* Fill the space beside the hero regardless of content width */
    flex: 1 1 0;
    min-width: 0;
    max-height: 100vh;
    overflow: auto;
    padding: 0 2em 2em;
    box-sizing: border-box;
  }
  /* Sticks to the top of the content column, which is what scrolls here */
  .home__header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    height: var(--header-height);
    padding: 0 2rem;
    margin-bottom: 1.5rem;
    box-sizing: border-box;
    background-color: rgba(15, 23, 42, 1);
  }
  .home__filter {
    flex-shrink: 0;
  }
  /* Keep a section's heading clear of the header when jumped to */
  .home__experience,
  .home__education,
  .home__projects {
    scroll-margin-top: var(--header-height);
  }
  .home__education {
    margin-top: 2em;
  }

  @media screen and (max-width: 900px) {
    .home__wrapper {
      padding: 0 0 2em;
    }
  }
  @media screen and (max-width: 600px) {
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
    max-height: none;
    /* Room for the fixed header above the hero */
    padding-top: var(--header-height);
    box-sizing: border-box;

    .home__wrapper {
      flex: none;
      width: 100%;
      max-height: none;
      overflow: visible;
    }
    /* The page scrolls here, so pin the header above everything, hero too */
    .home__header {
      position: fixed;
      left: 0;
      right: 0;
      padding: 0 1rem;
      box-shadow: 0 1px 0 rgba(147, 147, 232, 0.1);
    }
  }
}
</style>
