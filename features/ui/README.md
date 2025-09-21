# Shared UI Feature Corpus

Scenarios in this directory exercise the BDUI core step library and serve as the
canonical acceptance tests for every sample application (React, Angular, Vue,
etc.). Apps should reference these files via their `bdui.config` (for example
`features: ['../features/ui/**/*.feature']`) so the same behaviours are validated
across frameworks.

When extending the shared suite, keep scenarios framework-agnostic and avoid
references to app-specific implementation details. Framework-specific features
belong in the corresponding app directory.
