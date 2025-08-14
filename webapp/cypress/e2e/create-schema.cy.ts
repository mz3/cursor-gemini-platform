describe('Create Schema', () => {
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

    // Navigate to schemas page
    cy.visit('/schemas');
    cy.wait(2000); // Wait for page to load
  });

  it('should create a new schema', () => {
    const timestamp = Date.now();
    const schemaName = `TestSchema${timestamp}`;
    const displayName = `Test Schema ${timestamp}`;

    // Click on "New Schema" button
    cy.contains('New Schema').click();

    // Should be on the create schema page
    cy.url().should('include', '/schemas/create');
    cy.contains('h1', 'Create New Schema').should('be.visible');

    // Fill in the schema form
    cy.get('input[id="name"]').type(schemaName);
    cy.get('input[id="displayName"]').type(displayName);
    cy.get('textarea[id="description"]').type('A test schema for E2E testing');

    // Add a field
    cy.get('button').contains('Add Field').click();

    // Fill in the field details
    cy.get('input[placeholder="Field name"]').first().type('testField');
    cy.get('input[placeholder="Display name"]').first().type('Test Field');
    cy.get('select').first().select('string');
    cy.get('input[type="checkbox"]').first().check(); // Required

    // Submit the form
    cy.get('button').contains('Create Schema').click();

    // Should redirect to schemas list and show the new schema
    cy.url().should('include', '/schemas');
    cy.contains(displayName).should('be.visible');
  });

  it('should create a new schema with a relationship', () => {
    const timestamp = Date.now();
    const projectName = `ProjectForRelationship${timestamp}`;
    const projectDisplayName = `Project For Relationship ${timestamp}`;
    const taskName = `TaskForRelationship${timestamp}`;
    const taskDisplayName = `Task For Relationship ${timestamp}`;

    // Create a base schema (Project)
    cy.contains('New Schema').click();
    cy.url().should('include', '/schemas/create');
    cy.get('input[id="name"]').type(projectName);
    cy.get('input[id="displayName"]').type(projectDisplayName);
    cy.get('textarea[id="description"]').type('A project entity');
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('title');
    cy.get('input[placeholder="Display name"]').first().type('Title');
    cy.get('select').first().select('string');
    cy.get('input[type="checkbox"]').first().check(); // Required
    cy.get('button').contains('Create Schema').click();
    cy.url().should('include', '/schemas');
    cy.contains(projectDisplayName).should('be.visible');

    // Create a related schema (Task) with a relationship to Project
    cy.contains('New Schema').click();
    cy.url().should('include', '/schemas/create');
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
    // Select relationship type by scanning available selects
    cy.get('select').then(($sels) => {
      const sel = Array.from($sels as any).find((s: HTMLSelectElement) => Array.from(s.options).some(o => o.text.includes('Many to One')));
      if (sel) {
        cy.wrap(sel).select('Many to One', { force: true });
      }
    });
    // Select target schema containing our projectDisplayName
    cy.get('select').then(($sels) => {
      const sel = Array.from($sels as any).find((s: HTMLSelectElement) => Array.from(s.options).some(o => o.text.includes(projectDisplayName)));
      if (sel) {
        const opt = Array.from((sel as HTMLSelectElement).options).find(o => o.text.includes(projectDisplayName));
        if (opt && opt.value) {
          cy.wrap(sel).select(opt.value, { force: true });
        }
      }
    });
    cy.get('input[placeholder="e.g., projectId"]').type('project'); // Source field
    cy.get('input[placeholder="e.g., id"]').type('id'); // Target field
    cy.get('textarea[placeholder="Describe this relationship..."]').type('Each task belongs to a project.');

    cy.get('button').contains('Create Schema').click();
    cy.url().should('include', '/schemas');
    // Wait for list to reload and assert by either display or name
    cy.contains(taskDisplayName).should('exist');
  });
});
