#!/usr/bin/env node

/**
 * Debug: Why isn't defineStep adding to stepDefinitions array?
 */

console.log('🔍 Debugging defineStep registration...')

try {
  const { supportCodeLibraryBuilder } = await import('@cucumber/cucumber')

  console.log('Initial state:')
  console.log('  Status:', supportCodeLibraryBuilder.status)
  console.log('  stepDefinitionConfigs length:', supportCodeLibraryBuilder.stepDefinitionConfigs?.length || 'undefined')

  // Reset to OPEN
  supportCodeLibraryBuilder.reset()
  console.log('\nAfter reset:')
  console.log('  Status:', supportCodeLibraryBuilder.status)
  console.log('  stepDefinitionConfigs length:', supportCodeLibraryBuilder.stepDefinitionConfigs?.length || 'undefined')

  // Try defineStep and check what happens
  console.log('\n🔧 Calling defineStep...')

  try {
    supportCodeLibraryBuilder.defineStep({
      pattern: 'I have a test world',
      options: {},
      code: function() { console.log('Test step') }
    })
    console.log('✅ defineStep call succeeded')
  } catch (error) {
    console.error('❌ defineStep call failed:', error.message)
  }

  console.log('\nAfter defineStep:')
  console.log('  stepDefinitionConfigs length:', supportCodeLibraryBuilder.stepDefinitionConfigs?.length || 'undefined')

  // Check what's in stepDefinitionConfigs
  if (supportCodeLibraryBuilder.stepDefinitionConfigs) {
    console.log('  stepDefinitionConfigs content:', supportCodeLibraryBuilder.stepDefinitionConfigs)
  }

  // Try the methods approach instead
  console.log('\n🔧 Trying methods.Given...')

  const { methods } = supportCodeLibraryBuilder

  try {
    methods.Given('I have a test world via methods', function() {
      console.log('Methods step')
    })
    console.log('✅ methods.Given succeeded')
  } catch (error) {
    console.error('❌ methods.Given failed:', error.message)
  }

  console.log('\nAfter methods.Given:')
  console.log('  stepDefinitionConfigs length:', supportCodeLibraryBuilder.stepDefinitionConfigs?.length || 'undefined')

  // Now try to finalize and see what we get
  console.log('\n🔧 Calling finalize...')
  const support = supportCodeLibraryBuilder.finalize()
  console.log('✅ Finalize succeeded')
  console.log('Final stepDefinitions length:', support.stepDefinitions?.length || 0)

  if (support.stepDefinitions?.length > 0) {
    console.log('Step definitions:', support.stepDefinitions.map(sd => sd.pattern))
  }

} catch (error) {
  console.error('❌ Debug failed:', error.message)
  console.error('Full error:', error)
}