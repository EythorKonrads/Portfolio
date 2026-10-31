<script setup>
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="app">
    <RouterView />
  </div>
</template>

<style lang="scss">
@use './scss/main.scss';
</style>
<style lang="scss" scoped>
.app {
  min-height: 100vh;
  height: auto;
  overflow-x: hidden;
  color: var(--color-text);
  background: var(--color-background);
  transition:
    color 0.5s,
    background-color 0.5s;
  line-height: 1.6;
  font-family: var(--font-body);
  font-size: 15px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
