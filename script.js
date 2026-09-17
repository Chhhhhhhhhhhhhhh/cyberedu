// ============================================================
// STATE & PROGRESS
// ============================================================
let userProgress = defaultProgress();
const PROGRESS_KEY = 'cyberedu_v2_progress';

function defaultProgress() {
  return {
    agentName: 'OPERATIVE #1337',
    completedSections: [],
    ctfSolved: [],
    moduleProgress: {},
    timeline: [],
    streak: 0,
    lastVisit: '',
    unlockedBadges: [],
    commandCount: 0
  };
}

function recordActiveDay() {
  const today = new Date().toISOString().split('T')[0];
  if (!userProgress.streak || userProgress.streak < 1) {
    userProgress.streak = 1;
    userProgress.lastVisit = today;
  } else if (today !== userProgress.lastVisit) {
    const prev = new Date(userProgress.lastVisit);
    const cur = new Date(today);
    const diffDays = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      userProgress.streak++;
    } else if (diffDays > 1) {
      userProgress.streak = 1;
    }
    userProgress.lastVisit = today;
  }
}

function initProgress() {
  if (typeof localStorage === 'undefined' || typeof fetch === 'undefined') return;
  let local = null;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) local = JSON.parse(raw);
  } catch(e) {
    console.warn('Malformed local progress, falling back:', e);
  }
  fetch('/api/progress').then(r => r.json()).then(server => {
    if (server && server.completedSections) {
      userProgress = Object.assign(defaultProgress(), server);
    } else if (local) {
      userProgress = Object.assign(defaultProgress(), local);
    } else {
      userProgress = defaultProgress();
    }
    // Ensure critical array properties are actually arrays
    ['completedSections','ctfSolved','timeline','unlockedBadges'].forEach(k => {
      if (!Array.isArray(userProgress[k])) userProgress[k] = [];
    });
    if (typeof userProgress.streak !== 'number') userProgress.streak = 0;
    if (typeof userProgress.commandCount !== 'number') userProgress.commandCount = 0;
    if (typeof userProgress.agentName !== 'string' || !userProgress.agentName) userProgress.agentName = 'OPERATIVE #1337';
    if (!userProgress.moduleProgress) userProgress.moduleProgress = {};
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(userProgress));
    recalcModuleProgress();
    updateStatusBar();
    updateSidebar();
  }).catch(() => {
    userProgress = local ? Object.assign(defaultProgress(), local) : defaultProgress();
    ['completedSections','ctfSolved','timeline','unlockedBadges'].forEach(k => {
      if (!Array.isArray(userProgress[k])) userProgress[k] = [];
    });
    if (typeof userProgress.streak !== 'number') userProgress.streak = 0;
    if (typeof userProgress.commandCount !== 'number') userProgress.commandCount = 0;
    if (typeof userProgress.agentName !== 'string' || !userProgress.agentName) userProgress.agentName = 'OPERATIVE #1337';
    recalcModuleProgress();
  });
}
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  initProgress();
  initReducedMotion();
}

function initReducedMotion() {
  try {
    const saved = localStorage.getItem('cyberedu_reduced_motion');
    if (saved === 'true') {
      document.documentElement.classList.add('reduced-motion');
    }
  } catch(e) {}
}

function toggleReducedMotion() {
  const isReduced = document.documentElement.classList.toggle('reduced-motion');
  try {
    localStorage.setItem('cyberedu_reduced_motion', isReduced ? 'true' : 'false');
  } catch(e) {}
  updateStatusBar();
}

function saveProgress() {
  userProgress.moduleProgress = {};
  recalcModuleProgress();
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(userProgress));
  fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userProgress) }).catch(() => {});
}
function getSectionDone(id) { return userProgress.completedSections.includes(id); }
function setSectionDone(id) {
  if (!userProgress.completedSections.includes(id)) {
    userProgress.completedSections.push(id);
    const today = new Date().toISOString().split('T')[0];
    recordActiveDay();
    userProgress.timeline.unshift({ date: today, text: t('timeline.completed') + (getSecTitle(id) || id) });
    userProgress.timeline = userProgress.timeline.slice(0, 50);
    recalcModuleProgress();
    saveProgress();
    if (typeof checkAndUnlockAchievements === 'function') checkAndUnlockAchievements('section');
    if (typeof triggerCyberCelebration === 'function') triggerCyberCelebration('section');
    if (typeof renderAgentProfile === 'function' && currentView === 'progress') renderAgentProfile();
  }
}
function getSecTitle(id) {
  for (const m of MODULES) for (const c of m.chapters) for (const s of c.sections) if (s.id === id) return currentLang === 'en' && s.titleEn ? s.titleEn : s.title;
  return null;
}
function getModField(m, field) {
  const enField = field + 'En';
  return currentLang === 'en' && m[enField] ? m[enField] : m[field];
}
function getChapterField(c, field) {
  const enField = field + 'En';
  return currentLang === 'en' && c[enField] ? c[enField] : c[field];
}
function getSectionField(s, field) {
  const enField = field + 'En';
  return currentLang === 'en' && s[enField] ? s[enField] : s[field];
}
function recalcModuleProgress() {
  for (const m of MODULES) {
    let total = 0, done = 0;
    for (const c of m.chapters) for (const s of c.sections) { total++; if (getSectionDone(s.id)) done++; }
    userProgress.moduleProgress[m.id] = total ? Math.round(done / total * 100) : 0;
  }
}

// ============================================================
// ROUTING & NAVIGATION
// ============================================================
let currentView = null, currentModuleId = null, currentSectionId = null, currentPracticeIdx = 0, currentCTFId = null;

function navigate(view, moduleId, sectionId) {
  if (currentView === view && !moduleId && currentSectionId) return;
  // Cyberpunk nav transition glitch overlay
  cyberNavTransition(() => {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main-content');
    const noSidebar = ['home','progress','tools','ctf'];
    if (noSidebar.includes(view)) { sidebar.classList.add('hidden'); main.classList.add('no-sidebar'); }
    else {
      sidebar.classList.remove('hidden'); main.classList.remove('no-sidebar');
      const collapsed = sidebar.classList.contains('collapsed');
      document.getElementById('sidebar-toggle').textContent = collapsed ? '»' : '«';
      document.getElementById('sidebar-toggle').title = collapsed ? t('hub.sidebarExpand') : t('hub.sidebarToggle');
    }

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view)?.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navIdx = { home:0, hub:1, practice:2, ctf:3, progress:4, tools:5 };
    const links = document.querySelectorAll('.nav-link');
    if (navIdx[view] !== undefined) links[navIdx[view]]?.classList.add('active');

    currentView = view;
    document.getElementById('status-loc').textContent = { home:'HOME', hub:'HUB', practice:'PRACTICE', ctf:'CTF', progress:'PROGRESS', tools:'TOOLS' }[view] || view;

    if (view === 'hub') {
      const targetMod = moduleId || currentModuleId || (typeof MODULES !== 'undefined' && MODULES[0]?.id);
      const targetSec = sectionId || (moduleId ? undefined : currentSectionId);
      if (targetMod) {
        _loadModuleContent(targetMod, targetSec);
      }
    }
    if (view === 'progress') renderProgress();
    if (view === 'home') renderHome();
    if (view === 'ctf') renderCTF();
    if (view === 'tools') renderTools();
    if (view === 'practice') renderPractice(currentPracticeIdx);

    window.scrollTo({ top: 0 });
    updateSidebar();
    updateStatusBar();
    scrollReveal();
    try {
      if (view === 'hub' && (moduleId || currentModuleId)) {
        const mId = moduleId || currentModuleId;
        const sId = sectionId || currentSectionId;
        history.replaceState(null, '', '#' + view + '/' + mId + (sId ? '/' + sId : ''));
      } else {
        history.replaceState(null, '', '#' + view);
      }
    } catch(e) {}
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar.classList.contains('hidden')) sidebar.classList.add('hidden');
    }
  }, view);
}

// ============================================================
// CYBERPUNK NAV TRANSITION GLITCH OVERLAY
// ============================================================
function cyberNavTransition(callback, targetView) {
  const canvas = document.getElementById('nav-glitch-canvas');
  const fullW = window.innerWidth;
  const fullH = window.innerHeight;

  canvas.width = fullW;
  canvas.height = fullH;
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  const DURATION = 420;
  let startTime = null;
  let callbackDone = false;

  // Watchdog: guarantee glitch canvas is always hidden even on unexpected errors
  const safetyTimer = setTimeout(() => {
    canvas.style.display = 'none';
  }, DURATION + 500);

  function drawScanlines(p) {
    for (let y = 0; y < fullH; y += 3) {
      const a = 0.03 + Math.sin(p * 4 + y * 0.06) * 0.02;
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(0, y, fullW, 1);
    }
  }

  function drawStatic(intensity) {
    const count = Math.floor(intensity * 80);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * fullW;
      const y = Math.random() * fullH;
      const w = 1 + Math.random() * 3;
      const h = 1 + Math.random() * 1.5;
      ctx.fillStyle = Math.random() < 0.5
        ? `rgba(0,255,65,${0.15 + Math.random() * 0.2})`
        : `rgba(0,229,255,${0.1 + Math.random() * 0.15})`;
      ctx.fillRect(x, y, w, h);
    }
  }

  function drawRGBSplit(p) {
    // Channel separation: cyan shift left, red shift right
    ctx.globalCompositeOperation = 'screen';
    const shift = p * 12;
    ctx.fillStyle = `rgba(0,229,255,${0.06 * p})`;
    ctx.fillRect(-shift, 0, fullW, fullH);
    ctx.fillStyle = `rgba(255,68,102,${0.06 * p})`;
    ctx.fillRect(shift, 0, fullW, fullH);
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawScanSweep(p) {
    const y = p * fullH;
    const grad = ctx.createLinearGradient(0, y - 30, 0, y + 30);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, 'rgba(0,255,65,0.15)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, fullW, fullH);
  }

  function drawGlitchBlocks(p) {
    const count = Math.floor(p * 5);
    for (let i = 0; i < count; i++) {
      const gx = Math.random() * fullW;
      const gy = Math.random() * fullH;
      const gw = 20 + Math.random() * 150;
      const gh = 2 + Math.random() * 15;
      ctx.fillStyle = Math.random() < 0.5
        ? `rgba(0,229,255,${0.3 + Math.random() * 0.3})`
        : `rgba(0,255,65,${0.25 + Math.random() * 0.25})`;
      ctx.fillRect(gx, gy, gw, gh);
    }
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(0,255,65,0.02)';
    ctx.lineWidth = 0.5;
    const size = 40;
    for (let x = 0; x < fullW; x += size) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, fullH); ctx.stroke(); }
    for (let y = 0; y < fullH; y += size) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(fullW, y); ctx.stroke(); }
  }

  function drawViewLabel(p, target) {
    const nameMap = { home: 'HOME', hub: 'HUB', practice: 'PRACTICE', ctf: 'CTF', progress: 'PROGRESS', tools: 'TOOLS' };
    const label = nameMap[target] || target?.toUpperCase() || '';
    if (!label) return;
    const px = 30 + p * 60;
    const py = fullH / 2;
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const glitchOffset = (Math.sin(p * 50) * 4 * (1 - p));
    ctx.fillStyle = `rgba(0,229,255,${0.3 * (1 - p)})`;
    ctx.fillText(label, fullW / 2 + glitchOffset, py - 2);
    ctx.fillStyle = `rgba(255,68,102,${0.25 * (1 - p)})`;
    ctx.fillText(label, fullW / 2 - glitchOffset, py + 2);
    ctx.fillStyle = `rgba(0,255,65,${0.5 * (1 - p * 0.5)})`;
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = 8 * (1 - p);
    ctx.fillText(label, fullW / 2, py);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  function animate(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / DURATION, 1);

    ctx.clearRect(0, 0, fullW, fullH);
    ctx.fillStyle = `rgba(6,6,9,${0.97 - progress * 0.6})`;
    ctx.fillRect(0, 0, fullW, fullH);

    drawGrid();

    if (progress < 0.3) {
      // Phase 1: Build-up — static increasing, RGB split
      const p1 = progress / 0.3;
      drawStatic(p1);
      drawRGBSplit(p1);
      drawScanlines(progress);
    } else if (progress < 0.55) {
      // Phase 2: Peak glitch — flash, scan sweep, blocks
      const p2 = (progress - 0.3) / 0.25;
      drawStatic(1 - p2 * 0.5);
      drawScanSweep(p2);
      drawGlitchBlocks(p2);
      drawScanlines(progress);
      // Execute callback at peak
      if (!callbackDone) {
        callbackDone = true;
        try { callback(); } catch (err) { console.error('Nav callback error:', err); }
      }
    } else {
      // Phase 3: Decay — view label, fade out
      const p3 = (progress - 0.55) / 0.45;
      drawViewLabel(p3, targetView);
      drawStatic((1 - p3) * 0.3);
      drawScanlines(progress);
      if (!callbackDone) {
        callbackDone = true;
        try { callback(); } catch (err) { console.error('Nav callback error:', err); }
      }
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      if (typeof clearTimeout !== 'undefined') clearTimeout(safetyTimer);
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, fullW, fullH);
    }
  }

  requestAnimationFrame(animate);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('collapsed')) {
    expandGlitch();
  } else if (!sidebar.classList.contains('glitching')) {
    collapseGlitch();
  }
}

// ============================================================
// CYBERPUNK GLITCH COLLAPSE ANIMATION
// ============================================================
function collapseGlitch() {
  const sidebar = document.getElementById('sidebar');
  const canvas = document.getElementById('glitch-canvas');
  const toggle = document.getElementById('sidebar-toggle');
  const w = sidebar.offsetWidth;
  const h = sidebar.offsetHeight;

  if (w < 50) return; // already too narrow

  canvas.width = w;
  canvas.height = h;
  canvas.style.cssText = 'display:block;position:fixed;left:0;top:var(--nav-h);width:' + w + 'px;height:' + h + 'px;z-index:5;pointer-events:none';
  sidebar.classList.add('glitching');

  const ctx = canvas.getContext('2d');
  const DURATION = 1100;
  let startTime = null;
  let phase4FlashDone = false;

  // Pre-generate "content" rows to simulate sidebar text
  const contentRows = [];
  const rowH = 16, gap = 8;
  let y = 40;
  // section headers + module items
  for (let s = 0; s < 5; s++) {
    contentRows.push({ y, x: 16, w: 60 + Math.random() * 30, h: 4, color: '#555', type: 'header' });
    y += 12;
    for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
      contentRows.push({ y, x: 28, w: 40 + Math.random() * 100, h: 2, color: Math.random() < 0.2 ? '#0f8' : '#444', type: 'item' });
      y += rowH;
    }
    y += gap;
  }

  // Pre-generate a dissolution grid
  const gridW = 20, gridH = 16;
  const cols = Math.ceil(w / gridW), rows = Math.ceil(h / gridH);
  const dissolveOrder = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      dissolveOrder.push({ r, c, prio: (c / cols) * 0.4 + (r / rows) * 0.3 + Math.random() * 0.3 });
  dissolveOrder.sort((a, b) => b.prio - a.prio); // bottom-right dissolves first

  function rng(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  function drawBackground(px, py, pw, ph, alpha) {
    ctx.fillStyle = `rgba(6,6,9,${alpha})`;
    ctx.fillRect(px, py, pw || w, ph || h);
    // subtle grid
    ctx.strokeStyle = `rgba(0,255,65,${0.03 * alpha})`;
    ctx.lineWidth = 0.5;
    for (let gx = 20; gx < (pw || w); gx += 20) { ctx.beginPath(); ctx.moveTo(gx, py); ctx.lineTo(gx, py + (ph || h)); ctx.stroke(); }
    for (let gy = 20; gy < (ph || h); gy += 20) { ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px + (pw || w), gy); ctx.stroke(); }
  }

  function drawContent(px, py, pw) {
    const cw = pw || w;
    ctx.save();
    if (px || py) { ctx.beginPath(); ctx.rect(px, py, cw, h); ctx.clip(); }
    for (const row of contentRows) {
      if (row.y < py || row.y > py + h) continue;
      ctx.fillStyle = row.color;
      ctx.fillRect(row.x + px, row.y, Math.min(row.w, cw - row.x - px - 4), row.h);
    }
    ctx.restore();
  }

  function drawScanlines(frame, intensity) {
    for (let sy = 0; sy < h; sy += 4) {
      const a = rng(frame * 7 + sy) * intensity * 0.35;
      if (a > 0.02) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, sy, w, 2); }
    }
  }

  function drawNoise(frame, intensity) {
    const count = Math.floor(intensity * 80);
    for (let i = 0; i < count; i++) {
      const nx = rng(frame * 13 + i * 3) * w;
      const ny = rng(frame * 17 + i * 5) * h;
      ctx.fillStyle = rng(frame + i) < 0.5 ? 'rgba(0,255,65,0.5)' : 'rgba(6,6,9,0.7)';
      ctx.fillRect(nx, ny, 2 + rng(frame * 19 + i) * 4, 1 + rng(frame * 23 + i) * 2);
    }
  }

  function drawGlitchShift(frame, intensity) {
    // Horizontal displacement of random horizontal bands
    const bands = Math.floor(3 + intensity * 12);
    for (let i = 0; i < bands; i++) {
      const gy = Math.floor(rng(frame * 31 + i * 7) * h);
      const gh = 8 + rng(frame * 37 + i * 9) * 40;
      const shift = (rng(frame * 41 + i * 11) - 0.5) * intensity * 60;
      // Clamp slice height to valid canvas bounds
      const sliceH = Math.max(1, Math.min(Math.floor(gh), h - gy));
      // Capture a slice of background+content, shift it
      const slice = ctx.getImageData(0, gy, w, sliceH);
      ctx.putImageData(slice, shift, gy);
      // Redraw edge damage
      if (shift > 0) ctx.fillStyle = 'rgba(6,6,9,0.9)'; else ctx.fillStyle = 'rgba(6,6,9,0.9)';
      ctx.fillRect(shift > 0 ? 0 : w + shift, gy, Math.abs(shift), gh);
    }
  }

  function drawRGBSplit(frame, intensity) {
    // Simulate RGB channel separation on random blocks
    const blocks = Math.floor(intensity * 10);
    for (let i = 0; i < blocks; i++) {
      const bx = rng(frame * 53 + i * 3) * w * 0.9;
      const by = rng(frame * 59 + i * 5) * h * 0.9;
      const bw = 20 + rng(frame * 61 + i) * 60;
      const bh = 3 + rng(frame * 67 + i) * 12;
      const off = intensity * 8;
      ctx.fillStyle = `rgba(255,68,68,${0.12 * intensity})`;
      ctx.fillRect(bx - off, by, bw, bh);
      ctx.fillStyle = `rgba(0,255,65,${0.12 * intensity})`;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = `rgba(68,136,255,${0.12 * intensity})`;
      ctx.fillRect(bx + off, by, bw, bh);
    }
  }

  function drawDissolve(progress) {
    // Grid-based dissolution: blocks get "eaten" revealing dark void
    const threshold = progress * 1.15;
    for (let i = 0; i < dissolveOrder.length; i++) {
      const { r, c, prio } = dissolveOrder[i];
      if (prio > threshold) continue; // not dissolved yet
      const alpha = Math.min(1, (threshold - prio) * 3);
      ctx.fillStyle = `rgba(6,6,9,${alpha})`;
      ctx.fillRect(c * gridW, r * gridH, gridW + 1, gridH + 1);
    }
  }

  function drawNarrowing(collapseProgress, frame) {
    const cw = w - (w - 44) * collapseProgress;
    // Draw glitchy trailing edge
    ctx.strokeStyle = `rgba(0,255,65,${0.6 * (1 - collapseProgress)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cw, 0);
    for (let ey = 0; ey < h; ey += 6) {
      ctx.lineTo(cw + (rng(frame * 73 + ey) - 0.5) * 12 * collapseProgress, ey);
    }
    ctx.stroke();
    // Occasional spark on the edge
    if (rng(frame * 0.3) < 0.4) {
      const sy = rng(frame * 79) * h;
      ctx.fillStyle = '#0f8';
      ctx.shadowColor = '#0f8';
      ctx.shadowBlur = 6;
      ctx.fillRect(cw - 2, sy, 3, 1);
      ctx.shadowBlur = 0;
    }
  }

  function drawCRTFlash(alpha) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 1.2);
    grad.addColorStop(0, `rgba(200,255,220,${alpha})`);
    grad.addColorStop(0.4, `rgba(0,255,65,${alpha * 0.5})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ---- Main animation loop ----
  function animate(ts) {
    try {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / DURATION, 1);
    const frame = Math.floor(elapsed / 33); // ~30fps frame counter

    // Clear
    ctx.clearRect(0, 0, w, h);

    if (progress < 0.85) {
      // Full-width phases
      drawBackground(0, 0, w, h, 1);
      drawContent(0, 0, w);

      if (progress < 0.25) {
        // Phase 1: Signal degradation begins
        const p1 = progress / 0.25;
        drawScanlines(frame, p1 * 0.6);
        drawNoise(frame, p1 * 0.3);
        drawGlitchShift(frame, p1 * 0.2);
      } else if (progress < 0.55) {
        // Phase 2: Active interference
        const p2 = (progress - 0.25) / 0.30;
        drawScanlines(frame, 0.6 + p2 * 0.4);
        drawNoise(frame, 0.3 + p2 * 0.5);
        drawGlitchShift(frame, p2 * 0.8);
        drawRGBSplit(frame, p2);
      } else {
        // Phase 3: Dissolution
        const p3 = (progress - 0.55) / 0.30;
        drawScanlines(frame, 1.0);
        drawNoise(frame, 0.8 * (1 - p3));
        drawGlitchShift(frame, (1 - p3) * 0.7);
        drawDissolve(p3);
      }
    } else {
      // Phase 4: Final narrowing collapse
      const p4 = (progress - 0.85) / 0.15;
      const cw = w - (w - 44) * p4;

      drawBackground(0, 0, cw, h, 1);
      drawContent(0, 0, cw);
      drawScanlines(frame, 1.0);
      drawDissolve(1.0); // fully dissolved within narrow area

      // CRT flash at the very end
      if (p4 > 0.7 && !phase4FlashDone) {
        drawCRTFlash((p4 - 0.7) / 0.3 * 0.6);
        if (p4 > 0.95) { phase4FlashDone = true; }
      }

      drawNarrowing(p4, frame);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation complete
      canvas.style.cssText = 'display:none';
      sidebar.classList.remove('glitching');
      sidebar.classList.add('collapsed');
      toggle.textContent = '»';
      toggle.title = t('hub.sidebarExpand');
      localStorage.setItem('sidebar_collapsed', '1');
    }
    } catch(err) {
      console.error('[Sidebar] collapse animation error:', err);
      // Force completion on error to prevent stuck sidebar
      canvas.style.cssText = 'display:none';
      sidebar.classList.remove('glitching');
      sidebar.classList.add('collapsed');
      toggle.textContent = '»';
      localStorage.setItem('sidebar_collapsed', '1');
    }
  }

  requestAnimationFrame(animate);
}

// ============================================================
// CYBERPUNK GLITCH EXPAND ANIMATION
// ============================================================
function expandGlitch() {
  const sidebar = document.getElementById('sidebar');
  const canvas = document.getElementById('glitch-canvas');
  const toggle = document.getElementById('sidebar-toggle');
  const fullW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')) || 270;
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;
  const h = window.innerHeight - navH;

  // Canvas covers the FULL sidebar expansion area (high z-index to appear above main content)
  canvas.width = fullW;
  canvas.height = h;
  canvas.style.cssText = `display:block;position:fixed;left:0;top:${navH}px;width:${fullW}px;height:${h}px;z-index:10000;pointer-events:none;`;
  sidebar.classList.add('glitching');

  // Start sidebar expansion IMMEDIATELY (smooth width transition)
  sidebar.classList.remove('collapsed');
  sidebar.style.transition = `width 0.7s cubic-bezier(0.2, 0, 0.8, 1)`;
  sidebar.style.width = fullW + 'px';

  const ctx = canvas.getContext('2d');
  const DURATION = 1100;
  let startTime = null;

  const messages = [
    { time: 0, text: '> INIT SIDEBAR EXPANSION' },
    { time: 120, text: '> SCANNING MODULES...' },
    { time: 350, text: '> LOADING [==========>     ] 58%' },
    { time: 600, text: '> LOADING [==================] 100%' },
    { time: 780, text: '> ACCESS GRANTED \u2014 SIDEBAR ONLINE' },
  ];

  function drawScanlines(p) {
    for (let sy = 0; sy < h; sy += 3) {
      const a = 0.025 + Math.sin(p * 4 + sy * 0.05) * 0.015;
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(0, sy, fullW, 1);
    }
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(0,255,65,0.035)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < fullW; gx += 28) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,h); ctx.stroke(); }
    for (let gy = 0; gy < h; gy += 28) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(fullW,gy); ctx.stroke(); }
  }

  function drawProgressBar(p) {
    const bx = 20, by = h - 55, bw = fullW - 40, bh = 4;
    ctx.fillStyle = 'rgba(0,255,65,0.15)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#00ff41';
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = 6;
    ctx.fillRect(bx, by, bw * Math.min(p * 1.2, 1), bh);
    ctx.shadowBlur = 0;
  }

  function animate(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / DURATION, 1);
    const frame = Math.floor(elapsed / 30);

    ctx.clearRect(0, 0, fullW, h);

    // Dark background (fades slightly as sidebar content becomes visible)
    ctx.fillStyle = `rgba(6,6,9,${0.97 - progress * 0.5})`;
    ctx.fillRect(0, 0, fullW, h);

    drawGrid();
    drawScanlines(progress);

    if (progress < 0.6) {
      // Phase 1: Terminal messages + static
      const p1 = progress / 0.6;
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff41';
      let lY = 45;
      for (const m of messages) {
        if (elapsed >= m.time) {
          const age = elapsed - m.time;
          const opacity = Math.min(1, age / 200);
          ctx.globalAlpha = opacity;
          if (age < 250) {
            const chars = Math.floor(age / 250 * m.text.length);
            ctx.fillText(m.text.substring(0, Math.max(0, chars)), 16, lY);
          } else {
            ctx.fillText(m.text, 16, lY);
          }
          ctx.globalAlpha = 1;
        }
        lY += 20;
      }
      // Static noise
      const nc = Math.floor(p1 * 30);
      for (let i = 0; i < nc; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,255,65,0.25)' : 'rgba(6,6,9,0.4)';
        ctx.fillRect(Math.random()*fullW, Math.random()*h, 2+Math.random()*3, 1+Math.random()*2);
      }
      // Progress bar
      if (progress > 0.3) drawProgressBar((progress - 0.3) / 0.3);
    } else if (progress < 0.85) {
      // Phase 2: "ACCESS GRANTED" flash
      const p2 = (progress - 0.6) / 0.25;
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(0,255,65,${0.7 * (1 - p2 * 0.4)})`;
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur = 15 * (1 - p2);
      ctx.fillText('ACCESS GRANTED', fullW / 2, h / 2 - 15);
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(0,255,65,${0.4 * (1 - p2)})`;
      ctx.fillText('SIDEBAR MODULES ONLINE', fullW / 2, h / 2 + 10);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    } else {
      // Phase 3: Fade out canvas
      const p3 = (progress - 0.85) / 0.15;
      ctx.fillStyle = `rgba(6,6,9,${p3 * 0.95})`;
      ctx.fillRect(0, 0, fullW, h);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      canvas.style.cssText = 'display:none';
      sidebar.classList.remove('glitching');
      sidebar.style.transition = '';
      sidebar.style.width = '';
      toggle.textContent = '\u00AB';
      toggle.title = '\u6536\u8D77\u4FA7\u8FB9\u680F';
      localStorage.setItem('sidebar_collapsed', '0');
    }
  }

  requestAnimationFrame(animate);
}

// ============================================================
// VECTOR SVG ICONS FOR MODULES
// ============================================================
const MODULE_SVG_ICONS = {
  'programming': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  'network': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  'cryptography': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  'websec': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  'pentest': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
  'malware': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2"/><path d="m14 4-1 2"/></svg>',
  'ctf-guide': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
  'cloudsec': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="10 14 12 12 14 14"/><line x1="12" y1="12" x2="12" y2="18"/></svg>',
  'dfir': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/><line x1="12" y1="14" x2="12" y2="17"/></svg>'
};
MODULE_SVG_ICONS['ctfguide'] = MODULE_SVG_ICONS['ctf-guide'];

function getModuleIconSvg(modId, fallback) {
  if (typeof MODULE_SVG_ICONS !== 'undefined' && MODULE_SVG_ICONS[modId]) {
    return MODULE_SVG_ICONS[modId];
  }
  return fallback || '';
}

// ============================================================
// HOME
// ============================================================
function renderHome() {
  document.getElementById('modules-grid').innerHTML = MODULES.map(m => {
    const prog = userProgress.moduleProgress[m.id] || 0;
    const diff = m.chapters[0]?.difficulty || 1;
    const stars = '★'.repeat(diff) + '☆'.repeat(5-diff);
    const totalSecs = m.chapters.flatMap(c => c.sections).length;
    const doneSecs = m.chapters.flatMap(c => c.sections).filter(s => userProgress.completedSections.includes(s.id)).length;
    return `<div class="module-card reveal" onclick="loadModule('${m.id}')">
      <div class="module-card-icon">${getModuleIconSvg(m.id, m.icon)}</div>
      <h3>${getModField(m,'title')}</h3>
      <p>${getModField(m,'desc')}</p>
      <div class="module-card-meta">
        <span class="badge">${m.chapters.length} ${t('ctf.chapters')}</span>
        <span class="badge cyan">${stars}</span>
      </div>
      <div class="card-prog-details">
        <span class="card-prog-count">${doneSecs}/${totalSecs} ${t('home.secProgress')}</span>
        <span class="card-prog-pct">${prog}%</span>
      </div>
      <div class="card-prog-mini"><div class="card-prog-mini-fill" style="width:${prog}%"></div></div>
    </div>`;
  }).join('');
  renderResumeLearning();
  // Render learning path
  renderLearningPath();
  wrapCyberLetters();

  // Update hero stats
  const totalSections = MODULES.flatMap(m => m.chapters.flatMap(c => c.sections)).length;
  const statTargets = {
    'stat-chapters': totalSections,
    'stat-exercises': (typeof PRACTICES !== 'undefined') ? PRACTICES.length : 10,
    'stat-ctf': (typeof CTF_CHALLENGES !== 'undefined') ? CTF_CHALLENGES.length : 28,
    'stat-tools': (typeof TOOLS !== 'undefined') ? TOOLS.length : 6
  };
  for (const [id, val] of Object.entries(statTargets)) {
    const el = document.getElementById(id);
    if (el) {
      el.dataset.target = val;
      el.textContent = val;
    }
  }
}

function renderResumeLearning() {
  const wrap = document.getElementById('resume-learning-wrap');
  if (!wrap) return;
  let targetModId = null;
  let targetSecId = null;
  let targetTitle = '';
  let targetModTitle = '';

  if (userProgress.lastSection && userProgress.lastSection.modId && userProgress.lastSection.secId) {
    targetModId = userProgress.lastSection.modId;
    targetSecId = userProgress.lastSection.secId;
    const mod = MODULES.find(m => m.id === targetModId);
    const sec = mod?.chapters.flatMap(c => c.sections).find(s => s.id === targetSecId);
    if (sec && mod) {
      targetTitle = getSectionField(sec, 'title');
      targetModTitle = getModField(mod, 'title');
    }
  } else if (userProgress.completedSections && userProgress.completedSections.length > 0) {
    const lastDoneId = userProgress.completedSections[userProgress.completedSections.length - 1];
    for (const m of MODULES) {
      const s = m.chapters.flatMap(c => c.sections).find(sec => sec.id === lastDoneId);
      if (s) {
        targetModId = m.id;
        targetSecId = s.id;
        targetTitle = getSectionField(s, 'title');
        targetModTitle = getModField(m, 'title');
        break;
      }
    }
  }

  if (!targetModId || !targetSecId) {
    wrap.innerHTML = '';
    return;
  }

  const isDone = getSectionDone(targetSecId);
  const statusBadge = isDone ? '✓ ' + t('section.completed') : '⚡ ' + t('home.resumeLearning');

  wrap.innerHTML = `
    <div class="resume-learning-card" onclick="navigate('hub','${targetModId}','${targetSecId}')" role="button" tabindex="0">
      <div class="resume-learning-info">
        <div class="resume-learning-badge">${statusBadge}</div>
        <div class="resume-learning-title"><span>${targetModTitle}</span> <span style="opacity:0.35">/</span> <span>${targetTitle}</span></div>
        <div class="resume-learning-sub">${t('home.resumeSub')}</div>
      </div>
      <button class="resume-learning-btn">${t('home.continueBtn')}</button>
    </div>
  `;
}

