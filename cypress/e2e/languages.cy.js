import languages from '../../src/assets/languages.json';
import jobs from '../../src/assets/jobs.json';

describe('Languages', () => {
  it('lists every language with its level in the Education section', () => {
    cy.visitHome();
    cy.get('[data-cy="education"] [data-cy="languages"]')
      .scrollIntoView()
      .should('be.visible')
      .and('contain.text', 'Languages');
    cy.get('[data-cy="language"]').should('have.length', languages.length);
    languages.forEach(({ language, level }, index) => {
      cy.get('[data-cy="language"]')
        .eq(index)
        .should('contain.text', language)
        .and('contain.text', level);
    });
  });

  it('comes after the education entries', () => {
    cy.visitHome();
    cy.get('[data-cy="educationItem"]')
      .last()
      .then(($item) => {
        cy.get('[data-cy="languages"]').should(($languages) => {
          expect($languages[0].getBoundingClientRect().top).to.be.at.least(
            $item[0].getBoundingClientRect().bottom - 1
          );
        });
      });
  });

  it('stays visible while a tag filter is applied', () => {
    const [{ tag }] = jobs[0].tags;
    cy.visitHome({ path: `/?tags=${tag}` });
    cy.get('[data-cy="languages"]').scrollIntoView().should('be.visible');
  });

  it('fits a phone screen without overflowing', () => {
    cy.viewport(375, 812);
    cy.visitHome();
    cy.get('[data-cy="languages"]').scrollIntoView().should('be.visible');
    cy.assertNoHorizontalOverflow();
  });
});
