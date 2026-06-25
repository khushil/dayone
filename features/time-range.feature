Feature: Time-range filtering
  As a user, I want to narrow the view to a shorter window and still read
  performance relative to that window's start. (FR-5)

  Background:
    Given the frozen sector fixture

  Scenario Outline: Each range slices to the right number of months
    When I view the "<range>" range
    Then every sector series has <points> monthly points
    And every sector series starts rebased to 100

    Examples:
      | range | points |
      | 12M   | 13     |
      | 6M    | 7      |
      | 3M    | 4      |
      | 1M    | 2      |
