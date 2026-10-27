<script setup>
import Hero from '../components/Hero.vue';
import Experience from '../components/Experience.vue';
import Education from '../components/Education.vue';
import Projects from '../components/Projects.vue';
import TagFilter from '../components/TagFilter.vue';
import SectionNav from '../components/SectionNav.vue';
import ThemeToggle from '../components/ThemeToggle.vue';
import HeroAurora from '../components/HeroAurora.vue';
import { useTheme } from '@/composables/useTheme';

const { theme } = useTheme();
</script>

<template>
  <div class="home">
    <!-- Real auroras only show against a dark sky -->
    <HeroAurora v-if="theme === 'dark'" />
    <Hero class="home__hero" />
    <div class="home__wrapper" data-cy="homeWrapper">
      <header class="home__header" data-cy="homeHeader">
        <SectionNav />
        <div class="home__actions">
          <ThemeToggle />
          <TagFilter class="home__filter" />
        </div>
      </header>
      <Experience class="home__experience" />
      <Education class="home__education" />
      <Projects class="home__projects" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home {
  /* Its own stacking context, so the Aurora's z-index: -1 stays inside it */
  position: relative;
  isolation: isolate;
  background-color: var(--color-background);
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
  }
  /* See-through so the Aurora shows, blurred so content scrolling under it
     doesn't. On a pseudo-element: a backdrop-filter on the header itself
     would break the filter popup's fixed backdrop. */
  .home__header::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-color: var(--color-header-background);
    backdrop-filter: blur(12px);
  }
  .home__actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 0.5rem;
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
      box-shadow: 0 1px 0 var(--color-accent-soft);
    }
  }
  /* Room for the nav, theme toggle and filter on the smallest phones */
  @media screen and (max-width: 360px) {
    .home__header {
      gap: 0.75rem;
      padding: 0 0.75rem;
    }
    .home__actions {
      gap: 0.375rem;
    }
  }
}
</style>
