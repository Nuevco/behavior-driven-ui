Feature: Adjusting the driver viewport
  The BDUI driver abstraction should accept viewport updates so responsive tests
  can verify layouts at different sizes.

  Scenario: Resizing the viewport updates the driver state
    Given a fresh BDUI test world
    When I set the viewport to 1024 by 768
    Then the viewport size should be 1024 by 768
