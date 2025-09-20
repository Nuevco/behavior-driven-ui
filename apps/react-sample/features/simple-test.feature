Feature: Simple Integration Test
  As a developer
  I want to test our behavior-driven-ui integration
  So that I can verify the World and step definitions work

  Scenario: Basic World Data Management
    Given I have a test world
    When I store "username" as "testuser"
    Then I should be able to retrieve "username" as "testuser"