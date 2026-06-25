Feature: Monthly returns
  As a user, I want the month-by-month returns behind the matrix, with the
  direction reflected in their sign. (FR-3, FR-7)

  Background:
    Given the frozen sector fixture

  Scenario: Thirteen monthly closes produce twelve monthly returns
    Then every sector has 12 monthly returns

  Scenario: Returns carry the direction of the trend
    Then the "Technology" monthly returns are all positive
    And the "Energy" monthly returns are all negative
