import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateUserData } from './migrate';

let root: string;
let legacy: string;
let fresh: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'dayone-mig-'));
  legacy = join(root, 'SectorScope');
  fresh = join(root, 'DayONE');
  mkdirSync(legacy, { recursive: true });
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('migrateUserData', () => {
  it('copies legacy sectors.json into the new dir on first run', () => {
    writeFileSync(join(legacy, 'sectors.json'), '{"x":1}');
    const result = migrateUserData(legacy, fresh);
    expect(result.migrated).toContain('sectors.json');
    expect(readFileSync(join(fresh, 'sectors.json'), 'utf8')).toBe('{"x":1}');
  });

  it('is idempotent — the marker prevents a second copy', () => {
    writeFileSync(join(legacy, 'sectors.json'), '{"x":1}');
    migrateUserData(legacy, fresh);
    writeFileSync(join(legacy, 'sectors.json'), '{"x":2}'); // change legacy
    const second = migrateUserData(legacy, fresh);
    expect(second.migrated).toEqual([]);
    expect(readFileSync(join(fresh, 'sectors.json'), 'utf8')).toBe('{"x":1}');
  });

  it('never overwrites an existing file in the new dir', () => {
    writeFileSync(join(legacy, 'sectors.json'), '{"legacy":true}');
    mkdirSync(fresh, { recursive: true });
    writeFileSync(join(fresh, 'sectors.json'), '{"existing":true}');
    const result = migrateUserData(legacy, fresh);
    expect(result.migrated).not.toContain('sectors.json');
    expect(readFileSync(join(fresh, 'sectors.json'), 'utf8')).toBe(
      '{"existing":true}',
    );
  });

  it('no-ops when the legacy dir is absent', () => {
    rmSync(legacy, { recursive: true });
    expect(migrateUserData(legacy, fresh).migrated).toEqual([]);
  });
});