function renderLearningPath() {
  const modMap = {};
  if (typeof MODULES !== 'undefined') {
    for (const m of MODULES) modMap[m.id] = m;
  }
  const stages = [
    { label: t('path.stage1'), color: '#00ff41', items: [
      { icon: '⌨', title: getModField(modMap['programming'] || {title:'编程基础',titleEn:'Programming'},'title'), desc: currentLang==='en'?'Python/C/Shell — foundation for all security skills':'Python/C/Shell — 所有安全技能的地基', id: 'programming' },
      { icon: '🌐', title: getModField(modMap['network'] || {title:'计算机网络',titleEn:'Networking'},'title'), desc: currentLang==='en'?'TCP/IP, HTTP, DNS — understand network communication':'TCP/IP、HTTP、DNS — 理解网络通信原理', id: 'network' },
      { icon: '🔐', title: getModField(modMap['cryptography'] || {title:'密码学',titleEn:'Cryptography'},'title'), desc: currentLang==='en'?'Classical to modern crypto — theoretical foundation':'古典到现代密码体系 — 理论基础', id: 'cryptography' }
    ]},
    { label: t('path.stage2'), color: '#00e5ff', items: [
      { icon: '🕸', title: getModField(modMap['websec'] || {title:'Web 安全',titleEn:'Web Security'},'title'), desc: currentLang==='en'?'OWASP Top 10 — most common vulnerabilities':'OWASP Top 10 — 最常见的安全漏洞', id: 'websec' },
      { icon: '🎯', title: getModField(modMap['pentest'] || {title:'渗透测试',titleEn:'Penetration Testing'},'title'), desc: currentLang==='en'?'Recon → Exploitation → Privilege Escalation':'信息收集→漏洞利用→提权→后渗透', id: 'pentest' }
    ]},
    { label: t('path.stage3'), color: '#ffd54f', items: [
      { icon: '☁', title: getModField(modMap['cloudsec'] || {title:'云原生与容器安全',titleEn:'Cloud & Container Security'},'title'), desc: currentLang==='en'?'Docker isolation, privilege breakout & K8s defense':'Docker 隔离、特权逃逸与 K8s 集群攻防', id: 'cloudsec' },
      { icon: '☠', title: getModField(modMap['malware'] || {title:'恶意软件分析',titleEn:'Malware Analysis'},'title'), desc: currentLang==='en'?'Static/dynamic analysis + YARA rules':'静态/动态分析 + YARA 规则', id: 'malware' }
    ]},
    { label: t('path.stage4'), color: '#ff4466', items: [
      { icon: '🛡', title: getModField(modMap['dfir'] || {title:'蓝队监控与应急取证',titleEn:'Blue Team & Digital Forensics'},'title'), desc: currentLang==='en'?'SOC hunting, Volatility memory & PCAP analysis':'SOC 日志狩猎、内存取证与 PCAP 流量分析', id: 'dfir' },
      { icon: '🚩', title: getModField(modMap['ctf-guide'] || {title:'CTF 实战',titleEn:'CTF Practice'},'title'), desc: 'Crypto/Web/PWN/Reverse/Forensics', id: 'ctf-guide' }
    ]}
  ];
  document.getElementById('learning-path').innerHTML = stages.map((stage) => {
    return '<div style="margin-bottom:24px">' +
      '<div style="font-family:var(--font-mono);font-size:12px;color:' + stage.color + ';letter-spacing:2px;margin-bottom:12px;font-weight:600" class="cyber-text">' + stage.label + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">' +
        stage.items.map((item) => {
          const p = userProgress.moduleProgress[item.id] || 0;
          return '<div class="module-card reveal" onclick="loadModule(\'' + item.id + '\')" style="padding:18px 20px;cursor:pointer">' +
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
              '<span class="path-item-icon">' + getModuleIconSvg(item.id, item.icon) + '</span>' +
              '<div><div style="font-family:var(--font-mono);font-size:14px;font-weight:600;color:var(--text-main)">' + item.title + '</div>' +
              '<div style="font-size:11px;color:var(--text-dim)">' + item.desc + '</div></div>' +
              '<span style="margin-left:auto;font-family:var(--font-mono);font-size:11px;color:var(--color-green)">' + p + '%</span>' +
            '</div>' +
            '<div class="card-prog-mini"><div class="card-prog-mini-fill" style="width:' + p + '%"></div></div>' +
          '</div>';
        }).join('') +
      '</div></div>';
  }).join('');
}

// ============================================================
// SIDEBAR
// ============================================================
function updateSidebar() {
  const content = document.getElementById('sidebar-content');

  // 练习模式：显示题目列表侧边栏
  if (currentView === 'practice') {
    let html = '<div class="sidebar-section"><div class="sidebar-practice-header">' + t('sidebar.practice') + '</div>';
    PRACTICES.forEach((p, i) => {
      const stars = '★'.repeat(p.difficulty) + '☆'.repeat(5 - p.difficulty);
      const cat = currentLang==='en' && p.categoryEn ? p.categoryEn : p.category;
      const title = currentLang==='en' && p.titleEn ? p.titleEn : p.title;
      html += `<button class="sidebar-chapter-btn ${i === currentPracticeIdx ? 'active' : ''}" onclick="switchPractice(${i})">
        <span class="sidebar-prac-num">${i + 1}.</span> ${title}
        <span class="sidebar-prac-meta">${cat} · ${stars}</span>
      </button>`;
    });
    html += '</div>';
    content.innerHTML = html;
    return;
  }
  let html = '';
  for (const m of MODULES) {
    const prog = userProgress.moduleProgress[m.id] || 0;
    const isActive = currentModuleId === m.id;
    html += `<div class="sidebar-section">
      <button class="sidebar-module-btn ${isActive?'active':''}" onclick="loadModule('${m.id}')">
        <span class="sidebar-module-icon">${getModuleIconSvg(m.id, m.icon)}</span>${getModField(m,'title')}
      </button>
      <div class="sidebar-chapters ${isActive?'open':''}">
        <div class="sidebar-progress"><div class="sidebar-progress-fill" style="width:${prog}%"></div></div>
        <div class="sidebar-prog-label"><span>PROGRESS</span><span>${prog}%</span></div>`;
    let secNum = 0;
    for (const c of m.chapters) {
      if (m.chapters.length > 1) {
        const cTitle = (currentLang === 'en' && c.titleEn) ? c.titleEn : c.title;
        html += `<div class="sidebar-chapter-group-header"><span class="sidebar-chap-folder">▸</span> ${cTitle}</div>`;
      }
      for (const s of c.sections) {
        secNum++;
        const done = getSectionDone(s.id);
        const sTitle = getSectionField(s,'title');
        html += `<button class="sidebar-chapter-btn ${s.id===currentSectionId?'active':''} ${done?'done':''}"
          onclick="loadSection('${m.id}','${s.id}')"><span class="sidebar-prac-num">${String(secNum).padStart(2,'0')}.</span> ${sTitle}${done?'<span class="sidebar-chap-done">✓</span>':''}</button>`;
      }
    }
    html += '</div></div>';
  }
  content.innerHTML = html;
}

// ============================================================
// MODULE / SECTION LOADING
// ============================================================
function _loadModuleContent(moduleId, sectionId) {
  currentModuleId = moduleId;
  const m = MODULES.find(x => x.id === moduleId);
  if (!m) return;
  const sec = sectionId ? m.chapters.flatMap(c => c.sections).find(s => s.id === sectionId) : m.chapters[0]?.sections[0];
  if (sec) loadSection(moduleId, sec.id);
}

function loadModule(moduleId, sectionId) {
  currentModuleId = moduleId;
  navigate('hub', moduleId, sectionId);
}

// ============================================================
// CHECKPOINT QUIZ SYSTEM
// ============================================================
function renderCheckpoints(sectionContentKey) {
  if (typeof SECTION_CHECKPOINTS === 'undefined') return;
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const checkpoints = (isEn && typeof SECTION_CHECKPOINTS_EN !== 'undefined' && SECTION_CHECKPOINTS_EN[sectionContentKey])
    ? SECTION_CHECKPOINTS_EN[sectionContentKey]
    : SECTION_CHECKPOINTS[sectionContentKey];
  if (!checkpoints || !checkpoints.length) return;

  const placeholders = document.querySelectorAll('.checkpoint[data-cp]');
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const makeCardHtml = (cp, idx) => `
    <div class="checkpoint-card" id="cp-${sectionContentKey}-${idx}">
      <div class="checkpoint-header">
        <div class="checkpoint-icon">?</div>
        <div class="checkpoint-title">CHECKPOINT ${idx + 1}</div>
      </div>
      <div class="checkpoint-question">${cp.question}</div>
      <div class="checkpoint-options">
        ${cp.options.map((opt, i) => `
          <button class="checkpoint-option" data-cp-key="${sectionContentKey}" data-cp-idx="${idx}" data-opt="${i}" onclick="handleCheckpointAnswer(this)">
            <span class="opt-letter">${letters[i]}</span>
            <span>${opt}</span>
          </button>`).join('')}
      </div>
    </div>`;

  if (placeholders.length) {
    placeholders.forEach(el => {
      const idx = parseInt(el.dataset.cp);
      const cp = checkpoints[idx];
      if (!cp) return;
      el.outerHTML = makeCardHtml(cp, idx);
    });
  } else {
    // Fallback: render all checkpoints sequentially before separator if no inline placeholders exist
    const sep = document.querySelector('.separator');
    if (sep && !document.getElementById(`cp-${sectionContentKey}-0`)) {
      const wrap = document.createElement('div');
      wrap.className = 'checkpoints-wrap';
      wrap.innerHTML = checkpoints.map((cp, idx) => makeCardHtml(cp, idx)).join('');
      sep.parentNode.insertBefore(wrap, sep);
    }
  }
}

function handleCheckpointAnswer(btn) {
  const card = btn.closest('.checkpoint-card');
  const key = btn.dataset.cpKey, idx = parseInt(btn.dataset.cpIdx), opt = parseInt(btn.dataset.opt);
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const cpSet = (isEn && typeof SECTION_CHECKPOINTS_EN !== 'undefined' && SECTION_CHECKPOINTS_EN[key])
    ? SECTION_CHECKPOINTS_EN[key]
    : (typeof SECTION_CHECKPOINTS !== 'undefined' ? SECTION_CHECKPOINTS[key] : null);
  const cp = cpSet?.[idx];
  if (!cp) return;

  const allOpts = card.querySelectorAll('.checkpoint-option');
  const isCorrect = opt === cp.answer;
  const icon = card.querySelector('.checkpoint-icon');

  // Disable all options
  allOpts.forEach(o => o.classList.add('disabled'));

  if (isCorrect) {
    btn.classList.add('correct');
    card.classList.add('answered-correct');
    icon.textContent = '✓';
  } else {
    btn.classList.add('wrong');
    allOpts[cp.answer].classList.add('correct');
    card.classList.add('answered-wrong');
    icon.textContent = '✗';
  }

  // Show explanation
  const expDiv = document.createElement('div');
  expDiv.className = `checkpoint-explanation${isCorrect ? '' : ' wrong-exp'}`;
  const correctBadge = t('checkpoint.correct') || '✓ 正确！';
  const wrongBadge = t('checkpoint.wrong') || '✗ 不对哦';
  const ansPrefix = isEn ? 'Correct answer is ' : '正确答案是 ';
  expDiv.innerHTML = isCorrect
    ? `<strong>${correctBadge}</strong> ${cp.explanation}`
    : `<strong>${wrongBadge}</strong> — ${ansPrefix}${['A','B','C','D','E','F'][cp.answer]}。${cp.explanation}`;
  if (!isCorrect) {
    const aiBtn = document.createElement('button');
    aiBtn.className = 'cp-ask-ai-btn';
    aiBtn.innerHTML = `🤖 ${t('ai.askCheckpoint')}`;
    aiBtn.onclick = () => askAICheckpoint(key, idx, opt);
    expDiv.appendChild(aiBtn);
  }
  card.appendChild(expDiv);

  // Allow retry on wrong answer after 2s
  if (!isCorrect) {
    setTimeout(() => {
      allOpts.forEach(o => { o.classList.remove('disabled','wrong'); });
      card.classList.remove('answered-wrong');
      icon.textContent = '?';
      card.querySelector('.checkpoint-title').textContent = `CHECKPOINT ${idx + 1}`;
      expDiv.remove();
    }, 2500);
  }
}

// ── injectGlossary fallback / guarantee ──
function _injectGlossaryFallback(html) {
  if (!html) return '';
  let result = html;
  if (typeof GLOSSARY === 'undefined') return result;
  for (const [term, def] of Object.entries(GLOSSARY)) {
    if (/^[a-zA-Z]{1,2}$/.test(term)) continue;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isEnglish = !/[^\x00-\x7F]/.test(term);
    const regex = isEnglish
      ? new RegExp('\\b' + escaped + '\\b(?![^<]*>)', 'g')
      : new RegExp('(?<![\\w\\${}])' + escaped + '(?![\\w\\${}])(?![^<]*>)', 'g');
    result = result.replace(regex, '<span class="glossary" data-term="' + term + '">$&</span>');
  }
  return result;
}
if (typeof injectGlossary !== 'function') {
  if (typeof window !== 'undefined') window.injectGlossary = _injectGlossaryFallback;
  else globalThis.injectGlossary = _injectGlossaryFallback;
}

