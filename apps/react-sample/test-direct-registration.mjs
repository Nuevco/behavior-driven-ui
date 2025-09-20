#!/usr/bin/env node

/**
 * Test: Can we register steps directly on the cucumber instance we create?
 * Since WE are launching cucumber, we should have direct access to register steps
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🧪 Testing direct step registration on our cucumber instance...')

try {
  // Load configuration normally
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: [], // NO import files - we register directly
      format: ['progress'],
      parallel: 1
    }
  })

  console.log('✅ Configuration loaded with no import files')

  // TODO: Find a way to register our steps directly on the cucumber instance
  // before calling runCucumber

  // Maybe we can modify runConfiguration.support somehow?
  console.log('🔍 Investigating support object structure:', runConfiguration.support)

  // Or maybe we can access the cucumber instance during setup?
  console.log('🔍 Investigating runtime object structure:', runConfiguration.runtime)

  // Test: Try to run without any support files
  console.log('🚀 Running cucumber with no support files...')
  const { success } = await runCucumber(runConfiguration)

  console.log(`🎯 Test completed. Success: ${success}`)

} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Full error:', error)
}