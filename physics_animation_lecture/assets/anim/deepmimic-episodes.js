/* DeepMimic, slide "RSI and early termination" (tools/slides/02_20_deepmimic.py): where training episodes start and where they stop.
 *   <svg data-anim="deepmimic-episodes" viewBox="0 0 1740 326">
 * SCHEMATIC, no measured data. Top: the reference clip (a backflip, poses drawn by hand in deepmimic-0kit.js) laid out along its
 * phase, 0 to 1. Bottom: five training episodes at a time, one per row; a row runs to the right as time passes.
 *   blue bar = the character is still on the motion      red cross = it falls      grey bar = it lies on the ground
 * The thin strip under the clip and the brightness of the poses show which parts of the clip the episodes have visited so far.
 *   step 0  the default episode: every one starts at the first frame and runs for a fixed time (Peng et al. 2018, section 6:
 *           "a fixed initial state and fixed-length episodes"). The flight and the landing are never visited; most of the row is grey.
 *   step 1  reference state initialization: every episode starts at a random frame of the clip (section 6.1)
 *   step 2  early termination: an episode stops at the fall (section 6.2), and the row starts a new one
 *   step 3  later in training with both: the episodes stay on the clip to its end
 * Start frames and fall times are random numbers from A.rand: they illustrate the mechanism, they are not results. */
