/* Slide "PHC — how" (tools/slides/05a_10_phc.py):  <svg data-anim="phc-blend" viewBox="0 0 390 300">, under the Composer box (revealed at click 2).
 * SCHEMATIC of multiplicative control (Luo et al. 2023, Eq. 5 and 6), for ONE action dimension (the PD target of one joint):
 *   grey bells   the Gaussians of the four primitives, all with the same fixed sigma (the paper's policies have a fixed diagonal covariance)
 *   green bars   the composer's weights w_i >= 0; they are a function of the state, so they change all the time
 *   green bell   the weighted product  prod_i P_i^(w_i):  again a Gaussian, mean = sum(w_i mu_i) / sum(w_i), variance = sigma^2 / sum(w_i)
 *                (drawn with its true shape: narrower and taller when the weights add up to more)
 * The means and the weights are smooth made-up signals; no values are printed. Which primitive is active in which situation is NOT shown
 * in the paper and not suggested here.
 */
DeckAnim.register('phc-blend', function (el, A) {
  'use strict';
  var C = A.C, K = window.PHCKit, YB = 186, H = 56, SG = 30, X0 = 14, X1 = 376, N = 4, i;
  var BASE = [105, 165, 225, 285], NAME = ['1', '2', '3', 'F'], PH = [0.4, 2.1, 3.9, 5.3];
  function bell(mu, sg, h) {
    var s = '', a = Math.max(X0, mu - 3.6 * sg), b = Math.min(X1, mu + 3.6 * sg);
    for (var k = 0; k <= 48; k++) { var x = a + (b - a) * k / 48, z = (x - mu) / sg; s += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + (YB - h * Math.exp(-0.5 * z * z)).toFixed(1); }
    return s;
  }
  // legend
  A.el('path', { d: 'M4 16c7 0 8-12 14-12s7 12 14 12', stroke: '#cfcfcf', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, el);
  K.text(A, el, 40, 21, 'primitives', { fill: C.mid });
  A.el('rect', { x: 152, y: 3, width: 12, height: 15, rx: 3, fill: C.g }, el);
  K.text(A, el, 172, 21, 'weights', { fill: C.mid });
  A.el('path', { d: 'M262 16c7 0 8-12 14-12s7 12 14 12', stroke: C.g, 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round' }, el);
  K.text(A, el, 298, 21, 'action', { fill: C.mid });
  A.el('path', { d: 'M' + X0 + ' ' + YB + 'H' + X1, stroke: C.line, 'stroke-width': 2 }, el);
  var prod = A.el('path', { fill: C.g, 'fill-opacity': 0.22, stroke: C.g, 'stroke-width': 4, 'stroke-linejoin': 'round' }, el);
  var bells = [], bars = [], tags = [];
  for (i = 0; i < N; i++) {
    bells.push(A.el('path', { fill: 'none', stroke: '#cfcfcf', 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'stroke-opacity': 0.85 }, el));
    bars.push(A.el('rect', { width: 16, rx: 4, y: YB + 9, fill: C.g }, el));
    tags.push(K.text(A, el, 0, YB + 86, K.prim(NAME[i]), { anchor: 'middle', weight: 700, size: 22 }));
  }
  var stem = A.el('path', { stroke: C.g, 'stroke-width': 2.5, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }, el);
  K.text(A, el, (X0 + X1) / 2, 296, 'PD target of one joint', { anchor: 'middle', fill: C.mute });

  return function draw(f) {
    var t = f.t, sw = 0, sm = 0, mu = [], w = [];                     // slide time, not step time: the bells do not jump at the next click
    for (i = 0; i < N; i++) {
      mu.push(BASE[i] + 5 * Math.sin(0.8 * t + 1.7 * i));
      var q = 0.5 + 0.5 * Math.sin(0.62 * t + PH[i]);
      w.push(0.06 + 0.94 * q * q);
      sw += w[i]; sm += w[i] * mu[i];
      A.set(bells[i], { d: bell(mu[i], SG, H) });
      A.set(bars[i], { x: (mu[i] - 8).toFixed(1), height: (46 * w[i]).toFixed(1) });
      A.set(tags[i], { x: mu[i].toFixed(1) });
    }
    var m = sm / sw, k = Math.sqrt(sw), hp = Math.min(128, H * k);
    A.set(prod, { d: bell(m, SG / k, hp) + 'Z' });
    A.set(stem, { d: 'M' + m.toFixed(1) + ' ' + (YB - hp + 4).toFixed(1) + 'V' + (YB - 2) });
  };
});
