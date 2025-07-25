describe('Create Model', () => {
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
    cy.wait(2000); // Wait for login to complete

    // Verify we're actually logged in by checking for Dashboard content
    cy.contains('Dashboard').should('be.visible');

    // Navigate to models page
    cy.visit('/models');
    cy.wait(2000); // Wait for page to load
  });

  it('should create a new model', () => {
    const timestamp = Date.now();
    const modelName = `TestModel${timestamp}`;
    const displayName = `Test Model ${timestamp}`;

    // Click on "New Model" button
    cy.contains('New Model').click();

    // Should be on the create model page
    cy.url().should('include', '/models/create');
    cy.contains('h1', 'Create New Model').should('be.visible');

    // Fill in the model form
    cy.get('input[id="name"]').type(modelName);
    cy.get('input[id="displayName"]').type(displayName);
    cy.get('textarea[id="description"]').type('A test model for E2E testing');

    // Add a field
    cy.get('button').contains('Add Field').click();

    // Fill in the field details
    cy.get('input[placeholder="Field name"]').first().type('testField');
    cy.get('input[placeholder="Display name"]').first().type('Test Field');
    cy.get('select').first().select('string');
    cy.get('input[type="checkbox"]').first().check(); // Required

    // Submit the form
    cy.get('button').contains('Create Model').click();

    // Should redirect to models list and show the new model
    cy.url().should('include', '/models');
    cy.contains(displayName).should('be.visible');
  });

  it('should create a new model with a relationship', () => {
    const timestamp = Date.now();
    const projectName = `ProjectForRelationship${timestamp}`;
    const projectDisplayName = `Project For Relationship ${timestamp}`;
    const taskName = `TaskForRelationship${timestamp}`;
    const taskDisplayName = `Task For Relationship ${timestamp}`;

    // Create a base model (Project)
    cy.contains('New Model').click();
    cy.url().should('include', '/models/create');
    cy.get('input[id="name"]').type(projectName);
    cy.get('input[id="displayName"]').type(projectDisplayName);
    cy.get('textarea[id="description"]').type('A project entity');
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('title');
    cy.get('input[placeholder="Display name"]').first().type('Title');
    cy.get('select').first().select('string');
    cy.get('input[type="checkbox"]').first().check(); // Required
    cy.get('button').contains('Create Model').click();
    cy.url().should('include', '/models');
    cy.contains(projectDisplayName).should('be.visible');

    // Create a related model (Task) with a relationship to Project
    cy.contains('New Model').click();
    cy.url().should('include', '/models/create');
    cy.get('input[id="name"]').type(taskName);
    cy.get('input[id="displayName"]').type(taskDisplayName);
    cy.get('textarea[id="description"]').type('A task entity');
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('description');
    cy.get('input[placeholder="Display name"]').first().type('Description');
    cy.get('select').first().select('string');
    cy.get('input[type="checkbox"]').first().check(); // Required

    // Add a relationship
    cy.get('button').contains('Add Relationship').click();
    cy.get('input[placeholder="e.g., project_tasks"]').type('projectTasks');
    cy.get('input[placeholder="e.g., Project Tasks"]').type('Project Tasks');
    cy.get('select').eq(1).select('many-to-one'); // Relationship type
    cy.get('select').eq(2).select(projectDisplayName); // Target model
    cy.get('input[placeholder="e.g., projectId"]').type('projectId'); // Source field
    cy.get('input[placeholder="e.g., id"]').type('id'); // Target field
    cy.get('textarea[placeholder="Describe this relationship..."]').type('Each task belongs to a project.');

    cy.get('button').contains('Create Model').click();
    cy.url().should('include', '/models');
    cy.contains(taskDisplayName).should('be.visible');
  });
});
