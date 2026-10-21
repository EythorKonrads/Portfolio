<script setup>
import Icon from './Icon.vue';
import TagChip from './TagChip.vue';

defineProps({
  education: {
    type: Object,
    required: true,
    default: () => {},
  },
});
</script>

<template>
  <div class="education-item" data-cy="educationItem">
    <div class="education-item__date" data-cy="educationDates">
      <h3>{{ education.dates }}</h3>
    </div>
    <div class="education-item__wrapper">
      <h3
        v-if="education?.titles"
        class="education-item__title"
        data-cy="educationTitle"
      >
        <template
          v-for="(title, key) in education.titles"
          :key="`${key}-template`"
        >
          <a
            v-if="title?.url"
            :key="`${key}-link`"
            class="education-item__link text-link"
            :href="title?.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ title?.title }}
            <Icon
              name="link"
              :icon="false"
              style="width: 1.25em; margin-left: 0.25em; margin-right: 0.25em"
            />
            |
          </a>
          <span v-else :key="key">
            {{ title?.title }}
          </span>
        </template>
        <span>&nbsp;{{ education.degree }} </span>
      </h3>
      <p v-if="education?.description" class="education-item__desc">
        {{ education.description }}
      </p>
      <div v-if="education?.projects" class="education-item__projects">
        <template v-for="(project, key) in education.projects" :key="key">
          <a
            v-if="project?.url"
            :key="key"
            class="education-item__project text-link"
            :href="project.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <template v-if="key !== 0">| </template>
            <Icon
              name="link"
              :icon="false"
              style="width: 1em; margin-right: 0.25em"
            />
            {{ project.title }}
          </a>
          <span v-else class="education-item__project">
            <template v-if="key !== 0">| </template>
            {{ project.title }}
          </span>
        </template>
      </div>
      <ul v-if="education?.tags" class="education-item__list">
        <li
          v-for="(tag, key) in education.tags"
          :key="key"
          class="education-item__list-item"
          data-cy="educationTag"
        >
          <TagChip :tag="tag" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.education-item {
  display: flex;
  flex-direction: column;
  font-size: 1.25rem;
  padding: 0.5em 0;
}
.education-item__date h3 {
  display: inline;
  width: auto;
  text-transform: uppercase;
  font-size: 0.6em;
  padding: 0.5em 1em 0 0;
  white-space: nowrap;
  color: var(--color-accent);
  letter-spacing: 0.025em;
  font-weight: 600;
}
.education-item__title {
  font-weight: 700;
  color: var(--color-text-muted);
}
.education-item__title span {
  color: var(--color-accent);
}
.education-item__link {
  font-size: 1em;
  font-weight: 700;
}
.education-item__title a {
  a {
    color: var(--color-hdln);
    transition: 0.25s ease-in;

    &:hover {
      color: var(--color-link-hover);
    }
  }
}
.education-item__desc,
.education-item__list,
.education-item__projects {
  font-size: 0.75em;
}
.education-item__projects {
  padding: 0.5em 0;
}
.education-item__projects span {
  color: var(--color-text-muted);
}
.education-item__project {
  margin-right: 0.25em;
}
.education-item__list {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  list-style: none;
  padding-inline-start: 0;
}
.education-item__list-item {
  margin: 0.5em 0.375em 0 0;
  font-size: 0.8em;
}
</style>
