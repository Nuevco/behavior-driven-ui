Feature: Visibility waits
  Core steps expose visibility assertions for any UI toggle behaviour.

  Background:
    Given a fresh BDUI test world

  Scenario: Waiting for content to appear and disappear
    Then "#demo-visibility-target" should be hidden
    When I click "#demo-visibility-toggle"
    Then "#demo-visibility-target" should be visible
    When I click "#demo-visibility-toggle"
    Then "#demo-visibility-target" should be hidden
