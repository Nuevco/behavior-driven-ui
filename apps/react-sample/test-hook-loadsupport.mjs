#!/usr/bin/env node

/**
 * Test: Can we hook into loadSupport to inject our steps?
 */

import { loadConfiguration, loadSupport, runCucumber } from '@cucumber/cucumber/api'

console.log('🔧 Testing loadSupport hook approach...')

try {
  // Load configuration with empty support
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: [], // Start with no support files
      format: ['progress'],
      parallel: 1
    }
  })

  console.log('✅ Configuration loaded')

  // Load the empty support
  console.log('🔧 Loading empty support...')
  const originalSupport = await loadSupport(runConfiguration)
  console.log('✅ Empty support loaded')
  console.log('Original stepDefinitions:', originalSupport.stepDefinitions?.length || 0)

  // Check if we can modify the support object directly
  console.log('🔧 Attempting to modify support object...')

  if (originalSupport.stepDefinitions && Array.isArray(originalSupport.stepDefinitions)) {
    // Try to add our step definitions directly to the array
    originalSupport.stepDefinitions.push({
      pattern: 'I have a test world',
      code: function() {
        console.log('✅ Injected Given step executed')
      },
      id: 'injected-given',
      expression: { source: 'I have a test world' },
      options: {}
    })

    originalSupport.stepDefinitions.push({
      pattern: 'I store {string} as {string}',
      code: function(key, value) {
        console.log(`✅ Injected When step executed: ${key} = ${value}`)
      },
      id: 'injected-when',
      expression: { source: 'I store {string} as {string}' },
      options: {}
    })

    originalSupport.stepDefinitions.push({
      pattern: 'I should be able to retrieve {string} as {string}',
      code: function(key, expectedValue) {
        console.log(`✅ Injected Then step executed: ${key} = ${expectedValue}`)
      },
      id: 'injected-then',
      expression: { source: 'I should be able to retrieve {string} as {string}' },
      options: {}
    })

    console.log('✅ Steps injected into support object')
    console.log('Modified stepDefinitions:', originalSupport.stepDefinitions.length)
  }

  // Run cucumber with modified support
  console.log('🚀 Running cucumber with injected support...')
  const { success } = await runCucumber({
    ...runConfiguration,
    support: originalSupport
  })

  if (success) {
    console.log('🎉 Support injection worked!')
  } else {
    console.log('❌ Support injection failed')
  }

} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Full error:', error)
}