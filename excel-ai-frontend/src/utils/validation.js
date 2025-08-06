export const validateFile = (file) => {
  const errors = []
  const maxSize = 16 * 1024 * 1024 // 16MB
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ]

  if (!file) {
    errors.push('Please select a file')
    return { isValid: false, errors }
  }

  if (file.size > maxSize) {
    errors.push('File size must be less than 16MB')
  }

  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
    errors.push('Please upload an Excel file (.xlsx, .xls) or CSV file')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateGoogleSheetsUrl = (url) => {
  const errors = []
  
  if (!url || !url.trim()) {
    errors.push('Please enter a Google Sheets URL')
    return { isValid: false, errors }
  }

  const cleanUrl = url.trim()
  
  // Check if it's a valid URL
  try {
    new URL(cleanUrl)
  } catch {
    errors.push('Please enter a valid URL')
    return { isValid: false, errors }
  }

  // Check if it's a Google Sheets URL
  if (!cleanUrl.includes('docs.google.com/spreadsheets')) {
    errors.push('Please enter a valid Google Sheets URL')
  }

  // Check if it contains a spreadsheet ID
  const spreadsheetIdMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!spreadsheetIdMatch) {
    errors.push('Invalid Google Sheets URL format')
  }

  return {
    isValid: errors.length === 0,
    errors,
    spreadsheetId: spreadsheetIdMatch ? spreadsheetIdMatch[1] : null
  }
}

export const validateQuery = (query) => {
  const errors = []
  
  if (!query || !query.trim()) {
    errors.push('Please enter a question about your data')
    return { isValid: false, errors }
  }

  if (query.trim().length < 3) {
    errors.push('Question must be at least 3 characters long')
  }

  if (query.trim().length > 500) {
    errors.push('Question must be less than 500 characters')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
