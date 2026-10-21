import jobs from '../../src/assets/jobs.json';
import educations from '../../src/assets/educations.json';
import projects from '../../src/assets/projects.json';

// The sticky header: a link per section next to the tag filter
const sections = [
  {
    id: 'experience',
    title: 'Experience',
    items: jobs,
    field: 'tags',
    empty: 'experienceEmpty',
  },
  {
    id: 'education',
    title: 'Education',
    items: educations,
    field: 'tags',
    empty: 'educationEmpty',
  },
  {
    id: 'projects',
    title: 'Projects',
    items: projects,
    field: 'technologies',
    empty: 'projectsEmpty',
  },
];

const rect = ($el) => $el[0].getBoundingClientRect();
const link = (id) => cy.get(`[data-cy="navLink"][data-section="${id}"]`);
const headerBottom = () =>
  cy.get('[data-cy="homeHeader"]').then(($header) => rect($header).bottom);

const tagsOf = (item, field) => (item[field] ?? []).map(({ tag }) => tag);
const allTags = [
  ...new Set(
    sections.flatMap(({ items, field }) =>
      items.flatMap((item) => tagsOf(item, field))
    )
  ),
];
// A tag and a section it leaves empty, for the filtered-section test
const emptied = allTags
  .flatMap((tag) =>
    sections
      .filter(
        ({ items, field }) =>
          !items.some((item) => tagsOf(item, field).includes(tag))
      )
      .map((section) => ({ tag, section }))
  )
  .find(Boolean);

const expectActive = (id) => {
  link(id).should('have.attr', 'aria-current', 'location');
  cy.get('[data-cy="navLink"][aria-current]').should('have.length', 1);
};

// The content column scrolls on desktop, the page on mobile
const isScrolledToEnd = ($wrapper) =>
  [$wrapper[0], $wrapper[0].ownerDocument.scrollingElement].some(
    (el) =>
      el.scrollHeight > el.clientHeight &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 2
  );

// Clicking a link puts the section's top just below the header, or as close
// as it gets when the content below it is shorter than the screen
const assertJumpedTo = (id) => {
  cy.get('[data-cy="homeWrapper"]').then(($wrapper) => {
    headerBottom().then((bottom) => {
      cy.get(`[data-cy="${id}"]`).should(($section) => {
        const { top } = rect($section);
        if (isScrolledToEnd($wrapper)) {
          expect(top).to.be.at.least(bottom - 2);
        } else {
          expect(top).to.be.closeTo(bottom, 2);
        }
      });
    });
  });
};

const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
];

