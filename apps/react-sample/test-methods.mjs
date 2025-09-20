#!/usr/bin/env node

/**
 * Test: Explore the methods object on supportCodeLibraryBuilder
 */

console.log('🔍 Investigating supportCodeLibraryBuilder.methods...')

try {
  const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber')

  console.log('Methods object:', typeof supportCodeLibraryBuilder.methods)
  console.log('Methods keys:', Object.keys(supportCodeLibraryBuilder.methods))

  // Inspect each method
  for (const [key, value] of Object.entries(supportCodeLibraryBuilder.methods)) {
    console.log(`${key}:`, typeof value)
  }

  // Let's see if the methods object contains the Given/When/Then functions
  const { methods } = supportCodeLibraryBuilder

  if (methods.Given) {
    console.log('✅ Found Given in methods')
    console.log('Given function:', methods.Given.toString().substring(0, 100))
  }

  if (methods.When) {
    console.log('✅ Found When in methods')
  }

  if (methods.Then) {
    console.log('✅ Found Then in methods')
  }

  // Check if these are the same as the top-level exports
  const { Given: topGiven } = await import('@cucumber/cucumber')
  if (methods.Given === topGiven) {
    console.log('✅ methods.Given is the same as top-level Given')
  } else {
    console.log('❌ methods.Given is different from top-level Given')
  }

  // Let's also check the status
  console.log('Builder status:', supportCodeLibraryBuilder.status)

  // Maybe we need to initialize or reset the builder?
  if (typeof supportCodeLibraryBuilder.reset === 'function') {
    console.log('🔧 Attempting to reset builder...')
    supportCodeLibraryBuilder.reset()
    console.log('Status after reset:', supportCodeLibraryBuilder.status)
  }

} catch (error) {
  console.error('❌ Investigation failed:', error.message)
}