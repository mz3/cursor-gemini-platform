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

    // Check that the button shows loading state
    cy.get('button[type="submit"]').should('contain', 'Signing in');
  });

  it('should show error for empty form submission', () => {
    // Try to submit without filling anything
    cy.get('button[type="submit"]').click();

    // Should show validation error
    cy.contains('required').should('be.visible');
  });

  it('should clear error when user starts typing', () => {
    // First try to submit empty form to trigger error
    cy.get('button[type="submit"]').click();

    // Start typing in email field
    cy.get('input[name="email"]').type('test');

    // Error should be cleared
    cy.contains('required').should('not.exist');
  });
});
