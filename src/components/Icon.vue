<script setup>
import { defineAsyncComponent, h } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: Boolean,
    required: false,
    default: true,
  },
});

// Takes the icon's classes, and so its size, until the SVG loads, so the
// page doesn't shift (and cut short a smooth scroll) when it arrives
const IconPlaceholder = () => h('span', { 'aria-hidden': 'true' });

const dynamicIcon = defineAsyncComponent({
  loader: () => {
    try {
      return import(`../assets/icons/${props.name}.svg`);
    } catch (ex) {
      const { message } = ex;
      console.warn(message);
      return false;
    }
  },
  loadingComponent: IconPlaceholder,
  delay: 0,
});
</script>

<template>
  <template v-if="dynamicIcon">
    <component
      :is="dynamicIcon"
      :class="{ icon: icon }"
      aria-hidden="true"
      focusable="false"
    />
  </template>
</template>

<style lang="scss" scoped>
.icon {
  display: block;
  width: 25px;
  height: 1.7em;
  color: currentColor;
  fill: currentColor;
}
</style>
