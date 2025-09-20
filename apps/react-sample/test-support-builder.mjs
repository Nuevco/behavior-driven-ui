#!/usr/bin/env node

/**
 * BREAKTHROUGH: Test supportCodeLibraryBuilder direct access!
 * We found it in the exports - let's see if we can register steps directly on it
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🧪 Testing supportCodeLibraryBuilder direct access...')

try {
  // Import the supportCodeLibraryBuilder
  const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber')

  console.log('✅ Found supportCodeLibraryBuilder:', typeof supportCodeLibraryBuilder)
  console.log('🔍 Builder methods:', Object.getOwnPropertyNames(supportCodeLibraryBuilder))

  // Try to register steps directly on the builder
  console.log('🔧 Attempting to register steps on builder...')

  // Check if the builder has methods to define steps
  if (typeof supportCodeLibraryBuilder.defineStep === 'function') {
    console.log('✅ Found defineStep method!')

    // Register our steps directly on the builder
    supportCodeLibraryBuilder.defineStep({
      pattern: 'I have a test world',
      code: function() {
        console.log('✅ Builder Given step executed')
      }
    })

    supportCodeLibraryBuilder.defineStep({
      pattern: 'I store {string} as {string}',
      code: function(key, value) {
        this.setData(key, value)
        console.log(`✅ Builder When step executed: ${key} = ${value}`)
      }
    })

    supportCodeLibraryBuilder.defineStep({
      pattern: 'I should be able to retrieve {string} as {string}',
      code: function(key, expectedValue) {
        const actualValue = this.getData(key)
        if (actualValue !== expectedValue) {
          throw new Error(`Expected ${key} to be ${expectedValue}, but got ${actualValue}`)
        }
        console.log(`✅ Builder Then step executed: ${key} = ${actualValue}`)
      }
    })

    console.log('✅ Steps registered on builder!')
  }

  // Try to build the support library
  if (typeof supportCodeLibraryBuilder.build === 'function') {
    console.log('✅ Found build method!')
    const supportLibrary = supportCodeLibraryBuilder.build()
    console.log('✅ Built support library:', typeof supportLibrary)
  }

  // Now try to run cucumber
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: [], // NO import files - steps registered on builder
      format: ['progress'],
      parallel: 1
    }
  })

  console.log('🚀 Running cucumber with builder-registered steps...')
  const { success } = await runCucumber(runConfiguration)

  if (success) {
    console.log('🎉 SUCCESS! Builder-based step registration worked!')
  } else {
    console.log('❌ Builder-based step registration failed')
  }

} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Full error:', error)
}