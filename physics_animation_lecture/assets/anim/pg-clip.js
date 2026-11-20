/*! "PPO in pictures: the clipped objective", right panel (slide 01_13_ppo.py).
 *  x: rho = new / old probability of the sampled action (the same rho the left panel shows, PGKit.sweep).
 *  y: PPO's objective for that one sample, min(rho A, clip(rho, 1 - eps, 1 + eps) A), with eps = 0.2 and A = +1 or -1.
 *  step 0: the frame and a cursor at rho.   step 1: the good action (A = +1): the marker climbs, then the curve is flat.
 *  step 2: the bad action (A = -1): flat below 1 - eps, and the penalty keeps growing above.   step 3: both.
 *  The arrow on a marker is the gradient: which way this sample pushes its own probability (legend: "the sample's push").
 *  It vanishes on the flat part. */
DeckAnim.register('pg-clip', function (el, A) {
  'use strict';
  var K = window.PGKit, W = 806, H = 404, L = 86, T = 14, R = 24, B = 66, Y0 = -2.3, Y1 = 2.0;
  function X(r) { return L + r / 2 * (W - L - R); }
  function Y(v) { return H - B - (v - Y0) / (Y1 - Y0) * (H - T - B); }
  var SP = String.fromCharCode(0x2009);          // thin space: keeps the halo of the italic symbol off the bracket before it
  var TK = 'font:500 20px ' + A.FONT + ';fill:' + A.C.mid, AX = 'font:700 21px ' + A.FONT + ';fill:' + A.C.mid;

  // frame: grid, ticks, axes, the three guides
  [-1, 0, 1].forEach(function (v) {
    A.el('line', { x1: L, y1: Y(v), x2: W - R, y2: Y(v), stroke: A.C.grid, 'stroke-width': 2 }, el);
    A.el('text', { x: L - 12, y: Y(v) + 7, 'text-anchor': 'end', style: TK, text: K.fmt(v, 0) }, el);
  });
  [0, 0.5, 1, 1.5, 2].forEach(function (v) {
    A.el('line', { x1: X(v), y1: H - B, x2: X(v), y2: H - B + 7, stroke: A.C.line, 'stroke-width': 2 }, el);
    A.el('text', { x: X(v), y: H - B + 30, 'text-anchor': 'middle', style: TK, text: String(v) }, el);
  });
  A.el('path', { d: 'M' + L + ' ' + T + ' V' + (H - B) + ' H' + (W - R), fill: 'none', stroke: A.C.line, 'stroke-width': 2 }, el);
  [1 - K.EPS, 1, 1 + K.EPS].forEach(function (v) {
    A.el('line', { x1: X(v), y1: H - B, x2: X(v), y2: Y(1.62), stroke: '#555', 'stroke-width': 2, 'stroke-dasharray': '4 7' }, el);
  });
  A.set(A.text(el, X(1 - K.EPS), Y(1.74), '', { size: 20, anchor: 'middle', fill: A.C.mid }), { html: '1 − ' + K.mi('ε') + ' = ' + K.fmt(1 - K.EPS, 1) });
  A.set(A.text(el, X(1 + K.EPS), Y(1.74), '', { size: 20, anchor: 'middle', fill: A.C.mid }), { html: '1 + ' + K.mi('ε') + ' = ' + K.fmt(1 + K.EPS, 1) });
  A.set(A.el('text', { x: (L + W - R) / 2, y: H - 8, 'text-anchor': 'middle', style: AX }, el), { html: K.mi('ρ') + ' = new probability / old probability' });
  A.el('text', { transform: 'translate(26 ' + ((T + H - B) / 2) + ') rotate(-90)', 'text-anchor': 'middle', style: AX, text: 'clipped objective' }, el);

  // cursor at rho (under the curves and the annotations)
  var cur = A.el('line', { y1: H - B, y2: Y(1.62), stroke: '#8a8a8a', 'stroke-width': 2 }, el);

  // curves (drawn by dash-offset when their step arrives), annotations
  function curve(adv, col) {
    var p = [], r;
    for (r = 0; r <= 2.0001; r += 0.01) p.push([X(r), Y(K.obj(r, adv))]);
    var n = A.el('path', { d: A.path(p), fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
    var len = n.getTotalLength ? n.getTotalLength() : 900;
    A.set(n, { 'stroke-dasharray': len + ' ' + len });
    return { n: n, len: len };
  }
  var cg = curve(1, A.C.g), cb = curve(-1, A.C.amber);
  var tg = [A.text(el, X(1.97), Y(0.72), '', { size: 21, anchor: 'end', fill: A.C.g }), A.text(el, X(1.97), Y(0.72) + 28, '', { size: 21, anchor: 'end', fill: A.C.g })];
  A.set(tg[0], { html: 'good action (' + SP + K.mi('Â') + ' &gt; 0):' }); A.set(tg[1], { html: 'credit stops at 1 + ' + K.mi('ε') });
  var tb = [A.text(el, X(1.97), Y(-0.52), '', { size: 21, anchor: 'end', fill: A.C.amber }), A.text(el, X(1.97), Y(-0.52) + 28, '', { size: 21, anchor: 'end', fill: A.C.amber })];
  A.set(tb[0], { html: 'bad action (' + SP + K.mi('Â') + ' &lt; 0):' }); A.set(tb[1], { html: 'penalty keeps growing' });

  // read-out, markers with their gradient arrows
  var cdot = A.el('circle', { cy: H - B, r: 7, fill: A.C.white, stroke: '#101010', 'stroke-width': 2 }, el);
  var ro = A.text(el, X(0.06), Y(-1.5), '', { size: 26 });
  var legA = A.el('g', null, el);                 // what the arrow on a marker means (appears with the first marker)
  A.el('path', { d: 'M' + X(0.06) + ' ' + (Y(-1.95) - 7) + ' h30 ' + K.head(X(0.06) + 30, Y(-1.95) - 7, 1, 0, 9), fill: 'none', stroke: A.C.mid, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, legA);
  A.text(legA, X(0.06) + 42, Y(-1.95), "the sample's push", { size: 20, fill: A.C.mid, weight: 500 });
  function marker(col) {
    return { a: A.el('path', { fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el),
             c: A.el('circle', { r: 10, fill: col, stroke: '#101010', 'stroke-width': 3 }, el) };
  }
  var mg = marker(A.C.g), mb = marker(A.C.amber);
  var SX = (W - L - R) / 2, SY = (H - T - B) / (Y1 - Y0);          // px per unit of rho / of objective
  function place(m, rho, adv, o) {
    var x = X(rho), y = Y(K.obj(rho, adv));
    // gradient of the objective with respect to rho: adv on the sloped part, 0 on the flat part
    var flat = adv > 0 ? rho > 1 + K.EPS : rho < 1 - K.EPS;
    var edge = adv > 0 ? (1 + K.EPS - rho) : (rho - (1 - K.EPS));          // distance to the kink, to fade the arrow there
    var dx = adv * SX, dy = -Math.abs(adv) * SY, l = Math.sqrt(dx * dx + dy * dy), ux = dx / l, uy = dy / l, LEN = 76;
    var x1 = x + ux * 16, y1 = y + uy * 16, x2 = x + ux * LEN, y2 = y + uy * LEN;
    A.set(m.a, { d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' ' + K.head(x2, y2, ux, uy, 15) });
    A.show(m.a, flat ? 0 : o * A.ramp(edge, 0, 0.05));
    A.set(m.c, { cx: x, cy: y }); A.show(m.c, o);
  }
  function grow(c, p) { A.set(c.n, { 'stroke-dashoffset': (c.len * (1 - p)).toFixed(1) }); A.show(c.n, p > 0 ? 1 : 0); }

  return function draw(f) {
    var mode = (f.step === 1 || f.step === 2) ? f.step : 0, last = f.step >= 3;
    var rho = K.rho(K.sweep(mode, f.ts));
    A.set(cur, { x1: X(rho), x2: X(rho) }); A.set(cdot, { cx: X(rho) });
    A.show(cur, f.step < 1 ? 1 : 0);          // once a curve is there, its marker shows where rho is; a line would cross the labels
    K.html(ro, K.mi('ρ') + ' = ' + K.fmt(rho, 2));
    var pg = f.step > 1 ? 1 : (f.step === 1 ? A.ease(A.ramp(f.ts, 0.1, 1.3)) : 0);
    var pb = f.step > 2 ? 1 : (f.step === 2 ? A.ease(A.ramp(f.ts, 0.1, 1.3)) : 0);
    grow(cg, pg); grow(cb, pb);
    var og = f.step > 1 ? 1 : (f.step === 1 ? A.ramp(f.ts, 0.9, 1.5) : 0), ob = f.step > 2 ? 1 : (f.step === 2 ? A.ramp(f.ts, 0.9, 1.5) : 0);
    A.show(tg[0], og); A.show(tg[1], og); A.show(tb[0], ob); A.show(tb[1], ob);
    A.show(legA, og);
    // the marker rides the curve that is being explained; on the fully built slide both ride
    place(mg, rho, 1, (f.step === 1 || last) ? og : 0);
    place(mb, rho, -1, (f.step === 2 || last) ? ob : 0);
  };
});
