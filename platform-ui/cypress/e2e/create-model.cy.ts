describe('Create Model Page', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/');
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Wait for login to complete and redirect
    cy.url().should('include', '/');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should navigate to create model page', () => {
    // Navigate to models page using the sidebar
    cy.get('a[href="/models"]').click();
    cy.url().should('include', '/models');
    cy.get('h1').should('contain', 'Models');

    // Click the New Model button
    cy.get('button').contains('New Model').click();
    cy.url().should('include', '/models/create');
    cy.get('h1').should('contain', 'Create New Model');
  });

  it('should display the create model form', () => {
    // Navigate to models page first
    cy.get('a[href="/models"]').click();
    cy.get('button').contains('New Model').click();

    // Check basic form elements
    cy.get('input[placeholder*="Product, Customer, Order"]').should('be.visible');
    cy.get('input[placeholder*="Products, Customers, Orders"]').should('be.visible');
    cy.get('textarea[placeholder*="Describe what this model represents"]').should('be.visible');
    cy.get('button').contains('Add Field').should('be.visible');
  });

  it('should add and remove fields', () => {
    // Navigate to create model page
    cy.get('a[href="/models"]').click();
    cy.get('button').contains('New Model').click();

    // Add a field
    cy.get('button').contains('Add Field').click();
    cy.get('h3').should('contain', 'Field 1');

    // Fill in field details
    cy.get('input[placeholder*="title, price, email"]').type('name');
    cy.get('input[placeholder*="Title, Price, Email"]').type('Name');

    // Add another field
    cy.get('button').contains('Add Field').click();
    cy.get('h3').should('contain', 'Field 2');

    // Remove the second field
    cy.get('h3').contains('Field 2').parent().find('button').last().click();
    cy.get('h3').should('not.contain', 'Field 2');
  });

  it('should validate required fields', () => {
    // Navigate to create model page
    cy.get('a[href="/models"]').click();
    cy.get('button').contains('New Model').click();

    // Try to submit without filling required fields
    cy.get('button').contains('Create Model').click();

    // Should show validation error - wait for it to appear
    cy.get('.bg-red-50', { timeout: 10000 }).should('be.visible');
    cy.get('.text-red-700').should('contain', 'Name and Display Name are required');
  });

  it('should create a simple model', () => {
    // Navigate to create model page
    cy.get('a[href="/models"]').click();
    cy.get('button').contains('New Model').click();

    // Fill in basic model info
    cy.get('input[placeholder*="Product, Customer, Order"]').type('Product');
    cy.get('input[placeholder*="Products, Customers, Orders"]').type('Products');
    cy.get('textarea[placeholder*="Describe what this model represents"]').type('A product catalog item');

    // Add a field
    cy.get('button').contains('Add Field').click();
    cy.get('input[placeholder*="title, price, email"]').type('name');
    cy.get('input[placeholder*="Title, Price, Email"]').type('Name');

    // Submit the form
    cy.get('button').contains('Create Model').click();

    // Should redirect to models page and show the new model
    cy.url().should('include', '/models');
    cy.get('h1').should('contain', 'Models');
    cy.get('p').should('contain', 'Product'); // Should show the new model name
  });
});
