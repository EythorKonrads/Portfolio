<script setup>
import { RouterLink } from 'vue-router'
import { onMounted, ref, watch } from 'vue';

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
  <el-menu
    class="header"
    mode="horizontal"
    :ellipsis="false"
  >
      <nav class="header__links">
        <el-menu-item><RouterLink class="header__link" to="/">Home</RouterLink></el-menu-item>
        <el-menu-item><RouterLink class="header__link" to="/about">About</RouterLink></el-menu-item>
        <el-menu-item><RouterLink class="header__link" to="/contact">Contact Me</RouterLink></el-menu-item>
      </nav>
      <el-menu-item>
        <el-switch
          v-model="toggleSwitch"
          size="large"
          inline-prompt
          style="--el-switch-on-color: darkgray; --el-switch-off-color: yellow"
          active-icon="Moon"
          nactive-icon="Sunny"
        />
      </el-menu-item>
    </el-menu>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  width: 100vw;

  .header__links {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 2em;
    box-sizing: border-box;
  }
  .header__link {
    color: var(--text-color);
    transition: 0.2s ease-in;

    &:hover {
      color: white;
    }
  }
}
</style>
