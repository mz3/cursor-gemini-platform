describe('Meta Platform Support Bot Simple E2E Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[type="email"]').type(Cypress.env('testEmail'));
    cy.get('input[type="password"]').type(Cypress.env('testPassword'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('should chat with bot and request Schema creation', () => {
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

    // Send a Schema creation request
    cy.get('input[placeholder="Type your message..."]').type(
      `Please create a Schema called "${SchemaName}" with display name "${displayName}". The Schema should have a field called "name" that should be string type and a field called "age" that should be number type.`
    );
    cy.contains('Send').click();

    // Wait for any initial response and then for the final response
    cy.wait(3000);
    cy.get('.bg-gray-200, .bg-white').should('exist'); // Check for any bot response bubble

    // Wait for intermediate status messages and final response
    cy.wait(12000); // Increased wait time for the new messaging system

    // Verify the bot responded with a final response
    cy.get('body').should('contain', 'Schema'); // Check if any response contains 'Schema'
    cy.get('.bg-gray-200, .bg-white').should('exist'); // Check for bot response bubble

    // Look for the final response that contains the Schema details
    cy.get('body').should('contain', 'successfully created');
  });

  it('should handle Schema creation with different parameters', () => {
    const SchemaName = `SimpleSchema${Date.now()}`;
    const displayName = `Simple Schema ${Date.now()}`;

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
      `Create a Schema called "${SchemaName}" with display name "${displayName}". The Schema should have these fields: title should be string type, description should be string type, and isbn should be string type.`
    );
    cy.contains('Send').click();

    // Wait for any response (could be "Processing your message..." or mock response)
    cy.wait(3000);
    cy.get('body').then(($body) => {
      if ($body.text().includes('Processing your message...')) {
        cy.contains('Processing your message...').should('exist');
      } else {
        // If using mock responses, just check for any bot response
        cy.get('.bg-gray-200, .bg-white').should('exist');
      }
    });

    // Wait for intermediate status messages and final response
    cy.wait(12000); // Increased wait time for the new messaging system

    // Verify the bot responded with a final response
    cy.get('body').should('contain', 'Schema'); // Check if any response contains 'Schema'
    cy.get('.bg-gray-200, .bg-white').should('exist'); // Check for bot response bubble

    // Look for the final response that contains the Schema details
    cy.get('body').should('contain', 'successfully created');
  });
});
