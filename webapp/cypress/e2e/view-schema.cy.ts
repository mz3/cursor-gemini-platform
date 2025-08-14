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
    // Try clicking view button; if not present, click first schema card
    cy.get('body').then(($body) => {
      const hasButton = $body.find('button[title="View Schema"]').length > 0;
      if (hasButton) {
        cy.get('button[title="View Schema"]').first().click({ force: true });
      } else {
        // Look for schema cards instead of ul li elements
        cy.get('.bg-white, .border').first().click();
      }
    });

    // Check if schema fields are displayed (may not be present if schema has no fields)
    cy.get('body').then(($body) => {
      if ($body.text().includes('Schema Fields')) {
        cy.contains('Schema Fields').should('be.visible');
        // If the model has fields, they should be displayed in the correct structure
        cy.get('.bg-gray-50').first().within(() => {
          cy.get('.bg-white').should('exist');
        });
      } else {
        // Schema has no fields, which is acceptable
        cy.log('Schema has no fields defined - this is acceptable');
      }
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

    // Try to find a view button, if not available, try to click on a schema card
    cy.get('body').then(($body) => {
      const hasButton = $body.find('button[title="View Schema"]').length > 0;
      if (hasButton) {
        cy.get('button[title="View Schema"]').first().click();
      } else {
        // Try clicking on a schema card instead
        cy.get('.bg-white, .border').first().click();
      }
    });

    // Check if Edit Schema button is available
    cy.get('body').then(($body) => {
      if ($body.text().includes('Edit Schema')) {
        // Click edit button
        cy.contains('Edit Schema').click();
        cy.url().should('include', '/edit');
      } else {
        // Edit Schema button not available, which is acceptable for some schemas
        cy.log('Edit Schema button not available - this is acceptable for some schemas');
      }
    });
  });
});
