// Test fixtures and utilities
import { test as base, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Extended test with custom fixtures
export const test = base.extend({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Login before each test that needs authentication
    await page.goto('/auth')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for authentication to complete
    await page.waitForURL('/', { timeout: 10000 })
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible()
    
    await use(page)
  },

  // File upload fixture
  testFile: async ({}, use) => {
    const testFilePath = path.join(__dirname, 'fixtures', 'sample_data.csv')
    
    // Create test CSV file if it doesn't exist
    if (!fs.existsSync(testFilePath)) {
      const csvData = `Name,Age,City,Salary
John Doe,30,New York,75000
Jane Smith,25,Los Angeles,65000
Bob Johnson,35,Chicago,80000
Alice Brown,28,Houston,70000
Charlie Wilson,32,Phoenix,72000`
      
      fs.writeFileSync(testFilePath, csvData)
    }
    
    await use(testFilePath)
  },

  // Performance monitoring fixture
  performanceMetrics: async ({ page }, use) => {
    const metrics = []
    
    // Start performance monitoring
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        metrics.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing(),
          timestamp: Date.now()
        })
      }
    })
    
    await use(metrics)
  }
})

// Custom expect matchers
export { expect } from '@playwright/test'

// Page object models
export class HomePage {
  constructor(page) {
    this.page = page
    this.uploadButton = page.locator('[data-testid="upload-button"]')
    this.fileInput = page.locator('input[type="file"]')
    this.googleSheetsInput = page.locator('[data-testid="sheets-url-input"]')
    this.analyzeButton = page.locator('[data-testid="analyze-button"]')
  }

  async uploadFile(filePath) {
    await this.fileInput.setInputFiles(filePath)
    await this.analyzeButton.click()
  }

  async analyzeGoogleSheets(url) {
    await this.googleSheetsInput.fill(url)
    await this.analyzeButton.click()
  }
}

export class AnalysisPage {
  constructor(page) {
    this.page = page
    this.overviewTab = page.locator('[data-testid="overview-tab"]')
    this.visualizeTab = page.locator('[data-testid="visualize-tab"]')
    this.chatTab = page.locator('[data-testid="chat-tab"]')
    this.dataTable = page.locator('[data-testid="data-table"]')
    this.chartContainer = page.locator('[data-testid="chart-container"]')
    this.exportButton = page.locator('[data-testid="export-button"]')
  }

  async switchToTab(tabName) {
    await this.page.locator(`[data-testid="${tabName}-tab"]`).click()
  }

  async waitForAnalysisComplete() {
    await this.page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 })
  }
}

export class ChatInterface {
  constructor(page) {
    this.page = page
    this.messageInput = page.locator('[data-testid="chat-input"]')
    this.sendButton = page.locator('[data-testid="send-button"]')
    this.messagesContainer = page.locator('[data-testid="chat-messages"]')
  }

  async sendMessage(message) {
    await this.messageInput.fill(message)
    await this.sendButton.click()
  }

  async waitForResponse() {
    await this.page.waitForSelector('[data-testid="ai-response"]:last-child', { timeout: 15000 })
  }
}

// Utility functions
export const waitForLoadingToComplete = async (page) => {
  await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 30000 })
}

export const takeScreenshot = async (page, name) => {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true })
}

export const measurePageLoad = async (page) => {
  const startTime = Date.now()
  await page.waitForLoadState('networkidle')
  const endTime = Date.now()
  return endTime - startTime
}

export const checkAccessibility = async (page) => {
  // Basic accessibility checks
  const violations = await page.evaluate(() => {
    const issues = []
    
    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])')
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`)
    }
    
    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
    const unlabeled = Array.from(inputs).filter(input => {
      const label = document.querySelector(`label[for="${input.id}"]`)
      return !label && input.type !== 'hidden'
    })
    if (unlabeled.length > 0) {
      issues.push(`${unlabeled.length} form inputs missing labels`)
    }
    
    // Check for proper heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (headings.length === 0) {
      issues.push('No headings found on page')
    }
    
    return issues
  })
  
  return violations
}
