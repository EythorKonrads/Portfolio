<script setup>
import Social from './Social.vue';
</script>

<template>
  <div class="hero" data-cy="hero">
    <div class="hero__wrapper">
      <div class="hero__card">
        <div class="hero__image" data-cy="heroImage"></div>
        <div class="hero__texts">
          <h1 class="hero__hdln">Eythor Konradsson</h1>
          <h2 class="hero__secondary-hdln">Lead Frontend Developer</h2>
        </div>
      </div>
      <div class="hero__info">
        <p class="hero__text" data-cy="heroText">
          Based in Copenhagen, Denmark, with 7+ years of experience working
          primarily with Vue.js and JavaScript, and additional experience in
          React. Strong focus on front-end architecture, performance, and
          building well-structured, scalable applications. <br />I also have
          experience as both a product owner and lead developer, where I have
          been responsible for planning and delegating tasks to developers and
          designers.
        </p>
      </div>
    </div>
    <div class="hero__links" data-cy="heroLinks">
      <Social />
      <a href="mailto:kh.krimper@gmail.com" class="hero__mail">
        Lets talk
        <el-icon class="hero__mail-icon" :size="20">
          <Promotion />
        </el-icon>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hero {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  max-width: 450px;
  min-width: 300px;
  box-sizing: border-box;
  background-color: var(--color-background-overlay);
  padding: 1.5rem;

  .hero__wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 100%;
  }
  .hero__card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
  }
  .hero__image {
    height: 100px;
    width: 100px;
    border-radius: 50%;
    background: url('../assets/profile_1.jpg') center no-repeat;
    background-size: cover;
    box-shadow: var(--color-box-shadow) 0px 3px 8px;
  }
  .hero__texts {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    box-sizing: border-box;
  }
  .hero__hdln {
    text-align: center;
    font-size: 2rem;
    color: var(--color-hdln);
  }
  .hero__info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .hero__secondary-hdln {
    font-size: 1rem;
    color: var(--color-hdln);
  }
  .hero__text {
    font-size: 0.8rem;
    color: var(--color-text);
    text-align: center;
  }
  .hero__text span {
    font-size: 1rem;
    font-weight: 800;
  }
  .hero__links {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  .hero__mail {
    display: flex;
    align-items: center;
    align-self: center;
    color: var(--color-link);
    font-size: 1rem;
    transition: 0.25s ease;
  }
  .hero__mail:hover {
    color: var(--color-link-hover);
  }
  .hero__mail-icon {
    margin-left: 0.5em;
  }
  @media screen and (max-width: 750px) {
    min-width: 250px;
  }
  @media screen and (max-width: 600px) {
    height: auto;
    max-width: none;

    .hero__links {
      flex-direction: column;
    }
  }
}
</style>