function loadSection(moduleId, sectionId) {
  currentModuleId = moduleId;
  currentSectionId = sectionId;
  const m = MODULES.find(x => x.id === moduleId);
  const sec = m?.chapters.flatMap(c => c.sections).find(s => s.id === sectionId);
  if (!sec || !m) return;

  // Persist last visited section for resume learning
  try {
    userProgress.lastSection = { modId: moduleId, secId: sectionId, time: Date.now() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(userProgress));
  } catch(e) {}

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-hub').classList.add('active');
  document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('no-sidebar');

  document.getElementById('hub-breadcrumbs').innerHTML = `${t('hub.breadcrumb')} / <span>${getModField(m,'title')}</span>`;
  document.getElementById('hub-title').textContent = getSectionField(sec,'title');

  const allSections = MODULES.flatMap(mod => mod.chapters.flatMap(c => c.sections));
  const idx = allSections.findIndex(s => s.id === sectionId);
  const prevSec = allSections[idx - 1], nextSec = allSections[idx + 1];
  let prevMod = null, nextMod = null;
  if (prevSec) prevMod = MODULES.find(mod => mod.chapters.some(c => c.sections.some(s => s.id === prevSec.id)));
  if (nextSec) nextMod = MODULES.find(mod => mod.chapters.some(c => c.sections.some(s => s.id === nextSec.id)));
  const curChap = m.chapters.find(c => c.sections.some(s => s.id === sectionId));
  const starsHtml = curChap && curChap.difficulty
    ? '· <span class="sec-stars">' + '★'.repeat(curChap.difficulty) + '☆'.repeat(5 - curChap.difficulty) + '</span>'
    : '';
  const prereqHtml = (idx > 0 && prevSec)
    ? '· <span class="sec-prereq">' + t('section.prereq') + ' ' + getSectionField(prevSec, 'title') + '</span>'
    : '';

  const done = getSectionDone(sectionId);
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  let contentSource = '';
  if (isEn && sec.contentKey && typeof SECTION_CONTENT_EN !== 'undefined' && SECTION_CONTENT_EN[sec.contentKey]) {
    contentSource = SECTION_CONTENT_EN[sec.contentKey];
  } else if (sec.contentKey && typeof SECTION_CONTENT !== 'undefined' && SECTION_CONTENT[sec.contentKey]) {
    contentSource = SECTION_CONTENT[sec.contentKey];
  } else {
    contentSource = sec.content || '';
  }
  const igFn = typeof injectGlossary === 'function' ? injectGlossary : _injectGlossaryFallback;
  const contentWithGlossary = igFn(contentSource);

  // Reading time estimate (Chinese ~500 chars/min, English ~250 words/min)
  const plainText = (contentSource || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const readMin = Math.max(1, Math.round(plainText.length / 500));

  document.getElementById('article-body').innerHTML = `
    <div class="reading-time">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${readMin} min read ${starsHtml} ${prereqHtml}
      <button class="lab-badge-btn" onclick="openLabDrawer('${sec.contentKey}')" style="margin-left:12px">📦 ${t('lab.drawerTitle')}</button>
    </div>
    ${contentWithGlossary}
    ${renderSectionCTFCard(sectionId)}
    <div class="separator"></div>
    <button class="complete-btn ${done?'done':''}" onclick="markDone('${sectionId}',this)">
      ${done ? t('section.completed') : t('section.markDone')}
    </button>
    <div class="section-nav">
      ${prevSec ? `<button class="nav-btn" onclick="loadSection('${prevMod?.id}','${prevSec.id}')">${t('section.prev')}${getSectionField(prevSec,'title')}</button>` : ''}
      ${nextSec ? `<button class="nav-btn next-btn" onclick="loadSection('${nextMod?.id}','${nextSec.id}')">${t('section.next')}${getSectionField(nextSec,'title')}</button>` : ''}
    </div>`;

  setTimeout(() => {
    if (window.Prism) Prism.highlightAll();
    bindGlossaryEvents();
    renderCheckpoints(sec.contentKey);
    renderPlaygrounds(sec.contentKey);
    renderDiagrams(sec.contentKey);
    attachCodeAITools();
    buildTableOfContents();
  }, 80);
  updateSidebar();
  updateStatusBar();
  window.scrollTo({ top: 0 });
}

function markDone(sectionId, btn) {
  setSectionDone(sectionId);
  btn.textContent = t('section.completed');
  btn.classList.add('done');
  updateStatusBar();
  updateSidebar();
}

// ============================================================
// ON-THIS-PAGE TABLE OF CONTENTS (TOC)
// ============================================================
let hubScrollSpy = null;

function buildTableOfContents() {
  const tocList = document.getElementById('hub-toc-list');
  const tocWrap = document.getElementById('hub-toc');
  if (!tocList || !tocWrap) return;
  tocList.innerHTML = '';

  const articleBody = document.getElementById('article-body');
  if (!articleBody) return;

  const targets = articleBody.querySelectorAll('h2, h3, .checkpoint-card, .interactive-sandbox, .playground-box, .section-ctf-card, .complete-btn');
  if (!targets.length) {
    tocWrap.style.display = 'none';
    return;
  }
  tocWrap.style.display = '';

  const items = [];
  let cpCounter = 0;

  targets.forEach((el, idx) => {
    if (el.closest('.callout') && (el.tagName === 'H3' || el.tagName === 'H4')) return;
    if (!el.id) {
      el.id = 'article-sec-anchor-' + idx;
    }

    let title = '';
    let levelClass = 'level-h2';
    let icon = '§';

    if (el.tagName === 'H2') {
      title = el.textContent.trim().replace(/^#+\s*/, '');
      levelClass = 'level-h2';
      icon = '§';
    } else if (el.tagName === 'H3') {
      title = el.textContent.trim().replace(/^#+\s*/, '');
      levelClass = 'level-h3';
      icon = '·';
    } else if (el.classList.contains('interactive-sandbox') || el.classList.contains('playground-box')) {
      title = currentLang === 'en' ? 'Interactive Sandbox' : '交互实训沙箱';
      levelClass = 'level-special';
      icon = '🛠️';
    } else if (el.classList.contains('section-ctf-card')) {
      title = currentLang === 'en' ? 'Hands-On CTF Lab' : '实战靶场演练';
      levelClass = 'level-special';
      icon = '🚩';
    } else if (el.classList.contains('checkpoint-card')) {
      cpCounter++;
      title = (currentLang === 'en' ? 'Checkpoint ' : '检测题 ') + cpCounter;
      levelClass = 'level-special';
      icon = '🎯';
    } else if (el.classList.contains('complete-btn')) {
      title = currentLang === 'en' ? 'Chapter Completion' : '章节考核完成';
      levelClass = 'level-special';
      icon = '✓';
    }

    if (!title) return;
    items.push({ id: el.id, title, levelClass, icon, el });
  });

  items.forEach(item => {
    const a = document.createElement('a');
    a.className = `hub-toc-item ${item.levelClass}`;
    a.href = '#' + item.id;
    a.innerHTML = `<span class="hub-toc-icon" aria-hidden="true">${item.icon}</span><span class="hub-toc-text">${item.title}</span>`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const targetEl = document.getElementById(item.id);
      if (targetEl) {
        const top = targetEl.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
    tocList.appendChild(a);
  });

  if (hubScrollSpy) {
    window.removeEventListener('scroll', hubScrollSpy);
  }

  const updateTocSpy = () => {
    if (typeof currentView !== 'undefined' && currentView !== 'hub') return;
    const scrollY = window.pageYOffset;
    const bodyRect = articleBody.getBoundingClientRect();
    const articleTop = bodyRect.top + scrollY;
    const articleHeight = bodyRect.height;
    const winH = window.innerHeight;

    const progressTotal = articleHeight - winH + 120;
    const currentProgress = scrollY - articleTop + 80;
    const pct = progressTotal > 0 ? Math.min(100, Math.max(0, Math.round((currentProgress / progressTotal) * 100))) : 0;

    const pctEl = document.getElementById('hub-toc-pct');
    const barFill = document.getElementById('hub-toc-bar-fill');
    if (pctEl) pctEl.textContent = pct + '%';
    if (barFill) barFill.style.width = pct + '%';

    let activeId = null;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].el.getBoundingClientRect();
      if (rect.top <= 150) {
        activeId = items[i].id;
      } else {
        break;
      }
    }
    if (!activeId && items.length > 0) activeId = items[0].id;

    const tocLinks = tocList.querySelectorAll('.hub-toc-item');
    tocLinks.forEach(link => {
      if (link.getAttribute('href') === '#' + activeId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  hubScrollSpy = updateTocSpy;
  window.addEventListener('scroll', hubScrollSpy, { passive: true });
  updateTocSpy();
}

// ============================================================
// GLOSSARY / TOOLTIP SYSTEM
// ============================================================
function bindGlossaryEvents() {
  const tooltip = document.getElementById('tooltip');
  document.querySelectorAll('.glossary').forEach(el => {
    el.addEventListener('mouseenter', e => {
      const term = el.dataset.term;
      const def = GLOSSARY[term];
      if (!def) return;
      tooltip.innerHTML = `<div class="tt-term">${term}</div><div class="tt-def">${def}</div>`;
      tooltip.classList.add('show');
    });
    el.addEventListener('mousemove', e => {
      const x = e.clientX + 16, y = e.clientY - 80;
      const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      tooltip.style.left = (x + tw > window.innerWidth - 20 ? x - tw - 32 : x) + 'px';
      tooltip.style.top = (y < 10 ? y + th + 32 : y) + 'px';
    });
    el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
  });
}

// ============================================================
// CTF & SECTION CROSS-LINKING SYSTEM
// ============================================================
const SECTION_CTF_MAP = {
  // Programming Fundamentals
  'prog-02-01': 'ctf-025', // Log Analysis: SSH Brute Force
  'prog-04-01': 'ctf-013', // Pointer & Memory -> Stack Overflow 101
  'prog-04-02': 'ctf-013', // Memory Vulnerabilities -> Stack Overflow 101
  'prog-06-01': 'ctf-005', // RegEx -> Where's The Flag?

  // Computer Networking
  'net-01-02': 'ctf-006', // TCP Handshake -> Pcap Analysis
  'net-02-01': 'ctf-006',
  'net-02-02': 'ctf-006',
  'net-03-03': 'ctf-022', // Packet Capture -> Pcap Analysis
  'net-03-01': 'ctf-022', // DNS Protocol -> DNS Tunneling Detection
  'net-04-01': 'ctf-016', // HTTP In-depth -> PHP Type Juggling

  // Cryptography
  'crypto-01-01': 'ctf-002', // Caesar -> ROT-What?
  'crypto-01-02': 'ctf-017', // Vigenere -> Vigenere Cipher
  'crypto-02-01': 'ctf-018', // DES to AES -> AES-ECB Cut & Paste
  'crypto-03-01': 'ctf-001', // RSA In-depth -> Baby RSA
  'crypto-03-02': 'ctf-007', // RSA CTF Attacks -> Fermat's Gift
  'crypto-04-01': 'ctf-009', // Hash MD5/SHA -> Base64 x N

  // Web Security
  'web-01-01': 'ctf-003', // SQLi -> Login Bypass
  'web-02-01': 'ctf-008', // Command Injection -> Command Injection 101
  'web-04-01': 'ctf-004', // XSS -> XSS Hunter
  'web-05-03': 'ctf-020', // SSRF -> SSRF 101
  'web-06-01': 'ctf-019', // File Upload -> File Upload Bypass
  'web-07-01': 'ctf-016', // Deserialization -> PHP Type Juggling
  'web-08-01': 'ctf-012', // SSTI -> SSTI Detective

  // Penetration Testing
  'pentest-01-01': 'ctf-026', // Recon Methodology -> Filesystem Timeline Forensics
  'pentest-02-01': 'ctf-027', // Privilege Escalation -> Format String

  // Malware Analysis
  'malw-01-02': 'ctf-010', // Static & Dynamic Analysis -> ELF Beginner
  'malw-02-01': 'ctf-015', // YARA Rules -> Memory Dump Analysis

  // CTF Guide
  'ctfg-02-01': 'ctf-028', // Buffer Overflow Zero to Hero -> ROP Chain Basics
  'ctfg-03-01': 'ctf-014', // Ghidra Reverse Engineering -> XOR Madness
  'ctfg-05-01': 'ctf-021'  // Forensics Fundamentals -> Image Steganography
};

const CTF_SECTION_MAP = {
  'ctf-001': 'crypto-03-01',
  'ctf-002': 'crypto-01-01',
  'ctf-003': 'web-01-01',
  'ctf-004': 'web-04-01',
  'ctf-005': 'prog-06-01',
  'ctf-006': 'net-02-01',
  'ctf-007': 'crypto-03-02',
  'ctf-008': 'web-02-01',
  'ctf-009': 'crypto-04-01',
  'ctf-010': 'malw-01-02',
  'ctf-011': 'crypto-03-02',
  'ctf-012': 'web-08-01',
  'ctf-013': 'prog-04-02',
  'ctf-014': 'ctfg-03-01',
  'ctf-015': 'malw-02-01',
  'ctf-016': 'web-07-01',
  'ctf-017': 'crypto-01-02',
  'ctf-018': 'crypto-02-01',
  'ctf-019': 'web-06-01',
  'ctf-020': 'web-05-03',
  'ctf-021': 'ctfg-05-01',
  'ctf-022': 'net-03-01',
  'ctf-023': 'ctfg-03-01',
  'ctf-024': 'malw-01-02',
  'ctf-025': 'prog-02-01',
  'ctf-026': 'pentest-01-01',
  'ctf-027': 'pentest-02-01',
  'ctf-028': 'ctfg-02-01'
};

const CTF_QUICK_PAYLOADS = {
  'ctf-003': [
    { label: "admin' OR '1'='1", payload: "admin' OR '1'='1" },
    { label: "' OR 1=1 --", payload: "' OR 1=1 --" },
    { label: "admin' #", payload: "admin' #" },
    { label: "' UNION SELECT 1,2,3--", payload: "' UNION SELECT 1,2,3--" }
  ],
  'ctf-008': [
    { label: "127.0.0.1; ls", payload: "127.0.0.1; ls" },
    { label: "127.0.0.1; cat flag.txt", payload: "127.0.0.1; cat flag.txt" },
    { label: "127.0.0.1; whoami", payload: "127.0.0.1; whoami" },
    { label: "127.0.0.1 && id", payload: "127.0.0.1 && id" }
  ],
  'ctf-016': [
    { label: "QNKCDZO (md5=0e...)", payload: "QNKCDZO" },
    { label: "240610708 (md5=0e...)", payload: "240610708" },
    { label: "aabg7XSs (md5=0e...)", payload: "aabg7XSs" }
  ],
  'ctf-004': [
    { label: '" autofocus onfocus=alert(1) x="', payload: '" autofocus onfocus=alert(1) x="' },
    { label: "<script>alert(1)</script>", payload: "<script>alert(1)</script>" },
    { label: "<img src=x onerror=alert(1)>", payload: "<img src=x onerror=alert(1)>" },
    { label: "<svg onload=alert(1)>", payload: "<svg onload=alert(1)>" }
  ],
  'ctf-012': [
    { label: "{{7*7}}", payload: "{{7*7}}" },
    { label: "{{config}}", payload: "{{config}}" },
    { label: '{{ "".__class__.__mro__ }}', payload: '{{ "".__class__.__mro__ }}' }
  ],
  'ctf-019': [
    { label: "shell.phtml", payload: "shell.phtml" },
    { label: "shell.phar", payload: "shell.phar" },
    { label: "shell.pHp", payload: "shell.pHp" },
    { label: "shell.php5", payload: "shell.php5" }
  ],
  'ctf-020': [
    { label: "http://localhost:8080/flag.txt", payload: "http://localhost:8080/flag.txt" },
    { label: "http://127.0.0.1:8080", payload: "http://127.0.0.1:8080" },
    { label: "file:///etc/passwd", payload: "file:///etc/passwd" }
  ]
};

function renderSectionCTFCard(sectionId) {
  const ctfId = SECTION_CTF_MAP[sectionId];
  if (!ctfId || typeof CTF_CHALLENGES === 'undefined') return '';
  const c = CTF_CHALLENGES.find(x => x.id === ctfId);
  if (!c) return '';

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const isSolved = userProgress.ctfSolved && userProgress.ctfSolved.includes(c.id);
  const title = (isEn && c.titleEn) ? c.titleEn : c.title;
  const desc = (isEn && c.descEn) ? c.descEn : c.desc;
  const descSnippet = desc ? (desc.length > 120 ? desc.slice(0, 118) + '...' : desc) : '';
  const stars = Array.from({ length: 5 }, (_, i) => `<span style="color:${i < c.difficulty ? 'var(--color-green)' : 'var(--text-muted)'}">★</span>`).join('');
  const badgeTitle = t('section.ctfLab');
  const statusText = isSolved ? t('section.ctfSolved') : t('section.ctfUnsolved');
  const btnText = isSolved ? t('section.ctfReplayBtn') : t('section.ctfSolveBtn');

  return `
    <div class="section-ctf-card" id="section-ctf-card" data-ctf-id="${c.id}">
      <div class="section-ctf-header">
        <div class="section-ctf-badge">${badgeTitle}</div>
        <span class="section-ctf-status ${isSolved ? 'solved' : ''}">${statusText}</span>
      </div>
      <div class="section-ctf-body">
        <div class="section-ctf-info">
          <h4 class="section-ctf-title">${_escHtml(title)}</h4>
          <p class="section-ctf-desc">${_escHtml(descSnippet)}</p>
          <div class="section-ctf-tags">
            <span class="badge">${_escHtml(c.category)}</span>
            <span class="badge cyan">${stars}</span>
            <span class="badge green">${c.points} pts</span>
          </div>
        </div>
        <div class="section-ctf-action">
          <button class="section-ctf-btn ${isSolved ? 'btn-replay' : ''}" onclick="openCTF('${c.id}')">
            ${btnText}
          </button>
        </div>
      </div>
    </div>
  `;
}

function goToSectionFromCTF(modId, secId) {
  closeCTFModal();
  navigate('hub', modId, secId);
}

function fillCTFTerminal(payload) {
  const input = document.getElementById('ctf-term-input');
  if (!input) return;
  input.value = payload;
  input.focus();
}

let ctfFilter = 'all';
function renderCTF() {
  const grid = document.getElementById('ctf-grid');
  const filtered = ctfFilter === 'all' ? CTF_CHALLENGES : CTF_CHALLENGES.filter(c => c.category === ctfFilter);
  grid.innerHTML = filtered.map(c => {
    const solved = userProgress.ctfSolved.includes(c.id);
    const stars = Array.from({length:5}, (_,i) => `<span class="${i<c.difficulty?'f':''}">★</span>`).join('');
    return `<div class="ctf-card ${solved?'solved':''}" onclick="openCTF('${c.id}')">
      <div class="ctf-title">${c.title}${(c.codeable||c.category==='Crypto')?' <span style="font-size:9px;opacity:0.5;margin-left:4px">⌨</span>':''}${(c.simulated||c.category==='Web')?' <span style="font-size:9px;opacity:0.5;margin-left:4px">⌐</span>':''}</div>
      <div class="ctf-meta">
        <span class="badge">${c.category}</span>
        <span class="badge cyan diff-stars">${stars}</span>
        <span class="badge green">${c.points} pts</span>
      </div>
    </div>`;
  }).join('');
}
function filterCTF(cat, btn) {
  ctfFilter = cat;
  document.querySelectorAll('#ctf-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCTF();
}
// ── CTF state ──
let ctfHintLevel = 0;
let ctfCurrentChallenge = null;

function openCTF(id) {
  currentCTFId = id;
  ctfHintLevel = 0;
  ctfCurrentChallenge = CTF_CHALLENGES.find(x => x.id === id);
  const c = ctfCurrentChallenge;
  if (!c) return;

  // Prerequisite theory banner
  const prereqWrap = document.getElementById('ctf-prereq-wrap');
  if (prereqWrap) {
    const secId = CTF_SECTION_MAP[c.id];
    let foundMod = null;
    let foundSec = null;
    if (secId && typeof MODULES !== 'undefined') {
      for (const m of MODULES) {
        for (const chap of m.chapters) {
          const s = chap.sections.find(sec => sec.id === secId);
          if (s) {
            foundMod = m;
            foundSec = s;
            break;
          }
        }
        if (foundSec) break;
      }
    }
    if (foundMod && foundSec) {
      const modTitle = getModField(foundMod, 'title');
      const secTitle = getSectionField(foundSec, 'title');
      prereqWrap.innerHTML = `
        <div class="ctf-prereq-banner" onclick="goToSectionFromCTF('${foundMod.id}', '${foundSec.id}')">
          <span class="ctf-prereq-icon">📖</span>
          <span class="ctf-prereq-label">${t('ctf.prereqTheory')}</span>
          <span class="ctf-prereq-link">${_escHtml(modTitle)} / ${_escHtml(secTitle)}</span>
          <span class="ctf-prereq-arrow">▸</span>
        </div>
      `;
    } else {
      prereqWrap.innerHTML = '';
    }
  }

  // Header
  document.getElementById('modal-title').textContent = c.title;
  const stars = Array.from({length:5}, (_,i) => `<span style="color:${i<c.difficulty?'var(--color-green)':'var(--text-muted)'}">★</span>`).join('');
  const cTags = currentLang==='en' && c.tagsEn ? c.tagsEn : (c.tags||[]);
  const tagBadges = cTags.map(t => `<span style="font-size:10px;padding:2px 8px;background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);border-radius:3px;color:var(--text-muted)">${t}</span>`).join('');
  document.getElementById('modal-meta').innerHTML = `<span class="badge">${c.category}</span><span>${stars}</span><span class="badge green">${c.points} pts</span>${tagBadges}`;

  // Description
  document.getElementById('modal-desc').textContent = currentLang==='en' && c.descEn ? c.descEn : c.desc;

  // Hints: progressive
  const hintsEl = document.getElementById('modal-hints');
  const hints = c.hints || [];
  if (hints.length > 0) {
    hintsEl.innerHTML = `<button class="show-hint-btn" onclick="revealCTFHint()">${t('ctf.showHint').replace('{n}', hints.length)}</button><div id="ctf-hints-list"></div>`;
  } else {
    hintsEl.innerHTML = '';
  }

  // Writeup (hidden until solved)
  const writeupEl = document.getElementById('modal-writeup');
  writeupEl.style.display = 'none';
  const writeupText = currentLang==='en' && c.writeupEn ? c.writeupEn : c.writeup;
  if (writeupText) {
    writeupEl.innerHTML = `<div class="ctf-writeup-title">// WRITEUP - ${c.title}</div><div style="white-space:pre-wrap">${esc(writeupText)}</div>`;
    if (userProgress.ctfSolved.includes(c.id)) writeupEl.style.display = 'block';
  } else {
    writeupEl.innerHTML = '';
  }

  // Tabs visibility
  const hasCode = c.codeable || c.category === 'Crypto';
  const hasTerm = c.simulated || c.category === 'Web';
  document.getElementById('ctf-tab-code').style.display = hasCode ? '' : 'none';
  document.getElementById('ctf-tab-terminal').style.display = hasTerm ? '' : 'none';

  // Reset to desc tab
  switchCTFTab('desc');

  // Code editor init
  if (hasCode) {
    const editor = document.getElementById('ctf-code-editor');
    editor.value = c.starterCode || (currentLang === 'en' ? '# Write your Python code here\nprint("Hello CTF")\n' : '# 在这里写你的 Python 代码\nprint("Hello CTF")\n');
    document.getElementById('ctf-code-output').textContent = '';
  }

  // Terminal init & quick payloads
  const pillsEl = document.getElementById('ctf-term-quick-pills');
  if (hasTerm) {
    const term = document.getElementById('ctf-terminal');
    const simWelcome = typeof CLIENT_CTF_SIM !== 'undefined' && ((currentLang === 'en' && CLIENT_CTF_SIM[c.id]?.welcomeEn) ? CLIENT_CTF_SIM[c.id].welcomeEn : CLIENT_CTF_SIM[c.id]?.welcome);
    term.innerHTML = c.termWelcome || (simWelcome ? `<span style="color:#888">${_escHtml(simWelcome).replace(/\n/g, '<br>')}</span>\n` : `<span style="color:#666">${c.title} - ${currentLang==='en'?'Simulated Environment':'模拟环境'}</span>\n<span style="color:#666">${currentLang==='en'?'Enter payload to attack the target.':'输入 payload 来攻击目标。可用的靶机在模拟环境中运行。'}</span>\n\n`);

    if (pillsEl) {
      const payloads = CTF_QUICK_PAYLOADS[c.id] || [];
      if (payloads.length > 0) {
        const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
        pillsEl.innerHTML = `
          <span class="ctf-quick-pills-label">${t('ctf.quickPayloads')}</span>
          ${payloads.map(p => `
            <button class="ctf-quick-pill" type="button" onclick="fillCTFTerminal('${p.payload.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${_escHtml((isEn && p.labelEn) ? p.labelEn : p.label)}</button>
          `).join('')}
        `;
        pillsEl.style.display = 'flex';
      } else {
        pillsEl.innerHTML = '';
        pillsEl.style.display = 'none';
      }
    }
  } else if (pillsEl) {
    pillsEl.innerHTML = '';
    pillsEl.style.display = 'none';
  }

  // Flag input
  document.getElementById('flag-input').value = '';
  document.getElementById('flag-feedback').textContent = '';
  document.getElementById('ctf-modal').classList.add('open');
}

function revealCTFHint() {
  const hints = currentLang==='en' && ctfCurrentChallenge?.hintsEn ? ctfCurrentChallenge.hintsEn : (ctfCurrentChallenge?.hints || []);
  if (ctfHintLevel < hints.length) {
    ctfHintLevel++;
    const list = document.getElementById('ctf-hints-list');
    const div = document.createElement('div');
    div.className = 'ctf-hint-item';
    div.setAttribute('data-hint', ctfHintLevel);
    div.textContent = hints[ctfHintLevel - 1];
    list.appendChild(div);
    const btn = document.querySelector('#modal-hints .show-hint-btn');
    if (ctfHintLevel >= hints.length) {
      btn.textContent = t('ctf.allHintsShown');
      btn.disabled = true;
      btn.style.opacity = '0.5';
    } else {
      btn.textContent = t('ctf.nextHint').replace('{n}', ctfHintLevel).replace('{t}', hints.length);
    }
  }
}

function switchCTFTab(tab) {
  document.querySelectorAll('.ctf-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('ctf-panel-desc').style.display = tab === 'desc' ? '' : 'none';
  document.getElementById('ctf-panel-code').style.display = tab === 'code' ? '' : 'none';
  document.getElementById('ctf-panel-terminal').style.display = tab === 'terminal' ? '' : 'none';
  if (tab === 'terminal') document.getElementById('ctf-term-input').focus();
}

function runCTFCode() {
  const code = document.getElementById('ctf-code-editor').value;
  const output = document.getElementById('ctf-code-output');
  output.innerHTML = '<span style="color:var(--color-cyan)">' + t('code.ctfCompiling') + '</span>';
  fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, lang: ctfCurrentChallenge?.lang || 'Python' })
  }).then(r => r.json()).then(data => {
    if (data.error) {
      output.innerHTML = `<span style="color:var(--color-red)">// Error:</span>\n${esc(data.error)}`;
    } else {
      let text = '';
      if (data.stdout) text += esc(data.stdout);
      if (data.stderr) text += (text ? '\n' : '') + `<span style="color:var(--color-yellow)">// stderr:</span>\n${esc(data.stderr)}`;
      output.innerHTML = text || '<span style="color:var(--text-muted)">' + t('code.noOutput') + '</span>';
    }
  }).catch(() => { output.textContent = t('code.serverError'); });
}

function resetCTFCode() {
  if (ctfCurrentChallenge) {
    document.getElementById('ctf-code-editor').value = ctfCurrentChallenge.starterCode || (currentLang==='en'?'# Write your Python code here\n':'# 在这里写你的 Python 代码\n');
    document.getElementById('ctf-code-output').textContent = '';
  }
}

// ── Client-side CTF Terminal Simulation (for static hosting / GitHub Pages / offline) ──
const CLIENT_CTF_SIM = {
  'ctf-003': { // Login Bypass (SQL Injection)
    welcome: 'SQL Injection Login Bypass - 模拟环境\n目标：绕过登录验证，以 admin 身份登录。\n后端 SQL: SELECT * FROM users WHERE user=\'[INPUT]\' AND pass=\'[PASS]\'\n\n示例输入: admin\' OR \'1\'=\'1\n',
    welcomeEn: 'SQL Injection Login Bypass - Simulated Target\nGoal: Bypass authentication and log in as admin.\nBackend SQL: SELECT * FROM users WHERE user=\'[INPUT]\' AND pass=\'[PASS]\'\n\nExample input: admin\' OR \'1\'=\'1\n',
    respond(input) {
      const user = input.replace(/'/g, "''");
      const fakePass = 's3cur3_p@ss';
      const query = `SELECT * FROM users WHERE user='${user}' AND pass='${fakePass}'`;
      if (/\bOR\b/i.test(query) && (/'1'\s*=\s*'1/i.test(query) || /1\s*=\s*1/i.test(query)) || (/'\s*OR\s*'/i.test(query))) {
        return { output: '<span style="color:#0f0">[SQL] ' + query + '</span>\n<span style="color:#0f0">Query returned 1 row(s)</span>\n<span style="color:#ff0">✓ Login successful! Welcome admin.</span>\n<span style="color:#0f0">flag{sql1_1nj3ct1on_m4st3r}</span>' };
      }
      return { output: '<span style="color:#888">[SQL] ' + query + '</span>\n<span style="color:#888">Query returned 0 row(s)</span>\n<span style="color:#f44">✗ Login failed. Invalid credentials.</span>' };
    }
  },
  'ctf-008': { // Command Injection
    welcome: 'Command Injection 101 - 模拟环境\n目标：通过 ping 工具执行任意命令。\n后端代码: os.system("ping -c 3 " + user_input)\n\n示例输入: 127.0.0.1;ls\n',
    welcomeEn: 'Command Injection 101 - Simulated Target\nGoal: Execute arbitrary commands via the ping utility.\nBackend code: os.system("ping -c 3 " + user_input)\n\nExample input: 127.0.0.1;ls\n',
    respond(input) {
      const parts = input.split(/[;|&\n]/);
      const ip = parts[0].trim();
      let result = '';
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) || ip === 'localhost') {
        result += `<span style="color:#888">PING ${ip}: 3 packets transmitted, 3 received, 0% loss</span>\n`;
      } else if (ip) {
        result += `<span style="color:#f44">ping: ${_escHtml(ip)}: not a valid address</span>\n`;
      }
      for (let i = 1; i < parts.length; i++) {
        const cmd = parts[i].trim();
        if (!cmd) continue;
        if (/ls/i.test(cmd) && !/\/etc/i.test(cmd)) result += '<span style="color:#0ff">flag.txt  index.html  README.md</span>\n';
        else if (/cat\s+flag/i.test(cmd)) result += '<span style="color:#0f0">flag{c0mm4nd_1nj3ct10n_3z}</span>\n';
        else if (/whoami/i.test(cmd)) result += '<span style="color:#0ff">www-data</span>\n';
        else if (/id/i.test(cmd)) result += '<span style="color:#0ff">uid=33(www-data) gid=33(www-data)</span>\n';
        else if (/pwd/i.test(cmd)) result += '<span style="color:#0ff">/var/www/html</span>\n';
        else if (/uname/i.test(cmd)) result += '<span style="color:#0ff">Linux target 5.4.0 x86_64</span>\n';
        else result += `<span style="color:#888">${_escHtml(cmd)}: simulated output</span>\n`;
      }
      return { output: result || '<span style="color:#888">No output.</span>' };
    }
  },
  'ctf-016': { // PHP Type Juggling
    welcome: 'PHP Type Juggling - 模拟环境\n目标：绕过 md5() 弱类型比较。\n后端代码: if (md5($input) == "0e123456789...") grant_access();\n\nPHP 的 == 在比较时会将 "0e123..." 视为科学计数法 0×10^n = 0\n所以任何 md5 值也是 "0e..." 开头的输入都能通过。\n\n示例输入: QNKCDZO (md5 = 0e830400451993494058024219903391)\n',
    welcomeEn: 'PHP Type Juggling - Simulated Target\nGoal: Bypass loose md5() comparison.\nBackend code: if (md5($input) == "0e123456789...") grant_access();\n\nPHP loose equality == treats "0e..." as scientific notation (0 * 10^n = 0).\nAny input whose md5 starts with "0e" followed by digits will match.\n\nExample input: QNKCDZO (md5 = 0e830400451993494058024219903391)\n',
    respond(input) {
      const md5s = { 'QNKCDZO': '0e830400451993494058024219903391', '240610708': '0e462097431906509019562988736854', 'aabg7XSs': '0e087386482136013740957780965295' };
      const hash = md5s[input] || 'a1b2c3d4e5f6';
      if (hash.startsWith('0e') && /^[0-9]+$/.test(hash.slice(2))) {
        return { output: `<span style="color:#888">md5("${_escHtml(input)}") = "${hash}"</span>\n<span style="color:#888">Comparing: "${hash}" == "0e123456789012345678901234567890"</span>\n<span style="color:#ff0">PHP == comparison: 0 == 0 → TRUE</span>\n<span style="color:#0f0">✓ Access granted! Authentication bypassed.</span>\n<span style="color:#0f0">flag{php_l00s3_c0mp4r1s0n}</span>` };
      }
      return { output: `<span style="color:#888">md5("${_escHtml(input)}") = "${hash}"</span>\n<span style="color:#888">Comparing: "${hash}" == "0e123456789..."</span>\n<span style="color:#f44">PHP == comparison: string ≠ scientific → FALSE</span>\n<span style="color:#f44">✗ Access denied.</span>` };
    }
  },
  'ctf-004': { // XSS Hunter
    welcome: 'XSS Hunter - 模拟环境\n目标：构造反射型 XSS Payload 弹出 alert(1)。\n后端代码: document.getElementById("result").textContent = location.search.split("q=")[1]\n\n注意：使用 textContent 回显，不是 innerHTML。需要换一种思路。\n提示：试试 onchange/oninput 事件配合 URL hash。\n\n示例输入: " autofocus onfocus=alert(1) x="\n',
    welcomeEn: 'XSS Hunter - Simulated Target\nGoal: Construct a reflected XSS payload that fires alert(1).\nBackend code: document.getElementById("result").textContent = location.search.split("q=")[1]\n\nNote: Echoed via textContent rather than innerHTML. Think outside the box.\nHint: Try event attributes or URL autofocus payloads.\n\nExample input: " autofocus onfocus=alert(1) x="\n',
    respond(input) {
      if (/on(?:focus|blur|click|mouseover|load|error)\s*=/i.test(input) || /javascript:/i.test(input) || /<svg/i.test(input) || /<img/i.test(input) || /<iframe/i.test(input)) {
        return { output: `<span style="color:#888">[Rendered HTML]:</span>\n<span style="color:#888">&lt;div id="result"&gt;${_escHtml(input)}&lt;/div&gt;</span>\n\n<span style="color:#0f0">✓ XSS triggered! alert(1) fired.</span>\n<span style="color:#0f0">flag{xss_r3fl3ct3d_g0t_m3}</span>` };
      }
      return { output: `<span style="color:#888">[Rendered HTML]:</span>\n<span style="color:#888">&lt;div id="result"&gt;${_escHtml(input)}&lt;/div&gt;</span>\n\n<span style="color:#f44">No XSS triggered. The input was safely rendered.</span>` };
    }
  },
  'ctf-012': { // SSTI Detective
    welcome: 'SSTI Detective - 模拟环境\n目标：利用 Flask/Jinja2 模板注入读取系统信息。\n后端代码: render_template_string("Hello {{ " + name + " }}")\n\n示例输入: {{7*7}}\n',
    welcomeEn: 'SSTI Detective - Simulated Target\nGoal: Exploit Flask/Jinja2 Server-Side Template Injection to read system information.\nBackend code: render_template_string("Hello {{ " + name + " }}")\n\nExample input: {{7*7}}\n',
    respond(input) {
      if (/{{.*?7\s*\*\s*7.*?}}/.test(input) || /{{.*?config.*?}}/.test(input)) {
        return { output: `<span style="color:#888">[Template]: Hello ${_escHtml(input)}</span>\n<span style="color:#0ff">[Rendered]: Hello 49</span>\n\n<span style="color:#ff0">⚠ Template injection confirmed! Expression evaluated.</span>\n<span style="color:#888">Try chaining: {{ config.items() }} or {{ "".__class__.__mro__ }}</span>` };
      }
      if (/__class__/i.test(input) || /__mro__/i.test(input) || /__subclasses__/i.test(input) || /__builtins__/i.test(input) || /popen/i.test(input)) {
        return { output: `<span style="color:#888">[Template]: Hello ${_escHtml(input)}</span>\n<span style="color:#0f0">[Rendered]: Hello &lt;class 'object'&gt;...</span>\n\n<span style="color:#0f0">✓ SSTI chain executed! You got access to __builtins__.</span>\n<span style="color:#0f0">flag{j1nj4_2_t3mpl4t3_1nj3ct10n}</span>` };
      }
      if (/{{/.test(input) && /}}/.test(input)) {
        return { output: `<span style="color:#888">[Template]: Hello ${_escHtml(input)}</span>\n<span style="color:#888">[Rendered]: Hello ${_escHtml(input)}</span>\n\n<span style="color:#ff0">Template syntax detected but no evaluation. Keep exploring...</span>` };
      }
      return { output: `<span style="color:#888">[Template]: Hello ${_escHtml(input)}</span>\n<span style="color:#888">[Rendered]: Hello ${_escHtml(input)}</span>\n\n<span style="color:#888">Normal text output. No template injection detected.</span>` };
    }
  },
  'ctf-019': { // File Upload Bypass (simulated uploader)
    welcome: 'Image Upload Service v1.0 - 模拟环境\n只允许上传图片（jpg/jpeg/png/gif），扩展名走黑名单过滤。\n输入文件名尝试上传，例如: shell.php\n目标: 绕过过滤拿到 webshell 并 cat /flag.txt\n',
    welcomeEn: 'Image Upload Service v1.0 - Simulated Target\nOnly images allowed (jpg/jpeg/png/gif). Extension checked against a blacklist.\nEnter a filename to upload, e.g.: shell.php\nGoal: Bypass filtering to gain webshell execution and read /flag.txt\n',
    respond(input) {
      const name = input.trim();
      if (!name || /\s/.test(name)) {
        return { output: '<span style="color:#f44">Usage: 输入一个文件名，例如 shell.php</span>' };
      }
      if (/\.php$/.test(name)) {
        return { output: `<span style="color:#f44">[!] Upload failed: extension '.php' is blacklisted</span>\n<span style="color:#888">提示：黑名单只匹配了字面 .php —— 大小写变体和 PHP 的别名扩展呢？</span>` };
      }
      if (/\.php\d?\.(jpg|jpeg|png|gif)$/i.test(name)) {
        return { output: `<span style="color:#ff0">[√] ${_escHtml(name)} 已保存，但服务器按最后的 .jpg 解析 —— 双扩展名在这里不生效</span>\n<span style="color:#888">试试 PHP 本身的别名扩展</span>` };
      }
      if (/\.(phtml|phar|php5|pht)$/i.test(name) || /\.pHp$/.test(name)) {
        return { output: `<span style="color:#0f0">[√] ${_escHtml(name)} 上传成功！黑名单没有覆盖这个扩展名</span>\n<span style="color:#888">$ curl https://target/uploads/${_escHtml(name)}?cmd=cat%20/flag.txt</span>\n<span style="color:#0f0">&lt;?php system($_GET['cmd']); ?&gt; → 执行成功</span>\n<span style="color:#0f0">flag{upl04d_byp4ss_m4st3r}</span>` };
      }
      if (/\.(jpg|jpeg|png|gif)$/i.test(name)) {
        return { output: `<span style="color:#888">[√] ${_escHtml(name)} 上传成功（但它只是一张图片...）</span>` };
      }
      return { output: `<span style="color:#888">${_escHtml(name)}: 已提交给过滤器。观察它的反应，逐步试探黑名单边界。</span>` };
    }
  },
  'ctf-020': { // SSRF 101 (simulated URL fetcher)
    welcome: 'URL Fetcher - 模拟环境\n服务器会代你请求任意 URL 并回显内容（curl_exec($url)，无内网限制）。\n已知 flag 位于内网 http://localhost:8080/flag.txt\n输入 URL 开始探测，例如: http://example.com\n',
    welcomeEn: 'URL Fetcher - Simulated Target\nServer will fetch arbitrary URLs and display content (curl_exec($url)).\nKnown flag location: internal service at http://localhost:8080/flag.txt\nEnter a URL to begin probing, e.g.: http://example.com\n',
    respond(input) {
      const url = input.trim();
      if (!url || !/^[a-z]+:\/\//i.test(url)) {
        return { output: '<span style="color:#f44">Usage: 输入完整 URL（含协议）</span>' };
      }
      const low = url.toLowerCase();
      const isLocal = /(^|\/\/|@)(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0|0x7f000001|2130706433)(:\d+)?/.test(low);
      if (low.startsWith('file://')) {
        return { output: `<span style="color:#ff0">[协议走私] file:// 被服务器执行了！</span>\n<span style="color:#888">root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:...</span>\n<span style="color:#ff0">你能读本地文件了 —— 但 flag 在另一台内网服务的 HTTP 端口上</span>` };
      }
      if (isLocal && low.includes('flag.txt')) {
        return { output: `<span style="color:#888">HTTP/1.1 200 OK</span>\n<span style="color:#888">Content-Type: text/plain</span>\n\n<span style="color:#0f0">flag{ssrf_l0c4lh0st_pwn3d}</span>\n\n<span style="color:#0f0">✓ SSRF 命中内网服务！</span>` };
      }
      if (isLocal) {
        return { output: `<span style="color:#888">HTTP/1.1 200 OK</span>\n<span style="color:#888">Content-Type: text/html</span>\n\n&lt;h1&gt;Internal Admin Panel&lt;/h1&gt;\n&lt;a href="/flag.txt"&gt;flag.txt (24 bytes)&lt;/a&gt;\n\n<span style="color:#ff0">发现内网服务 —— 目录里有个 flag.txt</span>` };
      }
      if (low.startsWith('http')) {
        return { output: `<span style="color:#888">HTTP/1.1 200 OK</span>\n<span style="color:#888">&lt;html&gt;&lt;body&gt;External page fetched.&lt;/body&gt;&lt;/html&gt;</span>\n<span style="color:#888">外网能通。但 flag 不在外面 —— 想想这个功能还能让服务器访问哪里？</span>` };
      }
      return { output: `<span style="color:#888">${_escHtml(url)}: 服务器尝试请求了。除了 http:// 还有 file:// gopher:// dict:// ...</span>` };
    }
  }
};

async function sendCTFTerminal() {
  const input = document.getElementById('ctf-term-input');
  const term = document.getElementById('ctf-terminal');
  const cmd = input.value.trim();
  if (!cmd) return;
  input.value = '';

  term.innerHTML += `<span style="color:var(--color-cyan)">$ ${esc(cmd)}</span>\n`;
  userProgress.commandCount = (userProgress.commandCount || 0) + 1;
  if (typeof checkAndUnlockAchievements === 'function') checkAndUnlockAchievements('command');

  try {
    const resp = await fetch('/api/ctf-sim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: currentCTFId, input: cmd })
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (data.output) {
      term.innerHTML += data.output + '\n';
    } else {
      term.innerHTML += `<span style="color:var(--color-red)">${esc(data.error || 'Unknown error')}</span>\n`;
    }
  } catch {
    const sim = typeof CLIENT_CTF_SIM !== 'undefined' && CLIENT_CTF_SIM[currentCTFId];
    if (sim) {
      const result = sim.respond(cmd);
      if (result && result.output) {
        term.innerHTML += result.output + '\n';
      } else {
        term.innerHTML += `<span style="color:var(--color-red)">${esc(result?.error || 'Unknown error')}</span>\n`;
      }
    } else {
      term.innerHTML += '<span style="color:var(--color-red)">' + t('ctf.simError') + '</span>\n';
    }
  }
  term.scrollTop = term.scrollHeight;
}

function closeCTFModal() { document.getElementById('ctf-modal').classList.remove('open'); }

async function submitFlag() {
  const input = document.getElementById('flag-input').value.trim();
  const fb = document.getElementById('flag-feedback');
  if (!input) { fb.textContent = t('ctf.enterFlag'); fb.style.color = 'var(--color-red)'; return; }
  const c = CTF_CHALLENGES.find(x => x.id === currentCTFId);
  if (!c) return;
  if (await verifyFlagHash(currentCTFId, input)) {
    fb.textContent = t('ctf.correct');
    fb.style.color = 'var(--color-green)';
    userProgress.commandCount = (userProgress.commandCount || 0) + 1;
    if (!userProgress.ctfSolved.includes(c.id)) {
      userProgress.ctfSolved.push(c.id);
      recordActiveDay();
      userProgress.timeline.unshift({ date: new Date().toISOString().split('T')[0], text: 'CTF Solved: ' + c.title });
      userProgress.timeline = userProgress.timeline.slice(0, 50);
      saveProgress();
    }
    // Show writeup if available
    if (c.writeup) {
      document.getElementById('modal-writeup').style.display = 'block';
      switchCTFTab('desc');
    }
    if (typeof triggerCyberCelebration === 'function') {
      triggerCyberCelebration('ctf');
    } else {
      spawnConfetti();
    }
    if (typeof checkAndUnlockAchievements === 'function') checkAndUnlockAchievements('ctf');
    renderCTF();
    updateStatusBar();
    if (typeof renderAgentProfile === 'function' && currentView === 'progress') renderAgentProfile();
  } else {
    fb.textContent = t('ctf.wrong');
    fb.style.color = 'var(--color-red)';
    document.getElementById('flag-input').style.animation = 'none';
    document.getElementById('flag-input').offsetHeight;
    document.getElementById('flag-input').style.animation = 'shake 0.3s ease';
  }
}

// ── CTF answer verification (SHA-256 of normalized input) ────
// Answers never ship as plaintext: flags-hash.js holds digests only.
// Normalization must stay identical to server.js / scripts/gen-flag-hashes.js.
function normalizeFlagInput(s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); }

async function verifyFlagHash(challengeId, input) {
  const expected = typeof FLAG_HASHES === 'undefined' ? null : FLAG_HASHES[challengeId];
  if (!expected) return false;
  // WebCrypto's SubtleCrypto requires a secure context — true for
  // https://, http://localhost and file:// openings, i.e. every mode the
  // app officially supports.
  if (!window.isSecureContext || !crypto || !crypto.subtle) {
    console.warn('[CTF] WebCrypto unavailable — cannot verify flag here.');
    return false;
  }
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeFlagInput(input)));
  const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === expected;
}
function spawnConfetti() {
  const colors = ['#00ff41','#00e5ff','#00ff88','#b388ff','#ff4466'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;width:8px;height:8px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${40+Math.random()*20}%;top:-10px;z-index:99999;pointer-events:none;clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%);animation:confetti-fall ${1.5+Math.random()*2}s ease-out forwards;animation-delay:${Math.random()*0.4}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

// ============================================================
// PRACTICE
// ============================================================
let cmEditor = null;
const CM_MODE_MAP = { 'Python': 'python', 'JavaScript': 'javascript', 'C': 'text/x-csrc', 'Bash': 'shell', 'SQL': 'text/x-sql' };

function initCodeMirror() {
  const ta = document.getElementById('code-editor');
  if (!ta || typeof CodeMirror === 'undefined') return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  cmEditor = CodeMirror.fromTextArea(ta, {
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: false,
    theme: isLight ? 'eclipse' : 'material-darker',
    extraKeys: { Tab: function(cm) { cm.replaceSelection('    ', 'end'); } }
  });
  cmEditor.setSize('100%', 'auto');
}

function renderPractice(idx) {
  currentPracticeIdx = idx;
  const p = PRACTICES[idx];
  if (!p) return;
  const pTitle = currentLang==='en' && p.titleEn ? p.titleEn : p.title;
  const pCat = currentLang==='en' && p.categoryEn ? p.categoryEn : p.category;
  const pQ = currentLang==='en' && p.questionEn ? p.questionEn : p.question;
  document.getElementById('practice-title').textContent = pTitle;
  document.getElementById('practice-counter').textContent = t('practice.counter').replace('{n}', idx + 1).replace('{t}', PRACTICES.length);
  document.getElementById('practice-counter-btm').textContent = t('practice.counter').replace('{n}', idx + 1).replace('{t}', PRACTICES.length);
  // 控制翻题按钮可见性（仅顶部）
  const isFirst = idx === 0, isLast = idx === PRACTICES.length - 1;
  document.getElementById('btn-prev-top').style.display = isFirst ? 'none' : '';
  document.getElementById('btn-next-top').style.display = isLast ? 'none' : '';
  document.getElementById('practice-meta').innerHTML = `<span class="badge">${pCat}</span><span class="badge cyan">${t('practice.difficulty')}: ${'★'.repeat(p.difficulty)}${'☆'.repeat(5-p.difficulty)}</span>`;
  document.getElementById('practice-question').textContent = pQ;
  const starterCode = currentLang==='en' && p.starterEn ? p.starterEn : p.starter;
  if (cmEditor) {
    cmEditor.setOption('mode', CM_MODE_MAP[p.lang] || 'python');
    cmEditor.setValue(starterCode);
    setTimeout(() => cmEditor.refresh(), 50);
  } else {
    document.getElementById('code-editor').value = starterCode;
  }
  document.getElementById('editor-lang').textContent = p.lang;
  document.getElementById('code-output').textContent = t('practice.clickRun');
  document.getElementById('practice-hint-box').style.display = 'none';
  updateSidebar();
}
function runCode() {
  const output = document.getElementById('code-output');
  const p = PRACTICES[currentPracticeIdx];
  if (!p) return;
  userProgress.commandCount = (userProgress.commandCount || 0) + 1;
  saveProgress();
  if (typeof checkAndUnlockAchievements === 'function') checkAndUnlockAchievements('command');
  const code = cmEditor ? cmEditor.getValue() : document.getElementById('code-editor').value;
  const lang = p.lang || 'Python';
  output.innerHTML = '<div style="color:var(--color-cyan);font-size:12px">' + t('code.compiling') + '<span class="spin">...</span></div>';

  fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, lang })
  }).then(r => r.json()).then(data => {
    if (data.error) {
      output.innerHTML = '<div style="color:var(--color-red);font-size:12px">' + t('code.runError') + '</div><pre style="color:var(--color-red);font-size:12px;white-space:pre-wrap;margin:4px 0;font-family:var(--font-mono)">' + esc(data.error) + '</pre>';
      const tests = PRACTICE_TESTS[p.id];
      if (tests?.expected) output.innerHTML += '<div style="color:var(--color-yellow);font-size:12px;margin-top:8px">' + t('code.expectedRef') + '</div><pre style="font-size:12px;white-space:pre-wrap;margin:4px 0;color:var(--text-dim);font-family:var(--font-mono)">' + esc(tests.expected) + '</pre>';
    } else {
      let html = '';
      if (data.stdout) html += '<pre style="color:var(--color-green);font-size:12px;white-space:pre-wrap;margin:4px 0;font-family:var(--font-mono)">' + esc(data.stdout) + '</pre>';
      if (data.stderr) html += '<div style="color:var(--color-yellow);font-size:11px;margin-top:2px">// stderr:</div><pre style="color:var(--text-dim);font-size:11px;white-space:pre-wrap;margin:4px 0;font-family:var(--font-mono)">' + esc(data.stderr) + '</pre>';
      const tests = PRACTICE_TESTS[p.id];
      if (tests?.expected && data.stdout) {
        const trimmed = data.stdout.trim();
        const expected = tests.expected.trim();
        if (trimmed === expected || tests.cases?.some(c => trimmed === c.output)) {
          html += '<div style="color:var(--color-green);font-size:12px;margin-top:8px;font-weight:500">' + t('code.matchOk') + '</div>';
        } else {
          html += '<div style="color:var(--color-yellow);font-size:12px;margin-top:8px">' + t('code.expectedRef') + '</div><pre style="font-size:12px;white-space:pre-wrap;margin:4px 0;color:var(--text-dim);font-family:var(--font-mono)">' + esc(expected) + '</pre>';
        }
      }
      output.innerHTML = html || '<div style="color:var(--text-dim);font-size:12px">' + t('code.noOutput') + '</div>';
    }
  }).catch(() => {
    const tests = PRACTICE_TESTS[p.id];
    output.innerHTML = '<div style="color:var(--color-cyan);font-weight:600;font-size:12px">' + t('code.selfTest') + '</div>' +
      '<div style="color:var(--text-dim);font-size:12px;margin-bottom:8px">' + t('code.selfTestDesc').replace('{lang}', lang) + '</div>' +
      '<div style="color:var(--color-green);font-size:12px;margin-bottom:4px">' + t('code.expectedOutput') + '</div>' +
      '<pre style="color:var(--text-main);padding:8px;background:rgba(0,255,65,0.05);border:1px solid var(--border-subtle);font-size:12px;margin-bottom:12px;white-space:pre-wrap;font-family:var(--font-mono)">' + esc(tests?.expected || p.expected || t('code.runCodeCompare')) + '</pre>' +
      (tests?.cases?.length ? '<div style="color:var(--color-yellow);font-size:12px;margin-bottom:4px">' + t('code.testCases') + '</div>' +
        tests.cases.map((tc, i) => '<div style="padding:4px 0;font-size:12px;color:var(--text-dim)"><span style="color:var(--color-cyan)">' + t('code.case').replace('{n}', i+1) + ':</span> ' + t('code.input') + ' <code style="color:var(--color-green)">' + esc(tc.input||'') + '</code> → ' + esc(tc.output||tc.hint||'') + '</div>').join('') : '');
  });
}
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function showPracticeHint() {
  const box = document.getElementById('practice-hint-box');
  const p = PRACTICES[currentPracticeIdx];
  const pHint = currentLang==='en' && p?.hintEn ? p.hintEn : (p?.hint || t('practice.noHint'));
  box.innerHTML = '<strong>' + t('practice.hintLabel') + '</strong>' + pHint;
  box.style.display = 'block';
}
function switchPractice(idx) { renderPractice(idx); }
function prevPractice() { renderPractice(Math.max(0, currentPracticeIdx - 1)); }
function nextPractice() { renderPractice(Math.min(PRACTICES.length - 1, currentPracticeIdx + 1)); }

