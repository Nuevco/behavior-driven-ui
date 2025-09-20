#!/usr/bin/env node

/**
 * Test: Create real StepDefinition objects using cucumber's constructors
 */

import { loadConfiguration, loadSupport, runCucumber } from '@cucumber/cucumber/api'

console.log('🔧 Testing real StepDefinition creation...')

try {
  // Try to import StepDefinition and related classes
  const cucumber = await import('@cucumber/cucumber')
  console.log('Available exports:', Object.keys(cucumber).filter(k => k.includes('Step') || k.includes('Expression')))

  // Load support to get access to existing objects
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: { import: ['bdui-support.mjs'], format: ['progress'], parallel: 1 }
  })

  const workingResult = await runCucumber(runConfiguration)
  const realStepDef = workingResult.support.stepDefinitions[0]

  console.log('✅ Got real step definition for reference')

  // Try to create our own using the same pattern
  console.log('🔧 Attempting to create step definition...')

  // Maybe we can clone the structure
  const ourStepDef = {
    code: function() { console.log('✅ Our injected step executed') },
    id: 'our-step-1',
    line: 1,
    options: {},
    unwrappedCode: function() { console.log('✅ Our injected step executed') },
    uri: 'programmatic-steps.js',
    keyword: 'Given',
    pattern: 'I have our test world',
    expression: realStepDef.expression  // Use real expression as template
  }

  // Add the prototype methods
  ourStepDef.matchesStepName = function(stepName) {
    return this.expression.match && this.expression.match(stepName)
  }

  ourStepDef.getInvocationParameters = realStepDef.getInvocationParameters

  console.log('✅ Created step definition object')

  // Now try to inject it
  const emptySupport = await loadSupport({
    ...runConfiguration,
    support: { ...runConfiguration.support, importPaths: [] }
  })

  emptySupport.stepDefinitions.push(ourStepDef)

  console.log('✅ Injected our step definition')
  console.log('Total step definitions:', emptySupport.stepDefinitions.length)

  // Test with cucumber
  console.log('🚀 Running with injected step definition...')

  // Create a simple test feature for our step
  const testResult = await runCucumber({
    ...runConfiguration,
    support: emptySupport,
    sources: {
      ...runConfiguration.sources,
      paths: [] // We'll test if our step matches
    }
  })

  console.log('Result:', testResult.success ? 'SUCCESS' : 'FAILED')

} catch (error) {
  console.error('❌ Test failed:', error.message)
  console.error('Full error:', error)
}