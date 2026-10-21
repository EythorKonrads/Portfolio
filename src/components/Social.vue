<script setup>
import Icon from './Icon.vue';
</script>

<template>
  <div class="social">
    <ul class="social__wrapper">
      <a
        class="social__link text-link"
        href="https://github.com/EythorKonrads"
        data-cy="socialGithub"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="github" class="social__icon o-icon" />
      </a>
      <a
        class="social__link text-link"
        href="https://www.linkedin.com/in/eythork/"
        data-cy="socialLinkedin"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="linkedin" class="social__icon o-icon" />
      </a>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.social {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  .social__wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .social__link {
    text-decoration: none;
    padding: 0.5rem;
  }
  .social__link:first-child {
    padding-left: 0;
  }
  .social__link:last-child {
    padding-right: 0;
  }
}
</style>
