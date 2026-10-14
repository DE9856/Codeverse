// =========================================================
// CODEVERSE — behaviour of the worst website ever.
// Tweak the numbers in CONFIG to make it more/less evil.
// =========================================================
const CONFIG = {
  doomSeconds: 90,           // global countdown from page open -> rickroll
  adSeconds: 8,              // how long every ad popup lasts (ad video is ~7s)
  nextSeconds: 10,           // after an ad, time you get to click a NEXT button
  missedNextFreezeSeconds: 3,// miss that window -> cursor frozen this long
  timeoutSeconds: 3,         // how long the cursor stays frozen
  timeoutChance: 0.004,      // chance per mouse-move event of getting a timeout
  timeoutCooldownMs: 12000,  // minimum gap between timeouts
  scrollDownMultiplier: 6,   // scrolling down = zoom
  scrollUpMultiplier: 0.01,  // scrolling up = PAINFUL (~1px per wheel notch)
  volMinSensitivity: 0.3,    // each grab of Spidey gets a random sensitivity...
  volMaxSensitivity: 3,      // ...somewhere between these two
  volReverseChance: 0.3,     // chance a grab has reversed controls
  volWebSnapChance: 0.12,    // chance letting go snaps the web -> volume 100%
  volSwingSeconds: 1.5,      // how long Spidey keeps swinging after you let go
  xDodgeRadius: 110,         // how close you can get to the ad's X before it runs
  rickrollSeconds: 15,       // how long the rickroll holds you hostage
  // text chaos (applied to every character on the page)
  chaosStyleChance: 0.35,    // chance a character gets a random bold/italic/underline/font
  chaosCaseChance: 0.3,      // chance a letter's case gets flipped
  chaosMissingChance: 0.04,  // chance a character just... isn't there
};

const $ = (id) => document.getElementById(id);

const cursorEl = $('fake-cursor');
const pages = document.querySelectorAll('.page');
const adOverlay = $('ad-overlay');
const adVideo = $('ad-video');
const adPlaceholder = $('ad-placeholder');
const adCount = $('ad-count');
const adClose = $('ad-close');
const nextTimerEl = $('next-timer');
const nextCountEl = $('next-count');
const doomCountEl = $('doom-count');
const timeoutOverlay = $('timeout-overlay');
const timeoutBox = $('timeout-box');
const rickEl = $('rickroll');
const rickVideo = $('rick-video');
const rickPlaceholder = $('rick-placeholder');
const rickHint = $('rick-hint');
const toastEl = $('toast');

let currentPage = 0;
let volume = 0.7;
let adOpen = false;
let frozen = false;
let rickrolled = false;
let lastTimeoutAt = Date.now();

// real mouse position vs. where we draw the cursor
let realX = -100, realY = -100;

// ---------------------------------------------------------
// Fake cursor + random "timeout" freezes
// ---------------------------------------------------------
function drawCursor(x, y) {
  cursorEl.style.transform = `translate(${x}px, ${y}px)`;
}

document.addEventListener('mousemove', (e) => {
  realX = e.clientX;
  realY = e.clientY;
  if (!frozen) drawCursor(realX, realY);
  if (adOpen) dodgeX();
  maybeTimeout();
});

function maybeTimeout() {
  if (frozen || adOpen || rickrolled) return;
  if (Date.now() - lastTimeoutAt < CONFIG.timeoutCooldownMs) return;
  if (Math.random() < CONFIG.timeoutChance) startTimeout();
}

let timeoutTimer = null;
function startTimeout(message = "😈 Uh Oh you're in timeout 😈", seconds = CONFIG.timeoutSeconds) {
  frozen = true;
  cursorEl.classList.add('frozen');
  timeoutBox.textContent = message;
  timeoutOverlay.classList.remove('hidden');

  // show the message right next to the frozen cursor (kept on-screen)
  const w = timeoutBox.offsetWidth || 420;
  const h = timeoutBox.offsetHeight || 80;
  timeoutBox.style.left = Math.min(Math.max(realX + 30, 10), window.innerWidth - w - 10) + 'px';
  timeoutBox.style.top = Math.min(Math.max(realY - 20, 10), window.innerHeight - h - 10) + 'px';

  clearTimeout(timeoutTimer); // a new freeze restarts the clock
  timeoutTimer = setTimeout(endTimeout, seconds * 1000);
}

function endTimeout() {
  frozen = false;
  lastTimeoutAt = Date.now();
  cursorEl.classList.remove('frozen');
  timeoutOverlay.classList.add('hidden');
  drawCursor(realX, realY); // cursor teleports to wherever the mouse actually went
}

