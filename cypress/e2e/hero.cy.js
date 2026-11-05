// https://on.cypress.io/api

describe('Hero', () => {
  beforeEach(() => {
    cy.visitHome();
  });

  it('shows name, role and intro text', () => {
    cy.get('[data-cy="hero"]').should('be.visible');
    cy.get('[data-cy="heroName"]')
      .should('be.visible')
      .and('contain.text', 'Eythor Konradsson');
    cy.get('[data-cy="heroRole"]')
      .should('be.visible')
      .and('contain.text', 'Senior front-end developer');
    cy.get('[data-cy="heroText"]')
      .should('be.visible')
      .and('contain.text', 'Vue.js');
  });

  it('loads the profile image', () => {
    cy.get('[data-cy="heroImage"]')
      .should('be.visible')
      .and(($el) => {
        expect($el.css('background-image')).to.match(/url\(.+\.jpg/);
      })
      .then(($el) => {
        const url = $el.css('background-image').match(/url\("?(.+?)"?\)/)[1];
        cy.request(url).its('status').should('eq', 200);
      });
  });

  it('links to GitHub and LinkedIn in a new tab', () => {
    [
      ['socialGithub', 'https://github.com/EythorKonrads'],
      ['socialLinkedin', 'https://www.linkedin.com/in/eythork/'],
    ].forEach(([name, href]) => {
      cy.get(`[data-cy="${name}"]`)
        .should('be.visible')
        .and('have.attr', 'href', href)
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel')
        .and('include', 'noopener');
      cy.get(`[data-cy="${name}"] svg`).should('exist');
    });
  });

  it('labels the icon-only social links for screen readers', () => {
    [
      ['socialGithub', 'GitHub'],
      ['socialLinkedin', 'LinkedIn'],
    ].forEach(([name, label]) => {
      cy.get(`[data-cy="${name}"]`)
        .should('have.attr', 'aria-label')
        .and('include', label)
        .and('include', 'new tab');
      cy.get(`[data-cy="${name}"] svg`).should(
        'have.attr',
        'aria-hidden',
        'true'
      );
      // Each link sits in its own list item
      cy.get(`[data-cy="${name}"]`).parent('li').parent('ul').should('exist');
    });
  });

  it('has a mail link', () => {
    cy.get('[data-cy="heroLinks"]').should('be.visible');
    cy.get('[data-cy="heroMail"]')
      .should('be.visible')
      .and('have.attr', 'href', 'mailto:kh.krimper@gmail.com')
      .and('contain.text', "Let's talk");
  });

  it('leaves room around the social icons on an upright phone', () => {
    cy.viewport(390, 844);
    ['socialGithub', 'socialLinkedin'].forEach((name) => {
      cy.get(`[data-cy="${name}"]`).should(($link) => {
        const link = $link[0].getBoundingClientRect();
        const icon = $link.children()[0].getBoundingClientRect();
        expect(icon.top - link.top, 'above').to.be.at.least(8);
        expect(link.bottom - icon.bottom, 'below').to.be.at.least(8);
        expect(icon.left - link.left, 'left').to.be.at.least(8);
        expect(link.right - icon.right, 'right').to.be.at.least(8);
      });
    });
  });

  describe('on a phone held sideways', () => {
    const top = ($el) => $el[0].getBoundingClientRect().top;
    const bottom = ($el) => $el[0].getBoundingClientRect().bottom;

    beforeEach(() => {
      cy.viewport(667, 375);
    });

    it('starts with the top of the hero in view', () => {
      cy.get('[data-cy="hero"]').then(($hero) => {
        cy.get('[data-cy="miniEarth"]').should(($earth) => {
          expect(top($earth)).to.be.at.least(top($hero));
        });
      });
    });

    it("doesn't let the intro text run into the links", () => {
      cy.get('[data-cy="heroText"]').then(($text) => {
        cy.get('[data-cy="heroLinks"]').should(($links) => {
          expect(top($links)).to.be.at.least(bottom($text));
        });
      });
    });

    it('scrolls down to the links', () => {
      cy.get('[data-cy="hero"]').scrollTo('bottom', { ensureScrollable: true });
      cy.get('[data-cy="heroLinks"]').should(($links) => {
        expect(bottom($links)).to.be.at.most(375);
      });
    });
  });
});
