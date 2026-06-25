import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { loadFixture } from '../support/fixture';
import type { DayoneWorld } from '../support/world';

Given('the frozen sector fixture', function (this: DayoneWorld) {
  this.data = loadFixture();
});

Then('it has 11 sectors', function (this: DayoneWorld) {
  assert.equal(this.data?.sectors.length, 11);
});
