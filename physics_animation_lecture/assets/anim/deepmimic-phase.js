/* DeepMimic, slide "pipeline" (tools/slides/02_20_deepmimic.py), the example of the first stage: what the phase is.
 *   <svg data-anim="deepmimic-phase" viewBox="0 0 560 250">
 * SCHEMATIC. The reference clip as a strip of poses (a run cycle, drawn by hand in deepmimic-0kit.js); a bright figure plays it.
 * The bar under it is the phase: 0 at the start of the clip, 1 at its end, and back to 0 because this clip is cyclic
 * (Peng et al. 2018, section 5.1). The policy is given this one number, not the pose above it. No measured data here. */
DeckAnim.register('deepmimic-phase', function (el, A) {
  'use strict';
  var C = A.C, K = window.DeepMimicKit, X0 = 46, X1 = 514, GY = 116, S = 92, N = 7, T = 3.4, k;
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.2em">' + s + '</tspan>'; };
  function txt(x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'middle', style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || C.mid) }, el);
    n.innerHTML = s;
    return n;
  }
  A.el('line', { x1: 14, y1: GY + 1.5, x2: 546, y2: GY + 1.5, stroke: '#333', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  for (k = 0; k <= N; k++) {                                   // the clip, frame by frame (the last pose is the first one again)
    var g = K.fig(el, C.g, 4);
    g.set(K.run(k / N), X0 + (X1 - X0) * k / N, GY, S);
    A.show(g.g, 0.26);
  }
  var me = K.fig(el, C.g, 5.5);
  // the phase bar
  A.el('line', { x1: X0, y1: 150, x2: X1, y2: 150, stroke: '#3a3a3a', 'stroke-width': 8, 'stroke-linecap': 'round' }, el);
  var fill = A.el('line', { x1: X0, y1: 150, y2: 150, stroke: C.g, 'stroke-width': 8, 'stroke-linecap': 'round' }, el);
  var stem = A.el('line', { y1: GY + 6, y2: 150, stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '3 5', 'stroke-opacity': 0.7 }, el);
  var knob = A.el('circle', { cy: 150, r: 10, fill: '#fff', stroke: '#101010', 'stroke-width': 2 }, el);
  txt(X0, 186, '0', { size: 22, fill: '#fff', weight: 700 });
  txt(X1, 186, '1', { size: 22, fill: '#fff', weight: 700 });
  var val = txt(280, 187, '', { size: 24, fill: '#fff', weight: 700 });
  // the way back: a cyclic clip starts again
  A.el('path', { d: 'M' + X1 + ' 198C' + X1 + ' 224 ' + X0 + ' 224 ' + X0 + ' 200', fill: 'none', stroke: C.mute, 'stroke-width': 2.5, 'stroke-dasharray': '6 6' }, el);
  A.el('path', { d: 'M' + (X0 - 7) + ' 209L' + X0 + ' 198L' + (X0 + 8) + ' 208', fill: 'none', stroke: C.mute, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  txt(280, 243, 'a cyclic clip starts again at 0', { size: 20 });

  return function draw(f) {
    var u = A.loop(f.t, T) / T, x = X0 + (X1 - X0) * u;
    me.set(K.run(u), x, GY, S);
    A.set(fill, { x2: x.toFixed(1) });
    A.set(stem, { x1: x.toFixed(1), x2: x.toFixed(1) });
    A.set(knob, { cx: x.toFixed(1) });
    val.innerHTML = 'phase ' + MI('ϕ') + ' = ' + u.toFixed(2);
  };
});
