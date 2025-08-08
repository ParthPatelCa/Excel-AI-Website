// Performance tests
import { test, expect, measurePageLoad, takeScreenshot } from '../fixtures/test-utils.js'

test.describe('Performance Tests', () => {
  test('should load homepage within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Take screenshot for visual regression
    await takeScreenshot(page, 'homepage-load')
    
    // Performance assertions
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals = {}
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime
            }
          })
          
          resolve(vitals)
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000)
      })
    })
    
    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(2500) // FCP should be under 2.5s
    }
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(4000) // LCP should be under 4s
    }
  })

  test('should handle API response times efficiently', async ({ authenticatedPage, performanceMetrics, testFile }) => {
    const homePage = new HomePage(authenticatedPage)
    
    // Upload file and track API calls
    await homePage.uploadFile(testFile)
    
    // Wait for analysis to complete
    await authenticatedPage.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 })
    
    // Analyze API performance
    const apiCalls = performanceMetrics.filter(metric => metric.url.includes('/api/'))
    
    // Check upload API response time
    const uploadCall = apiCalls.find(call => call.url.includes('/upload'))
    if (uploadCall) {
      expect(uploadCall.timing?.responseEnd - uploadCall.timing?.requestStart).toBeLessThan(5000)
    }
    
    // Check analysis API response time
    const analysisCall = apiCalls.find(call => call.url.includes('/analyze'))
    if (analysisCall) {
      expect(analysisCall.timing?.responseEnd - analysisCall.timing?.requestStart).toBeLessThan(10000)
    }
  })

  test('should efficiently render large datasets', async ({ authenticatedPage }) => {
    // Create large dataset
    const largeDataUrl = 'https://docs.google.com/spreadsheets/d/large-dataset-example'
    
    await authenticatedPage.goto('/')
    await authenticatedPage.click('[data-testid="sheets-tab"]')
    await authenticatedPage.fill('[data-testid="sheets-url-input"]', largeDataUrl)
    await authenticatedPage.click('[data-testid="analyze-button"]')
    
    // Measure rendering time
    const renderStart = Date.now()
    await authenticatedPage.waitForSelector('[data-testid="data-table"]', { timeout: 30000 })
    const renderTime = Date.now() - renderStart
    
    // Should render within reasonable time
    expect(renderTime).toBeLessThan(5000)
    
    // Check if virtualization is working (should not render all rows at once)
    const visibleRows = await authenticatedPage.locator('[data-testid="table-row"]:visible').count()
    expect(visibleRows).toBeLessThan(100) // Should use virtual scrolling
  })

  test('should optimize bundle size and loading', async ({ page }) => {
    // Navigate to page and analyze network requests
    const responses = []
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length'],
          type: response.url().includes('.js') ? 'javascript' : 'css'
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Calculate total bundle size
    const totalJSSize = responses
      .filter(r => r.type === 'javascript')
      .reduce((sum, r) => sum + (parseInt(r.size) || 0), 0)
    
    const totalCSSSize = responses
      .filter(r => r.type === 'css')
      .reduce((sum, r) => sum + (parseInt(r.size) || 0), 0)
    
    // Bundle size assertions (adjust based on your targets)
    expect(totalJSSize).toBeLessThan(2 * 1024 * 1024) // JS should be under 2MB
    expect(totalCSSSize).toBeLessThan(500 * 1024) // CSS should be under 500KB
    
    // Check for code splitting
    const jsFiles = responses.filter(r => r.type === 'javascript')
    expect(jsFiles.length).toBeGreaterThan(1) // Should have multiple JS chunks
  })

  test('should handle memory usage efficiently', async ({ authenticatedPage }) => {
    // Navigate through multiple heavy operations
    await authenticatedPage.goto('/')
    
    // Perform memory-intensive operations
    for (let i = 0; i < 5; i++) {
      await authenticatedPage.click('[data-testid="visualize-tab"]')
      await authenticatedPage.waitForTimeout(1000)
      await authenticatedPage.click('[data-testid="chart-builder-tab"]')
      await authenticatedPage.waitForTimeout(1000)
      await authenticatedPage.click('[data-testid="overview-tab"]')
      await authenticatedPage.waitForTimeout(1000)
    }
    
    // Check memory usage
    const memoryUsage = await authenticatedPage.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        }
      }
      return null
    })
    
    if (memoryUsage) {
      // Memory usage should be reasonable
      expect(memoryUsage.used).toBeLessThan(memoryUsage.limit * 0.5) // Should use less than 50% of limit
      
      // Memory should not grow unbounded (check for leaks)
      const memoryRatio = memoryUsage.used / memoryUsage.total
      expect(memoryRatio).toBeLessThan(0.9) // Should not be close to total allocation
    }
  })

  test('should lazy load components efficiently', async ({ page }) => {
    const networkRequests = []
    page.on('request', request => {
      if (request.url().includes('.js')) {
        networkRequests.push(request.url())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const initialRequests = [...networkRequests]
    
    // Navigate to a tab that should lazy load
    await page.click('[data-testid="chart-builder-tab"]')
    await page.waitForTimeout(2000)
    
    const afterNavigationRequests = [...networkRequests]
    
    // Should have loaded additional chunks
    expect(afterNavigationRequests.length).toBeGreaterThan(initialRequests.length)
    
    // Should not load all components immediately
    const lazyLoadedChunks = afterNavigationRequests.filter(url => 
      !initialRequests.includes(url)
    )
    expect(lazyLoadedChunks.length).toBeGreaterThan(0)
  })

  test('should cache API responses effectively', async ({ authenticatedPage, testFile }) => {
    const homePage = new HomePage(authenticatedPage)
    const apiRequests = []
    
    authenticatedPage.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        })
      }
    })
    
    // First upload
    await homePage.uploadFile(testFile)
    await authenticatedPage.waitForSelector('[data-testid="analysis-results"]')
    
    const firstUploadRequests = [...apiRequests]
    
    // Navigate away and back
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.goto('/')
    
    // Upload same file again
    await homePage.uploadFile(testFile)
    await authenticatedPage.waitForSelector('[data-testid="analysis-results"]')
    
    const secondUploadRequests = apiRequests.slice(firstUploadRequests.length)
    
    // Should make fewer requests on second upload (due to caching)
    expect(secondUploadRequests.length).toBeLessThanOrEqual(firstUploadRequests.length)
  })
})
