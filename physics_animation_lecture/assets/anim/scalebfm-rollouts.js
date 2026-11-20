/* Slide "ScaleBFM — how", click 2: the quantity of training data = on-policy rollouts.   <svg data-anim="scalebfm-rollouts" data-step="2" viewBox="0 0 1740 334">
 * Left card: SCHEMATIC of one PPO update's rollouts as a rectangle, robots in parallel (number of GPUs, 8192 environments each:
 * the paper's "width") by steps per rollout (the rollout horizon: its "depth"). The three squares 32 x 32, 48 x 48 and 64 x 64 are
 * drawn to scale; the fill sweeping to the right is one rollout being collected.
 * Right: the paper's numbers. Scaling on-policy data collection, whole-body mode, Ours Test Set (Fig. 5: the value labels of
 * the success-rate and G-MPKPE panels; each label was matched to its grid point on the two axes of the 3-D plot). Training:
 * BONES-SEED only, the 3.00M Humanoid Transformer, checkpoint after 20,000 training epochs; evaluation in MuJoCo (App. B.4).
 * The paper's figures label seven of the nine grid points; the two others are drawn as empty dashed cells.
 * Cells are shaded by where the value lies between the worst and the best of its table.
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('scalebfm-rollouts', function (el, A) {
  'use strict';
  var SB = window.SBF, C = A.C, G = C.g, STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var LV = [32, 48, 64];
  // values[horizon][gpus], null = no value in the paper
  var SUCC = { 32: { 32: 0.9218, 48: 0.9133, 64: 0.9388 }, 48: { 32: 0.9297, 48: 0.9242, 64: null }, 64: { 32: 0.9436, 48: null, 64: 0.9448 } };
  var GERR = { 32: { 32: 0.1470, 48: 0.1564, 64: 0.1401 }, 48: { 32: 0.1454, 48: 0.1382, 64: null }, 64: { 32: 0.1350, 48: null, 64: 0.1188 } };
  var ORDER = ['32,32', '32,48', '32,64', '48,32', '64,32', '48,48', '64,64'];      // 'horizon,gpus' in the order the cells appear: more GPUs, more steps, then both

  // ---- left card: what is scaled
  SB.card(A, el, 0, 0, 560, 334);
  SB.txt(A, el, 24, 42, 'The rollouts of one PPO update', { size: 25, weight: 700 });
  var X0 = 196, Y0 = 106, U = 3.25;                       // origin of the rectangle, px per unit (GPU or step)
  SB.txt(A, el, X0, 74, 'steps per rollout', { size: 20, fill: C.mid });
  SB.txt(A, el, 24, 128, 'GPUs,', { size: 20, fill: C.mid });
  SB.txt(A, el, 24, 154, '8,192 robots', { size: 20, fill: C.mid });
  SB.txt(A, el, 24, 180, 'on each', { size: 20, fill: C.mid });
  var fill = A.el('rect', { x: X0, y: Y0, fill: '#2f4a08' }, el), rowsG = A.el('g', { stroke: '#4d7a0c', 'stroke-width': 1.5 }, el);
  var k;
  for (k = 1; k < 16; k++) A.el('path', { d: 'M' + X0 + ' ' + (Y0 + k * 64 * U / 16) + 'h' + 64 * U }, rowsG);
  var clip = A.el('clipPath', { id: 'sbf-roll-clip' }, el), clipR = A.el('rect', { x: X0, y: Y0 }, clip);
  rowsG.setAttribute('clip-path', 'url(#sbf-roll-clip)');
  var sq = LV.map(function (v, i) {
    var g = A.el('g', {}, el);
    A.el('rect', { x: X0, y: Y0, width: v * U, height: v * U, fill: 'none', stroke: i === 2 ? G : '#8a8a8a', 'stroke-width': i === 2 ? 3 : 2, 'stroke-dasharray': i === 2 ? 'none' : '6 6' }, g);
    SB.txt(A, g, X0 + v * U, Y0 - 8, String(v), { size: 20, weight: 700, anchor: 'middle', fill: i === 2 ? G : '#cfcfcf' });
    SB.txt(A, g, X0 - 12, Y0 + v * U + 7, String(v), { size: 20, weight: 700, anchor: 'end', fill: i === 2 ? G : '#cfcfcf' });
    return g;
  });
  var now = SB.txt(A, el, X0 + 64 * U + 20, Y0 + 30, '', { size: 22, weight: 700 });
  SB.txt(A, el, X0 + 64 * U + 20, Y0 + 60, 'collected,', { size: 20, fill: C.mid });
  SB.txt(A, el, X0 + 64 * U + 20, Y0 + 86, 'then one', { size: 20, fill: C.mid });
  SB.txt(A, el, X0 + 64 * U + 20, Y0 + 112, 'update', { size: 20, fill: C.mid });

  // ---- right: the two tables
  function table(x0, title, sub, vals, better) {
    var all = [], cells = {}, lo, hi;
    LV.forEach(function (h) { LV.forEach(function (g) { if (vals[h][g] !== null) all.push(vals[h][g]); }); });
    lo = Math.min.apply(null, all); hi = Math.max.apply(null, all);
    SB.txt(A, el, x0, 42, title, { size: 25, weight: 700 });
    SB.txt(A, el, x0 + 522, 42, sub, { size: 20, fill: C.mid, anchor: 'end' });
    LV.forEach(function (g, c) { SB.txt(A, el, x0 + 96 + c * 142 + 68, 78, g + ' GPUs', { size: 20, fill: C.mid, anchor: 'middle' }); });
    LV.slice().reverse().forEach(function (h, r) {
      SB.txt(A, el, x0 + 84, 90 + r * 64 + 37, h + ' steps', { size: 20, fill: C.mid, anchor: 'end' });
      LV.forEach(function (g, c) {
        var v = vals[h][g], u = v === null ? 0 : (v - lo) / (hi - lo);
        cells[h + ',' + g] = SB.cell(A, el, x0 + 96 + c * 142, 90 + r * 64, 136, 58, v === null ? '' : v.toFixed(4), better > 0 ? u : 1 - u,
          { blank: v === null, best: v !== null && v === (better > 0 ? hi : lo), size: 24 });
      });
    });
    return cells;
  }
  var t1 = table(610, 'Success rate', 'higher is better', SUCC, 1), t2 = table(1192, 'Global position error, m', 'lower is better', GERR, -1);
  SB.txt(A, el, 610, 312, 'Whole-body mode · ‘Ours’ test set · MuJoCo · BONES-SEED only · 3.0M model · paper, Fig. 5 · dashed: no value',
    { size: 20, fill: C.mute });

  return function draw(f) {
    var ts = STEP ? SB.since(f, STEP) : f.t, tt = SB.clock(f, STEP);
    // the sweep: 32 x 32, then 48 x 48, then 64 x 64, each collected in 1.6 s and held 0.9 s
    var cyc = A.loop(tt, 7.5), i = Math.min(2, Math.floor(cyc / 2.5)), u = A.ramp(cyc - i * 2.5, 0, 1.6), v = LV[i];
    A.set(fill, { width: (v * U * u).toFixed(1), height: v * U }); A.set(clipR, { width: (v * U * u).toFixed(1), height: v * U });
    now.textContent = v + ' × ' + v;
    sq.forEach(function (g, m) { A.show(g, m === i ? 1 : 0.45); });
    ORDER.forEach(function (key, n) {
      var o = A.ramp(ts, 0.4 + 0.4 * n, 0.8 + 0.4 * n);
      A.show(t1[key], o); A.show(t2[key], o);
    });
    ['48,64', '64,48'].forEach(function (key) { A.show(t1[key], A.ramp(ts, 3.2, 3.6)); A.show(t2[key], A.ramp(ts, 3.2, 3.6)); });
  };
});
