import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { attemptRefresh } from '../../src/main/yahoo';
import { failingFetch, okFetch } from '../support/yahooStub';
import type { SectorScopeWorld } from '../support/world';

Given(
  'a data source that returns valid monthly data',
  function (this: SectorScopeWorld) {
    this.fetchImpl = okFetch;
  },
);

Given('a data source that is unavailable', function (this: SectorScopeWorld) {
  this.fetchImpl = failingFetch;
});

When('I refresh the data', async function (this: SectorScopeWorld) {
  this.refreshResult = await attemptRefresh(this.fetchImpl);
});

Then(
  'the refresh succeeds with {int} sectors',
  function (this: SectorScopeWorld, count: number) {
    assert.ok(this.refreshResult?.ok, 'expected refresh to succeed');
    if (this.refreshResult.ok) {
      assert.equal(this.refreshResult.data.sectors.length, count);
    }
  },
);

Then('the refresh reports a failure', function (this: SectorScopeWorld) {
  assert.equal(this.refreshResult?.ok, false);
});
