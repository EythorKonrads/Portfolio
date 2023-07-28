<script setup>
import Hero from '../components/Hero.vue'
</script>

<template>
  <div class="home">
    <div class="home__waves"></div>
    <Hero class="home__hero" />
  </div>
</template>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  height: 100%;
  width: 100%;
  max-height: 100vh;
  max-width: 100vw;
  display: flex;
  align-items: center;
  flex-direction: column;
  overflow: hidden;

  .home__waves {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 200vw;
    background-color: rgba(15, 23, 42, 1);
    --mask:
    radial-gradient(11.18em at 50% calc(100% - 15.00em),#000 99%,#0000 101%) calc(50% - 10em) 0/20em 100%,
    radial-gradient(11.18em at 50% calc(100% + 10.00em),#0000 99%,#000 101%) 50% calc(100% - 5em)/20em 100% repeat-x;
    -webkit-mask: var(--mask);
    mask: var(--mask);
    z-index: 1;
  }
  .home__hero {
    z-index: 2;
  }
}
</style>
