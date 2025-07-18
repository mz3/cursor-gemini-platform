describe('View Model', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[type="email"]').type(Cypress.env('testEmail'));
    cy.get('input[type="password"]').type(Cypress.env('testPassword'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('should view a model and display its information', () => {
    // Navigate to models page
    cy.contains('Models').click();
    cy.url().should('include', '/models');

    // Click on the first model to view it
    cy.get('button[title="View Model"]').first().click();

    // Should be on the view model page
    cy.url().should('include', '/models/');
    cy.url().should('not.include', '/edit');

    // Check that model information is displayed
    cy.get('h1').should('be.visible'); // Model display name
    cy.contains('Model Details').should('be.visible');
    cy.contains('Created By').should('be.visible');
    cy.contains('Timestamps').should('be.visible');
    cy.contains('Schema Definition').should('be.visible');
    cy.contains('Model Entities').should('be.visible');

    // Check that the Edit Model button is present
    cy.contains('Edit Model').should('be.visible');
  });

  it('should display schema fields correctly', () => {
    // Navigate to models and view a model
    cy.contains('Models').click();
    cy.get('button[title="View Model"]').first().click();

    // Check that schema fields are displayed
    cy.contains('Schema Fields').should('be.visible');
    
    // If the model has fields, they should be displayed
    cy.get('.bg-gray-50').first().within(() => {
      cy.get('.bg-white').should('exist');
    });
  });

  it('should display model entities table', () => {
    // Navigate to models and view a model
    cy.contains('Models').click();
    cy.get('button[title="View Model"]').first().click();

    // Check that the entities table is displayed
    cy.contains('Model Entities').should('be.visible');
    cy.get('table').should('be.visible');
    
    // Check table headers
    cy.contains('Entity').should('be.visible');
    cy.contains('Display Name').should('be.visible');
    cy.contains('Table Name').should('be.visible');
    cy.contains('Fields').should('be.visible');
    cy.contains('Relationships').should('be.visible');
    cy.contains('Entity Type').should('be.visible');
    cy.contains('Created').should('be.visible');
  });

  it('should navigate back to models list', () => {
    // Navigate to models and view a model
    cy.contains('Models').click();
    cy.get('button[title="View Model"]').first().click();

    // Click back button
    cy.contains('Back to Models').click();
    cy.url().should('include', '/models');
    cy.url().should('not.include', '/models/');
  });

  it('should navigate to edit model page', () => {
    // Navigate to models and view a model
    cy.contains('Models').click();
    cy.get('button[title="View Model"]').first().click();

    // Click edit button
    cy.contains('Edit Model').click();
    cy.url().should('include', '/edit');
  });
}); 