<script setup>
import Tags from './Tags.vue'
defineProps({
    job: {
        type: Object,
        required: true,
        default: () => {},
    },
})
</script>

<template>
    <div class="expirience-job">
        <div class="expirience-job__date">
            <h3>{{ job.dates }}</h3>
        </div>
        <div class="expirience-job__wrapper">
            <h3
                v-if="job?.titles"
                class="expirience-job__title"
            >
                <template v-for="(title, key) in job.titles">
                    <el-link
                        v-if="title?.url"
                        :key="`${key}-link`"
                        class="expirience-job__link"
                        :underline="false"
                        :href="title?.url"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {{ title?.title }} <Promotion style="width: 1em; margin-left: 0.25em" />
                    </el-link>
                    <span
                        v-else
                        :key="key"
                    >
                        {{ title?.title }}
                    </span>
                    <br
                        v-if="key !== title.length - 1"
                        :key="key"
                    />
                </template>
            </h3>
            <p
                v-if="job?.description"
                class="expirience-job__desc"
            >
                {{ job.description }}
            </p>
            <div
                v-if="job?.projects"
                class="expirience-job__projects"
            >
                <template
                    v-for="(project, key) in job.projects"
                    :key="key"
                >
                    <el-link
                        v-if="project?.url"
                        :key="key"
                        class="expirience-job__project"
                        :underline="false"
                        :href="project.url"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Link style="width: 1em; margin-right: 0.25em" />{{ project.title }}
                    </el-link>
                    <span
                        v-else
                        class="expirience-job__project"
                    >
                        {{ project.title }}
                    </span>
                </template>
            </div>
            <Tags
                v-if="job?.tags"
                :tags="job?.tags"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.expirience-job {
    display: flex;
    flex-direction: column;
    font-size: 1.25rem;
    padding: 0.5em 0;
}
.expirience-job__date h3 {
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
.expirience-job__title {
    font-weight: 700;
    color: rgba(100, 116, 139, 1);
}
.expirience-job__link {
    font-size: 1em;
    font-weight: 700;
}
.expirience-job__title a {
    a {
        color: white;
        transition: 0.25s ease-in;

        &:hover {
            color: var(--color-link-hover);
        }
    }
}
.expirience-job__desc,
.expirience-job__projects {
    font-size: 0.75em;
}
.expirience-job__projects {
    padding: 0.5em 0;
}
.expirience-job__projects span {
    color: rgb(100, 116, 139);
}
.expirience-job__project {
    font-size: var(--el-link-font-size);
    margin-right: 0.25em;
}
</style>
