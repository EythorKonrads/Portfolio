<script>
import ProjectsItemPopup from './ProjectsItemPopup.vue';

export default {
  name: 'ProjectsItem',
  components: {
    ProjectsItemPopup,
  },
  props: {
    project: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isOpen: false,
    };
  },
  methods: {
    toggleOpen() {
      this.isOpen = true;
    },
    closePopup() {
      this.isOpen = false;
    },
  },
};
</script>

<template>
  <div>
    <div class="project-item" @click="toggleOpen">
      <div class="project-item__image">
        <img
          :src="project.image"
          :alt="project.title"
          class="project-item__img"
        />
      </div>
      <div class="project-item__content">
        <h3 class="project-item__title">{{ project.title }}</h3>
        <p class="project-item__description" v-html="project.description"></p>
        <div class="project-item__technologies">
          <span
            v-for="tech in project.technologies"
            :key="tech"
            class="project-item__tech-tag"
          >
            {{ tech.title }}
          </span>
        </div>
      </div>
    </div>

    <ProjectsItemPopup
      :project="project"
      :is-open="isOpen"
      @close="closePopup"
    />
  </div>
</template>

<style scoped>
.project-item {
  display: flex;
  min-height: 100px;
  padding: 1rem;
  border-radius: 8px;
  transition: transform 0.3s ease;
}
.project-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
.project-item__image {
  display: flex;
}
.project-item__img {
  width: 160px;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}
.project-item__content {
  padding: 0 1rem 0 1rem;
}
.project-item__title {
  margin: 0 0 0.5rem 0;
  line-height: 1;
  font-size: 1rem;
  font-weight: 700;
}
.project-item__description {
  margin: 0;
  line-height: 1.6;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: pre-line;
}
.project-item__technologies {
  font-size: 0.9em;
}
.project-item__tech-tag {
  display: inline-block;
  color: #9393e8;
  background-color: rgba(147, 147, 232, 0.1);
  padding: 0.25em 0.75em;
  margin: 0.5em 0.375em 0 0;
  border-radius: 9999px;
  box-sizing: border-box;
  font-size: 0.9em;
}
@media screen and (max-width: 750px) {
  .project-item {
    flex-direction: column;
    min-height: auto;
  }
  .project-item__img {
    width: 100%;
    height: 120px;
    margin-bottom: 0.5rem;
  }
  .project-item__content {
    padding: 0;
  }
  .project-item__technologies {
    font-size: 0.8em;
  }
}
</style>
