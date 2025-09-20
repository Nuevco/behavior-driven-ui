#!/usr/bin/env node

/**
 * Test: Can we pass a support library directly to runCucumber?
 * Maybe we can build a support library and pass it instead of loading from files
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🧪 Testing direct support library injection...')

try {
  // Get the support code library builder
  const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber')

  console.log('✅ Got supportCodeLibraryBuilder')
  console.log('🔍 Current stepDefinitionConfigs:', supportCodeLibraryBuilder.stepDefinitionConfigs.length)

  // Check the correct method signature
  if (supportCodeLibraryBuilder.methods) {
    console.log('✅ Found methods object:', Object.keys(supportCodeLibraryBuilder.methods))
  }

  // Try using the methods object to register steps
  if (supportCodeLibraryBuilder.methods && supportCodeLibraryBuilder.methods.Given) {
    console.log('🔧 Attempting to use methods.Given...')

    supportCodeLibraryBuilder.methods.Given('I have a test world', function() {
      console.log('✅ Methods Given step executed')
    })

    supportCodeLibraryBuilder.methods.When('I store {string} as {string}', function(key, value) {
      console.log(`✅ Methods When step executed: ${key} = ${value}`)
    })

    supportCodeLibraryBuilder.methods.Then('I should be able to retrieve {string} as {string}', function(key, expectedValue) {
      console.log(`✅ Methods Then step executed: ${key} = ${expectedValue}`)
    })

    console.log('✅ Steps registered via methods object')
    console.log('🔍 Updated stepDefinitionConfigs:', supportCodeLibraryBuilder.stepDefinitionConfigs.length)
  }

  // Load configuration
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: [],
      format: ['progress'],
      parallel: 1
    }
  })

  // Try to build and inject support library
  console.log('🔧 Attempting to build support library...')
  const supportLibrary = supportCodeLibraryBuilder.build()
  console.log('✅ Built support library')

  // Try to pass it directly to runCucumber
  console.log('🚀 Running cucumber with built support library...')
  const { success } = await runCucumber({
    ...runConfiguration,
    support: supportLibrary  // Pass our built support library
  })

  if (success) {
    console.log('🎉 SUCCESS! Direct support library injection worked!')
  } else {
    console.log('❌ Direct support library injection failed')
  }

} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Full error:', error)
}