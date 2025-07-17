describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login form', () => {
    cy.get('h2').should('contain', 'Meta Platform');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign in');
  });

  it('should login with valid credentials', () => {
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should show error with invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('.bg-red-50').should('be.visible');
    cy.get('.text-red-700').should('contain', 'Invalid credentials');
  });
});
