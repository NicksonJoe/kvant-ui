// Writes every artefact generated from the DTCG files. Run from the repo root: pnpm generate (tokens, then the registry).
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildTokensCss } from './css.ts';
import { ACCENTS, loadTokens } from './dtcg.ts';
import { buildDart, buildPhp } from './native.ts';
import { buildTailwindCss } from './tailwind.ts';

const sets = loadTokens();
const styles = new URL('../../registry/styles/', import.meta.url);
writeFileSync(new URL('tokens.css', styles), buildTokensCss(sets));
writeFileSync(new URL('tailwind.css', styles), buildTailwindCss(sets));

const dist = new URL('../dist/', import.meta.url);
mkdirSync(new URL('flutter/', dist), { recursive: true });
mkdirSync(new URL('filament/', dist), { recursive: true });
for (const accent of ACCENTS) {
  writeFileSync(new URL(`flutter/kvant_${accent}.dart`, dist), buildDart(sets, accent));
  writeFileSync(new URL(`filament/kvant-${accent}.php`, dist), buildPhp(sets, accent));
}
