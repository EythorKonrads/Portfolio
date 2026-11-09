// A project's card in the Projects list
import ProjectsItem from '../../src/components/ProjectsItem.vue';

const portraitImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="950"></svg>'
)}`;

describe('Projects item', () => {
  it('keeps a portrait image from making the card taller', () => {
    cy.viewport(1280, 800);
    cy.mount(ProjectsItem, {
      props: {
        project: {
          title: 'Test project',
          image: portraitImage,
          description: 'A project.',
          technologies: [],
          liveUrl: null,
          githubUrl: null,
        },
      },
      global: { directives: { reveal: {} } },
    });

    cy.get('[data-cy="projectImage"]').should(($img) => {
      expect($img[0].naturalHeight, 'image loaded').to.equal(950);
      // The card's min-height, which short content leaves it at
      expect($img[0].getBoundingClientRect().height).to.be.closeTo(100, 1);
    });
  });
});
