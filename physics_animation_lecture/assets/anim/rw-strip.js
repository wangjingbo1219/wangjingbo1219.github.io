/* Slide "The tracking reward, term by term", last step: the reward of every policy step of the simulated example.
 * One stacked bar per step (30 per second, one loop of the clip): the four weighted terms; the bright bar is "now".
 * (The example has no policy: the reward is evaluated 30 times per second, the rate at which DeepMimic queries its policy.)
 *   <svg data-anim="rw-strip" data-step="5" viewBox="0 0 1060 132">
 */
DeckAnim.register('rw-strip', function (el, A) {
  'use strict';
  var D = window.RW_TRACK, RW = window.RW, C = A.C, n = D.n, AT = parseInt(el.getAttribute('data-step') || '5', 10);
  var X0 = 214, PW = 1056 - X0, pitch = PW / n, bw = pitch - 2.6, T = 26, B = 100;
  var Y = function (v) { return B - (B - T) * v; };
  A.el('line', { x1: X0 - 6, y1: Y(1), x2: X0 + PW, y2: Y(1), stroke: C.line, 'stroke-width': 2, 'stroke-dasharray': '3 7' }, el);
  A.el('line', { x1: X0 - 6, y1: B + 1, x2: X0 + PW, y2: B + 1, stroke: C.line, 'stroke-width': 2 }, el);
  A.text(el, X0 - 14, Y(1) + 7, '1', { size: 20, weight: 500, fill: C.mute, anchor: 'end', halo: false });
  A.text(el, X0 - 14, B + 6, '0', { size: 20, weight: 500, fill: C.mute, anchor: 'end', halo: false });
  A.text(el, X0 + PW / 2, 128, 'one bar = one step · 30 steps per second, the rate of the DeepMimic policy · the clip loops', { size: 20, weight: 500, fill: C.mid, anchor: 'middle', halo: false });
  var bars = [], i, k;
  for (i = 0; i < n; i++) {
    var r = RW.rf(i), g = A.el('g', {}, el), y = 0;
    for (k = 0; k < 4; k++) {
      var h = RW.TERMS[k].w * r[k];
      A.el('rect', { x: (X0 + i * pitch + 1.3).toFixed(1), y: Y(y + h).toFixed(1), width: bw.toFixed(1), height: Math.max(0, (B - T) * h).toFixed(1), fill: RW.TERMS[k].col }, g);
      y += h;
    }
    bars.push(g);
  }
  var cur = A.el('path', { fill: '#fff' }, el);
  var lab = A.el('text', { x: 6, y: 52, style: 'font:700 28px ' + A.FONT + ';fill:' + C.mid }, el);
  lab.innerHTML = '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.25em">r</tspan> now';
  var val = A.text(el, 6, 104, '', { size: 52, fill: '#fff', halo: false });
  val.style.fontVariantNumeric = 'tabular-nums';

  return function draw(f) {
    var p = RW.at(f.t), grow = f.step === AT ? A.ramp(f.ts, 0.1, 1.3) : 1;
    for (var i = 0; i < n; i++) A.show(bars[i], i / n < grow ? (i === p.i0 ? 1 : 0.6) : 0);
    var x = X0 + (p.i0 + 0.5) * pitch;
    A.set(cur, { d: 'M' + (x - 8).toFixed(1) + ' ' + (T - 13) + 'L' + x.toFixed(1) + ' ' + (T - 3) + 'L' + (x + 8).toFixed(1) + ' ' + (T - 13) + 'Z' });
    A.set(val, { text: RW.r(f.t).sum.toFixed(2) });                 // the same blended sample as the four rows above: the number is their weighted sum
  };
});
