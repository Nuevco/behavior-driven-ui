import { PathTester } from './tester';

const tester = new PathTester();
const results = tester.runAllTests();

// console.log('CJS App Results:', results);
module.exports = { tester, results };
