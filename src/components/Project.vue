<script setup>
import Tags from './Tags.vue'
const props = defineProps({
    project: {
        type: Object,
        required: true,
    },
})
</script>
<template>
    <div class="project">
        <div class="project__wrapper">
            <h3
                v-if="project?.title"
                class="project__title"
            >
                <el-link
                    v-if="project?.title?.url"
                    :key="`${key}-link`"
                    class="project__link"
                    :underline="false"
                    :href="project?.title?.url"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {{ project?.title?.text }} <Promotion style="width: 1em; margin-left: 0.25em" />
                </el-link>
                <span v-else>
                    {{ project?.title?.text }}
                </span>
            </h3>
            <p
                v-if="project?.description"
                class="project__desc"
            >
                {{ project.description }}
            </p>
            <Tags
                v-if="project?.tags"
                :tags="project?.tags"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.project {
    display: flex;
    flex-direction: column;
    font-size: 1.25rem;
    padding: 0.5em 0;
}
.project__date h3 {
    display: inline;
    width: auto;
    text-transform: uppercase;
    font-size: 0.6em;
    padding: 0.5em 1em 0 0;
    white-space: nowrap;
    color: rgba(100, 116, 139, 1);
    letter-spacing: 0.025em;
    font-weight: 600;
}
.project__title {
    font-weight: 700;
    color: rgba(100, 116, 139, 1);
}
.project__link {
    font-size: 1em;
    font-weight: 700;
}
.project__title a {
    a {
        color: white;
        transition: 0.25s ease-in;

        &:hover {
            color: var(--color-link-hover);
        }
    }
}
.project__desc {
    font-size: 0.75em;
}
</style>
