// Icon.vue loads each SVG as its own chunk, after the page has rendered
describe('Icons while loading', () => {
  it('keep their space, so the page does not shift when they arrive', () => {
    // A shift mid-scroll cuts a section nav jump short on slow machines
    cy.intercept(/\/assets\/(github|linkedin|promotion)-[\w-]+\.js$/, (req) => {
      req.on('response', (res) => res.setDelay(1000));
    });
    cy.viewport(375, 812);
    cy.visitHome();
    cy.get('[data-cy="socialGithub"] svg').should('not.exist');
    cy.get('[data-cy="hero"]').then(($hero) => {
      const before = $hero[0].getBoundingClientRect().height;
      cy.get('[data-cy="socialGithub"] svg').should('exist');
      cy.get('[data-cy="heroMail"] svg').should('exist');
      cy.get('[data-cy="hero"]').should(($after) => {
        expect($after[0].getBoundingClientRect().height).to.equal(before);
      });
    });
  });
});
