(() => {
  const root = document.documentElement;
  const cursorOrb = document.querySelector('.cursor-orb');
  const cursorGlyph = document.querySelector('.cursor-glyph');
  const parallaxLayers = Array.from(document.querySelectorAll('.bg-layer[data-depth]'));
  const enableCursorFx = false;
  const INTERACTIVE_SELECTOR = 'a[href], button, [role="button"], [tabindex]:not([tabindex="-1"])';
  const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    shiftX: 0,
    shiftY: 0,
    shiftTargetX: 0,
    shiftTargetY: 0,
    glyphX: window.innerWidth / 2,
    glyphY: window.innerHeight / 2,
    glyphTargetX: window.innerWidth / 2,
    glyphTargetY: window.innerHeight / 2,
  };
  const TRAIL_SIZE = parseFloat(getComputedStyle(root).getPropertyValue('--trail-size')) || 22;
  let trails = [];
  let rafId = null;
  let isInteractive = false;
  let isPressingInteractive = false;
  const trailPalette = [
    'hsla(280, 95%, 70%, 0.95)',
    'hsla(200, 95%, 65%, 0.92)',
    'hsla(320, 94%, 70%, 0.95)',
    'hsla(165, 88%, 65%, 0.9)'
  ];

  const getInteractiveTarget = (node) => (node ? node.closest(INTERACTIVE_SELECTOR) : null);

  const setInteractiveState = (active) => {
    if (isInteractive === active) return;
    isInteractive = active;
    if (cursorGlyph) cursorGlyph.classList.toggle('is-actionable', active);
    if (cursorOrb) cursorOrb.classList.toggle('is-actionable', active);
  };

  const setPressState = (active) => {
    if (isPressingInteractive === active) return;
    isPressingInteractive = active;
    if (cursorGlyph) cursorGlyph.classList.toggle('is-pressed', active);
    if (cursorOrb) cursorOrb.classList.toggle('is-pressed', active);
  };

  const updateCursorProps = (nx, ny) => {
    root.style.setProperty('--cursor-nx', nx.toFixed(4));
    root.style.setProperty('--cursor-ny', ny.toFixed(4));
  };

  const initTrails = () => {
    const count = 1;
    trails = Array.from({ length: count }, (_, index) => {
      const dot = document.createElement('span');
      dot.className = 'cursor-trail';
      if (index % 2 === 1) dot.classList.add('is-secondary');
      dot.style.setProperty('--trail-color', trailPalette[index % trailPalette.length]);
      document.body.appendChild(dot);
      return { el: dot, x: state.x, y: state.y };
    });
  };

  const handlePointerMove = (event) => {
    state.targetX = event.clientX;
    state.targetY = event.clientY;
    const nx = event.clientX / window.innerWidth - 0.5;
    const ny = event.clientY / window.innerHeight - 0.5;
    state.shiftTargetX = nx * 140;
    state.shiftTargetY = ny * 100;
    state.glyphTargetX = event.clientX;
    state.glyphTargetY = event.clientY;
    updateCursorProps(nx, ny);
    const hoveringInteractive = getInteractiveTarget(event.target);
    setInteractiveState(Boolean(hoveringInteractive));
    if (cursorOrb) {
      cursorOrb.style.opacity = 1;
    }
    if (cursorGlyph) {
      cursorGlyph.classList.add('is-visible');
    }
    trails.forEach(({ el }) => el.classList.add('is-active'));
  };

  const resetPointer = () => {
    state.targetX = window.innerWidth / 2;
    state.targetY = window.innerHeight / 2;
    state.shiftTargetX = 0;
    state.shiftTargetY = 0;
    state.glyphTargetX = window.innerWidth / 2;
    state.glyphTargetY = window.innerHeight / 2;
    updateCursorProps(0, 0);
    if (cursorOrb) {
      cursorOrb.style.opacity = 0;
    }
    if (cursorGlyph) {
      cursorGlyph.classList.remove('is-visible');
    }
    trails.forEach(({ el }) => el.classList.remove('is-active'));
    setInteractiveState(false);
    setPressState(false);
  };

  const handlePointerDownInteractive = (event) => {
    const interactiveTarget = getInteractiveTarget(event.target);
    const shouldPress = Boolean(interactiveTarget);
    if (shouldPress) {
      setInteractiveState(true);
    }
    setPressState(shouldPress);
  };

  const handlePointerRelease = () => setPressState(false);

  // Frame rate throttling for performance
  let lastFrameTime = 0;
  const targetFrameInterval = 33;

  const render = (timestamp) => {
    // Throttle frame rate
    if (timestamp - lastFrameTime < targetFrameInterval) {
      rafId = requestAnimationFrame(render);
      return;
    }
    lastFrameTime = timestamp;

    state.x += (state.targetX - state.x) * 0.18;
    state.y += (state.targetY - state.y) * 0.18;
    state.shiftX += (state.shiftTargetX - state.shiftX) * 0.08;
    state.shiftY += (state.shiftTargetY - state.shiftY) * 0.08;
    state.glyphX = state.glyphTargetX;
    state.glyphY = state.glyphTargetY;

    if (cursorOrb) {
      cursorOrb.style.transform = `translate3d(${state.x - 130}px, ${state.y - 130}px, 0)`;
    }
    if (cursorGlyph) {
      const angle = Math.atan2(state.targetY - state.y, state.targetX - state.x) * (180 / Math.PI);
      cursorGlyph.style.transform = `translate3d(${state.glyphX - 11}px, ${state.glyphY - 11}px, 0) rotate(${angle}deg)`;
    }

    // Only render trails if not too many pointer events queued
    if (document.hidden === false) {
      trails.forEach((trail, index) => {
        const previous = index === 0 ? { x: state.x, y: state.y } : trails[index - 1];
        const follow = Math.max(0.15 - index * 0.01, 0.05);
        trail.x += (previous.x - trail.x) * follow;
        trail.y += (previous.y - trail.y) * follow;
        const scale = Math.max(1 - index * 0.07, 0.3);
        trail.el.style.transform = `translate3d(${trail.x - TRAIL_SIZE / 2}px, ${trail.y - TRAIL_SIZE / 2}px, 0) scale(${scale})`;
      });
    }

    parallaxLayers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0) / 100;
      const x = state.shiftX * depth;
      const y = state.shiftY * depth;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    rafId = requestAnimationFrame(render);
  };

  if (enableCursorFx) {
    document.body.classList.add('has-fancy-cursor');
    updateCursorProps(0, 0);
    initTrails();
    resetPointer();
    rafId = requestAnimationFrame(render);
    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerdown', handlePointerMove, { passive: true });
    document.addEventListener('pointerdown', handlePointerDownInteractive, { passive: true });
    window.addEventListener('pointerleave', resetPointer);
    window.addEventListener('blur', resetPointer);
    window.addEventListener('pointerup', handlePointerRelease);
    window.addEventListener('pointercancel', handlePointerRelease);
    window.addEventListener('pointerleave', handlePointerRelease);
    window.addEventListener('resize', () => {
      state.x = window.innerWidth / 2;
      state.y = window.innerHeight / 2;
      state.targetX = state.x;
      state.targetY = state.y;
      state.glyphX = state.x;
      state.glyphY = state.y;
      state.glyphTargetX = state.x;
      state.glyphTargetY = state.y;
    });

    // Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!document.hidden && !rafId) {
        rafId = requestAnimationFrame(render);
      }
    });
  } else {
    document.body.classList.remove('has-fancy-cursor');
  }

  const clickPalettes = [
    { primary: 'rgba(192,132,252,0.95)', secondary: 'rgba(56,189,248,0.9)', halo: 'rgba(255,255,255,0.9)' },
    { primary: 'rgba(236,72,153,0.95)', secondary: 'rgba(251,191,36,0.95)', halo: 'rgba(255,255,255,0.85)' },
    { primary: 'rgba(14,165,233,0.92)', secondary: 'rgba(16,185,129,0.9)', halo: 'rgba(255,255,255,0.9)' },
    { primary: 'rgba(248,113,113,0.95)', secondary: 'rgba(99,102,241,0.92)', halo: 'rgba(255,255,255,0.88)' }
  ];

  if (enableCursorFx) {
    document.addEventListener('pointerdown', (event) => {
      const burst = document.createElement('span');
      burst.className = 'click-burst';
      burst.style.left = event.clientX + 'px';
      burst.style.top = event.clientY + 'px';
      const palette = clickPalettes[Math.floor(Math.random() * clickPalettes.length)];
      burst.style.setProperty('--burst-color', palette.primary);
      burst.style.setProperty('--burst-color-alt', palette.secondary);
      burst.style.setProperty('--burst-halo', palette.halo);
      document.body.appendChild(burst);
      burst.addEventListener('animationend', () => burst.remove());
    }, { passive: true });
  }

  // --- HUD status typing effect ---
  const hudStatus = document.querySelector('.hud-status');
  if (hudStatus) {
    const hudText = 'SYSTEM ONLINE \u00b7 RESEARCH ACTIVE \u00b7 NODE: SHANGHAI';
    let hudIndex = 0;
    const cursor = document.createElement('span');
    cursor.className = 'hud-cursor';
    hudStatus.appendChild(cursor);
    const typeNext = () => {
      if (hudIndex < hudText.length) {
        cursor.before(hudText[hudIndex]);
        hudIndex++;
        setTimeout(typeNext, 40 + Math.random() * 30);
      }
    };
    setTimeout(typeNext, 1200);
  }

  // --- Active nav highlighting on scroll ---
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const sections = document.querySelectorAll('section[id]');

  if (sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

    sections.forEach((section) => navObserver.observe(section));
  }

  // --- Scroll-triggered section reveal ---
  const revealSections = document.querySelectorAll('section.reveal');

  if (revealSections.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Stagger topic-items within the revealed section
          const items = entry.target.querySelectorAll('.topic-item');
          items.forEach((item, i) => {
            setTimeout(() => item.classList.add('is-revealed'), 80 + i * 70);
          });
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });

    revealSections.forEach((section) => revealObserver.observe(section));
  }
})();
