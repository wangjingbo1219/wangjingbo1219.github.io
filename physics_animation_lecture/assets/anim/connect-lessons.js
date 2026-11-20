/* "Three things the decade taught us"  (tools/slides/08_outro.py): one small drawing per card.   <svg data-anim="connect-lessons" data-k="0..2" viewBox="0 0 498 200">
 * SCHEMATICS: nothing here is to scale. The words on them are the ones the deck uses on the lens slide and in the paper recaps.
 *   0  data defines "natural"     a staircase: how much human motion the controller was given (no mocap, 1 clip, 40 hours, 700 hours). The steps are equal: an order, not a chart.
 *   1  tracking is pre-training   one tracker (green = the policy that was trained by RL); dashed amber arrows = distillation into a prior, a latent space, a promptable controller
 *   2  the interface is the product   planner -> interface -> policy: the five interfaces take their turn in the slot between the planner and the policy
 * Card k is revealed at build step k: its scene starts at that click and then repeats.
 * draw(f) is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('connect-lessons', function (el, A) {
  'use strict';
  var C = A.C, K = parseInt(el.getAttribute('data-k'), 10);
  var F = function (size, wt) { return 'font:' + (wt || 700) + ' ' + size + 'px ' + A.FONT; };
  function txt(p, x, y, s, o) {
    o = o || {};
    return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'middle', text: s, style: F(o.size || 20, o.weight) + ';fill:' + (o.fill || '#fff') }, p);
  }
  function head(x, y, a, s) {
    var c = Math.cos(a), n = Math.sin(a), bx = x - s * c, by = y - s * n;
    return 'M' + (bx - 0.62 * s * n).toFixed(1) + ' ' + (by + 0.62 * s * c).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) + 'L' + (bx + 0.62 * s * n).toFixed(1) + ' ' + (by - 0.62 * s * c).toFixed(1);
  }
  function dot(col, r) {
    var g = A.el('g', { opacity: 0 }, el);
    A.el('circle', { r: (r || 5) + 6, fill: col, opacity: 0.35 }, g); A.el('circle', { r: r || 5, fill: '#fff' }, g);
    return g;
  }
  function put(g, x, y, o) { A.set(g, { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' }); A.show(g, o); }
  /** seconds since this card's scene started (-1: the card is not there yet) */
  // a card of an earlier click is built and still moving. Its clock then runs on the slide time, shifted by whole periods of the card's loop
  // (4.6 s, 2.6 s, 7 s), so that the first card does not jump when the second one is clicked.
  var BUILT = [690, 702, 700][K];
  function local(f) { return f.step < K ? -1 : (f.step === K ? (K === 0 ? f.t : f.ts) : BUILT + f.t); }
  /** stroke-dasharray of a dashed line (9 on, 8 off) of which only the first u of its length is drawn yet */
  function dashes(len, u) {
    if (u >= 1) return '9 8';
    var v = len * u, n = Math.floor(v / 17), d = '';
    for (var i = 0; i < n; i++) d += '9 8 ';
    return d + Math.min(9, v - 17 * n).toFixed(1) + ' ' + (len + 20);
  }

  // ------------------------------------------------------------------ 0: the staircase
  if (K === 0) {
    var S = [['no mocap', 'Emergence'], ['1 clip', 'DeepMimic'], ['40 hours', 'PHC'], ['700 hours', 'SONIC']];
    var X0 = 13, W = 118, FLOOR = 170, RISE = 34, Y0 = 148;
    A.el('path', { d: 'M' + X0 + ' ' + FLOOR + ' H' + (X0 + 4 * W), fill: 'none', stroke: '#3a3a3a', 'stroke-width': 2 }, el);
    var steps = S.map(function (s, i) {
      var x = X0 + i * W, y = Y0 - i * RISE, g = A.el('g', null, el);
      var body = A.el('rect', { x: x + 2, y: y, width: W - 4, height: FLOOR - y, fill: C.g, 'fill-opacity': 0.16 }, g);
      var top = A.el('path', { d: 'M' + (x + 2) + ' ' + y + ' H' + (x + W - 2), fill: 'none', stroke: C.g, 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
      return { g: g, body: body, top: top, x: x + W / 2, y: y, lab: txt(g, x + W / 2, y - 12, s[0]), name: txt(el, x + W / 2, FLOOR + 24, s[1], { weight: 500, fill: C.mid }) };
    });
    var walker = dot(C.g, 6);
    return function (f) {
      var t = local(f), i;
      for (i = 0; i < 4; i++) {
        var s = steps[i], ti = t - (0.3 + 0.4 * i), u = A.ease(A.ramp(ti, 0, 0.4)), y = A.lerp(FLOOR, s.y, u);
        A.show(s.g, ti >= 0 ? 1 : 0); A.show(s.name, A.ramp(ti, 0.1, 0.4));
        A.set(s.body, { y: y, height: FLOOR - y }); A.set(s.top, { d: 'M' + (s.x - 57) + ' ' + y + ' H' + (s.x + 57) });
        A.show(s.lab, A.ramp(ti, 0.3, 0.55));
      }
      // the walker climbs once the stairs are there, then again and again
      var q = t < 2.1 ? -1 : A.loop(t - 2.1, 4.6), k = Math.floor(q / 0.6);
      if (q < 0) { A.show(walker, 0); return; }
      if (k >= 3) { put(walker, steps[3].x, steps[3].y - 46, q > 4.2 ? 1 - (q - 4.2) / 0.4 : 1); return; }
      var v = A.ease(A.clamp((q - 0.6 * k) / 0.45, 0, 1)), a = steps[k], b = steps[k + 1];
      put(walker, A.lerp(a.x, b.x, v), A.lerp(a.y, b.y, v) - 46 - 26 * Math.sin(Math.PI * v), q < 0.3 ? q / 0.3 : 1);
    };
  }

  // ------------------------------------------------------------------ 1: one tracker, distilled
  if (K === 1) {
    var TXW = 132, TY = 64, TH = 72, CY = TY + TH / 2, RX = 260, RW = 236, RH = 46, RY = [6, 77, 148], NAMES = ['prior', 'latent space', 'promptable controller'];
    A.el('rect', { x: 2, y: TY, width: TXW, height: TH, rx: 13, fill: C.g }, el);
    txt(el, 2 + TXW / 2, CY + 8, 'tracker', { size: 23, fill: '#000' });
    var outs = RY.map(function (ry, i) {
      var y1 = ry + RH / 2, d = 'M' + (TXW + 10) + ' ' + (CY + (i - 1) * 16) + ' C' + (TXW + 62) + ' ' + (CY + (i - 1) * 16) + ' ' + (RX - 62) + ' ' + y1 + ' ' + (RX - 11) + ' ' + y1;
      var p = A.el('path', { d: d, fill: 'none', stroke: C.amber, 'stroke-width': 3.5, 'stroke-dasharray': '9 8', 'stroke-linecap': 'round' }, el);
      var hd = A.el('path', { d: head(RX - 6, y1, 0, 10), fill: 'none', stroke: C.amber, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
      var g = A.el('g', null, el);
      A.el('rect', { x: RX + 1.5, y: ry + 1.5, width: RW - 3, height: RH - 3, rx: 11, fill: '#0f1a06', stroke: C.g, 'stroke-width': 3 }, g);
      txt(g, RX + RW / 2, y1 + 7, NAMES[i]);
      return { p: p, hd: hd, g: g, len: p.getTotalLength(), dot: dot(C.amber) };
    });
    var lab = txt(el, (TXW + RX) / 2 + 2, 192, 'distill', { fill: C.amber });
    return function (f) {
      var t = local(f), i;
      A.show(lab, A.ramp(t, 1.5, 1.9));                         // the word sits under the third arrow: it arrives with that arrow
      for (i = 0; i < 3; i++) {
        var o = outs[i], ti = t - (0.4 + 0.45 * i), u = A.ramp(ti, 0, 0.5);
        A.show(o.p, u > 0 ? 1 : 0); A.set(o.p, { 'stroke-dasharray': dashes(o.len, u) });
        A.show(o.hd, u >= 1 ? 1 : 0); A.show(o.g, A.ramp(ti, 0.4, 0.7));
        var q = t < 2.4 ? -1 : A.loop(t - 2.4 - 0.5 * i, 2.6);
        if (q >= 0 && q < 0.9 && t >= 2.4 + 0.5 * i) { var pt = o.p.getPointAtLength(o.len * A.ease(q / 0.9)); put(o.dot, pt.x, pt.y, 1); } else A.show(o.dot, 0);
      }
    };
  }

  // ------------------------------------------------------------------ 2: the interface between planner and policy
  var IF = [['phase', 57], ['poses', 56], ['latent', 58], ['masked goals', 131], ['tokens', 66]], PADX = 9, GAP = 10, x = 0, DWELL = 1.4;
  var chips = IF.map(function (c) {
    var w = c[1] + 2 * PADX, g = A.el('g', null, el);
    var r = A.el('rect', { x: x + 1, y: 5, width: w - 2, height: 38, rx: 9, fill: '#161616', stroke: '#3d3d3d', 'stroke-width': 2 }, g);
    var o = { r: r, t: txt(g, x + w / 2, 31, c[0]), cx: x + w / 2, name: c[0] };
    x += w + GAP;
    return o;
  });
  var BY = 112, BH = 76, MY = BY + BH / 2, SX = 180, SW = 162;
  A.el('rect', { x: 1.5, y: BY + 1.5, width: 147, height: BH - 3, rx: 13, fill: '#1c1c1c', stroke: '#8a8a8a', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }, el);
  txt(el, 75, MY - 4, 'kinematic'); txt(el, 75, MY + 21, 'planner');
  A.el('rect', { x: 372, y: BY, width: 126, height: BH, rx: 13, fill: C.g }, el);
  txt(el, 435, MY + 8, 'policy', { size: 23, fill: '#000' });
  [[152, SX - 4], [SX + SW + 4, 368]].forEach(function (s) {
    A.el('path', { d: 'M' + (s[0] + 2) + ' ' + MY + ' H' + (s[1] - 4), fill: 'none', stroke: '#d8d8d8', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, el);
    A.el('path', { d: head(s[1], MY, 0, 10), fill: 'none', stroke: '#d8d8d8', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  });
  A.el('rect', { x: SX + 1.5, y: BY + 11.5, width: SW - 3, height: BH - 23, rx: 11, fill: '#1b1503', stroke: C.amber, 'stroke-width': 3 }, el);
  var slot = txt(el, SX + SW / 2, MY + 7, '', { size: 21, fill: '#ffd76a' });
  var drop = A.el('path', { d: '', fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, el);
  var ball = dot(C.amber);
  return function (f) {
    var t = local(f), q = t < 0 ? 0 : A.loop(t, DWELL * IF.length), k = t < 0 ? -1 : Math.floor(q / DWELL), v = q - DWELL * k, i;
    for (i = 0; i < chips.length; i++) {
      var on = i === k;
      A.set(chips[i].r, { fill: on ? C.amber : '#161616', stroke: on ? C.amber : '#3d3d3d' });
      chips[i].t.style.fill = on ? '#000' : '#fff';
    }
    if (k < 0) { A.set(slot, { text: '' }); A.show(drop, 0); A.show(ball, 0); return; }
    var c = chips[k], y0 = 45, y1 = BY + 10, xs = SX + SW / 2;
    A.set(drop, { d: 'M' + c.cx + ' ' + y0 + ' C' + c.cx + ' ' + (y0 + 34) + ' ' + xs + ' ' + (y1 - 34) + ' ' + xs + ' ' + y1 }); A.show(drop, 0.9);
    A.set(slot, { text: c.name }); A.show(slot, A.ramp(v, 0.3, 0.5));
    if (v < 0.4) { var w = A.ease(v / 0.4), pt = drop.getPointAtLength(drop.getTotalLength() * w); put(ball, pt.x, pt.y, 1); } else A.show(ball, 0);
  };
});
