<script>
import BasePopup from './BasePopup.vue';
import Icon from './Icon.vue';

export default {
  name: 'ProjectsItemPopup',
  components: {
    BasePopup,
    Icon,
  },
  props: {
    project: {
      type: Object,
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      hoveredTooltip: null,
    };
  },
  methods: {
    showTooltip(tooltipKey) {
      this.hoveredTooltip = tooltipKey;
    },
    hideTooltip() {
      this.hoveredTooltip = null;
    },
  },
};
</script>

<template>
  <BasePopup :is-open="isOpen" :label="project.title" @close="$emit('close')">
    <div class="project-item-popup__image">
      <img
        :src="project.image"
        :alt="project.title"
        class="project-item-popup__img"
      />
    </div>
    <div class="project-item-popup__links project-item-popup__links--header">
      <div class="project-item-popup__tooltip-container">
        <a
          v-if="project.githubUrl"
          :href="project.githubUrl"
          target="_blank"
          class="project-item-popup__link"
          @click.stop
          @mouseenter="showTooltip('github')"
          @mouseleave="hideTooltip"
        >
          <Icon
            name="code"
            class="project-item-popup__link-icon project-item-popup__link-icon--code"
          />
        </a>
        <div
          v-if="hoveredTooltip === 'github' && project.githubUrl"
          class="project-item-popup__tooltip"
        >
          View GitHub Repository
        </div>
      </div>
      <div class="project-item-popup__tooltip-container">
        <a
          v-if="project.liveUrl"
          :href="project.liveUrl"
          target="_blank"
          class="project-item-popup__link"
          @click.stop
          @mouseenter="showTooltip('live')"
          @mouseleave="hideTooltip"
        >
          <Icon name="external-link" class="project-item-popup__link-icon" />
        </a>
        <div
          v-if="hoveredTooltip === 'live' && project.liveUrl"
          class="project-item-popup__tooltip"
        >
          View Project
        </div>
      </div>
    </div>
    <div class="project-item-popup__content">
      <h3 class="project-item-popup__title" data-cy="popupTitle">
        {{ project.title }}
      </h3>
      <p
        class="project-item-popup__description"
        v-html="project.description"
      ></p>
      <div class="project-item-popup__technologies">
        <span
          v-for="tech in project.technologies"
          :key="tech"
          class="project-item-popup__tech-tag"
        >
          {{ tech.title }}
        </span>
      </div>
      <div class="project-item-popup__links" data-cy="popupLinks">
        <a
          v-if="project.githubUrl"
          :href="project.githubUrl"
          target="_blank"
          class="project-item-popup__link"
          @click.stop
        >
          View GitHub Repository
          <Icon
            name="code"
            class="project-item-popup__link-icon project-item-popup__link-icon--code"
          />
        </a>
        <a
          v-if="project.liveUrl"
          :href="project.liveUrl"
          target="_blank"
          class="project-item-popup__link"
          @click.stop
        >
          View project
          <Icon name="external-link" class="project-item-popup__link-icon" />
        </a>
      </div>
    </div>
  </BasePopup>
</template>

<style scoped>
.project-item-popup__image {
  width: 100%;
  height: 300px;
  max-height: 300px;
  margin-top: -37px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--color-accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.project-item-popup__img {
  height: 100%;
  width: auto;
  object-fit: contain;
  object-position: center;
}
.project-item-popup__content {
  max-width: 1000px;
  padding: 1rem 2rem;
}
.project-item-popup__title {
  margin: 0 0 0.5rem 0;
  line-height: 1;
  font-size: 2.5rem;
  font-weight: 700;
}
.project-item-popup__description {
  margin: 0;
  line-height: 1.6;
  font-size: 0.95rem;
  overflow: visible;
  -webkit-line-clamp: unset;
  line-clamp: unset;
  white-space: pre-line;
}
.project-item-popup__description :deep(b) {
  font-weight: 600;
  font-size: 1.15rem;
}
.project-item-popup__technologies {
  margin-top: 1rem;
}
.project-item-popup__tech-tag {
  display: inline-block;
  color: var(--color-accent);
  background-color: var(--color-accent-soft);
  padding: 0.25em 0.75em;
  margin: 0.5em 0.375em 0 0;
  border-radius: 9999px;
  box-sizing: border-box;
  font-size: 0.8em;
}
.project-item-popup__links {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem 0;
}
.project-item-popup__links--header {
  justify-content: flex-end;
  width: 100%;
  margin: 1rem 0 0 0;
  padding: 0 1.75rem;
  box-sizing: border-box;
}
.project-item-popup__tooltip-container {
  position: relative;
  display: inline-block;
}
.project-item-popup__tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgb(32 39 65);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  margin-bottom: 0.5rem;
  z-index: 1001;
  opacity: 0;
  animation: tooltipFadeIn 0.2s ease-out forwards;
  max-width: calc(100vw - 4rem);
  box-sizing: border-box;
}
.project-item-popup__tooltip-container:last-child .project-item-popup__tooltip {
  left: auto;
  right: 0;
  transform: none;
}
.project-item-popup__tooltip-container:last-child
  .project-item-popup__tooltip::after {
  left: auto;
  right: 1rem;
  transform: none;
}
.project-item-popup__tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgb(32 39 65);
}
@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
.project-item-popup__tooltip-container:last-child .project-item-popup__tooltip {
  animation: tooltipFadeInRight 0.2s ease-out forwards;
}
@keyframes tooltipFadeInRight {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.project-item-popup__link {
  display: flex;
  align-items: center;
  padding: 0.5em 1.25em;
  text-decoration: none;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 1em;
  box-sizing: border-box;
  transition: background-color 0.3s ease;
  color: var(--color-accent);
  background-color: var(--color-accent-soft);
}
.project-item-popup__links--header .project-item-popup__link {
  padding: 0.25em;
}
.project-item-popup__link:hover {
  background-color: var(--color-accent-soft-hover);
}
.project-item-popup__link-icon {
  width: 30px;
  height: 30px;
  padding: 0.375em 0.565em;
  box-sizing: border-box;
}
.project-item-popup__link-icon--code {
  padding: 0.375em;
}
.project-item-popup__links--header .project-item-popup__link-icon {
  margin: 0;
}
.project-item-popup__link-icon :deep(path) {
  fill: var(--color-accent);
}
</style>
