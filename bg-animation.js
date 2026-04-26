// Lightweight kinetic background: motion-study ribbons, constellation points, and soft light washes.
(function() {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'robotics-bg';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '-2',
    pointerEvents: 'none',
    opacity: '0.42'
  });

  const existing = document.getElementById('robotics-bg');
  if (existing) existing.remove();
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  const themeQuery = window.matchMedia('(prefers-color-scheme: light)');
  const finePointer = window.matchMedia('(pointer:fine)').matches;
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
  const mobile = Math.min(window.innerWidth, window.innerHeight) < 720;
  const fps = lowPower || mobile ? 6 : 10;
  const frameInterval = 1000 / fps;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let lastFrame = 0;
  let rafId = 0;
  const pointer = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45, active: false, lastMove: 0 };

  const palettes = {
    dark: {
      bg: '5, 11, 24',
      blue: '128, 197, 255',
      cyan: '112, 231, 220',
      violet: '220, 180, 255',
      rose: '255, 152, 202',
      amber: '255, 210, 138',
      white: '244, 250, 255'
    },
    light: {
      bg: '246, 249, 255',
      blue: '31, 102, 177',
      cyan: '5, 130, 145',
      violet: '116, 70, 180',
      rose: '178, 58, 116',
      amber: '154, 105, 20',
      white: '255, 255, 255'
    }
  };
  let palette = themeQuery.matches ? palettes.light : palettes.dark;

  const rand = (min, max) => Math.random() * (max - min) + min;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function syncTheme() {
    palette = themeQuery.matches ? palettes.light : palettes.dark;
    canvas.style.opacity = themeQuery.matches ? '0.28' : '0.42';
  }

  class Ribbon {
    constructor(index) {
      this.index = index;
      this.reset();
    }

    reset() {
      this.seed = rand(0, Math.PI * 2);
      this.y = rand(0.08, 0.92);
      this.amp = rand(0.035, 0.095);
      this.wave = rand(0.85, 1.8);
      this.speed = rand(0.00045, 0.0011);
      this.tilt = rand(-0.09, 0.09);
      this.lineWidth = rand(0.7, 1.7);
      this.alpha = rand(0.055, 0.13);
      this.color = [palette.blue, palette.violet, palette.cyan, palette.amber][this.index % 4];
    }

    draw(time) {
      const steps = mobile ? 18 : 28;
      const driftX = (pointer.x - 0.5) * width * 0.012;
      const driftY = (pointer.y - 0.5) * height * 0.025;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = t * width + driftX;
        const waveA = Math.sin(this.seed + time * this.speed + t * Math.PI * this.wave);
        const waveB = Math.cos(this.seed * 0.7 + time * this.speed * 1.7 + t * Math.PI * 5.2);
        const y = this.y * height + waveA * this.amp * height + waveB * this.amp * height * 0.26 + (t - 0.5) * width * this.tilt + driftY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${this.color}, ${this.alpha})`;
      ctx.lineWidth = this.lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.strokeStyle = `rgba(${palette.white}, ${this.alpha * 0.12})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    }
  }

  class MotionGlyph {
    constructor(index) {
      this.index = index;
      this.reset();
    }

    reset() {
      this.cx = rand(0.12, 0.88);
      this.cy = rand(0.14, 0.86);
      this.radius = rand(28, 72);
      this.phase = rand(0, Math.PI * 2);
      this.speed = rand(0.0008, 0.002);
      this.alpha = rand(0.055, 0.12);
      this.color = [palette.blue, palette.rose, palette.amber][this.index % 3];
    }

    draw(time) {
      const cx = this.cx * width + (pointer.x - 0.5) * 10;
      const cy = this.cy * height + (pointer.y - 0.5) * 8;
      const phase = this.phase + time * this.speed;
      const points = 7;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(${this.color}, ${this.alpha})`;
      ctx.fillStyle = `rgba(${this.color}, ${this.alpha * 1.65})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const a = phase + i * Math.PI * 0.74;
        const r = this.radius * (0.62 + Math.sin(phase * 0.8 + i) * 0.2);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a * 1.24) * r * 0.58;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let i = 0; i < points; i++) {
        const a = phase + i * Math.PI * 0.74;
        const r = this.radius * (0.62 + Math.sin(phase * 0.8 + i) * 0.2);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a * 1.24) * r * 0.58;
        ctx.beginPath();
        ctx.arc(x, y, i % 3 === 0 ? 2.2 : 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class Spark {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = rand(0, width || window.innerWidth);
      this.y = rand(0, height || window.innerHeight);
      this.vx = rand(-0.045, 0.045);
      this.vy = rand(-0.035, 0.035);
      this.size = rand(0.55, 1.45);
      this.phase = rand(0, Math.PI * 2);
      this.color = Math.random() > 0.5 ? palette.blue : palette.cyan;
    }

    update() {
      this.phase += 0.008;
      this.x += this.vx + (pointer.x - 0.5) * 0.015;
      this.y += this.vy + (pointer.y - 0.5) * 0.01;
      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20;
      if (this.y > height + 20) this.y = -20;
    }

    draw() {
      const alpha = 0.055 + Math.sin(this.phase) * 0.025;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
      ctx.fill();
    }
  }

  const ribbonCount = mobile || lowPower ? 1 : 2;
  const glyphCount = 0;
  const sparkCount = mobile || lowPower ? 5 : 10;
  const ribbons = Array.from({ length: ribbonCount }, (_, i) => new Ribbon(i));
  const glyphs = Array.from({ length: glyphCount }, (_, i) => new MotionGlyph(i));
  const sparks = Array.from({ length: sparkCount }, () => new Spark());
  const prismRings = [
    { x: 0.78, y: 0.22, r: 210, color: 'violet', phase: 0.2 },
    { x: 0.2, y: 0.76, r: 170, color: 'cyan', phase: 2.4 },
    { x: 0.55, y: 0.58, r: 260, color: 'amber', phase: 4.1 }
  ];
  const terrainSeeds = Array.from({ length: mobile || lowPower ? 2 : 3 }, (_, index) => ({
    y: 0.58 + index * 0.09,
    amp: 20 + index * 18,
    speed: 0.00008 + index * 0.000035,
    alpha: 0.11 - index * 0.018
  }));
  const probeDots = Array.from({ length: mobile || lowPower ? 10 : 18 }, () => ({
    x: rand(0.08, 0.92),
    y: rand(0.34, 0.9),
    pulse: rand(0, Math.PI * 2),
    size: rand(0.8, 2.2)
  }));

  function resize() {
    dpr = 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFineGrid(time) {
    const gap = mobile ? 92 : 76;
    const offset = (time * 0.0012) % gap;
    ctx.save();
    ctx.strokeStyle = `rgba(${palette.blue}, ${themeQuery.matches ? 0.018 : 0.028})`;
    ctx.lineWidth = 1;
    for (let x = -gap + offset; x < width + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height * 0.18, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawExplorerWorld(time) {
    const slow = time * 0.00022;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    terrainSeeds.forEach((layer, layerIndex) => {
      const baseY = height * layer.y;
      const steps = mobile || lowPower ? 18 : 28;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const x = p * width;
        const y = baseY
          + Math.sin(p * Math.PI * (2.2 + layerIndex * 0.7) + slow * (1 + layerIndex)) * layer.amp
          + Math.sin(p * Math.PI * 7.5 - slow * 2.1) * layer.amp * 0.22;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${palette.blue}, ${layer.alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const roverX = width * (0.28 + Math.sin(slow * 1.7) * 0.025);
    const roverY = height * 0.69 + Math.sin(slow * 2.2) * 8;
    const scanAngle = -0.34 + Math.sin(slow * 3.2) * 0.24;
    const scanLength = Math.min(width, height) * (mobile ? 0.58 : 0.74);

    ctx.fillStyle = `rgba(${palette.cyan}, ${mobile || lowPower ? 0.035 : 0.052})`;
    ctx.beginPath();
    ctx.moveTo(roverX, roverY);
    ctx.arc(roverX, roverY, scanLength, scanAngle - 0.2, scanAngle + 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(${palette.cyan}, 0.2)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 12]);
    ctx.beginPath();
    ctx.arc(roverX, roverY, scanLength * 0.42, scanAngle - 0.22, scanAngle + 0.22);
    ctx.arc(roverX, roverY, scanLength * 0.68, scanAngle - 0.2, scanAngle + 0.2);
    ctx.stroke();
    ctx.setLineDash([]);

    probeDots.forEach((dot) => {
      const dx = dot.x * width - roverX;
      const dy = dot.y * height - roverY;
      const angle = Math.atan2(dy, dx);
      const seen = dx * dx + dy * dy < scanLength * scanLength && Math.abs(angle - scanAngle) < 0.24;
      const pulse = Math.sin(slow * 14 + dot.pulse) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(dot.x * width, dot.y * height, dot.size + (seen ? pulse * 1.8 : 0), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${seen ? palette.amber : palette.blue}, ${seen ? 0.22 + pulse * 0.2 : 0.055})`;
      ctx.fill();
    });

    ctx.strokeStyle = `rgba(${palette.amber}, 0.18)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(roverX - 76, roverY + 38);
    ctx.bezierCurveTo(roverX - 26, roverY + 24, roverX + 22, roverY + 42, roverX + 86, roverY + 22);
    ctx.stroke();

    ctx.fillStyle = `rgba(${palette.white}, 0.18)`;
    ctx.strokeStyle = `rgba(${palette.amber}, 0.3)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(roverX - 18, roverY - 10, 36, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(roverX + 4, roverY - 10);
    ctx.lineTo(roverX + 18, roverY - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(roverX + 20, roverY - 32, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${palette.cyan}, 0.55)`;
    ctx.fill();

    ctx.restore();
  }

  function animate(timestamp) {
    rafId = requestAnimationFrame(animate);
    if (document.hidden || timestamp - lastFrame < frameInterval) return;
    lastFrame = timestamp;
    frame += 1;

    pointer.x += (pointer.tx - pointer.x) * 0.025;
    pointer.y += (pointer.ty - pointer.y) * 0.025;
    if (pointer.active && timestamp - pointer.lastMove > 1200) pointer.active = false;

    ctx.clearRect(0, 0, width, height);
    if (!mobile && !lowPower) drawFineGrid(timestamp);
    drawExplorerWorld(timestamp);

    ribbons.forEach((ribbon) => ribbon.draw(timestamp));
    sparks.forEach((spark) => {
      spark.update();
      spark.draw();
    });

    if (finePointer && pointer.active) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const x = pointer.x * width;
      const y = pointer.y * height;
      ctx.strokeStyle = `rgba(${palette.amber}, 0.12)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 22 + Math.sin(frame * 0.025) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function handlePointer(event) {
    pointer.tx = event.clientX / window.innerWidth;
    pointer.ty = event.clientY / window.innerHeight;
    pointer.active = true;
    pointer.lastMove = performance.now();
  }

  window.addEventListener('resize', resize, { passive: true });
  if (finePointer) document.addEventListener('pointermove', handlePointer, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastFrame = 0;
  });
  if (typeof themeQuery.addEventListener === 'function') {
    themeQuery.addEventListener('change', syncTheme);
  } else if (typeof themeQuery.addListener === 'function') {
    themeQuery.addListener(syncTheme);
  }

  syncTheme();
  resize();
  rafId = requestAnimationFrame(animate);
})();
