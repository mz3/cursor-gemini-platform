describe('Edit Model', () => {
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

  it('should edit an existing model', () => {
    // First, create a model to edit
    cy.contains('New Model').click();
    cy.url().should('include', '/models/create');

    // Fill in the model form
    cy.get('input[id="name"]').type('TestModelForEdit');
    cy.get('input[id="displayName"]').type('Test Model For Edit');
    cy.get('textarea[id="description"]').type('A test model for editing');

    // Add a field
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('originalField');
    cy.get('input[placeholder="Display name"]').first().type('Original Field');
    cy.get('select').first().select('string');
    cy.get('input[type="checkbox"]').first().check(); // Required

    // Submit the form
    cy.get('button').contains('Create Model').click();
    cy.url().should('include', '/models');
    cy.contains('Test Model For Edit').should('be.visible');

    // Now edit the model
    cy.get('button[title="Edit Model"]').first().click();
    cy.url().should('include', '/edit');

    // Verify the form is populated with existing data
    cy.get('input[id="name"]').should('have.value', 'TestModelForEdit');
    cy.get('input[id="displayName"]').should('have.value', 'Test Model For Edit');
    cy.get('textarea[id="description"]').should('have.value', 'A test model for editing');

    // Update the model information
    cy.get('input[id="displayName"]').clear().type('Updated Test Model');
    cy.get('textarea[id="description"]').clear().type('Updated description for the test model');

    // Update the existing field
    cy.get('input[placeholder="Display name"]').first().clear().type('Updated Field');

    // Add a new field
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').last().type('newField');
    cy.get('input[placeholder="Display name"]').last().type('New Field');
    cy.get('select').last().select('number');

    // Submit the form
    cy.get('button').contains('Update Model').click();

    // Should redirect to models list and show the updated model
    cy.url().should('include', '/models');
    cy.contains('Updated Test Model').should('be.visible');
  });

  it('should edit a model with relationships', () => {
    // First, create two models to establish a relationship
    // Create Project model
    cy.contains('New Model').click();
    cy.get('input[id="name"]').type('Project');
    cy.get('input[id="displayName"]').type('Project');
    cy.get('textarea[id="description"]').type('A project entity');
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('title');
    cy.get('input[placeholder="Display name"]').first().type('Title');
    cy.get('select').first().select('string');
    cy.get('input[type="checkbox"]').first().check(); // Required
    cy.get('button').contains('Create Model').click();
    cy.url().should('include', '/models');

    // Create Task model with relationship
    cy.contains('New Model').click();
    cy.get('input[id="name"]').type('Task');
    cy.get('input[id="displayName"]').type('Task');
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
    cy.get('select').eq(2).select('Project'); // Target model
    cy.get('input[placeholder="e.g., projectId"]').type('projectId'); // Source field
    cy.get('input[placeholder="e.g., id"]').type('id');
    cy.get('textarea[placeholder="Describe this relationship..."]').type('Each task belongs to a project.');

    cy.get('button').contains('Create Model').click();
    cy.url().should('include', '/models');

    // Now edit the Task model
    cy.get('button[title="Edit Model"]').last().click(); // Click edit on the Task model
    cy.url().should('include', '/edit');

    // Verify the relationship is loaded
    cy.contains('Project Tasks').should('be.visible');

    // Update the relationship
    cy.get('input[placeholder="e.g., Project Tasks"]').clear().type('Updated Project Tasks');
    cy.get('textarea[placeholder="Describe this relationship..."]').clear().type('Updated relationship description.');

    // Add a new field to the model
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').last().type('priority');
    cy.get('input[placeholder="Display name"]').last().type('Priority');
    cy.get('select').last().select('select');

    // Add options for the select field
    cy.get('input[placeholder="e.g., Active, Inactive, Pending"]').type('Low, Medium, High');

    // Submit the form
    cy.get('button').contains('Update Model').click();

    // Should redirect to models list
    cy.url().should('include', '/models');
    cy.contains('Task').should('be.visible');
  });

  it('should handle validation errors when editing a model', () => {
    // Create a model first
    cy.contains('New Model').click();
    cy.get('input[id="name"]').type('ValidationTestModel');
    cy.get('input[id="displayName"]').type('Validation Test Model');
    cy.get('textarea[id="description"]').type('A test model for validation');
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('testField');
    cy.get('input[placeholder="Display name"]').first().type('Test Field');
    cy.get('select').first().select('string');
    cy.get('button').contains('Create Model').click();
    cy.url().should('include', '/models');

    // Edit the model
    cy.get('button[title="Edit Model"]').first().click();
    cy.url().should('include', '/edit');

    // Try to submit with invalid data (empty display name)
    cy.get('input[id="displayName"]').clear();
    cy.get('button').contains('Update Model').click();

    // Should show validation error
    cy.contains('Name and Display Name are required').should('be.visible');

    // Fix the validation error
    cy.get('input[id="displayName"]').type('Fixed Display Name');
    cy.get('button').contains('Update Model').click();

    // Should succeed and redirect
    cy.url().should('include', '/models');
    cy.contains('Fixed Display Name').should('be.visible');
  });
});
