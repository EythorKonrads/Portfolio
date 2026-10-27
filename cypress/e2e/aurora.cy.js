import { composite, contrast, luminance } from '../support/color';

const aurora = () => cy.get('[data-cy="heroAurora"]');
const bands = () => cy.get('[data-cy="auroraBand"]');

// Resolve a CSS color variable to rgb() via a throwaway element
const resolveColor = (doc, variable) => {
  const probe = doc.createElement('span');
  probe.style.color = `var(${variable})`;
  doc.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

describe('Aurora', () => {
  context('desktop, dark theme', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
      cy.visitHome();
    });

    it('drifts behind the hero content without catching clicks', () => {
      aurora()
        .should('have.attr', 'aria-hidden', 'true')
        .and('have.css', 'pointer-events', 'none')
        .and('have.css', 'z-index', '-1')
        .parent()
        .should('have.attr', 'data-cy', 'hero');
      bands()
        .should('have.length', 3)
        .each(($band) => {
          expect(getComputedStyle($band[0]).animationName).not.to.equal('none');
        });
    });

    it('brightens gently around the cursor', () => {
      cy.get('[data-cy="auroraGlow"]').should('have.css', 'opacity', '0');
      cy.get('[data-cy="hero"]').trigger('pointermove', 50, 120);
      aurora().should(($aurora) => {
        expect($aurora[0].style.getPropertyValue('--aurora-y')).to.match(/%$/);
      });
      cy.get('[data-cy="auroraGlow"]').should(($glow) => {
        expect(Number(getComputedStyle($glow[0]).opacity)).to.be.greaterThan(0);
      });
      cy.get('[data-cy="hero"]').trigger('pointerleave');
      cy.get('[data-cy="auroraGlow"]').should('have.css', 'opacity', '0');
    });

    it('keeps hero text at 4.5:1 over its brightest color', () => {
      aurora().should('exist');
      cy.document().then((doc) => {
        const hero = doc.querySelector('[data-cy="hero"]');
        const page = getComputedStyle(hero.parentElement).backgroundColor;
        const heroBg = composite(getComputedStyle(hero).backgroundColor, page);
        const layerOpacity = Number(
          getComputedStyle(doc.querySelector('[data-cy="heroAurora"]')).opacity
        );
        // Worst case: the lightest aurora color at full strength in the layer
        const brightest = ['--color-aurora-green', '--color-aurora-teal']
          .map((variable) =>
            composite(resolveColor(doc, variable), heroBg, layerOpacity)
          )
          .sort((a, b) => luminance(b) - luminance(a))[0];

        const minimums = {
          heroName: 4.5,
          heroRole: 4.5,
          heroText: 4.5,
          heroMail: 4.5,
          // Icons are graphics, which WCAG asks 3:1 of, not text
          socialGithub: 3,
          socialLinkedin: 3,
        };
        Object.entries(minimums).forEach(([id, minimum]) => {
          const color = getComputedStyle(
            doc.querySelector(`[data-cy="${id}"]`)
          ).color;
          expect(contrast(color, brightest), id).to.be.at.least(minimum);
        });
      });
    });

    it('goes away in the light theme and comes back in dark', () => {
      cy.get('[data-cy="themeToggle"]').click();
      cy.get('html').should('have.attr', 'data-theme', 'light');
      aurora().should('not.exist');
      cy.get('[data-cy="themeToggle"]').click();
      aurora().should('exist');
    });
  });

  it('uses two slower bands on phones', () => {
    cy.viewport(375, 812);
    cy.visitHome();
    bands().filter(':visible').should('have.length', 2);
    bands()
      .first()
      .should(($band) => {
        expect(
          parseFloat(getComputedStyle($band[0]).animationDuration)
        ).to.be.greaterThan(26);
      });
  });

  it('stands still for visitors who prefer reduced motion', () => {
    cy.viewport(1280, 800);
    cy.visitHome({ reducedMotion: true });
    aurora().should('exist');
    bands().each(($band) => {
      expect(getComputedStyle($band[0]).animationName).to.equal('none');
    });
    cy.get('[data-cy="hero"]').trigger('pointermove', 50, 120);
    cy.get('[data-cy="auroraGlow"]').should('not.be.visible');
  });
});
