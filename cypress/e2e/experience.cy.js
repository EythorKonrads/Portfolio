import jobs from '../../src/assets/jobs.json';

describe('Experience', () => {
  beforeEach(() => {
    cy.visitHome();
  });

  it('has a heading', () => {
    cy.get('[data-cy="experience"] h2')
      .scrollIntoView()
      .should('be.visible')
      .and('have.text', 'Experience');
  });

  it('renders one entry per job in jobs.json', () => {
    cy.get('[data-cy="job"]').should('have.length', jobs.length);
  });

  jobs.forEach((job, index) => {
    describe(`job ${index + 1}: ${job.titles[0].title}`, () => {
      beforeEach(() => {
        cy.get('[data-cy="job"]').eq(index).scrollIntoView().as('job');
        cy.get('@job').should('be.visible');
      });

      it('shows dates and titles', () => {
        cy.get('@job')
          .find('[data-cy="jobDates"]')
          .should('contain.text', job.dates);
        job.titles.forEach(({ title }) => {
          cy.get('@job')
            .find('[data-cy="jobTitle"]')
            .should('contain.text', title);
        });
      });

      it('opens title and project links in a new tab', () => {
        const links = [...job.titles, ...(job.projects ?? [])].filter(
          ({ url }) => url
        );
        links.forEach(({ url }) => {
          cy.get('@job')
            .find(`a[href="${url}"]`)
            .should('have.attr', 'target', '_blank')
            .and('have.attr', 'rel')
            .and('include', 'noopener');
        });
      });

      it('shows every tag', () => {
        cy.get('@job')
          .find('[data-cy="jobTag"]')
          .should('have.length', job.tags?.length ?? 0);
      });
    });
  });
});
