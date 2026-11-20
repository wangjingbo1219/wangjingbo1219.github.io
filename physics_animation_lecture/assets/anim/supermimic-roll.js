/* SuperMimic, "how" slide: a frame strip of the phase that the current click explains.   <svg data-anim="supermimic-roll" viewBox="0 0 1064 304">
 * SCHEMATIC, no data: stick figures are the frames of a roll-out (pose glyphs, not motion data), the chips between them are what
 * produces the next frame. Colours follow the authors' clips shown beside the strip: white = simulator, blue = world model.
 *   step 0  collect        frame -> [π][sim] -> frame ...  white = simulated, green = reference; every step drops a tile into the
 *                          replay buffer; when the buffer is full the write head wraps and the oldest tiles are overwritten
 *   step 1  fit f_ω        a window of 8 stored steps: f_ω rolled out from its first state on the stored actions (blue) against the
 *                          stored states (white); the error flows back into every f_ω, then the prediction moves onto the stored states.
 *                          Every pass takes another window, of another motion: the chips stay the same (one model for all motions)
 *   step 2  imagine        from ONE stored state, π and f_ω alternate for 32 steps (f_ω dashed: fixed in this phase); every imagined
 *                          frame comes with a predicted reward (amber bar: longer = closer to the reference); the bars add up to the return
 *   step 3  differentiate  the same roll-out; the gradient of the return flows back through every f_ω into every π, then the imagined
 *                          frames move toward the reference and the bars grow
 *   step 4  critic         as step 3, plus V_ψ at the end of the window: its bar stands for the return after step 32 and is added
 *                          to the return before the backward pass
 * Window lengths (8, 32) are the paper's (k and H, Sec. 3.2 and 3.3); the strip draws the first frames of a window and its last one.
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('supermimic-roll', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, AM = C.amber, BL = C.blue, WH = '#f2f2f2';
  var GY = 190, CY = 140;                               // ground line, height of the chain
  var XS = [96, 262, 428, 594, 816];                    // frames: four consecutive ones, an ellipsis, the last of the window
  var GC = [179, 345, 511, 722];                        // centre of the chips between frame k and k + 1
  var XV = 914, XR = 1000;                               // critic chip, loss / return chip
  var NB = 61, BX = 132, BP = 15, BY = 258;             // buffer row: tiles, first x, pitch, top (the row ends at x = 1044, like the return chip)
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">' + s + '</tspan>'; };
  var SUB = function (s) { return '<tspan dy="5" style="font-family:' + A.MATH + ';font-style:italic;font-size:15px">' + s + '</tspan>'; };
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.halo ? ';' + A.HALO : '') }, p);
    n.innerHTML = s;
    return n;
  }
  var ln = function (p, d, col, w, dash) { return A.el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': w || 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dash || 'none' }, p); };

  // ---------------------------------------------------------------- pose glyphs
  // A glyph = { segs: [[x1, y1, x2, y2], ...], head: [x, y], piv: [x, y] } in local coordinates: x to the right, y UP from the ground, px.
  // The flip is drawn from key points (pelvis, shoulder, two knees and feet, two elbows and hands); the walk from joint angles.
  function fromPoints(p, s, legs, arms) {      // legs / arms: [[knee, foot], [knee, foot]] / [[elbow, hand], [elbow, hand]]
    var segs = [[p[0], p[1], s[0], s[1]]], n = Math.sqrt((s[0] - p[0]) * (s[0] - p[0]) + (s[1] - p[1]) * (s[1] - p[1])), i;
    for (i = 0; i < 2; i++) segs.push([p[0], p[1], legs[i][0][0], legs[i][0][1]], [legs[i][0][0], legs[i][0][1], legs[i][1][0], legs[i][1][1]]);
    for (i = 0; i < 2; i++) segs.push([s[0], s[1], arms[i][0][0], arms[i][0][1]], [arms[i][0][0], arms[i][0][1], arms[i][1][0], arms[i][1][1]]);
    return { segs: segs, head: [s[0] + 12 * (s[0] - p[0]) / n, s[1] + 12 * (s[1] - p[1]) / n], piv: p };
  }
  var FLIP = [
    fromPoints([-6, 30], [14, 58], [[[18, 22], [0, 0]], [[20, 18], [6, 0]]], [[[0, 46], [-14, 38]], [[4, 44], [-8, 34]]]),            // crouch, arms back
    fromPoints([0, 60], [-8, 93], [[[7, 37], [3, 13]], [[11, 39], [11, 15]]], [[[-22, 104], [-36, 112]], [[-20, 108], [-32, 120]]]),       // take-off, arms thrown back
    fromPoints([12, 94], [-10, 68], [[[-14, 92], [-2, 112]], [[-12, 98], [4, 116]]], [[[-24, 80], [-12, 90]], [[-22, 81], [-10, 91]]]), // tucked, upside down
    fromPoints([-4, 62], [22, 84], [[[6, 40], [2, 16]], [[2, 39], [-4, 16]]], [[[30, 68], [38, 54]], [[27, 67], [33, 52]]]),            // opening, coming down
    fromPoints([-8, 30], [12, 57], [[[16, 20], [-2, 0]], [[22, 19], [8, 0]]], [[[26, 46], [40, 52]], [[24, 44], [38, 46]]])             // landing
  ];
  var WALK = [0.5, 1.55, 2.6, 3.65, 5.9].map(function (ph) {
    var TH = 25, SH = 25, TO = 36, UA = 19, FA = 17, lean = 0.08, legs = [], arms = [], i, p;
    var hy = TH + SH - 3 - 2.5 * Math.abs(Math.cos(ph)), s = [TO * Math.sin(lean), hy + TO * Math.cos(lean)];
    for (i = 0; i < 2; i++) {
      p = ph + i * Math.PI;
      var th = 0.55 * Math.sin(p) + 0.3 * lean, kn = 0.12 + 0.85 * Math.max(0, Math.cos(p));
      var kx = TH * Math.sin(th), ky = hy - TH * Math.cos(th);
      legs.push([[kx, ky], [kx + SH * Math.sin(th - kn), Math.max(3, ky - SH * Math.cos(th - kn))]]);
      var up = -0.5 * Math.sin(p) + lean, ex = s[0] + UA * Math.sin(up), ey = s[1] - 4 - UA * Math.cos(up);
      arms.push([[ex, ey], [ex + FA * Math.sin(up + 0.6), ey - FA * Math.cos(up + 0.6)]]);
    }
    return fromPoints([0, hy], s, legs, arms);
  });
  var MOT = [FLIP, WALK];
  MOT.forEach(function (M) {                     // centre every glyph on its frame position
    M.forEach(function (g) {
      var lo = g.head[0] - 9, hi = g.head[0] + 9, bo = g.head[1] - 9, to = g.head[1] + 9;
      g.segs.forEach(function (q) { lo = Math.min(lo, q[0], q[2]); hi = Math.max(hi, q[0], q[2]); bo = Math.min(bo, q[1], q[3]); to = Math.max(to, q[1], q[3]); });
      g.cx = (lo + hi) / 2; g.cy = (bo + to) / 2;
    });
  });
  function figure(w) {
    var g = A.el('g', { fill: 'none', 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    return { g: g, body: A.el('path', {}, g), head: A.el('circle', { r: 9, stroke: 'none' }, g) };
  }
  // e = how far off this figure is from the glyph: it is turned about its middle, set back and (in the air) lower
  function place(fg, M, i, e, col) {
    var g = M[i], c = Math.cos(0.32 * e), s = Math.sin(0.32 * e), px = g.cx, py = g.cy, d = '', lo = 1e9, j;
    var T = function (x, y) { return [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c]; };
    var pts = g.segs.map(function (q) { var a = T(q[0], q[1]), b = T(q[2], q[3]); lo = Math.min(lo, a[1], b[1]); return [a, b]; });
    var h = T(g.head[0], g.head[1]), ox = XS[i] - g.cx - 9 * e, dy = lo < 4 * e ? -lo : -Math.min(8 * e, lo);      // never below the ground
    for (j = 0; j < pts.length; j++) d += 'M' + (ox + pts[j][0][0]).toFixed(1) + ' ' + (GY - 3 - pts[j][0][1] - dy).toFixed(1) + 'L' + (ox + pts[j][1][0]).toFixed(1) + ' ' + (GY - 3 - pts[j][1][1] - dy).toFixed(1);
    A.set(fg.body, { d: d, stroke: col });
    A.set(fg.head, { cx: (ox + h[0]).toFixed(1), cy: (GY - 3 - h[1] - dy).toFixed(1), fill: col });
  }

  // ---------------------------------------------------------------- static frame of the figure
  ln(el, 'M52 ' + GY + 'H856', '#333', 3);
  var k, j, chain = A.el('g', {}, el);
  for (k = 0; k < 3; k++) ln(chain, 'M' + (XS[k] + 36) + ' ' + CY + 'H' + (XS[k + 1] - 40) + 'm-9 -7l9 7l-9 7', '#6a6a6a', 2.5);
  ln(chain, 'M' + (XS[3] + 36) + ' ' + CY + 'H640M676 ' + CY + 'H' + (XS[4] - 44) + 'm-9 -7l9 7l-9 7', '#6a6a6a', 2.5);
  for (j = 0; j < 3; j++) A.el('circle', { cx: 646 + 12 * j, cy: CY, r: 3.2, fill: '#9a9a9a' }, chain);

  // legend, one group per kind of roll-out
  function legend(items) {
    var g = A.el('g', {}, el), x = 28;
    items.forEach(function (it) {
      ln(g, 'M' + x + ' 23H' + (x + 26), it[0], 7);
      txt(g, x + 38, 30, it[1], { fill: '#d6d6d6' });
      x += 38 + it[2] + 30;
    });
    return g;
  }
  var LG = {
    col: legend([[G, 'reference', 90], [WH, 'simulated', 92]]),
    wm: legend([[WH, 'simulated = the label', 202], [BL, 'predicted', 88], [AM, 'error', 46]]),
    img: legend([[G, 'reference', 90], [BL, 'imagined', 86], [AM, 'predicted reward', 160]])
  };

  // the three phases of one iteration, top right: collect -> fit f_ω -> improve π (and around again)
  var PH = [[668, 96, 'collect'], [800, 88, 'fit ' + MI('f') + SUB('ω')], [924, 120, 'improve ' + MI('π')]], pills = [], parr = [];
  PH.forEach(function (p, i) {
    var g = A.el('g', {}, el);
    var r = A.el('rect', { x: p[0], y: 8, width: p[1], height: 32, rx: 16, 'stroke-width': 2 }, g);
    var t = txt(g, p[0] + p[1] / 2, 31, p[2], { anchor: 'middle', weight: 700 });
    pills.push({ g: g, r: r, t: t });
    if (i) parr.push(ln(el, 'M' + (p[0] - 24) + ' 24h10m-6 -6l6 6l-6 6', '#8d8d8d', 2.5));
  });
  var pback = ln(el, 'M984 44v8H716v-9m-6 7l6 -7l6 7', '#8d8d8d', 2.5);

  // frames: the reference (or the stored state) behind, the rolled-out figure in front
  var EG = [0, 0.22, 0.30, 0.34, 0.38];                 // how far a simulated frame is from its reference (schematic)
  var EW = [0, 0.34, 0.58, 0.8, 1];                     // how far a prediction is from its label before the update: it grows along the roll-out
  var EI = [0, 0.42, 0.64, 0.84, 1];                    // how far an imagined frame is from the reference before the update
  var ref = [], cur = [], bars = [];
  for (k = 0; k < 5; k++) ref.push(figure(5));
  for (k = 0; k < 5; k++) { cur.push(figure(6.5)); bars.push(A.el('rect', { y: GY + 7, height: 8, rx: 4, fill: AM }, el)); }

  // chips between the frames: A = π, B = sim or f_ω
  var chips = [];
  for (k = 0; k < 4; k++) {
    var g = A.el('g', {}, el), o = {};
    o.ra = A.el('rect', { y: CY - 17, height: 34, rx: 8, width: 36, fill: G, stroke: G, 'stroke-width': 2.5 }, g);
    o.ta = txt(g, 0, CY + 7, MI('π'), { anchor: 'middle', weight: 700, fill: '#000' });
    o.rb = A.el('rect', { y: CY - 17, height: 34, rx: 8, width: 46, 'stroke-width': 2.5 }, g);
    o.tsim = txt(g, 0, CY + 7, 'sim', { anchor: 'middle', weight: 700, fill: '#000' });
    o.tw = txt(g, 0, CY + 6, MI('f') + SUB('ω'), { anchor: 'middle', weight: 700, fill: '#fff' });
    o.fa = A.el('rect', { y: CY - 22, height: 44, rx: 12, width: 46, fill: 'none', stroke: AM, 'stroke-width': 4 }, g);
    o.fb = A.el('rect', { y: CY - 22, height: 44, rx: 12, width: 56, fill: 'none', stroke: AM, 'stroke-width': 4 }, g);
    chips.push(o);
  }
  var startL = txt(el, XS[0], GY + 25, 'a stored state', { anchor: 'middle', fill: '#d6d6d6' });

  // loss / return chip at the end of the chain, fed by the bar of every frame
  var gEnd = A.el('g', {}, el);
  ln(gEnd, 'M' + (XS[1] - 34) + ' ' + (GY + 22) + 'H' + XR + 'V' + (CY + 24) + 'm-7 9l7 -9l7 9', AM, 2.5);
  A.el('rect', { x: XR - 44, y: CY - 18, width: 88, height: 36, rx: 9, fill: '#1b1503', stroke: AM, 'stroke-width': 2.5 }, gEnd);
  var tLoss = txt(gEnd, XR, CY + 7, 'loss', { anchor: 'middle', weight: 700, fill: '#ffd76a' });
  var tRet = txt(gEnd, XR, CY + 7, 'return', { anchor: 'middle', weight: 700, fill: '#ffd76a' });

  // the critic: a chip after the last imagined frame, and its bar (the return after the window)
  var gV = A.el('g', {}, el);
  ln(gV, 'M' + (XS[4] + 38) + ' ' + CY + 'H' + (XV - 32) + 'm-9 -7l9 7l-9 7', '#6a6a6a', 2.5);
  A.el('rect', { x: XV - 27, y: CY - 17, width: 54, height: 34, rx: 8, fill: '#0f1a06', stroke: G, 'stroke-width': 2.5 }, gV);
  txt(gV, XV, CY + 6, MI('V') + SUB('ψ'), { anchor: 'middle', weight: 700, fill: '#fff' });
  var vRing = A.el('rect', { x: XV - 32, y: CY - 22, width: 64, height: 44, rx: 12, fill: 'none', stroke: '#fff', 'stroke-width': 4 }, gV);
  var vBar = A.el('rect', { y: GY + 7, height: 8, rx: 4, fill: AM, 'fill-opacity': 0.5, stroke: AM, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, gV);
  txt(gV, XV + 8, 238, 'after step 32', { anchor: 'middle', halo: true, fill: '#e2e2e2' });

  // moving dots
  function dots(n, col, r) { var a = []; for (var i = 0; i < n; i++) a.push(A.el('circle', { r: r, fill: col, stroke: '#101010', 'stroke-width': 1.5 }, el)); return a; }
  var grad = dots(6, AM, 5.5), rew = dots(5, AM, 5), vdot = dots(1, AM, 5)[0];

  // buffer row, the sampled window (or the one sampled start state) and its "zoom" up to the strip
  var gBuf = A.el('g', {}, el), tiles = [];
  txt(gBuf, 28, BY + 21, 'buffer', { fill: C.mid });
  for (j = 0; j < NB; j++) tiles.push(A.el('rect', { x: BX + j * BP, y: BY, width: 12, height: 28, rx: 3, fill: '#d8d8d8' }, gBuf));
  var gWin = A.el('g', {}, el);
  var zoom = ln(gWin, '', '#5c5c5c', 1.8), brack = ln(gWin, '', '#8d8d8d', 2.2);
  var winR = A.el('rect', { y: BY - 4, height: 36, rx: 6, fill: 'none', stroke: '#fff', 'stroke-width': 2.5 }, gWin);
  var wl8 = txt(gWin, 453, 238, 'a window of 8 stored steps', { anchor: 'middle', halo: true, fill: '#e2e2e2' });
  var wl32 = txt(gWin, 532, 238, '32 imagined steps', { anchor: 'middle', halo: true, fill: '#e2e2e2' });
  var fly = [];
  for (k = 0; k < 5; k++) fly.push(A.el('rect', { width: 12, height: 28, rx: 3, fill: '#fff' }, el));
  var WS8 = [10, 38, 23, 47, 4], WS1 = [18, 43, 7, 31, 52];            // window starts / start states, one per pass

  var RATE = 9;                                                       // buffer tiles written per second while collecting
  var COL = 3.6, FIT = 7.0, CRT = 8.6;                                // loop lengths

  // ---------------------------------------------------------------- one picture: kind of roll-out, time inside it, how visible
  // kind: 'col' | 'wm' | 'img' | 'grad' | 'crit';  tau: seconds into the pass;  alpha: 0..1;  pass: index of the pass;  tw: seconds of collecting so far
  function scene(kind, tau, alpha, pass, tw, full) {
    var real = kind === 'col', wm = kind === 'wm', img = !real && !wm, crit = kind === 'crit', upd = wm || kind === 'grad' || crit, i, e;
    var M = img ? FLIP : MOT[pass % MOT.length];
    var G0 = crit ? 3.5 : 2.6;                                          // the backward pass starts here
    var gp = upd ? A.ramp(tau, G0, G0 + 1.3) : 0, sn = upd ? A.ease(A.ramp(tau, G0 + 1.3, G0 + 2.2)) : 0;
    var shown = function (kk) { return kk === 0 ? 1 : A.ramp(tau, kk * 0.5 - 0.12, kk * 0.5 + 0.06); };
    var front = A.lerp(XR - 50, 70, gp);
    A.show(LG.col, real ? alpha : 0); A.show(LG.wm, wm ? alpha : 0); A.show(LG.img, img ? alpha : 0);
    // frames and their bars
    for (i = 0; i < 5; i++) {
      var eCur = real ? EG[i] : (wm ? EG[i] + EW[i] * (1 - 0.88 * sn) : EI[i] * (1 - 0.72 * sn));
      place(ref[i], M, i, wm ? EG[i] : 0, wm ? WH : G);
      place(cur[i], M, i, i === 0 && !real ? (wm ? EG[0] : 0) : eCur, real || i === 0 ? WH : BL);
      A.show(ref[i].g, alpha * (i === 0 && !real ? 0 : (wm ? 0.78 : 0.9)));
      A.show(cur[i].g, alpha * shown(i));
      var bw = 0;
      if (i > 0 && wm) bw = (9 + 52 * EW[i] * (1 - 0.88 * sn)) * A.ramp(tau, 2.0, 2.5);                       // prediction error
      if (i > 0 && img) bw = (12 + 46 * (1 - EI[i] * (1 - 0.72 * sn))) * A.ramp(tau, i * 0.5 + 0.05, i * 0.5 + 0.35);   // predicted reward
      A.set(bars[i], { x: (XS[i] - bw / 2).toFixed(1), width: bw.toFixed(1) });
      A.show(bars[i], bw > 0.5 ? alpha : 0);
    }
    // chips
    for (i = 0; i < 4; i++) {
      var c = chips[i], cx = GC[i], two = !wm, xA = cx - 44, xB = two ? cx - 2 : cx - 23;
      A.set(c.ra, { x: xA }); A.set(c.ta, { x: xA + 18 }); A.show(c.ra, two ? alpha : 0); A.show(c.ta, two ? alpha : 0);
      A.set(c.rb, { x: xB, fill: real ? '#e8e8e8' : (img ? '#1c1c1c' : '#0f1a06'), stroke: real ? '#e8e8e8' : (img ? '#8a8a8a' : G), 'stroke-dasharray': img ? '5 4' : 'none' });
      A.show(c.rb, alpha);
      A.set(c.tsim, { x: xB + 23 }); A.set(c.tw, { x: xB + 20 }); A.show(c.tsim, real ? alpha : 0); A.show(c.tw, real ? 0 : alpha);
      // the gradient front lights the chip that this phase updates: f_ω when fitting the model, π when improving the policy
      var xc = wm ? xB + 23 : xA + 18, lit = 0;
      if (upd && gp > 0) lit = (front < xc ? A.clamp(1 - (xc - front) / 300, 0.25, 1) : 0) * (1 - 0.75 * A.ramp(tau, G0 + 1.4, G0 + 2.4));
      // the roll-out itself: the chips that produce frame i + 1 light up white, one after the other
      var uf = tau / 0.5 - i, on = uf > 0 && uf < 1, ha = on && two ? A.clamp(Math.min(uf / 0.12, (0.6 - uf) / 0.12), 0, 1) : 0;
      var hb = on ? A.clamp(Math.min((uf - (two ? 0.4 : 0)) / 0.12, (1 - uf) / 0.12), 0, 1) : 0;
      A.set(c.fa, { x: xA - 5, stroke: ha > 0 ? '#fff' : AM }); A.set(c.fb, { x: xB - 5, stroke: hb > 0 ? '#fff' : AM });
      A.show(c.fa, alpha * Math.max(ha, img ? lit : 0)); A.show(c.fb, alpha * Math.max(hb, wm ? lit : 0));
    }
    A.show(startL, img ? alpha : 0);
    // loss / return chip, and the rewards running into it
    A.show(gEnd, real ? 0 : alpha * (0.35 + 0.65 * (wm ? A.ramp(tau, 2.0, 2.5) : A.ramp(tau, 0.7, 2.6))));
    A.show(tLoss, wm ? 1 : 0); A.show(tRet, img ? 1 : 0);
    for (i = 1; i < 5; i++) {
      var ur = (tau - i * 0.5 - 0.25) / 0.7, onr = img && ur > 0 && ur < 1;
      if (onr) A.set(rew[i], { cx: A.lerp(XS[i], XR, A.ease(ur)).toFixed(1), cy: GY + 22 });
      A.show(rew[i], onr ? alpha : 0);
    }
    A.show(rew[0], 0);
    // the critic
    A.show(gV, crit ? alpha : 0);
    if (crit) {
      var vl = A.clamp(Math.min((tau - 2.05) / 0.12, (2.75 - tau) / 0.12), 0, 1), vw = 54 * A.ease(A.ramp(tau, 2.3, 3.0)), uv = (tau - 3.0) / 0.45;
      A.show(vRing, vl);
      A.set(vBar, { x: (XV - vw / 2).toFixed(1), width: vw.toFixed(1) }); A.show(vBar, vw > 0.5 ? 1 : 0);
      if (uv > 0 && uv < 1) A.set(vdot, { cx: A.lerp(XV, XR, A.ease(uv)).toFixed(1), cy: GY + 22 });
      A.show(vdot, uv > 0 && uv < 1 ? alpha : 0);
    } else A.show(vdot, 0);
    // the backward pass
    for (i = 0; i < grad.length; i++) {
      var xg = front + i * 36;
      A.set(grad[i], { cx: xg.toFixed(1), cy: CY });
      A.show(grad[i], upd && gp > 0 && gp < 1 && xg < XR - 48 && xg > 84 ? alpha : 0);
    }
    // buffer
    var head = Math.floor(tw * RATE), wrapped = full || head >= NB, w0 = (wm ? WS8 : WS1)[pass % 5], n = wm ? 8 : 1;
    for (i = 0; i < NB; i++) {
      var op;
      if (real) {
        var age = wrapped ? ((head - i) % NB + NB) % NB : head - i;          // tiles written since this one
        op = age < 0 ? 0.1 : A.lerp(1, 0.42, A.clamp((age + (tw * RATE - head)) / 5, 0, 1));
      } else op = i >= w0 && i < w0 + n ? 1 : 0.42;
      tiles[i].setAttribute('fill-opacity', op.toFixed(2));
    }
    A.show(gWin, real ? 0 : alpha);
    if (!real) {
      var x0 = BX + w0 * BP - 4, x1 = BX + (w0 + n) * BP + 1;
      A.set(winR, { x: x0, width: x1 - x0 });
      A.set(zoom, { d: wm ? 'M60 233L' + x0 + ' ' + (BY - 5) + 'M846 233L' + x1 + ' ' + (BY - 5) : 'M' + XS[0] + ' ' + (GY + 34) + 'L' + ((x0 + x1) / 2) + ' ' + (BY - 5) });
      A.set(brack, { d: wm ? 'M60 224v7H846v-7' : 'M218 224v7H846v-7' });
      A.show(wl8, wm ? 1 : 0); A.show(wl32, img ? 1 : 0);
    }
    for (i = 0; i < 5; i++) {                                              // collecting: a tile flies from each new frame to the write head
      var t0 = i * 0.5, u = (tau - t0) / 0.45, onf = real && u > 0 && u < 1;
      if (onf) {
        var hx = BX + ((Math.floor((tw - tau + t0 + 0.45) * RATE) % NB + NB) % NB) * BP, uu = A.ease(u);
        A.set(fly[i], { x: A.lerp(XS[i] - 6, hx, uu).toFixed(1), y: A.lerp(GY + 6, BY, uu).toFixed(1) });
      }
      A.show(fly[i], onf ? alpha : 0);
    }
  }
  function pillState(i, st) {                                              // 0 hidden · 1 idle · 2 current
    A.show(pills[i].g, st ? 1 : 0);
    A.set(pills[i].r, { fill: st === 2 ? '#fff' : '#161616', stroke: st === 2 ? '#fff' : '#5a5a5a' });
    pills[i].t.style.fill = st === 2 ? '#000' : '#b8b8b8';
  }
  var env = function (u, T) { return Math.min(1, u / 0.3, (T - u) / 0.35); };

  return function draw(f) {
    var s = Math.min(f.step, 4), ts = Math.max(0, f.ts), u;
    pillState(0, s === 0 ? 2 : 1); pillState(1, s < 1 ? 0 : (s === 1 ? 2 : 1)); pillState(2, s < 2 ? 0 : 2);
    A.show(parr[0], s >= 1 ? 1 : 0); A.show(parr[1], s >= 2 ? 1 : 0); A.show(pback, s >= 2 ? 1 : 0);
    if (s === 0) { u = A.loop(ts, COL); scene('col', u, env(u, COL), Math.floor(ts / COL), ts, false); }
    else if (s === 1) { u = A.loop(ts, FIT); scene('wm', u, env(u, FIT), Math.floor(ts / FIT), 0, true); }
    else if (s === 2) { u = A.loop(ts, FIT); scene('img', u, env(u, FIT), Math.floor(ts / FIT), 0, true); }
    else if (s === 3) { u = A.loop(ts, FIT); scene('grad', u, env(u, FIT), Math.floor(ts / FIT), 0, true); }
    else { u = A.loop(ts, CRT); scene('crit', u, env(u, CRT), Math.floor(ts / CRT), 0, true); }
  };
});
