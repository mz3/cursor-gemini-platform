describe('Basic Page Loading', () => {
  it('should load the login page', () => {
    cy.visit('/');

    // Check if we're on the login page
    cy.contains('Meta Platform').should('be.visible');
    cy.contains('Sign in to your account').should('be.visible');

    // Check if form elements are present
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show form elements', () => {
    cy.visit('/');

    // Check form elements exist
    cy.get('form').should('exist');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });
});
