import { When } from '@cucumber/cucumber';
import type { TimeRange } from '../../src/shared/types';
import type { SectorScopeWorld } from '../support/world';

When(
  'I view the {string} range',
  function (this: SectorScopeWorld, range: string) {
    this.range = range as TimeRange;
  },
);
