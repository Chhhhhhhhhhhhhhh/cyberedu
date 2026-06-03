
// ============================================================
// STATE & PROGRESS
// ============================================================
let userProgress = null;
const PROGRESS_KEY = 'cyberedu_v2_progress';

function defaultProgress() {
  return {
    completedSections: [],
    ctfSolved: [],
    moduleProgress: {},
    timeline: [],
    streak: 1,
    lastVisit: new Date().toISOString().split('T')[0]
  };
}

function initProgress() {
  const local = JSON.parse(localStorage.getItem(PROGRESS_KEY));
  fetch('/api/progress').then(r => r.json()).then(server => {
    if (server && server.completedSections) {
      userProgress = server;
    } else if (local) {
      userProgress = local;
    } else {
      userProgress = defaultProgress();
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(userProgress));
    recalcModuleProgress();
    updateStatusBar();
    updateSidebar();
  }).catch(() => {
    userProgress = local || defaultProgress();
    recalcModuleProgress();
  });
}
initProgress();

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
    if (today !== userProgress.lastVisit) {
      userProgress.streak++;
      userProgress.lastVisit = today;
    }
    userProgress.timeline.unshift({ date: today, text: t('timeline.completed') + (getSecTitle(id) || id) });
    userProgress.timeline = userProgress.timeline.slice(0, 50);
    recalcModuleProgress();
    saveProgress();
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
  if (currentView === view && !moduleId) return;
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

    if (view === 'hub' && moduleId) _loadModuleContent(moduleId, sectionId);
    if (view === 'progress') renderProgress();
    if (view === 'home') renderHome();
    if (view === 'ctf') renderCTF();
    if (view === 'tools') renderTools();
    if (view === 'practice') renderPractice(currentPracticeIdx);

    window.scrollTo({ top: 0 });
    updateSidebar();
    updateStatusBar();
    scrollReveal();
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
      if (!callbackDone) { callbackDone = true; callback(); }
    } else {
      // Phase 3: Decay — view label, fade out
      const p3 = (progress - 0.55) / 0.45;
      drawViewLabel(p3, targetView);
      drawStatic((1 - p3) * 0.3);
      drawScanlines(progress);
      if (!callbackDone) { callbackDone = true; callback(); }
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, fullW, fullH);
    }
  }

  requestAnimationFrame(animate);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('collapsed')) {
    // Expand: cyberpunk glitch animation
    expandGlitch();
  } else if (!sidebar.classList.contains('glitching')) {
    // Collapse: cyberpunk glitch animation
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
      const gy = rng(frame * 31 + i * 7) * h;
      const gh = 8 + rng(frame * 37 + i * 9) * 40;
      const shift = (rng(frame * 41 + i * 11) - 0.5) * intensity * 60;
      // Capture a slice of background+content, shift it
      const slice = ctx.getImageData(0, gy, w, Math.min(gh, h - gy));
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
// HOME
// ============================================================
function renderHome() {
  document.getElementById('modules-grid').innerHTML = MODULES.map(m => {
    const prog = userProgress.moduleProgress[m.id] || 0;
    const diff = m.chapters[0]?.difficulty || 1;
    const stars = '★'.repeat(diff) + '☆'.repeat(5-diff);
    return `<div class="module-card reveal" onclick="loadModule('${m.id}')">
      <div class="module-card-icon">${m.icon}</div>
      <h3>${getModField(m,'title')}</h3>
      <p>${getModField(m,'desc')}</p>
      <div class="module-card-meta">
        <span class="badge">${m.chapters.length} ${t('ctf.chapters')}</span>
        <span class="badge cyan">${stars}</span>
      </div>
      <div class="card-prog-mini"><div class="card-prog-mini-fill" style="width:${prog}%"></div></div>
    </div>`;
  }).join('');
  // Render learning path
  renderLearningPath();
  wrapCyberLetters();
}

function renderLearningPath() {
  const stages = [
    { label: t('path.stage1'), color: '#00ff41', items: [
      { icon: '⌨', title: getModField(MODULES[0],'title'), desc: currentLang==='en'?'Python/C/Shell — foundation for all security skills':'Python/C/Shell — 所有安全技能的地基', id: 'programming' },
      { icon: '🌐', title: getModField(MODULES[2],'title'), desc: currentLang==='en'?'TCP/IP, HTTP, DNS — understand network communication':'TCP/IP、HTTP、DNS — 理解网络通信原理', id: 'network' }
    ]},
    { label: t('path.stage2'), color: '#00e5ff', items: [
      { icon: '🔐', title: getModField(MODULES[1],'title'), desc: currentLang==='en'?'Classical to modern crypto — theoretical foundation':'古典到现代密码体系 — 理论基础', id: 'cryptography' },
      { icon: '🕸', title: getModField(MODULES[3],'title'), desc: currentLang==='en'?'OWASP Top 10 — most common vulnerabilities':'OWASP Top 10 — 最常见的安全漏洞', id: 'websec' }
    ]},
    { label: t('path.stage3'), color: '#ffd54f', items: [
      { icon: '☠', title: getModField(MODULES[5],'title'), desc: currentLang==='en'?'Static/dynamic analysis + YARA rules':'静态/动态分析 + YARA 规则', id: 'malware' },
      { icon: '🎯', title: getModField(MODULES[4],'title'), desc: currentLang==='en'?'Recon → Exploitation → Privilege Escalation':'信息收集→漏洞利用→提权→后渗透', id: 'pentest' }
    ]},
    { label: t('path.stage4'), color: '#ff4466', items: [
      { icon: '🚩', title: getModField(MODULES[6],'title'), desc: 'Crypto/Web/PWN/Reverse/Forensics', id: 'ctf-guide' }
    ]}
  ];
  document.getElementById('learning-path').innerHTML = stages.map((stage, si) => {
    const prog0 = userProgress.moduleProgress[stage.items[0]?.id] || 0;
    const prog1 = userProgress.moduleProgress[stage.items[1]?.id] || 0;
    return '<div style="margin-bottom:24px">' +
      '<div style="font-family:var(--font-mono);font-size:12px;color:' + stage.color + ';letter-spacing:2px;margin-bottom:12px;font-weight:600" class="cyber-text">' + stage.label + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">' +
        stage.items.map((item, ii) => {
          const p = ii === 0 ? prog0 : prog1;
          return '<div class="module-card reveal" onclick="loadModule(\'' + item.id + '\')" style="padding:18px 20px;cursor:pointer">' +
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
              '<span style="font-size:24px">' + item.icon + '</span>' +
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
        <span class="sidebar-module-icon">${m.icon}</span>${getModField(m,'title')}
      </button>
      <div class="sidebar-chapters ${isActive?'open':''}">
        <div class="sidebar-progress"><div class="sidebar-progress-fill" style="width:${prog}%"></div></div>
        <div class="sidebar-prog-label"><span>PROGRESS</span><span>${prog}%</span></div>`;
    for (const c of m.chapters) {
      for (const s of c.sections) {
        const done = getSectionDone(s.id);
        const sTitle = getSectionField(s,'title');
        html += `<button class="sidebar-chapter-btn ${s.id===currentSectionId?'active':''} ${done?'done':''}"
          onclick="loadSection('${m.id}','${s.id}')">${sTitle}${done?'<span class="sidebar-chap-done">✓</span>':''}</button>`;
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

function loadSection(moduleId, sectionId) {
  currentModuleId = moduleId;
  currentSectionId = sectionId;
  const m = MODULES.find(x => x.id === moduleId);
  const sec = m?.chapters.flatMap(c => c.sections).find(s => s.id === sectionId);
  if (!sec || !m) return;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-hub').classList.add('active');
  document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('no-sidebar');

  document.getElementById('hub-breadcrumb').innerHTML = `${t('hub.breadcrumb')} / <span>${getModField(m,'title')}</span>`;
  document.getElementById('hub-title').textContent = getSectionField(sec,'title');

  const allSections = MODULES.flatMap(mod => mod.chapters.flatMap(c => c.sections));
  const idx = allSections.findIndex(s => s.id === sectionId);
  const prevSec = allSections[idx - 1], nextSec = allSections[idx + 1];
  let prevMod = null, nextMod = null;
  if (prevSec) prevMod = MODULES.find(mod => mod.chapters.some(c => c.sections.some(s => s.id === prevSec.id)));
  if (nextSec) nextMod = MODULES.find(mod => mod.chapters.some(c => c.sections.some(s => s.id === nextSec.id)));

  const done = getSectionDone(sectionId);
  const contentSource = (typeof currentLang !== 'undefined' && currentLang === 'en' && sec.contentKey && typeof SECTION_CONTENT_EN !== 'undefined' && SECTION_CONTENT_EN[sec.contentKey])
    ? SECTION_CONTENT_EN[sec.contentKey]
    : sec.content;
  const contentWithGlossary = injectGlossary(contentSource);

  document.getElementById('article-body').innerHTML = `
    ${contentWithGlossary}
    <div class="separator"></div>
    <button class="complete-btn ${done?'done':''}" onclick="markDone('${sectionId}',this)">
      ${done ? t('section.completed') : t('section.markDone')}
    </button>
    <div class="section-nav">
      ${prevSec ? `<button class="nav-btn" onclick="loadSection('${prevMod?.id}','${prevSec.id}')">${t('section.prev')}${getSectionField(prevSec,'title')}</button>` : ''}
      ${nextSec ? `<button class="nav-btn next-btn" onclick="loadSection('${nextMod?.id}','${nextSec.id}')">${t('section.next')}${getSectionField(nextSec,'title')}</button>` : ''}
    </div>`;

  setTimeout(() => { if (window.Prism) Prism.highlightAll(); bindGlossaryEvents(); }, 80);
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
// CTF
// ============================================================
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
    editor.value = c.starterCode || '# 在这里写你的 Python 代码\nprint("Hello CTF")\n';
    document.getElementById('ctf-code-output').textContent = '';
  }

  // Terminal init
  if (hasTerm) {
    const term = document.getElementById('ctf-terminal');
    term.innerHTML = c.termWelcome || `<span style="color:#666">${c.title} - ${currentLang==='en'?'Simulated Environment':'模拟环境'}</span>\n<span style="color:#666">${currentLang==='en'?'Enter payload to attack the target.':'输入 payload 来攻击目标。可用的靶机在模拟环境中运行。'}</span>\n\n`;
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

async function sendCTFTerminal() {
  const input = document.getElementById('ctf-term-input');
  const term = document.getElementById('ctf-terminal');
  const cmd = input.value.trim();
  if (!cmd) return;
  input.value = '';

  term.innerHTML += `<span style="color:var(--color-cyan)">$ ${esc(cmd)}</span>\n`;

  try {
    const resp = await fetch('/api/ctf-sim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: currentCTFId, input: cmd })
    });
    const data = await resp.json();
    if (data.output) {
      term.innerHTML += data.output + '\n';
    } else {
      term.innerHTML += `<span style="color:var(--color-red)">${esc(data.error || 'Unknown error')}</span>\n`;
    }
  } catch {
    term.innerHTML += '<span style="color:var(--color-red)">' + t('ctf.simError') + '</span>\n';
  }
  term.scrollTop = term.scrollHeight;
}

function closeCTFModal() { document.getElementById('ctf-modal').classList.remove('open'); }

function submitFlag() {
  const input = document.getElementById('flag-input').value.trim();
  const fb = document.getElementById('flag-feedback');
  if (!input) { fb.textContent = t('ctf.enterFlag'); fb.style.color = 'var(--color-red)'; return; }
  const c = CTF_CHALLENGES.find(x => x.id === currentCTFId);
  if (!c) return;
  if (input.toLowerCase().replace(/\s/g,'') === c.flag.toLowerCase().replace(/\s/g,'')) {
    fb.textContent = t('ctf.correct');
    fb.style.color = 'var(--color-green)';
    if (!userProgress.ctfSolved.includes(c.id)) {
      userProgress.ctfSolved.push(c.id);
      userProgress.timeline.unshift({ date: new Date().toISOString().split('T')[0], text: 'CTF Solved: ' + c.title });
      userProgress.timeline = userProgress.timeline.slice(0, 50);
      saveProgress();
    }
    // Show writeup if available
    if (c.writeup) {
      document.getElementById('modal-writeup').style.display = 'block';
      switchCTFTab('desc');
    }
    spawnConfetti();
    renderCTF();
    updateStatusBar();
  } else {
    fb.textContent = t('ctf.wrong');
    fb.style.color = 'var(--color-red)';
    document.getElementById('flag-input').style.animation = 'none';
    document.getElementById('flag-input').offsetHeight;
    document.getElementById('flag-input').style.animation = 'shake 0.3s ease';
  }
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
  cmEditor = CodeMirror.fromTextArea(ta, {
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: false,
    theme: 'material-darker',
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
// PROGRESS
// ============================================================
let radarChart = null;
function renderProgress() {
  recalcModuleProgress();
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
    return `<div><div class="prog-item-label"><span>${m.icon} ${getModField(m,'title')}</span><span>${p}%</span></div>
    <div class="prog-bar"><div class="prog-fill" style="width:${p}%"></div></div></div>`;
  }).join('');

  const canvas = document.getElementById('radar-chart');
  if (radarChart) { radarChart.destroy(); radarChart = null; }
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

  const tl = document.getElementById('timeline');
  if (!userProgress.timeline.length) {
    tl.innerHTML = '<div class="empty-state">' + t('progress.emptyTimeline') + '</div>';
  } else {
    tl.innerHTML = userProgress.timeline.slice(0, 12).map(item => `
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
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
        userProgress = data;
        recalcModuleProgress();
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
// TOOLS
// ============================================================
const TOOLS = [
  { id: 'base64', name: 'Base64 编解码', icon: '📦', desc: 'Base64 编码与解码，支持 Unicode', modes: ['ENCODE','DECODE'], fn: { 'ENCODE': v => { try { return btoa(unescape(encodeURIComponent(v))); } catch(e) { return 'Encode failed'; } }, 'DECODE': v => { try { return decodeURIComponent(escape(atob(v))); } catch(e) { return 'Decode failed'; } } } },
  { id: 'hash', name: 'Hash 计算', icon: '#️⃣', desc: 'SHA-256/SHA-1 哈希（浏览器 SubtleCrypto）', modes: ['SHA-256','SHA-1'], fn: null, async: true },
  { id: 'caesar', name: 'Caesar / ROT13', icon: '🔄', desc: '凯撒密码加解密，自定义位移（0-25）', modes: null, extra: true },
  { id: 'url', name: 'URL 编解码', icon: '🔗', desc: 'encodeURIComponent / decodeURIComponent', modes: ['ENCODE','DECODE'], fn: { 'ENCODE': v => encodeURIComponent(v), 'DECODE': v => { try { return decodeURIComponent(v); } catch(e) { return 'Decode failed'; } } } },
  { id: 'hex', name: 'Hex / ASCII', icon: '🔣', desc: '十六进制与文本互转', modes: ['Text→Hex','Hex→Text'], fn: { 'Text→Hex': v => Array.from(new TextEncoder().encode(v)).map(b => b.toString(16).padStart(2,'0')).join(' '), 'Hex→Text': v => { try { const clean = v.replace(/\s/g,''); return new TextDecoder().decode(new Uint8Array(clean.match(/.{1,2}/g).map(b => parseInt(b,16)))); } catch(e) { return '转换失败'; } } } },
  { id: 'binary', name: '进制转换', icon: '💻', desc: '二进制/十进制/十六进制互转', modes: ['Dec→Bin','Bin→Dec','Dec→Hex','Hex→Dec'], fn: { 'Dec→Bin': v => { const n=parseInt(v); return isNaN(n)?'Invalid':n.toString(2); }, 'Bin→Dec': v => { const n=parseInt(v,2); return isNaN(n)?'Invalid':n.toString(10); }, 'Dec→Hex': v => { const n=parseInt(v); return isNaN(n)?'Invalid':'0x'+n.toString(16).toUpperCase(); }, 'Hex→Dec': v => { const n=parseInt(v.replace('0x',''),16); return isNaN(n)?'Invalid':n.toString(10); } } }
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
buildSearchIndex();

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
  const hits=SEARCH_INDEX.filter(x=>(x.title+x.sub).toLowerCase().includes(ql)).slice(0,12);
  if(!hits.length){res.innerHTML='<div class="search-empty">' + t('search.noResult') + '</div>';return}
  // Highlight matching keywords in results
  function hl(text){return text.replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark style="background:rgba(0,255,65,0.18);color:var(--color-green);padding:0 2px;border-radius:1px">$1</mark>')}
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
  const start = performance.now();
  const initial = 0;
  function tick(now){
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(initial + (target - initial) * eased);
    if(progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function triggerCountUp(){
  ['stat-chapters','stat-exercises','stat-ctf','stat-tools'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    const target = parseInt(el.textContent) || 0;
    animateCountUp(el, target, 1800);
  });
}

// STATUS BAR
// ============================================================
function updateStatusBar(){
  recalcModuleProgress();
  const total=MODULES.flatMap(m=>m.chapters.flatMap(c=>c.sections)).length;
  const done=userProgress.completedSections.length;
  const pct=total?Math.round(done/total*100):0;
  document.getElementById('status-progress').textContent=`PROGRESS: ${pct}% (${done}/${total})`;
}

// ============================================================
// TYPEWRITER
// ============================================================
const TW_LINES=['> Break the surface, own the stack','> 71 chapters. Zero to hero.','> 28 CTF challenges. Real exploits.','> 4-stage learning path. Start now.'];
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
  const corruptChars='!@#$%^&*01ABCDEF<>{}[]|/\\~';
  function wrapNode(node){
    if(node.nodeType===1&&node.classList.contains('glitch'))return;
    if(node.nodeType===3){
      const t=node.textContent;if(!t.trim())return;
      const frag=document.createDocumentFragment();
      for(const ch of t){
        if(ch===' '){frag.appendChild(document.createTextNode(' '))}
        else{const s=document.createElement('span');s.className='cyber-letter';s.dataset.orig=ch;s.textContent=ch;frag.appendChild(s)}
      }
      node.parentNode.replaceChild(frag,node);
    }else if(node.nodeType===1){Array.from(node.childNodes).forEach(wrapNode)}
  }
  // Event delegation on document for all cyber-letter hovers
  document.addEventListener('mouseover',function(e){
    const letter=e.target.closest('.cyber-letter');
    if(!letter)return;
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
  const chars='アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789:;<=>?@';
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
window.addEventListener('scroll',scrollReveal);

// ============================================================
// NEON CURSOR TRAIL
// ============================================================
(function(){
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
    document.body.appendChild(dot);
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

function triggerFlash(){
  if(introFlashDone) return;
  introFlashDone = true;
  const flash = document.getElementById('intro-flash');
  if(flash){
    flash.style.animation = 'flash-white 0.6s ease-out forwards';
  }
  setTimeout(function(){ if(introActive) skipIntro(); }, 500);
}

function playIntro(){
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
  setTimeout(function(){ if(introActive) { console.warn('Intro safety timeout triggered'); skipIntro(); } }, INTRO_DURATION + 2000);
}

function skipIntro(){
  if(!introActive) return;
  introActive = false;
  introFlashDone = true;
  if(introAnimFrameId) { cancelAnimationFrame(introAnimFrameId); introAnimFrameId = null; }
  const intro = document.getElementById('intro-screen');
  if(intro) intro.classList.add('fade-out');
  setTimeout(function(){
    if(intro) intro.style.display = 'none';
    const nc = document.getElementById('intro-noise');
    if(nc){ nc.width = 0; nc.height = 0; }
  }, 650);
}

// ============================================================
// KEYBOARD SHORTCUTS (merged — intro skip + app shortcuts)
// ============================================================
document.addEventListener('keydown',function(e){
  // Skip intro on any key
  if(introActive){ skipIntro(); return; }
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openSearch();return}
  if(e.key==='Escape'){closeSearch();closeCTFModal();return}
  if(document.getElementById('search-overlay').classList.contains('open'))return;
  if(currentView==='practice'){
    if(e.key==='ArrowRight')nextPractice();
    if(e.key==='ArrowLeft')prevPractice();
  }
});
// ============================================================
// ============================================================
// SHAKE ANIMATION KEYFRAME INJECTION
// ============================================================
const shakeStyle=document.createElement('style');
shakeStyle.textContent=`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}} @keyframes confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`;
document.head.appendChild(shakeStyle);

// ============================================================
// THEME TOGGLE
// ============================================================
function toggleTheme(){
  const html=document.documentElement;
  const isLight=html.getAttribute('data-theme')==='light';
  html.setAttribute('data-theme',isLight?'':'light');
  document.getElementById('theme-toggle').textContent=isLight?'☀':'☾';
  if(cmEditor) cmEditor.setOption('theme', isLight?'default':'material-darker');
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

// ── Session persistence ──
function _saveCurrentSession() {
  if (!aiMessages.length) return;
  const id = aiCurrentSessionId || _genId();
  const title = aiMessages[0]?.content?.slice(0, 30) || '新对话';
  const list = _histLoad();
  const idx = list.findIndex(s => s.id === id);
  const entry = { id, title, messages: aiMessages, time: Date.now() };
  if (idx >= 0) list[idx] = entry; else list.unshift(entry);
  // Keep max 50 sessions
  while (list.length > 50) list.pop();
  _histSave(list);
  aiCurrentSessionId = id;
}

function _loadSession(id) {
  const list = _histLoad();
  const session = list.find(s => s.id === id);
  if (!session) return;
  aiCurrentSessionId = id;
  aiMessages = session.messages.slice(); // deep copy references
  // Rebuild UI messages
  const box = document.getElementById('ai-messages');
  box.innerHTML = '';
  for (const m of aiMessages) {
    if (m.role === 'system') continue; // skip system messages in display
    addAIMsg(m.role, m.content);
  }
  _renderHistoryList();
}

function _deleteSession(id) {
  const list = _histLoad().filter(s => s.id !== id);
  _histSave(list);
  if (aiCurrentSessionId === id) {
    newAIChat();
  }
  _renderHistoryList();
}

// ── History list rendering ──
function _renderHistoryList() {
  const container = document.getElementById('ai-history-list');
  const list = _histLoad();
  if (!list.length) {
    container.innerHTML = '<div class="ai-history-empty">' + t('ai.noHistory') + '</div>';
    return;
  }
  let html = '';
  for (const s of list) {
    const active = s.id === aiCurrentSessionId ? ' active' : '';
    const date = _fmtDate(s.time);
    html += '<div class="ai-history-item' + active + '" onclick="_loadSession(\'' + s.id + '\')">'
      + '<span class="ai-history-item-title">' + _escHtml(s.title) + '</span>'
      + '<span class="ai-history-item-date">' + date + '</span>'
      + '<span class="ai-history-item-del" onclick="event.stopPropagation();_deleteSession(\'' + s.id + '\')">✕</span>'
      + '</div>';
  }
  container.innerHTML = html;
}

function _fmtDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  return (d.getMonth()+1) + '/' + d.getDate();
}

function _escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toggle history sidebar ──
function toggleAIHistory() {
  const hist = document.getElementById('ai-history');
  hist.classList.toggle('hidden');
  if (!hist.classList.contains('hidden')) _renderHistoryList();
}

// ── New chat (clear + start fresh) ──
function newAIChat() {
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
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    fab.style.display = 'none';
    document.getElementById('ai-input').focus();
  } else {
    fab.style.display = 'flex';
  }
}

function toggleAISettings() {
  document.getElementById('ai-settings').classList.toggle('hidden');
}

function saveAISettings() {
  const url   = document.getElementById('ai-api-url').value.trim();
  const key   = document.getElementById('ai-api-key').value.trim();
  const model = document.getElementById('ai-model').value.trim();
  if (!url || !key || !model) { alert(t('ai.configError')); return; }
  try {
    localStorage.setItem('cyberedu_ai_url',        url);
    localStorage.setItem('cyberedu_ai_key',         key);
    localStorage.setItem('cyberedu_ai_model',       model);
    localStorage.setItem('cyberedu_ai_temp',        document.getElementById('ai-temperature').value);
    localStorage.setItem('cyberedu_ai_max_tokens',  document.getElementById('ai-max-tokens').value.trim());
    localStorage.setItem('cyberedu_ai_thinking',     document.getElementById('ai-thinking').checked ? '1' : '0');
  } catch(e) {}
  document.getElementById('ai-settings').classList.add('hidden');
  addAIMsg('system', t('ai.saved'));
}

function loadAISettings() {
  try {
    const url   = localStorage.getItem('cyberedu_ai_url')        || '';
    const key   = localStorage.getItem('cyberedu_ai_key')         || '';
    const model = localStorage.getItem('cyberedu_ai_model')       || '';
    const temp  = localStorage.getItem('cyberedu_ai_temp')        || '0.7';
    const mt    = localStorage.getItem('cyberedu_ai_max_tokens')  || '4096';
    const think = localStorage.getItem('cyberedu_ai_thinking')   || '1';
    document.getElementById('ai-api-url').value     = url;
    document.getElementById('ai-api-key').value     = key;
    document.getElementById('ai-model').value       = model;
    document.getElementById('ai-temperature').value = temp;
    document.getElementById('ai-max-tokens').value  = mt;
    document.getElementById('ai-thinking').checked   = (think === '1');
    document.getElementById('ai-temp-val').textContent = temp;
  } catch(e) {}
}

function getAIConfig() {
  return {
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
  let h = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
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
    // Line breaks
    .replace(/\n/g, '<br>');
  return h;
}

function handleAIKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAIMessage();
  }
}

// System prompt for the AI tutor
const AI_SYS_PROMPT = '你是一位专业的网络安全学习导师，精通编程基础、密码学、网络协议、Web安全、渗透测试、恶意软件分析和CTF竞赛。\n请用简明准确的中文回答学生的问题：\n- 由浅入深，适合初学者理解\n- 必要时提供代码示例（Python / Bash / C）\n- 标注相关风险和法律边界\n- 不直接给出CTF flag，而是引导解题思路';

async function sendAIMessage() {
  if (aiIsStreaming) return;
  const input = document.getElementById('ai-input');
  const text  = input.value.trim();
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
  input.value = '';
  input.style.height = 'auto';

  // Container: thinking div comes BEFORE aiDiv in DOM
  const box = document.getElementById('ai-messages');
  const wrapper = document.createElement('div');
  wrapper.className = 'ai-response-wrapper';
  box.appendChild(wrapper);

  let thinkDiv = null;
  const aiDiv = document.createElement('div');
  aiDiv.className = 'ai-msg ai-msg-ai';
  aiDiv.innerHTML = '<span class="ai-thinking-hint">正在思考</span>';
  wrapper.appendChild(aiDiv);

  aiIsStreaming = true;
  document.getElementById('ai-send-btn').disabled = true;

  let aiText = '';
  let thinkText = '';
  let usageInfo = null;
  let buf = '';
  let contentStarted = false;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiUrl:     config.apiUrl,
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
            box.scrollTop = box.scrollHeight;
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
            box.scrollTop = box.scrollHeight;
          }

          // ── Usage stats (final chunk) ──
          if (chunk.usage) usageInfo = chunk.usage;
        } catch (e) { /* skip */ }
      }
    }

    // ── Finalize response ──
    aiDiv.innerHTML = formatAIContent(aiText);

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
    aiDiv.className = 'ai-msg ai-msg-error';
    aiDiv.innerHTML = '⚠ ' + e.message;
    if (thinkDiv) thinkDiv.remove();
  }

  aiIsStreaming = false;
  document.getElementById('ai-send-btn').disabled = false;
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
}

// ============================================================
// INIT
// ============================================================
function initApp() {
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
    initMatrix();
    renderHome();
    renderCTF();
    updateSidebar();
    updateStatusBar();
    initCyberLetters();
    setTimeout(tickTypewriter,2800);
    navigate('home');
    setTimeout(triggerCountUp, 4500);
  } catch(e) { console.error('Init error:', e); }
  // Always run playIntro regardless of other errors
  playIntro();
}
// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

