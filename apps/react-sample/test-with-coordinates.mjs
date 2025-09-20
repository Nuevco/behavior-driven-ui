#!/usr/bin/env node

/**
 * Test: Provide coordinates to avoid file path errors
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🔧 Testing with coordinates...')

try {
  const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber')

  // Reset to OPEN status
  supportCodeLibraryBuilder.reset()

  // Check if we need to set coordinates
  console.log('Current coordinates:', supportCodeLibraryBuilder.originalCoordinates)

  // Try to set some mock coordinates
  if (supportCodeLibraryBuilder.originalCoordinates === undefined) {
    // Set mock file coordinates
    supportCodeLibraryBuilder.cwd = process.cwd()
    supportCodeLibraryBuilder.originalCoordinates = {
      uri: 'programmatic-steps.js',
      line: 1
    }
    console.log('✅ Set mock coordinates')
  }

  const { methods } = supportCodeLibraryBuilder

  console.log('🔧 Registering steps with coordinates...')

  // Try using defineStep directly instead of Given/When/Then
  console.log('🔧 Using defineStep method...')

  supportCodeLibraryBuilder.defineStep({
    pattern: 'I have a test world',
    options: {},
    code: function() {
      console.log('✅ defineStep Given executed')
    }
  })

  supportCodeLibraryBuilder.defineStep({
    pattern: 'I store {string} as {string}',
    options: {},
    code: function(key, value) {
      console.log(`✅ defineStep When executed: ${key} = ${value}`)
    }
  })

  supportCodeLibraryBuilder.defineStep({
    pattern: 'I should be able to retrieve {string} as {string}',
    options: {},
    code: function(key, expectedValue) {
      console.log(`✅ defineStep Then executed: ${key} = ${expectedValue}`)
    }
  })

  console.log('✅ Steps registered via defineStep!')

  // Try to build support
  console.log('🔧 Building support library...')
  const supportLibrary = supportCodeLibraryBuilder.finalize()
  console.log('✅ Support library built!')

  // Test with runCucumber
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: { import: [], format: ['progress'], parallel: 1 }
  })

  console.log('🚀 Running with defineStep support...')
  const { success } = await runCucumber({
    ...runConfiguration,
    support: supportLibrary
  })

  if (success) {
    console.log('🎉 defineStep approach worked!')
  } else {
    console.log('❌ defineStep approach failed')
  }

} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Full error:', error)
}