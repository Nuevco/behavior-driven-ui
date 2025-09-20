#!/usr/bin/env node

/**
 * Inspect: Compare our built support library with a working one
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🔍 Comparing support library structures...')

try {
  // First, get a working support library by running with our bdui-support.mjs
  console.log('📋 Getting working support library...')

  const { runConfiguration: workingConfig } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: ['bdui-support.mjs'],
      format: ['progress'],
      parallel: 1
    }
  })

  const workingResult = await runCucumber(workingConfig)
  console.log('✅ Got working support library')
  console.log('Working support keys:', Object.keys(workingResult.support))
  console.log('Step definitions count:', workingResult.support.stepDefinitions?.length || 0)

  if (workingResult.support.stepDefinitions?.length > 0) {
    console.log('First step definition:', {
      pattern: workingResult.support.stepDefinitions[0].pattern,
      type: typeof workingResult.support.stepDefinitions[0].code
    })
  }

  // Now build our own support library
  console.log('\n🔧 Building our own support library...')

  const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber')
  supportCodeLibraryBuilder.reset()

  // Register steps
  supportCodeLibraryBuilder.defineStep({
    pattern: 'I have a test world',
    options: {},
    code: function() { console.log('Our step executed') }
  })

  const ourSupport = supportCodeLibraryBuilder.finalize()
  console.log('✅ Built our support library')
  console.log('Our support keys:', Object.keys(ourSupport))
  console.log('Our step definitions count:', ourSupport.stepDefinitions?.length || 0)

  if (ourSupport.stepDefinitions?.length > 0) {
    console.log('Our first step definition:', {
      pattern: ourSupport.stepDefinitions[0].pattern,
      type: typeof ourSupport.stepDefinitions[0].code
    })
  }

  // Compare structures
  console.log('\n🔍 Structure comparison:')
  for (const key of Object.keys(workingResult.support)) {
    const workingValue = workingResult.support[key]
    const ourValue = ourSupport[key]

    console.log(`${key}:`)
    console.log(`  Working: ${Array.isArray(workingValue) ? `Array(${workingValue.length})` : typeof workingValue}`)
    console.log(`  Ours: ${Array.isArray(ourValue) ? `Array(${ourValue.length})` : typeof ourValue}`)
  }

} catch (error) {
  console.error('❌ Inspection failed:', error.message)
}