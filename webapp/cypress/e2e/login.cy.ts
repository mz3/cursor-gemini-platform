describe('Login', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should login successfully with valid credentials', () => {
    // Use environment variables for API URL and credentials
    const apiUrl = Cypress.env('apiUrl') || 'http://localhost:4001';
    const testEmail = Cypress.env('testEmail') || 'admin@platform.com';
    const testPassword = Cypress.env('testPassword') || 'admin123';

    // Intercept the login request to verify it goes to the correct API
    cy.intercept('POST', '/api/users/login').as('loginRequest');

    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for the login request and verify it was successful
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

    // Should redirect to dashboard after successful login
    cy.url().should('include', '/');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message - updated to match our new error handling
    cy.contains('Invalid email or password').should('be.visible');
  });
});
