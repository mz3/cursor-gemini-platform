describe('Prompts Management', () => {
  beforeEach(() => {
    // Use environment variables for credentials
    const testEmail = Cypress.env('testEmail') || 'admin@platform.com';
    const testPassword = Cypress.env('testPassword') || 'admin123';

    // Login before each test
    cy.visit('/');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for login to complete and navigate to prompts
    cy.url().should('include', '/');
    cy.wait(2000); // Wait for login to complete
    cy.visit('/prompts');
    cy.wait(2000); // Wait for page to load
  });

  it('should create a new prompt', () => {
    // Debug: Check what page we're on
    cy.url().then(url => {
      cy.log('Current URL:', url);
    });

    // Check if we're on the prompts page
    cy.contains('h1', 'Prompts').should('be.visible');

    // Debug: Check what's on the page
    cy.get('body').then($body => {
      cy.log('Page content:', $body.text());
    });

    // Click on "New Prompt" button
    cy.contains('New Prompt').click();

    // Debug: Check URL after clicking
    cy.url().then(url => {
      cy.log('URL after clicking New Prompt:', url);
    });

    cy.url().should('include', '/prompts/create');

    // Debug: Check if we're on the create page
    cy.contains('h1', 'Create New Prompt').should('be.visible');

    // Fill in the prompt form
    cy.get('input[id="name"]').type('Test LLM Prompt');
    cy.get('select[id="type"]').select('llm');
    cy.get('textarea[id="description"]').type('A test prompt for LLM interactions');
    cy.get('textarea[id="content"]').type('You are a helpful AI assistant. Please help me with: {task}', { parseSpecialCharSequences: false });

    // Submit the form
    cy.contains('Create Prompt').click();

    // Should redirect to prompts list and show the new prompt
    cy.url().should('include', '/prompts');
    cy.contains('Test LLM Prompt').should('be.visible');
    cy.contains('LLM').should('be.visible');
    cy.contains('v1').should('be.visible');
  });

  it('should update a prompt and create a new version', () => {
    // Check if we're on the prompts page
    cy.contains('h1', 'Prompts').should('be.visible');

    // First create a prompt
    cy.contains('New Prompt').click();
    cy.get('input[id="name"]').type('Update Test Prompt');
    cy.get('select[id="type"]').select('code_generation');
    cy.get('textarea[id="description"]').type('A test prompt for code generation');
    cy.get('textarea[id="content"]').type('Generate code for: {language} {task}', { parseSpecialCharSequences: false });
    cy.contains('Create Prompt').click();

    // Wait for redirect and find the created prompt
    cy.url().should('include', '/prompts');
    cy.contains('Update Test Prompt').should('be.visible');

    // Click edit button for the prompt
    cy.contains('Update Test Prompt').parent().parent().parent().parent().within(() => {
      cy.contains('Edit').click();
    });

    // Should be on edit page
    cy.url().should('include', '/prompts/');
    cy.url().should('include', '/edit');

    // Update the prompt content
    cy.get('textarea[id="content"]').clear().type('Generate optimized code for: {language} {task} with best practices', { parseSpecialCharSequences: false });

    // Submit the update
    cy.contains('Update Prompt').click();

    // Should redirect back to prompts list
    cy.url().should('include', '/prompts');
    cy.contains('Update Test Prompt').should('be.visible');
    cy.contains('v2').should('be.visible'); // Should show version 2
  });

  it('should view prompt versions', () => {
    // Check if we're on the prompts page
    cy.contains('h1', 'Prompts').should('be.visible');

    // First create a prompt
    cy.contains('New Prompt').click();
    cy.get('input[id="name"]').type('Version Test Prompt');
    cy.get('select[id="type"]').select('llm');
    cy.get('textarea[id="description"]').type('A test prompt for versioning');
    cy.get('textarea[id="content"]').type('Original content: {input}', { parseSpecialCharSequences: false });
    cy.contains('Create Prompt').click();

    // Wait for redirect
    cy.url().should('include', '/prompts');
    cy.contains('Version Test Prompt').should('be.visible');

    // Update the prompt to create a version
    cy.contains('Version Test Prompt').parent().parent().parent().parent().within(() => {
      cy.contains('Edit').click();
    });

    cy.get('textarea[id="content"]').clear().type('Updated content: {input} with improvements', { parseSpecialCharSequences: false });
    cy.contains('Update Prompt').click();

    // Wait for redirect
    cy.url().should('include', '/prompts');
    cy.contains('Version Test Prompt').should('be.visible');

    // Click on Versions button
    cy.contains('Version Test Prompt').parent().parent().parent().parent().within(() => {
      cy.contains('Versions').click();
    });

    // Should be on versions page
    cy.url().should('include', '/prompts/');
    cy.url().should('include', '/versions');

    // Wait for versions to load
    cy.wait(2000);

    // Debug: Check what's on the versions page
    cy.get('body').then($body => {
      cy.log('Versions page content:', $body.text());
    });

    // Should show both versions
    cy.contains('v1').should('be.visible');
    cy.contains('v2').should('be.visible');

    // Click on version 1 to view its content
    cy.contains('v1').click();
    cy.contains('Original content: {input}').should('be.visible');

    // Click on version 2 to view its content
    cy.contains('v2').click();
    cy.contains('Updated content: {input} with improvements').should('be.visible');

    // Should show active indicator for the latest version
    cy.contains('v2').parent().parent().within(() => {
      cy.get('.text-green-500').should('be.visible'); // CheckCircle icon
    });
  });

  it('should delete a prompt', () => {
    // Check if we're on the prompts page
    cy.contains('h1', 'Prompts').should('be.visible');

    // First create a prompt with a unique name
    const uniqueName = `Delete Test Prompt ${Date.now()}`;
    cy.contains('New Prompt').click();
    cy.get('input[id="name"]').type(uniqueName);
    cy.get('select[id="type"]').select('llm');
    cy.get('textarea[id="content"]').type('This prompt will be deleted', { parseSpecialCharSequences: false });
    cy.contains('Create Prompt').click();

    // Wait for redirect
    cy.url().should('include', '/prompts');
    cy.contains(uniqueName).should('be.visible');

    // Debug: Check if the delete button exists
    cy.contains(uniqueName).should('be.visible');
    cy.get('button').contains('Delete').should('be.visible');

    // Stub the window.confirm function to return true
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    // Intercept the delete request and wait for it to complete
    cy.intercept('DELETE', '/api/prompts/*').as('deletePrompt');
    cy.intercept('GET', '/api/prompts').as('getPrompts');

    // Click delete button using a more specific selector
    cy.contains(uniqueName).closest('li').find('button').contains('Delete').click();

    // Wait for the delete request to complete
    cy.wait('@deletePrompt');

    // Wait for the list refresh to complete
    cy.wait('@getPrompts');

    // Wait for the prompt to be removed from the list
    cy.contains(uniqueName).should('not.exist');
  });
});
