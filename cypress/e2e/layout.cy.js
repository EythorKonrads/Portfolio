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

  context('link previews', () => {
    const meta = (attr, name) =>
      cy.get(`head meta[${attr}="${name}"]`).should('have.attr', 'content');

    it('has Open Graph and Twitter tags', () => {
      cy.visitHome();
      ['og:type', 'og:title', 'og:description', 'og:url'].forEach((name) =>
        meta('property', name).should('not.be.empty')
      );
      meta('property', 'og:url').should('match', /^https:\/\//);
      meta('name', 'twitter:card').should('eq', 'summary_large_image');
    });

    it('points og:image at an absolute URL of an image the site serves', () => {
      cy.visitHome();
      meta('property', 'og:image').then((url) => {
        // Crawlers don't resolve relative paths, so it must be absolute
        expect(url).to.match(/^https:\/\/.+\.png$/);
        // Fetch the same path from the local build
        cy.request(new URL(url).pathname).then(({ status, headers }) => {
          expect(status).to.eq(200);
          expect(headers['content-type']).to.include('image/png');
        });
      });
      meta('property', 'og:image:width').should('eq', '1200');
      meta('property', 'og:image:height').should('eq', '630');
    });
  });

  context('theme', () => {
    it('defaults to the dark theme', () => {
      cy.visitHome();
      cy.get('html').should('have.attr', 'data-theme', 'dark');
    });
  });
});
