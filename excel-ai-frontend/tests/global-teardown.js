// Global test teardown
async function globalTeardown(config) {
  console.log('🧹 Starting global test teardown...')
  
  // Cleanup test data
  try {
    await fetch('http://localhost:5001/api/v1/test/cleanup', {
      method: 'POST'
    })
    console.log('✅ Test data cleaned up')
  } catch (error) {
    console.log('⚠️ Failed to cleanup test data:', error.message)
  }
  
  console.log('✅ Global teardown completed')
}

module.exports = globalTeardown
