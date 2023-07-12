<script setup>
import Hero from '../components/Hero.vue'
</script>

<template>
  <div class="home">
    <Hero />
  </div>
</template>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  background-color: rgba(tomato, 0.25);
}
</style>
