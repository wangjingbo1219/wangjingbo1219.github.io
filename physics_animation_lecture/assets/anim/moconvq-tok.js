/* MoConVQ, slide "how it works": the tokenizer, explained in three clicks.   <svg data-anim="moconvq-tok" viewBox="0 0 1172 340">
 * A SCHEMATIC of Sec. 3.1-3.2 and Algorithm 1 of the paper (stick figure, a latent space drawn in 2-D, a handful of codes): no measured values.
 * The only numbers are the paper's: 24 frames = 1.2 s at 20 fps -> 6 latent vectors of 768 numbers, codebooks of 512 codes (Sec. 5.1).
 *   step 0   encoder       the 24 frames are read four at a time; each group becomes one latent vector = one point of a continuous space
 *                          (a simplification: the 1-D convolutions of the real encoder see more than their own four frames)
 *   step 1   quantize      every vector snaps to its nearest code; the index of that code is the token (one coloured chip per vector)
 *   step 2   residual VQ   the view zooms in on one vector at a time (the other vectors and codes step back): the next codebook quantizes
 *                          what is left, then the next one; the estimate closes in on the vector, and each token becomes a stack of
 *                          indices, coarse to fine
 *   step 3+  at rest       the finished picture (also the still frame)
 * In a step the six columns are worked through once, left to right, then the pass repeats after a rest; draw() is a pure function of (step, ts).
 */
