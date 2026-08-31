import { readFileSync } from 'node:fs';
import { THEMES } from './build-themes.mjs';

/**
 * Resolves app/themes.css the way a browser would, for every combination of
 * theme x chosen mode x OS preference, and checks the result is the palette the
 * table says it should be.
 *
 * Theme CSS is exactly the kind of thing that looks right and cascades wrong:
 * three overlapping blocks per theme, decided by specificity and source order.
 * Reading it is not proof; this is.
 */

const css = readFileSync('app/themes.css', 'utf8');

/** Parse into ordered blocks: {selector, inMedia, decls, order}. */
function parseBlocks(text) {
  const blocks = [];
  let order = 0;
  const re = /(@media[^{]+\{)?\s*([^{}@]+?)\s*\{([^}]*)\}/g;

  // Track media nesting by scanning line-wise; simpler and sufficient for a
  // file we generate ourselves.
  let inMedia = false;
  let depth = 0;
  let selector = null;
  let buf = [];

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('/*') || line.startsWith('*') || line.startsWith('*/')) continue;

    if (line.startsWith('@media')) { inMedia = true; depth = 0; continue; }

    if (line.endsWith('{')) {
      selector = line.slice(0, -1).trim();
      buf = [];
      depth++;
      continue;
    }

    if (line === '}') {
      if (selector) {
        blocks.push({ selector, inMedia, decls: buf.slice(), order: order++ });
        selector = null;
        depth--;
        if (depth <= 0 && inMedia) { inMedia = false; depth = 0; }
      } else if (inMedia) {
        inMedia = false;
      }
      continue;
    }

    if (selector) buf.push(line);
  }
  void re;
  return blocks;
}

/** CSS specificity of a simple selector, good enough for what we generate. */
function specificity(sel) {
  const attrs = (sel.match(/\[[^\]]+\]/g) || []).length;
  const pseudoClasses = (sel.match(/:(root|not)\b/g) || []).length;
  return attrs + pseudoClasses;
}

/** Does this selector match an element with these attributes? */
function matches(sel, attrs) {
  // Every selector we generate is :root plus attribute clauses and :not()s.
  const nots = [...sel.matchAll(/:not\(\[([a-z-]+)=?'?([a-z-]*)'?\]\)/g)];
  for (const [, name, value] of nots) {
    const have = attrs[name];
    if (value === '') { if (have !== undefined) return false; }
    else if (have === value) return false;
  }

  const stripped = sel.replace(/:not\([^)]*\)/g, '');
  const clauses = [...stripped.matchAll(/\[([a-z-]+)='([a-z-]+)'\]/g)];
  for (const [, name, value] of clauses) {
    if (attrs[name] !== value) return false;
  }
  return true;
}

function resolve(blocks, attrs, osDark) {
  let winner = null;
  for (const b of blocks) {
    if (b.inMedia && !osDark) continue;
    for (const sel of b.selector.split(',').map((s) => s.trim())) {
      if (!matches(sel, attrs)) continue;
      const spec = specificity(sel);
      if (!winner || spec > winner.spec || (spec === winner.spec && b.order > winner.order)) {
        winner = { spec, order: b.order, decls: b.decls };
      }
    }
  }
  if (!winner) return null;
  const out = {};
  for (const d of winner.decls) {
    const m = d.match(/^--([a-z0-9-]+):\s*(.+);$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const blocks = parseBlocks(css).filter((b) => b.selector.startsWith(':root'));

let pass = 0;
let fail = 0;
const rows = [];

for (const [key, theme] of Object.entries(THEMES)) {
  for (const chosen of ['system', 'light', 'dark']) {
    for (const osDark of [false, true]) {
      const attrs = { 'data-theme': key };
      if (chosen !== 'system') attrs['data-mode'] = chosen;

      const expectDark = chosen === 'dark' || (chosen === 'system' && osDark);
      const expected = theme[expectDark ? 'dark' : 'light'].bg;
      const got = resolve(blocks, attrs, osDark);
      const ok = got && got.bg === expected;
      ok ? pass++ : fail++;
      rows.push(
        `  ${ok ? 'ok  ' : 'FAIL'} ${key.padEnd(8)} mode=${chosen.padEnd(6)} os=${(osDark ? 'dark' : 'light').padEnd(5)} -> ${got ? got.bg : 'no match'}${ok ? '' : '  expected ' + expected}`,
      );
    }
  }
}

// And the untouched case: no theme attribute at all (signed out).
for (const osDark of [false, true]) {
  const expected = THEMES.default[osDark ? 'dark' : 'light'].bg;
  const got = resolve(blocks, {}, osDark);
  const ok = got && got.bg === expected;
  ok ? pass++ : fail++;
  rows.push(
    `  ${ok ? 'ok  ' : 'FAIL'} ${'(none)'.padEnd(8)} mode=${'-'.padEnd(6)} os=${(osDark ? 'dark' : 'light').padEnd(5)} -> ${got ? got.bg : 'no match'}${ok ? '' : '  expected ' + expected}`,
  );
}

for (const r of rows) if (r.startsWith('  FAIL') || process.env.VERBOSE) console.log(r);
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
