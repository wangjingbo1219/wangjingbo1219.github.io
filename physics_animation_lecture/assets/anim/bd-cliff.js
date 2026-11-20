/* "Contact is non-smooth": where the ball ends up, against the scale of the action.
 * Every dot is one simulation of tools/fig/bd_touch.py (`sweep`): the same action multiplied by 0.96 ... 1.04; y = how far the ball
 * has moved at the end. Below about 1.004 the hand never reaches the ball (0 m); above it the ball is knocked off its stand.
 * The points come from the slide (data-pts='[[scale, metres], ...]'), so the chart shows the numbers the script printed.
 * Markup: <svg data-anim="bd-cliff" data-step="1" data-pts="..." viewBox="0 0 562 176">   data-step = the click that brings the chart in */
DeckAnim.register('bd-cliff', function (el, A) {
  var P = JSON.parse(el.getAttribute('data-pts')), K = parseInt(el.getAttribute('data-step') || '1', 10);
  var L = 74, R = 40, T = 14, B = 54, W = 562, H = 176, X0 = 0.96, X1 = 1.04, Y1 = 2.0;
  var X = function (s) { return L + (s - X0) / (X1 - X0) * (W - L - R); };
  var Y = function (m) { return H - B - m / Y1 * (H - T - B); };
  var tk = 'font:500 20px ' + A.FONT + ';fill:' + A.C.mid, ax = 'font:700 20px ' + A.FONT + ';fill:' + A.C.mid;
  [0, 1, 2].forEach(function (v) {
    A.el('line', { x1: L, y1: Y(v), x2: W - R, y2: Y(v), stroke: A.C.grid, 'stroke-width': 2 }, el);
    A.el('text', { x: L - 10, y: Y(v) + 7, 'text-anchor': 'end', text: v + ' m', style: tk }, el);
  });
  [0.96, 0.98, 1.0, 1.02, 1.04].forEach(function (v) {
    A.el('line', { x1: X(v), y1: H - B, x2: X(v), y2: H - B + 6, stroke: A.C.line, 'stroke-width': 2 }, el);
    A.el('text', { x: X(v), y: H - B + 27, 'text-anchor': 'middle', text: '×' + v.toFixed(2), style: tk }, el);
  });
  A.el('path', { d: 'M' + L + ' ' + T + ' V' + (H - B) + ' H' + (W - R), fill: 'none', stroke: A.C.line, 'stroke-width': 2 }, el);
  A.el('text', { x: (L + W - R) / 2, y: H - 3, 'text-anchor': 'middle', text: 'action scale', style: ax }, el);
  A.el('text', { x: L + 12, y: T + 24, text: 'how far the ball moved', style: ax }, el);
  var line = A.el('path', { fill: 'none', stroke: A.C.mute, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, el);
  var dots = P.map(function (p) { return A.el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4.5, fill: A.C.white }, el); });
  // the two runs of the clip
  var pa = null, pb = null;
  P.forEach(function (p) { if (Math.abs(p[0] - 1.0) < 1e-6) pa = p; if (Math.abs(p[0] - 1.01) < 1e-6) pb = p; });
  var ra = A.el('circle', { cx: X(pa[0]), cy: Y(pa[1]), r: 9, fill: 'none', stroke: A.C.white, 'stroke-width': 3.5 }, el);
  var rb = A.el('circle', { cx: X(pb[0]), cy: Y(pb[1]), r: 9, fill: 'none', stroke: A.C.g, 'stroke-width': 3.5 }, el);
  var ta = A.text(el, X(pa[0]) - 16, Y(pa[1]) - 18, 'ball stays', { size: 20, anchor: 'end' });
  var tb = A.text(el, X(pb[0]) + 16, Y(pb[1]) + 30, 'ball falls', { size: 20, fill: A.C.g });
  return function draw(f) {
    var u = f.step > K ? 1 : (f.step < K ? 0 : A.ramp(f.ts, 0.25, 2.6));
    var n = Math.round(u * P.length), pts = [];
    for (var i = 0; i < P.length; i++) {
      A.show(dots[i], i < n ? 1 : 0);
      if (i < n) pts.push([X(P[i][0]), Y(P[i][1])]);
    }
    line.setAttribute('d', pts.length > 1 ? A.path(pts) : '');
    var m = f.step > K ? 1 : (f.step < K ? 0 : A.ramp(f.ts, 2.7, 3.2));
    [ra, rb, ta, tb].forEach(function (e) { A.show(e, m); });
  };
});
