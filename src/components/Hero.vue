<script setup>
import Icon from './Icon.vue';
import Social from './Social.vue';
</script>

<template>
  <div class="hero" data-cy="hero">
    <div class="hero__wrapper">
      <div class="hero__card">
        <div
          class="hero__image anim-fade-up"
          style="--anim-delay: 0ms"
          data-cy="heroImage"
        ></div>
        <div class="hero__texts">
          <h1
            class="hero__hdln anim-fade-up"
            data-cy="heroName"
            style="--anim-delay: 80ms"
          >
            Eythor Konradsson
          </h1>
          <h2
            class="hero__secondary-hdln anim-fade-up"
            data-cy="heroRole"
            style="--anim-delay: 160ms"
          >
            Lead Frontend Developer
          </h2>
        </div>
      </div>
      <div class="hero__info">
        <p
          class="hero__text anim-fade-up"
          style="--anim-delay: 240ms"
          data-cy="heroText"
        >
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
    <div
      class="hero__links anim-fade-up"
      style="--anim-delay: 320ms"
      data-cy="heroLinks"
    >
      <Social />
      <a
        href="mailto:kh.krimper@gmail.com"
        class="hero__mail"
        data-cy="heroMail"
      >
        Lets talk
        <Icon name="promotion" :icon="false" class="hero__mail-icon" />
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
  /* Sized by the viewport only, so filtering the content can't resize it */
  flex-shrink: 0;
  width: clamp(300px, 30vw, 450px);
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
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    /* 0.5em of the 20px icon wrapper this used to sit in */
    margin-left: 10px;
  }
  @media screen and (max-width: 750px) {
    width: clamp(250px, 30vw, 450px);
  }
  @media screen and (max-width: 600px) {
    height: auto;
    width: 100vw;

    .hero__links {
      flex-direction: column;
    }
  }
}
</style>