// ============================================================
// GAMIFICATION: RANKS, EXP, ACHIEVEMENTS & CELEBRATION
// ============================================================

const AGENT_RANKS = [
  {
    level: 1,
    id: 'script_kiddie',
    titleZh: '脚本小子',
    titleEn: 'Script Kiddie',
    subtitleZh: '初探黑客门径 // Initial Access',
    subtitleEn: 'Initial Access // Recon Learner',
    minExp: 0,
    maxExp: 499,
    clearanceZh: '等级 1 · 公开访问',
    clearanceEn: 'Level 1 · Public Clearance',
    color: '#8890a0',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>'
  },
  {
    level: 2,
    id: 'security_enthusiast',
    titleZh: '安全狂热者',
    titleEn: 'Security Enthusiast',
    subtitleZh: '网络巡检与基础协议 // Recon Operator',
    subtitleEn: 'Recon Operator // Protocol Auditor',
    minExp: 500,
    maxExp: 1999,
    clearanceZh: '等级 2 · 受限访问',
    clearanceEn: 'Level 2 · Restricted Clearance',
    color: '#00e5ff',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
  },
  {
    level: 3,
    id: 'junior_pentester',
    titleZh: '渗透先锋',
    titleEn: 'Junior Pentester',
    subtitleZh: '漏洞攻坚与靶机突破 // Exploit Specialist',
    subtitleEn: 'Exploit Specialist // Vulnerability Hunter',
    minExp: 2000,
    maxExp: 4499,
    clearanceZh: '等级 3 · 保密许可',
    clearanceEn: 'Level 3 · Confidential Access',
    color: '#00ff41',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'
  },
  {
    level: 4,
    id: 'cyber_specialist',
    titleZh: '资深安全专家',
    titleEn: 'Cyber Specialist',
    subtitleZh: '红蓝对抗与全栈防御 // Red Team Specialist',
    subtitleEn: 'Red Team Specialist // Full-Stack Defense',
    minExp: 4500,
    maxExp: 7999,
    clearanceZh: '等级 4 · 机密权限',
    clearanceEn: 'Level 4 · Secret Clearance',
    color: '#b388ff',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
  },
  {
    level: 5,
    id: 'elite_operative',
    titleZh: '传奇领航特工',
    titleEn: 'Elite Operative',
    subtitleZh: '全域渗透与赛博宗师 // Ghost in the Shell',
    subtitleEn: 'Ghost in the Shell // Apex Predator',
    minExp: 8000,
    maxExp: Infinity,
    clearanceZh: '等级 5 · 绝密领航',
    clearanceEn: 'Level 5 · Top Secret / SCI',
    color: '#ffd700',
    iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
  }
];

const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    icon: '🩸',
    titleKey: 'ach.first_blood.title',
    descKey: 'ach.first_blood.desc',
    check: (up) => (up.ctfSolved || []).length >= 1,
    progress: (up) => ({ current: Math.min(1, (up.ctfSolved || []).length), total: 1 })
  },
  {
    id: 'scholar',
    icon: '📜',
    titleKey: 'ach.scholar.title',
    descKey: 'ach.scholar.desc',
    check: (up) => (up.completedSections || []).length >= 5,
    progress: (up) => ({ current: Math.min(5, (up.completedSections || []).length), total: 5 })
  },
  {
    id: 'web_hacker',
    icon: '🌐',
    titleKey: 'ach.web_hacker.title',
    descKey: 'ach.web_hacker.desc',
    check: (up) => (up.completedSections || []).filter(s => s.startsWith('web-')).length >= 3,
    progress: (up) => ({ current: Math.min(3, (up.completedSections || []).filter(s => s.startsWith('web-')).length), total: 3 })
  },
  {
    id: 'crypto_breaker',
    icon: '🔐',
    titleKey: 'ach.crypto_breaker.title',
    descKey: 'ach.crypto_breaker.desc',
    check: (up) => (up.completedSections || []).filter(s => s.startsWith('crypto-')).length >= 3 || (up.ctfSolved || []).some(id => ['ctf-002','ctf-004','ctf-017'].includes(id)),
    progress: (up) => {
      const c = (up.completedSections || []).filter(s => s.startsWith('crypto-')).length;
      return { current: Math.min(3, c), total: 3 };
    }
  },
  {
    id: 'terminal_guru',
    icon: '⚡',
    titleKey: 'ach.terminal_guru.title',
    descKey: 'ach.terminal_guru.desc',
    check: (up) => (up.commandCount || 0) >= 10,
    progress: (up) => ({ current: Math.min(10, up.commandCount || 0), total: 10 })
  },
  {
    id: 'flag_hunter',
    icon: '🚩',
    titleKey: 'ach.flag_hunter.title',
    descKey: 'ach.flag_hunter.desc',
    check: (up) => (up.ctfSolved || []).length >= 5,
    progress: (up) => ({ current: Math.min(5, (up.ctfSolved || []).length), total: 5 })
  },
  {
    id: 'unstoppable',
    icon: '🔥',
    titleKey: 'ach.unstoppable.title',
    descKey: 'ach.unstoppable.desc',
    check: (up) => (up.streak || 0) >= 3,
    progress: (up) => ({ current: Math.min(3, up.streak || 0), total: 3 })
  },
  {
    id: 'cyber_polymath',
    icon: '👑',
    titleKey: 'ach.cyber_polymath.title',
    descKey: 'ach.cyber_polymath.desc',
    check: (up) => {
      const done = up.completedSections || [];
      const prefixes = ['prog-', 'net-', 'crypto-', 'web-', 'pentest-', 'malware-', 'ctf-'];
      return prefixes.every(p => done.some(s => s.startsWith(p)));
    },
    progress: (up) => {
      const done = up.completedSections || [];
      const prefixes = ['prog-', 'net-', 'crypto-', 'web-', 'pentest-', 'malware-', 'ctf-'];
      const c = prefixes.filter(p => done.some(s => s.startsWith(p))).length;
      return { current: c, total: 7 };
    }
  }
];

function calculateUserEXP() {
  const secCount = (userProgress.completedSections || []).length;
  const ctfCount = (userProgress.ctfSolved || []).length;
  const streak = userProgress.streak || 0;
  const cmdCount = userProgress.commandCount || 0;
  return (secCount * 100) + (ctfCount * 250) + (Math.min(streak, 10) * 50) + (Math.min(cmdCount, 30) * 10);
}

function getUserRank(exp) {
  if (typeof exp === 'undefined') exp = calculateUserEXP();
  let rank = AGENT_RANKS[0];
  let nextRank = AGENT_RANKS[1];
  for (let i = 0; i < AGENT_RANKS.length; i++) {
    if (exp >= AGENT_RANKS[i].minExp) {
      rank = AGENT_RANKS[i];
      nextRank = AGENT_RANKS[i + 1] || null;
    }
  }
  let pct = 100;
  let expToNext = 0;
  if (nextRank) {
    const range = nextRank.minExp - rank.minExp;
    const curr = exp - rank.minExp;
    pct = Math.min(100, Math.max(0, Math.round((curr / range) * 100)));
    expToNext = nextRank.minExp - exp;
  }
  return { rank, nextRank, exp, progressPct: pct, expToNext };
}

function getCombatThreatIndex() {
  const exp = calculateUserEXP();
  const ctfFactor = (userProgress.ctfSolved || []).length * 40;
  const secFactor = (userProgress.completedSections || []).length * 15;
  const base = (exp === 0 && ctfFactor === 0 && secFactor === 0) ? 0 : 350 + Math.round(exp * 0.8) + ctfFactor + secFactor;
  return base.toLocaleString();
}

function renderAgentProfile() {
  const wrap = document.getElementById('agent-profile-wrap');
  if (!wrap) return;

  const rankInfo = getUserRank();
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const rank = rankInfo.rank;
  const next = rankInfo.nextRank;

  const title = isEn ? rank.titleEn : rank.titleZh;
  const subtitle = isEn ? rank.subtitleEn : rank.subtitleZh;
  const clearance = isEn ? rank.clearanceEn : rank.clearanceZh;
  const codename = userProgress.agentName || 'OPERATIVE #1337';
  const unlockedBadgesCount = (userProgress.unlockedBadges || []).length;
  const threatIndex = getCombatThreatIndex();

  let expNotice = '';
  if (next) {
    const nextTitle = isEn ? next.titleEn : next.titleZh;
    expNotice = `${t('rank.nextLevel')}: <span style="color:var(--text-main);font-weight:600">${nextTitle}</span> (-${rankInfo.expToNext} EXP)`;
  } else {
    expNotice = `<span style="color:var(--color-yellow);font-weight:700">★ ${t('rank.maxRank')}</span>`;
  }

  wrap.innerHTML = `
    <div class="agent-profile-card" style="--rank-accent:${rank.color}">
      <div class="agent-avatar-col">
        <div class="agent-avatar-frame" title="AGENT BADGE">
          ${rank.iconSvg}
        </div>
        <div class="agent-level-badge">LV.${rank.level}</div>
      </div>
      <div class="agent-info-col">
        <div class="agent-header-row">
          <div class="agent-codename">
            <span id="agent-codename-text">${esc(codename)}</span>
            <button class="agent-edit-btn" onclick="editAgentCodename()" title="${t('rank.editName')}" aria-label="${t('rank.editName')}">✎</button>
          </div>
          <div class="agent-clearance-pill">${clearance}</div>
        </div>
        <div class="agent-rank-title-row">
          <span class="agent-rank-title">${title.toUpperCase()}</span>
          <span class="agent-rank-subtitle">// ${subtitle}</span>
        </div>
        <div class="agent-exp-bar-wrap">
          <div class="agent-exp-labels">
            <span>${t('rank.exp')}: <span class="exp-val">${rankInfo.exp} EXP</span></span>
            <span>${expNotice}</span>
          </div>
          <div class="agent-exp-track">
            <div class="agent-exp-fill" style="width:${rankInfo.progressPct}%"></div>
          </div>
        </div>
      </div>
      <div class="agent-metrics-col">
        <div class="agent-metric-box">
          <div class="agent-metric-val">${threatIndex}</div>
          <div class="agent-metric-label">${t('rank.threatIndex')}</div>
        </div>
        <div class="agent-metric-box">
          <div class="agent-metric-val" style="color:var(--color-green)">${unlockedBadgesCount} / ${ACHIEVEMENTS.length}</div>
          <div class="agent-metric-label">${t('rank.badgesUnlocked')}</div>
        </div>
      </div>
    </div>
  `;
}

function editAgentCodename() {
  const current = userProgress.agentName || 'OPERATIVE #1337';
  const nextName = prompt(t('rank.enterName'), current);
  if (nextName !== null) {
    const trimmed = nextName.trim().slice(0, 16);
    if (trimmed) {
      userProgress.agentName = trimmed;
      saveProgress();
      renderAgentProfile();
      updateStatusBar();
    }
  }
}

function renderBadges() {
  const grid = document.getElementById('badges-grid');
  const counter = document.getElementById('badges-counter');
  if (!grid) return;

  const unlocked = userProgress.unlockedBadges || [];
  if (counter) counter.textContent = `${unlocked.length} / ${ACHIEVEMENTS.length}`;

  grid.innerHTML = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    const prog = ach.progress ? ach.progress(userProgress) : { current: isUnlocked ? 1 : 0, total: 1 };
    const pct = prog.total ? Math.min(100, Math.round((prog.current / prog.total) * 100)) : (isUnlocked ? 100 : 0);
    const title = t(ach.titleKey);
    const desc = t(ach.descKey);
    const statusText = isUnlocked ? t('badges.unlocked') : t('badges.locked');

    return `
      <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}" id="badge-card-${ach.id}">
        <div class="badge-top-row">
          <div class="badge-icon-wrap">${ach.icon}</div>
          <div class="badge-status-pill">${statusText}</div>
        </div>
        <div class="badge-name">${esc(title)}</div>
        <div class="badge-desc">${esc(desc)}</div>
        <div class="badge-progress-wrap">
          <div class="badge-progress-text">
            <span>${prog.current} / ${prog.total}</span>
            <span>${pct}%</span>
          </div>
          <div class="badge-progress-track">
            <div class="badge-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

let toastTimer = null;
function showAchievementToast(ach) {
  const toast = document.getElementById('achievement-toast');
  if (!toast) return;

  const title = t(ach.titleKey);
  const desc = t(ach.descKey);

  toast.innerHTML = `
    <div class="toast-icon">${ach.icon}</div>
    <div class="toast-body">
      <div class="toast-header-tag">${t('badges.toastHeader')}</div>
      <div class="toast-title">${esc(title)}</div>
      <div class="toast-desc">${esc(desc)}</div>
    </div>
    <button class="toast-close-btn" onclick="closeAchievementToast()" aria-label="Close">✕</button>
  `;

  toast.classList.remove('hidden', 'toast-hiding');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    closeAchievementToast();
  }, 4500);
}

function closeAchievementToast() {
  const toast = document.getElementById('achievement-toast');
  if (!toast || toast.classList.contains('hidden')) return;
  toast.classList.add('toast-hiding');
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('toast-hiding');
  }, 320);
}

function checkAndUnlockAchievements(source) {
  if (!Array.isArray(userProgress.unlockedBadges)) userProgress.unlockedBadges = [];
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(ach => {
    if (!userProgress.unlockedBadges.includes(ach.id)) {
      if (ach.check(userProgress)) {
        userProgress.unlockedBadges.push(ach.id);
        newlyUnlocked.push(ach);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    saveProgress();
    newlyUnlocked.forEach((ach, index) => {
      setTimeout(() => {
        showAchievementToast(ach);
      }, index * 1200);
    });
    if (currentView === 'progress') {
      renderProgress();
    }
    updateStatusBar();
  }
}

// ============================================================
// CANVAS CELEBRATION & FLOW STATE PARTICLES
// ============================================================
let celebrationAnimId = null;
function triggerCyberCelebration(type) {
  const isReduced = document.documentElement.classList.contains('reduced-motion') ||
    (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const locEl = document.getElementById('status-loc');
  if (locEl) {
    const originalText = locEl.textContent;
    locEl.textContent = type === 'ctf' ? t('celebration.compromised') : t('celebration.secComplete');
    locEl.style.color = 'var(--color-green)';
    locEl.style.fontWeight = '700';
    setTimeout(() => {
      locEl.textContent = originalText;
      locEl.style.color = '';
      locEl.style.fontWeight = '';
    }, 2800);
  }

  if (isReduced) return;

  const canvas = document.getElementById('celebration-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
  canvas.style.display = 'block';

  if (celebrationAnimId) cancelAnimationFrame(celebrationAnimId);

  const colors = ['#00ff41', '#00e5ff', '#b388ff', '#ffd700', '#39ff14'];
  const textTokens = ['0', '1', 'ROOT', 'FLAG', '0x90', 'PWN', 'OK', 'ACCESS'];
  const particleCount = 100;
  const particles = [];

  const originX = W / 2;
  const originY = H * 0.45;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 12;
    const isText = Math.random() < 0.35;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      gravity: 0.18,
      friction: 0.985,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.012 + Math.random() * 0.015,
      isText: isText,
      token: textTokens[Math.floor(Math.random() * textTokens.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2
    });
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    let active = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0.01) continue;
      active++;

      p.vx *= p.friction;
      p.vy = (p.vy + p.gravity) * p.friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.alpha = Math.max(0, p.alpha - p.decay);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.isText) {
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillText(p.token, -ctx.measureText(p.token).width / 2, 4);
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    if (active > 0) {
      celebrationAnimId = requestAnimationFrame(frame);
    } else {
      canvas.style.display = 'none';
      celebrationAnimId = null;
    }
  }

  celebrationAnimId = requestAnimationFrame(frame);
}

// ============================================================
// PROGRESS
// ============================================================
let radarChart = null;
function renderProgress() {
  recalcModuleProgress();
  renderAgentProfile();
  renderBadges();
  updateStatusBar();
  const total = MODULES.flatMap(m => m.chapters.flatMap(c => c.sections)).length;
  const done = userProgress.completedSections.length;
  const pct = total ? Math.round(done / total * 100) : 0;

  document.getElementById('progress-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-label">${t('progress.completed')}</div><div class="stat-card-value" style="color:var(--color-green)">${done}</div><div class="stat-card-sub">${t('progress.total').replace('{n}', total)}</div></div>
    <div class="stat-card"><div class="stat-card-label">${t('progress.overall')}</div><div class="stat-card-value" style="color:var(--color-cyan)">${pct}%</div><div class="stat-card-sub">${t('progress.overallSub')}</div></div>
    <div class="stat-card"><div class="stat-card-label">${t('progress.ctfSolved')}</div><div class="stat-card-value" style="color:var(--color-green)">${userProgress.ctfSolved.length}</div><div class="stat-card-sub">${t('progress.ctfTotal').replace('{n}', CTF_CHALLENGES.length)}</div></div>
    <div class="stat-card"><div class="stat-card-label">${t('progress.streak')}</div><div class="stat-card-value" style="color:var(--color-yellow)">${userProgress.streak}</div><div class="stat-card-sub">${t('progress.days')}</div></div>`;

  document.getElementById('module-prog-list').innerHTML = MODULES.map(m => {
    const p = userProgress.moduleProgress[m.id] || 0;
    return `<div><div class="prog-item-label"><span>${getModuleIconSvg(m.id, m.icon)} ${getModField(m,'title')}</span><span>${p}%</span></div>
    <div class="prog-bar"><div class="prog-fill" style="width:${p}%"></div></div></div>`;
  }).join('');

  const canvas = document.getElementById('radar-chart');
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  if (typeof Chart !== 'undefined') {
    radarChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: MODULES.map(m => getModField(m,'title')),
      datasets: [{
        label: t('progress.proficiency'),
        data: MODULES.map(m => userProgress.moduleProgress[m.id] || 0),
        backgroundColor: 'rgba(0,255,65,0.08)',
        borderColor: 'rgba(0,255,65,0.6)',
        pointBackgroundColor: '#00ff41',
        pointBorderColor: '#00ff41',
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.06)' }, angleLines: { color: 'rgba(255,255,255,0.06)' }, pointLabels: { color: '#8890a0', font: { size: 10, family: "'JetBrains Mono', monospace" } } } },
      plugins: { legend: { display: false } }
    }
  });
  }

  const tl = document.getElementById('timeline');
  const timeline = Array.isArray(userProgress.timeline) ? userProgress.timeline : [];
  if (!timeline.length) {
    tl.innerHTML = '<div class="empty-state">' + t('progress.emptyTimeline') + '</div>';
  } else {
    tl.innerHTML = timeline.slice(0, 12).map(item => `
      <div class="timeline-item"><span class="timeline-date">${item.date}</span><div class="timeline-dot"></div><span class="timeline-text">${item.text}</span></div>`).join('');
  }
}

function exportProgress() {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (!data) { alert(t('progress.exportConfirm')); return; }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyberedu_progress_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) { alert(t('progress.exportError') + e.message); }
}

