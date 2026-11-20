/* Slide "The tracking reward, term by term": one kernel curve per term, with the simulated error riding on it.
 *   <svg data-anim="rw-kern" data-k="0..3" viewBox="0 0 450 112">      data-k: index into RW.TERMS; the row appears at build step k + 1
 * x axis: e = sqrt(summed squared error) of that term in the simulated example; curve: exp(-k e^2) exactly as in DeepMimic.
 * The axis and the live error are labelled in the unit the figure's call-outs use (degrees, rad/s, cm); the kernel itself is computed in rad, rad/s, m.
 */
DeckAnim.register('rw-kern', function (el, A) {
  'use strict';
  var RW = window.RW, K = parseInt(el.getAttribute('data-k'), 10), tm = RW.TERMS[K], C = A.C;
  var L = 12, R = 266, T = 8, B = 82;
  var X = function (e) { return L + (R - L) * e / tm.xmax; }, Y = function (v) { return B - (B - T) * v; };
  A.el('path', { d: 'M' + L + ' ' + (T - 4) + 'V' + B + 'H' + (R + 4), fill: 'none', stroke: C.line, 'stroke-width': 2 }, el);
  A.el('line', { x1: L, y1: Y(1), x2: R, y2: Y(1), stroke: C.grid, 'stroke-width': 2, 'stroke-dasharray': '3 7' }, el);
  var pts = [], n = 80, i;
  for (i = 0; i <= n; i++) { var e = tm.xmax * i / n; pts.push([X(e), Y(Math.exp(-tm.k * e * e))]); }
  var curve = A.el('path', { fill: 'none', stroke: tm.col, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  // half-reward mark: a concrete size for the kernel
  var eh = Math.sqrt(Math.LN2 / tm.k), gh = A.el('g', {}, el);
  A.el('line', { x1: X(eh), y1: Y(0.5), x2: X(eh), y2: B, stroke: C.mute, 'stroke-width': 2, 'stroke-dasharray': '3 6' }, gh);
  A.el('circle', { cx: X(eh), cy: Y(0.5), r: 5, fill: '#101010', stroke: C.mid, 'stroke-width': 2.5 }, gh);
  A.text(gh, X(eh) + 12, Y(0.5) + 1, '½ at ' + tm.half, { size: 20, weight: 500, fill: C.mid });
  A.text(el, L, 108, '0', { size: 20, weight: 500, fill: C.mute, anchor: 'middle', halo: false });
  A.text(el, R + 4, 108, tm.xlab, { size: 20, weight: 500, fill: C.mute, anchor: 'end', halo: false });
  var drop = A.el('line', { stroke: tm.col, 'stroke-width': 2.5, 'stroke-opacity': 0.7 }, el);
  var tick = A.el('path', { fill: tm.col }, el);
  var dot = A.el('circle', { r: 9, fill: tm.col, stroke: '#101010', 'stroke-width': 3 }, el);
  var val = A.text(el, 446, 54, '', { size: 46, fill: tm.col, anchor: 'end', halo: false });
  var err = A.text(el, 446, 96, '', { size: 21, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  val.style.fontVariantNumeric = 'tabular-nums';

  return function draw(f) {
    var g = f.step === K + 1 ? A.ease(A.ramp(f.ts, 0.1, 1.0)) : 1;                 // the curve is drawn when its row appears
    var m = Math.max(1, Math.round(g * n));
    A.set(curve, { d: A.path(pts.slice(0, m + 1)) });
    A.show(gh, f.step === K + 1 ? A.ramp(f.ts, 0.9, 1.3) : 1);
    var r = RW.r(f.t), e = Math.sqrt(r.E[K]), ec = Math.min(e, tm.xmax), v = r[K];
    var o = f.step === K + 1 ? A.ramp(f.ts, 0.9, 1.2) : 1;
    A.set(dot, { cx: X(ec), cy: Y(v) }); A.show(dot, o);
    A.set(drop, { x1: X(ec), y1: Y(v), x2: X(ec), y2: B }); A.show(drop, o);
    A.set(tick, { d: 'M' + (X(ec) - 6).toFixed(1) + ' ' + (B + 8) + 'L' + X(ec).toFixed(1) + ' ' + (B + 1) + 'L' + (X(ec) + 6).toFixed(1) + ' ' + (B + 8) + 'Z' }); A.show(tick, o);     // stays above the axis labels
    A.set(val, { text: v.toFixed(2) });
    A.set(err, { text: 'error ' + tm.fmt(e) });
  };
});
