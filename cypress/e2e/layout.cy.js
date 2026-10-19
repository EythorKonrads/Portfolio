// Layout checks at the two breakpoints the site is designed around
const rect = ($el) => $el[0].getBoundingClientRect();

describe('Layout', () => {
  it('sets the page title', () => {
    cy.visitHome();
    cy.title().should('eq', 'Eythor Konradsson');
  });

  context('desktop (1280x800)', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
      cy.visitHome();
    });

    it('puts the hero beside the content column', () => {
      cy.get('[data-cy="hero"]').then(($hero) => {
        cy.get('[data-cy="experience"]').should(($experience) => {
          expect(rect($experience).left).to.be.at.least(rect($hero).right - 1);
          expect(rect($experience).top).to.be.lessThan(800);
        });
      });
    });

    it('keeps the hero fixed while the content column scrolls', () => {
      cy.get('[data-cy="projects"]').scrollIntoView();
      cy.get('[data-cy="hero"]').should(($hero) => {
        expect(rect($hero).top).to.equal(0);
      });
      cy.window().its('scrollY').should('eq', 0);
    });

    it('has no horizontal overflow', () => {
      cy.assertNoHorizontalOverflow();
    });
  });

  context('mobile (375x812)', () => {
    beforeEach(() => {
      cy.viewport(375, 812);
      cy.visitHome();
    });

    it('stacks the hero above the content', () => {
      cy.get('[data-cy="hero"]').then(($hero) => {
        cy.get('[data-cy="experience"]').should(($experience) => {
          expect(rect($experience).top).to.be.at.least(rect($hero).bottom - 1);
        });
      });
    });

    it('scrolls the whole page down to the projects', () => {
      cy.get('[data-cy="projects"]').scrollIntoView().should('be.visible');
      cy.window().its('scrollY').should('be.greaterThan', 0);
    });

    it('has no horizontal overflow', () => {
      cy.assertNoHorizontalOverflow();
    });
  });

  context('theme', () => {
    it('defaults to the dark theme', () => {
      cy.visitHome();
      cy.get('html').should('have.attr', 'data-theme', 'dark');
    });
  });
});
