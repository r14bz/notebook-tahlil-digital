import { cp, mkdir, rm, access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const out = path.join(root, 'www');

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const item of ['index.html', 'src', 'data', 'manifest.webmanifest', 'service-worker.js', 'etahlil-pembagian-halaman-dzikir.json']) {
  const source = path.join(root, item);
  if (await exists(source)) {
    await cp(source, path.join(out, item), { recursive: true });
  }
}

// Bundle the native entry so Capacitor plugins resolve in Android's WebView.
await build({
  entryPoints: [path.join(root, 'src/native-entry.js')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['es2022'],
  outfile: path.join(out, 'app-native.js')
});

const mobileIndex = path.join(out, 'index.html');
const html = await readFile(mobileIndex, 'utf8');
await writeFile(mobileIndex, html.replace('./src/app.js', './app-native.js'));

// Keep public assets and root-level assets usable by the existing absolute /assets/... paths.
for (const sourceName of ['public/assets', 'assets']) {
  const source = path.join(root, sourceName);
  if (await exists(source)) {
    await mkdir(path.join(out, 'assets'), { recursive: true });
    await cp(source, path.join(out, 'assets'), { recursive: true, force: true });
  }
}

console.log('e-Moeslife native web assets bundled in ./www');
