<script>
import Icon from './Icon.vue';

export default {
  name: 'ProjectsItemPopup',
  components: {
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
  data() {
    return {
      isAnimating: false,
      hoveredTooltip: null,
      isScrolledPastImage: false,
    };
  },
  watch: {
    isOpen(newValue) {
      if (newValue) {
        document.body.style.overflow = 'hidden';
        this.$nextTick(() => {
          setTimeout(() => {
            this.isAnimating = true;
          }, 10);
        });
      } else {
        this.isAnimating = false;
        document.body.style.overflow = '';
      }
    },
  },
  beforeUnmount() {
    document.body.style.overflow = '';
  },
  methods: {
    close() {
      this.isAnimating = false;
      setTimeout(() => {
        this.$emit('close');
        document.body.style.overflow = '';
      }, 400);
    },
    handleScroll(event) {
      const popup = event.target;
      const imageHeight = 300; // Height of the image section
      this.isScrolledPastImage = popup.scrollTop > imageHeight - 50; // 50px buffer
    },
    showTooltip(tooltipKey) {
      this.hoveredTooltip = tooltipKey;
    },
    hideTooltip() {
      this.hoveredTooltip = null;
    },
  },
  emits: ['close'],
};
</script>

<template>
  <div
    v-if="isOpen"
    class="project-item-popup__backdrop"
    data-cy="popupBackdrop"
    :class="{ 'project-item-popup__backdrop--visible': isAnimating }"
    @click="close"
  >
    <div
      class="project-item-popup"
      data-cy="popup"
      :class="{ 'project-item-popup--visible': isAnimating }"
      @click.stop
      @scroll="handleScroll"
    >
      <div
        class="project-item-popup__close"
        data-cy="popupClose"
        :class="{ 'project-item-popup__close--scrolled': isScrolledPastImage }"
        @click="close"
      >
        <Icon name="close" class="social__icon o-icon" />
      </div>
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
    </div>
  </div>
</template>

<style scoped>
.project-item-popup__backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0);
  z-index: 998;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}
.project-item-popup__backdrop--visible {
  background-color: rgba(0, 0, 0, 0.5);
}
.project-item-popup {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90vw;
  max-width: 1200px;
  height: 90vh;
  max-height: 800px;
  background-color: rgb(15, 23, 42);
  transform: translateY(100vh);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 8px;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
  overflow-y: auto;
  overflow-x: hidden;
  cursor: default;
}
.project-item-popup--visible {
  transform: translateY(0);
}
.project-item-popup__close {
  position: sticky;
  top: 1.75rem;
  align-self: flex-end;
  margin-right: 1.75rem;
  background-color: rgb(15, 23, 42);
  padding: 0.4rem;
  border-radius: 50%;
  transition: 0.3s ease;
  z-index: 1000;
  cursor: pointer;
}
.project-item-popup__close--scrolled {
  background-color: rgb(29 36 62);
}
.project-item-popup__close:hover {
  background-color: rgb(46 52 86);
}
.project-item-popup__close .icon {
  width: 1.5rem;
  height: 1.5rem;
}
.project-item-popup__close :deep(path) {
  fill: #9393e8;
}
.project-item-popup__image {
  width: 100%;
  height: 300px;
  max-height: 300px;
  margin-top: -37px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: rgba(147, 147, 232, 0.1);
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
  color: #9393e8;
  background-color: rgba(147, 147, 232, 0.1);
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
  color: #9393e8;
  background-color: rgba(147, 147, 232, 0.1);
}
.project-item-popup__links--header .project-item-popup__link {
  padding: 0.25em;
}
.project-item-popup__link:hover {
  background-color: rgba(147, 147, 232, 0.2);
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
  fill: #9393e8;
}
</style>
