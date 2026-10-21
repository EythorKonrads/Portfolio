<script setup>
import Icon from './Icon.vue';
</script>

<template>
  <div class="social">
    <ul class="social__wrapper">
      <li class="social__item">
        <el-link
          class="social__link"
          underline="never"
          href="https://github.com/EythorKonrads"
          aria-label="GitHub (opens in a new tab)"
          data-cy="socialGithub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="github" class="social__icon o-icon" />
        </el-link>
      </li>
      <li class="social__item">
        <el-link
          class="social__link"
          underline="never"
          href="https://www.linkedin.com/in/eythork/"
          aria-label="LinkedIn (opens in a new tab)"
          data-cy="socialLinkedin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="linkedin" class="social__icon o-icon" />
        </el-link>
      </li>
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
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .social__link {
    text-decoration: none;
    padding: 0.5rem;
  }
  .social__item:first-child .social__link {
    padding-left: 0;
  }
  .social__item:last-child .social__link {
    padding-right: 0;
  }
}
</style>
