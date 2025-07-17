describe('Prompts Simple', () => {
  beforeEach(() => {
    // Use environment variables for credentials
    const testEmail = Cypress.env('testEmail') || 'admin@platform.com';
    const testPassword = Cypress.env('testPassword') || 'admin123';

    // Login before each test
    cy.visit('/');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for login to complete
    cy.url().should('include', '/');
    cy.wait(2000);
  });

  it('should navigate to prompts page', () => {
    cy.visit('/prompts');
    cy.contains('h1', 'Prompts').should('be.visible');
  });

  it('should show prompts list', () => {
    cy.visit('/prompts');
    cy.get('h1').should('contain', 'Prompts');
  });
});
