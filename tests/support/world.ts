import { setWorldConstructor, World } from '@cucumber/cucumber';
import type {
  RefreshResult,
  SectorData,
  TimeRange,
} from '../../src/shared/types';

/**
 * Per-scenario state for SectorScope acceptance tests. Steps load the frozen
 * fixture into `data` and record the range/selection under test, then assert on
 * values derived by the `lib/` domain functions.
 */
export class SectorScopeWorld extends World {
  data?: SectorData;
  range: TimeRange = '12M';
  fetchImpl?: typeof fetch;
  refreshResult?: RefreshResult;

  /** The loaded fixture, or a clear error if a step forgot to load it. */
  dataset(): SectorData {
    if (!this.data) {
      throw new Error(
        'Fixture not loaded — add "Given the frozen sector fixture"',
      );
    }
    return this.data;
  }
}

setWorldConstructor(SectorScopeWorld);