DeckAnim.register('moconvq-tok', function (el, A) {
  'use strict';
  var C = A.C, NK = 6, RED = '#ff6b5e';
  var COLS = ['#4fc3f7', '#c58cff', '#f5b301', '#76B900', '#ffffff', '#d6e86b'];          // colour of the code that latent k snaps to
  var SUBC = ['#9bdcf9', '#f5b301', '#c58cff', '#d6e86b', '#8fd400', '#ffffff', '#4fc3f7'];   // colours of the residual codes
  function txt(p, x, y, s, o) {
    o = o || {};
    return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', text: s,
      style: 'font:' + (o.weight || 700) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.halo ? ';' + A.HALO : '') }, p);
  }
  var lerp = A.lerp, ramp = A.ramp, ease = A.ease;

  // ------------------------------------------------------------------ geometry
  var CX0 = 196, PITCH = 66, CW = 58;                       // six columns: one per 0.2 s
  var YA = 14, HA = 88, YT = 108, YE = 126, HE = 30, YB = 168, YC = 244, YD = 286;
  var PX = 640, PY = 12, PW = 520, PH = 316, OX = PX + 20, OY = PY + 42;     // the latent plane; (OX, OY) is the origin of plane coordinates
  var CODES = [[52, 44], [168, 28], [292, 50], [414, 34], [108, 124], [232, 112], [352, 130], [446, 116], [58, 196], [182, 190], [302, 200], [424, 194]];
  var V = [[138, 102], [150, 60], [262, 132], [334, 100], [414, 140], [312, 170]];       // the six latent vectors
  var B1 = [[27, 8], [19, 19], [-13, 20], [-25, 12], [-23, -8], [-10, -24], [19, -24]];   // residual codebook 1 (offsets)
  var B2 = [[10, 1], [4, 11], [-5, 11], [-9, 2], [-8, -6], [1, -9], [6, -9]];            // residual codebook 2
  function near(p, S) { var b = 0, bd = 1e9; for (var i = 0; i < S.length; i++) { var d = Math.hypot(S[i][0] - p[0], S[i][1] - p[1]); if (d < bd) { bd = d; b = i; } } return b; }
  var Q = V.map(function (v) {                              // Algorithm 1 on the sketch: nearest code, then the residue again, twice
    var order = CODES.map(function (c, i) { return [Math.hypot(c[0] - v[0], c[1] - v[1]), i]; }).sort(function (a, b) { return a[0] - b[0]; });
    var c = order[0][1], z0 = CODES[c], r1 = [v[0] - z0[0], v[1] - z0[1]], i1 = near(r1, B1);
    var e1 = [z0[0] + B1[i1][0], z0[1] + B1[i1][1]], i2 = near([v[0] - e1[0], v[1] - e1[1]], B2), e2 = [e1[0] + B2[i2][0], e1[1] + B2[i2][1]];
    return { c: c, cand: [order[0][1], order[1][1], order[2][1]], z0: z0, e1: e1, e2: e2, i1: i1, i2: i2 };
  });
  var colx = function (k) { return CX0 + k * PITCH; }, X = function (p) { return OX + p[0]; }, Y = function (p) { return OY + p[1]; };

  // ------------------------------------------------------------------ left panel: frames -> vectors -> tokens -> residual stacks
  txt(el, 22, 52, '24 frames'); txt(el, 22, 78, '1.2 s at 20 fps', { weight: 500, fill: C.mid });
  txt(el, 22, 196, '6 vectors'); txt(el, 22, 222, '768 numbers each', { weight: 500, fill: C.mid });
  var gC = A.el('g', {}, el), gD = A.el('g', {}, el);
  txt(gC, 22, 258, '6 tokens'); txt(gC, 22, 282, '1 of 512 codes', { weight: 500, fill: C.mid });
  txt(gD, 22, 312, 'residual layers', { weight: 500, fill: C.mid });
  A.el('rect', { x: CX0, y: YE, width: 5 * PITCH + CW, height: HE, rx: 9, fill: '#0f1a06', stroke: C.g, 'stroke-width': 2 }, el);
  txt(el, CX0 + (5 * PITCH + CW) / 2, YE + 22, 'encoder', { anchor: 'middle' });
  var cell = [], fig = [], head = [], tick = [], vec = [], chip = [], sub = [], k, i;
  for (k = 0; k < NK; k++) {
    cell.push(A.el('rect', { x: colx(k), y: YA, width: CW, height: HA, rx: 9, fill: '#0c0c0c', stroke: '#303030', 'stroke-width': 2 }, el));
    var fg = A.el('g', { fill: 'none', stroke: '#e8e8e8', 'stroke-width': 4.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    fig.push({ g: fg, body: A.el('path', {}, fg) }); head.push(A.el('circle', { r: 6.8, fill: '#e8e8e8', stroke: 'none' }, fg));
    var tk = []; for (i = 0; i < 4; i++) tk.push(A.el('rect', { x: colx(k) + i * 15.5, y: YT, width: 11.5, height: 8, rx: 2.5 }, el)); tick.push(tk);
    var vg = A.el('g', {}, el), r = A.rand(11 + k);
    for (i = 0; i < 5; i++) { var gl = Math.round(70 + 170 * r()); A.el('rect', { x: colx(k) + 18, y: YB + i * 13, width: 22, height: 10, rx: 2.5, fill: 'rgb(' + gl + ',' + gl + ',' + gl + ')' }, vg); }
    vec.push(vg);
    chip.push(A.el('rect', { x: colx(k) + 6, y: YC, width: 46, height: 34, rx: 8, fill: COLS[k], stroke: '#fff', 'stroke-width': 0 }, el));
    var sg = A.el('g', {}, el), s0 = A.el('rect', { x: colx(k) + 6, y: YD, width: 46, height: 9, rx: 3.5, fill: SUBC[Q[k].i1] }, sg);
    var s1 = A.el('rect', { x: colx(k) + 6, y: YD + 13, width: 46, height: 9, rx: 3.5, fill: SUBC[Q[k].i2] }, sg), sd = A.el('g', { fill: '#8a8a8a' }, sg);
    for (i = -1; i <= 1; i++) A.el('circle', { cx: colx(k) + 29 + i * 9, cy: YD + 34, r: 2.4 }, sd);
    sub.push([s0, s1, sd]);
  }
  // a walking stick figure, in profile: frame n of the clip (20 fps, one stride cycle in the 24 frames)
  function pose(k, n) {
    var S = 1.12, TH = 15 * S, SH = 15 * S, TO = 22 * S, AR = 13 * S, ph = 2 * Math.PI * n / 24 + 0.6;
    var x = colx(k) + CW / 2 - 2, y = YA + HA - 9, hy = y - TH - SH + 1 + 1.3 * Math.abs(Math.cos(ph)), d = '', j;
    for (j = 0; j < 2; j++) {
      var p = ph + j * Math.PI, th = 0.5 * Math.sin(p), kn = 0.1 + 0.8 * Math.max(0, Math.cos(p));
      var kx = x + TH * Math.sin(th), ky = hy + TH * Math.cos(th), fx = kx + SH * Math.sin(th - kn), fy = Math.min(y, ky + SH * Math.cos(th - kn));
      d += 'M' + x.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'L' + fx.toFixed(1) + ' ' + fy.toFixed(1);
      var up = -0.45 * Math.sin(p), sx = x + 1.5, sy = hy - TO + 2, ex = sx + AR * Math.sin(up), ey = sy + AR * Math.cos(up);
      d += 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + (ex + AR * Math.sin(up + 0.5)).toFixed(1) + ' ' + (ey + AR * Math.cos(up + 0.5)).toFixed(1);
    }
    d += 'M' + x.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + (x + 1.5).toFixed(1) + ' ' + (hy - TO).toFixed(1);
    A.set(fig[k].body, { d: d }); A.set(head[k], { cx: (x + 2.5).toFixed(1), cy: (hy - TO - 8.5).toFixed(1) });
  }

  // ------------------------------------------------------------------ right panel: the latent space
  A.el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 14, fill: '#0b0b0b', stroke: '#2a2a2a', 'stroke-width': 2 }, el);
  txt(el, PX + 20, PY + PH - 14, 'latent space in 2-D', { weight: 500, fill: C.mid });
  var gCB = A.el('g', {}, el);
  A.el('circle', { cx: PX + PW - 256, cy: PY + PH - 21, r: 6, fill: '#1c1c1c', stroke: '#8a8a8a', 'stroke-width': 2 }, gCB);
  txt(gCB, PX + PW - 20, PY + PH - 14, '512 codes, a few drawn', { weight: 500, fill: C.mid, anchor: 'end' });
  // everything that lives IN the latent space is drawn in a clipped group that can zoom in on one vector (stage 2); strokes keep their width
  var cid = 'moconvq-tok-clip';
  A.el('rect', { x: PX + 3, y: PY + 46, width: PW - 6, height: PH - 86 }, A.el('clipPath', { id: cid }, A.el('defs', {}, el)));
  var gZ = A.el('g', {}, A.el('g', { 'clip-path': 'url(#' + cid + ')' }, el)), NS = 'non-scaling-stroke', ZM = 2.4, FC = [240, 113];
  var seg = [], code = [], ring = [], mk = [];
  for (k = 1; k < NK; k++) seg[k] = A.el('line', { x1: X(V[k - 1]), y1: Y(V[k - 1]), x2: X(V[k]), y2: Y(V[k]), stroke: '#4c4c4c', 'stroke-width': 2, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round', 'vector-effect': NS }, gZ);
  for (i = 0; i < CODES.length; i++) code.push(A.el('circle', { cx: X(CODES[i]), cy: Y(CODES[i]), 'stroke-width': 2, 'vector-effect': NS }, gZ));
  var cand = [0, 1, 2].map(function () { return A.el('line', { 'stroke-linecap': 'round', 'vector-effect': NS }, gZ); });
  var cons1 = B1.map(function () { return A.el('circle', { 'stroke-width': 1.8, 'vector-effect': NS }, gZ); });
  var cons2 = B2.map(function () { return A.el('circle', { 'stroke-width': 1.6, 'vector-effect': NS }, gZ); });
  var res = A.el('line', { stroke: RED, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'vector-effect': NS }, gZ);
  for (k = 0; k < NK; k++) ring.push(A.el('circle', { cx: X(V[k]), cy: Y(V[k]), fill: 'none', 'vector-effect': NS }, gZ));
  for (k = 0; k < NK; k++) mk.push(A.el('circle', { fill: COLS[k], stroke: '#0b0b0b', 'stroke-width': 1.5, 'vector-effect': NS }, gZ));
  var tr = A.el('circle', { r: 4.5, fill: '#fff' }, el);
  var lbCb = txt(el, PX + 20, PY + 34, '');                                 // stage 2: which codebook is at work
  var FOC = Q.map(function (q_, j_) { return [(V[j_][0] + q_.z0[0]) / 2, (V[j_][1] + q_.z0[1]) / 2]; });      // where the view looks: between a vector and its code
  var gSnap = A.el('g', {}, el);                                             // legend of stage 1: a latent, a line, a code
  A.el('circle', { cx: PX + 31, cy: PY + 27, r: 8, fill: 'none', stroke: '#fff', 'stroke-width': 2.5 }, gSnap);
  A.el('line', { x1: PX + 41, y1: PY + 27, x2: PX + 66, y2: PY + 27, stroke: '#bdbdbd', 'stroke-width': 2.5 }, gSnap);
  A.el('circle', { cx: PX + 73, cy: PY + 27, r: 6.2, fill: C.g, stroke: '#fff', 'stroke-width': 2 }, gSnap);
  txt(gSnap, PX + 90, PY + 34, 'snaps to the nearest code');
  var gBar = A.el('g', {}, el);
  txt(gBar, PX + PW - 176, PY + 34, 'what is left', { fill: RED, anchor: 'end' });
  A.el('rect', { x: PX + PW - 164, y: PY + 20, width: 144, height: 12, rx: 6, fill: '#1d1d1d' }, gBar);
  var bar = A.el('rect', { x: PX + PW - 164, y: PY + 20, height: 12, rx: 6, fill: RED }, gBar);

  // ------------------------------------------------------------------ clocks: one pass over the six columns per stage, then repeats
  var D = [1.0, 1.15, 2.6], LEAD = [0.25, 0.7, 0.7], REST = 1.8;
  function prog(st, idx, ts) {
    var p = { before: st < idx, cur: st === idx, after: st > idx, k: -1, w: 0, nd: 0, replay: false };
    if (p.before) return p;
    if (p.after) { p.nd = NK; return p; }
    var d = D[idx], tt = ts - LEAD[idx];
    if (tt < 0) return p;
    if (tt < NK * d) { p.k = Math.min(NK - 1, Math.floor(tt / d)); p.w = tt / d - p.k; p.nd = p.k; return p; }
    p.nd = NK; p.replay = true;
    var tl = A.loop(tt - NK * d, NK * d + REST);
    if (tl >= REST) { p.k = Math.min(NK - 1, Math.floor((tl - REST) / d)); p.w = (tl - REST) / d - p.k; }
    return p;
  }

  return function draw(f) {
    var st = f.step, P0 = prog(st, 0, f.ts), P1 = prog(st, 1, f.ts), P2 = prog(st, 2, f.ts);
    var trv = null, j, n, a, w, p, q;                                       // trv: the travelling dot [from, to, u]
    // ---- the view of the latent space: whole plane, or (stage 2) zoomed in on the vector that is being refined
    var Z = 1, fc = FC;
    if (P2.cur) {
      if (P2.k < 0 && !P2.replay) { a = ease(ramp(f.ts, 0, LEAD[2])); Z = lerp(1, ZM, a); fc = [lerp(FC[0], FOC[0][0], a), lerp(FC[1], FOC[0][1], a)]; }
      else {
        Z = ZM;
        var kk = P2.k < 0 ? NK - 1 : P2.k, from = (P2.k <= 0 && !P2.replay) ? FOC[0] : FOC[(kk + NK - 1) % NK];
        a = P2.k < 0 ? 1 : ease(ramp(P2.w, 0, 0.14));
        fc = [lerp(from[0], FOC[kk][0], a), lerp(from[1], FOC[kk][1], a)];
      }
    }
    A.set(gZ, { transform: 'translate(' + (OX + FC[0]) + ' ' + (OY + FC[1]) + ') scale(' + Z.toFixed(3) + ') translate(' + (-(OX + fc[0])).toFixed(2) + ' ' + (-(OY + fc[1])).toFixed(2) + ')' });
    var RS = 1 / Math.pow(Z, 0.6);                                          // dots grow less than the distances between them
    // stage 2: the view is on ONE latent (foc); the rest of the plane steps back as the view zooms in, and hands over while the view pans on
    var foc = -1, was = -1, pa = 1, DIM = 1 - 0.68 * (Z - 1) / (ZM - 1);
    if (P2.cur) {
      foc = P2.k < 0 ? (P2.replay ? NK - 1 : 0) : P2.k;
      if (P2.k > 0 || (P2.k === 0 && P2.replay)) { was = (foc + NK - 1) % NK; pa = ease(ramp(P2.w, 0, 0.14)); }
    }
    var vis = function (jj) { return foc < 0 ? 1 : (jj === foc ? lerp(DIM, 1, pa) : (jj === was ? lerp(1, DIM, pa) : DIM)); };
    A.show(gC, P1.before ? 0 : (P1.cur ? ramp(f.ts, 0, 0.5) : 1));
    A.show(gD, P2.before ? 0 : (P2.cur ? ramp(f.ts, 0, 0.5) : 1));
    A.show(gCB, P1.before ? 0 : (P1.cur ? ramp(f.ts, 0, 0.5) : 1));
    for (j = 0; j < NK; j++) {
      // ---- stage 0: frames -> vector -> a point of the plane
      var a0 = P0.cur && P0.k === j, reached = !P0.cur || j < P0.nd || a0;
      n = a0 ? Math.min(3, Math.floor(P0.w / 0.14)) : 3;
      pose(j, 4 * j + n);
      A.show(fig[j].g, reached ? 1 : 0.34);
      A.set(cell[j], { stroke: a0 ? C.g : '#303030', 'stroke-width': a0 ? 3 : 2 });
      for (i = 0; i < 4; i++) A.set(tick[j][i], { fill: !reached ? '#262626' : (a0 ? (i <= n ? C.g : '#262626') : '#6f6f6f') });
      var hasV = !P0.cur || j < P0.nd || (a0 && P0.w >= 0.58);
      A.show(vec[j], !hasV ? 0 : (a0 && !P0.replay ? ramp(P0.w, 0.58, 0.7) : 1));
      var hasR = !P0.cur || j < P0.nd || (a0 && P0.w >= 0.84);
      if (a0 && P0.w >= 0.62 && P0.w < 0.86) trv = [[colx(j) + 29, YB + 31], [X(V[j]), Y(V[j])], ramp(P0.w, 0.62, 0.86)];
      // ---- stage 1: snap to the nearest code -> token
      var a1 = P1.cur && P1.k === j, known = P1.after || (P1.cur && j < P1.nd) || (a1 && P1.w >= 0.36);
      var hasChip = P1.after || (P1.cur && j < P1.nd) || (a1 && P1.w >= 0.76);
      A.show(chip[j], !hasChip ? 0 : (a1 && !P1.replay ? ramp(P1.w, 0.76, 0.86) : 1));
      A.set(chip[j], { 'stroke-width': (a1 && P1.w >= 0.76) ? 3 : 0 });
      if (a1 && P1.w >= 0.6 && P1.w < 0.78) trv = [[X(Q[j].z0), Y(Q[j].z0)], [colx(j) + 29, YC + 17], ramp(P1.w, 0.6, 0.78)];
      // ---- stage 2: the residual layers
      var a2 = P2.cur && P2.k === j;
      w = P2.w;
      A.show(sub[j][0], P2.after || (P2.cur && j < P2.nd) || (a2 && w >= 0.48) ? 1 : 0);
      A.show(sub[j][1], P2.after || (P2.cur && j < P2.nd) || (a2 && w >= 0.8) ? 1 : 0);
      A.show(sub[j][2], P2.after || (P2.cur && j < P2.nd) || (a2 && w >= 0.8) ? 1 : 0);
      // ---- the marker of this latent: its current quantized estimate
      var mo = 0;
      p = Q[j].z0;
      if (P2.after || (P2.cur && j < P2.nd && !a2)) { mo = 1; p = Q[j].e2; }
      else if (a2) {
        mo = 1;
        if (w < 0.48) { a = ease(ramp(w, 0.34, 0.48)); p = [lerp(Q[j].z0[0], Q[j].e1[0], a), lerp(Q[j].z0[1], Q[j].e1[1], a)]; }
        else { a = ease(ramp(w, 0.66, 0.8)); p = [lerp(Q[j].e1[0], Q[j].e2[0], a), lerp(Q[j].e1[1], Q[j].e2[1], a)]; }
      }
      else if (P2.cur) mo = 1;
      else if (a1) { mo = ramp(P1.w, 0.3, 0.4); a = ease(ramp(P1.w, 0.42, 0.6)); p = [lerp(V[j][0], Q[j].z0[0], a), lerp(V[j][1], Q[j].z0[1], a)]; }
      else if (known) mo = 1;
      A.set(mk[j], { cx: X(p).toFixed(1), cy: Y(p).toFixed(1), r: (6.2 * RS).toFixed(2) }); A.show(mk[j], mo * vis(j));
      // ---- the latent itself: a ring
      var act = a0 || a1 || a2;
      A.set(ring[j], { r: ((act ? 10 : 8) * RS).toFixed(2), stroke: act ? '#fff' : '#9a9a9a', 'stroke-width': act ? 3 : 2 });
      A.show(ring[j], hasR ? vis(j) : 0);
      if (j) A.show(seg[j], hasR ? 1 : 0);
      if (a2) q = { j: j, p: p };
    }
    // ---- codes: grey until a latent has snapped to them
    for (i = 0; i < CODES.length; i++) {
      var col = null, cv = foc < 0 ? 1 : DIM;
      for (j = 0; j < NK; j++) if (Q[j].c === i) {
        cv = Math.max(cv, vis(j));
        if (P1.after || (P1.cur && (j < P1.nd || (P1.k === j && P1.w >= 0.36)))) col = COLS[j];
      }
      A.set(code[i], { fill: col || '#1c1c1c', stroke: col ? '#fff' : '#8a8a8a', r: (6 * RS).toFixed(2) });
      A.show(code[i], (P1.before ? 0 : (P1.cur ? ramp(f.ts, 0, 0.5) : (P2.after ? 0.75 : 1))) * cv);
    }
    // ---- stage 1, active latent: lines to the three nearest codes, the shortest one wins
    var k1 = P1.cur ? P1.k : -1;
    for (i = 0; i < 3; i++) {
      if (k1 < 0) { A.show(cand[i], 0); continue; }
      var cc = CODES[Q[k1].cand[i]], win = i === 0 && P1.w >= 0.36;
      A.set(cand[i], { x1: X(V[k1]), y1: Y(V[k1]), x2: X(cc), y2: Y(cc), stroke: win ? COLS[k1] : '#bdbdbd', 'stroke-width': win ? 3.4 : 2, 'stroke-dasharray': i ? '4 6' : 'none' });
      A.show(cand[i], ramp(P1.w, 0.05, 0.16) * (i ? 1 - ramp(P1.w, 0.3, 0.42) : 1 - ramp(P1.w, 0.86, 0.98)));
    }
    A.show(gSnap, P1.before || P2.cur ? 0 : (P1.cur ? ramp(f.ts, 0, 0.5) : 1));
    // ---- stage 2, active latent: what is left, and the next codebooks around the current estimate
    var k2 = P2.cur ? P2.k : -1;
    w = P2.w;
    for (i = 0; i < B1.length; i++) {
      if (k2 < 0) { A.show(cons1[i], 0); continue; }
      var hit1 = i === Q[k2].i1 && w >= 0.3;
      A.set(cons1[i], { cx: X(Q[k2].z0) + B1[i][0], cy: Y(Q[k2].z0) + B1[i][1], r: (4.4 * RS).toFixed(2), fill: hit1 ? SUBC[i] : '#1c1c1c', stroke: hit1 ? '#fff' : '#a0a0a0' });
      A.show(cons1[i], ramp(w, 0.12, 0.24) * (1 - ramp(w, 0.5, 0.58)));
    }
    for (i = 0; i < B2.length; i++) {
      if (k2 < 0) { A.show(cons2[i], 0); continue; }
      var hit2 = i === Q[k2].i2 && w >= 0.62;
      A.set(cons2[i], { cx: X(Q[k2].e1) + B2[i][0], cy: Y(Q[k2].e1) + B2[i][1], r: (3.4 * RS).toFixed(2), fill: hit2 ? SUBC[i] : '#1c1c1c', stroke: hit2 ? '#fff' : '#a0a0a0' });
      A.show(cons2[i], ramp(w, 0.5, 0.6) * (1 - ramp(w, 0.84, 0.94)));
    }
    if (k2 >= 0 && q) {
      var len = Math.hypot(V[k2][0] - q.p[0], V[k2][1] - q.p[1]), fade = ramp(w, 0.02, 0.12) * (1 - ramp(w, 0.9, 1));
      A.set(res, { x1: X(q.p).toFixed(1), y1: Y(q.p).toFixed(1), x2: X(V[k2]), y2: Y(V[k2]) }); A.show(res, fade);
      A.set(bar, { width: Math.max(0, Math.min(144, 3.5 * len)).toFixed(1) }); A.show(gBar, Math.min(1, ramp(f.ts, 0, 0.5)));
      A.show(bar, fade);
    } else { A.show(res, 0); A.show(bar, 0); A.show(gBar, P2.cur ? Math.min(1, ramp(f.ts, 0, 0.5)) * 0.45 : 0); }
    if (k2 >= 0) { A.set(lbCb, { text: w < 0.12 ? 'codebook 1' : (w < 0.5 ? 'codebook 2' : (w < 0.86 ? 'codebook 3' : '… and so on')) }); A.show(lbCb, 1); }
    else A.show(lbCb, 0);
    // ---- the dot that carries a value from one panel to the other
    if (trv) { a = ease(trv[2]); A.set(tr, { cx: lerp(trv[0][0], trv[1][0], a).toFixed(1), cy: lerp(trv[0][1], trv[1][1], a).toFixed(1) }); A.show(tr, Math.min(1, 6 * trv[2], 6 * (1 - trv[2]))); }
    else A.show(tr, 0);
  };
});
