// Authentication flow tests
import { test, expect, HomePage, AnalysisPage } from '../fixtures/test-utils.js'

test.describe('Authentication Flow', () => {
  test('should register new user successfully', async ({ page }) => {
    await page.goto('/auth')
    
    // Switch to registration mode
    await page.click('[data-testid="register-tab"]')
    
    // Fill registration form
    await page.fill('[data-testid="first-name-input"]', 'John')
    await page.fill('[data-testid="last-name-input"]', 'Doe')
    await page.fill('[data-testid="email-input"]', `test${Date.now()}@example.com`)
    await page.fill('[data-testid="password-input"]', 'securepassword123')
    await page.fill('[data-testid="confirm-password-input"]', 'securepassword123')
    
    // Submit registration
    await page.click('[data-testid="register-button"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, John')
  })

  test('should login existing user successfully', async ({ page }) => {
    await page.goto('/auth')
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    
    // Submit login
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth')
    
    // Fill with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    
    // Submit login
    await page.click('[data-testid="login-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })

  test('should logout user successfully', async ({ authenticatedPage }) => {
    // User should be logged in from fixture
    await expect(authenticatedPage.locator('[data-testid="user-dashboard"]')).toBeVisible()
    
    // Click logout
    await authenticatedPage.click('[data-testid="logout-button"]')
    
    // Should redirect to auth page
    await expect(authenticatedPage).toHaveURL('/auth')
    await expect(authenticatedPage.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should persist authentication across page reloads', async ({ authenticatedPage }) => {
    // User should be logged in
    await expect(authenticatedPage.locator('[data-testid="user-dashboard"]')).toBeVisible()
    
    // Reload page
    await authenticatedPage.reload()
    
    // Should still be logged in
    await expect(authenticatedPage.locator('[data-testid="user-dashboard"]')).toBeVisible()
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth')
    
    // Click forgot password
    await page.click('[data-testid="forgot-password-link"]')
    
    // Fill email
    await page.fill('[data-testid="reset-email-input"]', 'test@example.com')
    
    // Submit reset request
    await page.click('[data-testid="reset-submit-button"]')
    
    // Should show confirmation message
    await expect(page.locator('[data-testid="reset-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="reset-confirmation"]')).toContainText('Password reset email sent')
  })
})
