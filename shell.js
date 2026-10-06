const QA = new URLSearchParams(location.search).has('test');
const STORY_KEY = QA ? 'voryki.qa.story.v3' : 'voryki.story.v3';
const SAVE_KEY = QA ? 'voryki.qa.save.v3' : 'voryki.save.v3';
const SETTINGS_KEY = QA ? 'voryki.qa.settings.v3' : 'voryki.settings.v3';
const $ = id => document.getElementById(id);
const pages = [
  {frame: 1, part: 1, total: 1, image: '01-earth-friends.png', location: 'TRÁI ĐẤT · CHIỀU MUỘN', alt: 'Bạn ngồi trò chuyện cùng người bạn nữ quay lưng và người bạn nam tóc trắng buộc cao.', text: 'Trên Trái Đất, bạn đang trò chuyện cùng hai người bạn thân.'},
  {frame: 2, part: 1, total: 2, image: '02-entity-and-rescue.png', location: 'KHE NỨT KHÔNG GIAN', alt: 'Một thực thể đen xuất hiện phía sau. Bạn đẩy hai người bạn ra xa cánh cổng.', text: 'Một thực thể không rõ danh tính xuất hiện, xé toạc không gian ngay sau lưng bạn.'},
  {frame: 2, part: 2, total: 2, image: '02-entity-and-rescue.png', location: 'KHE NỨT KHÔNG GIAN', alt: 'Bạn cứu hai người bạn và bị kéo về phía xoáy đen.', text: 'Bạn đẩy họ thoát khỏi vùng hút. Nhưng chính bạn bị kéo vào bóng tối.'},
  {frame: 3, part: 1, total: 1, image: '03-fall-between-worlds.png', location: 'GIỮA NHỮNG THẾ GIỚI', alt: 'Bạn rơi qua khoảng không giữa các thế giới.', text: 'Bạn rơi qua khoảng không giữa những thế giới—không biết mình sẽ đến đâu.'},
  {frame: 4, part: 1, total: 1, image: '04-unconscious-on-shore.png', location: 'MỘT BỜ SÔNG XA LẠ', alt: 'Bạn nằm bất tỉnh bên bờ sông, giữa cảnh vật và tàn tích xa lạ.', text: 'Cuối cùng, bạn rơi xuống một vùng đất xa lạ. Mọi thứ chìm vào im lặng.'},
  {frame: 5, part: 1, total: 1, image: '05-awakens-in-voryki.png', location: 'VORYKI · BÌNH MINH', alt: 'Bạn tỉnh dậy, chống tay ngồi nhìn thế giới xa lạ trước mắt.', text: 'Khi tỉnh lại, bạn đang ở Voryki—một thế giới chưa từng biết đến. Hãy đứng dậy và khám phá xung quanh.'}
];
let screen = 'home';
let page = 0;
let toastTimer;
let storyFinished = false;
let modalReturnFocus = null;
let lastAdvance = -Infinity;

