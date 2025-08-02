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
    const modelName = `TestModel${Date.now()}`;
    const displayName = `Test Model ${Date.now()}`;

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

    // Send a model creation request
    cy.get('input[placeholder="Type your message..."]').type(
      `Please create a model called "${modelName}" with display name "${displayName}". The model should have a field called "name" that should be string type and a field called "age" that should be number type.`
    );
    cy.contains('Send').click();

    // Wait for any initial response and then for the final response
    cy.wait(3000);
    cy.get('.bg-gray-200, .bg-white').should('exist'); // Check for any bot response bubble
    
    // Wait for intermediate status messages and final response
    cy.wait(12000); // Increased wait time for the new messaging system
    
    // Verify the bot responded with a final response
    cy.get('body').should('contain', 'model'); // Check if any response contains 'model'
    cy.get('.bg-gray-200, .bg-white').should('exist'); // Check for bot response bubble
    
    // Look for the final response that contains the model details
    cy.get('body').should('contain', 'successfully created');
  });

  it('should handle model creation with different parameters', () => {
    const modelName = `SimpleModel${Date.now()}`;
    const displayName = `Simple Model ${Date.now()}`;

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

    // Send a different model creation request
    cy.get('input[placeholder="Type your message..."]').type(
      `Create a model called "${modelName}" with display name "${displayName}". The model should have these fields: title should be string type, description should be string type, and isbn should be string type.`
    );
    cy.contains('Send').click();

    // Wait for the initial "Processing your message..." response
    cy.contains('Processing your message...').should('be.visible');
    
    // Wait for intermediate status messages and final response
    cy.wait(12000); // Increased wait time for the new messaging system
    
    // Verify the bot responded with a final response
    cy.get('body').should('contain', 'model'); // Check if any response contains 'model'
    cy.get('.bg-gray-200, .bg-white').should('exist'); // Check for bot response bubble
    
    // Look for the final response that contains the model details
    cy.get('body').should('contain', 'successfully created');
  });
}); 