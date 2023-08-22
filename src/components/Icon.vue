<script setup>
import {defineAsyncComponent} from 'vue'

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
})

const dynamicIcon = defineAsyncComponent(() => {
    try {
        return import(`../assets/icons/${props.name}.svg`)
    } catch (ex) {
        const {message} = ex
        console.warn(message)
        return false
    }
})
</script>

<template>
    <template v-if="dynamicIcon">
        <component
            :is="dynamicIcon"
            :class="{icon: icon}"
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
