import jobs from '../../src/assets/jobs.json';
import educations from '../../src/assets/educations.json';
import projects from '../../src/assets/projects.json';

// Each section with its items, where it keeps tags and how it renders them
const sections = [
  {
    name: 'jobs',
    items: jobs,
    field: 'tags',
    item: 'job',
    tag: 'jobTag',
    activeClass: 'expirience-job__list-item--active',
    empty: 'experienceEmpty',
  },
  {
    name: 'educations',
    items: educations,
    field: 'tags',
    item: 'educationItem',
    tag: 'educationTag',
    activeClass: 'education-item__list-item--active',
    empty: 'educationEmpty',
  },
  {
    name: 'projects',
    items: projects,
    field: 'technologies',
    item: 'projectCard',
    tag: 'projectTag',
    activeClass: 'project-item__tech-tag--active',
    empty: 'projectsEmpty',
  },
];

const tagsOf = (item, field) => (item[field] ?? []).map(({ tag }) => tag);
const matching = (section, selected) =>
  section.items.filter((item) =>
    tagsOf(item, section.field).some((tag) => selected.includes(tag))
  );
const totalMatching = (selected) =>
  sections.reduce(
    (sum, section) => sum + matching(section, selected).length,
    0
  );
const totalItems = sections.reduce((sum, { items }) => sum + items.length, 0);

const allTags = [
  ...new Map(
    sections.flatMap(({ items, field }) =>
      items.flatMap((item) => (item[field] ?? []).map((t) => [t.tag, t]))
    )
  ).values(),
];

// The tag on the fewest items, so selecting it actually hides something
const [rareTag] = [...allTags].sort(
  (a, b) => totalMatching([a.tag]) - totalMatching([b.tag])
);
// A second tag that adds items on top of the first (OR matching)
const extraTag = allTags.find(
  ({ tag }) =>
    totalMatching([rareTag.tag, tag]) > totalMatching([rareTag.tag]) &&
    totalMatching([rareTag.tag, tag]) > totalMatching([tag])
);

const openPopup = () => {
  cy.get('[data-cy="filterButton"]').click();
  cy.get('[data-cy="filterPopup"]').should('be.visible');
};
const clickTag = (tag) =>
  cy.get(`[data-cy="filterTag"][data-tag="${tag}"]`).click();

const assertShown = (selected) => {
  sections.forEach((section) => {
    const expected = selected.length
      ? matching(section, selected).length
      : section.items.length;
    cy.get(`[data-cy="${section.item}"]`).should('have.length', expected);
  });
};

