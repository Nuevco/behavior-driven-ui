import { PathTester } from './tester.js';

const tester = new PathTester();
const results = tester.runAllTests();

// console.log('ESM App Results:', results);
export { tester, results };
