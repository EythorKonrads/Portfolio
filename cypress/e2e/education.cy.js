import educations from '../../src/assets/educations.json';

describe('Education', () => {
  beforeEach(() => {
    cy.visitHome();
  });

  it('has a heading', () => {
    cy.get('[data-cy="education"] h2')
      .scrollIntoView()
      .should('be.visible')
      .and('have.text', 'Education');
  });

  it('renders one entry per item in educations.json', () => {
    cy.get('[data-cy="educationItem"]').should(
      'have.length',
      educations.length
    );
  });

  educations.forEach((education, index) => {
    describe(`education ${index + 1}: ${education.titles[0].title}`, () => {
      beforeEach(() => {
        cy.get('[data-cy="educationItem"]')
          .eq(index)
          .scrollIntoView()
          .as('education');
        cy.get('@education').should('be.visible');
      });

      it('shows dates, school and degree', () => {
        cy.get('@education')
          .find('[data-cy="educationDates"]')
          .should('contain.text', education.dates);
        cy.get('@education')
          .find('[data-cy="educationTitle"]')
          .should('contain.text', education.titles[0].title)
          .and('contain.text', education.degree);
      });

      it('opens school links in a new tab', () => {
        education.titles
          .filter(({ url }) => url)
          .forEach(({ url }) => {
            cy.get('@education')
              .find(`a[href="${url}"]`)
              .should('have.attr', 'target', '_blank')
              .and('have.attr', 'rel')
              .and('include', 'noopener');
          });
      });

      it('shows every tag', () => {
        cy.get('@education')
          .find('[data-cy="educationTag"]')
          .should('have.length', education.tags?.length ?? 0);
      });
    });
  });
});
