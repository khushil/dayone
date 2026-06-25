// Generate the GitHub Wiki from repo sources so docs and Wiki never drift.
// Each page maps to a source file; a MISSING source is skipped with a warning
// and its page is left untouched (regenerate-all never wipes a live page).
// The Claude-Code-setup page is generated from .claude + the CLAUDE.md tree.
// Run with: node --import tsx scripts/build-wiki.ts <wikiDir>   (default: ./wiki)
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  mkdirSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Wiki page title → source file (relative to repo root). */
const PAGE_SOURCES: Record<string, string> = {
  Home: 'README.md',
  'Coding-standards': 'docs/CODING_STANDARDS.md',
  Requirements: 'docs/REQUIREMENTS.md',
  Architecture: 'docs/ARCHITECTURE.md',
  Providers: 'docs/PROVIDERS.md',
  'Releases-and-auto-update': 'docs/RELEASING.md',
};

function banner(source: string): string {
  return `<!-- Auto-generated from ${source}. Edit the source in the repo, not this page. -->\n\n`;
}

function listDir(dir: string, suffix: string): string[] {
  const path = join(REPO_ROOT, dir);
  if (!existsSync(path)) {
    return [];
  }
  return readdirSync(path)
    .filter((f) => f.endsWith(suffix))
    .sort();
}

function findClaudeMds(): string[] {
  const out: string[] = [];
  const skip = new Set(['node_modules', '.git', 'dist', 'out', '.wiki']);
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (skip.has(entry)) {
        continue;
      }
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry === 'CLAUDE.md') {
        out.push(relative(REPO_ROOT, full));
      }
    }
  };
  walk(REPO_ROOT);
  return out.sort();
}

/** Build the Claude-Code-setup page from .claude config + the CLAUDE.md tree. */
function claudeSetupPage(): string {
  const lines = ['# Claude Code setup', ''];
  lines.push(
    'This project ships its Claude Code configuration so the AI-assisted SDLC is reproducible. This page is generated from `.claude/` and the `CLAUDE.md` tree.',
    '',
  );

  let hookEvents: string[] = [];
  try {
    const settings = JSON.parse(
      readFileSync(join(REPO_ROOT, '.claude/settings.json'), 'utf8'),
    ) as { hooks?: Record<string, unknown> };
    hookEvents = settings.hooks ? Object.keys(settings.hooks) : [];
  } catch {
    /* no settings */
  }

  lines.push('## Hooks', '');
  if (hookEvents.length) {
    lines.push(
      `Configured events: ${hookEvents.map((e) => `\`${e}\``).join(', ')}.`,
      '',
    );
  }
  const hookScripts = listDir('.claude/hooks', '.sh').concat(
    listDir('.claude/hooks', '.ts'),
  );
  for (const h of hookScripts) {
    lines.push(`- \`.claude/hooks/${h}\``);
  }

  lines.push('', '## Agents', '');
  for (const a of listDir('.claude/agents', '.md')) {
    lines.push(`- \`${a.replace(/\.md$/, '')}\``);
  }

  lines.push('', '## Skills', '');
  const skillsDir = join(REPO_ROOT, '.claude/skills');
  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir).sort()) {
      if (statSync(join(skillsDir, entry)).isDirectory()) {
        lines.push(`- \`${entry}\``);
      }
    }
  }

  lines.push('', '## CLAUDE.md files (progressive disclosure)', '');
  for (const f of findClaudeMds()) {
    lines.push(`- \`${f}\``);
  }
  lines.push('');
  return lines.join('\n');
}

export interface WikiResult {
  written: string[];
  skipped: string[];
}

/** Write all pages into `wikiDir`. Missing sources are skipped (page untouched). */
export function buildWiki(wikiDir: string): WikiResult {
  mkdirSync(wikiDir, { recursive: true });
  const written: string[] = [];
  const skipped: string[] = [];

  for (const [page, source] of Object.entries(PAGE_SOURCES)) {
    const src = join(REPO_ROOT, source);
    if (!existsSync(src)) {
      console.warn(
        `skip ${page}: source ${source} not found (page left as-is)`,
      );
      skipped.push(page);
      continue;
    }
    writeFileSync(
      join(wikiDir, `${page}.md`),
      banner(source) + readFileSync(src, 'utf8'),
    );
    written.push(page);
  }

  writeFileSync(join(wikiDir, 'Claude-Code-setup.md'), claudeSetupPage());
  written.push('Claude-Code-setup');

  const sidebar = [
    '### DayONE Wiki',
    '',
    ...written.map((p) => `- [[${p}]]`),
    '',
  ];
  writeFileSync(join(wikiDir, '_Sidebar.md'), sidebar.join('\n'));

  return { written, skipped };
}

// Run only when invoked directly (not when imported by a test).
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const wikiDir = resolve(process.argv[2] ?? 'wiki');
  const { written, skipped } = buildWiki(wikiDir);
  console.log(`wiki: wrote ${written.length} page(s) to ${wikiDir}`);
  if (skipped.length) {
    console.log(`wiki: skipped ${skipped.length} (${skipped.join(', ')})`);
  }
}
