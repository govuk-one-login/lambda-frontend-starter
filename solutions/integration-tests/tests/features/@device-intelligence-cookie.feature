@skipMobile
Feature: Device intelligence cookie

  Scenario: The device intelligence cookie is set
    Given I go to the "Non-existent page" page
    Then the "di-device-intelligence" cookie has been set
