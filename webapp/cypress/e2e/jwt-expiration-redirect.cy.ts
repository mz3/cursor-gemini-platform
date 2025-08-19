describe('JWT Expiration Redirect Flow', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should redirect to login and return to original page after re-authentication', () => {
    // First, log in normally
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Wait for login to complete and redirect to dashboard (root path)
    // The app might take a moment to process the login
    cy.url({ timeout: 10000 }).should('eq', 'http://localhost:3002/');

    // Navigate to a specific page (e.g., schemas)
    cy.visit('/schemas');
    cy.url().should('include', '/schemas');

    // Simulate JWT expiration by removing the token from localStorage
    cy.window().then((win) => {
      win.localStorage.removeItem('token');
    });

    // Force an API call by visiting a page that requires authentication
    // This should trigger the API interceptor when the app tries to fetch user data
    cy.visit('/settings');

    // Should be redirected to login page with redirect parameter
    cy.url({ timeout: 10000 }).should('include', '/login');
    cy.url().should('include', 'redirect=');
    cy.url().should('include', encodeURIComponent('/settings'));

    // Log in again
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Should be redirected back to the original page (settings)
    cy.url({ timeout: 10000 }).should('include', '/settings');
    cy.url().should('not.include', 'redirect=');
  });

  it('should handle JWT expiration on any page and return to that page', () => {
    // Log in first
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Wait for login to complete
    cy.url({ timeout: 10000 }).should('eq', 'http://localhost:3002/');

    // Navigate to a different page (e.g., prompts)
    cy.visit('/prompts');
    cy.url().should('include', '/prompts');

    // Simulate JWT expiration
    cy.window().then((win) => {
      win.localStorage.removeItem('token');
    });

    // Force an API call by visiting a page that requires authentication
    cy.visit('/features');

    // Should be redirected to login with the features page as redirect
    cy.url({ timeout: 10000 }).should('include', '/login');
    cy.url().should('include', 'redirect=');
    cy.url().should('include', encodeURIComponent('/features'));

    // Log in again
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Should return to features page
    cy.url({ timeout: 10000 }).should('include', '/features');
    cy.url().should('not.include', 'redirect=');
  });

  it('should fallback to dashboard when no redirect parameter is present', () => {
    // Visit login page directly without any redirect parameter
    cy.visit('/login');
    
    // Verify no redirect parameter in URL
    cy.url().should('not.include', 'redirect=');

    // Log in
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard (root path)
    cy.url({ timeout: 10000 }).should('eq', 'http://localhost:3002/');
  });

  it('should handle JWT expiration with query parameters in URL', () => {
    // Log in first
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Wait for login to complete
    cy.url({ timeout: 10000 }).should('eq', 'http://localhost:3002/');

    // Navigate to a page with query parameters
    cy.visit('/schemas?filter=active&sort=name');
    cy.url().should('include', '/schemas');
    cy.url().should('include', 'filter=active');
    cy.url().should('include', 'sort=name');

    // Simulate JWT expiration
    cy.window().then((win) => {
      win.localStorage.removeItem('token');
    });

    // Force an API call by visiting a page that requires authentication
    cy.visit('/applications');

    // Should be redirected to login with full URL including query params
    cy.url({ timeout: 10000 }).should('include', '/login');
    cy.url().should('include', 'redirect=');
    cy.url().should('include', encodeURIComponent('/applications'));

    // Log in again
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Should return to the exact same URL with query parameters
    cy.url({ timeout: 10000 }).should('include', '/applications');
    cy.url().should('not.include', 'redirect=');
  });

  it('should clear redirect parameter after successful login', () => {
    // Visit login page with a redirect parameter
    cy.visit('/login?redirect=%2Fschemas');
    
    // Verify redirect parameter is present
    cy.url().should('include', 'redirect=');

    // Log in
    cy.get('input[name="email"]').type('admin@platform.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Should redirect to schemas page
    cy.url({ timeout: 10000 }).should('include', '/schemas');
    
    // Redirect parameter should be cleared from URL
    cy.url().should('not.include', 'redirect=');
  });
});
