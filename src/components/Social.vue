<script setup>
import Icon from './Icon.vue'
</script>

<template>
  <div class="social">
    <ul class="social__wrapper">
        <el-link class="social__link" :underline="false" href="https://github.com/ekonrads" target="_blank" rel="noopener noreferrer">
          <Icon name="github" class="social__icon o-icon" />
        </el-link>
        <el-link class="social__link" :underline="false" href="https://www.linkedin.com/in/ekonrads/" target="_blank" rel="noopener noreferrer">
          <Icon name="linkedin" class="social__icon o-icon" />
        </el-link>
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
    padding: .5rem;
  }
  .social__link:first-child {
    padding-left: 0;
  }
  .social__link:last-child {
    padding-right: 0;
  }
}
</style>
