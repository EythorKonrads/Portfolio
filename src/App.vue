<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterView } from 'vue-router'
// import Header from './components/Header.vue'

const toggleSwitch = ref(false)

onMounted(async () => {
  const setTheme = localStorage.getItem("theme")
  toggleSwitch.value = setTheme && setTheme === 'light' ? false : true
})

watch(toggleSwitch, val => {
  const htmlElement = document.querySelector('html')
  if (val) {
    localStorage.setItem('theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    htmlElement.classList.remove('light')
    htmlElement.classList.add('dark')
  } else {
    localStorage.setItem('theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    htmlElement.classList.remove('dark')
    htmlElement.classList.add('light')
  } 
})
</script>

<template>
  <div class="app">
    <!-- <Header /> -->
    <RouterView />
  </div>
</template>

<style lang="scss">
@import './scss/main.scss';
</style>
<style lang="scss" scoped>
.app {
  min-height: 100vh;
  height: auto;
  overflow-x: hidden;
  color: var(--color-text);
  background: var(--color-background);
  transition: color 0.5s, background-color 0.5s;
  line-height: 1.6;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
  font-size: 15px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
