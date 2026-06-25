Feature: Test harness smoke
  Confirms the Cucumber + tsx + fixture wiring before real features are added.

  Scenario: The frozen fixture loads
    Given the frozen sector fixture
    Then it has 11 sectors
