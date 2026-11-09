import projects from '../../src/assets/projects.json';

describe('Projects', () => {
  beforeEach(() => {
    cy.visitHome();
  });

  it('has a heading', () => {
    cy.get('[data-cy="projects"] h2')
      .scrollIntoView()
      .should('be.visible')
      .and('have.text', 'Projects');
  });

  it('renders one card per project in projects.json', () => {
    cy.get('[data-cy="projectCard"]').should('have.length', projects.length);
  });

  projects.forEach((project, index) => {
    describe(`project ${index + 1}: ${project.title}`, () => {
      beforeEach(() => {
        cy.get('[data-cy="projectCard"]').eq(index).scrollIntoView().as('card');
        cy.get('@card').should('be.visible');
        // Opens the card from its title: a tag chip at the centre would filter
        cy.get('@card').find('[data-cy="projectTitle"]').as('cardTitle');
      });

      it('shows title, loaded image and technologies', () => {
        cy.get('@card')
          .find('[data-cy="projectTitle"]')
          .should('have.text', project.title);
        cy.get('@card')
          .find('[data-cy="projectImage"]')
          .should('have.attr', 'alt', project.title)
          .and(($img) => {
            expect($img[0].naturalWidth, 'image loaded').to.be.greaterThan(0);
          });
        cy.get('@card')
          .find('[data-cy="projectTag"]')
          .should('have.length', project.technologies.length);
      });

      it('opens a popup with details and links', () => {
        cy.get('[data-cy="popup"]').should('not.exist');
        cy.get('@cardTitle').click();

        cy.get('[data-cy="popup"]')
          .should('be.visible')
          .and('have.class', 'base-popup--visible');
        cy.get('body').should('have.css', 'overflow', 'hidden');
        cy.get('[data-cy="popupTitle"]').should('contain.text', project.title);

        [project.liveUrl, project.githubUrl].filter(Boolean).forEach((url) => {
          cy.get('[data-cy="popupLinks"]')
            .find(`a[href="${url}"]`)
            .should('be.visible')
            .and('have.attr', 'target', '_blank');
        });
        // The icon-only links in the popup header are named for screen readers
        [
          ['popupLiveIcon', project.liveUrl, 'View project'],
          ['popupGithubIcon', project.githubUrl, 'GitHub'],
        ].forEach(([name, url, label]) => {
          if (!url) {
            cy.get(`[data-cy="${name}"]`).should('not.exist');
            return;
          }
          cy.get(`[data-cy="${name}"]`)
            .should('have.attr', 'href', url)
            .and('have.attr', 'rel', 'noopener noreferrer')
            .and('have.attr', 'aria-label')
            .and('include', label);
        });
      });

      it('closes the popup with the close button', () => {
        cy.get('@cardTitle').click();
        cy.get('[data-cy="popupClose"]').should('be.visible').click();
        cy.get('[data-cy="popup"]').should('not.exist');
        cy.get('body').should('not.have.css', 'overflow', 'hidden');
      });

      it('closes the popup when clicking the backdrop', () => {
        cy.get('@cardTitle').click();
        cy.get('[data-cy="popup"]').should('be.visible');
        cy.get('[data-cy="popupBackdrop"]').click('topLeft');
        cy.get('[data-cy="popup"]').should('not.exist');
      });

      if (project.media) {
        it('shows its gallery in the popup', () => {
          cy.get('@cardTitle').click();
          cy.get('[data-cy="gallery"]').should('be.visible');
          if (project.media.length > 1) {
            cy.get('[data-cy="galleryThumb"]').should(
              'have.length',
              project.media.length
            );
          }
        });
      }

      if (project.playable) {
        it('starts the game from the popup', () => {
          cy.get('@cardTitle').click();
          cy.get('[data-cy="popupPlay"]').should('be.visible').click();
          cy.get('[data-cy="popup"]').should('not.exist');
          cy.get('[data-cy="gameScreen"]').should('be.visible');
          cy.get('body').trigger('keydown', { code: 'Escape' });
          cy.get('[data-cy="gameScreen"]').should('not.exist');
          cy.get('body').should('not.have.css', 'overflow', 'hidden');
        });
      }

      it('keeps the popup open when clicking inside it', () => {
        cy.get('@cardTitle').click();
        cy.get('[data-cy="popupTitle"]').click();
        // The close animation takes 400ms, wait past it before asserting
        cy.wait(500);
        cy.get('[data-cy="popup"]').should('be.visible');
      });
    });
  });

  describe('card layout', () => {
    const titleTop = ($title) => $title[0].getBoundingClientRect().top;
    const imageBottom = ($img) => $img[0].getBoundingClientRect().bottom;

    beforeEach(() => {
      cy.get('[data-cy="projectCard"]').first().as('card');
    });

    it('stacks the image above the text on a phone held sideways', () => {
      cy.viewport(844, 390);
      cy.get('@card').scrollIntoView();
      cy.get('@card')
        .find('[data-cy="projectImage"]')
        .then(($img) => {
          cy.get('@card')
            .find('[data-cy="projectTitle"]')
            .should(($title) => {
              expect(titleTop($title)).to.be.at.least(imageBottom($img));
            });
        });
    });

    it('keeps the image beside the text on an upright tablet', () => {
      cy.viewport(844, 1100);
      cy.get('@card').scrollIntoView();
      cy.get('@card')
        .find('[data-cy="projectImage"]')
        .then(($img) => {
          cy.get('@card')
            .find('[data-cy="projectTitle"]')
            .should(($title) => {
              expect(titleTop($title)).to.be.below(imageBottom($img));
            });
        });
    });
  });

  it('does not show a "more projects" note', () => {
    cy.contains('More projects to showcase soon').should('not.exist');
  });
});
