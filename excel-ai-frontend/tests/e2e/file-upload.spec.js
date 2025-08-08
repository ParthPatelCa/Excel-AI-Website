// File upload and analysis tests
import { test, expect, HomePage, AnalysisPage, waitForLoadingToComplete } from '../fixtures/test-utils.js'

test.describe('File Upload and Analysis', () => {
  test('should upload CSV file and show analysis', async ({ authenticatedPage, testFile }) => {
    const homePage = new HomePage(authenticatedPage)
    const analysisPage = new AnalysisPage(authenticatedPage)
    
    // Upload test file
    await homePage.uploadFile(testFile)
    
    // Wait for upload and analysis to complete
    await waitForLoadingToComplete(authenticatedPage)
    await analysisPage.waitForAnalysisComplete()
    
    // Verify analysis results are shown
    await expect(analysisPage.dataTable).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="file-info"]')).toContainText('sample_data.csv')
    await expect(authenticatedPage.locator('[data-testid="row-count"]')).toContainText('5 rows')
    await expect(authenticatedPage.locator('[data-testid="column-count"]')).toContainText('4 columns')
  })

  test('should handle large file upload with progress', async ({ authenticatedPage }) => {
    const homePage = new HomePage(authenticatedPage)
    
    // Create a larger test file (simulate)
    const largeFile = 'tests/fixtures/large_sample.csv'
    
    // Start upload
    await homePage.uploadFile(largeFile)
    
    // Verify progress indicator is shown
    await expect(authenticatedPage.locator('[data-testid="upload-progress"]')).toBeVisible()
    
    // Wait for completion
    await waitForLoadingToComplete(authenticatedPage)
    
    // Verify success
    await expect(authenticatedPage.locator('[data-testid="upload-success"]')).toBeVisible()
  })

  test('should validate file types and show appropriate errors', async ({ authenticatedPage }) => {
    const homePage = new HomePage(authenticatedPage)
    
    // Try to upload invalid file type
    const invalidFile = 'tests/fixtures/invalid.txt'
    
    await homePage.uploadFile(invalidFile)
    
    // Should show error message
    await expect(authenticatedPage.locator('[data-testid="file-error"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="file-error"]')).toContainText('Unsupported file type')
  })

  test('should handle file size limits', async ({ authenticatedPage }) => {
    const homePage = new HomePage(authenticatedPage)
    
    // Try to upload oversized file (simulate)
    const oversizedFile = 'tests/fixtures/oversized.csv'
    
    await homePage.uploadFile(oversizedFile)
    
    // Should show size error
    await expect(authenticatedPage.locator('[data-testid="file-error"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="file-error"]')).toContainText('File size exceeds limit')
  })

  test('should analyze Google Sheets URL', async ({ authenticatedPage }) => {
    const homePage = new HomePage(authenticatedPage)
    const analysisPage = new AnalysisPage(authenticatedPage)
    
    const testSheetsUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
    
    // Switch to Google Sheets tab
    await authenticatedPage.click('[data-testid="sheets-tab"]')
    
    // Enter URL and analyze
    await homePage.analyzeGoogleSheets(testSheetsUrl)
    
    // Wait for analysis
    await waitForLoadingToComplete(authenticatedPage)
    await analysisPage.waitForAnalysisComplete()
    
    // Verify results
    await expect(analysisPage.dataTable).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="source-url"]')).toContainText('Google Sheets')
  })

  test('should validate Google Sheets URL format', async ({ authenticatedPage }) => {
    const homePage = new HomePage(authenticatedPage)
    
    // Switch to Google Sheets tab
    await authenticatedPage.click('[data-testid="sheets-tab"]')
    
    // Enter invalid URL
    await homePage.analyzeGoogleSheets('https://invalid-url.com')
    
    // Should show validation error
    await expect(authenticatedPage.locator('[data-testid="url-error"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="url-error"]')).toContainText('Invalid Google Sheets URL')
  })

  test('should show file preview before analysis', async ({ authenticatedPage, testFile }) => {
    const homePage = new HomePage(authenticatedPage)
    
    // Upload file
    await homePage.fileInput.setInputFiles(testFile)
    
    // Should show file preview
    await expect(authenticatedPage.locator('[data-testid="file-preview"]')).toBeVisible()
    await expect(authenticatedPage.locator('[data-testid="preview-table"]')).toBeVisible()
    
    // Should show correct column headers
    await expect(authenticatedPage.locator('[data-testid="column-header"]').first()).toContainText('Name')
    await expect(authenticatedPage.locator('[data-testid="column-header"]').nth(1)).toContainText('Age')
  })
})