describe('Tag filter', () => {
  it('starts with no filter and every item shown', () => {
    cy.visitHome();
    cy.get('[data-cy="filterButton"]')
      .should('be.visible')
      .and('contain.text', 'Filter');
    cy.get('[data-cy="filterCount"]').should('not.exist');
    cy.get('[data-cy="filterActive"]').should('not.exist');
    cy.get('[data-cy="filterPopup"]').should('not.exist');
    assertShown([]);
  });

  it('sits above the Experience section', () => {
    cy.visitHome();
    cy.get('[data-cy="filterButton"]').then(($button) => {
      cy.get('[data-cy="experience"]').then(($experience) => {
        expect($button[0].getBoundingClientRect().bottom).to.be.at.most(
          $experience[0].getBoundingClientRect().top
        );
      });
    });
  });

  it('lists every unique tag once in the popup', () => {
    cy.visitHome();
    openPopup();
    cy.get('[data-cy="filterPopup"]').should(
      'have.class',
      'base-popup--visible'
    );
    cy.get('body').should('have.css', 'overflow', 'hidden');
    cy.get('[data-cy="filterTag"]').should('have.length', allTags.length);
    allTags.forEach(({ tag, title }) => {
      cy.get(`[data-cy="filterTag"][data-tag="${tag}"]`)
        .should('contain.text', title)
        .and('have.attr', 'aria-pressed', 'false');
    });
    cy.get('[data-cy="filterClear"]').should('be.disabled');
  });

  it('filters as soon as a tag is clicked and keeps the popup open', () => {
    cy.visitHome();
    openPopup();
    clickTag(rareTag.tag);

    cy.get(`[data-cy="filterTag"][data-tag="${rareTag.tag}"]`).should(
      'have.attr',
      'aria-pressed',
      'true'
    );
    assertShown([rareTag.tag]);
    cy.url().should('include', `tags=${rareTag.tag}`);
    // The close animation takes 400ms, wait past it before asserting
    cy.wait(500);
    cy.get('[data-cy="filterPopup"]').should('be.visible');
  });

  it('shows items matching any of the selected tags', () => {
    expect(extraTag, 'a second tag that widens the results').to.exist;
    cy.visitHome();
    openPopup();
    clickTag(rareTag.tag);
    clickTag(extraTag.tag);
    assertShown([rareTag.tag, extraTag.tag]);
    cy.get('[data-cy="filterPopupClose"]').click();
    cy.get('[data-cy="filterCount"]').should('contain.text', '(2)');
  });

  it('highlights the matching tags on the cards', () => {
    const selected = [rareTag.tag];
    cy.visitHome({ path: `/?tags=${rareTag.tag}` });
    sections.forEach((section) => {
      matching(section, selected).forEach((item, index) => {
        tagsOf(item, section.field).forEach((tag, tagIndex) => {
          cy.get(`[data-cy="${section.item}"]`)
            .eq(index)
            .find(`[data-cy="${section.tag}"]`)
            .eq(tagIndex)
            .should(
              selected.includes(tag) ? 'have.class' : 'not.have.class',
              section.activeClass
            );
        });
      });
    });
  });

  it('shows the active filters under the button and removes them on click', () => {
    cy.visitHome();
    openPopup();
    clickTag(rareTag.tag);
    clickTag(extraTag.tag);
    cy.get('[data-cy="filterPopupClose"]').click();
    cy.get('[data-cy="filterPopup"]').should('not.exist');

    cy.get('[data-cy="filterActiveTag"]').should('have.length', 2);
    cy.get(`[data-cy="filterActiveTag"][data-tag="${rareTag.tag}"]`)
      .should('be.visible')
      .and('contain.text', rareTag.title)
      .click();

    cy.get('[data-cy="filterActiveTag"]').should('have.length', 1);
    assertShown([extraTag.tag]);
    cy.get(`[data-cy="filterActiveTag"][data-tag="${extraTag.tag}"]`).click();
    cy.get('[data-cy="filterActive"]').should('not.exist');
    assertShown([]);
  });

  it('clears every selection with "Clear all"', () => {
    cy.visitHome();
    openPopup();
    clickTag(rareTag.tag);
    clickTag(extraTag.tag);
    cy.get('[data-cy="filterClear"]').should('not.be.disabled').click();

    cy.get('[data-cy="filterTag"][aria-pressed="true"]').should('not.exist');
    cy.get('[data-cy="filterClear"]').should('be.disabled');
    cy.get('[data-cy="filterPopup"]').should('be.visible');
    assertShown([]);
    cy.url().should('not.include', 'tags=');
  });

  it('shows an empty message for sections with no matches', () => {
    const selected = [rareTag.tag];
    cy.visitHome({ path: `/?tags=${rareTag.tag}` });
    sections.forEach((section) => {
      cy.get(`[data-cy="${section.empty}"]`).should(
        matching(section, selected).length ? 'not.exist' : 'exist'
      );
    });
    cy.contains('More projects to showcase soon').should('not.exist');
  });

  it('applies tags from the URL and ignores unknown ones', () => {
    cy.visitHome({ path: `/?tags=${rareTag.tag},not-a-real-tag` });
    assertShown([rareTag.tag]);
    cy.get('[data-cy="filterActiveTag"]').should('have.length', 1);
    cy.get('[data-cy="filterCount"]').should('contain.text', '(1)');
  });

  describe('closing the popup', () => {
    beforeEach(() => {
      cy.visitHome();
      openPopup();
    });

    it('closes with the close button', () => {
      cy.get('[data-cy="filterPopupClose"]').should('be.visible').click();
      cy.get('[data-cy="filterPopup"]').should('not.exist');
      cy.get('body').should('not.have.css', 'overflow', 'hidden');
    });

    it('closes when clicking the backdrop', () => {
      cy.get('[data-cy="filterPopupBackdrop"]').click('topLeft');
      cy.get('[data-cy="filterPopup"]').should('not.exist');
    });

    it('closes with the Escape key', () => {
      cy.get('body').type('{esc}');
      cy.get('[data-cy="filterPopup"]').should('not.exist');
    });

    it('stays open when clicking inside it', () => {
      cy.get('[data-cy="filterPopup"]')
        .contains('Filter by technology')
        .click();
      cy.wait(500);
      cy.get('[data-cy="filterPopup"]').should('be.visible');
    });
  });
});

// Fails loudly if a content change breaks what the specs above rely on
describe('Tag filter content', () => {
  it('has tags that hide at least one item', () => {
    expect(totalMatching([rareTag.tag])).to.be.lessThan(totalItems);
  });
});
