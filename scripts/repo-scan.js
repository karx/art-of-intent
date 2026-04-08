#!/usr/bin/env node
/**
 * scripts/repo-scan.js — Topic-weighted codebase audit
 *
 * Walks every tracked file, classifies it into a topic, scores it on three axes,
 * then reports a weighted summary and flags structural problems.
 *
 * Usage:
 *   node scripts/repo-scan.js           # terminal output
 *   node scripts/repo-scan.js --md      # markdown (pipe to file)
 *   node scripts/repo-scan.js --json    # raw JSON
 *
 * Score formula (0–10):
 *   score = relevance×0.40 + recency×0.25 + size×0.15 + connectedness×0.20
 *
 *   relevance      topic weight (defined per-topic below)
 *   recency        10 (<7d)  8 (<30d)  5 (<90d)  3 (<180d)  1 (older)
 *   size           10(>50KB) 8(>20KB)  6(>10KB)  4(>3KB)    2(>500B)  1(tiny)
 *   connectedness  fan-in normalised to 0–10 (how many files reference this one)
 *
 * Connectedness / inertia:
 *   fan-in   files that import/link TO this file  → inertia (hard to remove)
 *   fan-out  files this file imports/links FROM   → coupling (depends on many things)
 *   Docs use markdown link counts; code uses import/require/script-src.
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative, extname, basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = join(fileURLToPath(import.meta.url), '..', '..');
const NOW     = Date.now();
const MS_DAY  = 86_400_000;
const IS_JSON = process.argv.includes('--json');
const IS_MD   = process.argv.includes('--md');

// ── Exclusions ────────────────────────────────────────────────────────────────

const SKIP_DIR_NAMES = new Set([
  'node_modules', '.git', '.firebase', 'build', 'dist',
  '.nyc_output', 'coverage', '.cache', '.claude', '.svelte-kit',
]);
const SKIP_DIR_PREFIXES = [
  'android/', 'ios/', 'frontend/build', 'frontend/.svelte-kit',
];
const SKIP_FILE_NAMES = new Set([
  'package-lock.json', 'firestore-backup-2026-04-07.json',
]);
const TEXT_EXTS = new Set([
  '.js', '.ts', '.svelte', '.html', '.css',
  '.md', '.json', '.toml', '.yaml', '.yml',
  '.cjs', '.mjs', '.rules', '.http', '.sh', '.txt', '.plist',
]);

// ── Topics ────────────────────────────────────────────────────────────────────
// relevance: 1–10. How central to the game's purpose.
// match(rel):  rel is the POSIX-style path relative to repo root.

const TOPICS = [
  {
    id: 'game-core', label: '🎮 Game Core', relevance: 10,
    match: p =>
      /src\/js\/(game|ui-components|welcome-modal|firebase-integration|firebase-db|sound-manager)/.test(p) ||
      /frontend\/src\/(lib\/(scoring|api|arty-remarks)|lib\/stores\/game|routes\/\+page)/.test(p) ||
      /src\/data\/arty-remarks/.test(p),
  },
  {
    id: 'ai-gateway', label: '🤖 AI Gateway', relevance: 9,
    match: p =>
      /functions\/(gateway|crypto|index)\./.test(p) ||
      /functions\/gateway\//.test(p) ||
      /functions\/test\//.test(p),
  },
  {
    id: 'frontend-infra', label: '🖥️  Frontend Infra', relevance: 8,
    match: p =>
      /frontend\/src\/(lib\/(firebase|stores\/auth|platform|sound|index)|routes\/(settings|leaderboard|about|insights|cheat|help)|app\.(html|d\.ts)|error)/.test(p) ||
      /frontend\/(svelte\.config|vite\.config|package\.json|tsconfig|\.npmrc)/.test(p) ||
      /frontend\/src\/routes\/\+layout/.test(p) ||
      /frontend\/static\/robots\.txt/.test(p) ||
      /frontend\/(README|\.gitignore)/.test(p),
  },
  {
    id: 'auth', label: '🔐 Auth', relevance: 7,
    match: p =>
      /src\/js\/firebase-auth/.test(p) ||
      /stores\/auth/.test(p),
  },
  {
    id: 'tests', label: '🧪 Tests', relevance: 7,
    match: p =>
      /\.(test|spec)\.(js|ts)$/.test(p) ||
      /\/(tests|test)\//.test(p) ||
      /test-.*\.html$/.test(p) ||
      /tests\/browser\//.test(p) ||
      /test\.json$/.test(basename(p)),
  },
  {
    id: 'security', label: '🛡️  Security', relevance: 7,
    match: p =>
      /security/i.test(p) ||
      /xss|injection|purify|violation/i.test(p) ||
      /firestore\.rules$/.test(p),
  },
  {
    id: 'styling', label: '🎨 Styling & Themes', relevance: 6,
    match: p =>
      /\.(css|scss)$/.test(p) ||
      /DOS_THEME_GUIDELINES|THEME_SYSTEM/.test(p) ||
      /src\/js\/(theme-picker|theme-manager)/.test(p),
  },
  {
    id: 'share-cards', label: '🃏 Share Cards', relevance: 6,
    match: p =>
      /share-card/.test(p) ||
      /SHARE_CARD/.test(p) ||
      /src\/js\/leaderboard-card-generator/.test(p),
  },
  {
    id: 'ci-cd', label: '🚀 CI / CD', relevance: 5,
    match: p =>
      /\.github\/workflows/.test(p) ||
      /netlify\.toml$/.test(p) ||
      /\.githooks\//.test(p) ||
      /android\/(gradlew|\.gitignore)/.test(p) ||
      /ios\/(\.gitignore|ExportOptions)/.test(p) ||
      /manual-deploy-words/.test(p),
  },
  {
    id: 'config', label: '⚙️  Config', relevance: 5,
    match: p =>
      /^(firebase\.json|\.firebaserc|firestore\.indexes\.json|capacitor\.config\.ts|package\.json|site\.webmanifest|\.env|\.env_example|\.gitignore)$/.test(basename(p)) &&
      !p.includes('frontend/') && !p.includes('android/') && !p.includes('ios/') ||
      /^functions\/(package\.json|firestore-backup)/.test(p) ||
      /\.devcontainer\//.test(p),
  },
  {
    id: 'analytics-seo', label: '📊 Analytics & SEO', relevance: 5,
    match: p =>
      /analytics|ANALYTICS|TRACKING|tracking/i.test(p) ||
      /schema.org|SCHEMA_ORG|opengraph|OPENGRAPH|og.image|OG_IMAGE|SOCIAL_MEDIA/i.test(p) ||
      /site\.webmanifest$/.test(p) ||
      /src\/js\/analytics/.test(p),
  },
  {
    id: 'docs-projects', label: '📋 Docs — Projects', relevance: 4,
    match: p => /^docs\/projects\//.test(p),
  },
  {
    id: 'docs-areas', label: '📖 Docs — Areas', relevance: 4,
    match: p => /^docs\/areas\//.test(p) || /^docs\/VISION\.md$/.test(p) || /^CLAUDE\.md$/.test(p),
  },
  {
    id: 'docs-resources', label: '📚 Docs — Resources', relevance: 3,
    match: p => /^docs\/resources\//.test(p),
  },
  {
    id: 'docs-root', label: '📄 Docs — Root', relevance: 3,
    match: p =>
      /^(README|CHANGELOG|SECURITY|LICENSE)\.md$/.test(basename(p)) ||
      /^docs\/(README|future-work)\.md$/.test(p) ||
      /^LICENSE$/.test(p),
  },
  {
    id: 'legacy-src', label: '🏚️  Legacy src/', relevance: 2,
    match: p =>
      /^src\/js\/(share-card|firebase-config|config|version|sound-effects|leaderboard-data|ascii-charts|header-toggle|icon-generator|huggin-interface|insights)/.test(p) ||
      /^src\/js\/cheat-codes/.test(p) ||
      /^(about|history|insights|cheat-the-code|admin|aboutV2|index)\.html$/.test(basename(p)) ||
      /^gpt-j\.http$/.test(p),
  },
  {
    id: 'assets', label: '🖼️  Assets & Icons', relevance: 2,
    match: p =>
      /\.(svg|png|jpg|jpeg|ico|webp)$/.test(p) ||
      /generate-(icons|og-image)/.test(p) ||
      /favicon|apple-touch|android-chrome/.test(p),
  },
  {
    id: 'docs-archive', label: '📦 Docs — Archives', relevance: 1,
    match: p => /^docs\/archives\//.test(p),
  },
];

const UNCATEGORIZED = { id: 'uncategorized', label: '❓ Uncategorized', relevance: 3 };

// ── Scoring ───────────────────────────────────────────────────────────────────

function recency(mtimeMs) {
  const d = (NOW - mtimeMs) / MS_DAY;
  if (d <   7) return 10;
  if (d <  30) return  8;
  if (d <  90) return  5;
  if (d < 180) return  3;
  return 1;
}

function sizeScore(bytes) {
  if (bytes > 50_000) return 10;
  if (bytes > 20_000) return  8;
  if (bytes > 10_000) return  6;
  if (bytes >  3_000) return  4;
  if (bytes >    500) return  2;
  return 1;
}

const score = (t, r, s, c) => +(t * 0.40 + r * 0.25 + s * 0.15 + c * 0.20).toFixed(2);

// ── Reference graph ───────────────────────────────────────────────────────────
// Extract raw reference strings from a file based on its type.

const RE_JS_IMPORT   = /(?:import|export)[^'"]*['"]([^'"]+)['"]/g;
const RE_JS_REQUIRE  = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_MD_LINK     = /\[(?:[^\]]*)\]\(([^)#?]+)/g;
const RE_HTML_SRC    = /(?:src|href)\s*=\s*['"]([^'"]+)['"]/g;

function extractRefs(fullPath, rel) {
  let src;
  try { src = readFileSync(fullPath, 'utf8'); } catch { return []; }

  const ext   = extname(rel).toLowerCase();
  const refs  = [];
  const seen  = new Set();
  const add   = s => { if (s && !seen.has(s)) { seen.add(s); refs.push(s); } };

  if (['.js', '.ts', '.svelte', '.mjs', '.cjs'].includes(ext)) {
    for (const m of src.matchAll(RE_JS_IMPORT))  add(m[1]);
    for (const m of src.matchAll(RE_JS_REQUIRE)) add(m[1]);
  } else if (ext === '.md') {
    for (const m of src.matchAll(RE_MD_LINK)) add(m[1]);
  } else if (ext === '.html') {
    for (const m of src.matchAll(RE_HTML_SRC)) add(m[1]);
  }

  return refs.filter(r => r.startsWith('.') || r.startsWith('/'));
}

// Try to resolve a raw import string to a rel path that exists in fileSet.
const RESOLVE_EXTS = ['.js', '.ts', '.svelte', '.mjs', '.cjs', '.md', '.css', '/index.js', '/index.ts'];

function resolveRef(rawRef, fromFull, fileSet) {
  if (!rawRef.startsWith('.') && !rawRef.startsWith('/')) return null;

  const base = rawRef.startsWith('/')
    ? join(ROOT, rawRef)
    : resolve(dirname(fromFull), rawRef);

  // Exact match first
  const exact = relative(ROOT, base).replace(/\\/g, '/');
  if (fileSet.has(exact)) return exact;

  // Try appending known extensions
  for (const ext of RESOLVE_EXTS) {
    const candidate = relative(ROOT, base + ext).replace(/\\/g, '/');
    if (fileSet.has(candidate)) return candidate;
  }
  return null;
}

function buildReferenceGraph(allFiles) {
  const fileSet = new Set(allFiles.map(f => f.rel));
  // fanIn[rel]  = Set of files that reference rel
  // fanOut[rel] = Set of files that rel references
  const fanIn  = new Map(allFiles.map(f => [f.rel, new Set()]));
  const fanOut = new Map(allFiles.map(f => [f.rel, new Set()]));

  for (const file of allFiles) {
    const refs = extractRefs(file.full, file.rel);
    for (const raw of refs) {
      const target = resolveRef(raw, file.full, fileSet);
      if (target && target !== file.rel) {
        fanOut.get(file.rel)?.add(target);
        fanIn.get(target)?.add(file.rel);
      }
    }
  }
  return { fanIn, fanOut };
}

function connectednessScore(fanInCount, maxFanIn) {
  if (maxFanIn === 0) return 0;
  // Logarithmic scale so one highly-imported file doesn't flatten everything else
  return Math.min(10, Math.round((Math.log1p(fanInCount) / Math.log1p(maxFanIn)) * 10));
}

// ── Walker ────────────────────────────────────────────────────────────────────

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel  = relative(ROOT, full).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      if (SKIP_DIR_PREFIXES.some(pre => rel.startsWith(pre))) continue;
      yield* walk(full);
    } else {
      if (SKIP_FILE_NAMES.has(entry.name)) continue;
      const ext = extname(entry.name).toLowerCase();
      if (ext && !TEXT_EXTS.has(ext)) continue;
      yield { full, rel };
    }
  }
}

// ── Classify & collect ────────────────────────────────────────────────────────

const byTopic = new Map();
const all = [];

// First pass: collect files with stat
for (const { full, rel } of walk(ROOT)) {
  let stat;
  try { stat = statSync(full); } catch { continue; }
  all.push({ full, rel, size: stat.size, mtime: stat.mtimeMs });
}

// Second pass: build reference graph (needs full file list)
const { fanIn, fanOut } = buildReferenceGraph(all);
const maxFanIn = Math.max(...[...fanIn.values()].map(s => s.size), 1);

// Third pass: score
for (const entry of all) {
  const topic = TOPICS.find(t => t.match(entry.rel)) ?? UNCATEGORIZED;
  const r  = recency(entry.mtime);
  const s  = sizeScore(entry.size);
  const fi = fanIn.get(entry.rel)?.size ?? 0;
  const fo = fanOut.get(entry.rel)?.size ?? 0;
  const c  = connectednessScore(fi, maxFanIn);
  const sc = score(topic.relevance, r, s, c);

  Object.assign(entry, { topic, recency: r, sizeScore: s, fanIn: fi, fanOut: fo, connectedness: c, score: sc });

  if (!byTopic.has(topic.id)) byTopic.set(topic.id, { ...topic, files: [] });
  byTopic.get(topic.id).files.push(entry);
}

// ── JSON output ───────────────────────────────────────────────────────────────

if (IS_JSON) {
  const out = { generated: new Date().toISOString(), totalFiles: all.length, maxFanIn, topics: [] };
  for (const t of byTopic.values()) {
    const avg = +(t.files.reduce((s, f) => s + f.score, 0) / t.files.length).toFixed(2);
    out.topics.push({
      id: t.id, label: t.label, relevance: t.relevance,
      fileCount: t.files.length, avgScore: avg,
      files: t.files.map(({ full: _full, ...rest }) => rest), // omit absolute path
    });
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = b => b > 1_048_576 ? `${(b/1_048_576).toFixed(1)}MB`
                : b > 1_024    ? `${(b/1_024).toFixed(0)}KB`
                : `${b}B`;
const ago = ms => {
  const d = Math.floor((NOW - ms) / MS_DAY);
  return d === 0 ? 'today' : d === 1 ? '1d' : `${d}d`;
};
const bar = n => '█'.repeat(Math.max(1, Math.round(n)));

// Sort topics: archived last, rest by avg score desc
const sorted = [...byTopic.values()].sort((a, b) => {
  if (a.id === 'docs-archive') return 1;
  if (b.id === 'docs-archive') return -1;
  const avgA = a.files.reduce((s, f) => s + f.score, 0) / a.files.length;
  const avgB = b.files.reduce((s, f) => s + f.score, 0) / b.files.length;
  return avgB - avgA;
});

// ── Markdown output ───────────────────────────────────────────────────────────

if (IS_MD) {
  console.log(`# Repo Audit — Art of Intent\n\n_${new Date().toISOString().slice(0,10)} · ${all.length} files_\n`);
  console.log('## Topic Scores\n');
  console.log('| Topic | Files | Avg Score | Total Size |');
  console.log('|---|---|---|---|');
  for (const t of sorted) {
    const avg = (t.files.reduce((s, f) => s + f.score, 0) / t.files.length).toFixed(1);
    const total = t.files.reduce((s, f) => s + f.size, 0);
    console.log(`| ${t.label} | ${t.files.length} | ${avg} | ${fmt(total)} |`);
  }
  console.log('\n## Files by Topic\n');
  for (const t of sorted) {
    const files = [...t.files].sort((a, b) => b.score - a.score);
    console.log(`### ${t.label}\n`);
    console.log('| Score | Last modified | Size | File |');
    console.log('|---|---|---|---|');
    for (const f of files.slice(0, 15)) {
      console.log(`| ${f.score.toFixed(1)} | ${ago(f.mtime)} | ${fmt(f.size)} | \`${f.rel}\` |`);
    }
    if (files.length > 15) console.log(`\n_…${files.length - 15} more_`);
    console.log();
  }
  process.exit(0);
}

// ── Terminal output ───────────────────────────────────────────────────────────

const W = 72;
const rule  = (ch = '─') => ch.repeat(W);
const head  = s => `\n${rule('═')}\n  ${s}\n${rule('═')}`;
const sub   = s => `\n${s}\n${rule()}`;

console.log(head(`REPO AUDIT — Art of Intent   ${new Date().toISOString().slice(0,10)}   ${all.length} files`));

// ── Per-topic breakdown ────────────────────────────────────────────────────

for (const t of sorted) {
  const files = [...t.files].sort((a, b) => b.score - a.score);
  const avg   = (files.reduce((s, f) => s + f.score, 0) / files.length).toFixed(1);
  const total = fmt(files.reduce((s, f) => s + f.size, 0));
  const shown = files.slice(0, 8);

  console.log(sub(`${t.label}   ${files.length} files · ${total} · avg ${avg}`));
  //                score    age     size    ←N  →N  path
  console.log(`  ${'score'.padEnd(6)} ${'age'.padEnd(7)} ${'size'.padStart(6)}  ←in →out  file`);
  for (const f of shown) {
    const sc  = f.score.toFixed(1).padEnd(6);
    const age = ago(f.mtime).padEnd(7);
    const sz  = fmt(f.size).padStart(6);
    const fi  = String(f.fanIn).padStart(3);
    const fo  = String(f.fanOut).padStart(3);
    console.log(`  ${sc} ${age} ${sz}  ${fi} ${fo}   ${f.rel}`);
  }
  if (files.length > 8) console.log(`  … ${files.length - 8} more`);
}

// ── Flags ─────────────────────────────────────────────────────────────────────

console.log(head('FLAGS & RECOMMENDATIONS'));

// 1. Uncategorized
const uncat = all.filter(f => f.topic.id === 'uncategorized');
if (uncat.length) {
  console.log(sub(`⚠️  Uncategorized (${uncat.length}) — add a topic rule for these`));
  uncat.forEach(f => console.log(`  ${f.rel}`));
} else {
  console.log('\n✅  No uncategorized files.');
}

// 2. Stale docs outside archives (> 90d, > 3KB, docs/ prefix, not archive)
const staleDocs = all.filter(f =>
  f.recency <= 3 &&
  f.size > 3_000 &&
  f.rel.startsWith('docs/') &&
  !f.rel.startsWith('docs/archives') &&
  !f.rel.includes('future-work') &&
  !f.rel.includes('README')
);
if (staleDocs.length) {
  console.log(sub(`🕰️  Stale docs outside archives (${staleDocs.length}) — consider archiving`));
  staleDocs.sort((a, b) => a.mtime - b.mtime)
    .forEach(f => console.log(`  ${ago(f.mtime).padEnd(8)}  ${fmt(f.size).padStart(6)}  ${f.rel}`));
}

// 3. Stale code (> 90d, > 5KB, not docs, not archives, not config, not legacy)
const staleCode = all.filter(f =>
  f.recency <= 3 &&
  f.size > 5_000 &&
  !f.rel.startsWith('docs/') &&
  !f.rel.startsWith('tests/') &&
  !['config', 'ci-cd', 'assets', 'docs-archive', 'legacy-src'].includes(f.topic.id)
);
if (staleCode.length) {
  console.log(sub(`🧊  Stale code (> 90d, > 5KB) — review for relevance`));
  staleCode.sort((a, b) => a.mtime - b.mtime)
    .forEach(f => console.log(`  ${ago(f.mtime).padEnd(8)}  ${fmt(f.size).padStart(6)}  ${f.rel}`));
}

// 4. Projects that may be done (docs/projects > 60d old)
const oldProjects = (byTopic.get('docs-projects')?.files ?? []).filter(f => f.recency <= 5);
if (oldProjects.length) {
  console.log(sub(`📋  Projects with no recent activity (consider archiving)`));
  oldProjects.sort((a, b) => a.mtime - b.mtime)
    .forEach(f => console.log(`  ${ago(f.mtime).padEnd(8)}  ${f.rel}`));
}

// 5. High-inertia files (fan-in >= 5) — load-bearing, never delete without a plan
const highInertia = all
  .filter(f => f.fanIn >= 5)
  .sort((a, b) => b.fanIn - a.fanIn);
if (highInertia.length) {
  console.log(sub(`⚓  High-inertia files (fan-in ≥ 5) — touch with care`));
  console.log(`  ${'←in'.padEnd(5)} ${'→out'.padEnd(5)} file`);
  highInertia.forEach(f =>
    console.log(`  ${String(f.fanIn).padEnd(5)} ${String(f.fanOut).padEnd(5)} ${f.rel}`)
  );
}

// 5b. Orphaned code files (fan-in = 0, fan-out = 0, not config/docs/assets)
const SKIP_ORPHAN_TOPICS = new Set(['config', 'docs-archive', 'docs-root', 'assets', 'ci-cd', 'docs-projects', 'docs-areas', 'docs-resources', 'uncategorized']);
const orphans = all.filter(f =>
  f.fanIn === 0 &&
  f.fanOut === 0 &&
  !SKIP_ORPHAN_TOPICS.has(f.topic.id) &&
  ['.js', '.ts', '.svelte'].includes(extname(f.rel))
);
if (orphans.length) {
  console.log(sub(`🏝️  Orphaned code (no imports in or out) — possibly dead`));
  orphans.forEach(f => console.log(`  ${fmt(f.size).padStart(6)}  ${f.rel}`));
}

// 5c. High fan-out (depends on many things) with low fan-in (nothing depends on it)
const highCoupling = all.filter(f =>
  f.fanOut >= 5 &&
  f.fanIn === 0 &&
  ['.js', '.ts', '.svelte'].includes(extname(f.rel))
);
if (highCoupling.length) {
  console.log(sub(`🕸️  High coupling, no dependents (fan-out ≥ 5, fan-in = 0)`));
  highCoupling.sort((a, b) => b.fanOut - a.fanOut)
    .forEach(f => console.log(`  ${String(f.fanOut).padEnd(4)} →out   ${f.rel}`));
}

// 6. High-relevance topics with very few test files
console.log(sub('🧪  Test coverage by topic'));
const testRels = (byTopic.get('tests')?.files ?? []).map(f => f.rel);
const needCoverage = sorted.filter(t => t.relevance >= 7 && t.id !== 'tests' && t.id !== 'docs-archive');
for (const t of needCoverage) {
  const hits = testRels.filter(tr =>
    t.files.some(f => {
      const stem = f.rel.replace(/.*\//, '').replace(/\.\w+$/, '');
      return tr.includes(stem) || tr.includes(t.id.split('-')[0]);
    })
  );
  const icon = hits.length > 0 ? '✅' : '❌';
  console.log(`  ${icon}  ${t.label.padEnd(28)} ${hits.length} matching test file(s)`);
}

// 6. Archive bloat check
const archiveCount = byTopic.get('docs-archive')?.files.length ?? 0;
const activeDocCount = (byTopic.get('docs-projects')?.files.length ?? 0)
                     + (byTopic.get('docs-areas')?.files.length ?? 0)
                     + (byTopic.get('docs-resources')?.files.length ?? 0);
const ratio = archiveCount / Math.max(1, activeDocCount);
console.log(sub('📦  PARA doc ratio'));
console.log(`  Active docs  ${activeDocCount}  (projects + areas + resources)`);
console.log(`  Archive docs ${archiveCount}`);
console.log(`  Ratio        ${ratio.toFixed(1)}x  ${ratio > 2 ? '⚠️  archives are > 2× active — prune?' : '✅'}`);

console.log('\n' + rule() + '\n');
