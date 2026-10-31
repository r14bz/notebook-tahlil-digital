export const QARI_RECITERS = Object.freeze({
  alafasy: {
    id: 'alafasy',
    name: 'Mishary Rashid Alafasy',
    baseUrl: 'https://everyayah.com/data/Alafasy_128kbps/'
  }
});

export const QURAN_CHAPTERS = Object.freeze({
  36: { title: 'Surah Yasin', verses: 83 },
  55: { title: 'Surah Ar-Rahman', verses: 78 }
});

export function buildQariAyahUrls(surah, reciterId = 'alafasy') {
  const chapter = QURAN_CHAPTERS[surah];
  const reciter = QARI_RECITERS[reciterId];
  if (!chapter || !reciter) return [];
  const chapterNumber = String(surah).padStart(3, '0');
  return Array.from({ length: chapter.verses }, (_, index) => {
    const verseNumber = String(index + 1).padStart(3, '0');
    return reciter.baseUrl + chapterNumber + verseNumber + '.mp3';
  });
}

/** Pecah teks panjang pada batas kata agar tidak melewati batas utterance perangkat. */
export function splitSpeechText(text, maxLength = 180) {
  const words = String(text || '').trim().split(/\s+/u).filter(Boolean);
  const chunks = [];
  let chunk = '';
  for (const word of words) {
    const candidate = chunk ? chunk + ' ' + word : word;
    if (candidate.length > maxLength && chunk) {
      chunks.push(chunk);
      chunk = word;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

export function createReaderAudioController({
  speechSynthesis,
  SpeechSynthesisUtterance,
  audioElement,
  voiceSelect,
  voiceLabel,
  audioDescription,
  qariButton,
  statusElement
}) {
  let speechQueue = [];
  let speechActive = false;
  let qariUrls = [];
  let qariIndex = 0;
  let currentSurah = null;
  let selectedVoice = null;

  const setStatus = message => {
    if (statusElement) statusElement.textContent = message;
  };

  function availableArabicVoices() {
    if (!speechSynthesis?.getVoices) return [];
    return speechSynthesis.getVoices().filter(voice => /^ar(?:-|$)/i.test(voice.lang || ''));
  }

  function refreshVoices() {
    if (!voiceSelect) return;
    const previous = voiceSelect.value;
    const voices = availableArabicVoices();
    voiceSelect.replaceChildren();
    const automatic = document.createElement('option');
    automatic.value = '';
    automatic.textContent = 'Suara perangkat';
    voiceSelect.append(automatic);
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = voice.name + ' (' + voice.lang + ')';
      voiceSelect.append(option);
    });
    if (voices.some(voice => voice.voiceURI === previous)) voiceSelect.value = previous;
    voiceSelect.hidden = voices.length === 0;
    if (voiceLabel) voiceLabel.hidden = voices.length === 0;
    selectedVoice = voices.find(voice => voice.voiceURI === voiceSelect.value) || null;
  }

  function stopSpeech() {
    speechQueue = [];
    speechActive = false;
    speechSynthesis?.cancel?.();
  }

  function speakNext() {
    if (!speechQueue.length) {
      speechActive = false;
      setStatus('Pembacaan TTS selesai.');
      return;
    }
    const text = speechQueue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = speakNext;
    utterance.onerror = event => {
      speechActive = false;
      speechQueue = [];
      setStatus(event.error === 'canceled' ? 'TTS dihentikan.' : 'Suara TTS tidak dapat diputar pada perangkat ini.');
    };
    speechSynthesis.speak(utterance);
  }

  function speak(text) {
    if (!speechSynthesis || !SpeechSynthesisUtterance) {
      setStatus('TTS tidak tersedia. Periksa dukungan suara pada perangkat.');
      return false;
    }
    const chunks = splitSpeechText(text);
    if (!chunks.length) {
      setStatus('Tidak ada teks pada halaman ini untuk dibacakan.');
      return false;
    }
    stopSpeech();
    speechQueue = chunks;
    speechActive = true;
    setStatus('Membacakan teks Arab dengan suara perangkat…');
    speakNext();
    return true;
  }

  function stopQari() {
    if (audioElement) {
      audioElement.pause();
      audioElement.removeAttribute('src');
      audioElement.load();
    }
    qariUrls = [];
    qariIndex = 0;
    currentSurah = null;
  }

  async function playNextAyah() {
    if (qariIndex >= qariUrls.length) {
      stopQari();
      setStatus('Rekaman qari selesai.');
      return;
    }
    audioElement.src = qariUrls[qariIndex];
    try {
      await audioElement.play();
      setStatus('Memutar rekaman qari Mishary Rashid Alafasy · Ayat ' + (qariIndex + 1));
    } catch {
      setStatus('Audio qari tidak dapat diputar. Periksa koneksi internet lalu coba lagi.');
    }
  }

  function playQari(page) {
    const surah = Number(page?.quranSurah);
    if (!QURAN_CHAPTERS[surah] || !audioElement) {
      setStatus('Rekaman qari tersedia untuk Surah Yasin dan Ar-Rahman.');
      return false;
    }
    stopSpeech();
    stopQari();
    currentSurah = surah;
    qariUrls = buildQariAyahUrls(surah);
    qariIndex = 0;
    setStatus('Menyiapkan rekaman ' + QURAN_CHAPTERS[surah].title + '…');
    playNextAyah();
    return true;
  }

  if (audioElement) {
    audioElement.addEventListener('ended', () => {
      if (!qariUrls.length) return;
      qariIndex += 1;
      playNextAyah();
    });
    audioElement.addEventListener('error', () => {
      if (qariUrls.length) setStatus('Rekaman qari gagal dimuat. Audio memerlukan internet.');
    });
  }
  if (voiceSelect) {
    voiceSelect.addEventListener('change', () => {
      selectedVoice = availableArabicVoices().find(voice => voice.voiceURI === voiceSelect.value) || null;
    });
  }
  if (speechSynthesis?.addEventListener) speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  else if (speechSynthesis && 'onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = refreshVoices;
  refreshVoices();

  return {
    speak,
    playQari,
    stop() {
      stopSpeech();
      stopQari();
      setStatus('Audio dihentikan.');
    },
    update(page) {
      if (speechActive) stopSpeech();
      const nextSurah = Number(page?.quranSurah);
      if (currentSurah !== null && nextSurah !== currentSurah) stopQari();
      const supported = Boolean(QURAN_CHAPTERS[nextSurah]);
      if (audioElement) audioElement.hidden = !supported;
      if (audioDescription) audioDescription.textContent = supported
        ? 'Rekaman ' + QURAN_CHAPTERS[nextSurah].title + ' oleh Mishary Alafasy; audio memerlukan internet.'
        : 'TTS tersedia untuk teks Arab; rekaman qari tersedia pada Surah Yasin dan Ar-Rahman.';
      if (qariButton) {
        qariButton.disabled = !supported;
        qariButton.title = supported ? 'Putar rekaman qari untuk ' + QURAN_CHAPTERS[nextSurah].title : 'Rekaman qari tersedia untuk Surah Yasin dan Ar-Rahman';
      }
    },
    refreshVoices,
    getAvailableVoices: availableArabicVoices
  };
}
