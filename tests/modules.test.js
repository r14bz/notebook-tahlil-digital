import test from 'node:test';
import assert from 'node:assert/strict';

import { getReadingGroup } from '../src/features/reader/navigation.js';
import { getSwipeDirection } from '../src/features/reader/gestures.js';
import { getReadingGroupBounds, getPageProgress } from '../src/features/reader/page-state.js';
import { applyReaderTheme, applyReaderFontSize } from '../src/features/reader/appearance.js';
import { prepareReadingSections, completeSectionStarts } from '../src/features/reader/sections.js';
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

test('reader swipe gestures recognize horizontal navigation and reject accidental swipes', () => {
  assert.equal(getSwipeDirection({ dx: -80, dy: 10, duration: 300 }), 'next');
  assert.equal(getSwipeDirection({ dx: 80, dy: 10, duration: 300 }), 'prev');
  assert.equal(getSwipeDirection({ dx: -47, dy: 0, duration: 300 }), null);
  assert.equal(getSwipeDirection({ dx: -80, dy: 70, duration: 300 }), null);
  assert.equal(getSwipeDirection({ dx: -120, dy: 10, duration: 901 }), null);
  assert.equal(getSwipeDirection({ dx: Number.NaN, dy: 0, duration: 100 }), null);
});

test('reader page state calculates group boundaries and scoped progress', () => {
  const pages = [
    { title: 'Tahlil 1' },
    { title: 'Tahlil 2' },
    { quranSurah: 36, title: 'Yasin 1' },
    { quranSurah: 36, title: 'Yasin 2' },
    { quranSurah: 55, title: 'Ar-Rahman' }
  ];

  const bounds = getReadingGroupBounds(pages, 3);
  assert.deepEqual(bounds, { start: 2, end: 3 });
  assert.deepEqual(getPageProgress(3, bounds), { current: 2, total: 2, percent: 100 });
  assert.deepEqual(getReadingGroupBounds([], 0), { start: 0, end: -1 });
  assert.deepEqual(getPageProgress(0, { start: 0, end: -1 }), { current: 0, total: 0, percent: 0 });
});

test('reader appearance applies and persists only supported themes and font sizes', () => {
  const classes = new Set();
  const body = {
    classList: {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      add(name) { classes.add(name); }
    }
  };
  const icon = {}, label = {};
  const attributes = {};
  const button = {
    querySelector(selector) { return selector === '.header-icon' ? icon : label; },
    setAttribute(name, value) { attributes[name] = value; },
    title: ''
  };
  const arabicText = { classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } } };
  const control = {};
  const saved = new Map();
  const writePreference = (key, value) => saved.set(key, value);

  assert.equal(applyReaderTheme('dark', { body, button, writePreference }), 'dark');
  assert.equal(classes.has('theme-dark'), true);
  assert.equal(icon.textContent, '☀');
  assert.equal(attributes['aria-label'], 'Aktifkan mode terang');
  assert.equal(saved.get('theme'), 'dark');

  assert.equal(applyReaderTheme('unexpected', { body, button, writePreference }), 'light');
  assert.equal(classes.has('theme-dark'), false);
  assert.equal(icon.textContent, '☾');
  assert.equal(saved.get('theme'), 'light');

  assert.equal(applyReaderFontSize('large', { body, control, arabicText, writePreference }), 'large');
  assert.equal(control.value, 'large');
  assert.equal(classes.has('font-large'), true);
  assert.equal(classes.has('compact'), false);
  assert.equal(saved.get('fontSize'), 'large');

  assert.equal(applyReaderFontSize('small', { body, control, arabicText, writePreference }), 'small');
  assert.equal(classes.has('font-small'), true);
  assert.equal(classes.has('compact'), true);
  assert.equal(applyReaderFontSize('invalid', { body, control, arabicText, writePreference }), 'normal');
  assert.equal(control.value, 'normal');
  assert.equal(classes.has('font-normal'), true);
  assert.equal(classes.has('compact'), false);
  assert.equal(saved.get('fontSize'), 'normal');
});

test('reader section preparation preserves source indexes and authoritative manual dzikir layout', () => {
  const sections = [
    { title: 'Pembukaan' },
    { title: 'Dzikir pertama', collection: 'dzikir' },
    { title: 'Dzikir kedua', collection: 'dzikir' },
    { title: 'Surah Yasin', quranSurah: 36 }
  ];
  const prepared = prepareReadingSections(sections, { 1: 'bagian A\\n[[HALAMAN BARU]]\\nbagian B' });
  assert.deepEqual(prepared.map(section => section.originalIndex), [0, 1, 3]);
  assert.equal(prepared[1].pageLayoutText, 'bagian A\\n[[HALAMAN BARU]]\\nbagian B');
  assert.equal(prepared[1].title, 'Dzikir pertama');
  assert.equal(sections.length, 4);
  assert.equal(sections[1].pageLayoutText, undefined);
});

test('reader section starts fill grouped entries without changing known page indexes', () => {
  assert.deepEqual(completeSectionStarts([0, 2, undefined, 5, undefined], 5), [0, 2, 2, 5, 5]);
  assert.deepEqual(completeSectionStarts([], 3), [0, 0, 0]);
});
