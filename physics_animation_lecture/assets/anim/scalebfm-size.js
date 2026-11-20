/* Slide "ScaleBFM — results", third column: success rate against model size.   <svg data-anim="scalebfm-size" data-step="2" viewBox="0 0 560 315">
 * All numbers are the paper's: the value labels of the success-rate panels of Fig. 9 (whole-body mode) and Fig. 27
 * (root-and-end-effector mode), both on the Ours Test Set, evaluated in MuJoCo. Training: 64 GPUs x rollout horizon 64, all eight
 * datasets (subset L), checkpoint after 22,200 training epochs (App. B.6).
 * Columns are the figures' own ticks: 414K, 3.0M, 4.4M, 9.9M, 11.9M. The Humanoid Transformer has 0.41M, 3.00M, 4.44M and 9.91M
 * parameters, the two MLPs 3.05M and 11.86M: the small MLP sits in the 3.0M column, as in the paper's figures.
 * Cells are shaded by where the value lies between the worst and the best of its row; the ring marks the best of a row.
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('scalebfm-size', function (el, A) {
  'use strict';
  var SB = window.SBF, C = A.C, STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var COLS = ['0.41M', '3.0M', '4.4M', '9.9M', '11.9M'];
  var ROWS = [
    ['Humanoid Transformer', 'Whole-Body Mode', [0.9278, 0.9776, 0.9885, 0.9836, null]],
    ['Humanoid Transformer', 'Root-and-End-Effector Mode', [0.9309, 0.9794, 0.9885, 0.9909, null]],
    ['MLP', 'Whole-Body Mode', [null, 0.9563, null, null, 0.9854]]
  ];
  SB.card(A, el, 0, 0, 560, 315);
  SB.txt(A, el, 22, 36, 'Success rate by number of parameters', { size: 22, weight: 700 });
  COLS.forEach(function (c, k) { SB.txt(A, el, 22 + 104 * k + 50, 68, c, { size: 20, fill: C.mid, anchor: 'middle' }); });
  var all = [];
  ROWS.forEach(function (r) { r[2].forEach(function (v) { if (v !== null) all.push(v); }); });
  var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
  var groups = ROWS.map(function (r, m) {
    var g = A.el('g', {}, el), y = 96 + 72 * m, best = Math.max.apply(null, r[2].filter(function (v) { return v !== null; }));
    SB.txt(A, g, 22, y, r[0] + ' <tspan style="font-weight:500;fill:#b8b8b8">· ' + r[1] + '</tspan>', { size: 20, weight: 700 });
    r[2].forEach(function (v, k) {
      if (v !== null) SB.cell(A, g, 22 + 104 * k, y + 9, 100, 38, v.toFixed(4), (v - lo) / (hi - lo), { size: 22, best: m < 2 && v === best });
    });
    return g;
  });
  return function draw(f) {
    var ts = STEP ? SB.since(f, STEP) : f.t;
    groups.forEach(function (g, m) { A.show(g, A.ramp(ts, 0.3 + 0.6 * m, 0.8 + 0.6 * m)); });
  };
});
