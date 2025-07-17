describe('Create Model', () => {
  beforeEach(() => {
    // Use environment variables for credentials
    const testEmail = Cypress.env('testEmail') || 'admin@platform.com';
    const testPassword = Cypress.env('testPassword') || 'admin123';

    // Login before each test
    cy.visit('/');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for login to complete and navigate to models
    cy.url().should('include', '/');
    cy.wait(2000); // Wait for login to complete
    cy.visit('/models');
    cy.wait(2000); // Wait for page to load
  });

  it('should create a new model', () => {
    // Click on "New Model" button
    cy.contains('New Model').click();

    // Should be on the create model page
    cy.url().should('include', '/models/create');
    cy.contains('h1', 'Create New Model').should('be.visible');

    // Fill in the model form
    cy.get('input[id="name"]').type('TestModel');
    cy.get('input[id="displayName"]').type('Test Model');
    cy.get('textarea[id="description"]').type('A test model for E2E testing');

    // Add a field
    cy.get('button').contains('Add Field').click();

    // Fill in the field details
    cy.get('input[placeholder="Field name"]').first().type('testField');
    cy.get('input[placeholder="Display name"]').first().type('Test Field');
    cy.get('select').first().select('string');
    cy.get('input[type="checkbox"]').first().check(); // Required

    // Submit the form
    cy.get('button').contains('Create Model').click();

    // Should redirect to models list and show the new model
    cy.url().should('include', '/models');
    cy.contains('Test Model').should('be.visible');
  });
});
