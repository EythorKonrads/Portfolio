<script setup>
import Social from './Social.vue'
</script>

<template>
  <div class="hero">
    <div class="hero__wrapper">
      <h1 class="hero__hdln">
        Eythor Konradsson
      </h1>
      <p class="hero__text">
        As an experienced front-end developer based in Denmark, I specialize in Vue.js, JavaScript, scss and software arcitecture to craft exceptional web applications. With over 5 years of expertise, I bring creativity, efficiency, logigal thinking and cutting-edge solutions to every project.
        <br />
        <span>Let's collaborate and bring your digital vision to life!</span>
      </p>
    </div>
    <Social />
  </div>
</template>

<style lang="scss" scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 50vh;
  width: 100vw;
  background: url('../assets/profile_1.png') center no-repeat;
  background-size: cover;

  .hero__wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background-color: var(--color-background-overlay);
    max-width: 66vw;  
    padding: 1.5rem;
    border-radius: .5rem;
  }
  .hero__hdln {
    font-size: 1.5rem;
    text-align: center;
    color: var(--color-hdln);
  }
  .hero__text {
    font-size: .75rem;
    text-align: center;
    color: var(--color-text);
  }
  .hero__text span {
    font-size: 1rem;
    font-weight: 800;
  }
}
</style>
