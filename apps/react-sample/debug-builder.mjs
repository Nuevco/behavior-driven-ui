#!/usr/bin/env node

/**
 * Debug: What exactly is the supportCodeLibraryBuilder?
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🔍 Debugging supportCodeLibraryBuilder...')

try {
  const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber')

  console.log('Type:', typeof supportCodeLibraryBuilder)
  console.log('Constructor:', supportCodeLibraryBuilder.constructor.name)
  console.log('Properties:', Object.keys(supportCodeLibraryBuilder))

  // Try to inspect each property
  for (const prop of Object.keys(supportCodeLibraryBuilder)) {
    const value = supportCodeLibraryBuilder[prop]
    console.log(`${prop}:`, typeof value, Array.isArray(value) ? `(array length ${value.length})` : '')
  }

  // Check if it has prototype methods
  console.log('Prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(supportCodeLibraryBuilder)))

  // Let's also check what happens when we call runCucumber and look at the support it creates
  console.log('\n🔍 Checking what support object runCucumber creates...')

  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: ['bdui-support.mjs'], // Use our old working support file
      format: ['progress'],
      parallel: 1
    }
  })

  console.log('🚀 Running to see what support object looks like...')
  const result = await runCucumber(runConfiguration)

  // The result might contain the support object
  console.log('Result keys:', Object.keys(result))
  if (result.support) {
    console.log('Support object type:', typeof result.support)
    console.log('Support object keys:', Object.keys(result.support))
  }

} catch (error) {
  console.error('❌ Debug failed:', error.message)
}