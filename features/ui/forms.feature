Feature: Forms and inputs
  Shared form behaviours provided by the BDUI core step library.

  Background:
    Given a fresh BDUI test world

  Scenario: Filling inputs and textareas
    When I fill "#demo-name" with "Ada"
    And I type " Lovelace" into "#demo-name"
    And I fill "#demo-bio" with ""
    And I type "First line" into "#demo-bio"
    And I type "\nSecond line" into "#demo-bio"
    Then the value of "#demo-name" should be "Ada Lovelace"
    And the value of "#demo-bio" should be "First line\nSecond line"

  Scenario: Selecting single and multiple options
    When I select "pear" from "#demo-fruit"
    And I select the following options from "#demo-toppings":
      | sprinkles |
      | chocolate |
    Then the value of "#demo-fruit" should be "pear"
    And the values of "#demo-toppings" should be:
      | sprinkles |
      | chocolate |

  Scenario: Toggling a checkbox
    When I click "#demo-subscribe"
    Then the value of "#demo-subscribe" should be "true"
