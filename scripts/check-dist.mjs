import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const base = '/quiet-room/';

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const htmlFiles = walk(dist).filter((path) => path.endsWith('.html'));
const failures = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const matches = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1]);

  for (const target of matches) {
    if (!target.startsWith(base)) continue;
    const clean = target.slice(base.length).split(/[?#]/)[0];
    if (!clean) continue;

    const candidate = clean.endsWith('/') ? join(dist, clean, 'index.html') : join(dist, clean);
    checked += 1;
    if (!existsSync(candidate)) failures.push(`${relative(dist, file)} -> ${target}`);
  }
}

if (failures.length) {
  console.error(`Broken internal targets (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS  checked ${checked} internal href/src targets across ${htmlFiles.length} HTML files`);
