/* Composite Motion Learning (Xu et al. 2023, section 6.6): what reusing a frozen locomotion policy saves.
 *   <svg data-anim="composite-cost" data-at="2" viewBox="0 0 566 228">   on the slide "Composite — results"; data-at = the build step that reveals it
 * Two bars drawn to scale, in training samples, for the Aiming+Run task:
 *   with incremental learning   about 20 M samples, 1.5 h
 *   without it                  "about 20 more hours" and "about 300 million more samples to achieve a similar performance": 20 M + 300 M
 * Both bars grow at the same speed when the step is revealed: the short one is done at once, the long one keeps going.
 */
DeckAnim.register('composite-cost', function (el, A) {
  'use strict';
  var C = A.C, W = 566, H = 228, STEP = parseInt(el.getAttribute('data-at') || '0', 10);
  var X0 = 22, FULL = W - 2 * X0, MAXM = 320, SPEED = 300, PX = FULL / MAXM;                          // SPEED: px per second; PX: px per million samples
  var ROWS = [
    { y: 24, name: 'with the frozen locomotion policy', m: 20, val: 'about 20 M samples · 1.5 h', vcol: C.g },
    { y: 126, name: 'without it', m: 320, val: 'about 300 M more samples · 20 h more', vcol: '#dcdcdc' }
  ];
  A.el('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 16, fill: C.card, stroke: '#262626' }, el);
  ROWS.forEach(function (R) {
    A.text(el, X0, R.y + 16, R.name, { size: 21, halo: false });
    A.el('rect', { x: X0, y: R.y + 28, width: FULL, height: 24, rx: 5, fill: '#1c1c1c' }, el);
    R.more = A.el('rect', { x: X0, y: R.y + 28, width: 0, height: 24, rx: 5, fill: '#9a9a9a' }, el);       // the samples beyond the first 20 M
    R.bar = A.el('rect', { x: X0, y: R.y + 28, width: 0, height: 24, rx: 5, fill: C.g }, el);              // the first 20 M samples
    R.txt = A.text(el, X0, R.y + 78, R.val, { size: 21, fill: R.vcol, halo: false });
    R.len = PX * R.m;
  });
  return function draw(f) {
    var t = f.step > STEP ? 1e3 : (f.step === STEP ? f.ts - 0.4 : -1);
    ROWS.forEach(function (R) {
      var w = A.clamp(t * SPEED, 0, R.len);
      A.set(R.bar, { width: Math.min(w, PX * 20).toFixed(1) });
      A.set(R.more, { width: w.toFixed(1) });
      A.show(R.txt, t < 0 ? 0 : A.ramp(t, R.len / SPEED, R.len / SPEED + 0.4));
    });
  };
});
