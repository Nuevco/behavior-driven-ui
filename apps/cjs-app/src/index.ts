import { PathTester } from './tester.js';

const tester = new PathTester();
const results = tester.runAllTests();

// console.log('CJS App Results:', results);
module.exports = { tester, results };
