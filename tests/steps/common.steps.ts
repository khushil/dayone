import { When } from '@cucumber/cucumber';
import type { TimeRange } from '../../src/shared/types';
import type { DayoneWorld } from '../support/world';

When('I view the {string} range', function (this: DayoneWorld, range: string) {
  this.range = range as TimeRange;
});
