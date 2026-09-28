/* ===========================================================
   KARINO AI — app.js
   Cinematic Three.js background + UI interactions + i18n
   =========================================================== */

/* -----------------------------------------------------------
   0. i18n — dictionaries live in i18n.js (ru / es / en).
   The page always opens in Russian unless the visitor has
   chosen another language before (saved in this browser).
   If i18n.js fails to load, the page simply stays in Russian.
----------------------------------------------------------- */
document.documentElement.classList.add('js');

let I18N = null;
let currentLocale = 'ru';
const tr = (key, fallback = '') =>
  (I18N && I18N[currentLocale] && I18N[currentLocale][key]) || fallback;

/* -----------------------------------------------------------
   1. Nav: scroll shadow, smooth-scroll buttons, mobile burger
----------------------------------------------------------- */
document.querySelectorAll('[data-scroll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.querySelector(btn.getAttribute('data-scroll'));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const burger = document.getElementById('burger');
const navLinks = document.querySelector('.nav__links');
burger?.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') === 'true';
  burger.setAttribute('aria-expanded', String(!open));
  navLinks?.classList.toggle('is-open');
});

navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  burger?.setAttribute('aria-expanded', 'false');
}));

/* Reveal on scroll (only cards and steps, once) */
const revealTargets = document.querySelectorAll('.feature-card, .step, .workspace__panel, .cta h2, .cta .btn');
revealTargets.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.setProperty('--d', (i % 3) * 0.08 + 's');
});
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => io.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('is-visible'));
}

/* Cursor / touch spotlight on feature cards */
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
});

/* -----------------------------------------------------------
   2. AI Workspace mock — local only, no network calls
----------------------------------------------------------- */
const RU_FALLBACK = {
  'ws.heading.content': 'Генерация текста',
  'ws.heading.video': 'Создание видео',
  'ws.heading.image': 'Работа с изображениями',
  'ws.heading.automate': 'Автоматизация',
  'ws.resp.content': 'Черновик готов: заголовок, три абзаца и призыв к действию — можно редактировать прямо здесь.',
  'ws.resp.video': 'Раскадровка на 5 сцен собрана. Рендер сохранится в истории после подтверждения.',
  'ws.resp.image': 'Сгенерировано 4 варианта обложки в выбранном стиле. Выберите лучший вариант.',
  'ws.resp.automate': 'Сценарий автоматизации настроен: задача будет выполняться по расписанию.',
  'ws.out.empty': 'Результат появится здесь.',
  'ws.out.needTask': 'Опишите задачу, чтобы начать.',
  'ws.out.noCredits': 'Кредиты закончились. Пополните баланс, чтобы продолжить.',
  'ws.run': 'Сгенерировать',
  'ws.running': 'Генерирую…'
};
const wsText = (key) => tr(key, RU_FALLBACK[key] || '');

const wsTools = document.querySelectorAll('.ws-tool');
const wsTitle = document.getElementById('ws-title');
const wsRun = document.getElementById('ws-run');
const wsInput = document.getElementById('ws-input');
const wsOutput = document.getElementById('ws-output');
const historyList = document.getElementById('history-list');
const creditsCount = document.getElementById('credits-count');

let activeTool = 'content';
let credits = 128;
let wsBusy = false;

// Output area: either a placeholder message (grey) or a result (plain text).
function showPlaceholder(key) {
  wsOutput.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'ws-output__placeholder';
  p.dataset.i18n = key;
  p.textContent = wsText(key);
  wsOutput.appendChild(p);
}
function showResult(text) {
  wsOutput.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = text;
  wsOutput.appendChild(p);
}

wsTools.forEach(tool => {
  tool.addEventListener('click', () => {
    wsTools.forEach(other => other.classList.remove('is-active'));
    tool.classList.add('is-active');
    activeTool = tool.dataset.tool;
    wsTitle.textContent = wsText('ws.heading.' + activeTool);
    showPlaceholder('ws.out.empty');
  });
});