describe('Section nav', () => {
  viewports.forEach(({ name, width, height }) => {
    context(`${name} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visitHome();
      });

      it('lists a link for every section, in page order', () => {
        cy.get('[data-cy="sectionNav"]').should(
          'have.attr',
          'aria-label',
          'Sections'
        );
        cy.get('[data-cy="navLink"]').should('have.length', sections.length);
        sections.forEach(({ id, title }, index) => {
          cy.get('[data-cy="navLink"]')
            .eq(index)
            .should('be.visible')
            .and('contain.text', title)
            .and('have.attr', 'data-section', id);
        });
      });

      it('sits on the same line as the filter button', () => {
        // Both fade up into place on load, so measure once they've settled
        cy.get('[data-cy="sectionNav"] > ul').should(
          'have.css',
          'opacity',
          '1'
        );
        cy.get('[data-cy="filterButton"]')
          .should('have.css', 'opacity', '1')
          .then(($button) => {
            const button = rect($button);
            cy.get('[data-cy="navLink"]').each(($link) => {
              const linkRect = rect($link);
              expect(linkRect.top + linkRect.height / 2).to.be.closeTo(
                button.top + button.height / 2,
                3
              );
              expect(linkRect.right).to.be.lessThan(button.left);
            });
          });
      });

      it('marks the first section as active at load', () => {
        expectActive(sections[0].id);
      });

      sections.forEach(({ id }) => {
        it(`scrolls to ${id} and marks it active when clicked`, () => {
          link(id).click();
          assertJumpedTo(id);
          expectActive(id);
          cy.get(`[data-cy="${id}"] h2`).should('be.visible');
        });
      });

      it('keeps the header at the top after scrolling', () => {
        link('projects').click();
        assertJumpedTo('projects');
        cy.get('[data-cy="homeHeader"]').should(($header) => {
          expect(rect($header).top).to.equal(0);
        });
        cy.get('[data-cy="navLink"]').first().should('be.visible');
        cy.get('[data-cy="filterButton"]').should('be.visible');
      });

      it('marks the section being read while scrolling', () => {
        // Projects can't reach the header, so this scrolls to the very end
        cy.get('[data-cy="projects"]').scrollIntoView();
        expectActive('projects');
        cy.get('[data-cy="experience"]').scrollIntoView();
        expectActive('experience');
      });

      it('keeps a clicked section active even when it cannot reach the top', () => {
        link('education').click();
        assertJumpedTo('education');
        expectActive('education');
        // Scrolling by hand hands control back to the scroll position
        cy.window().trigger('wheel');
        cy.get('[data-cy="experience"]').scrollIntoView();
        expectActive('experience');
      });

      it('leaves the URL alone when clicked', () => {
        cy.location('href').then((before) => {
          link('projects').click();
          assertJumpedTo('projects');
          cy.location('href').should('eq', before);
        });
      });

      it('still opens and closes the filter popup from the header', () => {
        cy.get('[data-cy="filterButton"]').click();
        cy.get('[data-cy="filterPopup"]').should('be.visible');
        cy.get('[data-cy="filterPopupClose"]').click();
        cy.get('[data-cy="filterPopup"]').should('not.exist');
      });

      it('has no horizontal overflow', () => {
        cy.assertNoHorizontalOverflow();
      });
    });
  });

  context('desktop layout', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
      cy.visitHome();
    });

    it('stays inside the content column, beside the hero', () => {
      cy.get('[data-cy="hero"]').then(($hero) => {
        cy.get('[data-cy="homeWrapper"]').then(($wrapper) => {
          cy.get('[data-cy="homeHeader"]').should(($header) => {
            const header = rect($header);
            expect(header.top).to.equal(0);
            expect(header.left).to.be.at.least(rect($hero).right - 1);
            expect(header.left).to.be.at.least(rect($wrapper).left);
            expect(header.right).to.be.at.most(rect($wrapper).right);
          });
        });
      });
    });

    it('scrolls the content column, not the page', () => {
      link('projects').click();
      assertJumpedTo('projects');
      cy.window().its('scrollY').should('eq', 0);
      cy.get('[data-cy="hero"]').should(($hero) => {
        expect(rect($hero).top).to.equal(0);
      });
    });
  });

  context('mobile layout', () => {
    beforeEach(() => {
      cy.viewport(375, 812);
      cy.visitHome();
    });

    it('pins the header to the top of the screen, above the hero', () => {
      cy.get('[data-cy="homeHeader"]').then(($header) => {
        const header = rect($header);
        expect(header.top).to.equal(0);
        expect(header.left).to.equal(0);
        // Full width, minus the scrollbar on systems that show one (Linux CI)
        expect(header.width).to.equal(
          $header[0].ownerDocument.documentElement.clientWidth
        );
        cy.get('[data-cy="hero"]').should(($hero) => {
          expect(rect($hero).top).to.be.at.least(header.bottom - 1);
        });
      });
    });

    it('stays on top of the page while it scrolls', () => {
      link('projects').click();
      assertJumpedTo('projects');
      cy.window().its('scrollY').should('be.greaterThan', 0);
      cy.get('[data-cy="homeHeader"]').should(($header) => {
        expect(rect($header).top).to.equal(0);
      });
    });
  });

  context('with a filter applied', () => {
    it('still jumps to a section the filter leaves empty', () => {
      expect(emptied, 'a tag that leaves a section empty').to.exist;
      const { tag, section } = emptied;
      cy.viewport(1280, 800);
      cy.visitHome({ path: `/?tags=${tag}` });

      link(section.id).click();
      cy.get(`[data-cy="${section.empty}"]`).should('be.visible');
      headerBottom().then((bottom) => {
        cy.get(`[data-cy="${section.id}"]`).should(($section) => {
          expect(rect($section).top).to.be.at.least(bottom - 2);
        });
      });
      cy.location('search').should('include', `tags=${tag}`);
    });

    it('keeps the filter in the URL after jumping', () => {
      const [tag] = allTags;
      cy.visitHome({ path: `/?tags=${tag}` });
      link('projects').click();
      cy.location('search').should('include', `tags=${tag}`);
      cy.location('hash').should('eq', '');
    });
  });

  context('with prefers-reduced-motion', () => {
    it('jumps straight to the section', () => {
      cy.viewport(1280, 800);
      cy.visitHome({ reducedMotion: true });
      link('projects').click();
      assertJumpedTo('projects');
      expectActive('projects');
    });
  });
});
