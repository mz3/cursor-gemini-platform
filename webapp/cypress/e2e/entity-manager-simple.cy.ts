describe('Entity Manager Simple E2E Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[placeholder="Email address"]').type('admin@platform.com');
    cy.get('input[placeholder="Password"]').type('admin123');
    cy.get('button').contains('Sign in').click();
    cy.url().should('include', '/');
  });

  it('should load the Entity Manager page', () => {
    // Navigate to Entity Manager
    cy.contains('Entity Manager').click();
    cy.url().should('include', '/entity-manager');

    // Verify the page loads
    cy.contains('Entity Manager').should('be.visible');
    cy.contains('Models').should('be.visible');
    cy.contains('Entities').should('be.visible');
    cy.contains('Create New Model').should('be.visible');
  });

  it('should be able to fill out the model creation form', () => {
    // Navigate to Entity Manager
    cy.contains('Entity Manager').click();
    cy.url().should('include', '/entity-manager');

    // Fill in model details
    cy.get('input[placeholder*="Dog, Product, User"]').type('TestDog');
    cy.get('input[placeholder*="Dog Model, Product Model"]').type('Test Dog Model');
    
    // Add a field
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('name');
    cy.get('select').first().select('string');
    
    // Verify the form is filled
    cy.get('input[placeholder*="Dog, Product, User"]').should('have.value', 'TestDog');
    cy.get('input[placeholder*="Dog Model, Product Model"]').should('have.value', 'Test Dog Model');
    cy.get('input[placeholder="Field name"]').first().should('have.value', 'name');
  });
}); 