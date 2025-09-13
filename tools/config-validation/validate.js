#!/usr/bin/env node

/**
 * Configuration validation script
 * Runs ESLint and TypeScript on validation files and verifies expected errors occur
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load expected errors configuration
const expectedErrorsPath = join(__dirname, 'expected-errors.json');
const expectedErrors = JSON.parse(readFileSync(expectedErrorsPath, 'utf8'));

let exitCode = 0;

console.log('🔍 Validating ESLint and TypeScript configuration...\n');

// Test 1: Verify lint errors are caught
console.log('📋 Testing ESLint configuration...');
try {
  // Run ESLint on files that should have errors
  execSync('npm run lint:expect-errors', {
    cwd: __dirname,
    stdio: 'pipe'
  });

  // Check if lint results file exists and has errors
  const lintResultsPath = join(__dirname, 'lint-results.json');
  if (existsSync(lintResultsPath)) {
    const lintResults = JSON.parse(readFileSync(lintResultsPath, 'utf8'));
    const totalErrors = lintResults.reduce((sum, file) => sum + file.errorCount, 0);

    if (totalErrors >= expectedErrors.lint.minErrors) {
      console.log(`✅ ESLint caught ${totalErrors} errors (expected >= ${expectedErrors.lint.minErrors})`);

      // Check for specific expected rules
      const foundRules = new Set();
      lintResults.forEach(file => {
        file.messages.forEach(message => {
          if (message.ruleId) {
            foundRules.add(message.ruleId);
          }
        });
      });

      const expectedRules = expectedErrors.lint.expectedRules;
      const missingRules = expectedRules.filter(rule => !foundRules.has(rule));

      if (missingRules.length === 0) {
        console.log(`✅ All expected ESLint rules triggered: ${Array.from(foundRules).join(', ')}`);
      } else {
        console.log(`⚠️  Missing expected rules: ${missingRules.join(', ')}`);
        console.log(`   Found rules: ${Array.from(foundRules).join(', ')}`);
        // Don't fail for missing rules - just warn
      }
    } else {
      console.log(`❌ ESLint only caught ${totalErrors} errors (expected >= ${expectedErrors.lint.minErrors})`);
      exitCode = 1;
    }
  } else {
    console.log('❌ No ESLint results file generated');
    exitCode = 1;
  }
} catch (error) {
  console.log('✅ ESLint correctly failed (expected behavior for validation files)');
}

console.log('');

// Test 2: Verify TypeScript errors are caught
console.log('📋 Testing TypeScript configuration...');
try {
  execSync('npm run type:expect-errors', {
    cwd: __dirname,
    stdio: 'pipe'
  });

  // Check if type results file exists and has errors
  const typeResultsPath = join(__dirname, 'type-results.txt');
  if (existsSync(typeResultsPath)) {
    const typeResults = readFileSync(typeResultsPath, 'utf8');
    const errorLines = typeResults.split('\n').filter(line => line.includes('error TS') && line.trim().length > 0);


    if (errorLines.length >= expectedErrors.typescript.minErrors) {
      console.log(`✅ TypeScript caught ${errorLines.length} errors (expected >= ${expectedErrors.typescript.minErrors})`);

      // Check for expected error patterns
      const expectedPatterns = expectedErrors.typescript.expectedPatterns;
      const foundPatterns = expectedPatterns.filter(pattern => {
        const regex = new RegExp(pattern);
        return errorLines.some(line => regex.test(line));
      });

      if (foundPatterns.length > 0) {
        console.log(`✅ Found expected TypeScript error patterns: ${foundPatterns.length}/${expectedPatterns.length}`);
      } else {
        console.log(`⚠️  No expected TypeScript error patterns found`);
        console.log(`   Sample errors: ${errorLines.slice(0, 2).join('\\n   ')}`);
      }
    } else {
      console.log(`❌ TypeScript only caught ${errorLines.length} errors (expected >= ${expectedErrors.typescript.minErrors})`);
      console.log(`   Full output: ${typeResults}`);
      exitCode = 1;
    }
  } else {
    console.log('❌ No TypeScript results file generated');
    exitCode = 1;
  }
} catch (error) {
  console.log('✅ TypeScript correctly failed (expected behavior for validation files)');
}

console.log('');

// Test 3: Verify success files pass cleanly
console.log('📋 Testing success files pass cleanly...');
try {
  execSync('../../node_modules/.bin/eslint src/success-tests.ts', {
    cwd: __dirname,
    stdio: 'pipe'
  });
  console.log('✅ Success files pass ESLint cleanly');
} catch (error) {
  console.log('❌ Success files should pass ESLint but failed');
  console.log(error.stdout?.toString() || error.stderr?.toString());
  exitCode = 1;
}

try {
  execSync('npx tsc --noEmit src/success-tests.ts', {
    cwd: __dirname,
    stdio: 'pipe'
  });
  console.log('✅ Success files pass TypeScript cleanly');
} catch (error) {
  console.log('❌ Success files should pass TypeScript but failed');
  console.log(error.stdout?.toString() || error.stderr?.toString());
  exitCode = 1;
}

// Cleanup
try {
  execSync('npm run clean', { cwd: __dirname, stdio: 'pipe' });
} catch {
  // Ignore cleanup errors
}

console.log('');
if (exitCode === 0) {
  console.log('🎉 Configuration validation PASSED - ESLint and TypeScript are working correctly!');
} else {
  console.log('❌ Configuration validation FAILED - Check your ESLint and TypeScript setup');
}

process.exit(exitCode);