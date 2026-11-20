/* Slide "SMP — how" (Mu et al. 2026, sections 3.2, 5 and 5.2, figure 3).   <svg data-anim="smp-score" viewBox="0 0 1740 412">
 * A SCHEMATIC, not a simulation and not the paper's data. Three panels:
 *   left    what one point is: a clip of 10 consecutive frames (stick figures); green = a dataset clip, amber = the policy's last 10 frames,
 *           thin white = the same clip with noise added
 *   middle  every 10-frame clip drawn as a point in a plane. Green dots = dataset clips (they lie on a thin band).
 *           The "model" of this toy is the exact denoiser of the drawn dots: for a noised point it returns the posterior mean of the clean
 *           point (a Gaussian-weighted mean of the dataset dots), i.e. what a perfectly trained diffusion model would predict here.
 *           white arrow  = the noise that was added (epsilon);  blue dashed arrow = the noise the model predicts (epsilon-hat): it starts at the
 *           clean clip the model assumes (blue ring on the band);  red bar = their difference = the gap between the clip and that assumed clip.
 *   right   the reward r = exp(-w * error^2) (equation 7). The curve's shape is exact; w and the errors of the toy are illustrative, so the
 *           axes carry no numbers except 0 and 1.
 * The legend under the middle panel, the label of the error axis and the formula are HTML (KaTeX) written by tools/slides/03b_50_smp.py.
 * Labels keep out of the way of everything that moves: "dataset clips" is a legend entry on the header line, the policy's label stays
 * under its point (its noise samples are drawn upward), the start points of step 5 stay above the legend row.
 * (checked on a time grid with raw/_work/p_smp/rev/hits.py: no mark crosses a label at any click)
 * Steps: 0 stage 1: dataset clips are noised, the model learns to predict the noise (its first guesses are wrong, later ones right;
 *          the red bar is the prediction error that training makes small)
 *        1 the policy's clip (far from the band) is noised the same way
 *        2 the frozen model predicts the noise; the error appears
 *        3 the reward curve; a probe sits at the current error
 *        4 the policy learns: its clip moves to the band, the error shrinks, the reward climbs; the band (the model) does not change
 *        5 start states are sampled from the model: points of pure noise are denoised step by step onto the band
 */
