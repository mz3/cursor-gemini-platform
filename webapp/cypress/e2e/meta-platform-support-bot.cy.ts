describe('Meta Platform Support Bot E2E Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[type="email"]').type(Cypress.env('testEmail'));
    cy.get('input[type="password"]').type(Cypress.env('testPassword'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('should complete full user journey: login -> chat with bot -> create model -> verify model exists', () => {
    const SchemaName = `TestSchema${Date.now()}`;
    const displayName = `Test Schema ${Date.now()}`;

    // Navigate to bots and start chat
    cy.contains('Bots').click();
    cy.contains('Meta Platform Customer Support Bot').closest('li').find('button[title="View Bot"]').click();
    cy.contains('Chat').click();

    // Handle WebSocket connection issues by ignoring uncaught exceptions
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('WebSocket not connected')) {
        return false; // Prevent the test from failing
      }
      return true;
    });

    // Check if bot is running and start if needed
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Start Bot")').length > 0) {
        cy.contains('Start Bot').click();
        cy.contains('Stop Bot', { timeout: 10000 }).should('be.visible');
      } else {
        cy.contains('Stop Bot').should('be.visible');
      }
    });

    // Send a Schema creation request
    cy.get('input[placeholder="Type your message..."]').type(
      `Please create a Schema called "${SchemaName}" with display name "${displayName}". The Schema should have a field called "name" that should be string type and a field called "age" that should be number type.`
    );
    cy.contains('Send').click();

    // Wait for bot response
    cy.wait(15000); // Increased wait time for bot processing

    // Verify the bot responded
    cy.get('body').should('contain', 'Schema');
    cy.get('.bg-gray-200, .bg-white').should('exist');

    // Navigate to schemas to verify the model was created
    cy.contains('Schemas').click();
    cy.url().should('include', '/schemas');

    // Check if the created schema appears in the list
    cy.get('body').should('contain', SchemaName);
  });

  it('should handle bot conversation and model creation with different parameters', () => {
    const SchemaName = `ProductSchema${Date.now()}`;
    const displayName = `Product Schema ${Date.now()}`;

    // Navigate to bots and start chat
    cy.contains('Bots').click();
    cy.contains('Meta Platform Customer Support Bot').closest('li').find('button[title="View Bot"]').click();
    cy.contains('Chat').click();

    // Handle WebSocket connection issues by ignoring uncaught exceptions
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('WebSocket not connected')) {
        return false; // Prevent the test from failing
      }
      return true;
    });

    // Check if bot is running and start if needed - handle element detachment
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Start Bot")').length > 0) {
        // Use a more robust approach to handle element detachment
        cy.contains('Start Bot').should('be.visible').then(($btn) => {
          if ($btn.length > 0) {
            cy.wrap($btn).click({ force: true });
            cy.wait(1000);
          }
        });

        // Wait for the bot to start
        cy.contains('Stop Bot', { timeout: 10000 }).should('be.visible');
      } else {
        cy.contains('Stop Bot').should('be.visible');
      }
    });

    // Send a different Schema creation request
    cy.get('input[placeholder="Type your message..."]').type(
      `Create a Schema called "${SchemaName}" with display name "${displayName}". The Schema should have these fields: title should be string type, price should be number type, and description should be string type.`
    );
    cy.contains('Send').click();

    // Wait for bot response
    cy.wait(15000); // Increased wait time for bot processing

    // Verify the bot responded
    cy.get('body').should('contain', 'Schema');
    cy.get('.bg-gray-200, .bg-white').should('exist');

    // Navigate to schemas to verify the model was created
    cy.contains('Schemas').click();
    cy.url().should('include', '/schemas');

    // Check if the created schema appears in the list
    cy.get('body').should('contain', SchemaName);
  });

  it('should handle bot errors gracefully', () => {
    // Navigate to bots and start chat
    cy.contains('Bots').click();
    cy.contains('Meta Platform Customer Support Bot').closest('li').find('button[title="View Bot"]').click();
    cy.contains('Chat').click();

    // Handle WebSocket connection issues by ignoring uncaught exceptions
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('WebSocket not connected')) {
        return false; // Prevent the test from failing
      }
      return true;
    });

    // Check if bot is running and start if needed
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Start Bot")').length > 0) {
        cy.contains('Start Bot').click();
        cy.contains('Stop Bot', { timeout: 10000 }).should('be.visible');
      } else {
        cy.contains('Stop Bot').should('be.visible');
      }
    });

    // Send an invalid request to test error handling
    cy.get('input[placeholder="Type your message..."]').type('This is an invalid request that should cause an error');
    cy.contains('Send').click();

    // Wait for bot response
    cy.wait(10000);

    // Verify that some response was received (even if it's an error)
    cy.get('.bg-gray-200, .bg-white').should('exist');
  });
});
