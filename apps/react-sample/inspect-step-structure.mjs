#!/usr/bin/env node

/**
 * Inspect: What does a real step definition object look like?
 */

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api'

console.log('🔍 Inspecting real step definition structure...')

try {
  // Get a working support library
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: {
      import: ['bdui-support.mjs'],
      format: ['progress'],
      parallel: 1
    }
  })

  const result = await runCucumber(runConfiguration)

  if (result.support.stepDefinitions?.length > 0) {
    const stepDef = result.support.stepDefinitions[0]

    console.log('✅ Real step definition structure:')
    console.log('Type:', typeof stepDef)
    console.log('Constructor:', stepDef.constructor.name)
    console.log('Properties:', Object.keys(stepDef))

    // Check prototype methods
    console.log('Prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(stepDef)))

    // Check specific properties
    console.log('\nProperty details:')
    for (const prop of Object.keys(stepDef)) {
      const value = stepDef[prop]
      console.log(`${prop}:`, typeof value, Array.isArray(value) ? `(array length ${value.length})` : '')
    }

    // Check if matchesStepName exists and what it looks like
    if (typeof stepDef.matchesStepName === 'function') {
      console.log('\n✅ matchesStepName method found')
      console.log('Function signature:', stepDef.matchesStepName.toString().substring(0, 200))
    }

    // Check the expression property
    if (stepDef.expression) {
      console.log('\nExpression object:')
      console.log('Type:', typeof stepDef.expression)
      console.log('Properties:', Object.keys(stepDef.expression))
      console.log('Constructor:', stepDef.expression.constructor.name)
    }

    // Check the pattern property
    if (stepDef.pattern) {
      console.log('\nPattern:', stepDef.pattern)
      console.log('Pattern type:', typeof stepDef.pattern)
    }
  }

} catch (error) {
  console.error('❌ Inspection failed:', error.message)
}