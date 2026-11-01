// A project's popup: its gallery of images and videos, and the Play button
import ProjectsGallery from '../../src/components/ProjectsGallery.vue';
import ProjectsItemPopup from '../../src/components/ProjectsItemPopup.vue';

// Files from public/; the video is never loaded, so it needn't exist
const media = [
  { type: 'video', src: '/clip.mp4', poster: '/og-image.png' },
  { type: 'image', src: '/hhauksson.webp', alt: 'A screenshot' },
  { type: 'image', src: '/og-image.png' },
];

const project = {
  title: 'Test project',
  image: '/og-image.png',
  description: 'A project.',
  technologies: [],
  liveUrl: null,
  githubUrl: null,
};

describe('Projects gallery', () => {
  it('starts on the first item, a muted looping video', () => {
    cy.mount(ProjectsGallery, { props: { media, title: 'Game' } });
    cy.get('[data-cy="galleryVideo"]')
      .should('have.attr', 'src', '/clip.mp4')
      .and('have.attr', 'poster', '/og-image.png')
      .and('have.attr', 'aria-label', 'Game, video 1')
      .and('have.prop', 'muted', true)
      .and('have.prop', 'loop', true)
      .and('have.prop', 'autoplay', true);
    cy.get('[data-cy="galleryImage"]').should('not.exist');
  });

  it('switches items from the thumbnails', () => {
    cy.mount(ProjectsGallery, { props: { media, title: 'Game' } });
    cy.get('[data-cy="galleryThumb"]')
      .should('have.length', 3)
      .first()
      .should('have.attr', 'aria-current', 'true');

    cy.get('[data-cy="galleryThumb"]').eq(1).click();
    cy.get('[data-cy="galleryVideo"]').should('not.exist');
    cy.get('[data-cy="galleryImage"]')
      .should('have.attr', 'src', '/hhauksson.webp')
      .and('have.attr', 'alt', 'A screenshot');
    cy.get('[data-cy="galleryThumb"]')
      .eq(1)
      .should('have.attr', 'aria-current', 'true');

    // Without its own alt, an image is named after the project
    cy.get('[data-cy="galleryThumb"]')
      .eq(2)
      .should('have.attr', 'aria-label', 'Show Game, image 3')
      .click();
    cy.get('[data-cy="galleryImage"]').should(
      'have.attr',
      'alt',
      'Game, image 3'
    );
  });

  it('shows no thumbnails for a single item', () => {
    cy.mount(ProjectsGallery, {
      props: { media: [media[1]], title: 'Game' },
    });
    cy.get('[data-cy="galleryImage"]').should('be.visible');
    cy.get('[data-cy="galleryThumbs"]').should('not.exist');
  });
});

describe('Project popup', () => {
  it('shows the one image when a project has no gallery', () => {
    cy.mount(ProjectsItemPopup, { props: { project, isOpen: true } });
    cy.get('[data-cy="popupTitle"]').should('be.visible');
    cy.get('[data-cy="gallery"]').should('not.exist');
    cy.get('[data-cy="popup"] img').should('have.attr', 'src', '/og-image.png');
  });

  it('shows the gallery when a project has one', () => {
    cy.mount(ProjectsItemPopup, {
      props: { project: { ...project, media }, isOpen: true },
    });
    cy.get('[data-cy="gallery"]').should('be.visible');
  });

  it('offers Play only for a playable project', () => {
    cy.mount(ProjectsItemPopup, { props: { project, isOpen: true } });
    cy.get('[data-cy="popupTitle"]').should('be.visible');
    cy.get('[data-cy="popupPlay"]').should('not.exist');
  });

  it('asks to play from its Play button', () => {
    const onPlay = cy.spy().as('play');
    // Opened after mounting, as on the page: mounted open, it never slides in
    cy.mount(ProjectsItemPopup, {
      props: { project: { ...project, playable: true }, onPlay },
    }).then(({ wrapper }) => wrapper.setProps({ isOpen: true }));
    cy.get('[data-cy="popupPlay"]')
      .should('be.visible')
      .and(($button) => expect($button.text().trim()).to.equal('Play the game'))
      .click();
    cy.get('@play').should('have.been.calledOnce');
  });
});