// ---------------------------------------------------------
// Scrolling: down is turbo, up is a snail
// ---------------------------------------------------------
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (frozen || rickrolled || adOpen) return;
  let dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 40;                       // lines -> px
  else if (e.deltaMode === 2) dy *= window.innerHeight;  // pages -> px
  const mult = dy > 0 ? CONFIG.scrollDownMultiplier : CONFIG.scrollUpMultiplier;
  slowScroll(dy * mult);
}, { passive: false });

// browsers ignore sub-pixel scrolls, so collect the fractions until they add up to a whole pixel
let scrollRemainder = 0;
function slowScroll(px) {
  scrollRemainder += px;
  const whole = Math.trunc(scrollRemainder);
  if (whole !== 0) {
    window.scrollBy(0, whole);
    scrollRemainder -= whole;
  }
}

// same treatment for keyboard scrolling
window.addEventListener('keydown', (e) => {
  if (frozen || rickrolled || adOpen) { e.preventDefault(); return; }
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
  const step = { ArrowDown: 40, ArrowUp: -40, PageDown: 400, PageUp: -400, ' ': 400 }[e.key];
  if (step === undefined) return;
  e.preventDefault();
  const mult = step > 0 ? CONFIG.scrollDownMultiplier : CONFIG.scrollUpMultiplier;
  slowScroll(step * mult);
});

// ---------------------------------------------------------
// Volume: Spider-Man hangs on a vertical web. Swing him left/right.
// Left = quiet, right = loud.
// ---------------------------------------------------------
const volPanel = $('vol-panel');
const volPendulum = $('vol-pendulum');
const volValue = $('vol-value');
const SWING_DEG = 35; // max swing each way
let volDragging = false, volStartX = 0, volStartVol = 0;
let volSensitivity = 1, volReversed = false, swingRaf = null;

function setVolume(v) {
  volume = Math.min(1, Math.max(0, v));
  const pct = Math.round(volume * 100);
  // negative rotation swings the bottom (Spidey) to the right
  volPendulum.style.transform = `rotate(${-(volume - 0.5) * 2 * SWING_DEG}deg)`;
  volValue.textContent = pct === 100 ? '100% THWIP!' : pct + '%';
  adVideo.volume = volume;
  bgAudio.volume = volume;
}

// ---------------------------------------------------------
// Background audio: the worst sound ever, on loop, forever.
// Browsers block sound until the first click/keypress, so we start it then.
// ---------------------------------------------------------
const bgAudio = $('bg-audio');
function startBgAudio() {
  if (rickrolled) return;
  bgAudio.play().then(() => {
    ['pointerdown', 'keydown'].forEach((ev) => document.removeEventListener(ev, startBgAudio, true));
  }).catch(() => {});
}
startBgAudio(); // works immediately if the browser allows autoplay
['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, startBgAudio, true));

setVolume(volume);

volPanel.addEventListener('pointerdown', (e) => {
  if (frozen) return;
  cancelAnimationFrame(swingRaf);
  volDragging = true;
  volStartX = e.clientX;
  volStartVol = volume;
  // every grab gets a random sensitivity, and sometimes the controls flip
  volSensitivity = CONFIG.volMinSensitivity + Math.random() * (CONFIG.volMaxSensitivity - CONFIG.volMinSensitivity);
  volReversed = Math.random() < CONFIG.volReverseChance;
  if (volReversed) toast('🕷️ SPIDEY-SENSE TINGLING: CONTROLS REVERSED 🕷️');
  volPanel.setPointerCapture(e.pointerId);
});
volPanel.addEventListener('pointermove', (e) => {
  if (!volDragging || frozen) return;
  // vertical movement does nothing. only swinging counts.
  const dx = (e.clientX - volStartX) * (volReversed ? -1 : 1) * volSensitivity;
  setVolume(volStartVol + dx / 200);
});
['pointerup', 'pointercancel'].forEach((ev) =>
  volPanel.addEventListener(ev, () => {
    if (!volDragging) return;
    volDragging = false;
    if (Math.random() < CONFIG.volWebSnapChance) {
      setVolume(1);
      toast('🕸️ WEB SNAPPED! VOLUME 100% 🕸️');
    } else {
      swingAround(volume);
    }
  })
);

// when you let go, Spidey keeps swinging (and the volume swings with him)
// before slowly settling where you left him
function swingAround(target) {
  cancelAnimationFrame(swingRaf);
  const amp = (0.2 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1);
  const start = performance.now();
  const step = (now) => {
    const t = (now - start) / 1000;
    const decay = Math.exp(-t / CONFIG.volSwingSeconds);
    setVolume(target + amp * decay * Math.cos(2 * Math.PI * t / 0.9));
    if (decay > 0.02) swingRaf = requestAnimationFrame(step);
    else setVolume(target);
  };
  swingRaf = requestAnimationFrame(step);
}

// ---------------------------------------------------------
// Pages / button actions
// ---------------------------------------------------------
function showPage(i) {
  currentPage = (i + pages.length) % pages.length;
  pages.forEach((p, idx) => p.classList.toggle('active', idx === currentPage));
  window.scrollTo(0, 0);
}

function toast(msg, ms = 2000) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.add('hidden'), ms);
}

