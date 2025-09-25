module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.js', '<rootDir>/src/**/*.test.ts'],
  transform: {
    '^.+\\.(ts|js)x?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(callsites|pkg-dir|@nuevco/free-paths)/)'
  ]
};