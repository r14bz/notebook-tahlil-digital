import test from 'node:test';
import assert from 'node:assert/strict';

import { getReadingGroup } from '../src/features/reader/navigation.js';
import { filterReadingSections } from '../src/features/home/search.js';
import { findCollectionStart } from '../src/features/collections/navigation.js';
import {
  readPreference,
  writePreference,
  readJsonPreference,
  writeJsonPreference
} from '../src/services/storage/preferences.js';

test('reader navigation keeps Quran surahs and collections in separate groups', () => {
  assert.equal(getReadingGroup({ quranSurah: 36 }), 'quran-36');
  assert.equal(getReadingGroup({ quranSurah: 55 }), 'quran-55');
  assert.equal(getReadingGroup({ collection: 'dzikir' }), 'dzikir');
  assert.equal(getReadingGroup({}), 'tahlil');
  assert.equal(getReadingGroup(null), 'tahlil');
});

test('search filters by localized title and retains original indexes', () => {
  const sections = [
    { title: 'Pembukaan Tahlil' },
    { title: 'Surah Yasin', quranSurah: 36 },
    { title: 'Dzikir Pagi', collection: 'dzikir' }
  ];

  assert.deepEqual(
    filterReadingSections(sections, '  yAsIn  ').map(({ s, i }) => [s.title, i]),
    [['Surah Yasin', 1]]
  );
  assert.deepEqual(
    filterReadingSections(sections, '', section => section.collection === 'dzikir').map(({ i }) => i),
    [2]
  );
  assert.equal(filterReadingSections(sections, 'tidak ditemukan').length, 0);
});

test('collection shortcuts resolve the first matching section', () => {
  const sections = [
    { title: 'Tahlil awal' },
    { collection: 'dzikir' },
    { quranSurah: 36 },
    { quranSurah: 55 },
    { collection: 'dzikir' }
  ];

  assert.equal(findCollectionStart(sections, 'tahlil'), 0);
  assert.equal(findCollectionStart(sections, 'dzikir'), 1);
  assert.equal(findCollectionStart(sections, 'yasin'), 2);
  assert.equal(findCollectionStart(sections, 'rahman'), 3);
  assert.equal(findCollectionStart(sections, 'unknown'), -1);
});

test('preferences persist through localStorage using mapped keys', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value))
  };

  assert.equal(writePreference('page', 12), true);
  assert.equal(values.get('tahlil-page'), '12');
  assert.equal(readPreference('page'), '12');
  assert.equal(readPreference('missing-key', 'fallback'), 'fallback');
});

test('preferences use memory fallback when browser storage is unavailable', () => {
  const key = 'test-memory-fallback';
  globalThis.localStorage = {
    getItem() { throw new Error('storage blocked'); },
    setItem() { throw new Error('storage blocked'); }
  };

  assert.equal(writePreference(key, 'remembered'), false);
  assert.equal(readPreference(key), 'remembered');
  assert.equal(readPreference('never-written', 'safe-default'), 'safe-default');
});

test('JSON preferences return fallback for malformed JSON', () => {
  globalThis.localStorage = {
    getItem: () => '{broken',
    setItem() {}
  };

  assert.deepEqual(readJsonPreference('test-invalid-json', { safe: true }), { safe: true });
});

test('JSON preferences serialize and restore structured values', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value))
  };
  const layout = { 2: 'awal\\n[[HALAMAN BARU]]\\nlanjut' };

  assert.equal(writeJsonPreference('pageLayout', layout), true);
  assert.deepEqual(readJsonPreference('pageLayout'), layout);
});
