Feature: Page not found

  Scenario: Visit a page which doesn't exist
    Given I go to the "Non-existent page" page
    Then the page looks as expected