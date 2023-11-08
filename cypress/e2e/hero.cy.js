// https://on.cypress.io/api

describe('Hero', () => {
    it('successfully loaded elements', () => {
        cy.visit('/')
        cy.get('[data-cy="hero"]').should('exist')
        cy.get('[data-cy="heroImage"]').should('exist')
        cy.get('[data-cy="heroText"]').should('exist')
        cy.get('[data-cy="heroLinks"]').should('exist')
    })
})
