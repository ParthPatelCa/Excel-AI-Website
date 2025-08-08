// Global test setup
async function globalSetup(config) {
  console.log('🧪 Starting global test setup...')
  
  // Start backend server if needed
  const { spawn } = require('child_process')
  const path = require('path')
  
  // Check if backend is running
  try {
    const response = await fetch('http://localhost:5001/health')
    if (response.ok) {
      console.log('✅ Backend server is already running')
    }
  } catch (error) {
    console.log('🚀 Starting backend server...')
    
    // Start backend server
    const backendPath = path.resolve(__dirname, '../../excel_ai_backend')
    const backendProcess = spawn('python', ['src/main.py'], {
      cwd: backendPath,
      detached: true,
      stdio: 'ignore'
    })
    
    // Wait for backend to be ready
    let attempts = 0
    const maxAttempts = 30
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch('http://localhost:5001/health')
        if (response.ok) {
          console.log('✅ Backend server started successfully')
          break
        }
      } catch (error) {
        attempts++
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('❌ Failed to start backend server')
    }
  }
  
  // Setup test database
  console.log('🗄️ Setting up test database...')
  
  // Create test user
  try {
    await fetch('http://localhost:5001/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
        first_name: 'Test',
        last_name: 'User'
      })
    })
    console.log('✅ Test user created')
  } catch (error) {
    console.log('ℹ️ Test user might already exist')
  }
  
  console.log('✅ Global setup completed')
}

module.exports = globalSetup
