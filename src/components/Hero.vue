<script setup>
import Social from './Social.vue'
</script>

<template>
  <div class="hero">
    <div class="hero__wrapper">
      <div class="hero__card">
        <div class="hero__image"></div>
        <div class="hero__texts">
          <h1 class="hero__hdln">
            Eythor Konradsson
          </h1>
          <h2 class="hero__secondary-hdln">
            Lead Frontend Developer
          </h2>
          <Social />
        </div>
      </div>
      <div class="hero__info">
        <h3 class="hero__secondary-hdln">About me</h3>
        <p class="hero__text">
          Experienced front-end developer based in Copenhagen Denmark, I specialize in Vue.js, JavaScript and software architecture. With over 7 years of expertise, I bring creativity, efficiency, logical thinking and tailored solutions to every project.
        </p>
        <a href="mailto:hello@ekonrads.com" class="hero__mail">
          Lets talk <el-icon class="hero__mail-icon" :size="20"><Promotion /></el-icon>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  padding: 1.5rem;
  box-sizing: border-box;

  .hero__wrapper {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    max-width: 550px;
    height: auto;
    background-color: var(--color-background-overlay);
    padding: 1.5rem;
    border-radius: .5rem;
  }
  .hero__card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }
  .hero__image {
    height: 100px;
    width: 100px;
    border-radius: 50%;
    background: url('../assets/profile_1.jpg') center no-repeat;
    background-size: cover;
    box-shadow:  var(--color-box-shadow) 0px 3px 8px;
  }
  .hero__texts {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    padding: 0 0 0 2rem;
    box-sizing: border-box;
  }
  .hero__hdln {
    font-size: 2rem;
    color: var(--color-hdln);
  }
  .hero__info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .hero__secondary-hdln {
    font-size: 1rem;
    color: var(--color-hdln);
  }
  .hero__text {
    font-size: .8rem;
    color: var(--color-text);
  }
  .hero__text span {
    font-size: 1rem;
    font-weight: 800;
  }
  .hero__mail {
    display: flex;
    align-items: center;
    align-self: flex-end;
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
  
  @media screen and (max-width: 600px) {
    .hero__wrapper,
    .hero__texts, 
    .hero__info {
      align-items: center;
    }
    .hero__texts {
      padding: 0;
    }
    .hero__text {
      text-align: center;
    }
    .hero__card {
      flex-direction: column;
      margin-bottom: 0;
    }
    .hero__mail {
      align-self: center;
      margin-top: 1rem;
    }
  }
}
</style>
