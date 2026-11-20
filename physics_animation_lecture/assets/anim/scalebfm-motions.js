/* Slide "ScaleBFM — how", click 3: the diversity of training data = reference motions.   <svg data-anim="scalebfm-motions" data-step="3" viewBox="0 0 1740 334">
 * All numbers are the paper's; the bar is drawn to scale (1490 px for 101,979,598 frames).
 *   bar        the motion collection by source: frames per dataset from the pie chart of Fig. 2 (48.3M, 10.6M, 7.9M, 1.8M, 1.4M,
 *              0.7M, 0.4M, 30.8M). The six smaller sources are AMASS, SnapMoGen, OMOMO, FineDance, GRAB, LAFAN, in that order.
 *   ticks      the five nested subsets of the reference-motion study with their exact frame counts (App. B.5, Table 8):
 *              XXS, XS, S = one third, two thirds, all of BONES-SEED (without the test split); M = all but Embody3D; L = everything
 *   row 1      behavioral coverage = cluster occupancy rate of the subset (Sec. 4.2.2, Table 1)
 *   rows 2, 3  success rate in whole-body mode on the BONES Test Set (Fig. 6) and on the Ours Test Set (Fig. 7), value labels of
 *              the figures. Training: 64 GPUs x rollout horizon 64, the 3.00M Humanoid Transformer; evaluation in MuJoCo (App. B.5)
 * "homogeneous" / "heterogeneous scaling" are the paper's names for XXS -> S and S -> L (Sec. 4.2.2).
 * Cells are shaded by where the value lies between the worst and the best: coverage on its own scale, the two success rows on one
 * common scale (so that the nearly constant BONES row is not made to look like a trend).
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('scalebfm-motions', function (el, A) {
  'use strict';
  var SB = window.SBF, C = A.C, G = C.g, STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var X0 = 250, WB = 1490, TOT = 101.979598, K = WB / TOT, BY = 52, BH = 52;
  var SUB = [['XXS', 16.159416, '16.2M'], ['XS', 32.230197, '32.2M'], ['S', 48.321234, '48.3M'], ['M', 71.130505, '71.1M'], ['L', 101.979598, '102.0M']];
  var TX = SUB.map(function (s) { return X0 + K * s[1]; });
  var SEG = [['BONES-SEED', 48.321234, '#59b7ec'], ['AMASS', 10.6, '#ff8a80'], ['SnapMoGen', 7.9, '#63d08a'], ['OMOMO', 1.8, '#ffab70'], ['FineDance', 1.4, '#b388ff'],
             ['GRAB', 0.7, '#d0d0d0'], ['LAFAN', 0.4, '#f48fb1']];
  var ROWS = [
    ['Behavior coverage', [0.9365, 0.9350, 0.9365, 0.9825, 0.9995]],
    ['Success, BONES test', [0.9649, 0.9657, 0.9666, 0.9679, 0.9677]],
    ['Success, ‘Ours’ test', [0.9400, 0.9545, 0.9478, 0.9836, 0.9776]]
  ];
  SB.txt(A, el, X0, 36, '102M frames at 50 FPS, retargeted to the G1', { size: 20, fill: C.mid });
  // the bar, revealed from the left through a clip
  var clip = A.el('clipPath', { id: 'sbf-mot-clip' }, el), clipR = A.el('rect', { x: X0, y: BY - 2, height: BH + 4, width: 0 }, clip);
  var bar = A.el('g', { 'clip-path': 'url(#sbf-mot-clip)' }, el), x = X0, i;
  SEG.forEach(function (s) {
    var w = K * s[1];
    A.el('rect', { x: x.toFixed(1), y: BY, width: (w - 1.5).toFixed(1), height: BH, fill: s[2] }, bar);
    x += w;
  });
  A.el('rect', { x: TX[3].toFixed(1), y: BY, width: (TX[4] - TX[3]).toFixed(1), height: BH, fill: '#f2c23a' }, bar);
  [0, 1].forEach(function (k) { A.el('path', { d: 'M' + (TX[k] - 1).toFixed(1) + ' ' + (BY + BH - 10) + 'v10', stroke: '#0c0c0c', 'stroke-width': 3 }, bar); });
  SB.txt(A, bar, (X0 + TX[2]) / 2, BY + 31, 'BONES-SEED · 48.3M frames', { size: 22, weight: 700, anchor: 'middle', fill: '#000' });
  SB.txt(A, bar, (TX[3] + TX[4]) / 2, BY + 31, 'Embody3D · 30.8M', { size: 22, weight: 700, anchor: 'middle', fill: '#000' });
  var six = A.el('g', {}, el);
  A.el('path', { d: 'M' + (TX[2] + 3).toFixed(1) + ' ' + (BY - 6) + 'v-6H' + (TX[3] - 3).toFixed(1) + 'v6', fill: 'none', stroke: '#8a8a8a', 'stroke-width': 2, 'stroke-linejoin': 'round' }, six);
  SB.txt(A, six, (TX[2] + TX[3]) / 2, 32, 'AMASS · SnapMoGen · OMOMO · FineDance · GRAB · LAFAN', { size: 20, fill: '#dcdcdc', anchor: 'middle' });
  // row labels and conditions
  ROWS.forEach(function (r, k) { SB.txt(A, el, 0, 152 + 46 * k + 29, r[0], { size: 21, weight: 700, fill: k === 0 ? C.amber : '#fff' }); });
  SB.txt(A, el, 0, 304, 'Whole-body mode, MuJoCo,', { size: 20, fill: C.mute });
  SB.txt(A, el, 0, 328, '64 GPUs × 64 steps, 3.0M model', { size: 20, fill: C.mute });
  // the five subsets: tick, name, three numbers
  var cols = SUB.map(function (s, k) {
    var g = A.el('g', {}, el), xt = TX[k];
    A.el('path', { d: 'M' + (xt - 1).toFixed(1) + ' ' + (BY + BH) + 'v18', stroke: '#cfcfcf', 'stroke-width': 2 }, g);
    SB.txt(A, g, xt - 6, 142, s[0] + ' <tspan style="font-weight:500;fill:#b8b8b8">· ' + s[2] + '</tspan>', { size: 20, weight: 700, anchor: 'end' });
    ROWS.forEach(function (r, m) {
      var set = m === 0 ? r[1] : ROWS[1][1].concat(ROWS[2][1]), lo = Math.min.apply(null, set), hi = Math.max.apply(null, set), v = r[1][k];   // the two success rows share one scale
      SB.cell(A, g, xt - 150, 152 + 46 * m, 150, 40, v.toFixed(4), (v - lo) / (hi - lo), { size: 23 });
    });
    return g;
  });
  function brace(x1, x2, s) {
    var g = A.el('g', {}, el);
    A.el('path', { d: 'M' + x1.toFixed(1) + ' 292v7H' + x2.toFixed(1) + 'v-7', fill: 'none', stroke: '#8a8a8a', 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
    SB.txt(A, g, (x1 + x2) / 2, 326, s, { size: 20, fill: '#dcdcdc', anchor: 'middle' });
    return g;
  }
  var b1 = brace(TX[0] - 150, TX[2], 'more of BONES-SEED: “homogeneous scaling”'), b2 = brace(TX[3] - 150, TX[4], 'other sources added: “heterogeneous scaling”');

  return function draw(f) {
    var ts = STEP ? SB.since(f, STEP) : f.t;
    // the bar grows in three stages: BONES-SEED, the six smaller sources, Embody3D
    var w = (TX[2] - X0) * A.ease(A.ramp(ts, 0.3, 1.5)) + (TX[3] - TX[2]) * A.ease(A.ramp(ts, 2.6, 3.4)) + (TX[4] - TX[3]) * A.ease(A.ramp(ts, 4.4, 5.2));
    A.set(clipR, { width: w.toFixed(1) });
    [0.7, 1.1, 1.5, 3.4, 5.2].forEach(function (t0, k) { A.show(cols[k], A.ramp(ts, t0, t0 + 0.4)); });
    A.show(six, A.ramp(ts, 2.6, 3.0)); A.show(b1, A.ramp(ts, 1.9, 2.3)); A.show(b2, A.ramp(ts, 5.6, 6.0));
  };
});
