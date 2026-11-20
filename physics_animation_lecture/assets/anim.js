/*! Animated figures for the deck (step-aware).
 *
 * Markup:   <svg data-anim="pd-track" viewBox="0 0 860 550" style="..."></svg>     any element; static parts may come from Python
 * Script:   assets/anim/pd-track.js   (every file in assets/anim/ is loaded by the build)
 *
 *   DeckAnim.register('pd-track', function (el, A) {
 *     // one-time set-up: create nodes with A.el('path', {stroke: A.C.g, ...}, el)
 *     return function draw(f) { ... };          // called on every animation frame while the slide is shown
 *   });
 *
 * draw(f):  f.t      seconds since the slide was entered (restarts every time the slide is shown)
 *           f.step   build step the slide is at: 0 before the first click, then 1, 2, ... (the slide's .fx elements define the steps)
 *           f.ts     seconds since that build step was entered  -> "this click starts this motion"
 *           f.steps  number of build steps on the slide
 * draw must be a PURE function of (t, step, ts): same input, same picture; no state carried between calls, no Math.random
 * (use A.rand(seed)). Then every frame can be reproduced for review:
 *           index.html?animt=2.5#7.3   slide 7 at build step 3, frozen at t = ts = 2.5 s
 *           index.html?still#7.99      every figure frozen at its still time, all steps on
 * data-anim-still="SECONDS" on the element is that still time (default 4): the frame used for overview, print, PDF and for
 * figures on slides that are not being shown. Pick a moment where the figure is complete and readable.
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var q = new URLSearchParams(location.search);
  var FROZEN = q.has('animt') ? parseFloat(q.get('animt')) : ((q.has('still') || q.has('audit') || q.has('print')) ? 'still' : null);
  var defs = {}, figs = [];
  var cur = null, curStep = 0, nsteps = 0, t0 = 0, ts0 = 0, raf = 0;

  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  var A = {
    C: { g: '#76B900', gbr: '#8fd400', amber: '#f5b301', blue: '#4fc3f7', violet: '#c58cff', red: '#ff6b5e', white: '#fff', mid: '#b8b8b8', mute: '#7d7d7d',
         line: '#4a4a4a', grid: '#262626', card: '#101010', body: '#8a8f96' },
    FONT: "'NVIDIA Sans', Arial, sans-serif",
    MATH: "KaTeX_Math, 'Times New Roman', serif",
    HALO: 'paint-order:stroke;stroke:#101010;stroke-width:7px;stroke-linejoin:round',
    /** create an SVG node: A.el('circle', {cx: 10, cy: 10, r: 4, fill: A.C.g}, parent) */
    el: function (tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      if (attrs) A.set(n, attrs);
      if (parent) parent.appendChild(n);
      return n;
    },
    /** set attributes; `text` sets textContent, `html` innerHTML */
    set: function (n, attrs) {
      for (var k in attrs) {
        if (k === 'text') n.textContent = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else n.setAttribute(k, attrs[k]);
      }
      return n;
    },
    /** text node in the deck font: A.text(parent, x, y, 'label', {size: 21, fill: A.C.g, anchor: 'middle', weight: 700, halo: true}) */
    text: function (parent, x, y, s, o) {
      o = o || {};
      return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', text: s,
        style: 'font:' + (o.weight || 700) + ' ' + (o.size || 21) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + ';' + (o.halo === false ? '' : A.HALO) }, parent);
    },
    clamp: clamp,
    lerp: function (a, b, u) { return a + (b - a) * u; },
    /** 0 before a, 1 after b, linear in between */
    ramp: function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); },
    /** smooth 0..1 easing of a 0..1 value */
    ease: function (u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); },
    /** t wrapped into [0, period) */
    loop: function (t, period) { return ((t % period) + period) % period; },
    /** deterministic random generator: var r = A.rand(7); r() -> [0, 1) */
    rand: function (seed) {
      var a = (seed | 0) + 0x6D2B79F5;
      return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    },
    /** standard normal sample from a generator made by A.rand */
    gauss: function (r) { var u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307179586 * v); },
    /** 'M x y L x y ...' from [[x, y], ...] */
    path: function (pts) { var s = ''; for (var i = 0; i < pts.length; i++) s += (i ? 'L' : 'M') + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1) + ' '; return s; },
    /** show / hide with opacity (0..1) */
    show: function (n, o) { n.style.opacity = o; }
  };

  function slideOf(el) { return el.closest('section.slide'); }
  function stepCount(slide) {
    var keys = {}, n = 0;
    Array.prototype.forEach.call(slide.querySelectorAll('.fx[data-step]'), function (f) { var k = f.getAttribute('data-step'); if (!keys[k]) { keys[k] = 1; n++; } });
    return n;
  }
  function setup(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-anim]'), function (el) {
      if (el._anim) return;
      el._anim = true;
      var name = el.getAttribute('data-anim'), draw = null;
      if (!defs[name]) { el.setAttribute('data-anim-error', 'no script registered for "' + name + '"'); console.error('DeckAnim: no script for', name); return; }
      try { draw = defs[name](el, A); } catch (e) { el.setAttribute('data-anim-error', String(e && e.message || e)); console.error('DeckAnim setup ' + name, e); return; }
      if (typeof draw !== 'function') { el.setAttribute('data-anim-error', 'register() callback must return draw(f)'); return; }
      var s = slideOf(el);
      figs.push({ el: el, name: name, draw: draw, slide: s, still: parseFloat(el.getAttribute('data-anim-still') || '4'), nsteps: s ? stepCount(s) : 0 });
    });
  }
  function drawFig(f, frame) {
    try { f.draw(frame); }
    catch (e) { if (!f.err) { f.err = true; f.el.setAttribute('data-anim-error', String(e && e.message || e)); console.error('DeckAnim draw ' + f.name, e); } }
  }
  function stillOf(f) { return { t: f.still, step: f.nsteps, ts: f.still, steps: f.nsteps }; }
  function now() { return performance.now() / 1000; }
  function tick() {
    raf = 0;
    if (!cur || document.hidden) return;
    var t = now(), fr = { t: t - t0, step: curStep, ts: t - ts0, steps: nsteps }, any = false;
    figs.forEach(function (f) { if (f.slide === cur) { any = true; drawFig(f, fr); } });
    if (any) raf = requestAnimationFrame(tick);
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){if(raf) cancelAnimationFrame(raf);raf=0;}
    else if(cur && FROZEN===null && !raf) raf=requestAnimationFrame(tick);
  });
  window.DeckAnim = {
    A: A,
    register: function (name, fn) { defs[name] = fn; },
    /** deck.js calls this whenever the shown slide or its build step changes */
    sync: function (slide, step, steps) {
      setup(FROZEN !== null ? document : slide);
      if (FROZEN !== null) {
        figs.forEach(function (f) {
          var T = FROZEN === 'still' ? f.still : FROZEN;
          drawFig(f, f.slide === slide ? { t: T, step: step, ts: T, steps: steps } : stillOf(f));
        });
        cur = slide; return;
      }
      var t = now();
      if (slide !== cur) {
        figs.forEach(function (f) { if (f.slide === cur) drawFig(f, stillOf(f)); });
        cur = slide; t0 = t; ts0 = t; curStep = step;
      } else if (step !== curStep) { curStep = step; ts0 = t; }
      nsteps = steps;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    /** print / PDF: every figure at its still frame */
    stillAll: function () { setup(); figs.forEach(function (f) { drawFig(f, stillOf(f)); }); },
    /** for tests: names of figures whose script failed */
    errors: function () { return Array.prototype.map.call(document.querySelectorAll('[data-anim-error]'), function (e) { return e.getAttribute('data-anim') + ': ' + e.getAttribute('data-anim-error'); }); }
  };
})();
