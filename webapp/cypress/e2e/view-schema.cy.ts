describe('View Schema', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[type="email"]').type(Cypress.env('testEmail'));
    cy.get('input[type="password"]').type(Cypress.env('testPassword'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('should view a schema and display its information', () => {
    // Navigate to schemas page
    cy.contains('Schemas').click();
    cy.url().should('include', '/schemas');

    // Click on the first schema to view it
    cy.get('button[title="View Schema"]').first().click();

    // Should be on the view schema page
    cy.url().should('include', '/schemas/');
    cy.url().should('not.include', '/edit');

    // Check that schema information is displayed
    cy.get('h1').should('be.visible'); // Schema display name
    cy.contains('Schema Details').should('be.visible');
    cy.contains('Created By').should('be.visible');
    cy.contains('Timestamps').should('be.visible');
    cy.contains('Schema Definition').should('be.visible');
    cy.contains('Schema Entities').should('be.visible');

    // Check that the Edit Schema button is present
    cy.contains('Edit Schema').should('be.visible');
  });

  it('should display schema fields correctly', () => {
    // Navigate to schemas and view a schema
    cy.contains('Schemas').click();
    cy.get('button[title="View Schema"]').first().click();

    // Check that schema fields are displayed
    cy.contains('Schema Fields').should('be.visible');

    // If the model has fields, they should be displayed
    cy.get('.bg-gray-50').first().within(() => {
      cy.get('.bg-white').should('exist');
    });
  });

  it('should display schema entities table', () => {
    // Navigate to schemas and view a schema
    cy.contains('Schemas').click();
    cy.get('button[title="View Schema"]').first().click();

    // Check that the entities table is displayed
    cy.contains('Schema Entities').should('be.visible');
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

  it('should navigate back to schemas list', () => {
    // Navigate to schemas and view a schema
    cy.contains('Schemas').click();
    cy.get('button[title="View Schema"]').first().click();

    // Click back button
    cy.contains('Back to Schemas').click();
    cy.url().should('include', '/schemas');
    cy.url().should('not.include', '/schemas/');
  });

  it('should navigate to edit schema page', () => {
    // Navigate to schemas and view a schema
    cy.contains('Schemas').click();
    cy.get('button[title="View Schema"]').first().click();

    // Click edit button
    cy.contains('Edit Schema').click();
    cy.url().should('include', '/edit');
  });
});