function doAction(btn) {
  const action = btn.dataset.action;
  switch (action) {
    case 'next': showPage(currentPage + 1); break;
    case 'prev': showPage(currentPage - 1); break;
    case 'goto': showPage(Number(btn.dataset.target)); break;
    case 'finish':
      toast('🎉 REGISTERED!!! 🎉 (now do it again)');
      showPage(0);
      break;
    case 'cookie':
      // the banner just moves. it never leaves.
      $('cookie-banner').classList.toggle('flip');
      break;
    default:
      toast('nothing happened. as promised.');
  }
}

// EVERY button click opens an ad first. The button's real action runs after.
document.addEventListener('click', (e) => {
  if (rickrolled) return;
  const btn = e.target.closest('button');
  if (!btn || btn.hasAttribute('data-noad')) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (adOpen || frozen) return;

  const isNext = btn.dataset.action === 'next' || btn.dataset.action === 'finish';
  if (isNext) clearNextTimer();   // made it in time!
  else pauseNextTimer();          // other buttons don't save you, the clock just pauses for the ad

  openAd(() => {
    doAction(btn);
    startNextTimer();
  });
}, true);

// ---------------------------------------------------------
// The 10-second "click NEXT or get rickrolled" timer
// ---------------------------------------------------------
let nextRemaining = null;
let nextInterval = null;

function startNextTimer() {
  if (rickrolled) return;
  if (nextRemaining === null) nextRemaining = CONFIG.nextSeconds;
  clearInterval(nextInterval);
  nextCountEl.textContent = nextRemaining;
  nextTimerEl.classList.remove('hidden');
  nextInterval = setInterval(() => {
    nextRemaining--;
    nextCountEl.textContent = Math.max(nextRemaining, 0);
    if (nextRemaining <= 0) {
      clearNextTimer();
      if (!rickrolled) startTimeout('😱 Oh no, you missed the timer! No movement for you 😱', CONFIG.missedNextFreezeSeconds);
    }
  }, 1000);
}
function pauseNextTimer() { clearInterval(nextInterval); }
function clearNextTimer() {
  clearInterval(nextInterval);
  nextRemaining = null;
  nextTimerEl.classList.add('hidden');
}

// ---------------------------------------------------------
// Ad popup (5 seconds, with a very shy X button)
// ---------------------------------------------------------
let adInterval = null;
let adDoneCallback = null;

adVideo.addEventListener('error', () => {
  adVideo.classList.add('hidden');
  adPlaceholder.classList.remove('hidden');
});

function openAd(onDone) {
  adOpen = true;
  adDoneCallback = onDone;
  adOverlay.classList.remove('hidden');
  moveX(true);

  if (!adVideo.error) {
    adVideo.currentTime = 0;
    adVideo.volume = volume;
    adVideo.play().catch(() => {});
  }

  let left = CONFIG.adSeconds;
  adCount.textContent = left;
  clearInterval(adInterval);
  adInterval = setInterval(() => {
    left--;
    adCount.textContent = Math.max(left, 0);
    if (left <= 0) closeAd();
  }, 1000);
}

function closeAd() {
  if (!adOpen) return;
  clearInterval(adInterval);
  adVideo.pause();
  adOverlay.classList.add('hidden');
  adOpen = false;
  const cb = adDoneCallback;
  adDoneCallback = null;
  if (cb && !rickrolled) cb();
}

// If someone somehow catches it (e.g. keyboard), fine, it closes.
adClose.addEventListener('click', closeAd);

function moveX(initial) {
  const size = 48, pad = 10;
  let x, y, tries = 0;
  do {
    x = pad + Math.random() * (window.innerWidth - size - pad * 2);
    y = pad + Math.random() * (window.innerHeight - size - pad * 2);
    tries++;
  } while (!initial && Math.hypot(x + size / 2 - realX, y + size / 2 - realY) < CONFIG.xDodgeRadius * 2.5 && tries < 30);
  adClose.style.left = x + 'px';
  adClose.style.top = y + 'px';
}

function dodgeX() {
  const r = adClose.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  if (Math.hypot(cx - realX, cy - realY) < CONFIG.xDodgeRadius) moveX(false);
}

// ---------------------------------------------------------
// The doom countdown + RICKROLL
// ---------------------------------------------------------
let doomLeft = CONFIG.doomSeconds;
let doomInterval = null;
function startDoom() {
  doomCountEl.textContent = doomLeft;
  doomInterval = setInterval(() => {
    doomLeft--;
    doomCountEl.textContent = Math.max(doomLeft, 0);
    if (doomLeft <= 0) rickroll();
  }, 1000);
}
startDoom();

