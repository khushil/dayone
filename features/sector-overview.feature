Feature: Sector performance overview
  As an analyst, I want to see which sectors led and lagged, and how broad the
  move was, so I can read the market at a glance. (FR-4)

  Background:
    Given the frozen sector fixture

  Scenario: Identify the best and worst sector over twelve months
    When I view the "12M" range
    Then the best-performing sector is "Technology"
    And the worst-performing sector is "Energy"

  Scenario: Market breadth counts the advancing sectors
    When I view the "12M" range
    Then market breadth shows "8 / 11 advancing"
