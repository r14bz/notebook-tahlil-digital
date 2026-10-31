import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'www');
const worker = await readFile(path.join(root, 'service-worker.js'), 'utf8');
const match = worker.match(/const CORE_ASSETS = \[([\s\S]*?)\];/);

if (!match) {
  throw new Error('Could not locate CORE_ASSETS in service-worker.js');
}

const assets = [...match[1].matchAll(/'([^']+)'/g)].map(([, asset]) => asset);
if (!assets.length) {
  throw new Error('CORE_ASSETS is empty; offline shell would have no precached files');
}

const missing = [];
for (const asset of assets) {
  const relative = asset.replace(/^\/+/, '');
  const target = path.join(output, relative);
  try {
    await access(target);
  } catch {
    missing.push(asset);
  }
}

if (missing.length) {
  console.error('Missing offline precache assets:');
  for (const asset of missing) console.error(\` - \${asset}\`);
  process.exitCode = 1;
} else {
  console.log(\`Verified all \${assets.length} service-worker precache assets in ./www\`);
}

const precached = new Set(assets);
const visitedModules = new Set();
const missingImports = [];

async function verifyImportedModules(asset) {
  if (visitedModules.has(asset)) return;
  visitedModules.add(asset);
  const relative = asset.replace(/^\/+/, '');
  const source = await readFile(path.join(output, relative), 'utf8');
  const imports = [...source.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map(([, specifier]) => specifier);

  for (const specifier of imports) {
    if (!specifier.startsWith('.')) continue;
    const importedPath = path.posix.resolve(path.posix.dirname(asset), specifier);
    const importedAsset = importedPath.startsWith('/') ? importedPath : '/' + importedPath;
    if (!precached.has(importedAsset)) missingImports.push({ importer: asset, imported: importedAsset });
    await verifyImportedModules(importedAsset);
  }
}

await verifyImportedModules('/src/app.js');

if (missingImports.length) {
  console.error('Local JavaScript modules imported by the app but missing from service-worker precache:');
  for (const item of missingImports) console.error(\` - \${item.importer} -> \${item.imported}\`);
  process.exitCode = 1;
} else {
  console.log(\`Verified all \${visitedModules.size} local JavaScript modules imported by the app are included in the offline precache\`);
}