DeckAnim.register('deepmimic-episodes', function (el, A) {
  'use strict';
  var C = A.C, K = window.DeepMimicKit, i, k, n, b;
  var X0 = 320, X1 = 1660, XW = X1 - X0, GY = 128, S = 98, NP = 11, NL = 5, LY0 = 206, LP = 21, TRY = 142, NB = 70;
  var TC = 5.4, PLAY = 4.0, V = 1 / 3.2;                      // one cycle of the animation (s); rows start again after it; phase per second
  var BLUE = C.blue, GREY = '#6c6c6c';
  var X = function (p) { return X0 + XW * p; };
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.2em">' + s + '</tspan>'; };
  function txt(x, y, s, o) {
    o = o || {};
    var t = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || C.mid) }, o.parent || el);
    t.innerHTML = s;
    return t;
  }

  // ---------------------------------------------------------------- the clip
  txt(24, 50, 'Reference clip', { size: 24, weight: 700, fill: C.g });
  txt(24, 79, 'one backflip', {});
  A.el('line', { x1: X0 - 44, y1: GY + 1.5, x2: X1 + 40, y2: GY + 1.5, stroke: '#303030', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var figs = [], hl = [];
  for (k = 0; k < NP; k++) {
    var pz = K.flip(k / (NP - 1));
    figs.push(K.fig(el, C.g, 5)); figs[k].set(pz, X(k / (NP - 1)), GY, S);
    hl.push(K.fig(el, '#fff', 5)); hl[k].set(pz, X(k / (NP - 1)), GY, S); A.show(hl[k].g, 0);
  }
  // which part of the clip the episodes have visited
  txt(24, TRY + 11, 'visited in training', {});
  A.el('rect', { x: X0, y: TRY, width: XW, height: 9, rx: 4.5, fill: '#1e1e1e' }, el);
  var bins = [];
  for (b = 0; b < NB; b++) bins.push(A.el('rect', { x: (X0 + XW * b / NB).toFixed(1), y: TRY, width: (XW / NB + 0.6).toFixed(1), height: 9, fill: C.g }, el));
  txt(X0, 180, MI('ϕ') + ' = 0', {});
  txt(X(0.285), 180, 'take-off', { anchor: 'middle' });
  txt(X(0.5), 180, 'in the air', { anchor: 'middle' });
  txt(X(0.715), 180, 'landing', { anchor: 'middle' });
  txt(X1, 180, MI('ϕ') + ' = 1', { anchor: 'end' });

  // ---------------------------------------------------------------- the episodes
  txt(24, 224, 'Training episodes', { size: 24, weight: 700, fill: '#fff' });
  var MODE = ['fixed start, fixed length', 'random start (RSI)', 'RSI + early termination', 'both, later in training'], tag = [];
  for (k = 0; k < 4; k++) tag.push(txt(24, 251, MODE[k], { weight: 700, fill: '#fff' }));
  A.el('line', { x1: 30, y1: 269, x2: 56, y2: 269, stroke: BLUE, 'stroke-width': 9, 'stroke-linecap': 'round' }, el);
  txt(70, 276, 'on the motion', {});
  A.el('path', { d: 'M27 287L39 299M39 287L27 299', stroke: C.red, 'stroke-width': 3.5, 'stroke-linecap': 'round', fill: 'none' }, el);
  txt(50, 300, 'fall', {});
  var lgTail = A.el('g', {}, el);
  A.el('line', { x1: 106, y1: 293, x2: 132, y2: 293, stroke: GREY, 'stroke-width': 9, 'stroke-linecap': 'round' }, lgTail);
  txt(146, 300, 'on the ground', { parent: lgTail });
  var gl = A.el('g', {}, el), pool = [];
  for (i = 0; i < NL; i++) {
    var y = LY0 + LP * i, row = [];
    A.el('line', { x1: X0, y1: y, x2: X1, y2: y, stroke: '#1c1c1c', 'stroke-width': 9, 'stroke-linecap': 'round' }, el);
    for (n = 0; n < 3; n++) {
      var g = A.el('g', {}, gl), o = { g: g, y: y };
      o.link = A.el('line', { stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '3 6' }, g);
      o.tail = A.el('line', { y1: y, y2: y, stroke: GREY, 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      o.more = A.el('path', { d: 'M' + (X1 + 42) + ' ' + y + 'h.1M' + (X1 + 52) + ' ' + y + 'h.1M' + (X1 + 62) + ' ' + y + 'h.1', stroke: GREY, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      o.bar = A.el('line', { y1: y, y2: y, stroke: BLUE, 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      o.start = A.el('circle', { cy: y, r: 7.5, fill: '#fff', stroke: '#101010', 'stroke-width': 2 }, g);
      o.cross = A.el('path', { d: 'M-7 -7L7 7M7 -7L-7 7', stroke: C.red, 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, g);
      row.push(o);
    }
    pool.push(row);
  }
  el.appendChild(gl);

  /** with early termination a row holds several episodes: where the next one can start so that its bar stays clear of the earlier
   *  ones of that row. want = phase it will stay on the motion; u, v in [0, 1) pick the frame. -> [p0, d], or null: no room left */
  function room(out, want, u, v) {
    var iv = [], gaps = [], lo = 0, tot = 0, k, g, d;
    for (k = 0; k < out.length; k++) iv.push([out[k].p0 - 0.035, out[k].p0 + out[k].d + 0.045]);
    iv.sort(function (a, b) { return a[0] - b[0]; });
    for (k = 0; k <= iv.length; k++) {
      g = [lo, k < iv.length ? iv[k][0] : 0.94];
      if (g[1] - g[0] >= 0.09) { gaps.push(g); tot += g[1] - g[0]; }
      if (k < iv.length) lo = Math.max(lo, iv[k][1]);
    }
    if (!gaps.length) return null;
    u *= tot;                                                      // a frame drawn uniformly from the free part of the row
    for (k = 0; k < gaps.length - 1 && u > gaps[k][1] - gaps[k][0]; k++) u -= gaps[k][1] - gaps[k][0];
    g = gaps[k]; d = Math.min(want, g[1] - g[0]);
    return [g[0] + (g[1] - g[0] - d) * v, d];
  }
  /** the episodes of row i in cycle c of mode m: start time t0 (s), start phase p0, phase spent on the motion d, fall?, grey tail?
   *  The first episode of a row is the same in modes 1 and 2 (same start frame, same fall), so that click 2 only removes the grey. */
  function eps(m, c, i) {
    var r = A.rand(37 * c + 7 * i + 11), q = A.rand(1009 * m + 53 * c + 5 * i + 3), out = [], t0, p0, d, d1, dn, nx, end, j;
    if (m === 0) return [{ t0: 0, p0: 0, d: 0.2 + 0.13 * r(), fall: true, tail: true }];      // all fall around the take-off
    t0 = 0.16 * i;
    var slot = (2 * i + 3 * c) % NL, w = 0.9 / NL, jit = 0.07 * r();   // one start in each fifth of the clip, shuffled and shifted from cycle to cycle
    p0 = w * slot + 0.17 * ((0.618 * c + 0.3) % 1) + jit;
    d1 = slot === NL - 1 ? 1 : w - jit + 0.08 + 0.05 * r();        // long enough to reach the next start: one cycle visits the whole clip
    for (j = 0; j < 3; j++) {
      d = m === 3 ? (j ? 1 : 0.45 + 0.75 * q()) : (j ? dn : d1);
      end = p0 + d >= 1;
      if (end) d = 1 - p0;
      out.push({ t0: t0, p0: p0, d: d, fall: !end, tail: m === 1 });
      if (m === 1) break;
      t0 += d / V + 0.3;
      if (m === 3) {
        if (end || t0 > 1.5) break;
        var lo = Math.max(0, 1 - (4.5 - t0) * V);
        p0 = lo + (0.9 - lo) * q();
      } else {
        if (t0 > PLAY - 0.5) break;
        nx = room(out, 0.08 + 0.18 * q(), q(), q());              // the next episode of this row: another random frame, clear of the earlier ones
        if (!nx) break;
        p0 = nx[0]; dn = nx[1];
      }
    }
    return out;
  }
  /** which bins of the clip have been visited up to time tau of cycle c */
  function cover(m, c, tau) {
    var cv = [], cc, ii, jj, bb, e, pr, b0, b1, E;
    for (bb = 0; bb < NB; bb++) cv.push(m >= 2 ? 1 : 0);
    if (m >= 2) return cv;
    if (m === 1) for (bb = 0; bb < NB * 0.2; bb++) cv[bb] = 1;     // what the default episodes had reached
    for (cc = Math.max(0, c - 24); cc <= c; cc++) for (ii = 0; ii < NL; ii++) {
      E = eps(m, cc, ii);
      for (jj = 0; jj < E.length; jj++) {
        e = E[jj]; pr = cc < c ? e.d : A.clamp((tau - e.t0) * V, 0, e.d);
        if (pr <= 0) continue;
        b0 = Math.floor(e.p0 * NB); b1 = Math.min(NB - 1, Math.floor((e.p0 + pr) * NB - 1e-6));
        for (bb = b0; bb <= b1; bb++) cv[bb] = 1;
      }
    }
    return cv;
  }

  return function draw(f) {
    var m = Math.min(f.step, 3), c = Math.floor(f.ts / TC), tau = f.ts - c * TC, hi = [];
    A.show(gl, A.ramp(tau, 0, 0.3) * (1 - A.ramp(tau, TC - 0.5, TC)));
    A.show(lgTail, m <= 1 ? 1 : 0);
    for (k = 0; k < 4; k++) A.show(tag[k], k === m ? 1 : 0);
    var cv = cover(m, c, tau);
    for (b = 0; b < NB; b++) A.show(bins[b], cv[b]);
    for (k = 0; k < NP; k++) { hi.push(0); A.show(figs[k].g, cv[Math.min(NB - 1, Math.floor(k / (NP - 1) * NB))] ? 1 : 0.24); }
    for (i = 0; i < NL; i++) {
      var E = eps(m, c, i);
      for (n = 0; n < 3; n++) {
        var o = pool[i][n], e = E[n], age = e ? tau - e.t0 : -1;
        if (age < 0) { A.show(o.g, 0); continue; }
        var run = age * V, pr = Math.min(run, e.d), done = run >= e.d, xs = X(e.p0), xe = X(e.p0 + pr);
        A.show(o.g, (E[n + 1] && tau >= E[n + 1].t0) ? 0.34 : 1);                    // an episode that is over fades behind the next one
        A.set(o.bar, { x1: xs.toFixed(1), x2: xe.toFixed(1) });
        A.set(o.start, { cx: xs.toFixed(1) });
        A.set(o.cross, { transform: 'translate(' + X(e.p0 + e.d).toFixed(1) + ' ' + o.y + ')' });
        A.show(o.cross, done && e.fall ? 1 : 0);
        var tl = done && e.fall && e.tail, xt = Math.min(X(e.p0 + run), X1 + 30);
        A.set(o.tail, { x1: (X(e.p0 + e.d) + 16).toFixed(1), x2: Math.max(X(e.p0 + e.d) + 16, xt).toFixed(1) });
        A.show(o.tail, tl && xt > X(e.p0 + e.d) + 16 ? 1 : 0);                                 // the same grey as the legend, in both modes that have it
        A.show(o.more, tl && xt >= X1 + 30 ? 1 : 0);
        A.set(o.link, { x1: xs.toFixed(1), x2: xs.toFixed(1), y1: 188, y2: o.y - 9 });
        A.show(o.link, m >= 1 ? 0.75 * (1 - A.ramp(age, 0.25, 1.1)) : 0);
        if (m >= 1) { k = Math.round(e.p0 * (NP - 1)); hi[k] = Math.max(hi[k], 1 - A.ramp(age, 0.15, 0.8)); }
      }
    }
    for (k = 0; k < NP; k++) A.show(hl[k].g, hi[k]);
  };
});
