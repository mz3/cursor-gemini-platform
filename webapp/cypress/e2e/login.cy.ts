describe('Login', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should login successfully with valid credentials', () => {
    // Use environment variables for API URL and credentials
    const testEmail = Cypress.env('testEmail') || 'admin@platform.com';
    const testPassword = Cypress.env('testPassword') || 'admin123';

    // Intercept the login request - use wildcard to catch any login endpoint
    cy.intercept('POST', '**/users/login').as('loginRequest');

    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for the login request and verify it was successful
    cy.wait('@loginRequest', { timeout: 10000 }).its('response.statusCode').should('eq', 200);

    // Should redirect to dashboard after successful login
    cy.url().should('include', '/');
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message - updated to match our new error handling
    // ErrorDisplay renders a generic message; ensure some error is shown
    cy.get('[role="alert"], .text-red-600, .bg-red-50').should('exist');
  });
});
