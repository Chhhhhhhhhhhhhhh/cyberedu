
// ============================================================
// STATE & PROGRESS
// ============================================================
let userProgress = JSON.parse(localStorage.getItem('cyberedu_v2_progress')) || {
  completedSections: [],
  ctfSolved: [],
  moduleProgress: {},
  timeline: [],
  streak: 1,
  lastVisit: new Date().toISOString().split('T')[0]
};

function saveProgress() {
  userProgress.moduleProgress = {};
  recalcModuleProgress();
  localStorage.setItem('cyberedu_v2_progress', JSON.stringify(userProgress));
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
    userProgress.timeline.unshift({ date: today, text: '完成: ' + (getSecTitle(id) || id) });
    userProgress.timeline = userProgress.timeline.slice(0, 50);
    recalcModuleProgress();
    saveProgress();
  }
}
function getSecTitle(id) {
  for (const m of MODULES) for (const c of m.chapters) for (const s of c.sections) if (s.id === id) return s.title;
  return null;
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
      document.getElementById('sidebar-toggle').title = collapsed ? '展开侧边栏' : '收起侧边栏';
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
      toggle.title = '展开侧边栏';
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
      <h3>${m.title}</h3>
      <p>${m.desc}</p>
      <div class="module-card-meta">
        <span class="badge">${m.chapters.length} 章</span>
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
    { label: 'STAGE 1 — 基础夯实', color: '#00ff41', items: [
      { icon: '⌨', title: '编程基础', desc: 'Python/C/Shell — 所有安全技能的地基', id: 'programming' },
      { icon: '🌐', title: '计算机网络', desc: 'TCP/IP、HTTP、DNS — 理解网络通信原理', id: 'network' }
    ]},
    { label: 'STAGE 2 — 安全原理', color: '#00e5ff', items: [
      { icon: '🔐', title: '密码学', desc: '古典到现代密码体系 — 理论基础', id: 'cryptography' },
      { icon: '🕸', title: 'Web 安全', desc: 'OWASP Top 10 — 最常见的安全漏洞', id: 'websec' }
    ]},
    { label: 'STAGE 3 — 实战进阶', color: '#ffd54f', items: [
      { icon: '☠', title: '恶意软件分析', desc: '静态/动态分析 + YARA 规则', id: 'malware' },
      { icon: '🎯', title: '渗透测试', desc: '信息收集→漏洞利用→提权→后渗透', id: 'pentest' }
    ]},
    { label: 'STAGE 4 — 综合对抗', color: '#ff4466', items: [
      { icon: '🚩', title: 'CTF 实战', desc: 'Crypto/Web/PWN/Reverse/Forensics', id: 'ctf-guide' }
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
    let html = '<div class="sidebar-section"><div class="sidebar-practice-header">📝 练习题目</div>';
    PRACTICES.forEach((p, i) => {
      const stars = '★'.repeat(p.difficulty) + '☆'.repeat(5 - p.difficulty);
      html += `<button class="sidebar-chapter-btn ${i === currentPracticeIdx ? 'active' : ''}" onclick="switchPractice(${i})">
        <span class="sidebar-prac-num">${i + 1}.</span> ${p.title}
        <span class="sidebar-prac-meta">${p.category} · ${stars}</span>
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
        <span class="sidebar-module-icon">${m.icon}</span>${m.title}
      </button>
      <div class="sidebar-chapters ${isActive?'open':''}">
        <div class="sidebar-progress"><div class="sidebar-progress-fill" style="width:${prog}%"></div></div>
        <div class="sidebar-prog-label"><span>PROGRESS</span><span>${prog}%</span></div>`;
    for (const c of m.chapters) {
      for (const s of c.sections) {
        const done = getSectionDone(s.id);
        html += `<button class="sidebar-chapter-btn ${s.id===currentSectionId?'active':''} ${done?'done':''}"
          onclick="loadSection('${m.id}','${s.id}')">${s.title}${done?'<span class="sidebar-chap-done">✓</span>':''}</button>`;
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

  document.getElementById('hub-breadcrumb').innerHTML = `学习中心 / <span>${m.title}</span>`;
  document.getElementById('hub-title').textContent = sec.title;

  const allSections = MODULES.flatMap(mod => mod.chapters.flatMap(c => c.sections));
  const idx = allSections.findIndex(s => s.id === sectionId);
  const prevSec = allSections[idx - 1], nextSec = allSections[idx + 1];
  let prevMod = null, nextMod = null;
  if (prevSec) prevMod = MODULES.find(mod => mod.chapters.some(c => c.sections.some(s => s.id === prevSec.id)));
  if (nextSec) nextMod = MODULES.find(mod => mod.chapters.some(c => c.sections.some(s => s.id === nextSec.id)));

  const done = getSectionDone(sectionId);
  const contentWithGlossary = injectGlossary(sec.content);

  document.getElementById('article-body').innerHTML = `
    ${contentWithGlossary}
    <div class="separator"></div>
    <button class="complete-btn ${done?'done':''}" onclick="markDone('${sectionId}',this)">
      ${done?'✓ COMPLETED':'○ MARK AS COMPLETED'}
    </button>
    <div class="section-nav">
      ${prevSec ? `<button class="nav-btn" onclick="loadSection('${prevMod?.id}','${prevSec.id}')">← PREV: ${prevSec.title}</button>` : ''}
      ${nextSec ? `<button class="nav-btn next-btn" onclick="loadSection('${nextMod?.id}','${nextSec.id}')">NEXT: ${nextSec.title} →</button>` : ''}
    </div>`;

  setTimeout(() => { if (window.Prism) Prism.highlightAll(); bindGlossaryEvents(); }, 80);
  updateSidebar();
  updateStatusBar();
  window.scrollTo({ top: 0 });
}

function markDone(sectionId, btn) {
  setSectionDone(sectionId);
  btn.textContent = '✓ COMPLETED';
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
      <div class="ctf-title">${c.title}</div>
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
function openCTF(id) {
  currentCTFId = id;
  const c = CTF_CHALLENGES.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-title').textContent = c.title;
  const stars = Array.from({length:5}, (_,i) => `<span style="color:${i<c.difficulty?'var(--color-green)':'var(--text-muted)'}">★</span>`).join('');
  document.getElementById('modal-meta').innerHTML = `<span class="badge">${c.category}</span><span>${stars}</span><span class="badge green">${c.points} pts</span>`;
  document.getElementById('modal-desc').textContent = c.desc;
  document.getElementById('modal-hint').style.display = 'none';
  document.getElementById('modal-hint').textContent = c.hints[0] || '';
  document.getElementById('show-hint-btn').textContent = '? 查看提示';
  document.getElementById('flag-input').value = '';
  document.getElementById('flag-feedback').textContent = '';
  document.getElementById('ctf-modal').classList.add('open');
}
function closeCTFModal() { document.getElementById('ctf-modal').classList.remove('open'); }
function toggleHint() {
  const h = document.getElementById('modal-hint');
  if (h.style.display === 'block') { h.style.display = 'none'; document.getElementById('show-hint-btn').textContent = '? 查看提示'; }
  else { h.style.display = 'block'; document.getElementById('show-hint-btn').textContent = '? 隐藏提示'; }
}
function submitFlag() {
  const input = document.getElementById('flag-input').value.trim();
  const fb = document.getElementById('flag-feedback');
  if (!input) { fb.textContent = '> 请输入 flag'; fb.style.color = 'var(--color-red)'; return; }
  const c = CTF_CHALLENGES.find(x => x.id === currentCTFId);
  if (!c) return;
  if (input.toLowerCase().replace(/\s/g,'') === c.flag.toLowerCase().replace(/\s/g,'')) {
    fb.textContent = '✓ CORRECT! 恭喜你解出了这道题！';
    fb.style.color = 'var(--color-green)';
    if (!userProgress.ctfSolved.includes(c.id)) {
      userProgress.ctfSolved.push(c.id);
      userProgress.timeline.unshift({ date: new Date().toISOString().split('T')[0], text: 'CTF Solved: ' + c.title });
      userProgress.timeline = userProgress.timeline.slice(0, 50);
      saveProgress();
    }
    spawnConfetti();
    renderCTF();
    updateStatusBar();
  } else {
    fb.textContent = '✗ WRONG! 再想想...';
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
  document.getElementById('practice-title').textContent = p.title;
  document.getElementById('practice-counter').textContent = `第 ${idx + 1}/${PRACTICES.length} 题`;
  document.getElementById('practice-counter-btm').textContent = `第 ${idx + 1}/${PRACTICES.length} 题`;
  // 控制翻题按钮可见性（仅顶部）
  const isFirst = idx === 0, isLast = idx === PRACTICES.length - 1;
  document.getElementById('btn-prev-top').style.display = isFirst ? 'none' : '';
  document.getElementById('btn-next-top').style.display = isLast ? 'none' : '';
  document.getElementById('practice-meta').innerHTML = `<span class="badge">${p.category}</span><span class="badge cyan">难度: ${'★'.repeat(p.difficulty)}${'☆'.repeat(5-p.difficulty)}</span>`;
  document.getElementById('practice-question').textContent = p.question;
  if (cmEditor) {
    cmEditor.setOption('mode', CM_MODE_MAP[p.lang] || 'python');
    cmEditor.setValue(p.starter);
    setTimeout(() => cmEditor.refresh(), 50);
  } else {
    document.getElementById('code-editor').value = p.starter;
  }
  document.getElementById('editor-lang').textContent = p.lang;
  document.getElementById('code-output').textContent = '点击 RUN 查看结果...';
  document.getElementById('practice-hint-box').style.display = 'none';
  updateSidebar();
}
function runCode() {
  const output = document.getElementById('code-output');
  const p = PRACTICES[currentPracticeIdx];
  if (!p) return;
  const tests = PRACTICE_TESTS[p.id];
  output.innerHTML = '<div style="margin-bottom:8px;color:var(--color-cyan);font-weight:600">// 自测验证模式</div>' +
    '<div style="color:var(--text-dim);margin-bottom:10px;font-size:12px">在本地 ' + (p.lang||'Python') + ' 环境中运行你的代码，<br>将输出与下方预期结果对比：</div>' +
    '<div style="color:var(--color-green);margin-bottom:4px;font-size:12px">// 预期输出：</div>' +
    '<div style="color:var(--text-main);padding:8px 12px;background:rgba(0,255,65,0.05);border:1px solid var(--border-subtle);font-size:12px;margin-bottom:12px;white-space:pre-wrap">' + (tests?.expected || p.expected || '运行代码后对比输出') + '</div>' +
    (tests?.cases?.length ? '<div style="color:var(--color-yellow);margin-bottom:4px;font-size:12px">// 测试用例：</div>' +
      tests.cases.map((tc, i) => '<div style="padding:4px 0;font-size:12px;color:var(--text-dim)"><span style="color:var(--color-cyan)">Case ' + (i+1) + ':</span> 输入 <code style="color:var(--color-green)">' + (tc.input||'') + '</code> → ' + (tc.output||tc.hint||'') + '</div>').join('') : '');
}
function showPracticeHint() {
  const box = document.getElementById('practice-hint-box');
  const p = PRACTICES[currentPracticeIdx];
  box.innerHTML = '<strong>提示：</strong>' + (p?.hint || '暂无提示');
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
    <div class="stat-card"><div class="stat-card-label">已完成章节</div><div class="stat-card-value" style="color:var(--color-green)">${done}</div><div class="stat-card-sub">共 ${total} 节</div></div>
    <div class="stat-card"><div class="stat-card-label">整体进度</div><div class="stat-card-value" style="color:var(--color-cyan)">${pct}%</div><div class="stat-card-sub">综合完成率</div></div>
    <div class="stat-card"><div class="stat-card-label">CTF 已解题</div><div class="stat-card-value" style="color:var(--color-green)">${userProgress.ctfSolved.length}</div><div class="stat-card-sub">共 ${CTF_CHALLENGES.length} 题</div></div>
    <div class="stat-card"><div class="stat-card-label">连续学习</div><div class="stat-card-value" style="color:var(--color-yellow)">${userProgress.streak}</div><div class="stat-card-sub">天</div></div>`;

  document.getElementById('module-prog-list').innerHTML = MODULES.map(m => {
    const p = userProgress.moduleProgress[m.id] || 0;
    return `<div><div class="prog-item-label"><span>${m.icon} ${m.title}</span><span>${p}%</span></div>
    <div class="prog-bar"><div class="prog-fill" style="width:${p}%"></div></div></div>`;
  }).join('');

  const canvas = document.getElementById('radar-chart');
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  radarChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: MODULES.map(m => m.title),
      datasets: [{
        label: '掌握度',
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
    tl.innerHTML = '<div class="empty-state">还没有学习记录。开始学习吧！</div>';
  } else {
    tl.innerHTML = userProgress.timeline.slice(0, 12).map(item => `
      <div class="timeline-item"><span class="timeline-date">${item.date}</span><div class="timeline-dot"></div><span class="timeline-text">${item.text}</span></div>`).join('');
  }
}

function exportProgress() {
  try {
    const data = localStorage.getItem('cyberedu_v2_progress');
    if (!data) { alert('暂无进度数据可导出'); return; }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyberedu_progress_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) { alert('导出失败: ' + e.message); }
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
          alert('文件格式不正确，不是有效的进度数据'); return;
        }
        if (!confirm('导入将覆盖当前进度，确定继续？')) return;
        localStorage.setItem('cyberedu_v2_progress', JSON.stringify(data));
        userProgress = data;
        recalcModuleProgress();
        renderProgress();
        updateStatusBar();
        updateSidebar();
        alert('进度导入成功！');
      } catch(err) { alert('导入失败: ' + err.message); }
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
  document.getElementById('tools-grid').innerHTML = TOOLS.map(t => {
    if (t.id === 'caesar') {
      return `<div class="tool-card" id="tool-caesar">
        <div class="tool-name">🔄 Caesar / ROT13</div>
        <div class="tool-desc">凯撒密码加解密，ROT13 是移位 13 的特例</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <label style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">SHIFT:</label>
          <input type="number" id="caesar-shift" value="13" min="0" max="25" style="width:56px;background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-main);font-family:var(--font-mono);padding:4px 8px;font-size:12px;outline:none" oninput="updateCaesar()">
        </div>
        <textarea class="tool-input" id="caesar-in" placeholder="输入文本..." oninput="updateCaesar()" rows="2"></textarea>
        <div class="tool-arrow">↓</div>
        <textarea class="tool-output" id="caesar-out" placeholder="加密结果..." readonly rows="2"></textarea>
      </div>`;
    }
    const tabs = t.modes ? `<div class="tool-tabs">${t.modes.map(m => `<button class="tool-tab ${m===toolModes[t.id]?'active':''}" onclick="setToolMode('${t.id}','${m}',this)">${m}</button>`).join('')}</div>` : '';
    return `<div class="tool-card" id="tool-${t.id}">
      <div class="tool-name">${t.icon} ${t.name}</div>
      <div class="tool-desc">${t.desc}</div>
      ${tabs}
      <textarea class="tool-input" id="${t.id}-in" placeholder="输入..." oninput="runTool('${t.id}')" rows="2"></textarea>
      <div class="tool-arrow">↓</div>
      <textarea class="tool-output" id="${t.id}-out" placeholder="结果..." readonly rows="2"></textarea>
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
  catch(e){out.value='计算失败'}
}
function bindHashTool(){
  const inp=document.getElementById('hash-in');
  if(inp)inp.addEventListener('input',()=>runTool('hash'));
}

// ============================================================
// SEARCH
// ============================================================
const SEARCH_INDEX = [];
MODULES.forEach(m => {
  SEARCH_INDEX.push({ type:'模块', title:m.title, sub:m.desc, action:()=>navigate('hub',m.id) });
  m.chapters.forEach(c => c.sections.forEach(s => {
    SEARCH_INDEX.push({ type:'章节', title:s.title, sub:m.title+' › '+c.title, action:()=>loadSection(m.id,s.id) });
  }));
});
CTF_CHALLENGES.forEach(c => {
  SEARCH_INDEX.push({ type:'CTF', title:c.title, sub:c.category+' · '+c.points+' pts', action:()=>{navigate('ctf');setTimeout(()=>openCTF(c.id),200)} });
});
TOOLS.forEach(t => {
  SEARCH_INDEX.push({ type:'工具', title:t.name, sub:t.desc, action:()=>navigate('tools') });
});
// Add glossary terms to search
for (const [term, def] of Object.entries(GLOSSARY)) {
  SEARCH_INDEX.push({ type:'术语', title:term, sub:def.slice(0,60)+'...', action:()=>{} });
}

function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('search-input').focus(),50);
}
function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-input').value='';
  document.getElementById('search-results').innerHTML='<div class="search-empty">输入关键词开始搜索…</div>';
}
function closeSearchIfBackdrop(e){if(e.target===document.getElementById('search-overlay'))closeSearch()}
function doSearch(q) {
  const res=document.getElementById('search-results');
  if(!q.trim()){res.innerHTML='<div class="search-empty">输入关键词开始搜索…</div>';return}
  const ql=q.toLowerCase();
  const hits=SEARCH_INDEX.filter(x=>(x.title+x.sub).toLowerCase().includes(ql)).slice(0,12);
  if(!hits.length){res.innerHTML='<div class="search-empty">没有找到相关内容</div>';return}
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
const TW_LINES=['> Break the surface, own the stack','> 71 chapters. Zero to hero.','> 16 CTF challenges. Real exploits.','> 4-stage learning path. Start now.'];
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
    ctx.fillStyle='rgba(0,229,255,0.12)';
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
  const url = document.getElementById('ai-api-url').value.trim();
  const key = document.getElementById('ai-api-key').value.trim();
  const model = document.getElementById('ai-model').value.trim();
  if (!url || !key || !model) { alert('请填写完整的 API URL、Key 和模型名'); return; }
  try {
    localStorage.setItem('cyberedu_ai_url', url);
    localStorage.setItem('cyberedu_ai_key', key);
    localStorage.setItem('cyberedu_ai_model', model);
  } catch(e) {}
  document.getElementById('ai-settings').classList.add('hidden');
  addAIMsg('system', '设置已保存。你可以开始提问了。');
}

function loadAISettings() {
  try {
    const url = localStorage.getItem('cyberedu_ai_url') || '';
    const key = localStorage.getItem('cyberedu_ai_key') || '';
    const model = localStorage.getItem('cyberedu_ai_model') || '';
    document.getElementById('ai-api-url').value = url;
    document.getElementById('ai-api-key').value = key;
    document.getElementById('ai-model').value = model;
  } catch(e) {}
}

function getAIConfig() {
  return {
    apiUrl: (document.getElementById('ai-api-url').value.trim() || localStorage.getItem('cyberedu_ai_url') || '').trim(),
    apiKey: (document.getElementById('ai-api-key').value.trim() || localStorage.getItem('cyberedu_ai_key') || '').trim(),
    model: (document.getElementById('ai-model').value.trim() || localStorage.getItem('cyberedu_ai_model') || '').trim(),
  };
}

function addAIMsg(role, content) {
  const box = document.getElementById('ai-messages');
  const div = document.createElement('div');
  const cls = role === 'user' ? 'ai-msg-user' : role === 'error' ? 'ai-msg-error' : 'ai-msg-ai';
  div.className = 'ai-msg ' + cls;
  div.innerHTML = formatAIContent(content);
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function formatAIContent(text) {
  // Basic markdown: code blocks, inline code, bold
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  return html;
}

function handleAIKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAIMessage();
  }
}

async function sendAIMessage() {
  if (aiIsStreaming) return;

  const input = document.getElementById('ai-input');
  const text = input.value.trim();
  if (!text) return;

  const config = getAIConfig();
  if (!config.apiUrl || !config.apiKey || !config.model) {
    toggleAISettings();
    addAIMsg('system', '请先配置 API 设置');
    return;
  }

  // Add user message
  addAIMsg('user', text);
  aiMessages.push({ role: 'user', content: text });
  input.value = '';
  input.style.height = 'auto';

  // Create AI response bubble with cursor
  const aiDiv = addAIMsg('ai', '<span class="ai-cursor"></span>');
  aiIsStreaming = true;
  document.getElementById('ai-send-btn').disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        model: config.model,
        messages: aiMessages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error('API returned ' + res.status + ': ' + errText);
    }

    // Parse SSE stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let aiText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            aiText += delta;
            aiDiv.innerHTML = formatAIContent(aiText) + '<span class="ai-cursor"></span>';
            const box = document.getElementById('ai-messages');
            box.scrollTop = box.scrollHeight;
          }
        } catch(e) { /* skip non-JSON lines */ }
      }
    }

    // Finalize
    aiDiv.innerHTML = formatAIContent(aiText);
    aiMessages.push({ role: 'assistant', content: aiText });

    // Keep message history manageable (last 20 messages)
    if (aiMessages.length > 20) {
      aiMessages = aiMessages.slice(-20);
    }

  } catch(e) {
    aiDiv.className = 'ai-msg ai-msg-error';
    aiDiv.innerHTML = 'Error: ' + e.message;
  }

  aiIsStreaming = false;
  document.getElementById('ai-send-btn').disabled = false;
  document.getElementById('ai-input').focus();
}

function clearAIChat() {
  aiMessages = [];
  const box = document.getElementById('ai-messages');
  box.innerHTML = '<div class="ai-msg ai-msg-system">对话已清空。</div>';
}

function initAIChat() {
  loadAISettings();
  // Auto-open settings if not configured
  const config = getAIConfig();
  if (!config.apiUrl || !config.apiKey || !config.model) {
    // Settings will show when user first tries to send
  }
  // Auto-resize textarea
  const input = document.getElementById('ai-input');
  if (input) {
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 80) + 'px';
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

