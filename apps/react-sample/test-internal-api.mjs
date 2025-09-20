#!/usr/bin/env node

/**
 * Test: Can we access cucumber's internal SupportCodeLibraryBuilder?
 * If we can access the internal APIs, we might be able to register steps directly
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🧪 Testing cucumber internal API access...')

try {
  // Try to access internal cucumber modules
  console.log('🔍 Attempting to access cucumber internals...')

  // Let's see what's available in the main cucumber module
  const cucumber = await import('@cucumber/cucumber')
  console.log('✅ Available cucumber exports:', Object.keys(cucumber))

  // Check if we can access any internal builder or library functions
  if (cucumber.SupportCodeLibraryBuilder) {
    console.log('✅ Found SupportCodeLibraryBuilder!')
  } else {
    console.log('❌ SupportCodeLibraryBuilder not available in public API')
  }

  // Let's also check what happens if we try to create Given/When/Then without importing
  // Maybe we can call them programmatically?
  if (cucumber.Given && cucumber.When && cucumber.Then) {
    console.log('✅ Found Given/When/Then functions')

    // Can we call them directly to register steps?
    console.log('🔧 Attempting to register steps directly...')

    cucumber.Given('I have a test world', function() {
      console.log('✅ Direct Given step executed')
    })

    cucumber.When('I store {string} as {string}', function(key, value) {
      this.setData(key, value)
      console.log(`✅ Direct When step executed: ${key} = ${value}`)
    })

    cucumber.Then('I should be able to retrieve {string} as {string}', function(key, expectedValue) {
      const actualValue = this.getData(key)
      if (actualValue !== expectedValue) {
        throw new Error(`Expected ${key} to be ${expectedValue}, but got ${actualValue}`)
      }
      console.log(`✅ Direct Then step executed: ${key} = ${actualValue}`)
    })

    console.log('✅ Steps registered directly!')
  }

  // Now try to run cucumber
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: [], // NO import files - steps registered directly
      format: ['progress'],
      parallel: 1
    }
  })

  console.log('🚀 Running cucumber with directly registered steps...')
  const { success } = await runCucumber(runConfiguration)

  if (success) {
    console.log('🎉 SUCCESS! Direct step registration worked!')
  } else {
    console.log('❌ Direct step registration failed')
  }

} catch (error) {
  console.error('❌ Test failed:', error.message)
}