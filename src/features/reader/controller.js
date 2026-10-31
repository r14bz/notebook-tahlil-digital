/** Controller interaksi halaman pembaca: render, animasi, dan navigasi per kelompok. */
export function createReaderController({ getPages, getIndex, setIndex, $, writePreference, renderContents, getReadingGroup, getReadingGroupBounds, getPageProgress }) {
  let pageTurning = false;
  let queuedTurn = null;

  function paintPage(section) {
    const pages = getPages();
    const index = getIndex();
    $('pageTitle').textContent = section.title;
    $('arabicText').style.whiteSpace = 'pre-wrap';
    $('arabicText').textContent = section.text;
    $('arabicText').classList.toggle('quran-text', Boolean(section.quranSurah));
    const sectionFirst = pages.findIndex(page => getReadingGroup(page) === getReadingGroup(section));
    $('pageNumber').textContent = '— ' + String(index - sectionFirst + 1).padStart(2, '0') + ' —';
    renderContents();
  }

  function showPage(requestedIndex, animate = '') {
    const pages = getPages();
    let index = getIndex();
    if (!pages.length) return;
    if (pageTurning && animate) return;
    const target = Math.max(0, Math.min(requestedIndex, pages.length - 1));
    if (target === index && !animate && $('pageTitle').textContent === pages[target].title && $('arabicText').textContent === pages[target].text) return;
    index = target;
    setIndex(index);
    const paper = $('paper');
    const section = pages[index];
    paper.classList.remove('turn-next', 'turn-prev', 'turn-out-next', 'turn-out-prev', 'turn-in-next', 'turn-in-prev');
    const bounds = getReadingGroupBounds(pages, index);
    const progress = getPageProgress(index, bounds);
    $('prevBtn').disabled = index <= bounds.start;
    $('nextBtn').disabled = index >= bounds.end;
    document.querySelectorAll('.swipe-hint-left').forEach(button => { button.disabled = $('prevBtn').disabled; });
    document.querySelectorAll('.swipe-hint-right').forEach(button => { button.disabled = $('nextBtn').disabled; });
    $('progressText').textContent = progress.percent + '%';
    $('progressBar').style.width = progress.percent + '%';
    writePreference('page', index);

    if (!animate) {
      paintPage(section);
      return;
    }

    pageTurning = true;
    paper.style.transformOrigin = animate === 'turn-next' ? 'left center' : 'right center';
    paper.classList.add(animate === 'turn-next' ? 'turn-out-next' : 'turn-out-prev');
    window.setTimeout(() => {
      paintPage(section);
      paper.classList.remove('turn-out-next', 'turn-out-prev');
      paper.style.transformOrigin = animate === 'turn-next' ? 'right center' : 'left center';
      paper.classList.add(animate === 'turn-next' ? 'turn-in-next' : 'turn-in-prev');
      window.setTimeout(() => {
        paper.classList.remove('turn-in-next', 'turn-in-prev');
        paper.style.transformOrigin = 'left center';
        pageTurning = false;
        if (queuedTurn) {
          const queued = queuedTurn;
          queuedTurn = null;
          if (queued === 'next') next(); else prev();
        }
      }, 350);
    }, 175);
  }

  function next() {
    const pages = getPages();
    const index = getIndex();
    if (pageTurning) { queuedTurn = 'next'; return; }
    if (index >= pages.length - 1 || getReadingGroup(pages[index + 1]) !== getReadingGroup(pages[index])) return;
    showPage(index + 1, 'turn-next');
  }

  function prev() {
    const pages = getPages();
    const index = getIndex();
    if (pageTurning) { queuedTurn = 'prev'; return; }
    if (index <= 0 || getReadingGroup(pages[index - 1]) !== getReadingGroup(pages[index])) return;
    showPage(index - 1, 'turn-prev');
  }

  return { showPage, next, prev, isTurning: () => pageTurning };
}
