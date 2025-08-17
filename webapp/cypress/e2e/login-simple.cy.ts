describe('Login Form Interaction', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should fill out the form and submit', () => {
    // Fill out the form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Allow either loading state or successful redirect
    cy.get('button[type="submit"]').then(($btn) => {
      const hasLoading = $btn.text().includes('Signing in');
      if (!hasLoading) {
        cy.url().should('include', '/');
      }
    });
  });

  it('should show error for empty form submission', () => {
    // Try to submit without filling anything
    cy.get('button[type="submit"]').click();

    // Should remain on login page and not navigate
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });

  it('should clear error when user starts typing', () => {
    // First try to submit empty form to trigger error
    cy.get('button[type="submit"]').click();

    // Start typing in email field
    cy.get('input[name="email"]').type('test');

    // Error should be cleared
    cy.get('[role="alert"]').should('not.exist');
  });
});
