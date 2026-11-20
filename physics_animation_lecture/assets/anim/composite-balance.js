/* Composite Motion Learning (Xu et al. 2023, section 4.3, Eq. 7-9): why every objective has its own critic.
 *   <svg data-anim="composite-balance" data-at="2" viewBox="0 0 566 228">   on the slide "Composite Motion Learning"; data-at = the build step that reveals it
 * A SCHEMATIC. Three objectives of one task (two imitation rewards and one task reward). Each lane shows the advantages of the samples
 * of a batch for ONE objective, as dots on an axis.
 *   raw            every reward has its own scale (how much the scales differ is illustrative: the paper only says they
 *                  "may differ a lot" and are "unpredictable before training"). The widest lane is drawn for the task and the
 *                  narrowest for the lower body, so that the picture agrees with the paper's ablations of "rewards simply added"
 *                  (section 6.6): the task reward is reached quickly while the imitation objectives are not (Fig. 10), and in
 *                  Punch+Run the policy "almost gives up on learning how to run" (Fig. 9).
 *   standardized   Eq. 8: subtract the mean, divide by the standard deviation -> all lanes have the same spread
 * The bar underneath is each objective's share of the policy update: with raw advantages it follows the spread of the numbers
 * (illustrative), after standardization it is the fixed weight omega_k. The weights 0.25 / 0.25 / 0.5 are the paper's (appendix C):
 * goal-related objectives share 0.5, the imitation objectives share the rest equally: these are the weights of a task with two imitation
 * objectives and ONE goal, such as Target Heading with a punching upper body (Fig. 4a), the example named in the pipeline above the figure.
 * While that step is current the figure goes raw -> standardized and loops; afterwards (and in the still frame) it rests in the standardized state.
 */
DeckAnim.register('composite-balance', function (el, A) {
  'use strict';
  var C = A.C, W = 566, H = 228, STEP = parseInt(el.getAttribute('data-at') || '0', 10);      // data-at: the build step that reveals the figure
  var LANES = [
    { name: 'upper body', col: C.violet, mu: 16, sd: 25, w: 0.25 },
    { name: 'lower body', col: C.blue, mu: -12, sd: 10, w: 0.25 },
    { name: 'task', col: C.amber, mu: 22, sd: 68, w: 0.5 }
  ];
  var X0 = 168, X1 = 546, XC = (X0 + X1) / 2, Y0 = 76, DY = 40, N = 22, UNIT = 58;          // UNIT: px per standard deviation once standardized
  var BY = 182, BH = 26;

  A.el('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 16, fill: C.card, stroke: '#262626' }, el);
  var hRaw = A.text(el, 20, 31, 'raw advantages: each reward on its own scale', { size: 21, halo: false });
  var hStd = A.text(el, 20, 31, 'standardized: (A − mean) / std, for each reward', { size: 21, fill: C.g, halo: false });       // Eq. 8
  A.el('line', { x1: XC, y1: 50, x2: XC, y2: Y0 + 2 * DY + 16, stroke: '#4a4a4a', 'stroke-width': 2, 'stroke-dasharray': '3 5' }, el);
  A.text(el, XC + 9, 62, '0', { size: 20, weight: 500, fill: C.mid, halo: false });

  var sdSum = 0;
  LANES.forEach(function (L) { sdSum += L.w * L.sd; });
  LANES.forEach(function (L, k) {
    var y = Y0 + k * DY, r = A.rand(41 + 17 * k), z = [], m = 0, v = 0, i;
    A.el('line', { x1: X0, y1: y, x2: X1, y2: y, stroke: '#242424', 'stroke-width': 2 }, el);
    A.text(el, 20, y + 7, L.name, { size: 20, fill: L.col, halo: false });
    for (i = 0; i < N; i++) { z.push(A.gauss(r)); m += z[i] / N; }
    for (i = 0; i < N; i++) v += (z[i] - m) * (z[i] - m) / N;
    L.pts = z.map(function (q, j) {
      var s = (q - m) / Math.sqrt(v);                                       // exactly standardized: mean 0, standard deviation 1
      return { raw: XC + L.mu + L.sd * s, std: XC + UNIT * s, dy: (r() - 0.5) * 16,
               n: A.el('circle', { r: 4.6, fill: L.col, 'fill-opacity': 0.9, stroke: '#101010', 'stroke-width': 1.2 }, el) };
    });
    L.rawShare = L.w * L.sd / sdSum;
    L.seg = A.el('rect', { y: BY, height: BH, rx: 5, fill: L.col }, el);
    L.lab = A.el('text', { y: BY + 19, 'text-anchor': 'middle', style: 'font:700 20px ' + A.FONT + ';fill:#000' }, el);
    L.lab.innerHTML = '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.15em">ω</tspan> = ' + L.w;
  });
  A.text(el, 20, BY + 19, 'policy update', { size: 20, weight: 500, fill: C.mid, halo: false });

  return function draw(f) {
    var m = 1;                                                              // 0 raw ... 1 standardized
    if (f.step === STEP) {
      var u = A.loop(f.ts, 11);
      m = A.ease(A.ramp(u, 3.0, 4.6)) - A.ease(A.ramp(u, 10.2, 11));
    } else if (f.step < STEP) { m = 0; }
    A.show(hRaw, 1 - A.ramp(m, 0.15, 0.45)); A.show(hStd, A.ramp(m, 0.55, 0.85));          // one headline fades out before the other fades in
    var x = X0, GAP = 4, full = X1 - X0 - 2 * GAP;
    LANES.forEach(function (L, k) {
      var y = Y0 + k * DY;
      L.pts.forEach(function (p) {
        A.set(p.n, { cx: A.clamp(A.lerp(p.raw, p.std, m), X0 + 5, X1 - 5).toFixed(1), cy: (y + p.dy).toFixed(1) });
      });
      var w = full * A.lerp(L.rawShare, L.w, m);
      A.set(L.seg, { x: x.toFixed(1), width: w.toFixed(1) });
      A.set(L.lab, { x: (x + w / 2).toFixed(1) });
      A.show(L.lab, A.ramp(m, 0.8, 1));
      x += w + GAP;
    });
  };
});
