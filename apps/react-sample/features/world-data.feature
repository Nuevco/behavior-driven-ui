Feature: Managing scenario data with BDUI
  The built-in world implementation should allow storing data within a scenario
  and automatically clear that data when the setup hook runs again.

  Scenario: Scenario data resets after setup reruns
    Given a fresh BDUI test world
    When I store "Hello World" as "message"
    Then the data for "message" should be "Hello World"
    When I trigger the scenario setup
    Then the data for "message" should be absent
