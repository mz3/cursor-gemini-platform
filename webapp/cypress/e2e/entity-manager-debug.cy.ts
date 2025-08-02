describe('Entity Manager Debug Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[placeholder="Email address"]').type('admin@platform.com');
    cy.get('input[placeholder="Password"]').type('admin123');
    cy.get('button').contains('Sign in').click();
    cy.url().should('include', '/');
  });

  it('should create a model and check for errors', () => {
    // Navigate to Entity Manager
    cy.contains('Entity Manager').click();
    cy.url().should('include', '/entity-manager');

    // Fill in model details
    cy.get('input[placeholder*="Dog, Product, User"]').type('TestDog');
    cy.get('input[placeholder*="Dog Model, Product Model"]').type('Test Dog Model');
    
    // Add a field
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('name');
    cy.get('select').first().select('string');
    
    // Create the model and check for any alerts or errors
    cy.contains('Create Model').click();
    
    // Wait a moment and check for any alerts
    cy.wait(2000);
    
    // Check if there's an alert (either success or error)
    cy.on('window:alert', (text) => {
      cy.log('Alert detected:', text);
    });
    
    // Check console for errors
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError');
    });
    
    // Wait a bit more and check for console errors
    cy.wait(2000);
    cy.get('@consoleError').should('have.been.called');
  });
}); 