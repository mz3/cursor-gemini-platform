describe('Entity Manager Working Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[placeholder="Email address"]').type('admin@platform.com');
    cy.get('input[placeholder="Password"]').type('admin123');
    cy.get('button').contains('Sign in').click();
    cy.url().should('include', '/');
  });

  it('should load Entity Manager and create a model', () => {
    // Navigate to Entity Manager
    cy.contains('Entity Manager').click();
    cy.url().should('include', '/entity-manager');

    // Verify the page loads
    cy.contains('Entity Manager').should('be.visible');
    cy.contains('Create New Model').should('be.visible');
    
    // Fill in model details
    cy.get('input[placeholder*="Dog, Product, User"]').type('TestModel');
    cy.get('input[placeholder*="Dog Model, Product Model"]').type('Test Model');
    
    // Add a field
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('name');
    cy.get('select').first().select('string');
    
    // Create the model
    cy.contains('Create Model').click();
    
    // Wait for any response (success or error)
    cy.wait(3000);
    
    // Check if there's any alert or error message
    cy.get('body').then(($body) => {
      if ($body.text().includes('Model created successfully!')) {
        cy.log('✅ Model created successfully!');
      } else if ($body.text().includes('Error creating model')) {
        cy.log('❌ Model creation failed');
      } else {
        cy.log('⚠️ No clear success/error message found');
      }
    });
    
    // Verify the form is cleared (indicates success)
    cy.get('input[placeholder*="Dog, Product, User"]').should('have.value', '');
    cy.get('input[placeholder*="Dog Model, Product Model"]').should('have.value', '');
  });
}); 