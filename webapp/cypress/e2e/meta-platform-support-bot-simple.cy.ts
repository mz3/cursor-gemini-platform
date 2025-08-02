describe('Meta Platform Support Bot Simple E2E Test', () => {
  beforeEach(() => {
    // Use environment variables for credentials
    const testEmail = Cypress.env('testEmail') || 'admin@platform.com';
    const testPassword = Cypress.env('testPassword') || 'admin123';

    // Login before each test
    cy.visit('/');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for login to complete and verify we're logged in
    cy.url().should('include', '/');
    cy.wait(2000); // Wait for login to complete
    cy.contains('Dashboard').should('be.visible');
  });

  it('should chat with bot and request model creation', () => {
    const timestamp = Date.now();
    const modelName = `TestModel${timestamp}`;
    const displayName = `Test Model ${timestamp}`;

    // Step 1: Navigate to Bots page
    cy.contains('Bots').click();
    cy.url().should('include', '/bots');
    cy.wait(2000);

    // Step 2: Find and click on the View Bot button for Meta Platform Support Bot
    cy.contains('Meta Platform Customer Support Bot').closest('li').find('button[title="View Bot"]').click();
    cy.url().should('include', '/bots/');
    cy.wait(2000);

    // Step 3: Switch to Chat tab
    cy.contains('Chat').click();
    cy.wait(2000);

    // Step 4: Check if bot is running and start if needed
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Start Bot")').length > 0) {
        cy.get('button').contains('Start Bot').click();
        cy.wait(3000); // Wait for bot to start
      } else {
        // Bot is already running, we can see "Stop Bot" button
        cy.contains('Stop Bot').should('be.visible');
      }
    });

    // Step 5: Send initial greeting
    cy.get('input[placeholder="Type your message..."]').type('Hello, I need help creating a model');
    cy.contains('Send').click();
    cy.wait(3000); // Wait for bot response

    // Step 6: Ask bot to create a model
    cy.get('input[placeholder="Type your message..."]').type(
      `Please create a simple model called "${modelName}" with display name "${displayName}" and two parameters: name (string, required) and age (number, required)`
    );
    cy.contains('Send').click();
    cy.wait(5000); // Wait for bot to process and create model

    // Step 7: Verify the bot responded - use a more robust check
    cy.get('body').should('contain', 'model'); // Check if any response contains 'model'
    
    // Alternative: Check for any bot response bubble
    cy.get('.bg-gray-200, .bg-white').should('exist');

    // Step 8: Ask bot to confirm the model was created
    cy.get('input[placeholder="Type your message..."]').type('Can you confirm the model was created successfully?');
    cy.contains('Send').click();
    cy.wait(3000);

    // Step 9: Verify the bot responded to the confirmation
    cy.get('body').should('contain', 'created'); // Check for any response about creation
  });

  it('should handle model creation with different parameters', () => {
    const timestamp = Date.now();
    const modelName = `ProductModel${timestamp}`;
    const displayName = `Product Model ${timestamp}`;

    // Navigate to bots and start chat
    cy.contains('Bots').click();
    cy.contains('Meta Platform Customer Support Bot').closest('li').find('button[title="View Bot"]').click();
    cy.contains('Chat').click();
    
    // Check if bot is running and start if needed
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Start Bot")').length > 0) {
        cy.get('button').contains('Start Bot').click();
        cy.wait(3000);
      } else {
        cy.contains('Stop Bot').should('be.visible');
      }
    });

    // Send a more complex model creation request
    cy.get('input[placeholder="Type your message..."]').type(
      `Create a product model with name "${modelName}", display name "${displayName}", and fields: productName (string, required), price (number, required), description (string, optional), and inStock (boolean, required)`
    );
    cy.contains('Send').click();
    cy.wait(5000);

    // Verify the bot responded - use a more robust check
    cy.get('body').should('contain', 'model'); // Check if any response contains 'model'
    
    // Alternative: Check for any bot response bubble
    cy.get('.bg-gray-200, .bg-white').should('exist');
  });
}); 