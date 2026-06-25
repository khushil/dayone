import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { monthlyReturns } from '../../src/renderer/src/lib/returns';
import type { Sector } from '../../src/shared/types';
import type { SectorScopeWorld } from '../support/world';

function sectorByName(world: SectorScopeWorld, name: string): Sector {
  const sector = world.dataset().sectors.find((s) => s.name === name);
  assert.ok(sector, `No sector named "${name}"`);
  return sector;
}

Then('every sector has 12 monthly returns', function (this: SectorScopeWorld) {
  for (const sector of this.dataset().sectors) {
    assert.equal(monthlyReturns(sector.closes).length, 12);
  }
});

Then(
  'the {string} monthly returns are all positive',
  function (this: SectorScopeWorld, name: string) {
    const returns = monthlyReturns(sectorByName(this, name).closes);
    assert.ok(returns.every((r) => r.return > 0));
  },
);

Then(
  'the {string} monthly returns are all negative',
  function (this: SectorScopeWorld, name: string) {
    const returns = monthlyReturns(sectorByName(this, name).closes);
    assert.ok(returns.every((r) => r.return < 0));
  },
);
