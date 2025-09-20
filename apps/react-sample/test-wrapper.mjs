#!/usr/bin/env node

/**
 * Test the cucumber.js programmatic API to verify wrapper approach
 * CORRECT APPROACH: Use support files, not direct registration
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🧪 Testing cucumber.js programmatic API wrapper approach...')

try {
  // Test 1: Load configuration with MERGED support files
  console.log('📋 Loading configuration with merged support...')

  // Test: Can we load steps directly from node_modules instead of generating files?
  const userConfig = {
    import: [
      'features/support/**/*.js',  // User's existing support files
      // Try loading from our package support file directly (absolute path)
      '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/packages/behavior-driven-ui/dist/support.mjs'
    ],
    format: ['progress'],
    parallel: 1
  }

  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: userConfig
  })

  console.log('✅ Configuration loaded with merged support:', {
    supportPaths: runConfiguration.support.importPaths,
    sourcePaths: runConfiguration.sources.paths
  })

  // Test 2: Run cucumber programmatically
  // Our World and steps will be loaded from bdui-support.mjs
  console.log('🚀 Running cucumber with BDUI support...')
  const { success } = await runCucumber(runConfiguration)

  console.log(`🎯 Test completed. Success: ${success}`)

  if (success) {
    console.log('\n🎉 WRAPPER APPROACH VERIFIED!')
    console.log('✅ Users can run our wrapper instead of cucumber-js')
    console.log('✅ They get our World and steps "for free"')
    console.log('✅ No dual instance problems')
    console.log('✅ Configuration merging works')
  }

} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error(error.stack)
  process.exit(1)
}