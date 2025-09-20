#!/usr/bin/env node

/**
 * BREAKTHROUGH TEST: Reset builder to OPEN status, then register steps!
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🎉 Testing RESET builder approach...')

try {
  const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber')

  console.log('Initial status:', supportCodeLibraryBuilder.status)

  // CRITICAL: Reset the builder to OPEN status
  supportCodeLibraryBuilder.reset()
  console.log('Status after reset:', supportCodeLibraryBuilder.status)

  // Now use the methods object to register steps
  const { methods } = supportCodeLibraryBuilder

  console.log('🔧 Registering steps on OPEN builder...')

  // Register our World
  methods.setWorldConstructor(function() {
    return {
      data: new Map(),
      setData(key, value) { this.data.set(key, value) },
      getData(key) { return this.data.get(key) }
    }
  })

  // Register our steps using the methods object
  methods.Given('I have a test world', function() {
    console.log('✅ Builder Given step executed with World:', this.constructor.name)
  })

  methods.When('I store {string} as {string}', function(key, value) {
    this.setData(key, value)
    console.log(`✅ Builder stored ${key} = ${value}`)
  })

  methods.Then('I should be able to retrieve {string} as {string}', function(key, expectedValue) {
    const actualValue = this.getData(key)
    if (actualValue !== expectedValue) {
      throw new Error(`Expected ${key} to be ${expectedValue}, but got ${actualValue}`)
    }
    console.log(`✅ Builder retrieved ${key} = ${actualValue}`)
  })

  console.log('✅ Steps registered on OPEN builder!')

  // Build the support library
  const supportLibrary = supportCodeLibraryBuilder.finalize()
  console.log('✅ Support library built!')

  // Load configuration with NO import files
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: [], // NO FILES - using our built support
      format: ['progress'],
      parallel: 1
    }
  })

  // Inject our built support library
  console.log('🚀 Running cucumber with injected support library...')
  const { success } = await runCucumber({
    ...runConfiguration,
    support: supportLibrary
  })

  if (success) {
    console.log('🎉🎉🎉 BREAKTHROUGH SUCCESS! Direct registration works!')
    console.log('✅ No dual instance problems!')
    console.log('✅ No file generation needed!')
    console.log('✅ Direct step registration achieved!')
  } else {
    console.log('❌ Still not working...')
  }

} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Full error:', error)
}