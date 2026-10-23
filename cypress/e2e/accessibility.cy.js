import projects from '../../src/assets/projects.json';

// What a screen reader would announce for a link or button
const accessibleName = (el) =>
  (
    el.getAttribute('aria-label') ||
    el.innerText ||
    el.getAttribute('title') ||
    ''
  ).trim();

const assertAllNamed = (selector) => {
  cy.get(selector).each(($el) => {
    expect(
      accessibleName($el[0]),
      `accessible name of ${$el[0].outerHTML.slice(0, 120)}`
    ).not.to.be.empty;
  });
};

describe('Accessibility', () => {
  it('gives every link and button on the page a name', () => {
    cy.visitHome();
    assertAllNamed('a, button');
  });

  it('gives every link and button in a project popup a name', () => {
    cy.visitHome();
    cy.get('[data-cy="projectCard"]').first().scrollIntoView().click();
    cy.get('[data-cy="popup"]').should('be.visible');
    assertAllNamed('[data-cy="popup"] a, [data-cy="popup"] button');
  });

  it('hides decorative icons from screen readers', () => {
    cy.visitHome();
    cy.get('.icon').each(($icon) => {
      expect($icon).to.have.attr('aria-hidden', 'true');
    });
  });

  it('only opens new tabs with rel="noopener"', () => {
    cy.visitHome();
    cy.get('[data-cy="projectCard"]').first().scrollIntoView().click();
    cy.get('[data-cy="popup"]').should('be.visible');
    cy.get('a[target="_blank"]').each(($link) => {
      expect($link.attr('rel'), $link.attr('href')).to.include('noopener');
    });
  });

  // Fails loudly if the content no longer has a popup to check
  it('has a project with a link to check', () => {
    expect(projects.some((p) => p.liveUrl || p.githubUrl)).to.be.true;
  });
});
