import { mount } from 'cypress/vue';
// The site's global styles, so components get their CSS variables
import '../../src/scss/main.scss';

Cypress.Commands.add('mount', mount);
