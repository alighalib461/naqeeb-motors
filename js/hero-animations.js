/**
 * NaqeeB Motors - Cinematic Scroll-Controlled Hero Canvas Animation Engine
 * Journey: SPACE → EARTH → PAKISTAN → ISLAMABAD → NAQEEB MOTORS (151 WebP Frames)
 */

const TOTAL_FRAMES = 151;
const FRAME_PATH = '/assets/hero-frames/frame_'; // e.g. /assets/hero-frames/frame_0001.webp

// Global frame cache & loading state
const frameImages = new Array(TOTAL_FRAMES);
const frameLoaded = new Array(TOTAL_FRAMES).fill(false);
let currentFrameIndex = 0;
let targetFrameIndex = 0;
let isFirstFrameDrawn = false;
let lastRenderedIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
  initHeroScrollCanvas();
  initScrollProgress();
  initNavbarScroll();
  initScrollReveals();
  initNumberCounters();
  initMobileMenu();
});

/**
 * 1. Pinned Canvas Frame Controller & Journey Choreographer
 */
function initHeroScrollCanvas() {
  const track = document.querySelector('.hero-scroll-track') || document.getElementById('home') || document.getElementById('hero-track');
  const canvas = document.getElementById('hero-frame-canvas');
  const scrollIndicator = document.getElementById('hero-scroll-indicator');
  const hud = document.getElementById('hero-journey-hud');
  const stages = [
    document.getElementById('hero-stage-0'),
    document.getElementById('hero-stage-1'),
    document.getElementById('hero-stage-2'),
    document.getElementById('hero-stage-3'),
    document.getElementById('hero-stage-4')
  ].filter(Boolean);

  if (!canvas || !track) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  // Helper to format frame number: 0 -> "0001"
  function getFrameSrc(index) {
    const padded = String(index + 1).padStart(4, '0');
    return `${FRAME_PATH}${padded}.webp`;
  }

  // Set canvas resolution to match window with devicePixelRatio for crispness
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const newWidth = Math.floor(window.innerWidth * dpr);
    const newHeight = Math.floor(window.innerHeight * dpr);

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
    }
    renderFrameImmediate();
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Draw frame with aspect ratio cover math (no stretching, centered)
  function drawImageCover(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const nx = (cw - nw) / 2;
    const ny = (ch - nh) / 2;

    ctx.drawImage(img, nx, ny, nw, nh);
  }

  // Nearest-Neighbor frame lookup to prevent any blank flashes
  function getBestFrame(index) {
    if (frameLoaded[index] && frameImages[index]) {
      return frameImages[index];
    }
    // Search nearby frames
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const left = index - offset;
      const right = index + offset;
      if (left >= 0 && frameLoaded[left] && frameImages[left]) {
        return frameImages[left];
      }
      if (right < TOTAL_FRAMES && frameLoaded[right] && frameImages[right]) {
        return frameImages[right];
      }
    }
    return frameImages[0] || null;
  }

  function renderFrameImmediate() {
    const roundedIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameIndex)));
    const img = getBestFrame(roundedIndex);
    if (img) {
      drawImageCover(img);
      lastRenderedIndex = roundedIndex;
    }
  }

  // Preload individual frame with async Image.decode()
  async function preloadFrame(index) {
    if (frameImages[index]) return;
    const img = new Image();
    img.src = getFrameSrc(index);
    frameImages[index] = img;

    if ('decode' in img) {
      try {
        await img.decode();
        frameLoaded[index] = true;
      } catch (err) {
        img.onload = () => { frameLoaded[index] = true; };
      }
    } else {
      img.onload = () => { frameLoaded[index] = true; };
    }
  }

  // 1. Instantly load & paint Frame 1
  const firstImg = new Image();
  firstImg.src = getFrameSrc(0);
  frameImages[0] = firstImg;

  let pipelineStarted = false;
  function onFirstImageReady() {
    if (pipelineStarted) return;
    pipelineStarted = true;
    frameLoaded[0] = true;
    resizeCanvas();
    drawImageCover(firstImg);
    isFirstFrameDrawn = true;
    startPreloadPipeline();
  }

  firstImg.onload = onFirstImageReady;
  firstImg.onerror = () => {
    console.warn('Hero frame 1 failed to load from:', firstImg.src);
  };

  if (firstImg.complete && firstImg.naturalWidth > 0) {
    onFirstImageReady();
  }

  // 2. Efficient tiered preloading pipeline
  async function startPreloadPipeline() {
    // Stage 1: Priority load first 15 frames for instant responsive scrubbing
    const priorityCount = Math.min(15, TOTAL_FRAMES);
    for (let i = 1; i < priorityCount; i++) {
      await preloadFrame(i);
    }

    // Stage 2: Batch preload remaining frames in chunks of 8
    const CHUNK_SIZE = 8;
    for (let i = priorityCount; i < TOTAL_FRAMES; i += CHUNK_SIZE) {
      const batch = [];
      for (let j = i; j < Math.min(i + CHUNK_SIZE, TOTAL_FRAMES); j++) {
        batch.push(preloadFrame(j));
      }
      await Promise.all(batch);
    }
  }

  // 3. Smooth Lerp Animation Render Loop (Silky scrubbing in both directions)
  let rafId = null;
  function updateAnimationLoop() {
    const diff = targetFrameIndex - currentFrameIndex;
    if (Math.abs(diff) > 0.002) {
      // Damped linear interpolation (Lerp factor 0.22 gives a heavy, luxury cinematic feel)
      currentFrameIndex += diff * 0.22;
      const roundedIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameIndex)));
      
      if (roundedIndex !== lastRenderedIndex) {
        const img = getBestFrame(roundedIndex);
        if (img) {
          drawImageCover(img);
          lastRenderedIndex = roundedIndex;
        }
      }
    }
    rafId = requestAnimationFrame(updateAnimationLoop);
  }

  rafId = requestAnimationFrame(updateAnimationLoop);

  // 4. Update HUD Journey Indicator
  function updateHud(progress) {
    if (!hud) return;
    const hudItems = hud.querySelectorAll('.hud-item');
    if (!hudItems.length) return;

    // 5 Stages: 0: Space (0-0.2), 1: Earth (0.2-0.4), 2: Pakistan (0.4-0.6), 3: Islamabad (0.6-0.8), 4: Showroom (0.8-1.0)
    const currentStage = Math.min(4, Math.floor(progress * 5));

    hudItems.forEach((item, idx) => {
      if (idx === currentStage) {
        item.classList.add('active');
        item.classList.remove('passed');
      } else if (idx < currentStage) {
        item.classList.remove('active');
        item.classList.add('passed');
      } else {
        item.classList.remove('active');
        item.classList.remove('passed');
      }
    });
  }

  // 5. Update Multi-Stage Narrative Overlays
  function updateStages(progress) {
    // Stage configurations with smooth window fades
    // Stage 0: 0.00 -> 0.18 (Main Hero)
    // Stage 1: 0.22 -> 0.38 (Orbit / Global Selection)
    // Stage 2: 0.42 -> 0.58 (Pakistan / Inspection)
    // Stage 3: 0.62 -> 0.78 (Islamabad / Capital)
    // Stage 4: 0.82 -> 1.00 (NaqeeB Motors / Arrival)
    const stageWindows = [
      { enter: 0.00, peakStart: 0.00, peakEnd: 0.16, exit: 0.22 },
      { enter: 0.22, peakStart: 0.26, peakEnd: 0.36, exit: 0.42 },
      { enter: 0.42, peakStart: 0.46, peakEnd: 0.56, exit: 0.62 },
      { enter: 0.62, peakStart: 0.66, peakEnd: 0.76, exit: 0.82 },
      { enter: 0.82, peakStart: 0.86, peakEnd: 1.00, exit: 1.00 }
    ];

    stages.forEach((stageEl, idx) => {
      if (!stageEl) return;
      const win = stageWindows[idx];
      let opacity = 0;
      let translateY = 20;

      if (progress >= win.enter && progress <= win.exit) {
        if (progress < win.peakStart) {
          // Fading in
          const t = (progress - win.enter) / (win.peakStart - win.enter);
          opacity = Math.sin(t * Math.PI / 2);
          translateY = (1 - t) * 20;
        } else if (progress > win.peakEnd && win.exit > win.peakEnd) {
          // Fading out
          const t = (progress - win.peakEnd) / (win.exit - win.peakEnd);
          opacity = Math.cos(t * Math.PI / 2);
          translateY = -t * 20;
        } else {
          // Fully active
          opacity = 1;
          translateY = 0;
        }
      }

      stageEl.style.opacity = opacity.toFixed(3);
      stageEl.style.transform = `translateY(${translateY.toFixed(1)}px)`;
      stageEl.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';

      if (opacity > 0.05) {
        stageEl.classList.add('active');
      } else {
        stageEl.classList.remove('active');
      }
    });
  }

  // 6. Scroll Tracking Event
  function onScroll() {
    const trackRect = track.getBoundingClientRect();
    const maxScroll = track.offsetHeight - window.innerHeight;
    
    if (maxScroll <= 0) return;

    // Calculate progress 0.0 -> 1.0
    const scrollOffset = -trackRect.top;
    const progress = Math.min(1, Math.max(0, scrollOffset / maxScroll));

    // Update target frame index (0 to TOTAL_FRAMES - 1)
    targetFrameIndex = progress * (TOTAL_FRAMES - 1);

    // Update Narrative Overlays & HUD
    updateStages(progress);
    updateHud(progress);

    // Scroll Indicator
    if (scrollIndicator) {
      scrollIndicator.style.opacity = progress > 0.04 ? '0' : '1';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/**
 * 2. Scroll Progress Bar
 */
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${scrollPercent}%`;
  }, { passive: true });
}

/**
 * 3. Navbar Transformation on Scroll
 */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * 4. Scroll Reveal Intersection Observer
 */
function initScrollReveals() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  });

  reveals.forEach(el => observer.observe(el));
}

/**
 * 5. Animated Number Counters
 */
function initNumberCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetVal = parseFloat(el.getAttribute('data-counter'));
        const isDecimal = targetVal % 1 !== 0;
        const duration = 1800; // ms
        const startTime = performance.now();

        const updateCounter = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const current = targetVal * easeOut;

          el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = isDecimal ? targetVal.toFixed(1) : targetVal.toLocaleString();
          }
        };

        requestAnimationFrame(updateCounter);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/**
 * 6. Mobile Navigation Menu Toggle
 */
function initMobileMenu() {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const overlay = document.querySelector('.mobile-drawer-overlay');
  const closeBtn = document.querySelector('.mobile-drawer-close');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!hamburgerBtn || !drawer || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  };

  hamburgerBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  navLinks.forEach(link => link.addEventListener('click', closeDrawer));
}

