describe('Entity Manager Simple E2E Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[placeholder="Email address"]').type('admin@platform.com');
    cy.get('input[placeholder="Password"]').type('admin123');
    cy.get('button').contains('Sign in').click();
    cy.url().should('include', '/');
  });

  it('should load the Entity Manager page', () => {
    // Navigate to Entities
    cy.contains('Entities').click();
    cy.url().should('include', '/entity-manager');
    
    // Wait for the page to load and verify we're on the Models tab by default
    cy.contains('Create New Model').should('be.visible');
    
    // Switch to Entities tab and verify
    cy.get('button').contains('Entities').click();
    cy.contains('Create New Entity').should('be.visible');
  });

  it('should be able to fill out the model creation form', () => {
    // Navigate to Entities
    cy.contains('Entities').click();
    cy.url().should('include', '/entity-manager');
    
    // Wait for the page to load (should be on Models tab by default)
    cy.contains('Create New Model').should('be.visible');
    
    // Fill in the model form
    cy.get('input[placeholder*="Dog, Product, User"]').type('TestModel');
    cy.get('input[placeholder*="Dog Model, Product Model"]').type('Test Model');
    
    // Add a field
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').type('testField');
    cy.get('select').select('string');
    
    // Verify the form is filled correctly
    cy.get('input[placeholder*="Dog, Product, User"]').should('have.value', 'TestModel');
    cy.get('input[placeholder*="Dog Model, Product Model"]').should('have.value', 'Test Model');
    cy.get('input[placeholder="Field name"]').should('have.value', 'testField');
  });
}); 