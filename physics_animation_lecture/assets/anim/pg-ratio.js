/*! PPO's probability ratio and its clip (slide 01_12_pg.py, row 3).
 *  Old policy N(0.35, 0.22) over one joint's target angle, one sampled action a = 0.6 rad. The new policy slides; the two
 *  bars at a are pi_old(a) and pi_new(a); rho is their ratio. The gauge shows rho and what clip(rho, 0.8, 1.2) keeps of it. */
DeckAnim.register('pg-ratio', function (el, A) {
  'use strict';
  var K = window.PGKit, YB = 150, BH = 100, AMIN = -0.75, AMAX = 1.25, NEW = A.C.blue;
  function X(a) { return 40 + (a - AMIN) / (AMAX - AMIN) * 500; }
  function GX(r) { return 600 + (r - 0.4) / 1.4 * 270; }
  var xa = X(K.ACT), hOld = BH * K.g((K.ACT - K.MU) / K.SG);

  // legend
  A.el('line', { x1: 40, y1: 23, x2: 84, y2: 23, stroke: A.C.white, 'stroke-width': 3, 'stroke-dasharray': '5 7', 'stroke-linecap': 'round' }, el);
  A.text(el, 94, 30, 'old policy', { size: 20, halo: false });
  A.el('line', { x1: 40, y1: 53, x2: 84, y2: 53, stroke: NEW, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  A.text(el, 94, 60, 'new policy', { size: 20, halo: false, fill: NEW });

  // action axis, the two bells, the two bars at the sampled action
  A.el('line', { x1: 30, y1: YB, x2: 550, y2: YB, stroke: A.C.line, 'stroke-width': 2 }, el);
  A.el('path', { d: K.bell(X, YB, BH, K.MU, K.SG, AMIN, AMAX), fill: 'none', stroke: A.C.white, 'stroke-width': 3, 'stroke-dasharray': '5 7', 'stroke-linecap': 'round' }, el);
  var nb = A.el('path', { fill: 'none', stroke: NEW, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  A.el('rect', { x: xa - 12, y: YB - hOld, width: 11, height: hOld, fill: A.C.white }, el);
  var bNew = A.el('rect', { x: xa + 1, width: 11, fill: NEW }, el);
  A.el('circle', { cx: xa, cy: YB, r: 8, fill: A.C.white, stroke: '#101010', 'stroke-width': 2 }, el);
  A.set(A.text(el, xa, 182, '', { size: 20, anchor: 'middle', halo: false }), { html: 'the action that was taken, ' + K.mi('a') });

  // gauge: rho on a scale, the band 1 - eps .. 1 + eps
  var ro = A.text(el, 600, 40, '', { size: 23, halo: false });
  A.el('rect', { x: 600, y: 97, width: 270, height: 14, rx: 7, fill: '#2a2a2a' }, el);
  A.el('rect', { x: GX(0.8), y: 91, width: GX(1.2) - GX(0.8), height: 26, rx: 5, fill: '#ffffff', 'fill-opacity': 0.16, stroke: A.C.white, 'stroke-width': 2 }, el);
  A.set(A.text(el, GX(1), 80, '', { size: 20, anchor: 'middle', halo: false }), { html: K.mi('ε') + ' = 0.2' });
  [[0.8, '0.8'], [1, '1'], [1.2, '1.2']].forEach(function (t) {
    A.el('text', { x: GX(t[0]), y: 142, 'text-anchor': 'middle', style: 'font:500 20px ' + A.FONT + ';fill:' + A.C.mid, text: t[1] }, el);
  });
  var link = A.el('line', { y1: 104, y2: 104, stroke: A.C.mid, 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }, el);
  var mk = A.el('circle', { cy: 104, r: 8, fill: '#101010', stroke: A.C.white, 'stroke-width': 3 }, el);       // rho itself
  var mc = A.el('circle', { cy: 104, r: 9, fill: NEW, stroke: '#101010', 'stroke-width': 2 }, el);              // what the clip keeps
  var co = A.text(el, 600, 182, '', { size: 20, halo: false });

  var KEYS = [[0, 0], [2.2, 0.657], [3.2, 0.657], [5.8, -0.5], [6.8, -0.5], [8.4, 0]];
  function frame(ts) {
    var d = K.keys(ts, KEYS), mu = K.MU + d * K.SG, rho = K.rho(d), cl = A.clamp(rho, 1 - K.EPS, 1 + K.EPS), out = Math.abs(rho - cl) > 0.004;
    var hNew = BH * K.g((K.ACT - mu) / K.SG);
    A.set(nb, { d: K.bell(X, YB, BH, mu, K.SG, AMIN, AMAX) });
    A.set(bNew, { y: YB - hNew, height: hNew });
    K.html(ro, K.mi('ρ') + ' = ' + K.col('new', NEW) + ' / old = ' + K.fmt(rho, 2));
    A.set(mk, { cx: GX(rho) }); A.set(mc, { cx: GX(cl) });
    A.set(link, { x1: GX(cl), x2: GX(rho) }); A.show(link, out ? 1 : 0);
    K.html(co, 'clip(' + K.mi('ρ') + ', 0.8, 1.2) = ' + K.col(K.fmt(cl, 2), NEW));
  }
  var STILL = 2.7;                          // rho = 1.70, clipped to 1.2
  return function draw(f) {
    frame((f.step === 3 || f.step >= f.steps) ? f.ts : STILL);
  };
});
