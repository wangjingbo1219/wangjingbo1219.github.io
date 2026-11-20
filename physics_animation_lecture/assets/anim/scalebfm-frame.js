/* Slide "ScaleBFM — how", before the first click: why the reference is tracked in the global frame.   <svg data-anim="scalebfm-frame" viewBox="0 0 1740 334">
 * SCHEMATIC of the paper's argument (Sec. 1 and Sec. 3.2, Reward Design), no data. The stick figures are a made-up walk cycle.
 *   left card   two reference motions as a reward without root position sees them: "walk forward" and "march in place" are the
 *               same sequence of poses (paper: they "may become indistinguishable", "nearly identical learning guidance")
 *   right card  the global frame. The reference (green) walks forward. A robot (white) that only steps on the spot falls behind with
 *               every link; when a link is 0.5 m from the reference the episode ends (the paper's termination threshold, Sec. 3.3)
 *               and the robot is put back on the reference (reference state initialization next to the termination point).
 *               Then it walks with the reference and every link is on its target.
 * Scale of the right card: the figure is 136 px tall for the G1's 1.3 m, so 0.5 m = 52.3 px. The two numbers in the footer are
 * Table 3 of the paper (BFM-Bym and BFM-Global, G-MPKPE, Ours Test Set).
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('scalebfm-frame', function (el, A) {
  'use strict';
  var SB = window.SBF, C = A.C, G = C.g, AM = C.amber, RED = '#ff6b5e';
  var H = 136, GY = 214, HALF = 0.5 * H / 1.3;                 // body height in px, ground line, 0.5 m in px
  var XS = 670, T1 = 1.0, T2 = 2.6, T3 = 3.6, T4 = 7.6, P = 8.3;   // where the right-hand walk starts; ends of its four phases, loop period
  // ---- left card: root position left out
  SB.card(A, el, 0, 0, 540, 334);
  SB.txt(A, el, 24, 42, 'Root position left out', { size: 25, weight: 700, fill: AM });
  var tread = A.el('path', { d: 'M56 ' + (GY + 7) + 'H224', fill: 'none', stroke: '#5a5a5a', 'stroke-width': 4, 'stroke-dasharray': '14 12', 'stroke-linecap': 'round' }, el);
  A.el('path', { d: 'M316 ' + (GY + 7) + 'H484', fill: 'none', stroke: '#5a5a5a', 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var wa = SB.walker(A, el, G, 7, H), wb = SB.walker(A, el, G, 7, H);
  SB.txt(A, el, 140, GY + 42, 'walk forward', { size: 22, weight: 700, anchor: 'middle' });
  SB.txt(A, el, 400, GY + 42, 'march in place', { size: 22, weight: 700, anchor: 'middle' });
  SB.txt(A, el, 270, 166, '=', { size: 46, weight: 700, anchor: 'middle', fill: C.mid });
  SB.txt(A, el, 24, 314, 'Same poses: nearly the same learning signal.', { size: 21, fill: C.mid });
  // ---- right card: the global frame
  SB.card(A, el, 564, 0, 1176, 334);
  SB.txt(A, el, 588, 42, 'Global frame: root and pose are one trajectory', { size: 25, weight: 700, fill: G });
  SB.txt(A, el, 1716, 42, 'green: reference · white: robot · amber: link errors', { size: 20, fill: C.mid, anchor: 'end' });
  A.el('path', { d: 'M600 ' + (GY + 7) + 'H1190', fill: 'none', stroke: '#5a5a5a', 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var dim = A.el('g', {}, el);
  A.el('path', { d: 'M' + XS + ' ' + (GY + 16) + 'v8H' + (XS + HALF).toFixed(1) + 'v-8', fill: 'none', stroke: AM, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, dim);
  SB.txt(A, dim, XS + HALF / 2, GY + 48, '0.5 m', { size: 20, weight: 700, fill: AM, anchor: 'middle' });
  var errs = [], LK = ['head', 'ha1', 'ha2', 'ft1', 'ft2', 'hip'], i;
  for (i = 0; i < LK.length; i++) errs.push(A.el('path', { fill: 'none', stroke: AM, 'stroke-width': 2.5, 'stroke-dasharray': '5 5', 'stroke-linecap': 'round' }, el));
  var ref = SB.walker(A, el, G, 12, H), rob = SB.walker(A, el, '#f2f2f2', 5.5, H);      // the reference is drawn wider: it stays visible behind a robot that is on it
  var st = [
    ['Stepping on the spot', 'every link falls behind its target', '#fff'],
    ['A link is 0.5 m off', 'the episode ends', RED],
    ['Restart on the reference', 'at the state next to where it ended', '#fff'],
    ['Walking with the reference', 'every link is on its target', G]
  ].map(function (s) {
    var g = A.el('g', {}, el);
    SB.txt(A, g, 1226, 122, s[0], { size: 27, weight: 700, fill: s[2] });
    SB.txt(A, g, 1226, 158, s[1], { size: 22, fill: '#dcdcdc' });
    return g;
  });
  SB.txt(A, el, 588, 298, 'The paper’s ablation: same pipeline, whole-body mode, ‘Ours’ test set, MuJoCo.', { size: 20, fill: C.mute });
  SB.txt(A, el, 588, 323, 'Global position error: 0.1224 m with BeyondMimic’s reward, 0.0915 m with this one.', { size: 20, fill: '#cfcfcf' });

  return function draw(f) {
    var t = f.t, ph = 2 * Math.PI * t * 0.9;
    // left card: the same cycle twice; under "walk forward" the ground runs backwards
    wa.set(SB.side(ph, 140, GY, H)); wb.set(SB.side(ph, 400, GY, H));
    A.set(tread, { 'stroke-dashoffset': (t * 60 % 26).toFixed(1) });
    // right card
    var u = A.loop(t, P), xr, xo, pr, po, oRef = 1, oRob = 1, phase;
    if (u < T1) { phase = 0; pr = 2 * Math.PI * u; po = pr; xr = XS + HALF * u / T1; xo = XS; }            // the reference walks 0.5 m, the robot steps on the spot
    else if (u < T2) { phase = 1; pr = 2 * Math.PI * T1; po = pr; xr = XS + HALF; xo = XS; }                // frozen: the episode has ended
    else if (u < T3) {                                                                                      // the robot is put back on the reference
      phase = 2; pr = 2 * Math.PI * T1; po = pr; xr = XS + HALF; xo = XS;
      if (u < T2 + 0.35) oRob = 1 - A.ramp(u, T2, T2 + 0.35); else { xo = xr; oRob = A.ramp(u, T2 + 0.35, T2 + 0.7); }
    } else if (u < T4) { phase = 3; pr = 2 * Math.PI * (T1 + 1.5 * (u - T3)); po = pr; xr = XS + HALF + 104 * (u - T3); xo = xr; }
    else if (u < T4 + 0.35) { phase = 3; pr = 2 * Math.PI * (T1 + 1.5 * (T4 - T3)); po = pr; xr = XS + HALF + 104 * (T4 - T3); xo = xr; oRef = oRob = 1 - A.ramp(u, T4, T4 + 0.35); }
    else { phase = 0; pr = 0; po = 0; xr = XS; xo = XS; oRef = oRob = A.ramp(u, T4 + 0.4, P); }
    var jr = SB.side(pr, xr, GY, H), jo = SB.side(po, xo, GY, H);
    ref.set(jr, 0.8 * oRef); rob.set(jo, oRob);
    var far = Math.abs(xr - xo) > 1, col = phase === 1 ? RED : AM;
    for (i = 0; i < LK.length; i++) {
      A.set(errs[i], { d: far ? 'M' + jo[LK[i]][0].toFixed(1) + ' ' + jo[LK[i]][1].toFixed(1) + 'L' + jr[LK[i]][0].toFixed(1) + ' ' + jr[LK[i]][1].toFixed(1) : '', stroke: col,
        'stroke-width': phase === 1 ? 3.5 : 2.5 });
      A.show(errs[i], far ? Math.min(oRef, oRob) : 0);
    }
    A.show(dim, u < T2 + 0.35 ? 1 : (u > T4 + 0.4 ? A.ramp(u, T4 + 0.4, P) : 0));
    for (i = 0; i < 4; i++) A.show(st[i], i === phase ? 1 : 0);
  };
});
