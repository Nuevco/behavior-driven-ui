module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.js', '**/*.test.ts'],
  transform: {
    '^.+\\.(ts|js)x?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(callsites|pkg-dir|@nuevco/free-paths)/)'
  ]
};