wsRun?.addEventListener('click', () => {
  if (wsBusy) return;
  const task = wsInput.value.trim();
  if (!task) { showPlaceholder('ws.out.needTask'); return; }
  if (credits <= 0) { showPlaceholder('ws.out.noCredits'); return; }

  wsBusy = true;
  wsRun.textContent = wsText('ws.running');
  wsRun.disabled = true;

  setTimeout(() => {
    showResult(wsText('ws.resp.' + activeTool));
    credits = Math.max(0, credits - 4);
    creditsCount.textContent = credits;

    const li = document.createElement('li');
    li.textContent = task.length > 28 ? task.slice(0, 28) + '…' : task;
    historyList.prepend(li);
    while (historyList.children.length > 6) historyList.removeChild(historyList.lastChild);

    wsBusy = false;
    wsRun.textContent = wsText('ws.run');
    wsRun.disabled = false;
  }, 900);
});

/* -----------------------------------------------------------
   2b. Language switcher (RU / ES / EN)
----------------------------------------------------------- */
function applyLang(lang) {
  if (!I18N || !I18N[lang]) return;
  currentLocale = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = tr(el.dataset.i18n); if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const v = tr(el.dataset.i18nHtml); if (v) el.innerHTML = v; // trusted, written in i18n.js
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const v = tr(el.dataset.i18nPlaceholder); if (v) el.placeholder = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const v = tr(el.dataset.i18nAria); if (v) el.setAttribute('aria-label', v);
  });

  document.title = tr('meta.title', document.title);
  document.querySelector('meta[name="description"]')?.setAttribute('content', tr('meta.description'));

  document.querySelectorAll('.lang [data-lang]').forEach(b =>
    b.classList.toggle('is-active', b.dataset.lang === lang));

  // keep the workspace headline in sync with the active tool
  wsTitle.textContent = wsText('ws.heading.' + activeTool);
  if (wsBusy) wsRun.textContent = wsText('ws.running');
  try { localStorage.setItem('karino-lang', lang); } catch (e) { /* private mode */ }
}

document.querySelectorAll('.lang [data-lang]').forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

import('./i18n.js').then(mod => {
  I18N = mod.I18N;
  let saved = null;
  try { saved = localStorage.getItem('karino-lang'); } catch (e) { /* ignore */ }
  if (saved && I18N[saved] && saved !== 'ru') applyLang(saved);
}).catch(() => { /* stays in Russian */ });

