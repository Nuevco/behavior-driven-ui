Feature: Navigating to the configured base URL
  The BDUI world should visit the configured base URL during scenario setup so
  tests always start from a known location.

  Scenario: The world navigates to the desired entry point
    Given a BDUI world configured with base url "https://example.test/app"
    Then the driver should have navigated to "https://example.test/app"