const rickCountEl = $('rick-count');
let rickEscapeInterval = null;

rickVideo.addEventListener('error', () => {
  rickVideo.classList.add('hidden');
  rickPlaceholder.classList.remove('hidden');
});

function rickroll() {
  if (rickrolled) return;
  rickrolled = true;

  clearInterval(doomInterval);
  clearNextTimer();
  clearInterval(adInterval);
  adDoneCallback = null;
  adVideo.pause();
  bgAudio.pause(); // let Rick have the stage
  adOverlay.classList.add('hidden');
  timeoutOverlay.classList.add('hidden');
  nextTimerEl.classList.add('hidden');
  frozen = false;
  adOpen = false;
  cursorEl.classList.remove('frozen');

  rickEl.classList.remove('hidden');

  // you're free to go after a while
  let escapeLeft = CONFIG.rickrollSeconds;
  rickCountEl.textContent = escapeLeft;
  clearInterval(rickEscapeInterval);
  rickEscapeInterval = setInterval(() => {
    escapeLeft--;
    rickCountEl.textContent = Math.max(escapeLeft, 0);
    if (escapeLeft <= 0) endRickroll();
  }, 1000);

  if (rickVideo.error) return; // placeholder is showing

  rickVideo.currentTime = 0;
  rickVideo.volume = 1; // your volume setting does not apply here. sorry.
  rickVideo.muted = false;
  rickVideo.play().catch(() => {
    // browser blocked sound (user never clicked anything) -> play muted, ask for a click
    rickVideo.muted = true;
    rickVideo.play().catch(() => {});
    rickHint.classList.remove('hidden');
  });
}

function endRickroll() {
  clearInterval(rickEscapeInterval);
  rickVideo.pause();
  rickEl.classList.add('hidden');
  rickHint.classList.add('hidden');
  rickrolled = false;
  bgAudio.play().catch(() => {}); // the worst sound ever is back, did you miss it
  // and the countdown starts all over again. enjoy.
  doomLeft = CONFIG.doomSeconds;
  startDoom();
  toast('welcome back 🙂');
}

rickEl.addEventListener('click', () => {
  rickVideo.muted = false;
  rickVideo.play().catch(() => {});
  rickHint.classList.add('hidden');
});

// ---------------------------------------------------------
// TEXT CHAOS: random fonts, bold, italic, underline, flipped case,
// and some characters just go missing. Runs once on page load.
// ---------------------------------------------------------
const CHAOS_FONTS = ['Times New Roman', 'Courier New', 'Papyrus', 'Impact', 'Georgia',
  'Brush Script MT', 'Comic Sans MS', 'Lucida Console', 'Trebuchet MS'];
const CHAOS_SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'SELECT', 'OPTION', 'TEXTAREA', 'INPUT', 'VIDEO', 'AUDIO']);
// timers/counters get rewritten constantly, and a few messages must stay readable
const CHAOS_SKIP_IDS = new Set(['timeout-box', 'toast', 'doom-count', 'next-count', 'ad-count',
  'vol-value', 'rick-count', 'ad-close']);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function chaosify(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
        if (CHAOS_SKIP_TAGS.has(el.tagName.toUpperCase()) || CHAOS_SKIP_IDS.has(el.id)) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(chaosifyNode);
}

function chaosifyNode(node) {
  const frag = document.createDocumentFragment();
  let plain = '';
  const flush = () => {
    if (plain) frag.appendChild(document.createTextNode(plain));
    plain = '';
  };

  for (let ch of node.nodeValue) {
    const isSpace = /\s/.test(ch);
    const isLetter = ch.toLowerCase() !== ch.toUpperCase();

    if (!isSpace && Math.random() < CONFIG.chaosMissingChance) continue; // poof
    if (isLetter && Math.random() < CONFIG.chaosCaseChance) {
      ch = ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase();
    }
    if (isSpace || Math.random() >= CONFIG.chaosStyleChance) { plain += ch; continue; }

    flush();
    const span = document.createElement('span');
    span.textContent = ch;
    const s = span.style;
    if (Math.random() < 0.4) s.fontWeight = '900';
    if (Math.random() < 0.4) s.fontStyle = 'italic';
    if (Math.random() < 0.3) s.textDecoration = 'underline';
    if (Math.random() < 0.5) s.fontFamily = `"${pick(CHAOS_FONTS)}"`;
    if (Math.random() < 0.2) s.fontSize = (0.8 + Math.random() * 0.6).toFixed(2) + 'em';
    frag.appendChild(span);
  }
  flush();
  node.replaceWith(frag);
}

chaosify(document.body);
