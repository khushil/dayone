import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { loadFixture } from '../support/fixture';
import type { SectorScopeWorld } from '../support/world';

Given('the frozen sector fixture', function (this: SectorScopeWorld) {
  this.data = loadFixture();
});

Then('it has 11 sectors', function (this: SectorScopeWorld) {
  assert.equal(this.data?.sectors.length, 11);
});
