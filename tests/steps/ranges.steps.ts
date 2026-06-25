import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { sliceByRange } from '../../src/renderer/src/lib/ranges';
import { rebaseToHundred } from '../../src/renderer/src/lib/returns';
import type { SectorScopeWorld } from '../support/world';

Then(
  'every sector series has {int} monthly points',
  function (this: SectorScopeWorld, points: number) {
    for (const sector of this.dataset().sectors) {
      assert.equal(sliceByRange(sector.closes, this.range).length, points);
    }
  },
);

Then(
  'every sector series starts rebased to 100',
  function (this: SectorScopeWorld) {
    for (const sector of this.dataset().sectors) {
      const rebased = rebaseToHundred(sliceByRange(sector.closes, this.range));
      assert.equal(rebased[0], 100);
    }
  },
);
