/* Slide "Emergence of Locomotion Behaviours" (tools/slides/02_10_heess.py): what the reward measures.
 *   <svg data-anim="heess-reward" viewBox="0 0 440 214">
 * A SCHEMATIC, with no numbers: the track seen from above, the body drifting from side to side as it moves forward.
 * Green arrow = v_x, the speed along the track (the main term of the reward); amber = y, the distance from the centre line
 * (one of the small penalties). Humanoid reward of Heess et al. 2017, arXiv:1707.02286, appendix B.2.
 */
DeckAnim.register('heess-reward', function (el, A) {
  'use strict';
  var C = A.C, W = 440, T0 = 44, T1 = 196, YC = (T0 + T1) / 2, BX = 150, i;
  var MI = function (s, sub) {
    return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.2em">' + s + '</tspan>' +
      (sub ? '<tspan dy="5" style="font-family:' + A.MATH + ';font-style:italic;font-size:.85em">' + sub + '</tspan>' : '');
  };
  function txt(x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 700) + ' ' + (o.size || 21) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') +
      (o.halo ? ';paint-order:stroke;stroke:#151515;stroke-width:7px;stroke-linejoin:round' : '') }, el);
    n.innerHTML = s;
    return n;
  }
  txt(0, 24, 'the track, seen from above', { size: 20, weight: 500, fill: C.mid });
  A.el('rect', { x: 0, y: T0, width: W, height: T1 - T0, fill: '#151515' }, el);
  var ticks = [];
  for (i = 0; i < 9; i++) ticks.push(A.el('path', { fill: 'none', stroke: '#6a6a6a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el));
  A.el('path', { d: 'M0 ' + T0 + 'H' + W + 'M0 ' + T1 + 'H' + W, fill: 'none', stroke: '#8a8a8a', 'stroke-width': 3 }, el);
  A.el('path', { d: 'M0 ' + YC + 'H' + W, fill: 'none', stroke: '#8a8a8a', 'stroke-width': 2, 'stroke-dasharray': '10 9' }, el);
  txt(W - 8, YC - 9, 'centre line', { size: 20, weight: 500, fill: C.mid, anchor: 'end' });
  // distance from the centre line
  var yl = A.el('path', { fill: 'none', stroke: C.amber, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var yt = txt(0, 0, MI('y'), { fill: C.amber, size: 22, anchor: 'end', halo: true });
  // forward speed
  var vl = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var vt = txt(0, 0, MI('v', 'x'), { fill: C.g, size: 22, halo: true });      // the halo keeps the label readable when the body crosses the centre line
  // the body: shoulders and head
  var sh = A.el('ellipse', { rx: 11, ry: 26, fill: '#c9ccd2', stroke: '#0c0c0c', 'stroke-width': 1.5 }, el);
  var hd = A.el('circle', { r: 11, fill: '#fff', stroke: '#0c0c0c', 'stroke-width': 1.5 }, el);
  return function draw(f) {
    var y = YC + 46 * Math.sin(2 * Math.PI * f.t / 7), off = A.loop(f.t * 150, 55), j, d;
    for (j = 0; j < 9; j++) {                                   // marks on both edges slide backwards: the body moves forward
      d = (j * 55 - off).toFixed(1);
      A.set(ticks[j], { d: 'M' + d + ' ' + (T0 + 2) + 'v9M' + d + ' ' + (T1 - 2) + 'v-9' });
    }
    A.set(sh, { cx: BX, cy: y.toFixed(1) }); A.set(hd, { cx: BX + 2, cy: y.toFixed(1) });
    A.set(vl, { d: 'M' + (BX + 20) + ' ' + y.toFixed(1) + 'h96m-12 -9l12 9l-12 9' });
    A.set(vt, { x: BX + 126, y: (y + 7).toFixed(1) });
    A.set(yl, { d: 'M' + (BX - 30) + ' ' + YC + 'V' + y.toFixed(1) + 'M' + (BX - 38) + ' ' + y.toFixed(1) + 'h16M' + (BX - 38) + ' ' + YC + 'h16' });
    A.set(yt, { x: BX - 46, y: ((YC + y) / 2 + 7).toFixed(1) });
    A.show(yl, A.ramp(Math.abs(y - YC), 3, 10)); A.show(yt, A.ramp(Math.abs(y - YC), 16, 24));
  };
});
