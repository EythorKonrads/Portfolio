// Console errors recorded by cy.visitHome(); checked after every test
let consoleError = null;

beforeEach(() => {
  consoleError = null;
});

afterEach(() => {
  if (consoleError) {
    expect(consoleError, 'console.error').not.to.have.been.called;
  }
});

// Visit the home page and fail the test if it logs console errors.
// Pass { reducedMotion: true } to emulate prefers-reduced-motion: reduce.
// Pass { path } to visit with a query string, e.g. '/?tags=vue'.
Cypress.Commands.add(
  'visitHome',
  ({ reducedMotion = false, path = '/' } = {}) => {
    cy.wrap(
      Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia',
        params: {
          features: [
            {
              name: 'prefers-reduced-motion',
              value: reducedMotion ? 'reduce' : 'no-preference',
            },
          ],
        },
      }),
      { log: false }
    );

    cy.visit(path, {
      onBeforeLoad(win) {
        consoleError = cy.spy(win.console, 'error');
      },
    });
  }
);

// Fails if the page is wider than the viewport.
Cypress.Commands.add('assertNoHorizontalOverflow', () => {
  cy.window().then((win) => {
    const { scrollWidth } = win.document.documentElement;
    expect(scrollWidth, 'page scroll width').to.be.at.most(win.innerWidth);
  });
});