function importProgress() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.completedSections && !data.moduleProgress && !data.ctfSolved) {
          alert(t('progress.importError')); return;
        }
        if (!confirm(t('progress.importConfirm'))) return;
        userProgress = Object.assign(defaultProgress(), data);
        ['completedSections','ctfSolved','timeline','unlockedBadges'].forEach(k => {
          if (!Array.isArray(userProgress[k])) userProgress[k] = [];
        });
        if (typeof userProgress.streak !== 'number') userProgress.streak = 0;
        if (typeof userProgress.commandCount !== 'number') userProgress.commandCount = 0;
        if (typeof userProgress.agentName !== 'string' || !userProgress.agentName) userProgress.agentName = 'OPERATIVE #1337';
        if (!userProgress.moduleProgress || typeof userProgress.moduleProgress !== 'object') userProgress.moduleProgress = {};
        saveProgress();
        renderProgress();
        updateStatusBar();
        updateSidebar();
        alert(t('progress.importSuccess'));
      } catch(err) { alert(t('progress.importFail') + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ============================================================
// PROGRESS RESET & DATA MANAGEMENT
// ============================================================
function resetProgressData(current, options = {}) {
  const defaults = defaultProgress();
  const next = Object.assign({}, current || defaults);

  const opt = {
    sections: !!options.sections,
    ctf: !!options.ctf,
    badges: !!options.badges,
    timeline: !!options.timeline
  };
  if (options.all) {
    opt.sections = true;
    opt.ctf = true;
    opt.badges = true;
    opt.timeline = true;
  }

  if (opt.sections) {
    next.completedSections = [];
    next.moduleProgress = {};
    delete next.lastSection;
  }
  if (opt.ctf) {
    next.ctfSolved = [];
  }
  if (opt.badges) {
    next.unlockedBadges = [];
    next.agentName = defaults.agentName;
  }
  if (opt.timeline) {
    next.timeline = [];
    next.streak = 0;
    next.commandCount = 0;
    next.lastVisit = '';
  }

  // Ensure arrays and required types
  ['completedSections','ctfSolved','timeline','unlockedBadges'].forEach(k => {
    if (!Array.isArray(next[k])) next[k] = [];
  });
  if (typeof next.streak !== 'number') next.streak = 0;
  if (typeof next.commandCount !== 'number') next.commandCount = 0;
  if (typeof next.agentName !== 'string' || !next.agentName) next.agentName = defaults.agentName;
  if (!next.moduleProgress || typeof next.moduleProgress !== 'object') next.moduleProgress = {};

  return next;
}
if (typeof window !== 'undefined') window.resetProgressData = resetProgressData;
if (typeof globalThis !== 'undefined') globalThis.resetProgressData = resetProgressData;

function showCyberToast(title, desc = '', icon = '✓') {
  const toast = document.getElementById('achievement-toast');
  if (!toast) return;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <div class="toast-header-tag" style="color:var(--color-cyan)">SYSTEM NOTICE</div>
      <div class="toast-title">${esc(title)}</div>
      ${desc ? `<div class="toast-desc">${esc(desc)}</div>` : ''}
    </div>
    <button class="toast-close-btn" onclick="closeAchievementToast()" aria-label="Close">✕</button>
  `;
  toast.classList.remove('hidden', 'toast-hiding');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    closeAchievementToast();
  }, 4000);
}

function openResetProgressModal() {
  const modal = document.getElementById('reset-progress-modal');
  if (!modal) return;
  const confirmChk = document.getElementById('check-reset-confirm');
  if (confirmChk) confirmChk.checked = false;
  setResetPreset('all');
  modal.classList.add('open');
}

function closeResetProgressModal() {
  const modal = document.getElementById('reset-progress-modal');
  if (!modal) return;
  modal.classList.remove('open');
}

function setResetPreset(type) {
  const chipAll = document.getElementById('preset-chip-all');
  const chipSec = document.getElementById('preset-chip-sections');
  const chipCtf = document.getElementById('preset-chip-ctf');
  if (chipAll) chipAll.classList.toggle('active', type === 'all');
  if (chipSec) chipSec.classList.toggle('active', type === 'sections');
  if (chipCtf) chipCtf.classList.toggle('active', type === 'ctf');

  const checkSec = document.getElementById('check-reset-sections');
  const checkCtf = document.getElementById('check-reset-ctf');
  const checkBadges = document.getElementById('check-reset-badges');
  const checkTimeline = document.getElementById('check-reset-timeline');
  const checkAi = document.getElementById('check-reset-ai');

  if (type === 'all') {
    if (checkSec) checkSec.checked = true;
    if (checkCtf) checkCtf.checked = true;
    if (checkBadges) checkBadges.checked = true;
    if (checkTimeline) checkTimeline.checked = true;
    if (checkAi) checkAi.checked = false;
  } else if (type === 'sections') {
    if (checkSec) checkSec.checked = true;
    if (checkCtf) checkCtf.checked = false;
    if (checkBadges) checkBadges.checked = false;
    if (checkTimeline) checkTimeline.checked = false;
    if (checkAi) checkAi.checked = false;
  } else if (type === 'ctf') {
    if (checkSec) checkSec.checked = false;
    if (checkCtf) checkCtf.checked = true;
    if (checkBadges) checkBadges.checked = false;
    if (checkTimeline) checkTimeline.checked = false;
    if (checkAi) checkAi.checked = false;
  }
  onResetOptionChange();
}

function onResetOptionChange() {
  const scopes = [
    { checkId: 'check-reset-sections', itemId: 'item-reset-sections' },
    { checkId: 'check-reset-ctf', itemId: 'item-reset-ctf' },
    { checkId: 'check-reset-badges', itemId: 'item-reset-badges' },
    { checkId: 'check-reset-timeline', itemId: 'item-reset-timeline' },
    { checkId: 'check-reset-ai', itemId: 'item-reset-ai' }
  ];
  let selectedCount = 0;
  scopes.forEach(s => {
    const chk = document.getElementById(s.checkId);
    const itm = document.getElementById(s.itemId);
    if (chk && itm) {
      itm.classList.toggle('selected', chk.checked);
      if (chk.checked) selectedCount++;
    }
  });

  const confirmChk = document.getElementById('check-reset-confirm');
  const btn = document.getElementById('btn-execute-reset');
  if (btn) {
    btn.disabled = !(selectedCount > 0 && confirmChk && confirmChk.checked);
  }
}

function confirmProgressReset() {
  const checkSec = document.getElementById('check-reset-sections');
  const checkCtf = document.getElementById('check-reset-ctf');
  const checkBadges = document.getElementById('check-reset-badges');
  const checkTimeline = document.getElementById('check-reset-timeline');
  const checkAi = document.getElementById('check-reset-ai');
  const confirmChk = document.getElementById('check-reset-confirm');

  if (!confirmChk || !confirmChk.checked) return;

  const resetSections = checkSec ? checkSec.checked : false;
  const resetCtf = checkCtf ? checkCtf.checked : false;
  const resetBadges = checkBadges ? checkBadges.checked : false;
  const resetTimeline = checkTimeline ? checkTimeline.checked : false;
  const resetAi = checkAi ? checkAi.checked : false;

  if (!resetSections && !resetCtf && !resetBadges && !resetTimeline && !resetAi) {
    alert(t('resetModal.noSelection'));
    return;
  }

  // Apply reset
  userProgress = resetProgressData(userProgress, {
    sections: resetSections,
    ctf: resetCtf,
    badges: resetBadges,
    timeline: resetTimeline
  });

  if (resetAi) {
    try {
      localStorage.removeItem(AI_HIST_KEY);
      if (typeof renderAIChatHistory === 'function') renderAIChatHistory();
    } catch(e) {}
  }

  if (resetSections) {
    try {
      localStorage.removeItem('cyberedu_target_track');
    } catch(e) {}
  }

  saveProgress();

  // Refresh all views
  recalcModuleProgress();
  updateStatusBar();
  updateSidebar();
  if (typeof renderProgress === 'function' && currentView === 'progress') {
    renderProgress();
  }
  if (typeof renderHome === 'function' && currentView === 'home') {
    renderHome();
  }
  if (typeof renderCTF === 'function') {
    renderCTF();
  }
  if (currentView === 'hub' && typeof currentModuleId !== 'undefined' && typeof loadModule === 'function') {
    loadModule(currentModuleId, currentSectionId);
  }

  closeResetProgressModal();
  showCyberToast(t('resetModal.successToast') || '✓ 学习进度已成功重置！', '', '↺');
}

// ============================================================
// TOOLS
// ============================================================
const TOOLS = [
  { id: 'base64', name: 'Base64 编解码', icon: '📦', desc: 'Base64 编码与解码，支持 Unicode', modes: ['ENCODE','DECODE'], fn: { 'ENCODE': v => { try { return btoa(unescape(encodeURIComponent(v))); } catch(e) { return 'Encode failed'; } }, 'DECODE': v => { try { return decodeURIComponent(escape(atob(v))); } catch(e) { return 'Decode failed'; } } } },
  { id: 'hash', name: 'Hash 计算', icon: '#️⃣', desc: 'SHA-256/SHA-1 哈希（浏览器 SubtleCrypto）', modes: ['SHA-256','SHA-1'], fn: null, async: true },
  { id: 'caesar', name: 'Caesar / ROT13', icon: '🔄', desc: '凯撒密码加解密，自定义位移（0-25）', modes: null, extra: true },
  { id: 'url', name: 'URL 编解码', icon: '🔗', desc: 'URL 编解码，支持 + 号解码为空格', modes: ['ENCODE','DECODE'], fn: { 'ENCODE': v => encodeURIComponent(v), 'DECODE': v => { try { return decodeURIComponent(v.replace(/\+/g, '%20')); } catch(e) { return 'Decode failed'; } } } },
  { id: 'hex', name: 'Hex / ASCII', icon: '🔣', desc: '十六进制与文本互转，支持 0x 前缀', modes: ['Text→Hex','Hex→Text'], fn: { 'Text→Hex': v => Array.from(new TextEncoder().encode(v)).map(b => b.toString(16).padStart(2,'0')).join(' '), 'Hex→Text': v => { try { let clean = v.replace(/0x/gi,'').replace(/[\s,:]/g,''); if (clean.length % 2) clean = '0' + clean; if (!/^[0-9a-f]+$/i.test(clean)) return 'Invalid hex'; return new TextDecoder().decode(new Uint8Array(clean.match(/.{2}/g).map(b => parseInt(b,16)))); } catch(e) { return '转换失败'; } } } },
  { id: 'binary', name: '进制转换', icon: '💻', desc: '二进制/十进制/十六进制互转', modes: ['Dec→Bin','Bin→Dec','Dec→Hex','Hex→Dec'], fn: { 'Dec→Bin': v => { const n=parseInt(v,10); if(isNaN(n)) return 'Invalid'; return n<0?(n>>>0).toString(2):n.toString(2); }, 'Bin→Dec': v => { const clean=v.replace(/^0b/i,''); const n=parseInt(clean,2); if(isNaN(n)) return 'Invalid'; return clean.length===32&&clean[0]==='1'?String(n|0):n.toString(10); }, 'Dec→Hex': v => { const n=parseInt(v,10); if(isNaN(n)) return 'Invalid'; return n<0?'0x'+((n>>>0).toString(16).toUpperCase()):'0x'+n.toString(16).toUpperCase(); }, 'Hex→Dec': v => { const clean=v.replace(/^0x/i,''); const n=parseInt(clean,16); if(isNaN(n)) return 'Invalid'; return clean.length===8&&parseInt(clean[0],16)>=8?String(n|0):n.toString(10); } } }
];
let toolModes = {};
TOOLS.forEach(t => { if (t.modes) toolModes[t.id] = t.modes[0]; });

function renderTools() {
  const _t = t; // preserve global t() translation function
  document.getElementById('tools-grid').innerHTML = TOOLS.map(tool => {
    if (tool.id === 'caesar') {
      return `<div class="tool-card" id="tool-caesar">
        <div class="tool-name">${tool.icon} ${_t('tool.caesar')}</div>
        <div class="tool-desc">${_t('tool.caesar.subtitle')}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">SHIFT:</label>
          <input type="number" id="caesar-shift" value="13" min="0" max="25" style="width:56px;background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-main);font-family:var(--font-mono);padding:4px 8px;font-size:12px;outline:none" oninput="updateCaesar()">
        </div>
        <textarea class="tool-input" id="caesar-in" placeholder="${_t('tool.caesarInputPlaceholder')}" oninput="updateCaesar()" rows="2"></textarea>
        <div class="tool-arrow">↓</div>
        <textarea class="tool-output" id="caesar-out" placeholder="${_t('tool.caesarOutputPlaceholder')}" readonly rows="2"></textarea>
      </div>`;
    }
    const tabs = tool.modes ? `<div class="tool-tabs">${tool.modes.map(m => `<button class="tool-tab ${m===toolModes[tool.id]?'active':''}" onclick="setToolMode('${tool.id}','${m}',this)">${m}</button>`).join('')}</div>` : '';
    return `<div class="tool-card" id="tool-${tool.id}">
      <div class="tool-name">${tool.icon} ${_t('tool.'+tool.id) || tool.name}</div>
      <div class="tool-desc">${_t('tool.'+tool.id+'.desc') || tool.desc}</div>
      ${tabs}
      <textarea class="tool-input" id="${tool.id}-in" placeholder="${_t('tool.inputPlaceholder')}" oninput="runTool('${tool.id}')" rows="2"></textarea>
      <div class="tool-arrow">↓</div>
      <textarea class="tool-output" id="${tool.id}-out" placeholder="${_t('tool.outputPlaceholder')}" readonly rows="2"></textarea>
    </div>`;
  }).join('');
  bindHashTool();
}
function setToolMode(id, mode, btn) {
  toolModes[id] = mode;
  document.querySelectorAll(`#tool-${id} .tool-tab`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  runTool(id);
}
function runTool(id) {
  const t = TOOLS.find(x => x.id === id);
  if (!t) return;
  const input = document.getElementById(id+'-in')?.value||'';
  const out = document.getElementById(id+'-out');
  if (!input) { out.value=''; return; }
  if (t.async) { runHashTool(id, input); return; }
  if (t.fn) out.value = t.fn[toolModes[id]]?.(input)||'';
}
function updateCaesar() {
  const shift = parseInt(document.getElementById('caesar-shift')?.value||13);
  const input = document.getElementById('caesar-in')?.value||'';
  const out = document.getElementById('caesar-out');
  if(!out)return;
  let r='';
  for(const ch of input){
    if(ch.match(/[a-zA-Z]/)){const base=ch<='Z'?65:97;r+=String.fromCharCode(((ch.charCodeAt(0)-base+shift)%26+26)%26+base)}
    else r+=ch;
  }
  out.value=r;
}
async function runHashTool(id,input){
  const mode=toolModes[id];const out=document.getElementById(id+'-out');
  try{const buf=await crypto.subtle.digest(mode,new TextEncoder().encode(input));out.value=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}
  catch(e){out.value=t('tool.fail')}
}
function bindHashTool(){
  const inp=document.getElementById('hash-in');
  if(inp)inp.addEventListener('input',()=>runTool('hash'));
}

// ============================================================
// SEARCH
// ============================================================
let SEARCH_INDEX = [];

function buildSearchIndex() {
  if (typeof MODULES === 'undefined' || typeof CTF_CHALLENGES === 'undefined') return;
  SEARCH_INDEX = [
    ...MODULES.flatMap(m => [
      { type: t('search.type.module'), title: getModField(m,'title'), sub: getModField(m,'desc'), action:()=>navigate('hub',m.id) },
      ...m.chapters.flatMap(c => c.sections.map(s => ({
        type: t('search.type.chapter'), title: getSectionField(s,'title'), sub: getModField(m,'title')+' › '+getChapterField(c,'title'), action:()=>loadSection(m.id,s.id)
      })))
    ]),
    ...CTF_CHALLENGES.map(c => ({
      type: 'CTF', title: currentLang==='en'&&c.titleEn?c.titleEn:c.title, sub: c.category+' · '+c.points+' pts', action:()=>{navigate('ctf');setTimeout(()=>openCTF(c.id),200)}
    })),
    ...TOOLS.map(tool => ({
      type: t('search.type.tool'), title: t('tool.'+tool.id) || tool.name, sub: t('tool.'+tool.id+'.desc') || tool.desc, action:()=>navigate('tools')
    })),
    ...Object.entries(GLOSSARY).map(([term, def]) => ({
      type: t('search.type.term'), title: term, sub: def.slice(0,60)+'...', action:()=>{}
    }))
  ];
}
if (typeof MODULES !== 'undefined') {
  buildSearchIndex();
}

function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('search-input').focus(),50);
}
function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-input').value='';
  document.getElementById('search-results').innerHTML='<div class="search-empty">' + t('search.empty') + '</div>';
}
function closeSearchIfBackdrop(e){if(e.target===document.getElementById('search-overlay'))closeSearch()}
function doSearch(q) {
  const res=document.getElementById('search-results');
  if(!q.trim()){res.innerHTML='<div class="search-empty">' + t('search.empty') + '</div>';return}
  const ql=q.toLowerCase();
  // Token-based fuzzy search: split query into words, each must match somewhere
  const tokens = ql.split(/\s+/).filter(t => t.length > 0);
  const hits=SEARCH_INDEX.filter(x => {
    const text = (x.title + ' ' + x.sub).toLowerCase();
    return tokens.every(token => text.includes(token));
  }).slice(0,12);
  if(!hits.length){res.innerHTML='<div class="search-empty">' + t('search.noResult') + '</div>';return}
  // Highlight matching keywords safely (single-pass regex over escaped text)
  function hl(text){
    if (!text) return '';
    const escaped = _escHtml(text);
    if (!tokens.length) return escaped;
    const pattern = '(' + tokens.map(tok => tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')';
    return escaped.replace(new RegExp(pattern, 'gi'),
      '<mark style="background:rgba(0,255,65,0.18);color:var(--color-green);padding:0 2px;border-radius:1px">$1</mark>');
  }
  res.innerHTML=hits.map((h,i)=>`<div class="search-result-item" onclick="searchGo(${i})">
    <span class="sr-type">${h.type}</span>
    <div><div class="sr-title">${hl(h.title)}</div><div class="sr-sub">${hl(h.sub)}</div></div>
  </div>`).join('');
  window._searchHits=hits;
}
function searchGo(i){window._searchHits[i]?.action();closeSearch()}

// ============================================================

// ============================================================
// COUNT-UP ANIMATION
// ============================================================
function animateCountUp(el, target, duration){
  if(!el) return;
  if(target <= 0) { el.textContent = target; return; }
  const start = performance.now();
  const initial = 0;
  function tick(now){
    const elapsed = Math.max(0, (now || performance.now()) - start);
    const progress = Math.max(0, Math.min(elapsed / duration, 1));
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(initial + (target - initial) * eased);
    if(progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  }
  requestAnimationFrame(tick);
}
function triggerCountUp(){
  const statTargets = {
    'stat-chapters': (typeof MODULES !== 'undefined') ? MODULES.flatMap(m => m.chapters.flatMap(c => c.sections)).length : 171,
    'stat-exercises': (typeof PRACTICES !== 'undefined') ? PRACTICES.length : 10,
    'stat-ctf': (typeof CTF_CHALLENGES !== 'undefined') ? CTF_CHALLENGES.length : 28,
    'stat-tools': (typeof TOOLS !== 'undefined') ? TOOLS.length : 6
  };
  Object.keys(statTargets).forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    const target = parseInt(el.dataset.target) || statTargets[id] || 0;
    animateCountUp(el, target, 1600);
  });
}

// STATUS BAR
// ============================================================
function updateStatusBar(){
  recalcModuleProgress();
  const total=MODULES.flatMap(m=>m.chapters.flatMap(c=>c.sections)).length;
  const done=userProgress.completedSections.length;
  const pct=total?Math.round(done/total*100):0;
  const progEl = document.getElementById('status-progress');
  if (progEl) progEl.textContent=`PROGRESS: ${pct}% (${done}/${total})`;

  if (typeof getUserRank === 'function') {
    const rankInfo = getUserRank();
    const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
    const rankTitle = isEn ? rankInfo.rank.titleEn : rankInfo.rank.titleZh;

    const rankEl = document.getElementById('status-rank');
    if (rankEl) {
      rankEl.textContent = `RANK: [LV.${rankInfo.rank.level} ${rankTitle.toUpperCase()}]`;
      rankEl.style.color = rankInfo.rank.color;
    }

    const navBadge = document.getElementById('nav-rank-badge');
    const navText = document.getElementById('nav-rank-text');
    if (navBadge && navText) {
      navText.textContent = `LV.${rankInfo.rank.level} ${rankTitle.toUpperCase()}`;
      navBadge.style.setProperty('--rank-accent', rankInfo.rank.color);
      navBadge.style.borderColor = rankInfo.rank.color + '66';
      navBadge.style.color = rankInfo.rank.color;
      const dot = navBadge.querySelector('.rank-indicator-dot');
      if (dot) {
        dot.style.background = rankInfo.rank.color;
        dot.style.boxShadow = `0 0 6px ${rankInfo.rank.color}`;
      }
    }
  }

  const motionEl = document.getElementById('status-motion-text');
  if (motionEl) {
    const isReduced = document.documentElement.classList.contains('reduced-motion');
    motionEl.textContent = isReduced ? '⚡ MOTION: OFF' : '⚡ MOTION: ON';
  }
}

// ============================================================
// TYPEWRITER
// ============================================================
const TW_LINES=[
  '> Break the surface, own the stack',
  '> 52 chapters. Zero to hero.',
  '> 28 CTF challenges. Real exploits.',
  '> 6 security tools. Hands-on.',
  '> 4-stage learning path. Start now.'
];
let twIdx=0,twChar=0,twDel=false;
function tickTypewriter(){
  const el=document.getElementById('typewriter');
  if(!el)return;
  const line=TW_LINES[twIdx];
  if(!twDel){twChar++;el.textContent=line.slice(0,twChar);if(twChar>=line.length){twDel=true;setTimeout(tickTypewriter,2000);return}setTimeout(tickTypewriter,50)}
  else{twChar--;el.textContent=line.slice(0,twChar);if(twChar<=0){twDel=false;twIdx=(twIdx+1)%TW_LINES.length;setTimeout(tickTypewriter,300);return}setTimeout(tickTypewriter,25)}
}

// ============================================================
// CYBER LETTER HOVER EFFECT
// ============================================================
function initCyberLetters(){
  // Ensure letters are wrapped (hero title is static, may need re-wrap after language switch)
  if(!document.querySelector('.hero-title .cyber-letter')) wrapCyberLetters();
  const corruptChars='!@#$%^&*01ABCDEF<>{}[]|/\\~';
  // Event delegation on document for all cyber-letter hovers
  document.addEventListener('mouseover',function(e){
    const letter=e.target.closest('.cyber-letter');
    if(!letter||!letter.dataset.orig) return;
    const orig=letter.dataset.orig;
    let n=0;
    const iv=setInterval(()=>{
      letter.textContent=n<4?corruptChars[Math.floor(Math.random()*corruptChars.length)]:orig;
      if(n===0)letter.style.animation='letter-corrupt 0.2s ease';
      n++;if(n>4){clearInterval(iv);letter.style.animation=''}
    },30);
  });
}
function wrapCyberLetters(){
  document.querySelectorAll('.hero-title, .cyber-text').forEach(el=>{
    Array.from(el.childNodes).forEach(function wrapNode(node){
      if(node.nodeType===1&&node.classList.contains('glitch'))return;
      if(node.nodeType===1&&node.classList.contains('cyber-letter'))return;
      if(node.nodeType===3){
        const t=node.textContent;if(!t.trim())return;
        const frag=document.createDocumentFragment();
        for(const ch of t){
          if(ch===' '){frag.appendChild(document.createTextNode(' '))}
          else{const s=document.createElement('span');s.className='cyber-letter';s.dataset.orig=ch;s.textContent=ch;frag.appendChild(s)}
        }
        node.parentNode.replaceChild(frag,node);
      }else if(node.nodeType===1){Array.from(node.childNodes).forEach(wrapNode)}
    });
  });
}

// ============================================================
// MATRIX BACKGROUND
// ============================================================
function initMatrix(){
  const c=document.getElementById('matrix-canvas');
  const ctx=c.getContext('2d');
  c.width=window.innerWidth;c.height=window.innerHeight;
  const chars='`1234567890-=~!@#$%^&*()_+qwertyuiop[]\\QWERTYUIOP{}|asdfghjkl;\'ASDFGHJKL:"zxcvbnm,./ZXCVBNM<>?';
  const fontSize=14,columns=Math.floor(c.width/fontSize);
  const drops=Array(columns).fill(1);
  function draw(){
    ctx.fillStyle='rgba(6,6,9,0.05)';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='rgba(0,229,255,0.45)';
    ctx.font=fontSize+'px "'+getComputedStyle(document.body).getPropertyValue('--font-mono').split(',')[0].replace(/['"]/g,'').trim()+'"';
    for(let i=0;i<drops.length;i++){
      const text=chars[Math.floor(Math.random()*chars.length)];
      ctx.fillText(text,i*fontSize,drops[i]*fontSize);
      if(drops[i]*fontSize>c.height&&Math.random()>0.975)drops[i]=0;
      drops[i]++;
    }
  }
  setInterval(draw,42);
  window.addEventListener('resize',()=>{c.width=window.innerWidth;c.height=window.innerHeight});
}


// ============================================================
// SCROLL REVEAL
// ============================================================
function scrollReveal(){
  setTimeout(()=>{
    document.querySelectorAll('.reveal').forEach(el=>{
      const rect=el.getBoundingClientRect();
      if(rect.top<window.innerHeight-60)el.classList.add('visible');
    });
    // Glitch reveal: brief RGB split before appearing
    document.querySelectorAll('.reveal-glitch').forEach(el=>{
      const rect=el.getBoundingClientRect();
      if(rect.top<window.innerHeight-40 && !el.classList.contains('visible')){
        el.classList.add('visible');
      }
    });
    // Staggered reveal for child groups
    document.querySelectorAll('.reveal-stagger').forEach(el=>{
      const rect=el.getBoundingClientRect();
      if(rect.top<window.innerHeight-40 && !el.classList.contains('visible')){
        el.classList.add('visible');
      }
    });
  },100);
}
if (typeof window !== 'undefined') window.addEventListener('scroll',scrollReveal);

// ============================================================
// NEON CURSOR TRAIL
// ============================================================
(function(){
  if (typeof document === 'undefined') return;
  let trailTimeout;
  document.addEventListener('mousemove', function(e) {
    if (trailTimeout) return;
    trailTimeout = setTimeout(() => { trailTimeout = null; }, 40);
    const dot = document.createElement('div');
    dot.className = 'cursor-trail';
    dot.style.left = (e.clientX - 3) + 'px';
    dot.style.top = (e.clientY - 3) + 'px';
    dot.style.width = '6px';
    dot.style.height = '6px';
    if (document.body) document.body.appendChild(dot);
    setTimeout(() => { if (dot.parentNode) dot.remove(); }, 600);
  });
})();

// ============================================================
// COPY CODE
// ============================================================
function copyCode(btn){
  const code=btn.nextElementSibling?.querySelector('code')?.textContent||'';
  navigator.clipboard.writeText(code).then(()=>{
    const orig=btn.textContent;
    btn.textContent='COPIED';
    btn.style.color='var(--color-green)';
    setTimeout(()=>{btn.textContent=orig;btn.style.color=''},1500);
  }).catch(()=>{btn.textContent='FAILED';setTimeout(()=>{btn.textContent='copy'},1500)});
}

// ============================================================
// INTRO — Cyberpunk 2077 Deluxe
// ============================================================
let introActive = false;
let introAnimFrameId = null;
let introStartTime = 0;
const INTRO_DURATION = 3800;
let introFlashDone = false;

// Noise canvas
let introNoiseCtx = null;
function initIntroNoise(){
  try {
  const c = document.getElementById('intro-noise');
  if(!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  introNoiseCtx = c.getContext('2d');
  if(!introNoiseCtx) return;
  function drawNoise(){
    if(!introActive) return;
    const w = c.width, h = c.height;
    const idata = introNoiseCtx.createImageData(w, h);
    const d = idata.data;
    for(let i = 0; i < d.length; i += 4){
      const v = Math.random() * 255 | 0;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = 18;
    }
    introNoiseCtx.putImageData(idata, 0, 0);
    requestAnimationFrame(drawNoise);
  }
  drawNoise();
  } catch(e) { console.error('initIntroNoise error:', e); }
}

// Glitch blocks
function spawnGlitchBlock(){
  if(!introActive) return;
  const container = document.getElementById('intro-glitch-blocks');
  if(!container) return;
  const block = document.createElement('div');
  block.className = 'intro-gblock';
  const x = Math.random() * window.innerWidth * 0.8 | 0;
  const y = Math.random() * window.innerHeight * 0.6 | 0;
  const w = 20 + Math.random() * 120 | 0;
  const h = 2 + Math.random() * 18 | 0;
  const colors = ['#ff2a6d','var(--color-green)','#b400ff','#00f0ff','#ff6a00'];
  block.style.cssText = 'left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;--gb-color:'+colors[Math.random()*colors.length|0];
  container.appendChild(block);
  setTimeout(function(){ block.remove(); }, 180 + Math.random() * 220);
  if(introActive){
    setTimeout(spawnGlitchBlock, 120 + Math.random() * 400);
  }
}

// Terminal log
const LOG_LINES = [
  {text:'[OK] Neural network interface online', cls:'ok'},
  {text:'[WARN] Firewall breached — sector 4', cls:'warn'},
  {text:'[OK] Network uplink established', cls:'ok'},
  {text:'[ERR] Biometric scan mismatch — retry', cls:'err'},
  {text:'[OK] ICE v7.3 — bypassing...', cls:'ok'},
  {text:'[WARN] Trace detected — countermeasures active', cls:'warn'},
  {text:'[OK] Access granted — welcome, netrunner', cls:'ok'},
];
let logIdx = 0;
function addLogLine(){
  if(logIdx >= LOG_LINES.length || !introActive) return;
  const el = document.getElementById('intro-log');
  if(!el) return;
  const d = document.createElement('div');
  d.className = 'intro-log-line';
  d.innerHTML = '<span class="'+LOG_LINES[logIdx].cls+'">'+LOG_LINES[logIdx].text+'</span>';
  el.appendChild(d);
  logIdx++;
  if(introActive && logIdx < LOG_LINES.length){
    setTimeout(addLogLine, 200 + Math.random() * 400);
  }
}

// Progress bar animation (setInterval-based, ease-out + elastic overshoot)
function animateBar(){
  if(!introActive) return;
  try {
  const elapsed = performance.now() - introStartTime;
  let t = Math.min(elapsed / INTRO_DURATION, 1);
  let ease = 1 - Math.pow(1 - t, 3);
  if(t > 0.92){
    const ot = (t - 0.92) / 0.08;
    ease = ease + Math.sin(ot * Math.PI * 3) * 0.03 * (1 - ot);
  }
  const pct = Math.min(ease * 100, 100);
  const bar = document.getElementById('intro-bar-fill');
  const pctEl = document.getElementById('intro-pct');
  const statusEl = document.getElementById('intro-status');
  if(bar) bar.style.width = pct + '%';
  if(pctEl) pctEl.textContent = Math.round(pct) + '%';
  if(statusEl){
    if(pct < 30) statusEl.textContent = 'LOADING NEURAL DRIVERS... ' + Math.round(pct) + '%';
    else if(pct < 60) statusEl.textContent = 'PARSING DATA FRAGMENTS... ' + Math.round(pct) + '%';
    else if(pct < 90) statusEl.textContent = 'COMPILING SECURITY MATRIX... ' + Math.round(pct) + '%';
    else statusEl.textContent = 'SYSTEM READY. ' + Math.round(pct) + '%';
  }
  if(t >= 1){
    cancelAnimationFrame(introAnimFrameId);
    introAnimFrameId = null;
    triggerFlash();
  } else {
    introAnimFrameId = requestAnimationFrame(animateBar);
  }
  } catch(e) {
    console.error('animateBar error:', e);
    skipIntro();
  }
}

function markIntroSeen() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('cyberedu_intro_seen', '1');
    }
  } catch(e) {}
}

function triggerFlash(){
  markIntroSeen();
  if(introFlashDone) return;
  introFlashDone = true;
  const flash = document.getElementById('intro-flash');
  if(flash){
    flash.style.animation = 'flash-white 0.6s ease-out forwards';
  }
  setTimeout(function(){ skipIntro(false); }, 500);
}

function playIntro(){
  const earlyHide = document.getElementById('intro-early-hide');
  if (earlyHide) earlyHide.remove();
  const intro = document.getElementById('intro-screen');
  if(!intro) return;
  introActive = true;
  introFlashDone = false;
  logIdx = 0;
  introStartTime = performance.now();
  intro.style.display = 'flex';
  intro.classList.remove('fade-out');
  const logEl = document.getElementById('intro-log');
  if(logEl) logEl.innerHTML = '';
  const barFill = document.getElementById('intro-bar-fill');
  if(barFill) barFill.style.width = '0%';
  const pctEl = document.getElementById('intro-pct');
  if(pctEl) pctEl.textContent = '0%';
  const flashEl = document.getElementById('intro-flash');
  if(flashEl) flashEl.style.animation = 'none';
  try { initIntroNoise(); } catch(e) { console.error('initIntroNoise error:', e); }
  setTimeout(spawnGlitchBlock, 500);
  setTimeout(addLogLine, 200);
  introAnimFrameId = requestAnimationFrame(animateBar);
  // Safety timeout: force skip intro if animation gets stuck
  setTimeout(function(){ if(introActive) { console.warn('Intro safety timeout triggered'); skipIntro(true); } }, INTRO_DURATION + 2000);
}

function skipIntro(immediate = false){
  markIntroSeen();
  introActive = false;
  introFlashDone = true;
  if(introAnimFrameId) { cancelAnimationFrame(introAnimFrameId); introAnimFrameId = null; }
  const intro = document.getElementById('intro-screen');
  if(intro) {
    if (immediate) {
      intro.style.display = 'none';
      intro.classList.remove('fade-out');
    } else {
      intro.classList.add('fade-out');
      setTimeout(function(){
        if(intro) intro.style.display = 'none';
      }, 350);
    }
  }
  const nc = document.getElementById('intro-noise');
  if(nc){ nc.width = 0; nc.height = 0; }
}

// ============================================================
// KEYBOARD SHORTCUTS & MODAL
// ============================================================

function openShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal');
  const body = document.getElementById('shortcuts-body');
  if (!modal || !body) return;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const groups = [
    {
      title: t('shortcuts.nav'),
      items: [
        { desc: t('shortcuts.search'), keys: ['/'] },
        { desc: t('shortcuts.prevSec'), keys: ['['] },
        { desc: t('shortcuts.nextSec'), keys: [']'] },
        { desc: t('shortcuts.close'), keys: ['Esc'] }
      ]
    },
    {
      title: t('shortcuts.coding'),
      items: [
        { desc: t('shortcuts.run'), keys: [modKey, 'Enter'] },
        { desc: t('shortcuts.prevPrac'), keys: ['Alt', '←'] },
        { desc: t('shortcuts.nextPrac'), keys: ['Alt', '→'] }
      ]
    },
    {
      title: t('shortcuts.ai'),
      items: [
        { desc: t('shortcuts.toggleAI'), keys: [modKey, '/'] },
        { desc: t('shortcuts.help'), keys: ['?'] }
      ]
    }
  ];

  body.innerHTML = groups.map(g => `
    <div class="shortcut-group">
      <div class="shortcut-group-title">${_escHtml(g.title)}</div>
      ${g.items.map(it => `
        <div class="shortcut-row">
          <span class="shortcut-desc">${_escHtml(it.desc)}</span>
          <div class="shortcut-keys">
            ${it.keys.map((k, i) => `${i > 0 ? '<span style="color:var(--text-dim);font-size:10px">+</span>' : ''}<kbd>${_escHtml(k)}</kbd>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  modal.classList.add('active');
}

function closeShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal');
  if (modal) modal.classList.remove('active');
}

function navigateSectionRel(dir) {
  if (currentView !== 'hub' || !currentSectionId) return;
  const allSections = [];
  MODULES.forEach(m => {
    m.chapters.forEach(c => {
      c.sections.forEach(s => {
        allSections.push({ modId: m.id, secId: s.id });
      });
    });
  });
  const idx = allSections.findIndex(item => item.secId === currentSectionId);
  if (idx === -1) return;
  const targetIdx = idx + dir;
  if (targetIdx >= 0 && targetIdx < allSections.length) {
    const target = allSections[targetIdx];
    loadSection(target.modId, target.secId);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', function(e) {
    // 1. Skip intro on any key if active or visible
    const introEl = document.getElementById('intro-screen');
    const isIntroVisible = introEl && introEl.style.display !== 'none';
    if ((typeof introActive !== 'undefined' && introActive) || isIntroVisible) {
      if (typeof skipIntro === 'function') skipIntro(false);
      return;
    }

    // 2. Escape: priority stack of dismissals
    if (e.key === 'Escape') {
      const fsBlocks = document.querySelectorAll('.code-block.fullscreen');
      if (fsBlocks.length > 0) {
        fsBlocks.forEach(cb => {
          cb.classList.remove('fullscreen');
          const span = cb.querySelector('.code-fs-btn span');
          if (span) span.textContent = t('code.fullscreen') || '全屏';
        });
        document.body.classList.remove('code-fullscreen-active');
        return;
      }
      const sm = document.getElementById('shortcuts-modal');
      if (sm && sm.classList.contains('active')) {
        closeShortcutsModal();
        return;
      }
      if (typeof closeSearch === 'function') closeSearch();
      if (typeof closeCTFModal === 'function') closeCTFModal();
      if (typeof closeLabDrawer === 'function') closeLabDrawer();
      if (typeof closeDiagnosticModal === 'function') closeDiagnosticModal();
      if (typeof closeResetProgressModal === 'function') closeResetProgressModal();
      return;
    }

    // 3. Global hotkey: Ctrl+/ or Cmd+/ to toggle AI Tutor (works even inside inputs)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      if (typeof toggleAIChat === 'function') toggleAIChat();
      return;
    }

    // 4. Global hotkey: Ctrl+Enter or Cmd+Enter to run practice code / CTF
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (currentView === 'practice') {
        e.preventDefault();
        if (typeof runCode === 'function') runCode();
        return;
      }
      const ctfInput = document.getElementById('ctf-flag-input');
      if (ctfInput && document.activeElement === ctfInput) {
        e.preventDefault();
        if (typeof submitCTFFlag === 'function') submitCTFFlag();
        return;
      }
    }

    // Check if active element is an input or editable field
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable ||
      activeEl.classList.contains('CodeMirror-code')
    );

    // If typing in input/textarea, ignore navigation and single-key hotkeys
    if (isTyping) return;

    // 5. Search hotkeys: '/' or 'Ctrl+K' / 'Cmd+K'
    if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
      e.preventDefault();
      if (typeof openSearch === 'function') openSearch();
      return;
    }

    // 6. Help / Shortcuts hotkey: '?' (Shift + /)
    if (e.key === '?') {
      e.preventDefault();
      openShortcutsModal();
      return;
    }

    // 7. Navigation between sections: '[' for previous, ']' for next
    if (e.key === '[') {
      e.preventDefault();
      navigateSectionRel(-1);
      return;
    }
    if (e.key === ']') {
      e.preventDefault();
      navigateSectionRel(1);
      return;
    }

    // 8. Practice view navigation: Alt+Left / Alt+Right or plain ArrowLeft/ArrowRight
    if (currentView === 'practice') {
      if (e.altKey && e.key === 'ArrowRight') { nextPractice(); return; }
      if (e.altKey && e.key === 'ArrowLeft') { prevPractice(); return; }
      if (e.key === 'ArrowRight') nextPractice();
      if (e.key === 'ArrowLeft') prevPractice();
    }
  });

  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}} @keyframes confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`;
  if (document.head) document.head.appendChild(shakeStyle);
}

// ============================================================
// THEME TOGGLE
// ============================================================
function toggleTheme(){
  const html=document.documentElement;
  const isLight=html.getAttribute('data-theme')==='light';
  html.setAttribute('data-theme',isLight?'':'light');
  document.getElementById('theme-toggle').textContent=isLight?'☀':'☾';
  if(cmEditor) cmEditor.setOption('theme', isLight?'material-darker':'eclipse');
  try{localStorage.setItem('cyberedu_theme',isLight?'dark':'light')}catch(e){}
}
function initTheme(){
  const saved=localStorage.getItem('cyberedu_theme');
  if(saved==='light'){
    document.documentElement.setAttribute('data-theme','light');
    const btn=document.getElementById('theme-toggle');
    if(btn)btn.textContent='☾';
  }
}

// ============================================================
// AI CHAT
// ============================================================
let aiMessages = [];
let aiIsStreaming = false;
let aiAbortController = null;
let aiCurrentSessionId = null; // null = unsaved new session

// ── History helpers ──
const AI_HIST_KEY = 'cyberedu_ai_history';

function _histLoad() {
  try { return JSON.parse(localStorage.getItem(AI_HIST_KEY)) || []; }
  catch(e) { return []; }
}
function _histSave(list) {
  try { localStorage.setItem(AI_HIST_KEY, JSON.stringify(list)); }
  catch(e) {}
}
function _genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Two-step delete: remember which session is pending confirmation
let _pendingDeleteId = null;
let _pendingDeleteTimer = null;

// ── Session persistence ──
function _saveCurrentSession() {
  if (!aiMessages.length) return;
  const id = aiCurrentSessionId || _genId();
  const list = _histLoad();
  const prev = list.find(s => s.id === id);
  const autoTitle = (aiMessages[0]?.content || '').replace(/\s+/g, ' ').trim().slice(0, 30) || t('ai.curSession');
  const entry = {
    id,
    title: (prev && prev.customTitle) ? prev.title : autoTitle,   // keep renamed titles
    customTitle: prev ? !!prev.customTitle : false,
    messages: aiMessages, time: Date.now()
  };
  const idx = list.findIndex(s => s.id === id);
  if (idx >= 0) list[idx] = entry; else list.unshift(entry);
  while (list.length > 50) list.pop();
  _histSave(list);
  aiCurrentSessionId = id;
}

function _loadSession(id) {
  if (aiIsStreaming) { _pushHistoryTip(t('ai.stopFirst')); return; }
  const panel2 = document.getElementById('ai-chat-panel');
  panel2.classList.remove('history-open');
  document.getElementById('ai-history').classList.add('hidden');
  const list = _histLoad();
  const session = list.find(s => s.id === id);
  if (!session) return;
  // never lose an unsaved current chat
  if (aiCurrentSessionId === null && aiMessages.length) _saveCurrentSession();
  aiCurrentSessionId = id;
  aiMessages = session.messages.slice();
  // Rebuild UI messages
  const box = document.getElementById('ai-messages');
  box.innerHTML = '';
  let lastUser = '';
  for (const m of aiMessages) {
    if (m.role === 'system') continue;
    if (m.role === 'user') lastUser = m.content;
    const div = addAIMsg(m.role, m.content);
    if (m.role === 'assistant') attachAIMessageTools(div, m.content);
  }
  if (lastUser) lastUserText = lastUser;
  _renderHistoryList();
}

function _deleteSession(id) {
  if (_pendingDeleteId !== id) {
    _pendingDeleteId = id;
    clearTimeout(_pendingDeleteTimer);
    _pendingDeleteTimer = setTimeout(() => { _pendingDeleteId = null; _renderHistoryList(); }, 2500);
    _renderHistoryList();
    return;
  }
  _pendingDeleteId = null;
  clearTimeout(_pendingDeleteTimer);
  const list = _histLoad().filter(s => s.id !== id);
  _histSave(list);
  if (aiCurrentSessionId === id) newAIChat();
  _renderHistoryList();
}

function _renameSession(id) {
  const item = document.querySelector('[data-sid="' + id + '"] .aih-t');
  if (!item) return;
  const old = item.textContent;
  const input = document.createElement('input');
  input.className = 'ai-rename-input';
  input.value = old;
  item.replaceWith(input);
  input.focus(); input.select();
  const commit = () => {
    const name = input.value.trim() || old;
    const list = _histLoad();
    const s = list.find(x => x.id === id);
    if (s) { s.title = name; s.customTitle = true; _histSave(list); }
    _renderHistoryList();
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') { input.value = old; commit(); }
  });
  input.addEventListener('blur', commit);
}

function _clearAllHistory() {
  if (_pendingDeleteId !== '__all__') {
    _pendingDeleteId = '__all__';
    _renderHistoryList();
    return;
  }
  _pendingDeleteId = null;
  _histSave([]);
  newAIChat();
}

function _pushHistoryTip(msg) {
  let el = document.getElementById('ai-history-tip');
  if (!el) {
    const hist = document.getElementById('ai-history');
    if (!hist) return;
    el = document.createElement('div');
    el.id = 'ai-history-tip';
    el.className = 'ai-history-tip';
    hist.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2000);
}

// ── History list rendering ──
function _renderHistoryList() {
  const container = document.getElementById('ai-history-list');
  const q = (window._histQ || '').toLowerCase();
  const list = _histLoad().filter(s => !q || (s.title || '').toLowerCase().includes(q));
  const now = Date.now();
  const groups = [
    { key: 'ai.grpToday', items: [] },
    { key: 'ai.grp7d', items: [] },
    { key: 'ai.grpOlder', items: [] }
  ];
  // virtual entry for the current (unsaved) chat — newest first
  const currentInList = aiCurrentSessionId && list.some(s => s.id === aiCurrentSessionId);
  if (aiMessages.length && !currentInList) {
    groups[0].items.unshift({
      id: '__current__', title: t('ai.curSession'), time: Date.now(), messages: aiMessages
    });
  }
  for (const s of list) {
    const age = now - (s.time || 0);
    if (age < 86400000) groups[0].items.push(s);
    else if (age < 7 * 86400000) groups[1].items.push(s);
    else groups[2].items.push(s);
  }

  let html = '';
  for (const g of groups) {
    if (!g.items.length) continue;
    html += '<div class="aih-grp">' + t(g.key) + '</div>';
    for (const s of g.items) {
      const isCur = s.id === '__current__';
      const active = s.id === aiCurrentSessionId ? ' active' : '';
      const pending = _pendingDeleteId === s.id;
      const count = (s.messages || []).length;
      if (isCur) {
        html += '<div class="aih-item cur' + active + '">'
          + '<div class="aih-l1"><span class="aih-t">● ' + _escHtml(s.title) + '</span>'
          + '<span class="aih-act del confirm">' + t('ai.unsaved') + '</span></div>'
          + '<div class="aih-l2"><span class="aih-count">' + count + t('ai.msgsUnit') + '</span></div>'
          + '</div>';
        continue;
      }
      html += '<div class="aih-item' + active + '" data-sid="' + s.id + '" onclick="_loadSession(\'' + s.id + '\')">'
        + '<div class="aih-l1"><span class="aih-t">' + _escHtml(s.title) + '</span>'
        + '<span class="aih-time">' + _fmtRel(s.time) + '</span></div>'
        + '<div class="aih-l2"><span class="aih-count">' + count + t('ai.msgsUnit') + '</span>'
        + '<span class="aih-acts">'
        + '<span class="aih-act" title="' + t('ai.rename') + '" onclick="event.stopPropagation();_renameSession(\'' + s.id + '\')">✎</span>'
        + '<span class="aih-act del' + (pending ? ' confirm' : '') + '" onclick="event.stopPropagation();_deleteSession(\'' + s.id + '\')">' + (pending ? '✓' : '✕') + '</span>'
        + '</span></div>'
        + '</div>';
    }
  }
  if (!html) html = '<div class="aih-empty">' + t('ai.noHistory') + '</div>';
  container.innerHTML = html;
}
function _fmtRel(ts) {
  const d = new Date(ts), diff = Date.now() - ts;
  const zh = (typeof currentLang !== 'undefined' && currentLang === 'zh');
  if (diff < 60000) return zh ? '刚刚' : 'now';
  if (diff < 3600000) return Math.floor(diff / 60000) + (zh ? ' 分钟前' : 'm ago');
  if (d.toDateString() === new Date().toDateString())
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  return (d.getMonth() + 1) + '/' + d.getDate();
}

function _escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Toggle history sidebar ──
function toggleAIHistory() {
  const panel = document.getElementById('ai-chat-panel');
  const hist = document.getElementById('ai-history');
  const opening = hist.classList.contains('hidden');
  hist.classList.toggle('hidden');
  // the drawer covers the whole panel while open
  panel.classList.toggle('history-open', opening);
  if (opening) {
    document.getElementById('ai-settings').classList.add('hidden');
    panel.classList.remove('settings-open');
    window._histQ = '';
    const se = document.getElementById('ai-history-search');
    if (se) se.value = '';
    _renderHistoryList();
    setTimeout(() => { try { se.focus(); } catch (e) {} }, 80);
  }
}

// ── New chat (clear + start fresh) ──
function newAIChat() {
  if (aiIsStreaming) { _pushHistoryTip(t('ai.stopFirst')); return; }
  // Auto-save current if there are messages
  if (aiMessages.length) _saveCurrentSession();
  aiMessages = [];
  aiCurrentSessionId = null;
  const box = document.getElementById('ai-messages');
  box.innerHTML = '<div class="ai-msg ai-msg-system">' + t('ai.newStarted') + '</div>';
  _renderHistoryList();
}

function toggleAIChat() {
  const panel = document.getElementById('ai-chat-panel');
  const fab = document.getElementById('ai-fab');
  if (!panel) return;
  panel.classList.toggle('hidden');
  const isOpen = !panel.classList.contains('hidden');
  if (isOpen) {
    if (fab) fab.style.display = 'none';
    const input = document.getElementById('ai-input');
    if (input) input.focus();
    if (panel.classList.contains('docked') && window.innerWidth > 1024) {
      document.body.classList.add('ai-docked');
    }
  } else {
    if (fab) fab.style.display = 'flex';
    document.body.classList.remove('ai-docked');
  }
}

function toggleAIDock() {
  const panel = document.getElementById('ai-chat-panel');
  const btn = document.getElementById('ai-dock-btn');
  if (!panel) return;
  const isDocked = panel.classList.contains('docked');
  if (isDocked) {
    panel.classList.remove('docked');
    document.body.classList.remove('ai-docked');
    if (btn) {
      btn.title = t('ai.dock') || '分屏停靠';
      btn.setAttribute('aria-label', t('ai.dock') || '分屏停靠');
      btn.textContent = '◫';
    }
    try { localStorage.setItem('cyberedu_ai_docked', '0'); } catch(e) {}
  } else {
    panel.classList.add('docked');
    panel.classList.remove('hidden');
    const fab = document.getElementById('ai-fab');
    if (fab) fab.style.display = 'none';
    if (window.innerWidth > 1024) {
      document.body.classList.add('ai-docked');
    }
    if (btn) {
      btn.title = t('ai.undock') || '取消停靠';
      btn.setAttribute('aria-label', t('ai.undock') || '取消停靠');
      btn.textContent = '❐';
    }
    try { localStorage.setItem('cyberedu_ai_docked', '1'); } catch(e) {}
    const input = document.getElementById('ai-input');
    if (input) input.focus();
  }
}

function initAIDock() {
  try {
    const isDocked = localStorage.getItem('cyberedu_ai_docked') === '1';
    const panel = document.getElementById('ai-chat-panel');
    const btn = document.getElementById('ai-dock-btn');
    if (isDocked && panel) {
      panel.classList.add('docked');
      if (btn) {
        btn.title = t('ai.undock') || '取消停靠';
        btn.setAttribute('aria-label', t('ai.undock') || '取消停靠');
        btn.textContent = '❐';
      }
      if (!panel.classList.contains('hidden') && window.innerWidth > 1024) {
        document.body.classList.add('ai-docked');
      }
    }
  } catch(e) {}
}

function toggleAISettings() {
  const panel = document.getElementById('ai-chat-panel');
  const settings = document.getElementById('ai-settings');
  const opening = settings.classList.contains('hidden');
  settings.classList.toggle('hidden');
  // while settings are open, give them the whole window (messages/input hidden via CSS)
  panel.classList.toggle('settings-open', opening);
  if (opening) document.getElementById('ai-history').classList.add('hidden');
}

function saveAISettings() {
  const url    = document.getElementById('ai-api-url').value.trim();
  const key    = document.getElementById('ai-api-key').value.trim();
  const model  = document.getElementById('ai-model').value.trim();
  const apiType = document.getElementById('ai-api-type').value;
  if (!url || !key || !model) { alert(t('ai.configError')); return; }
  try {
    localStorage.setItem('cyberedu_ai_type',        apiType);
    localStorage.setItem('cyberedu_ai_url',         url);
    localStorage.setItem('cyberedu_ai_key',          key);
    localStorage.setItem('cyberedu_ai_model',        model);
    localStorage.setItem('cyberedu_ai_temp',         document.getElementById('ai-temperature').value);
    localStorage.setItem('cyberedu_ai_max_tokens',   document.getElementById('ai-max-tokens').value.trim());
    localStorage.setItem('cyberedu_ai_thinking',      document.getElementById('ai-thinking').checked ? '1' : '0');
  } catch(e) {}
  document.getElementById('ai-settings').classList.add('hidden');
  addAIMsg('system', t('ai.saved'));
}

function loadAISettings() {
  try {
    const apiType = localStorage.getItem('cyberedu_ai_type')      || 'openai';
    const url     = localStorage.getItem('cyberedu_ai_url')       || '';
    const key     = localStorage.getItem('cyberedu_ai_key')       || '';
    const model   = localStorage.getItem('cyberedu_ai_model')     || '';
    const temp    = localStorage.getItem('cyberedu_ai_temp')      || '0.7';
    const mt      = localStorage.getItem('cyberedu_ai_max_tokens') || '4096';
    const think   = localStorage.getItem('cyberedu_ai_thinking')  || '1';
    const typeSel = document.getElementById('ai-api-type');
    if (typeSel) typeSel.value = apiType;
    document.getElementById('ai-api-url').value     = url;
    document.getElementById('ai-api-key').value     = key;
    document.getElementById('ai-model').value       = model;
    document.getElementById('ai-temperature').value = temp;
    document.getElementById('ai-max-tokens').value  = mt;
    document.getElementById('ai-thinking').checked  = (think === '1');
    document.getElementById('ai-temp-val').textContent = temp;
  } catch(e) {}
}

function getAIConfig() {
  return {
    apiType:   document.getElementById('ai-api-type')?.value || 'openai',
    apiUrl:    (document.getElementById('ai-api-url').value.trim()    || localStorage.getItem('cyberedu_ai_url')   || '').trim(),
    apiKey:    (document.getElementById('ai-api-key').value.trim()    || localStorage.getItem('cyberedu_ai_key')   || '').trim(),
    model:     (document.getElementById('ai-model').value.trim()      || localStorage.getItem('cyberedu_ai_model') || '').trim(),
    temperature: parseFloat(document.getElementById('ai-temperature').value)   || 0.7,
    max_tokens: parseInt(document.getElementById('ai-max-tokens').value, 10)    || 4096,
    thinking:   document.getElementById('ai-thinking').checked,
  };
}

function addAIMsg(role, content) {
  const box = document.getElementById('ai-messages');
  const div = document.createElement('div');
  const cls = role === 'user' ? 'ai-msg-user'
            : role === 'error' ? 'ai-msg-error'
            : role === 'thinking' ? 'ai-msg-thinking'
            : 'ai-msg-ai';
  div.className = 'ai-msg ' + cls;
  div.innerHTML = (role === 'thinking')
    ? '<details class="ai-thinking-details"><summary>' + t('ai.thinkingDetail') + '</summary><div class="ai-thinking-body"></div></details>'
    : formatAIContent(content || '');
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function formatAIContent(text) {
  if (!text) return '';
  // HTML escape first
  let h = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Extract completed code blocks to placeholders to protect their newlines
  const codeBlocks = [];
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code class="lang-${lang}">${code}</code></pre>`);
    return `<!--CODE_BLOCK_${idx}-->`;
  });

  // Also handle open (unclosed) code block during streaming
  h = h.replace(/```(\w*)\n([\s\S]*)$/, (match, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code class="lang-${lang}">${code}</code></pre>`);
    return `<!--CODE_BLOCK_${idx}-->`;
  });

  // Inline code
  h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>')
    // Headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // Blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered list items
    .replace(/^[\s]*[-*] (.+)$/gm, '<li>$1</li>')
    // Horizontal rule
    .replace(/^[-*]{3,}$/gm, '<hr>')
    // Line breaks for prose
    .replace(/\n/g, '<br>');

  // Restore code blocks with clean newlines
  codeBlocks.forEach((block, idx) => {
    h = h.replace(`<!--CODE_BLOCK_${idx}-->`, block);
  });

  return h;
}

// Smart scroll: follow the stream only when the user is already near the bottom
function aiAutoScroll(box) {
  if (box.scrollHeight - box.scrollTop - box.clientHeight < 140) box.scrollTop = box.scrollHeight;
}

// Code-block copy buttons + Prism highlighting + per-message action bar
function attachAIMessageTools(div, rawText) {
  div.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.ai-code-copy')) return;
    pre.style.position = 'relative';
    const btn = document.createElement('button');
    btn.className = 'ai-code-copy';
    btn.textContent = t('ai.copy');
    btn.onclick = () => {
      navigator.clipboard.writeText(pre.innerText).then(() => {
        btn.textContent = t('ai.copied');
        setTimeout(() => btn.textContent = t('ai.copy'), 1200);
      });
    };
    pre.appendChild(btn);
  });
  if (window.Prism) { try { Prism.highlightAllUnder(div); } catch (e) {} }
  if (div.querySelector('.ai-msg-actions')) return;
  const bar = document.createElement('div');
  bar.className = 'ai-msg-actions';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'ai-action-btn';
  copyBtn.textContent = t('ai.copy');
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(rawText || div.innerText).then(() => {
      copyBtn.textContent = t('ai.copied');
      setTimeout(() => copyBtn.textContent = t('ai.copy'), 1200);
    });
  };
  const retryBtn = document.createElement('button');
  retryBtn.className = 'ai-action-btn';
  retryBtn.textContent = t('ai.retry');
  retryBtn.onclick = () => {
    if (aiIsStreaming || !lastUserText) return;
    const wrappers = document.querySelectorAll('#ai-messages .ai-response-wrapper');
    if (wrappers.length) wrappers[wrappers.length - 1].remove();
    sendAIMessage(lastUserText);
  };
  bar.appendChild(copyBtn);
  bar.appendChild(retryBtn);
  div.appendChild(bar);
}

// Regenerate helper used by the retry button above
function regenerateLastAIMessage() {
  if (aiIsStreaming || !lastUserText) return;
  sendAIMessage(lastUserText);
}

function handleAIKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAIMessage();
  }
}

// System prompt for the AI tutor
const AI_SYS_PROMPT = '你是一位专业的网络安全学习导师，精通编程基础、密码学、网络协议、Web安全、渗透测试、恶意软件分析和CTF竞赛。\n请用简明准确的中文回答学生的问题：\n- 由浅入深，适合初学者理解\n- 必要时提供代码示例（Python / Bash / C）\n- 标注相关风险和法律边界\n- 不直接给出CTF flag，而是引导解题思路';

async function sendAIMessage(forcedText) {
  if (aiIsStreaming) {
    // clicking send while streaming acts as STOP
    if (aiAbortController) aiAbortController.abort();
    return;
  }
  const input = document.getElementById('ai-input');
  const text  = (forcedText !== undefined) ? forcedText : input.value.trim();
  if (!text) return;

  const config = getAIConfig();
  if (!config.apiUrl || !config.apiKey || !config.model) {
    toggleAISettings();
    addAIMsg('system', t('ai.noApi'));
    return;
  }

  // ── Build messages with system prompt + context ──
  const sysPrompt = AI_SYS_PROMPT.slice();
  const curTitle = document.querySelector('.module-card.active h3, .section-card.active h3');
  if (curTitle) sysPrompt += '\n当前学习章节：' + curTitle.textContent.trim();

  const msgsForApi = [{ role: 'system', content: sysPrompt }];
  for (const m of aiMessages) msgsForApi.push(m);
  msgsForApi.push({ role: 'user', content: text });

  // ── UI: user message + AI placeholder ──
  addAIMsg('user', text);
  aiMessages.push({ role: 'user', content: text });
  lastUserText = text;
  if (forcedText === undefined) {
    input.value = '';
    input.style.height = 'auto';
  }

  // Container: thinking div comes BEFORE aiDiv in DOM
  const box = document.getElementById('ai-messages');
  const wrapper = document.createElement('div');
  wrapper.className = 'ai-response-wrapper';
  box.appendChild(wrapper);

  let thinkDiv = null;
  const aiDiv = document.createElement('div');
  aiDiv.className = 'ai-msg ai-msg-ai';
  aiDiv.innerHTML = '<span class="ai-thinking-hint">' + t('ai.thinking') + '</span>';
  wrapper.appendChild(aiDiv);

  aiIsStreaming = true;
  aiAbortController = new AbortController();
  const sendBtn = document.getElementById('ai-send-btn');
  sendBtn.disabled = false;                 // stays clickable — now acts as STOP
  sendBtn.classList.add('ai-streaming');
  sendBtn.textContent = '■';
  sendBtn.title = t('ai.stop');

  let aiText = '';
  let thinkText = '';
  let usageInfo = null;
  let buf = '';
  let contentStarted = false;

  try {
    const endpoint = config.apiType === 'anthropic' ? '/api/chat/anthropic' : '/api/chat';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: aiAbortController.signal,
      body: JSON.stringify({
        apiUrl:     config.apiUrl,
        apiType:    config.apiType || 'openai',
        apiKey:      config.apiKey,
        model:       config.model,
        messages:    msgsForApi,
        temperature: config.temperature,
        max_tokens:  config.max_tokens,
        thinking:    config.thinking ? { type: 'enabled' } : { type: 'disabled' },
      }),
    });

    if (!res.ok) {
      const errJ = await res.json().catch(() => ({}));
      throw new Error(errJ.error || ('HTTP ' + res.status));
    }

    // ── Read SSE stream ──
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      if (aiAbortController?.signal?.aborted) {
        await reader.cancel().catch(() => {});
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || ''; // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        try {
          const chunk  = JSON.parse(payload);
          const choice = chunk.choices?.[0];
          const delta  = choice?.delta || {};

          // ── Thinking / reasoning ──
          if (delta.reasoning_content) {
            thinkText += delta.reasoning_content;
            if (!thinkDiv) {
              thinkDiv = document.createElement('div');
              thinkDiv.className = 'ai-msg ai-msg-thinking';
              thinkDiv.innerHTML = '<details class="ai-thinking-details" open><summary>' + t('ai.thinkingDetail') + '</summary><div class="ai-thinking-body"></div></details>';
              wrapper.insertBefore(thinkDiv, aiDiv);
            }
            const body = thinkDiv.querySelector('.ai-thinking-body');
            if (body) body.innerHTML = formatAIContent(thinkText);
            aiAutoScroll(box);
          }

          // ── Main content ──
          if (delta.content) {
            if (!contentStarted) {
              contentStarted = true;
              // Collapse thinking once answer starts
              if (thinkDiv) {
                const details = thinkDiv.querySelector('.ai-thinking-details');
                if (details) details.removeAttribute('open');
              }
            }
            aiText += delta.content;
            aiDiv.innerHTML = formatAIContent(aiText) + '<span class="ai-cursor"></span>';
            aiAutoScroll(box);
          }

          // ── Usage stats (final chunk) ──
          if (chunk.usage) usageInfo = chunk.usage;
        } catch (e) { /* skip */ }
      }
    }

    // ── Finalize response ──
    aiDiv.innerHTML = formatAIContent(aiText);
    attachAIMessageTools(aiDiv, aiText);

    if (thinkDiv && thinkText) {
      const rTokens = usageInfo?.completion_tokens_details?.reasoning_tokens;
      thinkDiv.querySelector('summary').textContent =
        '🧠 ' + t('ai.thinkingProcess') + (rTokens ? ' · ' + rTokens + ' tokens' : '') + t('ai.tokens') + '</summary>';
    } else if (thinkDiv) {
      thinkDiv.remove();
    }

    // Token usage tag
    if (usageInfo) {
      const tag = document.createElement('span');
      tag.className = 'ai-usage-tag';
      const r = usageInfo.completion_tokens_details?.reasoning_tokens;
      tag.textContent = t('ai.inputTokens') + usageInfo.prompt_tokens + ' · ' + t('ai.outputTokens') + usageInfo.completion_tokens
        + (r ? t('ai.thinkingTokens') + r + t('ai.tokens') : '');
      aiDiv.appendChild(tag);
    }

    aiMessages.push({ role: 'assistant', content: aiText });
    if (aiMessages.length > 20) aiMessages = aiMessages.slice(-20);

    // Auto-save to history
    _saveCurrentSession();
    _renderHistoryList();

  } catch (e) {
    if (e.name === 'AbortError') {
      // user pressed stop — keep whatever was generated
      aiDiv.innerHTML = formatAIContent(aiText);
      const stopTag = document.createElement('span');
      stopTag.className = 'ai-usage-tag';
      stopTag.textContent = t('ai.stopped');
      aiDiv.appendChild(stopTag);
      if (aiText) {
        attachAIMessageTools(aiDiv, aiText);
        aiMessages.push({ role: 'assistant', content: aiText });
      }
    } else {
      aiDiv.className = 'ai-msg ai-msg-error';
      aiDiv.innerHTML = '⚠ ' + _escHtml(e.message);
      if (thinkDiv) thinkDiv.remove();
      const bar = document.createElement('div');
      bar.className = 'ai-msg-actions';
      const retry = document.createElement('button');
      retry.className = 'ai-action-btn';
      retry.textContent = t('ai.retry');
      retry.onclick = () => { if (!aiIsStreaming && lastUserText) { bar.remove(); aiDiv.remove(); sendAIMessage(lastUserText); } };
      bar.appendChild(retry);
      aiDiv.appendChild(bar);
    }
  }

  aiIsStreaming = false;
  aiAbortController = null;
  const btn = document.getElementById('ai-send-btn');
  btn.classList.remove('ai-streaming');
  btn.textContent = '→';
  btn.title = '';
  document.getElementById('ai-input').focus();
}

function clearAIChat() {
  newAIChat();
}

function initAIChat() {
  loadAISettings();
  // Restore last session
  const list = _histLoad();
  if (list.length) {
    _loadSession(list[0].id); // load most recent
  }
  // Temperature slider → live display
  const tempSlider = document.getElementById('ai-temperature');
  if (tempSlider) {
    tempSlider.addEventListener('input', function() {
      document.getElementById('ai-temp-val').textContent = this.value;
    });
  }
  // Auto-resize textarea
  const input = document.getElementById('ai-input');
  if (input) {
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }
  initAIDock();
}

// ============================================================
// CYBEREDU INTERACTIVE TRAINING PLATFORM ENGINE
// 1. In-Article Micro-Sandboxes
// 2. Interactive Diagrams & State Machines
// 3. Context-Aware AI Tutor (Selection, Checkpoint, Code Audit)
// 4. Skill Diagnostic & SVG Radar Assessment
// 5. Lab Environment Modal & Docker Recipes
// ============================================================

// ── Pure Simulator Logic (Node & Browser Compatible) ──

function simulateSQLQuery(username, password, mode) {
  const u = username || '';
  const p = password || '';
  if (mode === 'safe') {
    const isExact = (u === 'admin' && p === 'admin123');
    return {
      mode: 'safe',
      sql: 'SELECT * FROM users WHERE username = ? AND password = ?',
      params: [u, p],
      injected: false,
      results: isExact
        ? [{ id: 1, username: 'admin', role: 'administrator', email: 'admin@cybershop.local' }]
        : []
    };
  }
  const rawSql = `SELECT * FROM users WHERE username = '${u}' AND password = '${p}'`;
  const isBypassed = /'(\s*or\s*|\s*\|\|\s*)('?[^'\s]+'?|\d+)\s*=\s*('?[^'\s]+'?|\d+)/i.test(u) ||
                     /admin'(\s*--|\s*#)/i.test(u);
  const isUnion = /union\s+select/i.test(u);
  
  let results = [];
  if (isUnion) {
    results = [
      { id: 1, username: 'admin', role: 'administrator', email: 'admin@cybershop.local' },
      { id: 2, username: 'root_shadow', role: 'db_root', email: 'hash:$6$qZ7$eX... (LEAKED!)' }
    ];
  } else if (isBypassed) {
    results = [
      { id: 1, username: 'admin', role: 'administrator', email: 'admin@cybershop.local' },
      { id: 2, username: 'bob', role: 'staff', email: 'bob@cybershop.local' }
    ];
  } else if (u === 'admin' && p === 'admin123') {
    results = [{ id: 1, username: 'admin', role: 'administrator', email: 'admin@cybershop.local' }];
  }
  return {
    mode: 'vuln',
    sql: rawSql,
    injected: isBypassed || isUnion,
    results
  };
}

function simulateXSS(payload, mode) {
  const p = payload || '';
  if (mode === 'escaped') {
    const escaped = p
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return { rendered: escaped, triggered: false, mode };
  }
  if (mode === 'blacklist') {
    const stripped = p.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    const triggered = /<[a-z]+[^>]*?(on\w+|javascript:)[^>]*>/i.test(stripped) ||
                      /<(img|svg|iframe|body|input|audio|video)/i.test(stripped);
    return { rendered: stripped, triggered: Boolean(triggered), mode };
  }
  const triggered = /<[a-z]+[\s\S]*?>/i.test(p);
  return { rendered: p, triggered: Boolean(triggered), mode };
}

function simulateCmdInj(hostInput, mode) {
  const input = hostInput || '127.0.0.1';
  if (mode === 'safe') {
    const isIp = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input.trim());
    if (!isIp) {
      return {
        command: `execFile('ping', ['-c', '1', '${input}'])`,
        output: 'ping: invalid hostname / argument rejected by whitelist',
        injected: false,
        mode: 'safe'
      };
    }
    return {
      command: `execFile('ping', ['-c', '1', '${input}'])`,
      output: `PING ${input} (56 bytes of data).\n64 bytes from ${input}: icmp_seq=1 ttl=64 time=0.045 ms\n1 packets transmitted, 1 received, 0% packet loss`,
      injected: false,
      mode: 'safe'
    };
  }
  const fullCmd = `ping -c 1 ${input}`;
  const hasDelimiter = /[;&|`]/.test(input);
  let extraOut = '';
  if (/whoami/i.test(input)) {
    extraOut = '\n\n[INJECTED PROCESS]: www-data (uid=33)';
  } else if (/cat\s+\/etc\/passwd/i.test(input)) {
    extraOut = '\n\n[INJECTED PROCESS]: root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin';
  } else if (/id/i.test(input)) {
    extraOut = '\n\n[INJECTED PROCESS]: uid=33(www-data) gid=33(www-data) groups=33(www-data)';
  }
  return {
    command: fullCmd,
    output: `PING 127.0.0.1: 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.038 ms${extraOut}`,
    injected: hasDelimiter,
    mode: 'vuln'
  };
}

function hexToBinary(hex) {
  let bin = '';
  for (let i = 0; i < hex.length; i++) {
    bin += parseInt(hex[i], 16).toString(2).padStart(4, '0');
  }
  return bin;
}

function countBitDiff(hex1, hex2) {
  const b1 = hexToBinary(hex1);
  const b2 = hexToBinary(hex2);
  let diff = 0;
  const len = Math.min(b1.length, b2.length);
  for (let i = 0; i < len; i++) {
    if (b1[i] !== b2[i]) diff++;
  }
  return { diff, totalBits: len, percent: ((diff / len) * 100).toFixed(1) };
}

function calculateRadarPolygon(scores, radius, centerX, centerY) {
  const total = scores.length;
  const points = [];
  for (let i = 0; i < total; i++) {
    const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
    const r = (Math.max(10, Math.min(100, scores[i])) / 100) * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

function evaluateDiagnosticTrack(scores) {
  const [web, net, crypto, sys, ctf] = scores;
  const whitehatMatch = Math.round((web * 0.5 + net * 0.3 + sys * 0.2));
  const ctferMatch = Math.round((crypto * 0.4 + ctf * 0.4 + web * 0.2));
  const avg = (web + net + crypto + sys + ctf) / 5;
  const beginnerMatch = Math.round(100 - Math.min(100, avg * 0.7));

  return [
    {
      id: 'track-whitehat',
      titleKey: 'diag.trackWhitehat',
      descKey: 'diag.trackWhitehatDesc',
      match: Math.max(30, Math.min(99, whitehatMatch)),
      priorityModules: ['websec', 'pentest', 'network']
    },
    {
      id: 'track-ctfer',
      titleKey: 'diag.trackCtfer',
      descKey: 'diag.trackCtferDesc',
      match: Math.max(30, Math.min(99, ctferMatch)),
      priorityModules: ['cryptography', 'ctf-guide', 'malware']
    },
    {
      id: 'track-beginner',
      titleKey: 'diag.trackBeginner',
      descKey: 'diag.trackBeginnerDesc',
      match: Math.max(40, Math.min(99, beginnerMatch)),
      priorityModules: ['programming', 'network', 'websec']
    }
  ].sort((a, b) => b.match - a.match);
}

// ── Browser UI Rendering Handlers ──

let currentSqliMode = 'vuln';
let currentXssMode = 'raw';
let currentCmdMode = 'vuln';

function renderPlaygrounds(sectionContentKey) {
  if (typeof document === 'undefined') return;
  const article = document.getElementById('article-body');
  if (!article) return;
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';

  // 1. SQL Injection Sandbox in web-01-01
  if (sectionContentKey === 'web-01-01' && !document.getElementById('sandbox-sqli')) {
    const box = document.createElement('div');
    box.id = 'sandbox-sqli';
    box.className = 'interactive-sandbox';
    box.innerHTML = `
      <div class="sandbox-header">
        <div class="sandbox-title-wrap">
          <span class="sandbox-badge">LIVE LAB</span>
          <span class="sandbox-title">${isEn ? '⚡ Micro-Sandbox: SQL Injection vs Prepared Statements' : '⚡ 交互微沙箱：SQL 注入拼接与预编译对比'}</span>
        </div>
        <div class="sandbox-modes">
          <button class="sandbox-mode-btn active" id="btn-sqli-vuln" onclick="setSQLiMode('vuln')">${isEn ? 'String Concat (Vulnerable)' : '拼接查询 (Vulnerable)'}</button>
          <button class="sandbox-mode-btn safe-mode" id="btn-sqli-safe" onclick="setSQLiMode('safe')">${isEn ? 'Prepared Statements (Safe)' : '参数化预编译 (Safe)'}</button>
        </div>
      </div>
      <div class="sandbox-body">
        <div class="sandbox-row">
          <span class="sandbox-label">${isEn ? 'Username (User):' : '用户名 (User):'}</span>
          <input type="text" id="sqli-user-input" class="sandbox-input" value="admin' OR '1'='1" oninput="updateSQLiSandbox()">
        </div>
        <div class="sandbox-row">
          <span class="sandbox-label">${isEn ? 'Password (Pass):' : '密码 (Pass):'}</span>
          <input type="text" id="sqli-pass-input" class="sandbox-input" value="anything" oninput="updateSQLiSandbox()">
        </div>
        <div class="sandbox-preset-pills">
          <span style="font-size:11px;color:var(--text-muted)">${isEn ? 'Quick Payloads:' : '快速注入 Payload:'}</span>
          <span class="sandbox-pill" onclick="fillSQLi(&quot;admin' OR '1'='1&quot;,&quot;anything&quot;)">' OR '1'='1</span>
          <span class="sandbox-pill" onclick="fillSQLi(&quot;admin'--&quot;,&quot;&quot;)">admin'--</span>
          <span class="sandbox-pill" onclick="fillSQLi(&quot;' UNION SELECT 1,username,password FROM users--&quot;,&quot;&quot;)">${isEn ? 'UNION SELECT Leak' : 'UNION SELECT 拖库'}</span>
          <span class="sandbox-pill" onclick="fillSQLi(&quot;admin&quot;,&quot;admin123&quot;)">${isEn ? 'Valid Admin Login' : '正常账号登录'}</span>
        </div>
        <div class="sandbox-output-box">
          <div class="sandbox-output-title">${isEn ? 'Underlying Generated SQL Query:' : '后端生成的实际 SQL 语句:'}</div>
          <div id="sqli-sql-preview" class="sandbox-sql-code"></div>
        </div>
        <div class="sandbox-output-box">
          <div class="sandbox-output-title">${isEn ? 'Database Execution & Result Set:' : '数据库执行与查询结果:'}</div>
          <div id="sqli-db-result"></div>
        </div>
      </div>`;
    const target = article.querySelector('h2') || article.firstChild;
    if (target) target.parentNode.insertBefore(box, target.nextSibling);
    updateSQLiSandbox();
  }

  // 2. XSS Sandbox in web-03-01 / web-01
  if ((sectionContentKey === 'web-04-01' || sectionContentKey === 'web-03-01' || sectionContentKey === 'web-01') && !document.getElementById('sandbox-xss')) {
    const box = document.createElement('div');
    box.id = 'sandbox-xss';
    box.className = 'interactive-sandbox';
    box.innerHTML = `
      <div class="sandbox-header">
        <div class="sandbox-title-wrap">
          <span class="sandbox-badge">LIVE LAB</span>
          <span class="sandbox-title">${isEn ? '⚡ Micro-Sandbox: XSS Filtering & Context Escaping' : '⚡ 交互微沙箱：XSS 过滤与上下文逃逸演练'}</span>
        </div>
        <div class="sandbox-modes">
          <button class="sandbox-mode-btn active" id="btn-xss-raw" onclick="setXSSMode('raw')">${isEn ? 'No Filter (Raw)' : '无过滤 (Raw)'}</button>
          <button class="sandbox-mode-btn" id="btn-xss-blk" onclick="setXSSMode('blacklist')">${isEn ? 'Blacklist (<script>)' : '黑名单过滤 (<script>)'}</button>
          <button class="sandbox-mode-btn safe-mode" id="btn-xss-esc" onclick="setXSSMode('escaped')">${isEn ? 'HTML Entity Escaped (Safe)' : 'HTML 实体转义 (Safe)'}</button>
        </div>
      </div>
      <div class="sandbox-body">
        <div class="sandbox-row">
          <span class="sandbox-label">${isEn ? 'Injected Payload:' : '注入输入 (Payload):'}</span>
          <input type="text" id="xss-input" class="sandbox-input" value="&lt;img src=x onerror=alert('XSS')&gt;" oninput="updateXSSSandbox()">
        </div>
        <div class="sandbox-preset-pills">
          <span style="font-size:11px;color:var(--text-muted)">${isEn ? 'Test Payloads:' : '测试 Payload:'}</span>
          <span class="sandbox-pill" onclick="fillXSS(&quot;&lt;script&gt;alert('XSS')&lt;/script&gt;&quot;)">${isEn ? 'Basic <script>' : '<script> 基础'}</span>
          <span class="sandbox-pill" onclick="fillXSS(&quot;&lt;img src=x onerror=alert('Bypass')&gt;&quot;)">${isEn ? '<img onerror> Event' : '<img onerror> 事件逃逸'}</span>
          <span class="sandbox-pill" onclick="fillXSS(&quot;&lt;svg onload=alert(document.domain)&gt;&quot;)">${isEn ? '<svg onload> Bypass' : '<svg onload> 绕过'}</span>
          <span class="sandbox-pill" onclick="fillXSS(&quot;&lt;a href='javascript:alert(1)'&gt;click me&lt;/a&gt;&quot;)">${isEn ? 'Pseudo-protocol Link' : '伪协议链接'}</span>
        </div>
        <div class="sandbox-output-box">
          <div class="sandbox-output-title">${isEn ? 'Sanitized Backend HTML Output:' : '后端净化处理后的 HTML 输出:'}</div>
          <code id="xss-code-preview" style="color:#67e8f9"></code>
        </div>
        <div class="sandbox-output-box">
          <div class="sandbox-output-title">${isEn ? 'Browser DOM Sandbox Render State:' : '浏览器安全沙箱渲染状态:'}</div>
          <div id="xss-render-status"></div>
        </div>
      </div>`;
    const target = article.querySelector('h2') || article.firstChild;
    if (target) target.parentNode.insertBefore(box, target.nextSibling);
    updateXSSSandbox();
  }

  // 3. Hash & Avalanche Sandbox in crypto-04-01
  if (sectionContentKey === 'crypto-04-01' && !document.getElementById('sandbox-hash')) {
    const box = document.createElement('div');
    box.id = 'sandbox-hash';
    box.className = 'interactive-sandbox';
    box.innerHTML = `
      <div class="sandbox-header">
        <div class="sandbox-title-wrap">
          <span class="sandbox-badge">LIVE LAB</span>
          <span class="sandbox-title">${isEn ? '⚡ Micro-Sandbox: SHA-256 Avalanche Effect Real-Time Observation' : '⚡ 交互微沙箱：哈希雪崩效应 (Avalanche Effect) 实时观测'}</span>
        </div>
      </div>
      <div class="sandbox-body">
        <div class="sandbox-row">
          <span class="sandbox-label">${isEn ? 'Baseline Plaintext:' : '基准明文:'}</span>
          <input type="text" id="hash-base-input" class="sandbox-input" value="CyberEdu" readonly style="opacity:0.7">
        </div>
        <div class="sandbox-row">
          <span class="sandbox-label">${isEn ? 'Test Plaintext:' : '测试明文:'}</span>
          <input type="text" id="hash-test-input" class="sandbox-input" value="CyberEdv" oninput="updateHashSandbox()">
        </div>
        <div class="sandbox-preset-pills">
          <span style="font-size:11px;color:var(--text-muted)">${isEn ? 'Quick Tweaks:' : '快速尝试微调:'}</span>
          <span class="sandbox-pill" onclick="fillHash('CyberEdu')">${isEn ? 'Identical (0% flip)' : '完全相同 (0% 翻转)'}</span>
          <span class="sandbox-pill" onclick="fillHash('CyberEdv')">${isEn ? 'Change 1 char at end' : '改动末尾 1 字符'}</span>
          <span class="sandbox-pill" onclick="fillHash('cyberedu')">${isEn ? 'Toggle first letter case' : '仅改首字母大小写'}</span>
          <span class="sandbox-pill" onclick="fillHash('CyberEdu!')">${isEn ? 'Append exclamation mark' : '增加一个感叹号'}</span>
        </div>
        <div class="sandbox-output-box">
          <div class="sandbox-output-title">${isEn ? 'SHA-256 Comparison & Bit-Flip Metric:' : 'SHA-256 哈希比对与二进制位翻转率:'}</div>
          <div id="hash-avalanche-result" style="font-family:var(--font-mono);font-size:12px"></div>
        </div>
      </div>`;
    const target = article.querySelector('h2') || article.firstChild;
    if (target) target.parentNode.insertBefore(box, target.nextSibling);
    updateHashSandbox();
  }

  // 4. Command Injection Sandbox in web-02-01
  if (sectionContentKey === 'web-02-01' && !document.getElementById('sandbox-cmd')) {
    const box = document.createElement('div');
    box.id = 'sandbox-cmd';
    box.className = 'interactive-sandbox';
    box.innerHTML = `
      <div class="sandbox-header">
        <div class="sandbox-title-wrap">
          <span class="sandbox-badge">LIVE LAB</span>
          <span class="sandbox-title">${isEn ? '⚡ Micro-Sandbox: Command Injection & Subprocess Spawning' : '⚡ 交互微沙箱：命令注入字符截断与进程衍生'}</span>
        </div>
        <div class="sandbox-modes">
          <button class="sandbox-mode-btn active" id="btn-cmd-vuln" onclick="setCmdMode('vuln')">${isEn ? 'String Concat system()' : '字符串拼接 system()'}</button>
          <button class="sandbox-mode-btn safe-mode" id="btn-cmd-safe" onclick="setCmdMode('safe')">${isEn ? 'Argument Isolation execFile()' : '参数隔离 execFile()'}</button>
        </div>
      </div>
      <div class="sandbox-body">
        <div class="sandbox-row">
          <span class="sandbox-label">${isEn ? 'Ping Target Host:' : 'Ping 目标地址:'}</span>
          <input type="text" id="cmd-input" class="sandbox-input" value="127.0.0.1; whoami" oninput="updateCmdSandbox()">
        </div>
        <div class="sandbox-preset-pills">
          <span style="font-size:11px;color:var(--text-muted)">${isEn ? 'Sample Payloads:' : 'Payload 示例:'}</span>
          <span class="sandbox-pill" onclick="fillCmd('127.0.0.1; whoami')">127.0.0.1; whoami</span>
          <span class="sandbox-pill" onclick="fillCmd('127.0.0.1 && cat /etc/passwd')">&& cat /etc/passwd</span>
          <span class="sandbox-pill" onclick="fillCmd('127.0.0.1 | id')">| id</span>
          <span class="sandbox-pill" onclick="fillCmd('8.8.8.8')">${isEn ? 'Normal IP' : '正常 IP 地址'}</span>
        </div>
        <div class="sandbox-output-box">
          <div class="sandbox-output-title">${isEn ? 'Underlying Executed Command:' : '底层执行指令:'}</div>
          <code id="cmd-code-preview" style="color:#f59e0b"></code>
        </div>
        <div class="sandbox-output-box">
          <div class="sandbox-output-title">${isEn ? 'Terminal Simulated Standard Output:' : '终端模拟标准回显:'}</div>
          <pre id="cmd-terminal-preview" style="margin:0;color:#00ff41;white-space:pre-wrap"></pre>
        </div>
      </div>`;
    const target = article.querySelector('h2') || article.firstChild;
    if (target) target.parentNode.insertBefore(box, target.nextSibling);
    updateCmdSandbox();
  }
}

// ── Playground Interactivity Helpers ──

function setSQLiMode(mode) {
  currentSqliMode = mode;
  document.getElementById('btn-sqli-vuln')?.classList.toggle('active', mode === 'vuln');
  document.getElementById('btn-sqli-safe')?.classList.toggle('active', mode === 'safe');
  updateSQLiSandbox();
}

function fillSQLi(u, p) {
  const uIn = document.getElementById('sqli-user-input');
  const pIn = document.getElementById('sqli-pass-input');
  if (uIn) uIn.value = u;
  if (pIn) pIn.value = p;
  updateSQLiSandbox();
}

function updateSQLiSandbox() {
  const u = document.getElementById('sqli-user-input')?.value || '';
  const p = document.getElementById('sqli-pass-input')?.value || '';
  const prev = document.getElementById('sqli-sql-preview');
  const res = document.getElementById('sqli-db-result');
  if (!prev || !res) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const sim = simulateSQLQuery(u, p, currentSqliMode);
  if (currentSqliMode === 'safe') {
    prev.innerHTML = `SELECT * FROM users WHERE username = <span class="param-safe">?</span> AND password = <span class="param-safe">?</span>\n<span style="color:#888">// ${isEn ? 'Bound parameters' : '绑定参数'}: [username="${_escHtml(u)}", password="${_escHtml(p)}"]</span>`;
  } else {
    prev.innerHTML = `SELECT * FROM users WHERE username = '<span class="${sim.injected ? 'injected' : ''}">${_escHtml(u)}</span>' AND password = '<span class="${sim.injected ? 'injected' : ''}">${_escHtml(p)}</span>'`;
  }

  if (sim.results.length > 0) {
    let rows = sim.results.map(r => `
      <tr class="${sim.injected ? 'leak' : ''}">
        <td>${r.id}</td>
        <td><strong>${_escHtml(r.username)}</strong></td>
        <td><span class="badge ${r.role.includes('admin') || r.role.includes('root') ? 'red' : 'cyan'}">${r.role}</span></td>
        <td><code>${_escHtml(r.email)}</code></td>
      </tr>`).join('');
    const alertMsg = sim.injected
      ? (isEn ? '🚨 SQL Injection Exploit Successful! Authentication bypassed / database leaked!' : '🚨 成功发生 SQL 注入绕过验证 / 数据泄露！')
      : (isEn ? '✓ Authentication Successful: Valid user found in database.' : '✓ 验证通过，查询到合法用户');
    res.innerHTML = `
      <div class="sandbox-alert ${sim.injected ? 'danger' : 'success'}">
        <span>${alertMsg}</span>
      </div>
      <table class="sandbox-result-table">
        <thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Email / Hash</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } else {
    const defenseMsg = isEn
      ? '🛡️ Parameterized Query Protected: User input is treated strictly as literal data. Injection neutralized, 0 rows matched.'
      : '🛡️ 参数化查询成功防御：输入字符被严格作为普通字面量比对，注入失效，0 行数据匹配。';
    const failedMsg = isEn
      ? '○ Login Failed: Username or password did not match any record (0 rows returned).'
      : '○ 登录失败：用户名或密码未匹配任何记录 (0 rows returned)。';
    res.innerHTML = `
      <div class="sandbox-alert ${currentSqliMode === 'safe' && sim.injected ? 'success' : ''}" style="color:var(--text-muted)">
        <span>${currentSqliMode === 'safe' ? defenseMsg : failedMsg}</span>
      </div>`;
  }
}

function setXSSMode(mode) {
  currentXssMode = mode;
  document.getElementById('btn-xss-raw')?.classList.toggle('active', mode === 'raw');
  document.getElementById('btn-xss-blk')?.classList.toggle('active', mode === 'blacklist');
  document.getElementById('btn-xss-esc')?.classList.toggle('active', mode === 'escaped');
  updateXSSSandbox();
}

function fillXSS(p) {
  const input = document.getElementById('xss-input');
  if (input) input.value = p;
  updateXSSSandbox();
}

function updateXSSSandbox() {
  const p = document.getElementById('xss-input')?.value || '';
  const codeEl = document.getElementById('xss-code-preview');
  const statusEl = document.getElementById('xss-render-status');
  if (!codeEl || !statusEl) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const sim = simulateXSS(p, currentXssMode);
  codeEl.textContent = sim.rendered;

  if (sim.triggered) {
    statusEl.innerHTML = `
      <div class="sandbox-alert danger">
        <span>${isEn ? '🚨 <strong>XSS Exploit Triggered!</strong> Payload escaped into live DOM elements and executed in active browsing context!' : '🚨 <strong>XSS 漏洞触发！</strong> 攻击代码成功逃逸为原生 HTML DOM 节点，触发执行上下文！'}</span>
      </div>
      <div style="margin-top:8px;padding:8px;background:rgba(255,68,102,0.1);border-radius:4px;border-left:3px solid var(--color-red)">
        <span style="font-size:11px;color:#ff6b85">${isEn ? 'Simulated Alert Dialog:' : '模拟弹窗告警:'} <code>[Alert Dialog]: XSS Executed in origin https://cybershop.local</code></span>
      </div>`;
  } else {
    statusEl.innerHTML = `
      <div class="sandbox-alert success">
        <span>${isEn ? '🛡️ <strong>Safely Neutralized</strong>: Characters escaped to plain-text entities. The browser will never parse them as executable scripts.' : '🛡️ <strong>安全阻断</strong>：字符已被有效转义为纯文本实体显示，浏览器不会解析为可执行标签。'}</span>
      </div>
      <div style="margin-top:8px;padding:8px;background:rgba(0,255,65,0.06);border-radius:4px">
        <span style="font-size:11px;color:var(--color-green)">${isEn ? 'Visitor Viewport Plaintext Presentation:' : '页面呈现给访客的纯文本效果:'} <code>${_escHtml(sim.rendered)}</code></span>
      </div>`;
  }
}

// Simple JS SHA-256 fallback for Hash Sandbox
async function computeSha256Hex(str) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Deterministic lightweight hash fallback
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').repeat(8);
}

function fillHash(str) {
  const el = document.getElementById('hash-test-input');
  if (el) el.value = str;
  updateHashSandbox();
}

async function updateHashSandbox() {
  const base = document.getElementById('hash-base-input')?.value || 'CyberEdu';
  const test = document.getElementById('hash-test-input')?.value || '';
  const out = document.getElementById('hash-avalanche-result');
  if (!out) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const h1 = await computeSha256Hex(base);
  const h2 = await computeSha256Hex(test);
  const diff = countBitDiff(h1, h2);

  out.innerHTML = `
    <div style="margin-bottom:6px">${isEn ? 'Baseline SHA-256:' : '基准 SHA-256:'} <code style="color:var(--color-cyan)">${h1}</code></div>
    <div style="margin-bottom:10px">${isEn ? 'Test SHA-256:' : '测试 SHA-256:'} <code style="color:var(--color-purple)">${h2}</code></div>
    <div class="sandbox-alert ${parseFloat(diff.percent) > 40 ? 'success' : 'danger'}">
      <span>${isEn ? `⚡ <strong>Avalanche Metric</strong>: <strong>${diff.diff} of 256 bits</strong> flipped (Flip Rate <strong>${diff.percent}%</strong>, ideal cryptographic target ~50%).` : `⚡ <strong>雪崩效应统计</strong>: 256 位哈希中共有 <strong>${diff.diff} 位</strong> 发生了翻转（翻转率 <strong>${diff.percent}%</strong>，理想密码学雪崩率 ~50%）。`}</span>
    </div>`;
}

function setCmdMode(mode) {
  currentCmdMode = mode;
  document.getElementById('btn-cmd-vuln')?.classList.toggle('active', mode === 'vuln');
  document.getElementById('btn-cmd-safe')?.classList.toggle('active', mode === 'safe');
  updateCmdSandbox();
}

function fillCmd(cmd) {
  const el = document.getElementById('cmd-input');
  if (el) el.value = cmd;
  updateCmdSandbox();
}

function updateCmdSandbox() {
  const input = document.getElementById('cmd-input')?.value || '';
  const codeEl = document.getElementById('cmd-code-preview');
  const termEl = document.getElementById('cmd-terminal-preview');
  if (!codeEl || !termEl) return;

  const sim = simulateCmdInj(input, currentCmdMode);
  codeEl.textContent = sim.command;
  termEl.textContent = sim.output;
}

// ── 2. Interactive Diagrams & State Machines ──

let tcpStep = 0;
let tcpTimer = null;

function renderDiagrams(sectionContentKey) {
  if (typeof document === 'undefined') return;
  const article = document.getElementById('article-body');
  if (!article) return;
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';

  // 1. TCP 3-Way Handshake in net-01-01 / net-02
  if ((sectionContentKey === 'net-01-01' || sectionContentKey === 'net-01-02' || sectionContentKey === 'net-02-01') && !document.getElementById('diagram-tcp')) {
    const box = document.createElement('div');
    box.id = 'diagram-tcp';
    box.className = 'interactive-diagram';
    box.innerHTML = `
      <div class="diagram-header">
        <div class="diagram-title">
          <span class="diagram-badge">INTERACTIVE DIAGRAM</span>
          <span>${isEn ? 'TCP 3-Way Handshake & State Machine Simulator' : 'TCP 三次握手与状态机动态演示 (Interactive 3-Way Handshake)'}</span>
        </div>
      </div>
      <div class="diagram-canvas-wrap">
        <div id="tcp-svg-container" style="display:flex;justify-content:center"></div>
      </div>
      <div class="diagram-controls">
        <button class="diagram-btn" onclick="stepTCP(-1)">${isEn ? '← Prev' : '← 上一步'}</button>
        <button class="diagram-btn primary" onclick="stepTCP(1)">${isEn ? 'Next →' : '下一步 →'}</button>
        <button class="diagram-btn" id="btn-tcp-auto" onclick="toggleAutoTCP()">${isEn ? '▶ Auto Play' : '▶ 自动播放'}</button>
        <button class="diagram-btn" onclick="resetTCP()">${isEn ? '↺ Reset' : '↺ 重置'}</button>
        <div class="diagram-state-pill" id="tcp-state-indicator">${isEn ? 'State: ' : '当前状态: '}<span>CLOSED</span></div>
      </div>`;
    const target = article.querySelector('h2') || article.firstChild;
    if (target) target.parentNode.insertBefore(box, target.nextSibling);
    renderTCPState();
  }

  // 2. Stack Buffer Overflow Visualizer in prog-02-02 / ctfg-01-01
  if ((sectionContentKey === 'prog-02-02' || sectionContentKey === 'ctfg-01-01') && !document.getElementById('diagram-stack')) {
    const box = document.createElement('div');
    box.id = 'diagram-stack';
    box.className = 'interactive-diagram';
    box.innerHTML = `
      <div class="diagram-header">
        <div class="diagram-title">
          <span class="diagram-badge">INTERACTIVE DIAGRAM</span>
          <span>${isEn ? 'Stack Buffer Overflow & Return Address Hijack Visualizer' : '栈缓冲区溢出与返回地址劫持演示 (Stack Overflow Visualizer)'}</span>
        </div>
      </div>
      <div class="sandbox-row" style="margin-bottom:12px">
        <span class="sandbox-label">${isEn ? 'Write to Buffer:' : '写入缓冲区:'}</span>
        <input type="text" id="stack-input" class="sandbox-input" value="AAAAAAAAAAAAAAAA" oninput="updateStackVisualizer()">
      </div>
      <div class="sandbox-preset-pills" style="margin-bottom:14px">
        <span style="font-size:11px;color:var(--text-muted)">${isEn ? 'Payload Length:' : '注入长度:'}</span>
        <span class="sandbox-pill" onclick="fillStack('AAAA')">${isEn ? '4 Bytes (Safe)' : '4 字节 (安全)'}</span>
        <span class="sandbox-pill" onclick="fillStack('AAAAAAAAAAAAAAAA')">${isEn ? '16 Bytes (Fill Buffer)' : '16 字节 (填满 Buffer)'}</span>
        <span class="sandbox-pill" onclick="fillStack('AAAAAAAAAAAAAAAA'+'BBBB')">${isEn ? '20 Bytes (Corrupt Saved EBP)' : '20 字节 (覆盖 Saved EBP)'}</span>
        <span class="sandbox-pill" onclick="fillStack('AAAAAAAAAAAAAAAA'+'BBBB'+'\\x41\\x41\\x41\\x41')">${isEn ? '24 Bytes (Hijack EIP/RIP!)' : '24 字节 (劫持 EIP/RIP!)'}</span>
      </div>
      <div class="stack-mem-container" id="stack-mem-display"></div>`;
    const target = article.querySelector('h2') || article.firstChild;
    if (target) target.parentNode.insertBefore(box, target.nextSibling);
    updateStackVisualizer();
  }

  // 3. Diffie-Hellman Key Exchange in crypto-03-01
  if (sectionContentKey === 'crypto-03-01' && !document.getElementById('diagram-dh')) {
    const box = document.createElement('div');
    box.id = 'diagram-dh';
    box.className = 'interactive-diagram';
    box.innerHTML = `
      <div class="diagram-header">
        <div class="diagram-title">
          <span class="diagram-badge">INTERACTIVE DIAGRAM</span>
          <span>${isEn ? 'Diffie-Hellman Key Exchange: Color Mixing Analogy' : 'Diffie-Hellman 密钥协商色彩混合模型 (Color Exchange Analogy)'}</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-around;align-items:center;flex-wrap:wrap;gap:12px;padding:16px 0">
        <div style="text-align:center">
          <div style="font-size:12px;font-weight:700;color:var(--color-cyan);margin-bottom:6px">${isEn ? 'Alice (Private: Red)' : 'Alice (私钥: 红色)'}</div>
          <div style="width:50px;height:50px;background:#ef4444;border-radius:50%;margin:0 auto;box-shadow:0 0 12px rgba(239,68,68,0.5)"></div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${isEn ? 'Private Secret a' : '私密秘密 A'}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:12px;font-weight:700;color:var(--color-orange);margin-bottom:6px">${isEn ? 'Public Base (Yellow)' : '公开底色 (黄色)'}</div>
          <div style="width:50px;height:50px;background:#eab308;border-radius:50%;margin:0 auto;box-shadow:0 0 12px rgba(234,179,8,0.5)"></div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${isEn ? 'Public to all (g, p)' : '所有人可见 (g, p)'}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:12px;font-weight:700;color:var(--color-purple);margin-bottom:6px">${isEn ? 'Bob (Private: Blue)' : 'Bob (私钥: 蓝色)'}</div>
          <div style="width:50px;height:50px;background:#3b82f6;border-radius:50%;margin:0 auto;box-shadow:0 0 12px rgba(59,130,246,0.5)"></div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${isEn ? 'Private Secret b' : '私密秘密 B'}</div>
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:6px;font-size:12px;line-height:1.6">
        <div>${isEn ? '<strong>Exchange Mixed Colors</strong>: Alice sends Orange (Yellow+Red); Bob sends Green (Yellow+Blue). Eve intercepts Orange and Green, but the <strong>Discrete Logarithm Problem</strong> ensures Eve cannot isolate the original Red and Blue!' : '<strong>传输混合色</strong>: Alice 发送 橙色 (黄+红)，Bob 发送 绿色 (黄+蓝)。窃听者 Eve 在信道中截获了橙色和绿色，但<strong>离散对数难题</strong>确保了 Eve 无法分离出原始的红色和蓝色！'}</div>
        <div style="margin-top:8px;color:var(--color-green)">${isEn ? '<strong>Derive Shared Secret</strong>: Alice adds Green to Red = Brown; Bob adds Orange to Blue = Brown. Both parties arrive at the identical shared session key without ever transmitting their private keys!' : '<strong>协商达成共同密钥</strong>: Alice 将绿色加入红色 = 棕色；Bob 将橙色加入蓝色 = 棕色。双方在不传递私钥的前提下，安全生成了完全相同的共享会话密钥！'}</div>
      </div>`;
    const target = article.querySelector('h2') || article.firstChild;
    if (target) target.parentNode.insertBefore(box, target.nextSibling);
  }
}

// TCP Diagram Steps
function stepTCP(delta) {
  tcpStep = Math.max(0, Math.min(3, tcpStep + delta));
  renderTCPState();
}
function resetTCP() {
  tcpStep = 0;
  if (tcpTimer) { clearInterval(tcpTimer); tcpTimer = null; }
  document.getElementById('btn-tcp-auto')?.classList.remove('primary');
  renderTCPState();
}
function toggleAutoTCP() {
  if (tcpTimer) {
    clearInterval(tcpTimer);
    tcpTimer = null;
    document.getElementById('btn-tcp-auto')?.classList.remove('primary');
  } else {
    document.getElementById('btn-tcp-auto')?.classList.add('primary');
    tcpTimer = setInterval(() => {
      tcpStep = (tcpStep + 1) % 4;
      renderTCPState();
    }, 1800);
  }
}

function renderTCPState() {
  const c = document.getElementById('tcp-svg-container');
  const pill = document.getElementById('tcp-state-indicator');
  if (!c) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const states = isEn ? [
    { title: 'Step 0: Disconnected (CLOSED / LISTEN)', clientState: 'CLOSED', serverState: 'LISTEN', pkt: null },
    { title: 'Step 1: Client initiates handshake (SYN)', clientState: 'SYN_SENT', serverState: 'LISTEN', pkt: 'SYN [seq=100]', dir: 'right', y: 70 },
    { title: 'Step 2: Server responds & synchronizes (SYN-ACK)', clientState: 'SYN_SENT', serverState: 'SYN_RCVD', pkt: 'SYN+ACK [seq=300, ack=101]', dir: 'left', y: 130 },
    { title: 'Step 3: Client confirms connection (ACK)', clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', pkt: 'ACK [seq=101, ack=301]', dir: 'right', y: 190 }
  ] : [
    { title: 'Step 0: 未连接 (CLOSED / LISTEN)', clientState: 'CLOSED', serverState: 'LISTEN', pkt: null },
    { title: 'Step 1: 客户端发起握手 (SYN)', clientState: 'SYN_SENT', serverState: 'LISTEN', pkt: 'SYN [seq=100]', dir: 'right', y: 70 },
    { title: 'Step 2: 服务端确认并同步 (SYN-ACK)', clientState: 'SYN_SENT', serverState: 'SYN_RCVD', pkt: 'SYN+ACK [seq=300, ack=101]', dir: 'left', y: 130 },
    { title: 'Step 3: 客户端确认连接建立 (ACK)', clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', pkt: 'ACK [seq=101, ack=301]', dir: 'right', y: 190 }
  ];
  const cur = states[tcpStep];
  if (pill) pill.innerHTML = `${isEn ? 'Current Phase: ' : '当前阶段: '}<span>${cur.title}</span>`;

  let packetSvg = '';
  if (cur.pkt) {
    const x1 = cur.dir === 'right' ? 140 : 440;
    const x2 = cur.dir === 'right' ? 440 : 140;
    packetSvg = `
      <line x1="${x1}" y1="${cur.y}" x2="${x2}" y2="${cur.y}" stroke="${cur.dir === 'right' ? '#00f0ff' : '#a855f7'}" stroke-width="2" stroke-dasharray="4,4"/>
      <polygon points="${x2},${cur.y - 4} ${x2 + (cur.dir === 'right' ? 8 : -8)},${cur.y} ${x2},${cur.y + 4}" fill="${cur.dir === 'right' ? '#00f0ff' : '#a855f7'}"/>
      <rect x="230" y="${cur.y - 14}" width="160" height="22" rx="4" fill="#0d111a" stroke="rgba(255,255,255,0.2)"/>
      <text x="310" y="${cur.y + 1}" fill="#fff" font-size="10" font-family="monospace" text-anchor="middle">${cur.pkt}</text>`;
  }

  c.innerHTML = `
    <svg width="600" height="230" viewBox="0 0 600 230" style="max-width:100%;height:auto">
      <!-- Client Node -->
      <rect x="40" y="20" width="100" height="36" rx="4" fill="rgba(0,240,255,0.1)" stroke="#00f0ff" stroke-width="1.5"/>
      <text x="90" y="42" fill="#00f0ff" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">CLIENT</text>
      <line x1="90" y1="56" x2="90" y2="220" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" stroke-dasharray="2,2"/>
      <text x="90" y="215" fill="#888" font-size="10" font-family="monospace" text-anchor="middle">[${cur.clientState}]</text>

      <!-- Server Node -->
      <rect x="440" y="20" width="100" height="36" rx="4" fill="rgba(168,85,247,0.1)" stroke="#a855f7" stroke-width="1.5"/>
      <text x="490" y="42" fill="#a855f7" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">SERVER</text>
      <line x1="490" y1="56" x2="490" y2="220" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" stroke-dasharray="2,2"/>
      <text x="490" y="215" fill="#888" font-size="10" font-family="monospace" text-anchor="middle">[${cur.serverState}]</text>

      <!-- Packets -->
      ${packetSvg}
    </svg>`;
}

// Stack Visualizer
function fillStack(val) {
  const input = document.getElementById('stack-input');
  if (input) input.value = val;
  updateStackVisualizer();
}

function updateStackVisualizer() {
  const val = document.getElementById('stack-input')?.value || '';
  const container = document.getElementById('stack-mem-display');
  if (!container) return;

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const len = val.length;
  let bufState = 'safe', ebpState = 'safe', eipState = 'safe';
  let eipVal = '0x08048450 (&main+42)';

  if (len > 20) {
    bufState = 'warning';
    ebpState = 'warning';
    eipState = 'hijacked';
    eipVal = '0x41414141 (🔥 HIJACKED!)';
  } else if (len > 16) {
    bufState = 'warning';
    ebpState = 'warning';
  }

  const bufLabel = isEn
    ? `${len}/16 Bytes (${len > 16 ? 'Overflow +' + (len - 16) + 'B' : 'Normal'})`
    : `${len}/16 字节 (${len > 16 ? '溢出 ' + (len - 16) + ' 字节' : '正常'})`;

  const ebpLabel = isEn
    ? (len > 16 ? '⚠️ Corrupted by user input' : 'Saved Base Pointer (0xbffff760)')
    : (len > 16 ? '⚠️ 已被用户数据篡改' : '原基址指针 (0xbffff760)');

  const alertContent = isEn
    ? '🚨 <strong>Critical Overflow Alert</strong>: Return address (EIP/RIP) overwritten! When "ret" executes, CPU control jumps to attacker-supplied address!'
    : '🚨 <strong>严重溢出告警</strong>：函数返回地址 (EIP) 已被覆写！当函数执行 ret 指令时，CPU 将跳转至攻击者指定的地址执行任意代码！';

  container.innerHTML = `
    <div class="stack-cell ${bufState}">
      <span>[0xbffff740 - 0xbffff74f] char buffer[16]</span>
      <span>${bufLabel}</span>
    </div>
    <div class="stack-cell ${ebpState}">
      <span>[0xbffff750 - 0xbffff753] Saved EBP (4B)</span>
      <span>${ebpLabel}</span>
    </div>
    <div class="stack-cell ${eipState}">
      <span>[0xbffff754 - 0xbffff757] Return EIP (4B)</span>
      <span>${eipVal}</span>
    </div>
    ${len > 20 ? `<div class="sandbox-alert danger" style="margin-top:8px">${alertContent}</div>` : ''}`;
}

// ── 3. Context-Aware AI Tutor Integrations ──

function initSelectionAITooltip() {
  if (typeof document === 'undefined') return;
  const tip = document.getElementById('ai-selection-tooltip');
  if (!tip) return;

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      tip.style.display = 'none';
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 2) {
      tip.style.display = 'none';
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const article = document.getElementById('article-body');
    if (!article || !article.contains(range.commonAncestorContainer)) {
      tip.style.display = 'none';
      return;
    }
    tip.style.display = 'flex';
    tip.style.left = `${rect.left + rect.width / 2}px`;
    tip.style.top = `${rect.top + window.scrollY - 8}px`;
  });
}

function triggerSelectionAI() {
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : '';
  const tip = document.getElementById('ai-selection-tooltip');
  if (tip) tip.style.display = 'none';
  if (!text) return;

  const panel = document.getElementById('ai-chat-panel');
  if (panel && panel.classList.contains('hidden')) {
    toggleAIChat();
  }
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const curTitle = document.getElementById('hub-title')?.textContent || (isEn ? 'Current Section' : '当前章节');
  const prompt = isEn
    ? `I am studying "${curTitle}" and have questions about the following text. Please explain it clearly with real-world cybersecurity scenarios:\n> "${text}"`
    : `我正在研读【${curTitle}】，对以下内容存在疑惑，请用深入浅出、结合实战场景的语言为我剖析：\n> "${text}"`;
  sendAIMessage(prompt);
  if (sel) sel.removeAllRanges();
}

function askAICheckpoint(key, idx, opt) {
  const panel = document.getElementById('ai-chat-panel');
  if (panel && panel.classList.contains('hidden')) {
    toggleAIChat();
  }
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const cpSet = (isEn && typeof SECTION_CHECKPOINTS_EN !== 'undefined' && SECTION_CHECKPOINTS_EN[key])
    ? SECTION_CHECKPOINTS_EN[key]
    : (typeof SECTION_CHECKPOINTS !== 'undefined' ? SECTION_CHECKPOINTS[key] : null);
  const cp = cpSet ? cpSet[idx] : null;
  const curTitle = document.getElementById('hub-title')?.textContent || (isEn ? 'Current Section' : '当前章节');
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const userChoice = cp?.options[opt] ? `${letters[opt]}. ${cp.options[opt]}` : (isEn ? 'Option' : '选项');
  const correctChoice = cp?.options[cp.answer] ? `${letters[cp.answer]}. ${cp.options[cp.answer]}` : (isEn ? 'Correct Answer' : '正确选项');

  const prompt = isEn
    ? `I am studying "${curTitle}" and selected the wrong answer on quiz question #${idx + 1}.\nQuestion: ${cp ? cp.question : ''}\nMy incorrect answer: ${userChoice}\nCorrect answer: ${correctChoice}\nExplanation: ${cp ? cp.explanation : ''}\nPlease analyze why I fell into this trap, and explain the core cybersecurity principle so I can master it.`
    : `我正在学习【${curTitle}】，在做第 ${idx + 1} 道自测题时选错了。\n题目：${cp ? cp.question : ''}\n我的错误选择：${userChoice}\n正确答案：${correctChoice}\n官方解析：${cp ? cp.explanation : ''}\n请帮我分析：我为什么容易掉入这个陷阱？这个知识点的底层核心逻辑应该怎么牢固掌握？`;
  sendAIMessage(prompt);
}

function attachCodeAITools() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('#article-body .code-block').forEach(cb => {
    if (cb.querySelector('.code-toolbar')) return;

    // Remove legacy standalone copy-btn to avoid duplicate buttons
    const oldCopy = cb.querySelector('.copy-btn');
    if (oldCopy) oldCopy.remove();

    cb.style.position = 'relative';

    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';

    // 1. Font Size Cycle Button (12px -> 13px -> 15px -> 17px)
    const sizeBtn = document.createElement('button');
    sizeBtn.className = 'code-tool-btn code-size-btn';
    sizeBtn.setAttribute('type', 'button');
    sizeBtn.setAttribute('title', t('code.fontSize') || 'Font Size');
    sizeBtn.innerHTML = '🗛 <span class="size-label">13px</span>';
    const sizes = ['12px', '13px', '15px', '17px'];
    let curSizeIdx = 1;
    sizeBtn.onclick = (e) => {
      e.stopPropagation();
      curSizeIdx = (curSizeIdx + 1) % sizes.length;
      const newSize = sizes[curSizeIdx];
      const pre = cb.querySelector('pre');
      const code = cb.querySelector('code');
      if (pre) pre.style.fontSize = newSize;
      if (code) code.style.fontSize = newSize;
      const label = sizeBtn.querySelector('.size-label');
      if (label) label.textContent = newSize;
    };

    // 2. Fullscreen Mode Toggle
    const fsBtn = document.createElement('button');
    fsBtn.className = 'code-tool-btn code-fs-btn';
    fsBtn.setAttribute('type', 'button');
    fsBtn.setAttribute('title', t('code.fullscreen') || 'Fullscreen');
    fsBtn.innerHTML = `⛶ <span>${t('code.fullscreen') || '全屏'}</span>`;
    fsBtn.onclick = (e) => {
      e.stopPropagation();
      const isFs = cb.classList.contains('fullscreen');
      if (isFs) {
        cb.classList.remove('fullscreen');
        document.body.classList.remove('code-fullscreen-active');
        fsBtn.innerHTML = `⛶ <span>${t('code.fullscreen') || '全屏'}</span>`;
      } else {
        document.querySelectorAll('.code-block.fullscreen').forEach(other => other.classList.remove('fullscreen'));
        cb.classList.add('fullscreen');
        document.body.classList.add('code-fullscreen-active');
        fsBtn.innerHTML = `✕ <span>${t('code.exitFullscreen') || '退出'}</span>`;
      }
    };

    // 3. Copy Code
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-tool-btn code-copy-btn';
    copyBtn.setAttribute('type', 'button');
    copyBtn.setAttribute('title', t('ai.copy') || 'Copy');
    copyBtn.innerHTML = `📋 <span>${t('ai.copy') || '复制'}</span>`;
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const codeEl = cb.querySelector('code') || cb.querySelector('pre');
      const codeText = codeEl ? codeEl.textContent : '';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.innerHTML = `✓ <span>${t('ai.copied') || '已复制'}</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = `📋 <span>${t('ai.copy') || '复制'}</span>`;
          }, 1500);
        }).catch(() => {});
      }
    };

    // 4. AI Security Audit
    const aiBtn = document.createElement('button');
    aiBtn.className = 'code-tool-btn code-ai-btn';
    aiBtn.setAttribute('type', 'button');
    aiBtn.setAttribute('title', t('ai.auditCode') || 'AI Audit');
    aiBtn.innerHTML = `🔍 <span>${(t('ai.auditCode') || 'AI 剖析').replace(/^🔍\s*/, '')}</span>`;
    aiBtn.onclick = (e) => {
      e.stopPropagation();
      const code = cb.querySelector('code')?.textContent || '';
      const panel = document.getElementById('ai-chat-panel');
      if (panel && panel.classList.contains('hidden')) toggleAIChat();
      const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
      const curTitle = document.getElementById('hub-title')?.textContent || (isEn ? 'Current Section' : '当前章节');
      const prompt = isEn
        ? `As a senior cybersecurity expert, please conduct a security audit and line-by-line breakdown of the following code from "${curTitle}". Identify any vulnerabilities and provide hardened remediation code:\n\`\`\`\n${code}\n\`\`\``
        : `请作为资深安全专家，对【${curTitle}】中的以下代码进行安全审计与逐行技术剖析，指出其是否存在安全漏洞，并给出加固修复方案：\n\`\`\`\n${code}\n\`\`\``;
      sendAIMessage(prompt);
    };

    toolbar.appendChild(sizeBtn);
    toolbar.appendChild(fsBtn);
    toolbar.appendChild(copyBtn);
    toolbar.appendChild(aiBtn);

    cb.insertBefore(toolbar, cb.firstChild);
  });
}

// ── 4. Skill Diagnostic & SVG Radar Assessment ──

const DIAGNOSTIC_QUESTIONS = [
  {
    category: 'Web 安全',
    categoryEn: 'Web Security',
    question: '在防御 SQL 注入漏洞时，以下哪种方式能够从根本上消除漏洞？',
    questionEn: 'When defending against SQL injection vulnerabilities, which approach fundamentally eliminates the vulnerability?',
    options: [
      '在客户端用 JavaScript 正则过滤单引号与敏感词',
      '使用服务端参数化预编译查询 (Prepared Statements)',
      '部署 Web 应用防火墙 (WAF) 过滤常见 Payload',
      '将所有用户输入通过 md5 散列后再存入数据库'
    ],
    optionsEn: [
      'Filter single quotes and sensitive keywords via client-side JavaScript regex',
      'Use server-side parameterized prepared queries (Prepared Statements)',
      'Deploy a Web Application Firewall (WAF) to filter common payloads',
      'Hash all user input with MD5 before storing into the database'
    ],
    answer: 1
  },
  {
    category: '网络协议',
    categoryEn: 'Network Protocols',
    question: '在 TCP 三次握手过程中，服务端收到 SYN 报文并回复 SYN-ACK 后，服务端处于什么状态？',
    questionEn: 'During the TCP 3-way handshake, what state does the server enter after receiving SYN and replying with SYN-ACK?',
    options: [
      'CLOSED 状态',
      'ESTABLISHED 状态',
      'SYN_RCVD 状态',
      'TIME_WAIT 状态'
    ],
    optionsEn: [
      'CLOSED state',
      'ESTABLISHED state',
      'SYN_RCVD state',
      'TIME_WAIT state'
    ],
    answer: 2
  },
  {
    category: '密码学',
    categoryEn: 'Cryptography',
    question: '在使用对称加密时，为什么 ECB 模式被强烈建议禁止在生产环境中使用？',
    questionEn: 'When using symmetric encryption, why is ECB mode strictly discouraged in production environments?',
    options: [
      'ECB 模式加解密计算开销过大',
      'ECB 无法隐藏明文的数据模式，相同的明文块始终产生相同的密文块',
      'ECB 模式只能加密固定 8 字节的数据',
      'ECB 模式的密钥长度必须超过 2048 位'
    ],
    optionsEn: [
      'ECB mode introduces excessive computational overhead',
      'ECB leaks plaintext patterns: identical plaintext blocks always produce identical ciphertext blocks',
      'ECB mode can only encrypt fixed 8-byte data',
      'ECB key lengths must exceed 2048 bits'
    ],
    answer: 1
  },
  {
    category: '系统安全',
    categoryEn: 'System Security',
    question: '关于 Linux 系统中 SUID 特殊权限文件的描述，以下正确的是？',
    questionEn: 'Which of the following statements about Linux SUID permission files is correct?',
    options: [
      '普通用户执行带有 SUID 的文件时，将临时以该文件所有者（如 root）的权限执行',
      'SUID 只能赋予目录，不能赋予可执行文件',
      '拥有 SUID 的文件在执行时会自动将普通用户加入 wheel 组',
      'SUID 文件无法被普通用户读取或执行'
    ],
    optionsEn: [
      'When an unprivileged user executes an SUID file, it temporarily runs with the permissions of the file owner (e.g., root)',
      'SUID can only be assigned to directories, not executable files',
      'Executing an SUID file automatically adds standard users to the wheel group',
      'SUID files cannot be read or executed by unprivileged users'
    ],
    answer: 0
  },
  {
    category: 'CTF/二进制',
    categoryEn: 'CTF / Binary',
    question: '经典栈缓冲区溢出 (Stack Overflow) 能够劫持程序执行流的核心机理是覆盖了栈上的什么内容？',
    questionEn: 'What is the core mechanism by which a classic stack buffer overflow hijacks program control flow?',
    options: [
      '覆盖了堆管理链表指针',
      '覆盖了函数保存的返回地址 (Saved EIP/RIP)',
      '覆盖了全局变量只读区',
      '覆盖了动态链接库的代码段'
    ],
    optionsEn: [
      'Overwriting heap management linked-list pointers',
      'Overwriting the saved return address on the stack (Saved EIP/RIP)',
      'Overwriting the read-only global variable segment',
      'Overwriting code segments in dynamic libraries'
    ],
    answer: 1
  }
];

let diagCurrentStep = 0;
let diagUserAnswers = [];

function openSkillDiagnostic() {
  diagCurrentStep = 0;
  diagUserAnswers = [];
  const container = document.getElementById('diag-modal-container');
  if (!container) return;
  container.style.display = 'block';
  renderDiagnosticStep();
}

function closeSkillDiagnostic() {
  const container = document.getElementById('diag-modal-container');
  if (container) container.style.display = 'none';
}

function renderDiagnosticStep() {
  const container = document.getElementById('diag-modal-container');
  if (!container) return;

  if (diagCurrentStep >= DIAGNOSTIC_QUESTIONS.length) {
    renderDiagnosticResults(container);
    return;
  }

  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const q = DIAGNOSTIC_QUESTIONS[diagCurrentStep];
  const letters = ['A', 'B', 'C', 'D'];
  const categoryLabel = (isEn && q.categoryEn) ? q.categoryEn : q.category;
  const questionLabel = (isEn && q.questionEn) ? q.questionEn : q.question;
  const optionsList = (isEn && q.optionsEn) ? q.optionsEn : q.options;
  const stepIndicator = isEn
    ? `Question ${diagCurrentStep + 1} of ${DIAGNOSTIC_QUESTIONS.length}`
    : `第 ${diagCurrentStep + 1} / ${DIAGNOSTIC_QUESTIONS.length} 题`;

  container.innerHTML = `
    <div class="diag-modal-backdrop" onclick="if(event.target===this)closeSkillDiagnostic()">
      <div class="diag-modal-card">
        <button class="diag-close-btn" onclick="closeSkillDiagnostic()">&times;</button>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-right:36px">
          <span class="badge cyan">${_escHtml(categoryLabel)}</span>
          <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">${stepIndicator}</span>
        </div>
        <h3 style="font-size:16px;color:var(--text-main);margin-bottom:18px;line-height:1.5">${_escHtml(questionLabel)}</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${optionsList.map((opt, i) => `
            <button class="checkpoint-option" onclick="handleDiagnosticAnswer(${i})">
              <span class="opt-letter">${letters[i]}</span>
              <span>${_escHtml(opt)}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
}

function handleDiagnosticAnswer(choice) {
  diagUserAnswers.push(choice);
  diagCurrentStep++;
  renderDiagnosticStep();
}

function renderDiagnosticResults(container) {
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const scores = [0, 0, 0, 0, 0];
  DIAGNOSTIC_QUESTIONS.forEach((q, i) => {
    const isCorrect = (diagUserAnswers[i] === q.answer);
    scores[i] = isCorrect ? 90 : 35;
  });

  const polygonPoints = calculateRadarPolygon(scores, 90, 140, 110);
  const tracks = evaluateDiagnosticTrack(scores);
  const categories = isEn
    ? ['Web Security', 'Network Protocols', 'Cryptography', 'System Privilege', 'CTF Offense']
    : ['Web安全', '网络协议', '密码分析', '系统特权', 'CTF攻防'];

  let catBadges = categories.map((cat, i) => `
    <div style="display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <span style="color:var(--text-muted)">${cat}:</span>
      <span style="color:${scores[i] > 50 ? 'var(--color-green)' : 'var(--color-orange)'};font-weight:700">${scores[i]} ${isEn ? 'pts' : '分'}</span>
    </div>`).join('');

  container.innerHTML = `
    <div class="diag-modal-backdrop" onclick="if(event.target===this)closeSkillDiagnostic()">
      <div class="diag-modal-card" style="max-width:720px">
        <button class="diag-close-btn" onclick="closeSkillDiagnostic()">&times;</button>
        <div style="text-align:center;margin-bottom:16px;padding-right:32px">
          <span class="badge green">EVALUATION COMPLETE</span>
          <h3 style="font-size:18px;color:var(--text-main);margin:8px 0 4px 0">${t('diag.modalTitle')}</h3>
          <p style="font-size:12px;color:var(--text-muted)">${isEn ? 'Based on your diagnostic answers across 5 core cybersecurity domains, here is your skill radar and optimal learning path:' : '基于您对 5 道核心攻防命题的判断，已为您生成五维技能雷达与匹配路线：'}</p>
        </div>

        <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;justify-content:center;margin:16px 0">
          <svg width="280" height="220" viewBox="0 0 280 220">
            <!-- Background Polygons -->
            <polygon points="${calculateRadarPolygon([20,20,20,20,20], 90, 140, 110)}" fill="none" stroke="rgba(255,255,255,0.08)"/>
            <polygon points="${calculateRadarPolygon([40,40,40,40,40], 90, 140, 110)}" fill="none" stroke="rgba(255,255,255,0.08)"/>
            <polygon points="${calculateRadarPolygon([60,60,60,60,60], 90, 140, 110)}" fill="none" stroke="rgba(255,255,255,0.08)"/>
            <polygon points="${calculateRadarPolygon([80,80,80,80,80], 90, 140, 110)}" fill="none" stroke="rgba(255,255,255,0.08)"/>
            <polygon points="${calculateRadarPolygon([100,100,100,100,100], 90, 140, 110)}" fill="none" stroke="rgba(0,240,255,0.2)"/>
            <!-- User Data Polygon -->
            <polygon points="${polygonPoints}" fill="rgba(0,255,65,0.2)" stroke="var(--color-green)" stroke-width="2"/>
            <!-- Labels -->
            <text x="140" y="14" fill="#00f0ff" font-size="10" font-family="monospace" text-anchor="middle">${categories[0]}</text>
            <text x="240" y="80" fill="#00f0ff" font-size="10" font-family="monospace" text-anchor="middle">${categories[1]}</text>
            <text x="210" y="195" fill="#00f0ff" font-size="10" font-family="monospace" text-anchor="middle">${categories[2]}</text>
            <text x="70" y="195" fill="#00f0ff" font-size="10" font-family="monospace" text-anchor="middle">${categories[3]}</text>
            <text x="40" y="80" fill="#00f0ff" font-size="10" font-family="monospace" text-anchor="middle">${categories[4]}</text>
          </svg>
          <div style="flex:1;min-width:180px">
            <h4 style="font-size:13px;color:var(--text-main);margin-bottom:8px">${isEn ? 'Skill Dimension Breakdown' : '能力维度得分明细'}</h4>
            ${catBadges}
          </div>
        </div>

        <h4 style="font-size:14px;color:var(--text-main);margin:18px 0 8px 0">${isEn ? '🎯 Recommended Attack & Defense Learning Track:' : '🎯 为您智能推荐的攻坚路径:'}</h4>
        <div class="diag-tracks-grid">
          ${tracks.map((tr, idx) => `
            <div class="diag-track-card ${idx === 0 ? 'active' : ''}" onclick="applyTargetTrack('${tr.id}', this)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="diag-track-title">${t(tr.titleKey)}</span>
                <span class="badge ${idx === 0 ? 'green' : 'cyan'}">${tr.match}% ${isEn ? 'Match' : '契合'}</span>
              </div>
              <div class="diag-track-desc">${t(tr.descKey)}</div>
              <button class="practice-link-btn" style="width:100%;margin-top:10px;justify-content:center;padding:6px" onclick="event.stopPropagation();applyTargetTrack('${tr.id}', this.parentElement)">
                ${t('diag.setTrack')}
              </button>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function applyTargetTrack(trackId, cardEl) {
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  try {
    localStorage.setItem('cyberedu_target_track', trackId);
  } catch (e) {}
  document.querySelectorAll('.diag-track-card').forEach(c => c.classList.remove('active'));
  if (cardEl) cardEl.classList.add('active');
  alert(isEn
    ? '✓ Successfully set this track as your primary goal! Learning Hub will prioritize relevant chapters for you.'
    : '✓ 已成功将此路线设为您的专属学习目标！学习中心将为您优先推荐对应章节。');
  closeSkillDiagnostic();
}

// ── 5. Lab Environment Modal & Docker Recipes ──

const LAB_RECIPES = {
  'websec': {
    title: 'Web 安全靶场 Docker 一键环境',
    titleEn: 'Web Security Practice Targets - Docker One-Click Labs',
    desc: '推荐在本地使用 Docker 快速拉起标准 Web 漏洞演练镜像（隔离、开箱即用）：',
    descEn: 'Recommended Docker commands to spin up isolated, out-of-the-box web vulnerability practice targets:',
    commands: [
      { name: 'OWASP Juice Shop (现代化漏洞靶场)', nameEn: 'OWASP Juice Shop (Modern Vulnerable Web App)', cmd: 'docker run -d -p 3000:3000 bkimminich/juice-shop' },
      { name: 'DVWA (经典 Web 漏洞演练平台)', nameEn: 'DVWA (Classic Vulnerable Web App)', cmd: 'docker run -d -p 8080:80 vulnerables/web-dvwa' },
      { name: 'SQLi-Labs (专攻 SQL 注入练习)', nameEn: 'SQLi-Labs (Dedicated SQL Injection Practice)', cmd: 'docker run -d -p 8081:80 acgpiano/sqli-labs' }
    ]
  },
  'network': {
    title: '网络协议与流量分析实验环境',
    titleEn: 'Network Protocol & Traffic Analysis Toolchain',
    desc: '本地抓包与数据包构造工具链推荐：',
    descEn: 'Recommended local packet capture and packet crafting toolchains:',
    commands: [
      { name: 'Wireshark 官方 GUI 安装包', nameEn: 'Wireshark Official GUI Installer', cmd: 'winget install WiresharkFoundation.Wireshark' },
      { name: 'Scapy (Python 交互式数据包构建器)', nameEn: 'Scapy (Interactive Python Packet Crafting)', cmd: 'pip install scapy' },
      { name: 'Tcpdump 临时抓包容器', nameEn: 'Tcpdump Ephemeral Capture Container', cmd: 'docker run -it --net=host corfr/tcpdump -i any -c 20' }
    ]
  },
  'cryptography': {
    title: '密码学实验与工具包',
    titleEn: 'Cryptography Lab & Cryptanalysis Toolchain',
    desc: '密码算法验证与破译开发环境：',
    descEn: 'Cryptographic algorithm verification and cryptanalysis development toolkit:',
    commands: [
      { name: 'Python PyCryptodome 密码学库', nameEn: 'Python PyCryptodome & SymPy Libraries', cmd: 'pip install pycryptodome sympy' },
      { name: 'CyberChef (离线瑞士军刀 Web 工具)', nameEn: 'CyberChef (Offline Swiss Army Knife Web Tool)', cmd: 'docker run -d -p 8085:80 ghcr.io/gchq/cyberchef:latest' }
    ]
  },
  'pentest': {
    title: '渗透测试工具链容器',
    titleEn: 'Penetration Testing Toolchain Containers',
    desc: '免去本地环境污染，通过 Docker 使用全套渗透审计工具：',
    descEn: 'Clean, isolated penetration testing containers without polluting your host environment:',
    commands: [
      { name: 'Kali Linux 官方最小化命令行镜像', nameEn: 'Kali Linux Official Minimal CLI Container', cmd: 'docker run -it kalilinux/kali-rolling /bin/bash' },
      { name: 'Sqlmap 自动化注入工具', nameEn: 'Sqlmap Automated SQL Injection Tool', cmd: 'docker run -it --rm paoloo/sqlmap -u "http://target"' }
    ]
  },
  'malware': {
    title: '恶意软件安全分析隔离原则',
    titleEn: 'Malware Analysis Isolation Environments',
    desc: '⚠️ 分析真实样本必须在严格隔离的虚拟机或沙箱中运行！',
    descEn: '⚠️ Always execute and analyze real malware samples in strictly isolated virtual machines or sandboxes!',
    commands: [
      { name: 'REMnux (逆向与恶意软件分析 Linux)', nameEn: 'REMnux (Reverse Engineering & Malware Linux)', cmd: 'https://remnux.org/ (Recommended: import OVA into VirtualBox/VMware)' },
      { name: 'Flare-VM (Windows 逆向分析工具合集)', nameEn: 'Flare-VM (Windows Reverse Engineering Toolkit)', cmd: 'https://github.com/mandiant/flare-vm' }
    ]
  }
};

function openLabDrawer(contentKey) {
  const container = document.getElementById('lab-modal-container');
  if (!container) return;

  let modKey = 'websec';
  if (contentKey.startsWith('net-') || contentKey === 'network') modKey = 'network';
  else if (contentKey.startsWith('crypto-') || contentKey === 'cryptography') modKey = 'cryptography';
  else if (contentKey.startsWith('pentest-')) modKey = 'pentest';
  else if (contentKey.startsWith('malw-') || contentKey === 'malware') modKey = 'malware';

  const lab = LAB_RECIPES[modKey] || LAB_RECIPES['websec'];
  const isEn = typeof currentLang !== 'undefined' && currentLang === 'en';
  const title = (isEn && lab.titleEn) ? lab.titleEn : lab.title;
  const desc = (isEn && lab.descEn) ? lab.descEn : lab.desc;
  const copyText = isEn ? 'Copy' : '复制';
  const copiedText = isEn ? '✓ Copied' : '✓ 已复制';

  container.style.display = 'block';
  container.innerHTML = `
    <div class="diag-modal-backdrop" onclick="if(event.target===this)closeLabDrawer()">
      <div class="diag-modal-card">
        <button class="diag-close-btn" onclick="closeLabDrawer()">&times;</button>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-right:36px">
          <span class="badge purple">LAB RECIPES</span>
          <h3 style="font-size:16px;color:var(--text-main);margin:0">${_escHtml(title)}</h3>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${_escHtml(desc)}</p>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${lab.commands.map(item => `
            <div class="sandbox-output-box">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-size:11px;font-weight:700;color:var(--color-cyan)">${_escHtml((isEn && item.nameEn) ? item.nameEn : item.name)}</span>
                <button class="sandbox-pill" onclick="navigator.clipboard.writeText('${item.cmd.replace(/'/g, "\\'")}');this.textContent='${copiedText}';setTimeout(()=>this.textContent='${copyText}',1500)">${copyText}</button>
              </div>
              <code style="color:#00ff41;word-break:break-all">${_escHtml(item.cmd)}</code>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function closeLabDrawer() {
  const container = document.getElementById('lab-modal-container');
  if (container) container.style.display = 'none';
}



// ============================================================
// INIT
// ============================================================
function initApp() {
  // Hide loading overlay
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) { loadingOverlay.style.opacity = '0'; setTimeout(() => loadingOverlay.remove(), 500); }
  try {
    // restore sidebar state
    if (localStorage.getItem('sidebar_collapsed') === '1') {
      const sb = document.getElementById('sidebar');
      sb.classList.add('collapsed');
      document.getElementById('sidebar-toggle').textContent = '»';
      document.getElementById('sidebar-toggle').title = '展开侧边栏';
    }
    initTheme();
    initCodeMirror();
    initAIChat();
    initAIDock();
    initSelectionAITooltip();
    initMatrix();
    renderHome();
    renderCTF();
    updateSidebar();
    updateStatusBar();
    initCyberLetters();
    setTimeout(tickTypewriter,2800);
    setTimeout(triggerCountUp, 4500);
  } catch(e) { console.error('Init error:', e); }
  // Route based on URL hash if present, otherwise default to home
  let isDirectHash = false;
  try {
    const hash = (window.location.hash || '').replace(/^#\/?/, '');
    const parts = hash.split('/');
    const viewName = parts[0];
    const validViews = ['home', 'hub', 'practice', 'ctf', 'progress', 'tools'];
    if (validViews.includes(viewName)) {
      isDirectHash = (viewName !== 'home');
      if (viewName === 'hub' && parts[1]) {
        navigate('hub', parts[1], parts[2]);
      } else {
        navigate(viewName);
      }
    } else {
      navigate('home');
    }
  } catch(e) {
    try { navigate('home'); } catch(err) {}
  }
  try { initCyberLetters(); } catch(e) { console.error('CyberLetters error:', e); }
  const introAlreadySeen = (() => {
    try { return sessionStorage.getItem('cyberedu_intro_seen') === '1'; } catch(e) { return false; }
  })();
  if (!isDirectHash && !introAlreadySeen) {
    playIntro();
  } else {
    skipIntro(true);
  }
}

// Global hashchange router listener
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const hash = (window.location.hash || '').replace(/^#\/?/, '');
    const parts = hash.split('/');
    const viewName = parts[0];
    const validViews = ['home', 'hub', 'practice', 'ctf', 'progress', 'tools'];
    if (validViews.includes(viewName) && viewName !== currentView) {
      if (viewName === 'hub' && parts[1]) {
        navigate('hub', parts[1], parts[2]);
      } else {
        navigate(viewName);
      }
    }
  });
}
// Run init when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

// ── Service Worker Disabled: Auto-Unregister & Clear Caches ──
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {});
    }
  });
}
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then(names => {
    for (const name of names) {
      caches.delete(name).catch(() => {});
    }
  });
}

// Node.js module export for unit testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    simulateSQLQuery,
    simulateXSS,
    simulateCmdInj,
    countBitDiff,
    calculateRadarPolygon,
    evaluateDiagnosticTrack
  };
}
