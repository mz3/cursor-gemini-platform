describe('Entity Manager Debug Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('should create a Schema and check for errors', () => {
    // Navigate to Entities
    cy.contains('Entities').click();
    cy.url().should('include', '/entity-manager');

    // Wait for the page to load (should be on Schemas tab by default)
    cy.contains('Create New Schema').should('be.visible');

    // Fill in required fields to enable the Create Schema button
    cy.get('input[placeholder*="Dog, Product, User"]').type('TestSchema');
    cy.get('input[placeholder*="Dog Schema, Product Schema"]').type('Test Schema');

    // Add a field to make the form valid
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').type('name');
    cy.get('select').select('string');

    // Now try to create the Schema
    cy.contains('Create Schema').click();

    // Handle the alert that appears (could be success or error)
    cy.on('window:alert', (text) => {
      if (text.includes('Schema created successfully!')) {
        console.log('✅ Schema created successfully!');
      } else if (text.includes('Error creating Schema')) {
        console.log('❌ Error creating Schema');
      } else {
        console.log('⚠️ Unexpected alert message:', text);
      }
    });
  });
});
