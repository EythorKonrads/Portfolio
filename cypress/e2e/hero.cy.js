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

  it('has a mail link', () => {
    cy.get('[data-cy="heroLinks"]').should('be.visible');
    cy.get('[data-cy="heroMail"]')
      .should('be.visible')
      .and('have.attr', 'href', 'mailto:kh.krimper@gmail.com')
      .and('contain.text', "Let's talk");
  });
});
