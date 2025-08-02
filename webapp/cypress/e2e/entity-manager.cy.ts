describe('Entity Manager E2E Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[placeholder="Email address"]').type('admin@platform.com');
    cy.get('input[placeholder="Password"]').type('admin123');
    cy.get('button').contains('Sign in').click();
    cy.url().should('include', '/');
  });

  it('should create a Dog model and then create a Dog entity', () => {
    // Navigate to Entity Manager
    cy.contains('Entity Manager').click();
    cy.url().should('include', '/entity-manager');

    // Create a Dog model
    cy.contains('Create New Model').should('be.visible');
    
    // Fill in model details
    cy.get('input[placeholder*="Dog, Product, User"]').type('Dog');
    cy.get('input[placeholder*="Dog Model, Product Model"]').type('Dog Model');
    
    // Add a name field
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('name');
    cy.get('select').first().select('string');
    
    // Add an age field
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').eq(1).type('age');
    cy.get('select').eq(1).select('number');
    
    // Add a breed field
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').eq(2).type('breed');
    cy.get('select').eq(2).select('string');
    
    // Create the model
    cy.contains('Create Model').click();
    cy.contains('Model created successfully!').should('be.visible');
    
    // Switch to Entities tab
    cy.contains('Entities').click();
    
    // Create a Dog entity
    cy.contains('Create New Entity').should('be.visible');
    
    // Fill in entity details
    cy.get('input[placeholder*="spot, laptop, john"]').type('spot');
    cy.get('input[placeholder*="Spot the Dog, Gaming Laptop"]').type('Spot the Dog');
    
    // Select the Dog model
    cy.get('select').contains('Dog Model').click();
    
    // Fill in the entity data
    cy.get('input[placeholder="Enter name"]').type('Spot');
    cy.get('input[placeholder="Enter age"]').type('5');
    cy.get('input[placeholder="Enter breed"]').type('Golden Retriever');
    
    // Create the entity
    cy.contains('Create Entity').click();
    cy.contains('Entity created successfully!').should('be.visible');
    
    // Verify the entity appears in the list
    cy.contains('Spot the Dog').should('be.visible');
    cy.contains('Name: spot').should('be.visible');
    cy.contains('Model: Dog Model').should('be.visible');
    cy.contains('name: Spot').should('be.visible');
    cy.contains('age: 5').should('be.visible');
    cy.contains('breed: Golden Retriever').should('be.visible');
  });

  it('should create a Product model and then create a Product entity', () => {
    // Navigate to Entity Manager
    cy.contains('Entity Manager').click();
    cy.url().should('include', '/entity-manager');

    // Create a Product model
    cy.contains('Create New Model').should('be.visible');
    
    // Fill in model details
    cy.get('input[placeholder*="Dog, Product, User"]').type('Product');
    cy.get('input[placeholder*="Dog Model, Product Model"]').type('Product Model');
    
    // Add fields
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').first().type('name');
    cy.get('select').first().select('string');
    
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').eq(1).type('price');
    cy.get('select').eq(1).select('number');
    
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').eq(2).type('description');
    cy.get('select').eq(2).select('string');
    
    cy.contains('Add Field').click();
    cy.get('input[placeholder="Field name"]').eq(3).type('inStock');
    cy.get('select').eq(3).select('boolean');
    
    // Create the model
    cy.contains('Create Model').click();
    cy.contains('Model created successfully!').should('be.visible');
    
    // Switch to Entities tab
    cy.contains('Entities').click();
    
    // Create a Product entity
    cy.contains('Create New Entity').should('be.visible');
    
    // Fill in entity details
    cy.get('input[placeholder*="spot, laptop, john"]').type('laptop');
    cy.get('input[placeholder*="Spot the Dog, Gaming Laptop"]').type('Gaming Laptop');
    
    // Select the Product model
    cy.get('select').contains('Product Model').click();
    
    // Fill in the entity data
    cy.get('input[placeholder="Enter name"]').type('Gaming Laptop Pro');
    cy.get('input[placeholder="Enter price"]').type('1299.99');
    cy.get('input[placeholder="Enter description"]').type('High-performance gaming laptop');
    cy.get('select').contains('True').click();
    
    // Create the entity
    cy.contains('Create Entity').click();
    cy.contains('Entity created successfully!').should('be.visible');
    
    // Verify the entity appears in the list
    cy.contains('Gaming Laptop').should('be.visible');
    cy.contains('Name: laptop').should('be.visible');
    cy.contains('Model: Product Model').should('be.visible');
    cy.contains('name: Gaming Laptop Pro').should('be.visible');
    cy.contains('price: 1299.99').should('be.visible');
    cy.contains('description: High-performance gaming laptop').should('be.visible');
    cy.contains('inStock: true').should('be.visible');
  });
}); 