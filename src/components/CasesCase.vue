<script setup>
const props = defineProps({
    case: {
        type: Object,
        required: true,
    },
})
</script>
<template>
    <div class="cases">
        <h1>Cases</h1>
        <ul class="cases__list">
            <li class="cases__case">
                <h2 class="cases__title">Case 1</h2>
                <p class="cases__description">Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.</p>
                <a
                    href="#"
                    class="cases__link"
                >
                    Read more
                </a>
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
.case {
}
.cases__list {
}
.cases__case {
}
.cases__title {
}
.cases__description {
}
.cases__link {
}
</style>
