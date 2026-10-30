import { cp, mkdir, rm, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'www');

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const item of ['index.html', 'src', 'manifest.webmanifest', 'service-worker.js', 'etahlil-pembagian-halaman-dzikir.json']) {
  const source = path.join(root, item);
  if (await exists(source)) {
    await cp(source, path.join(out, item), { recursive: true });
  }
}

// Keep public assets and root-level assets usable by the existing absolute /assets/... paths.
for (const sourceName of ['public/assets', 'assets']) {
  const source = path.join(root, sourceName);
  if (await exists(source)) {
    await mkdir(path.join(out, 'assets'), { recursive: true });
    await cp(source, path.join(out, 'assets'), { recursive: true, force: true });
  }
}

console.log('e-Moeslife web assets prepared in ./www');
