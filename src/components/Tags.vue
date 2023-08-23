<script setup>
import Tag from './Tag.vue'

defineProps({
    tags: {
        type: Object,
        required: true,
    },
})
</script>
<template>
    <ul
        v-if="tags"
        class="tags"
    >
        <template
            v-for="tag in tags"
            :key="tag.id"
        >
            <Tag :tag="tag" />
        </template>
    </ul>
</template>

<style lang="scss" scoped>
.tags {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    font-size: 0.75em;
}
</style>
