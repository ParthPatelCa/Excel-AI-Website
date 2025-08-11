import { useState, useEffect } from 'react'

// Enhanced file validation with detailed error messages and suggestions
export const validateFile = (file) => {
  const errors = []
  const warnings = []
  const suggestions = []
  
  if (!file) {
    errors.push('Please select a file')
    return { isValid: false, errors, warnings, suggestions }
  }
  
  // File size validation (16MB limit)
  const maxSize = 16 * 1024 * 1024 // 16MB
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 16MB limit`)
    suggestions.push("Try compressing your file or splitting it into smaller chunks")
  }
  
  // File type validation
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ]
  
  const allowedExtensions = ['.xlsx', '.xls', '.csv']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    errors.push(`File type "${fileExtension}" is not supported`)
    suggestions.push("Please upload an Excel file (.xlsx, .xls) or CSV file")
  }
  
  // Empty file check
  if (file.size === 0) {
    errors.push("File appears to be empty")
    suggestions.push("Please check that your file contains data")
  }
  
  // Large file warnings
  if (file.size > 8 * 1024 * 1024) { // 8MB
    warnings.push("Large file detected - processing may take longer")
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: fileExtension,
      sizeFormatted: formatFileSize(file.size)
    }
  }
}

// Enhanced Google Sheets URL validation
export const validateGoogleSheetsUrl = (url) => {
  const errors = []
  const suggestions = []
  
  if (!url || url.trim() === '') {
    errors.push("URL is required")
    return { isValid: false, errors, suggestions }
  }
  
  const cleanUrl = url.trim()
  
  // Basic URL validation
  try {
    new URL(cleanUrl)
  } catch {
    errors.push("Invalid URL format")
    suggestions.push("Please enter a complete URL starting with https://")
    return { isValid: false, errors, suggestions }
  }
  
  // Google Sheets specific validation
  const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  const match = cleanUrl.match(googleSheetsRegex)
  
  if (!match) {
    errors.push("This doesn't appear to be a valid Google Sheets URL")
    suggestions.push("URL should start with: https://docs.google.com/spreadsheets/d/")
    return { isValid: false, errors, suggestions }
  }
  
  // Extract spreadsheet ID and GID
  const spreadsheetId = match[1]
  const gidMatch = cleanUrl.match(/[#&]gid=([0-9]+)/)
  const gid = gidMatch ? gidMatch[1] : '0'
  
  // Check for edit vs view URLs
  if (cleanUrl.includes('/edit')) {
    suggestions.push("Make sure the sheet is publicly viewable or shared with appropriate permissions")
  }
  
  return {
    isValid: true,
    errors: [],
    suggestions,
    spreadsheetId,
    gid,
    csvUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
  }
}

// Enhanced query validation
export const validateQuery = (query) => {
  const errors = []
  const warnings = []
  const suggestions = []
  
  if (!query || query.trim() === '') {
    errors.push("Please enter a question about your data")
    return { isValid: false, errors, warnings, suggestions }
  }

  const trimmedQuery = query.trim()
  
  if (trimmedQuery.length < 3) {
    errors.push("Question must be at least 3 characters long")
    suggestions.push("Try to be more specific about what you want to analyze")
  }

  if (trimmedQuery.length > 500) {
    errors.push("Question must be less than 500 characters")
    suggestions.push("Please shorten your question while keeping the key details")
  }
  
  // Check for common issues
  if (trimmedQuery.toLowerCase().includes('help') && trimmedQuery.length < 20) {
    warnings.push("Generic 'help' requests may not produce specific results")
    suggestions.push("Try asking a specific question about your data")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

// Text input validation for prompts
export const validateTextPrompt = (text, minLength = 5, maxLength = 1000) => {
  const errors = []
  const warnings = []
  const suggestions = []
  
  if (!text || text.trim() === '') {
    errors.push("Please enter a description or question")
    return { isValid: false, errors, warnings, suggestions }
  }
  
  const trimmedText = text.trim()
  
  if (trimmedText.length < minLength) {
    errors.push(`Please provide at least ${minLength} characters for better results`)
    suggestions.push("Try to be more specific about what you want to analyze or calculate")
  }
  
  if (trimmedText.length > maxLength) {
    errors.push(`Text is too long (${trimmedText.length}/${maxLength} characters)`)
    suggestions.push("Please shorten your request while keeping the key details")
  }
  
  // Check for formula-specific requests
  if (trimmedText.toLowerCase().includes('formula') || trimmedText.toLowerCase().includes('calculate')) {
    suggestions.push("For best results, describe what you want to calculate and mention relevant column names")
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    textInfo: {
      length: trimmedText.length,
      wordCount: trimmedText.split(/\s+/).length
    }
  }
}

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email || email.trim() === '') {
    return { isValid: false, errors: ["Email is required"] }
  }
  
  if (!emailRegex.test(email)) {
    return { 
      isValid: false, 
      errors: ["Please enter a valid email address"],
      suggestions: ["Email should be in format: example@domain.com"]
    }
  }
  
  return { isValid: true, errors: [] }
}

// Helper functions
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Real-time validation hook
export const useValidation = (value, validator, dependencies = []) => {
  const [validation, setValidation] = useState(null)
  
  useEffect(() => {
    if (value) {
      const result = validator(value)
      setValidation(result)
    } else {
      setValidation(null)
    }
  }, [value, ...dependencies])
  
  return validation
}
