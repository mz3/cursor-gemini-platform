describe('Simple Prompts Test', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/');
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Wait for login to complete and navigate to prompts
    cy.url().should('include', '/');
    cy.wait(2000); // Wait for login to complete
    cy.visit('/prompts');
    cy.wait(2000); // Wait for page to load
  });

  it('should create a simple prompt', () => {
    // Check if we're on the prompts page
    cy.contains('h1', 'Prompts').should('be.visible');

    // Click on "New Prompt" button
    cy.contains('New Prompt').click();
    cy.url().should('include', '/prompts/create');

    // Fill in the prompt form
    cy.get('input[id="name"]').type('Simple Test Prompt');
    cy.get('select[id="type"]').select('llm');
    cy.get('textarea[id="content"]').type('Simple test content', { parseSpecialCharSequences: false });

    // Submit the form
    cy.contains('Create Prompt').click();

    // Should redirect to prompts list and show the new prompt
    cy.url().should('include', '/prompts');
    cy.contains('Simple Test Prompt').should('be.visible');
  });
});
