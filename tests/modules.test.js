import test from 'node:test';
import assert from 'node:assert/strict';

import { getReadingGroup } from '../src/features/reader/navigation.js';
import { getSwipeDirection } from '../src/features/reader/gestures.js';
import { getReadingGroupBounds, getPageProgress } from '../src/features/reader/page-state.js';
import { applyReaderTheme, applyReaderFontSize } from '../src/features/reader/appearance.js';
import { prepareReadingSections, completeSectionStarts } from '../src/features/reader/sections.js';
import { getReaderContentsGroups } from '../src/features/reader/contents.js';
import { createReaderController } from '../src/features/reader/controller.js';

import { buildQariAyahUrls, splitSpeechText, createReaderAudioController } from '../src/features/reader/audio.js';
import { applyDzikirOverrides, isValidManualDzikirLayout, loadOptionalReaderContent } from '../src/features/reader/content-loader.js';

import { filterReadingSections } from '../src/features/home/search.js';
import { findCollectionStart } from '../src/features/collections/navigation.js';
import {
  readPreference,
  writePreference,
  readJsonPreference,
  writeJsonPreference
} from '../src/services/storage/preferences.js';


test('audio helpers build complete qari ayah playlists for supported surahs', () => {
  const yasin = buildQariAyahUrls(36);
  const rahman = buildQariAyahUrls(55);
  assert.equal(yasin.length, 83);
  assert.equal(yasin[0], 'https://everyayah.com/data/Alafasy_128kbps/036001.mp3');
  assert.equal(yasin.at(-1), 'https://everyayah.com/data/Alafasy_128kbps/036083.mp3');
  assert.equal(rahman.length, 78);
  assert.equal(rahman.at(-1), 'https://everyayah.com/data/Alafasy_128kbps/055078.mp3');
  assert.deepEqual(buildQariAyahUrls(2), []);
  assert.deepEqual(buildQariAyahUrls(36, 'unknown'), []);
});

test('speech text is chunked at word boundaries without losing content', () => {
  const text = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ '.repeat(30);
  const chunks = splitSpeechText(text, 80);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(chunk => chunk.length <= 80));
  assert.equal(chunks.join(' '), text.trim());
  assert.deepEqual(splitSpeechText('   '), []);
});

test('reader audio controller sequences qari ayat and stops when changing surah', async () => {
  const handlers = {};
  const audio = {
    src: '',
    paused: true,
    addEventListener(name, callback) { handlers[name] = callback; },
    removeAttribute(name) { if (name === 'src') this.src = ''; },
    load() {},
    pause() { this.paused = true; },
    async play() { this.paused = false; }
  };
  const button = { disabled: true, title: '' };
  const status = { textContent: '' };
  const controller = createReaderAudioController({
    audioElement: audio,
    qariButton: button,
    statusElement: status
  });

  controller.update({ quranSurah: 36 });
  assert.equal(button.disabled, false);
  assert.equal(controller.playQari({ quranSurah: 36 }), true);
  assert.match(audio.src, /036001\.mp3$/);
  await handlers.ended();
  assert.match(audio.src, /036002\.mp3$/);

  controller.update({ quranSurah: 55 });
  assert.equal(audio.src, '');
  assert.equal(button.disabled, false);
  controller.update({ title: 'Tahlil' });
  assert.equal(button.disabled, true);
  assert.match(button.title, /Yasin dan Ar-Rahman/);
});

test('reader audio reports unavailable speech support without throwing', () => {
  const status = { textContent: '' };
  const controller = createReaderAudioController({ statusElement: status });
  assert.equal(controller.speak('بِسْمِ اللَّهِ'), false);
  assert.match(status.textContent, /TTS tidak tersedia/);
});

test('dzikir overrides apply only valid text entries to dzikir sections', () => {
  const sections = [
    { title: 'Tahlil' },
    { title: 'Dzikir 1', collection: 'dzikir', text: 'lama' },
    { title: 'Dzikir 2', collection: 'dzikir', text: 'lama 2' }
  ];
  const count = applyDzikirOverrides(sections, {
    sections: [{ text: 'baru' }, { text: '' }, { text: 'jangan diterapkan' }]
  });
  assert.equal(count, 1);
  assert.equal(sections[1].text, 'baru');
  assert.equal(sections[2].text, 'lama 2');
  assert.equal(applyDzikirOverrides(sections, {}), 0);
});

test('manual dzikir page layout accepts only the exported supported format', () => {
  assert.equal(isValidManualDzikirLayout({
    format: 'etahlil-dzikir-page-layout',
    scope: 'dzikir-ba-da-shalat',
    sectionIndex: 3,
    text: 'bagian 1\n[[HALAMAN BARU]]\nbagian 2'
  }), true);
  assert.equal(isValidManualDzikirLayout({ format: 'other', scope: 'dzikir-ba-da-shalat', sectionIndex: 3, text: 'x [[HALAMAN BARU]] y' }), false);
  assert.equal(isValidManualDzikirLayout({ format: 'etahlil-dzikir-page-layout', scope: 'dzikir-ba-da-shalat', sectionIndex: -1, text: 'x [[HALAMAN BARU]] y' }), false);
});

test('optional reader content loads independently and returns recoverable file errors', async () => {
  const sections = [{ title: 'Dzikir', collection: 'dzikir', text: 'lama' }];
  let savedLayout = null;
  const result = await loadOptionalReaderContent({
    sections,
    loadAdditionalSurahs: async () => {},
    fetchImpl: async url => {
      if (url.includes('dzikir-overrides')) return { ok: true, json: async () => ({ sections: [{ text: 'teks terbaru' }] }) };
      return { ok: false, status: 404 };
    },
    readPageLayout: () => ({}),
    writePageLayout: value => { savedLayout = value; }
  });
  assert.equal(result.overridesApplied, 1);
  assert.equal(sections[0].text, 'teks terbaru');
  assert.equal(result.pageLayoutApplied, false);
  assert.equal(result.errors.length, 1);
  assert.equal(savedLayout, null);
});

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

