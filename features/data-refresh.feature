Feature: Resilient data refresh
  As a user, I want the Refresh action to update prices when the network is
  available, and to quietly keep the last good data when it isn't. (FR-9)

  Scenario: A successful refresh loads every sector
    Given a data source that returns valid monthly data
    When I refresh the data
    Then the refresh succeeds with 11 sectors

  Scenario: A failing source keeps the last-good data
    Given a data source that is unavailable
    When I refresh the data
    Then the refresh reports a failure
