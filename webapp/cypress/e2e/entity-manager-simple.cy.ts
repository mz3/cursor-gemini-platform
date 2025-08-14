describe('Entity Manager Simple E2E Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('should load the Entity Manager page', () => {
    // Navigate to Entities
    cy.contains('Entities').click();
    cy.url().should('include', '/entity-manager');

    // Wait for the page to load and verify we're on the Schemas tab by default
    cy.contains('Create New Schema').should('be.visible');

    // Switch to Entities tab and verify
    cy.get('button').contains('Entities').click();
    cy.contains('Create New Entity').should('be.visible');
  });

  it('should be able to fill out the Schema creation form', () => {
    // Navigate to Entities
    cy.contains('Entities').click();
    cy.url().should('include', '/entity-manager');

    // Wait for the page to load (should be on Schemas tab by default)
    cy.contains('Create New Schema').should('be.visible');

    // Fill in the Schema form
    cy.get('input[placeholder*="Dog, Product, User"]').type('TestSchema');
    cy.get('input[placeholder*="Dog Schema, Product Schema"]').type('Test Schema');

    // Add a field
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').type('testField');
    cy.get('select').select('string');

    // Verify the form is filled correctly
    cy.get('input[placeholder*="Dog, Product, User"]').should('have.value', 'TestSchema');
    cy.get('input[placeholder*="Dog Schema, Product Schema"]').should('have.value', 'Test Schema');
    cy.get('input[placeholder="Field name"]').should('have.value', 'testField');
  });
});
