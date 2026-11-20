/* Slide "Tennis - how": motion quality of what comes out of each stage of the pipeline.   <svg data-anim="tennis-quality" viewBox="0 0 1740 76">
 * The numbers are Table 3 of the paper (Zhang et al. 2023, "Motion quality evaluation"), nothing else:
 *                               jitter (10^3 m/s^3)   foot sliding (cm)
 *   M_kin    estimated motion          6.08                 7.41        column 1, there from the start (pose estimation)
 *   M_corr   physically corrected      3.14                 1.46        column 2, click 1 (imitation policy)
 *   M_vae    output of the MVAE        0.96                 4.70        column 3, click 2 (motion VAE)
 *   Fed-full the full system           0.51                 1.46        column 4, click 3 (high-level policy, tracked in the simulator)
 * Column 0 holds the row labels. The columns sit under the five clips of the slide (pitch 353 px, clip width 328 px).
 * Each bar is drawn to the scale of its row (the track is the largest value of the row) and grows when its click arrives.
 */
DeckAnim.register('tennis-quality', function (el, A) {
  'use strict';
  var C = A.C, PITCH = 353, TW = 328, BARW = 236, BH = 20, Y = [19, 56];
  var ROWS = [
    { name: 'jitter (10³ m/s³)', col: '#e8e8e8', v: [6.08, 3.14, 0.96, 0.51], max: 6.08 },
    { name: 'foot sliding (cm)', col: C.blue, v: [7.41, 1.46, 4.70, 1.46], max: 7.41 }
  ];
  A.text(el, 0, 45, 'lower is better', { size: 20, weight: 500, fill: C.mute, halo: false });
  var cells = [];
  ROWS.forEach(function (row, r) {
    A.text(el, TW - 2, Y[r] + 7, row.name, { size: 20, weight: 500, fill: row.col, anchor: 'end', halo: false });
    row.v.forEach(function (v, k) {
      var x0 = (k + 1) * PITCH, g = A.el('g', {}, el);
      A.el('rect', { x: x0, y: Y[r] - BH / 2, width: BARW, height: BH, rx: 5, fill: '#141414', stroke: '#2a2a2a', 'stroke-width': 1 }, g);
      var bar = A.el('rect', { x: x0, y: Y[r] - BH / 2, height: BH, rx: 5, fill: row.col }, g);
      var num = A.text(g, x0 + BARW + 10, Y[r] + 8, v.toFixed(2), { size: 22, fill: row.col, halo: false });      // the number sits after the track, so the numbers of a row line up
      cells.push({ g: g, bar: bar, num: num, x0: x0, w: BARW * v / row.max, step: k });
    });
  });
  return function draw(f) {
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var u = f.step > c.step ? 1 : (f.step === c.step ? A.ease(A.ramp(f.ts, 0.25, 1.15)) : 0);
      var on = f.step > c.step ? 1 : (f.step === c.step ? A.ramp(f.ts, 0.05, 0.4) : 0);
      A.show(c.g, on);
      A.set(c.bar, { width: Math.max(0.01, c.w * u).toFixed(1) });
    }
  };
});
