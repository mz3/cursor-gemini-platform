describe('Entity Manager Debug Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[placeholder="Email address"]').type('admin@platform.com');
    cy.get('input[placeholder="Password"]').type('admin123');
    cy.get('button').contains('Sign in').click();
    cy.url().should('include', '/');
  });

  it('should create a model and check for errors', () => {
    // Navigate to Entities
    cy.contains('Entities').click();
    cy.url().should('include', '/entity-manager');
    
    // Wait for the page to load (should be on Models tab by default)
    cy.contains('Create New Model').should('be.visible');
    
    // Fill in required fields to enable the Create Model button
    cy.get('input[placeholder*="Dog, Product, User"]').type('TestModel');
    cy.get('input[placeholder*="Dog Model, Product Model"]').type('Test Model');
    
    // Add a field to make the form valid
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').type('name');
    cy.get('select').select('string');
    
    // Now try to create the model
    cy.contains('Create Model').click();
    
    // Handle the alert that appears (could be success or error)
    cy.on('window:alert', (text) => {
      if (text.includes('Model created successfully!')) {
        console.log('✅ Model created successfully!');
      } else if (text.includes('Error creating model')) {
        console.log('❌ Error creating model');
      } else {
        console.log('⚠️ Unexpected alert message:', text);
      }
    });
  });
}); 