/* -----------------------------------------------------------
   3. Cinematic Three.js background
   - particle field with depth + subtle drift
   - dynamic point light that follows a slow orbit
   - camera parallax on mouse / gyroscope
   - performance tiering: device pixel ratio cap, particle
     count scaled by a quick FPS probe, animations paused
     when the tab is hidden, full 2D-canvas fallback if WebGL
     is unavailable.
----------------------------------------------------------- */
(async function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function supportsWebGL() {
    try {
      const test = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (test.getContext('webgl') || test.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!supportsWebGL()) {
    run2DFallback(canvas);
    return;
  }

  let THREE;
  try {
    THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
  } catch (e) {
    run2DFallback(canvas);
    return;
  }

  // ---- device tiering -------------------------------------------------
  const cores = navigator.hardwareConcurrency || 4;
  const isSmallScreen = window.innerWidth < 700;
  let tier = 'high';
  if (cores <= 4 || isSmallScreen) tier = 'medium';
  if (cores <= 2) tier = 'low';

  const PARTICLE_COUNT = { high: 2600, medium: 1400, low: 700 }[tier];
  const PIXEL_RATIO_CAP = { high: 2, medium: 1.5, low: 1 }[tier];

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: tier !== 'low',
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x050408, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050408, 0.045);

  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.set(0, 0, 12);

  // ---- particle field ---------------------------------------------------
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = 6 + Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 16;
    positions[i * 3] = Math.cos(theta) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * radius - 6;
    speeds[i] = 0.05 + Math.random() * 0.15;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xa855f7,
    size: tier === 'low' ? 0.05 : 0.035,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });
  const particles = new THREE.Points(geometry, particleMaterial);
  scene.add(particles);

  // second, cooler-toned, slower layer for depth
  const geometry2 = geometry.clone();
  const particleMaterial2 = particleMaterial.clone();
  particleMaterial2.color = new THREE.Color(0x6d28d9);
  particleMaterial2.opacity = 0.3;
  const particles2 = new THREE.Points(geometry2, particleMaterial2);
  particles2.scale.setScalar(1.6);
  scene.add(particles2);

  // ---- glowing core (wireframe shell + faceted inner crystal) -------
  const core = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.4, tier === 'low' ? 0 : 1),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.28 })
  );
  const crystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, 0),
    new THREE.MeshStandardMaterial({
      color: 0x1c1729, emissive: 0x6d28d9, emissiveIntensity: 0.8,
      metalness: 0.85, roughness: 0.22, flatShading: true
    })
  );
  core.add(shell, crystal);
  scene.add(core);

  function placeCore() {
    const wide = window.innerWidth > 900;
    core.position.set(wide ? 4.2 : 0, wide ? 0.4 : 3.6, -4);
    core.scale.setScalar(wide ? 1 : 0.7);
  }
  placeCore();

  // ---- lighting -----------------------------------------------------
  const ambient = new THREE.AmbientLight(0x1c1729, 1.2);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xa855f7, 40, 40, 2);
  keyLight.position.set(6, 4, 4);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x6d28d9, 25, 40, 2);
  rimLight.position.set(-8, -3, -4);
  scene.add(rimLight);

  // ---- pointer parallax ------------------------------------------------
  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };

  window.addEventListener('pointermove', (e) => {
    targetPointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    targetPointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    targetPointer.x = Math.max(-1, Math.min(1, e.gamma / 30));
    targetPointer.y = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
  }, { passive: true });

  // ---- resize -------------------------------------------------------
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    placeCore();
  }
  window.addEventListener('resize', onResize);

  // ---- visibility pause ----------------------------------------------
  let isRunning = true;
  document.addEventListener('visibilitychange', () => {
    isRunning = document.visibilityState === 'visible';
    if (isRunning) requestAnimationFrame(animate);
  });

  // ---- scroll-linked camera ------------------------------------------
  let scrollTarget = 0, scrollSmooth = 0;
  function readScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollTarget = Math.min(1, window.scrollY / max);
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  // ---- render loop ------------------------------------------------------
  const clock = new THREE.Clock();

  function animate() {
    if (!isRunning) return;
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      particles.rotation.y = t * 0.015;
      particles2.rotation.y = -t * 0.01;

      keyLight.position.x = 6 * Math.cos(t * 0.2);
      keyLight.position.z = 6 * Math.sin(t * 0.2) + 4;
      rimLight.position.x = -8 * Math.cos(t * 0.15 + 2);
    }

    scrollSmooth += (scrollTarget - scrollSmooth) * 0.05;
    if (!prefersReducedMotion) {
      shell.rotation.x = t * 0.12 + scrollSmooth * 3;
      shell.rotation.y = t * 0.18;
      crystal.rotation.y = -t * 0.25;
      crystal.rotation.x = t * 0.1;
      crystal.material.emissiveIntensity = 0.7 + Math.sin(t * 1.4) * 0.25;
    }
    particles.rotation.x = scrollSmooth * 0.6;
    core.position.y += ((window.innerWidth > 900 ? 0.4 : 3.6) + scrollSmooth * 5 - core.position.y) * 0.05;

    pointer.x += (targetPointer.x - pointer.x) * 0.04;
    pointer.y += (targetPointer.y - pointer.y) * 0.04;

    camera.position.x = pointer.x * 1.4;
    camera.position.y = -pointer.y * 1.0 - scrollSmooth * 2;
    camera.position.z = 12 - scrollSmooth * 3;
    camera.lookAt(0, 0, -6);

    renderer.render(scene, camera);
  }
  animate();
})();

/* -----------------------------------------------------------
   4. 2D canvas fallback (no WebGL available)
   Lightweight ambient starfield, same visual language.
----------------------------------------------------------- */
function run2DFallback(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w, h, stars;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.floor((w * h) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      s: Math.random() * 0.3 + 0.05,
      c: Math.random() > 0.5 ? 'rgba(168,85,247,' : 'rgba(109,40,217,'
    }));
  }
  window.addEventListener('resize', resize);
  resize();

  let visible = true;
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (visible) requestAnimationFrame(draw);
  });

  function draw() {
    if (!visible) return;
    requestAnimationFrame(draw);
    ctx.fillStyle = '#050408';
    ctx.fillRect(0, 0, w, h);
    for (const star of stars) {
      star.y += star.s;
      if (star.y > h) star.y = 0;
      ctx.fillStyle = star.c + (0.4 + Math.random() * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  draw();
}
