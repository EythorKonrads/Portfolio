<script setup>
defineProps({
    tag: {
        type: Object,
        required: true,
    },
})
</script>
<template>
    <li class="tag">
        <div class="tag__wrapper">
            {{ tag.title }}
        </div>
    </li>
</template>

<style lang="scss" scoped>
.tag {
    color: #9393e8;
    background-color: rgba(147, 147, 232, 0.1);
    margin: 0.5em 0.375em 0 0;
    border-radius: 9999px;
    box-sizing: border-box;
    font-size: 0.8em;
}
.tag__wrapper {
    padding: 0.25em 0.75em;
    box-sizing: border-box;
}
</style>
