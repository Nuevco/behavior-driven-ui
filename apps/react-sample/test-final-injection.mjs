#!/usr/bin/env node

/**
 * FINAL TEST: Properly inject all three step definitions!
 */

import { loadConfiguration, loadSupport, runCucumber } from '@cucumber/cucumber/api'

console.log('🎉 FINAL TEST: Complete step injection...')

try {
  // Get reference objects
  const { runConfiguration } = await loadConfiguration({
    cwd: '/Users/timothystockstill/code/macos/nuevco/behavior-driven-ui/apps/react-sample',
    provided: { import: ['bdui-support.mjs'], format: ['progress'], parallel: 1 }
  })

  const workingResult = await runCucumber(runConfiguration)
  const realStepDef = workingResult.support.stepDefinitions[0]

  console.log('✅ Got reference step definition')

  // Create empty support
  const emptySupport = await loadSupport({
    ...runConfiguration,
    support: { ...runConfiguration.support, importPaths: [] }
  })

  console.log('✅ Got empty support library')

  // Helper function to create step definition
  function createStepDef(pattern, keyword, code) {
    const stepDef = Object.create(Object.getPrototypeOf(realStepDef))

    stepDef.code = code
    stepDef.id = `injected-${pattern.replace(/\s+/g, '-')}`
    stepDef.line = 1
    stepDef.options = {}
    stepDef.unwrappedCode = code
    stepDef.uri = 'programmatic-steps.js'
    stepDef.keyword = keyword
    stepDef.pattern = pattern

    // Use the expression from a working step definition of the same pattern
    // or create a simple matcher
    stepDef.expression = {
      match: (stepName) => stepName === pattern ? [] : null
    }

    return stepDef
  }

  // Create World class
  class InjectedWorld {
    constructor() {
      this.data = new Map()
    }
    setData(key, value) { this.data.set(key, value) }
    getData(key) { return this.data.get(key) }
  }

  // Set our World
  emptySupport.World = InjectedWorld

  // Create and inject our three step definitions
  const steps = [
    {
      pattern: 'I have a test world',
      keyword: 'Given',
      code: function() {
        console.log('✅ Injected Given step executed with World:', this.constructor.name)
      }
    },
    {
      pattern: 'I store {string} as {string}',
      keyword: 'When',
      code: function(key, value) {
        this.setData(key, value)
        console.log(`✅ Injected stored ${key} = ${value}`)
      }
    },
    {
      pattern: 'I should be able to retrieve {string} as {string}',
      keyword: 'Then',
      code: function(key, expectedValue) {
        const actualValue = this.getData(key)
        if (actualValue !== expectedValue) {
          throw new Error(`Expected ${key} to be ${expectedValue}, but got ${actualValue}`)
        }
        console.log(`✅ Injected retrieved ${key} = ${actualValue}`)
      }
    }
  ]

  steps.forEach(({ pattern, keyword, code }) => {
    const stepDef = createStepDef(pattern, keyword, code)
    emptySupport.stepDefinitions.push(stepDef)
  })

  console.log('✅ Injected all step definitions')
  console.log('Total steps:', emptySupport.stepDefinitions.length)

  // Run cucumber with our injected steps
  console.log('🚀 Running with all injected steps...')

  const finalResult = await runCucumber({
    ...runConfiguration,
    support: emptySupport
  })

  if (finalResult.success) {
    console.log('🎉🎉🎉 COMPLETE SUCCESS!')
    console.log('✅ Direct step injection works!')
    console.log('✅ No dual instance problems!')
    console.log('✅ No file generation needed!')
    console.log('✅ Users get steps "for free"!')
  } else {
    console.log('❌ Still some issues to resolve...')
  }

} catch (error) {
  console.error('❌ Final test failed:', error.message)
  console.error('Full error:', error)
}