DeckAnim.register('smp-score', function (el, A) {
  'use strict';
  var C = A.C, GREEN = C.g, AMBER = C.amber, BLUE = C.blue, RED = C.red, PI = Math.PI, H = 412;
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">' + s + '</tspan>'; };
  var EPS = MI('ε'), XT = MI('x̃');
  function txt(p, x, y, s, o) { var n = A.text(p, x, y, '', o); n.innerHTML = s; return n; }
  function panel(x, w) { A.el('rect', { x: x + 0.5, y: 0.5, width: w - 1, height: H - 1, rx: 16, fill: '#101010', stroke: '#2a2a2a' }, el); }
  function head(x, y, a, s) {
    var c = Math.cos(a), n = Math.sin(a), bx = x - s * c, by = y - s * n;
    return 'M' + (bx - 0.6 * s * n).toFixed(1) + ' ' + (by + 0.6 * s * c).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) + 'L' + (bx + 0.6 * s * n).toFixed(1) + ' ' + (by - 0.6 * s * c).toFixed(1);
  }
  /** an arrow (line + head) that can be grown: set(ax, ay, bx, by, u) draws it from a to a + u (b - a) */
  function arrow(parent, col, w, dash) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    var ln = A.el('path', dash ? { 'stroke-dasharray': dash } : {}, g), hd = A.el('path', {}, g);
    return { g: g, set: function (ax, ay, bx, by, u) {
      var x = ax + (bx - ax) * u, y = ay + (by - ay) * u, L = Math.hypot(x - ax, y - ay);
      if (L < 3) { A.show(g, 0); return; }
      A.show(g, 1);
      A.set(ln, { d: 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) });
      A.set(hd, { d: head(x, y, Math.atan2(y - ay, x - ax), Math.min(12, L * 0.5)) });
    } };
  }

  panel(0, 430); panel(454, 726); panel(1204, 536);

  // =========================================================================================== left: what a point is
  txt(el, 22, 36, 'one point = one clip of 10 frames', { size: 20, weight: 500, fill: C.mid, halo: false });
  var NF = 10, FX0 = 36, FDX = 39.6;
  function strip(y, col, label) {
    var g = A.el('g', {}, el);
    txt(g, 22, y - 82, label, { size: 21, fill: col, halo: false });
    A.el('line', { x1: 18, y1: y + 2, x2: 412, y2: y + 2, stroke: '#333', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    var body = A.el('path', { fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g), heads = [];
    var nz = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    for (var j = 0; j < NF; j++) heads.push(A.el('circle', { r: 4.8, fill: col }, g));
    var tag = txt(g, 410, y + 30, 'white: the same clip + noise ' + EPS, { size: 20, weight: 500, fill: '#e6e6e6', anchor: 'end', halo: false });
    return { g: g, body: body, heads: heads, nz: nz, tag: tag, y: y };
  }
  var sData = strip(158, GREEN, 'a clip from the dataset'), sPol = strip(328, AMBER, 'the policy’s last 10 frames ' + XT);
  // stick figure in profile. ph gait phase, a = 0 awkward (an untrained policy) .. 1 natural; z = 9 offsets added to the joint angles (noise)
  function pose(x0, y0, ph, a, z, amp) {
    var L = A.lerp, TH = 15.5, SH = 15.5, TO = 22, UA = 11.5, LA = 10.5, k = z ? amp : 0;
    z = z || [0, 0, 0, 0, 0, 0, 0, 0, 0];
    function leg(p, i) {
      return [L(0.22 * Math.sin(2.3 * p + 0.4), 0.48 * Math.sin(p), a) + k * z[i], Math.max(0, L(0.06, 0.1 + 0.85 * Math.max(0, Math.cos(p)), a) + k * z[i + 1])];
    }
    function arm(p, q, i) {
      return [L(2.3 + 0.5 * Math.sin(2.9 * p + q), -0.45 * Math.sin(p), a) + k * z[i], L(0.9 + 0.5 * Math.sin(3.3 * p + 2 * q), 0.35 + 0.15 * Math.sin(p), a) + k * z[i + 1]];
    }
    var lean = L(-0.24 + 0.1 * Math.sin(2.3 * ph), 0.07, a) + 0.5 * k * z[8], bob = L(1.4 * Math.sin(4.6 * ph), 1.3 * Math.abs(Math.cos(ph)), a);
    var hy = y0 - (TH + SH) + 2 + bob, sx = x0 + TO * Math.sin(lean), sy = hy - TO * Math.cos(lean), d = '';
    [leg(ph, 0), leg(ph + PI, 2)].forEach(function (q) {
      var kx = x0 + TH * Math.sin(q[0]), ky = hy + TH * Math.cos(q[0]), fa = q[0] - q[1];
      d += 'M' + x0.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'L' + (kx + SH * Math.sin(fa)).toFixed(1) + ' ' + Math.min(y0, ky + SH * Math.cos(fa)).toFixed(1);
    });
    [arm(ph + PI, 2.1, 4), arm(ph, 0.7, 6)].forEach(function (q) {
      var ex = sx + UA * Math.sin(q[0]), ey = sy + UA * Math.cos(q[0]), fa = q[0] + q[1];
      d += 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + (ex + LA * Math.sin(fa)).toFixed(1) + ' ' + (ey + LA * Math.cos(fa)).toFixed(1);
    });
    d += 'M' + x0.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + sx.toFixed(1) + ' ' + sy.toFixed(1);
    return { d: d, hx: sx + 7.5 * Math.sin(lean), hy: sy - 7.5 * Math.cos(lean) };
  }
  /** draw a strip: a window of 10 frames starting at gait phase ph0; noise sample `seed` at strength amp (0 = none) */
  function drawStrip(s, ph0, a, seed, amp) {
    var d = '', dn = '', j, q, r = A.rand(seed * 131 + 7);
    for (j = 0; j < NF; j++) {
      var x = FX0 + j * FDX, ph = ph0 + j * 0.44, p = pose(x, s.y, ph, a, null, 0), z = [];
      d += p.d; A.set(s.heads[j], { cx: p.hx.toFixed(1), cy: p.hy.toFixed(1) });
      for (q = 0; q < 9; q++) z.push(0.42 * A.gauss(r));
      if (amp > 0.01) { var pn = pose(x + 6 * amp * z[8], s.y, ph, a, z, amp); dn += pn.d + 'M' + (pn.hx - 3.5).toFixed(1) + ' ' + pn.hy.toFixed(1) + 'a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0'; }
    }
    A.set(s.body, { d: d }); A.set(s.nz, { d: dn }); A.show(s.nz, A.clamp(amp * 2, 0, 1)); A.show(s.tag, A.clamp(amp * 2, 0, 1));
  }

  // =========================================================================================== middle: the space of clips
  txt(el, 476, 36, 'all 10-frame clips, drawn as points (schematic)', { size: 20, weight: 500, fill: C.mid, halo: false });
  var bandY = function (x) { return 122 + 0.00078 * (x - 817) * (x - 817); };
  var bp = [], i;
  for (i = 0; i <= 60; i++) { var bx = 488 + (1146 - 488) * i / 60; bp.push([bx, bandY(bx)]); }
  var cid = 'smpclip' + Math.round(1e6 * A.rand(el.getAttribute('data-anim-still') | 0)()), gHalo;
  A.el('rect', { x: 456, y: 2, width: 722, height: H - 4, rx: 15 }, A.el('clipPath', { id: cid }, A.el('defs', {}, el)));
  gHalo = A.el('g', { 'clip-path': 'url(#' + cid + ')' }, el);                 // noise spreads the data over the plane: where the model has been trained
  A.el('path', { d: A.path(bp), fill: 'none', stroke: GREEN, 'stroke-width': 290, 'stroke-opacity': 0.04, 'stroke-linecap': 'round' }, gHalo);
  A.el('path', { d: A.path(bp), fill: 'none', stroke: GREEN, 'stroke-width': 150, 'stroke-opacity': 0.05, 'stroke-linecap': 'round' }, gHalo);
  var DATA = [], rd = A.rand(11), ND = 46, gData = A.el('g', {}, el);
  for (i = 0; i < ND; i++) {
    var dx = 498 + (1136 - 498) * (i + 0.5 + 0.5 * (rd() - 0.5)) / ND, sl = 2 * 0.00078 * (dx - 817), nn = 7 * A.gauss(rd), nl = Math.hypot(1, sl);
    DATA.push([dx - nn * sl / nl, bandY(dx) + nn / nl]);
    A.el('circle', { cx: DATA[i][0].toFixed(1), cy: DATA[i][1].toFixed(1), r: 5, fill: GREEN }, gData);
  }
  // the band's label is a legend entry on the header line: noised points and arrows travel all around the band, never up there
  A.el('circle', { cx: 1014, cy: 29, r: 5, fill: GREEN }, el);
  txt(el, 1160, 36, 'dataset clips', { size: 21, fill: GREEN, anchor: 'end', halo: false });
  var SIG = 62;                                              // noise scale of the toy, px
  /** what a perfect denoiser returns for the noised point (x, y) at noise scale s: the posterior mean of the clean point */
  function clean(x, y, s) {
    var sw = 0, sx = 0, sy = 0, m = 1e9, k, d2 = [];
    for (k = 0; k < ND; k++) { var d = (x - DATA[k][0]) * (x - DATA[k][0]) + (y - DATA[k][1]) * (y - DATA[k][1]); d2.push(d); if (d < m) m = d; }
    for (k = 0; k < ND; k++) { var w = Math.exp(-(d2[k] - m) / (2 * s * s)); sw += w; sx += w * DATA[k][0]; sy += w * DATA[k][1]; }
    return [sx / sw, sy / sw];
  }
  // noise samples (a direction times a length near 1); the policy's clip gets directions that keep the picture inside the panel
  function noise(seed, lim) {
    var r = A.rand(seed * 977 + 31), a = lim ? [2.5, 0.55, 2.9, 1.35, 0.22, 2.0, 0.9, 2.95][((seed % 8) + 8) % 8] + 0.3 * (r() - 0.5) : 2 * PI * r(), m = 0.85 + 0.4 * r();
    return [m * Math.cos(a), -m * Math.sin(a)];
  }
  /** training sample idx of step 0: a dataset dot, its noised copy, the noise scale. The kicks are drawn mostly across the band
   *  (alternately below and above it, three sizes), where the picture shows best that the trained model finds the way back. */
  function sample(idx) {
    var r = A.rand(idx * 53 + 3), di = Math.floor(r() * (ND - 12)) + 6, m = ((idx % 3) + 3) % 3, up = m === 2, sc = [1.75, 1.2, 0.85][m];
    var sl = 2 * 0.00078 * (DATA[di][0] - 817), a = Math.atan2(1, -sl) + 0.9 * (r() - 0.5), q = up ? -1 : 1;
    return { sx: DATA[di][0], sy: DATA[di][1], x: DATA[di][0] + q * SIG * sc * Math.cos(a), y: DATA[di][1] + q * SIG * sc * Math.sin(a), sc: sc, wa: 2 * PI * r() };
  }
  var gTrain = A.el('g', {}, el), cloud = [];
  for (i = 0; i < 18; i++) cloud.push(A.el('circle', { r: 3.4, fill: '#9a9a9a' }, gTrain));
  var gS = A.el('g', {}, el);                                // one evaluation: the noised point, its arrows, the error
  var errBar = A.el('path', { fill: 'none', stroke: RED, 'stroke-width': 7, 'stroke-linecap': 'round' }, gS);
  var aEps = arrow(gS, '#fff', 3.4), aHat = arrow(gS, BLUE, 3.4, '7 6');
  var ring = A.el('circle', { r: 9, fill: '#101010', stroke: BLUE, 'stroke-width': 3.2 }, gS);
  var srcDot = A.el('circle', { r: 8, fill: GREEN, stroke: '#fff', 'stroke-width': 2.5 }, gS);
  var xi = A.el('circle', { r: 6, fill: '#fff', stroke: '#101010', 'stroke-width': 2 }, gS);
  var errLab = txt(gS, 0, 0, 'error', { size: 21, fill: RED });
  var ringLab = txt(gS, 0, 0, 'the clean clip that ' + MI('f') + ' assumes', { size: 20, fill: BLUE, anchor: 'middle' });
  var gPol = A.el('g', {}, el);
  var pDot = A.el('circle', { r: 10, fill: AMBER, stroke: '#101010', 'stroke-width': 2.5 }, gPol);
  var pLab = txt(gPol, 0, 0, 'the policy’s clip ' + XT, { size: 21, fill: AMBER });
  // generated start states (step 5): denoising paths from pure noise onto the band, precomputed
  var NG = 5, NB = 3, GEN = [], gGen = A.el('g', {}, el), genDot = [], genTrail = [];
  (function () {
    // start points: pure noise, far from the band; they stay clear of the legend row under the panel (y >= 366)
    var r = A.rand(5), b, g, s, START = [[528, 324], [668, 336], [790, 338], [950, 334], [1122, 316], [590, 331], [720, 338], [800, 331], [965, 331], [1140, 276], [505, 286], [700, 336], [775, 340], [985, 334], [1095, 326]];
    for (b = 0; b < NB; b++) for (g = 0; g < NG; g++) {
      var p = START[b * NG + g].slice(), path = [p.slice()];
      for (s = 0; s < 12; s++) {
        var sg = A.lerp(100, 24, s / 11), c = clean(p[0], p[1], sg), kk = 0.3 + 0.05 * s;
        p = [p[0] + kk * (c[0] - p[0]) + (11 - s) * 1.6 * (r() - 0.5), p[1] + kk * (c[1] - p[1]) + (11 - s) * 1.0 * (r() - 0.5)];
        path.push(p.slice());
      }
      GEN.push(path);
    }
    for (g = 0; g < NG; g++) {
      genTrail.push(A.el('path', { fill: 'none', stroke: '#9a9a9a', 'stroke-width': 2.2, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round' }, gGen));
      genDot.push(A.el('circle', { r: 8, fill: '#101010', stroke: '#fff', 'stroke-width': 3 }, gGen));
    }
  })();
  var genLab = txt(gGen, 1160, 74, 'start states: noise, denoised by ' + MI('f'), { size: 21, fill: '#fff', anchor: 'end' });

  // =========================================================================================== right: the reward
  var XL = 1292, XR = 1706, YB = 322, Y1 = 116, EMAX = 3.3, W = 0.36;
  var X = function (e) { return XL + (XR - XL) * Math.min(e, EMAX) / EMAX; }, Y = function (r) { return YB - (YB - Y1) * r; };
  var rOf = function (e) { return Math.exp(-W * e * e); };
  var gR = A.el('g', {}, el);
  A.el('path', { d: 'M' + XL + ' ' + (Y1 - 26) + 'V' + YB + 'H' + (XR + 6), fill: 'none', stroke: '#6a6a6a', 'stroke-width': 2.5 }, gR);
  A.el('line', { x1: XL, y1: Y1, x2: XR, y2: Y1, stroke: C.grid, 'stroke-width': 2 }, gR);
  txt(gR, XL - 12, Y1 + 7, '1', { size: 20, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  txt(gR, XL - 12, YB + 7, '0', { size: 20, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  txt(gR, XL, YB + 30, '0', { size: 20, weight: 500, fill: C.mid, anchor: 'middle', halo: false });
  var yl = txt(gR, 0, 0, 'reward ' + MI('r') + '<tspan dy="-9" style="font-size:.68em">smp</tspan>', { size: 21, fill: C.mid, anchor: 'middle', halo: false });
  yl.setAttribute('transform', 'translate(' + (XL - 40) + ' ' + ((YB + Y1) / 2) + ') rotate(-90)');
  var cp = [];
  for (i = 0; i <= 120; i++) { var e0 = EMAX * i / 120; cp.push([X(e0), Y(rOf(e0))]); }
  var curve = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gR);
  var gEnds = A.el('g', {}, gR);
  txt(gEnds, XL + 26, Y1 - 16, 'like the data', { size: 21, fill: GREEN });
  txt(gEnds, XR, YB - 78, 'not like the data', { size: 21, fill: AMBER, anchor: 'end' });
  var gP = A.el('g', {}, el);
  var pDrop = A.el('line', { stroke: RED, 'stroke-width': 3, 'stroke-opacity': 0.9 }, gP);
  var pMark = A.el('circle', { r: 6, fill: RED }, gP);
  var probe = A.el('circle', { r: 11, fill: AMBER, stroke: '#101010', 'stroke-width': 3 }, gP);

  // =========================================================================================== timing
  var X0 = [872, 296], X1 = [905, 145], FAST = 1.9, NFAST = 5, SLOW = 3.8, HOLD = 5.2;
  var learn = function (ts) { return A.ease(A.ramp(ts, 1.0, FAST * NFAST - 0.5)); };
  function polAt(step, ts) {
    var a = step < 4 ? 0 : (step > 4 ? 1 : learn(ts));
    return [A.lerp(X0[0], X1[0], a), A.lerp(X0[1], X1[1], a), a];
  }
  /** one evaluation of the policy's clip p: the noised point, the clean clip the model assumes, the error in units of the noise scale */
  function evalAt(p, idx) {
    var n = noise(idx + 40, true), x = p[0] + SIG * n[0], y = p[1] + SIG * n[1], c = clean(x, y, SIG);
    return { x: x, y: y, c: c, e: Math.hypot(p[0] - c[0], p[1] - c[1]) / SIG };
  }
  var IEND = (function () {                                  // the evaluation shown once the policy has learned: a typical one (the median error of 41)
    var es = [], k;
    for (k = 0; k < 41; k++) es.push([evalAt(X1, 100 + k).e, 100 + k]);
    es.sort(function (p, q) { return p[0] - q[0]; });
    return es[20][1];
  })();

  return function draw(f) {
    var step = f.step, ts = f.ts, t = f.t, k;
    var pol = polAt(step, ts), a = pol[2];

    // ---- layers
    A.show(gTrain, step === 0 ? 1 : 0);
    A.show(gPol, step === 1 ? A.ramp(ts, 0, 0.5) : (step > 1 ? 1 : 0));
    A.show(sPol.g, step === 1 ? A.ramp(ts, 0, 0.5) : (step > 1 ? 1 : 0));
    A.show(sData.g, step === 0 ? 1 : 0.6);
    A.show(gR, step === 3 ? A.ramp(ts, 0, 0.5) : (step > 3 ? 1 : 0));
    var grow = step === 3 ? A.ease(A.ramp(ts, 0.3, 1.4)) : 1;
    A.set(curve, { d: A.path(cp.slice(0, Math.max(2, Math.round(grow * 120) + 1))) });
    A.show(gEnds, step === 3 ? A.ramp(ts, 1.3, 1.8) : 1);
    A.set(pDot, { cx: pol[0].toFixed(1), cy: pol[1].toFixed(1) });
    // the label stays under the clip: noise, prediction and error are all drawn above it (the noise samples of the policy's clip point upward)
    A.set(pLab, { x: pol[0].toFixed(1), y: (pol[1] + 44).toFixed(1), 'text-anchor': 'middle' });
    A.show(pLab, step === 5 ? 1 - A.ramp(ts, 0, 0.4) : 1);

    // ---- the evaluation cycle
    var idx, u, kick, hat, err, fade, sx, sy, x, y, c, e = 0, ePrev = 0;
    if (step === 0) {                                                          // training on dataset clips
      idx = Math.floor(t / 2.8); u = t - idx * 2.8;
      var sm = sample(idx), good = A.clamp(idx / 3, 0, 1);
      sx = sm.sx; sy = sm.sy; x = sm.x; y = sm.y; c = clean(x, y, SIG * sm.sc);
      c = [A.lerp(x + 80 * Math.cos(sm.wa), c[0], good), A.lerp(y + 80 * Math.sin(sm.wa), c[1], good)];      // the first guesses of an untrained model are wrong
      kick = A.ease(A.ramp(u, 0.1, 0.7)); hat = A.ease(A.ramp(u, 0.9, 1.5)); err = A.ramp(u, 1.6, 1.9); fade = 1 - A.ramp(u, 2.4, 2.8);
      for (k = 0; k < cloud.length; k++) {                                     // the noised copies of earlier samples stay: noise spreads the data over the plane
        var s2 = sample(idx - 1 - k);
        A.set(cloud[k], { cx: s2.x.toFixed(1), cy: s2.y.toFixed(1) }); A.show(cloud[k], 0.7 * (1 - k / cloud.length));
      }
      A.set(srcDot, { cx: sx.toFixed(1), cy: sy.toFixed(1) }); A.show(srcDot, 1);
    } else {
      A.show(srcDot, 0);
      var fast = step === 4 && ts < FAST * NFAST, hold = step === 3 && ts < HOLD, ev;
      if (step === 1) { idx = Math.floor(ts / 2.6); u = ts - idx * 2.6; }
      else if (fast) { idx = Math.floor(ts / FAST); u = ts - idx * FAST; }
      else if (hold) { idx = 0; u = 0; }                                       // click 3 starts on a finished evaluation: its error is the one the curve is read at
      else { var t2 = step === 4 ? ts - FAST * NFAST : (step === 3 ? ts - HOLD : ts); idx = Math.floor(t2 / SLOW); u = t2 - idx * SLOW; if (step === 4) idx += NFAST; if (step === 3) idx += 1; }
      ev = step === 5 ? evalAt(pol, IEND) : evalAt(pol, idx + step * 20); sx = pol[0]; sy = pol[1]; x = ev.x; y = ev.y; c = ev.c; e = ev.e;
      ePrev = idx > 0 && step < 5 ? evalAt(pol, idx - 1 + step * 20).e : e;
      if (step === 1) { kick = A.ease(A.ramp(u, 0.3, 0.9)); hat = 0; err = 0; fade = 1 - A.ramp(u, 2.2, 2.6); }
      else if (fast) { kick = A.ease(A.ramp(u, 0.05, 0.4)); hat = A.ease(A.ramp(u, 0.45, 0.8)); err = A.ramp(u, 0.85, 1.1); fade = 1 - A.ramp(u, 1.65, 1.9); }
      else if (hold) { kick = hat = err = 1; fade = 1 - A.ramp(ts, HOLD - 0.4, HOLD); }
      else { kick = A.ease(A.ramp(u, 0.2, 0.8)); hat = A.ease(A.ramp(u, 1.0, 1.6)); err = A.ramp(u, 1.8, 2.3); fade = 1 - A.ramp(u, 3.4, 3.8); }
      if (step === 5) { kick = hat = err = 1; fade = 1; }                                                      // the last click is about the start states: one finished evaluation stays, still
    }
    A.show(gS, fade);
    aEps.set(sx, sy, x, y, kick);
    A.set(xi, { cx: x.toFixed(1), cy: y.toFixed(1) }); A.show(xi, kick > 0.98 ? 1 : 0);
    aHat.set(c[0], c[1], x, y, hat);
    A.set(ring, { cx: c[0].toFixed(1), cy: c[1].toFixed(1) }); A.show(ring, step === 0 ? 0 : A.ramp(hat, 0, 0.2));
    A.set(errBar, { d: 'M' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + 'L' + A.lerp(c[0], sx, err).toFixed(1) + ' ' + A.lerp(c[1], sy, err).toFixed(1) });
    A.show(errBar, err > 0.02 ? 1 : 0);
    var side = x > (sx + c[0]) / 2 ? -1 : 1;                                   // the label goes on the side of the bar that is free of the arrows
    A.set(errLab, { x: ((sx + c[0]) / 2 + 16 * side).toFixed(1), y: ((sy + c[1]) / 2 + 7).toFixed(1), 'text-anchor': side < 0 ? 'end' : 'start' });
    A.show(errLab, (step === 2 || step === 3) && Math.hypot(sx - c[0], sy - c[1]) > 60 ? A.ramp(err, 0.6, 1) : 0);
    var lx = A.clamp(c[0], 800, 1010);                                         // the ring's label sits above the band, clear of its dots
    A.set(ringLab, { x: lx.toFixed(1), y: (bandY(A.clamp(817, lx - 150, lx + 150)) - 26).toFixed(1) });
    A.show(ringLab, step === 2 || step === 3 ? A.ramp(hat, 0.5, 1) : 0);

    // ---- the strips (left): the window slides along the motion
    var win = 0.9 * t;
    drawStrip(sData, win, 1, step === 0 ? idx : 0, step === 0 ? kick * fade : 0);
    drawStrip(sPol, win + 1.3, a, idx + step * 20, step === 0 || step === 5 ? 0 : kick * fade);

    // ---- probe on the reward curve
    if (step < 3) A.show(gP, 0);
    else {
      var eNow = A.lerp(ePrev, e, err), rNow = rOf(eNow);
      A.show(gP, step === 3 ? A.ramp(ts, 1.6, 2.1) : 1);
      A.set(probe, { cx: X(eNow).toFixed(1), cy: Y(rNow).toFixed(1) });
      A.set(pDrop, { x1: X(eNow).toFixed(1), y1: Y(rNow).toFixed(1), x2: X(eNow).toFixed(1), y2: YB });
      A.set(pMark, { cx: X(eNow).toFixed(1), cy: YB });
    }

    // ---- generated start states
    if (step < 5) A.show(gGen, 0);
    else {
      var PG = 8, bi = Math.floor(ts / PG), ug = ts - bi * PG, vis = Math.min(A.ramp(ug, 0, 0.3), 1 - A.ramp(ug, 7.4, 8));
      A.show(gGen, 1); A.show(genLab, A.ramp(ts, 0.2, 0.8));
      for (k = 0; k < NG; k++) {
        var path = GEN[(bi % NB) * NG + k], pr = A.clamp((ug - 0.3 - 0.35 * k) / 2.6, 0, 1) * (path.length - 1), i0 = Math.min(path.length - 2, Math.floor(pr)), fr = pr - i0;
        var gx = A.lerp(path[i0][0], path[i0 + 1][0], fr), gy = A.lerp(path[i0][1], path[i0 + 1][1], fr), done = pr >= path.length - 1.001;
        A.set(genDot[k], { cx: gx.toFixed(1), cy: gy.toFixed(1), stroke: done ? AMBER : '#fff', r: done ? 9 : 7 }); A.show(genDot[k], vis);
        A.set(genTrail[k], { d: A.path(path.slice(0, i0 + 1).concat([[gx, gy]])) }); A.show(genTrail[k], vis * 0.8);
      }
    }
  };
});
