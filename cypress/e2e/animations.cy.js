// Entrance and scroll-reveal animations (scss/base/animations.scss, directives/reveal.js)
describe('Animations', () => {
  context('with motion', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
      cy.visitHome();
    });

    it('fades the hero in and ends fully visible', () => {
      cy.get('.anim-fade-up').should('have.length', 5);
      cy.get('.anim-fade-up').each(($el) => {
        cy.wrap($el)
          .should('have.css', 'opacity', '1')
          .and('have.css', 'animation-name', 'fade-up');
      });
    });

    it('reveals content that is on screen at load', () => {
      cy.get('[data-cy="job"]')
        .first()
        .should('have.class', 'is-revealed')
        .and('have.css', 'opacity', '1');
    });

    it('keeps below-the-fold content hidden until it is scrolled to', () => {
      cy.get('[data-cy="projectCard"]')
        .last()
        .should('have.class', 'reveal')
        .and('not.have.class', 'is-revealed')
        .and('have.css', 'opacity', '0');

      cy.get('[data-cy="projectCard"]').last().scrollIntoView();
      cy.get('[data-cy="projectCard"]')
        .last()
        .should('have.class', 'is-revealed')
        .and('have.css', 'opacity', '1');
    });

    it('draws the heading underline in', () => {
      cy.get('[data-cy="projects"] .reveal-line').should(
        'have.css',
        'transform',
        'matrix(0, 0, 0, 1, 0, 0)'
      );
      cy.get('[data-cy="projects"] h2').scrollIntoView();
      cy.get('[data-cy="projects"] .reveal-line').should(
        'have.css',
        'transform',
        'matrix(1, 0, 0, 1, 0, 0)'
      );
    });
  });

  context('with prefers-reduced-motion', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
      cy.visitHome({ reducedMotion: true });
    });

    after(() => {
      // Restore normal motion for any spec that runs after this one
      Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia',
        params: { features: [] },
      });
    });

    it('shows the hero without animating it', () => {
      cy.get('.anim-fade-up').each(($el) => {
        cy.wrap($el)
          .should('have.css', 'animation-name', 'none')
          .and('have.css', 'opacity', '1');
      });
    });

    it('shows below-the-fold content without scrolling', () => {
      cy.get('[data-cy="projectCard"]')
        .last()
        .should('not.have.class', 'is-revealed')
        .and('have.css', 'opacity', '1');
    });
  });
});
