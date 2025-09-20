export default {
  default: {
    import: [
      'features/support/**/*.js'
    ],
    format: ['progress', 'json:reports/cucumber-report.json'],
    parallel: 1
  }
}