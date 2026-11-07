import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Versi aplikasi ditulis di tiga tempat. Test ini gagal bila salah satunya lupa diperbarui saat rilis.
test('app version stays in sync across package.json, update check, and the Android workflow', () => {
  const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const updateSource = readFileSync('src/services/app-update.js', 'utf8');
  const workflow = readFileSync('.github/workflows/build-android-apk.yml', 'utf8');

  const currentVersion = updateSource.match(/const CURRENT_VERSION = '([^']+)'/)?.[1];
  const versionName = workflow.match(/'versionName "([^"]+)"'/)?.[1];
  const versionCode = workflow.match(/"versionCode (\d+)"/)?.[1];
  const logged = workflow.match(/Android version set to versionCode (\d+) \/ versionName ([\d.]+)/);

  assert.equal(currentVersion, packageVersion, 'CURRENT_VERSION di src/services/app-update.js harus sama dengan package.json');
  assert.equal(versionName, packageVersion, 'versionName di build-android-apk.yml harus sama dengan package.json');
  assert.ok(Number(versionCode) >= 1, 'versionCode harus bilangan bulat positif dan naik setiap rilis');
  assert.deepEqual(logged?.slice(1), [versionCode, packageVersion], 'pesan log workflow harus sama dengan nilai yang ditetapkan');
});