function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key, value) { try { localStorage.setItem(key, value); } catch { toast('Trình duyệt chưa cho phép lưu tiến trình trên máy này.'); } }
function remove(key) { try { localStorage.removeItem(key); } catch {} }
function savedStoryPage() {
  try { const state = JSON.parse(read(STORY_KEY)); return Number.isInteger(state?.page) && state.page >= 0 && state.page < pages.length ? state.page : null; } catch { return null; }
}
function hasWorldSave() { const raw = read(SAVE_KEY); if (!raw) return false; try { return !!JSON.parse(raw); } catch { return false; } }
export function refreshContinue() {
  const world = hasWorldSave();
  const story = savedStoryPage() !== null;
  $('continueButton').disabled = !world && !story;
  $('continueDetail').textContent = world ? 'Trở về Voryki →' : story ? 'Tiếp đoạn mở đầu →' : 'Chưa có hành trình';
}
export function showScreen(name) {
  if (!['home', 'cinema', 'game'].includes(name)) return;
  screen = name;
  document.querySelectorAll('#app > .screen').forEach(el => { const active = el.id === name; el.classList.toggle('active', active); el.setAttribute('aria-hidden', String(!active)); el.inert = !active; });
  closeOverlay('settingsOverlay');
  closeOverlay('newGameOverlay');
  if (name === 'home') { refreshContinue(); $('playButton').focus({preventScroll:true}); }
  else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  window.dispatchEvent(new CustomEvent('voryki:screenchange', {detail: {screen:name}}));
}
export function toast(message) {
  $('shellToast').textContent = message;
  $('shellToast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('shellToast').hidden = true; }, 3200);
}
function renderStory() {
  const item = pages[page];
  const art = $('cinemaArt');
  const src = `assets/${item.image}`;
  if (art.getAttribute('src') !== src) {
    art.classList.remove('new-frame');
    art.src = src;
    void art.offsetWidth;
    art.classList.add('new-frame');
  }
  art.alt = item.alt;
  $('storyText').textContent = item.text;
  $('storyLocation').textContent = item.location;
  $('storyCount').textContent = `${page + 1} / ${pages.length}`;
  $('storyDots').innerHTML = Array.from({length:5}, (_, i) => `<span class="story-dot${i + 1 === item.frame ? ' active' : i + 1 < item.frame ? ' past' : ''}" aria-hidden="true"></span>`).join('');
  $('storyDots').setAttribute('aria-label', `Khung ${item.frame} trên 5, lời ${item.part} trên ${item.total}`);
  $('nextLabel').textContent = page === pages.length - 1 ? 'Khám phá' : 'Tiếp tục';
  $('storyNext').setAttribute('aria-label', page === pages.length - 1 ? 'Khám phá bản đồ khởi đầu' : 'Tiếp tục lời dẫn');
  write(STORY_KEY, JSON.stringify({page}));
}
function openStory(resume = false) {
  page = resume ? savedStoryPage() ?? 0 : 0;
  storyFinished = false;
  lastAdvance = performance.now();
  renderStory();
  showScreen('cinema');
}
function advanceStory() {
  if (screen !== 'cinema' || storyFinished || anyModal()) return;
  const now = performance.now();
  if (now - lastAdvance < 160) return;
  lastAdvance = now;
  if (page < pages.length - 1) { page++; renderStory(); }
  else {
    storyFinished = true;
    remove(STORY_KEY);
    showScreen('game');
    window.dispatchEvent(new CustomEvent('voryki:newgame'));
    refreshContinue();
  }
}
function requestNewGame() {
  if (hasWorldSave() || savedStoryPage() !== null) openOverlay('newGameOverlay', 'cancelNewGame');
  else openStory();
}
function anyModal() { return !$('settingsOverlay').hidden || !$('newGameOverlay').hidden; }
function openOverlay(id, focusId) {
  modalReturnFocus = document.activeElement;
  $(id).hidden = false;
  $(focusId).focus({preventScroll:true});
}
function closeOverlay(id) {
  if ($(id).hidden) return;
  $(id).hidden = true;
  if (modalReturnFocus?.isConnected && !modalReturnFocus.closest('[inert]')) modalReturnFocus.focus({preventScroll:true});
}
async function fullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { toast('Bạn có thể dùng F11 để mở toàn màn hình.'); }
}
$('playButton').addEventListener('click', requestNewGame);
$('continueButton').addEventListener('click', () => {
  if (hasWorldSave()) { showScreen('game'); window.dispatchEvent(new CustomEvent('voryki:continue')); }
  else if (savedStoryPage() !== null) openStory(true);
});
$('confirmNewGame').addEventListener('click', () => { remove(SAVE_KEY); remove(STORY_KEY); closeOverlay('newGameOverlay'); openStory(); });
$('cancelNewGame').addEventListener('click', () => closeOverlay('newGameOverlay'));
$('settingsButton').addEventListener('click', () => openOverlay('settingsOverlay', 'fullscreenButton'));
$('closeSettings').addEventListener('click', () => closeOverlay('settingsOverlay'));
$('fullscreenButton').addEventListener('click', fullscreen);
$('motionToggle').addEventListener('change', () => {
  document.body.classList.toggle('motion-enabled', $('motionToggle').checked);
  write(SETTINGS_KEY, JSON.stringify({motion:$('motionToggle').checked}));
});
$('storyHome').addEventListener('click', event => { event.stopPropagation(); showScreen('home'); });
$('cinema').addEventListener('click', advanceStory);
window.addEventListener('voryki:home', () => showScreen('home'));
window.addEventListener('storage', refreshContinue);
document.addEventListener('keydown', event => {
  if (anyModal()) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeOverlay('settingsOverlay'); closeOverlay('newGameOverlay'); }
    else if (event.key === 'Tab') {
      const modal = !$('settingsOverlay').hidden ? $('settingsOverlay') : $('newGameOverlay');
      const focusable = Array.from(modal.querySelectorAll('button,input')).filter(el => !el.disabled);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    return;
  }
  if (screen === 'cinema') {
    if (event.key === 'Enter' || event.code === 'Space') { event.preventDefault(); event.stopImmediatePropagation(); if (!event.repeat) advanceStory(); }
    else if (event.key === 'Escape') { event.preventDefault(); showScreen('home'); }
    return;
  }
  if (screen === 'home') {
    if (event.code === 'KeyF' && !event.repeat) { event.preventDefault(); fullscreen(); }
    else if (event.key === 'Enter' && !event.repeat && !(document.activeElement instanceof HTMLButtonElement)) { event.preventDefault(); requestNewGame(); }
  }
}, true);

try { const settings = JSON.parse(read(SETTINGS_KEY)); $('motionToggle').checked = settings?.motion !== false && !matchMedia('(prefers-reduced-motion: reduce)').matches; } catch {}
document.body.classList.toggle('motion-enabled', $('motionToggle').checked);
for (const file of new Set(pages.map(item => item.image))) { const image = new Image(); image.src = `assets/${file}`; }
window.VorykiShell = {showScreen, toast, refreshContinue, get currentScreen() { return screen; }};
showScreen('home');
