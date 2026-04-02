// Robotics-themed background animation
// Features: Neural network nodes, kinematic chains, skeleton rigs, trajectories, mocap markers, animated grid

(function() {
  'use strict';

  const canvas = document.createElement('canvas');
  canvas.id = 'robotics-bg';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '-2',
    pointerEvents: 'none',
    opacity: '0.7'
  });

  const existing = document.getElementById('robotics-bg');
  if (existing) existing.remove();
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width, height, dpr;
  let mouse = { x: null, y: null, active: false };
  let frameCount = 0;

  // Configuration
  const config = {
    nodeCount: 35,
    connectionDistance: 140,
    mouseDistance: 180,
    gridSize: 50,
    hexagonCount: 6,
    particleCount: 20,
    chainCount: 3,
    skeletonCount: 2,
    trajectoryCount: 4,
    mocapCount: 30
  };

  // Resize handler
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.width = window.innerWidth * dpr;
    height = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  }

  // Utility functions
  const random = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => a + (b - a) * t;

  // Neural Network Node (representing joints/connection points)
  class Node {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = random(0, window.innerWidth);
      this.y = random(0, window.innerHeight);
      this.vx = random(-0.25, 0.25);
      this.vy = random(-0.25, 0.25);
      this.radius = random(2, 4);
      this.baseRadius = this.radius;
      this.phase = random(0, Math.PI * 2);
      this.pulseSpeed = random(0.02, 0.04);
      this.type = Math.random() > 0.7 ? 'joint' : 'node';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.phase += this.pulseSpeed;
      this.radius = this.baseRadius + Math.sin(this.phase) * 1.2;

      if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
      if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1;

      if (mouse.active) {
        const d = distance(this, mouse);
        if (d < config.mouseDistance) {
          const force = (config.mouseDistance - d) / config.mouseDistance;
          const angle = Math.atan2(this.y - mouse.y, this.x - mouse.x);
          this.x += Math.cos(angle) * force * 1.5;
          this.y += Math.sin(angle) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.beginPath();
      if (this.type === 'joint') {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + this.phase * 0.5;
          const r = this.radius * 1.5;
          const x = this.x + Math.cos(angle) * r;
          const y = this.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(205, 155, 249, ${0.35 + Math.sin(this.phase) * 0.15})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(205, 155, 249, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + Math.sin(this.phase) * 0.25})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${0.08 + Math.sin(this.phase) * 0.04})`;
        ctx.fill();
      }
    }
  }

  // Floating Hexagon (robot parts/modules)
  class Hexagon {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = random(0, window.innerWidth);
      this.y = random(0, window.innerHeight);
      this.size = random(15, 40);
      this.vx = random(-0.15, 0.15);
      this.vy = random(-0.12, 0.12);
      this.rotation = random(0, Math.PI * 2);
      this.rotationSpeed = random(-0.003, 0.003);
      this.phase = random(0, Math.PI * 2);
      this.opacity = random(0.08, 0.2);
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      this.phase += 0.015;

      if (this.x < -80) this.x = window.innerWidth + 80;
      if (this.x > window.innerWidth + 80) this.x = -80;
      if (this.y < -80) this.y = window.innerHeight + 80;
      if (this.y > window.innerHeight + 80) this.y = -80;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      const pulse = 1 + Math.sin(this.phase) * 0.08;
      const size = this.size * pulse;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(139, 92, 246, ${this.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * (size * 0.6);
        const y = Math.sin(angle) * (size * 0.6);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(236, 72, 153, ${this.opacity * 0.6})`;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Kinematic Chain - Simulates robot arm/limb with inverse kinematics-like motion
  class KinematicChain {
    constructor() {
      this.reset();
    }

    reset() {
      this.baseX = random(100, window.innerWidth - 100);
      this.baseY = random(100, window.innerHeight - 100);
      this.segments = 5;
      this.segmentLength = random(30, 45);
      this.joints = [];
      this.phase = random(0, Math.PI * 2);
      this.speed = random(0.008, 0.015);
      this.color = Math.random() > 0.5 ? { r: 14, g: 165, b: 233 } : { r: 139, g: 92, b: 246 };

      for (let i = 0; i <= this.segments; i++) {
        this.joints.push({
          x: this.baseX + i * this.segmentLength,
          y: this.baseY,
          angle: 0
        });
      }
    }

    update() {
      this.phase += this.speed;

      // Animate end effector in a figure-8 pattern
      const targetX = this.baseX + Math.sin(this.phase) * 80;
      const targetY = this.baseY + Math.sin(this.phase * 2) * 40 + Math.cos(this.phase) * 30;

      // Simple FABRIK-like iteration
      for (let iteration = 0; iteration < 5; iteration++) {
        // Forward pass - position joints from end to base
        this.joints[this.segments].x = targetX;
        this.joints[this.segments].y = targetY;

        for (let i = this.segments - 1; i >= 0; i--) {
          const dx = this.joints[i].x - this.joints[i + 1].x;
          const dy = this.joints[i].y - this.joints[i + 1].y;
          const dist = Math.hypot(dx, dy);
          const ratio = this.segmentLength / dist;

          this.joints[i].x = this.joints[i + 1].x + dx * ratio;
          this.joints[i].y = this.joints[i + 1].y + dy * ratio;
        }

        // Backward pass - anchor base
        this.joints[0].x = this.baseX;
        this.joints[0].y = this.baseY;

        for (let i = 1; i <= this.segments; i++) {
          const dx = this.joints[i].x - this.joints[i - 1].x;
          const dy = this.joints[i].y - this.joints[i - 1].y;
          const dist = Math.hypot(dx, dy);
          const ratio = this.segmentLength / dist;

          this.joints[i].x = this.joints[i - 1].x + dx * ratio;
          this.joints[i].y = this.joints[i - 1].y + dy * ratio;
        }
      }
    }

    draw() {
      // Draw bone segments
      ctx.beginPath();
      ctx.moveTo(this.joints[0].x, this.joints[0].y);
      for (let i = 1; i <= this.segments; i++) {
        ctx.lineTo(this.joints[i].x, this.joints[i].y);
      }
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.4)`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw joints
      this.joints.forEach((joint, i) => {
        const size = i === this.segments ? 5 : 3;
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${i === this.segments ? 0.9 : 0.6})`;
        ctx.fill();

        // Joint ring
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, size * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.25)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }

  // Skeleton Rig - Simple character skeleton animation
  class SkeletonRig {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = random(150, window.innerWidth - 150);
      this.y = random(150, window.innerHeight - 150);
      this.scale = random(0.6, 1);
      this.phase = random(0, Math.PI * 2);
      this.speed = random(0.01, 0.02);
      this.pose = 'idle'; // idle, walk, run
    }

    update() {
      this.phase += this.speed;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.scale, this.scale);

      const time = this.phase;
      const breathe = Math.sin(time * 2) * 3;

      // Hip position (center)
      const hipX = 0;
      const hipY = 20 + breathe * 0.5;

      // Spine
      const spineTopX = hipX + Math.sin(time) * 5;
      const spineTopY = hipY - 50 + Math.sin(time * 2) * 2;

      // Head
      const headX = spineTopX + Math.sin(time * 0.5) * 8;
      const headY = spineTopY - 35;

      // Arms (swinging motion)
      const leftArmAngle = Math.sin(time * 1.5) * 0.4;
      const rightArmAngle = Math.sin(time * 1.5 + Math.PI) * 0.4;

      // Legs (walking motion)
      const leftLegAngle = Math.sin(time * 2) * 0.3;
      const rightLegAngle = Math.sin(time * 2 + Math.PI) * 0.3;

      // Draw spine
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.quadraticCurveTo(hipX + Math.sin(time) * 3, hipY - 25, spineTopX, spineTopY);
      ctx.strokeStyle = 'rgba(205, 155, 249, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw head
      ctx.beginPath();
      ctx.arc(headX, headY, 12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(205, 155, 249, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Head tracking dot
      ctx.beginPath();
      ctx.arc(headX + 3, headY - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(205, 155, 249, 0.8)';
      ctx.fill();

      // Draw arms
      this.drawLimb(spineTopX - 8, spineTopY + 5, leftArmAngle, 35, 'rgba(56, 189, 248, 0.5)');
      this.drawLimb(spineTopX + 8, spineTopY + 5, rightArmAngle, 35, 'rgba(56, 189, 248, 0.5)');

      // Draw legs
      this.drawLimb(hipX - 8, hipY, leftLegAngle, 40, 'rgba(236, 72, 153, 0.5)');
      this.drawLimb(hipX + 8, hipY, rightLegAngle, 40, 'rgba(236, 72, 153, 0.5)');

      // Joint markers
      const joints = [
        { x: hipX, y: hipY },
        { x: spineTopX, y: spineTopY },
        { x: headX, y: headY + 12 }
      ];

      joints.forEach(j => {
        ctx.beginPath();
        ctx.arc(j.x, j.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
      });

      ctx.restore();
    }

    drawLimb(startX, startY, angle, length, color) {
      const endX = startX + Math.sin(angle) * length;
      const endY = startY + Math.cos(angle) * length;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Joint at end
      ctx.beginPath();
      ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  // Trajectory Arc - Shows motion planning paths
  class TrajectoryArc {
    constructor() {
      this.reset();
    }

    reset() {
      this.startX = random(50, window.innerWidth - 50);
      this.startY = random(window.innerHeight * 0.6, window.innerHeight - 50);
      this.endX = this.startX + random(-150, 150);
      this.endY = this.startY - random(80, 200);
      this.height = random(60, 150);
      this.phase = random(0, Math.PI * 2);
      this.speed = random(0.01, 0.02);
      this.color = Math.random() > 0.5 ? '14, 165, 233' : '16, 185, 129';
      this.duration = random(120, 180);
      this.progress = 0;
    }

    update() {
      this.phase += this.speed;
      this.progress += 1;

      if (this.progress > this.duration) {
        this.reset();
      }
    }

    draw() {
      const t = this.progress / this.duration;
      const fadeIn = Math.min(t * 5, 1);
      const fadeOut = Math.min((1 - t) * 3, 1);
      const alpha = Math.min(fadeIn, fadeOut) * 0.4;

      // Draw parabolic trajectory
      ctx.beginPath();
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const pt = i / steps;
        const x = this.startX + (this.endX - this.startX) * pt;
        const y = this.startY + (this.endY - this.startY) * pt - Math.sin(pt * Math.PI) * this.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${this.color}, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current position marker
      if (t < 1) {
        const cx = this.startX + (this.endX - this.startX) * t;
        const cy = this.startY + (this.endY - this.startY) * t - Math.sin(t * Math.PI) * this.height;

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${alpha * 1.5})`;
        ctx.fill();

        // Target marker
        ctx.beginPath();
        ctx.arc(this.endX, this.endY, 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${this.color}, ${alpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Motion Capture Markers - Floating dots that form patterns
  class MocapMarker {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = random(0, window.innerWidth);
      this.y = random(0, window.innerHeight);
      this.baseX = this.x;
      this.baseY = this.y;
      this.vx = random(-0.3, 0.3);
      this.vy = random(-0.3, 0.3);
      this.size = random(2, 4);
      this.phase = random(0, Math.PI * 2);
      this.speed = random(0.02, 0.04);
      this.pattern = Math.floor(random(0, 3)); // 0: orbit, 1: figure8, 2: random
      this.trail = [];
      this.maxTrail = 8;
    }

    update() {
      this.phase += this.speed;

      // Store trail
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) this.trail.shift();

      // Different movement patterns
      switch (this.pattern) {
        case 0: // Orbit
          this.x = this.baseX + Math.cos(this.phase) * 30;
          this.y = this.baseY + Math.sin(this.phase) * 20;
          break;
        case 1: // Figure 8
          this.x = this.baseX + Math.sin(this.phase) * 40;
          this.y = this.baseY + Math.sin(this.phase * 2) * 20;
          break;
        default: // Random drift
          this.x += this.vx;
          this.y += this.vy;
          if (Math.abs(this.x - this.baseX) > 50) this.vx *= -1;
          if (Math.abs(this.y - this.baseY) > 50) this.vy *= -1;
      }
    }

    draw() {
      // Draw trail
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = `rgba(244, 114, 182, 0.15)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw marker
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 114, 182, ${0.5 + Math.sin(this.phase * 2) * 0.2})`;
      ctx.fill();

      // Cross marker (typical mocap style)
      ctx.beginPath();
      ctx.moveTo(this.x - this.size * 1.5, this.y);
      ctx.lineTo(this.x + this.size * 1.5, this.y);
      ctx.moveTo(this.x, this.y - this.size * 1.5);
      ctx.lineTo(this.x, this.y + this.size * 1.5);
      ctx.strokeStyle = `rgba(244, 114, 182, ${0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Motion Particle (animation curves/motion trails)
  class MotionParticle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = random(0, window.innerWidth);
      this.y = random(0, window.innerHeight);
      this.vx = random(-0.8, 0.8);
      this.vy = random(-0.4, 0.4);
      this.life = 1;
      this.decay = random(0.004, 0.012);
      this.size = random(1, 2.5);
      this.trail = [];
      this.maxTrail = 12;
      this.color = Math.random() > 0.5 ? '14, 165, 233' : '236, 72, 153';
    }

    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) this.trail.shift();

      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;

      this.vx += random(-0.03, 0.03);
      this.vy += random(-0.03, 0.03);
      this.vx *= 0.99;
      this.vy *= 0.99;

      if (this.life <= 0 || this.x < 0 || this.x > window.innerWidth || this.y < 0 || this.y > window.innerHeight) {
        this.reset();
      }
    }

    draw() {
      if (this.trail.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = `rgba(${this.color}, ${this.life * 0.3})`;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.life * 0.6})`;
      ctx.fill();
    }
  }

  // Animated Grid
  function drawGrid() {
    const time = frameCount * 0.008;
    const offsetX = (time * 8) % config.gridSize;
    const offsetY = (time * 4) % config.gridSize;

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < window.innerWidth; x += config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, window.innerHeight);
      ctx.stroke();
    }

    for (let y = offsetY; y < window.innerHeight; y += config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(window.innerWidth, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    for (let x = offsetX; x < window.innerWidth; x += config.gridSize) {
      for (let y = offsetY; y < window.innerHeight; y += config.gridSize) {
        const dist = Math.hypot(x - mouse.x, y - mouse.y);
        const size = mouse.active && dist < 150 ? 2.5 + (150 - dist) / 60 : 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Initialize entities
  const nodes = Array.from({ length: config.nodeCount }, () => new Node());
  const hexagons = Array.from({ length: config.hexagonCount }, () => new Hexagon());
  const chains = Array.from({ length: config.chainCount }, () => new KinematicChain());
  const skeletons = Array.from({ length: config.skeletonCount }, () => new SkeletonRig());
  const trajectories = Array.from({ length: config.trajectoryCount }, () => new TrajectoryArc());
  const mocapMarkers = Array.from({ length: config.mocapCount }, () => new MocapMarker());
  const particles = Array.from({ length: config.particleCount }, () => new MotionParticle());

  // Draw connections between nodes
  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = distance(nodes[i], nodes[j]);
        if (d < config.connectionDistance) {
          const alpha = (1 - d / config.connectionDistance) * 0.25;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (mouse.active) {
        const d = distance(nodes[i], mouse);
        if (d < config.mouseDistance) {
          const alpha = (1 - d / config.mouseDistance) * 0.35;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }
  }

  // Animation loop
  function animate() {
    frameCount++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw layers from back to front
    drawGrid();

    hexagons.forEach(h => {
      h.update();
      h.draw();
    });

    trajectories.forEach(t => {
      t.update();
      t.draw();
    });

    chains.forEach(c => {
      c.update();
      c.draw();
    });

    skeletons.forEach(s => {
      s.update();
      s.draw();
    });

    mocapMarkers.forEach(m => {
      m.update();
      m.draw();
    });

    drawConnections();

    nodes.forEach(n => {
      n.update();
      n.draw();
    });

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  // Event listeners
  window.addEventListener('resize', resize, { passive: true });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;

    clearTimeout(mouse.timer);
    mouse.timer = setTimeout(() => {
      mouse.active = false;
    }, 100);
  }, { passive: true });

  // Visibility check
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause when hidden
    }
  });

  // Reduced motion check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) {
    canvas.style.display = 'none';
    return;
  }

  // Initialize
  resize();
  animate();
})();
