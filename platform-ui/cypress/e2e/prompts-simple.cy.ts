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

    // Wait for login to complete and verify we're logged in
    cy.url().should('include', '/');
    cy.wait(2000);

    // Verify we're actually logged in by checking for Dashboard content
    cy.contains('Dashboard').should('be.visible');
  });

  it('should navigate to prompts page', () => {
    cy.visit('/prompts');

    // Debug: Log the page content
    cy.get('body').then(($body) => {
      console.log('Page content:', $body.text());
    });

    // Debug: Check if there are any h1 elements
    cy.get('h1').then(($h1s) => {
      console.log('H1 elements found:', $h1s.length);
      $h1s.each((i, el) => {
        console.log(`H1 ${i}:`, el.textContent);
      });
    });

    cy.contains('h1', 'Prompts').should('be.visible');
  });

  it('should show prompts list', () => {
    cy.visit('/prompts');

    // Debug: Log the page content
    cy.get('body').then(($body) => {
      console.log('Page content:', $body.text());
    });

    cy.get('h1').should('contain', 'Prompts');
  });
});