test('reader contents expose distinct collection groups with the correct section matching', () => {
  const groups = getReaderContentsGroups();
  assert.deepEqual(groups.map(group => group.title), ['Tahlil', 'Surah Yasin', 'Surah Ar-Rahman', 'Dzikir']);
  assert.equal(groups[0].matches({ title: 'Doa pembuka' }), true);
  assert.equal(groups[0].matches({ collection: 'dzikir' }), false);
  assert.equal(groups[1].matches({ quranSurah: 36 }), true);
  assert.equal(groups[2].matches({ quranSurah: 55 }), true);
  assert.equal(groups[3].matches({ collection: 'dzikir' }), true);
});

test('reader controller navigates inside groups, updates progress, and persists the active page', () => {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const classes = new Set();
  const makeNode = () => ({
    textContent: '', disabled: false, title: '', style: {},
    classList: {
      add(name) { classes.add(name); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
    }
  });
  const nodes = new Map(['pageTitle','arabicText','pageNumber','paper','prevBtn','nextBtn','progressText','progressBar'].map(id => [id, makeNode()]));
  const $ = id => nodes.get(id);
  const pages = [
    { title: 'Tahlil 1', text: 'نص ١' },
    { title: 'Tahlil 2', text: 'نص ٢' },
    { title: 'Yasin 1', text: 'نص ٣', quranSurah: 36 },
    { title: 'Yasin 2', text: 'نص ٤', quranSurah: 36 }
  ];
  let index = 0;
  const saved = [];
  let renders = 0;
  const changedPages = [];
  globalThis.document = { querySelectorAll: () => [] };
  globalThis.window = { setTimeout(callback) { callback(); return 1; } };

  try {
    const controller = createReaderController({
      getPages: () => pages,
      getIndex: () => index,
      setIndex: value => { index = value; },
      $,
      writePreference: (key, value) => saved.push([key, value]),
      renderContents: () => { renders += 1; },
      getReadingGroup,
      getReadingGroupBounds,
      getPageProgress,
      onPageChange: page => changedPages.push(page.title)
    });

    controller.showPage(0);
    assert.equal($('progressText').textContent, '50%');
    controller.next();
    assert.equal(index, 1);
    assert.equal($('pageTitle').textContent, 'Tahlil 2');
    controller.next();
    assert.equal(index, 1, 'navigation must not cross into the next reading group');
    controller.showPage(2);
    controller.prev();
    assert.equal(index, 2, 'previous must not cross into the previous reading group');
    controller.next();
    assert.equal(index, 3);
    assert.equal($('progressText').textContent, '100%');
    assert.deepEqual(saved.at(-1), ['page', 3]);
    assert.ok(renders >= 4);
    assert.ok(changedPages.includes('Yasin 2'));
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
});

test('manual page layout is persisted only when its target is a dzikir section', async () => {
  const sections = [
    { title: 'Tahlil' },
    { title: 'Dzikir Ba’da Shalat', collection: 'dzikir' }
  ];
  const makeFetch = sectionIndex => async url => ({
    ok: true,
    async json() {
      return url.includes('dzikir-overrides')
        ? { sections: [] }
        : {
            format: 'etahlil-dzikir-page-layout',
            scope: 'dzikir-ba-da-shalat',
            sectionIndex,
            text: 'awal\n[[HALAMAN BARU]]\nlanjutan'
          };
    }
  });
  let saved = null;
  const options = {
    sections,
    loadAdditionalSurahs: async () => {},
    readPageLayout: () => ({}),
    writePageLayout: value => { saved = value; }
  };

  await loadOptionalReaderContent({ ...options, fetchImpl: makeFetch(0) });
  assert.equal(saved, null, 'must not attach a dzikir layout to a Tahlil section');

  await loadOptionalReaderContent({ ...options, fetchImpl: makeFetch(1) });
  assert.equal(saved[1], 'awal\n[[HALAMAN BARU]]\nlanjutan');
});

test('Arabic TTS selects an installed Arabic voice and reads queued text chunks', () => {
  const previousDocument = globalThis.document;
  const voice = { lang: 'ar-SA', name: 'Arabic Voice', voiceURI: 'arabic-voice' };
  const spoken = [];
  const voiceSelect = {
    value: 'arabic-voice',
    hidden: false,
    options: [],
    replaceChildren() { this.options = []; },
    append(option) { this.options.push(option); },
    addEventListener() {}
  };
  class FakeUtterance {
    constructor(text) { this.text = text; }
  }
  const speechSynthesis = {
    getVoices: () => [voice, { lang: 'en-US', name: 'English', voiceURI: 'english' }],
    cancel() {},
    speak(utterance) {
      spoken.push(utterance);
      utterance.onend();
    }
  };
  const status = { textContent: '' };
  globalThis.document = { createElement: () => ({}) };

  try {
    const controller = createReaderAudioController({
      speechSynthesis,
      SpeechSynthesisUtterance: FakeUtterance,
      voiceSelect,
      statusElement: status
    });
    const longText = 'اللَّهُ الرَّحْمَٰنُ الرَّحِيمُ '.repeat(20);
    assert.equal(controller.speak(longText), true);
    assert.ok(spoken.length > 1);
    assert.ok(spoken.every(item => item.voice === voice && item.lang === 'ar-SA'));
    assert.match(status.textContent, /TTS selesai/);
    assert.equal(controller.getAvailableVoices().length, 1);
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }
});
