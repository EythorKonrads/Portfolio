import jobs from '../../src/assets/jobs.json';

// The icons are local SVGs loaded through Icon.vue
describe('Icons', () => {
  beforeEach(() => {
    cy.visitHome();
  });

  it('shows an icon next to "Let\'s talk"', () => {
    cy.get('[data-cy="heroMail"] svg').should(($svg) => {
      const { width, height } = $svg[0].getBoundingClientRect();
      expect([width, height]).to.deep.equal([20, 20]);
    });
  });

  it('shows an icon in the filter button', () => {
    cy.get('[data-cy="filterButton"] svg').should('be.visible');
  });

  it('marks external job links with a link icon', () => {
    const linked = jobs.filter((job) => job.titles.some((title) => title.url));
    expect(linked, 'jobs with a linked title').not.to.be.empty;
    cy.get('[data-cy="jobTitle"] a[href] svg').should(
      'have.length',
      jobs.flatMap((job) => job.titles).filter((title) => title.url).length
    );
  });

  it('no longer renders any Element Plus components', () => {
    cy.get('[class*="el-"]').should('not.exist');
  });
});
