import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  bestWorstSector,
  marketBreadth,
} from '../../src/renderer/src/lib/summary';
import type { DayoneWorld } from '../support/world';

Then(
  'the best-performing sector is {string}',
  function (this: DayoneWorld, name: string) {
    assert.equal(bestWorstSector(this.dataset(), this.range).best.name, name);
  },
);

Then(
  'the worst-performing sector is {string}',
  function (this: DayoneWorld, name: string) {
    assert.equal(bestWorstSector(this.dataset(), this.range).worst.name, name);
  },
);

Then(
  'market breadth shows {string}',
  function (this: DayoneWorld, text: string) {
    const { advancing, total } = marketBreadth(this.dataset(), this.range);
    assert.equal(`${advancing} / ${total} advancing`, text);
  },
);
