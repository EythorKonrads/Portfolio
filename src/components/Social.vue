<script setup>
import Icon from './Icon.vue'
</script>

<template>
  <div class="social">
    <ul class="social__wrapper">
        <a class="social__link" href="https://github.com/ekonrads" target="_blank" rel="noopener noreferrer">
          <Icon name="github" class="social__icon o-icon" />
        </a>
        <a class="social__link" href="https://www.linkedin.com/in/ey%C3%BE%C3%B3r-konr%C3%A1%C3%B0sson-285587130/" target="_blank" rel="noopener noreferrer">
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

  .social__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
