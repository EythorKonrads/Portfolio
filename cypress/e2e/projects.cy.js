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
        cy.get('@card').click();

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
        cy.get('@card').click();
        cy.get('[data-cy="popupClose"]').should('be.visible').click();
        cy.get('[data-cy="popup"]').should('not.exist');
        cy.get('body').should('not.have.css', 'overflow', 'hidden');
      });

      it('closes the popup when clicking the backdrop', () => {
        cy.get('@card').click();
        cy.get('[data-cy="popup"]').should('be.visible');
        cy.get('[data-cy="popupBackdrop"]').click('topLeft');
        cy.get('[data-cy="popup"]').should('not.exist');
      });

      it('keeps the popup open when clicking inside it', () => {
        cy.get('@card').click();
        cy.get('[data-cy="popupTitle"]').click();
        // The close animation takes 400ms, wait past it before asserting
        cy.wait(500);
        cy.get('[data-cy="popup"]').should('be.visible');
      });
    });
  });

  it('shows the "more projects" note', () => {
    cy.contains('More projects to showcase soon')
      .scrollIntoView()
      .should('be.visible');
  });
});
