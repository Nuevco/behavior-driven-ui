/**
 * BDUI Support File - This is what our wrapper would generate
 * Contains our World and step definitions for users
 */

import { setWorldConstructor, Given, When, Then } from '@cucumber/cucumber'

console.log('🔧 Loading BDUI support...')

// Our World class that users get "for free"
class BduiWorld {
  constructor() {
    this.data = new Map()
    console.log('✅ BDUI World instance created')
  }

  setData(key, value) {
    this.data.set(key, value)
  }

  getData(key) {
    return this.data.get(key)
  }
}

// Set our World as the constructor
setWorldConstructor(function() {
  return new BduiWorld()
})

// Register our step definitions that users get "for free"
Given('I have a test world', function() {
  console.log('✅ BDUI Given step executed with World:', this.constructor.name)
})

When('I store {string} as {string}', function(key, value) {
  this.setData(key, value)
  console.log(`✅ BDUI stored ${key} = ${value}`)
})

Then('I should be able to retrieve {string} as {string}', function(key, expectedValue) {
  const actualValue = this.getData(key)
  if (actualValue !== expectedValue) {
    throw new Error(`Expected ${key} to be ${expectedValue}, but got ${actualValue}`)
  }
  console.log(`✅ BDUI retrieved ${key} = ${actualValue}`)
})

console.log('✅ BDUI support loaded successfully')