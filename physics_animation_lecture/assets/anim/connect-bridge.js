/* The two "Bridge" slides  (tools/slides/07_20_bridges.py): the small drawing between the clips.   <svg data-anim="connect-bridge" data-kind="distill | cross">
 * SCHEMATICS, no numbers.
 *   distill (viewBox 380 x 382, between the two BeyondMimic clips; same colour code as the pipeline figures: green = policy, dashed amber = training signal)
 *     step 0   the tracking policies (green tiles) light up in turn; what comes next is a grey outline
 *     step 1   dashed amber arrows carry them into ONE policy (distillation); a cost function guides that policy; its output goes on to the clip on the right
 *     later    the same picture, signals keep running
 * data-slots: [x, y, w, h, step] = where a clip will arrive at that click; drawn as a dashed frame until then (the svg reaches over those places).
 *   cross (viewBox 66 x 444, between the simulated rally and the real one)
 *     step 0   a grey arrow        step 1   the arrow is drawn and signals run along it
 * draw(f) is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('connect-bridge', function (el, A) {
  'use strict';
  var C = A.C, KIND = el.getAttribute('data-kind'), GREY = '#3a3a3a';
  var F = function (size, wt) { return 'font:' + (wt || 700) + ' ' + size + 'px ' + A.FONT; };
  function head(x, y, a, s) {
    var c = Math.cos(a), n = Math.sin(a), bx = x - s * c, by = y - s * n;
    return 'M' + (bx - 0.62 * s * n).toFixed(1) + ' ' + (by + 0.62 * s * c).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) + 'L' + (bx + 0.62 * s * n).toFixed(1) + ' ' + (by - 0.62 * s * c).toFixed(1);
  }
  function dot(col) {
    var g = A.el('g', { opacity: 0 }, el);
    A.el('circle', { r: 11, fill: col, opacity: 0.35 }, g); A.el('circle', { r: 5, fill: '#fff' }, g);
    return g;
  }
  function put(g, p, o) { A.set(g, { transform: 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')' }); A.show(g, o); }
  /** stroke-dasharray of a dashed line (9 on, 8 off) of which only the first u of its length is drawn yet */
  function dashes(len, u) {
    if (u >= 1) return '9 8';
    var v = len * u, n = Math.floor(v / 17), d = '';
    for (var i = 0; i < n; i++) d += '9 8 ';
    return d + Math.min(9, v - 17 * n).toFixed(1) + ' ' + (len + 20);
  }
  // the place of each clip that is still to come: a dashed frame, gone once the clip is there
  var slots = JSON.parse(el.getAttribute('data-slots') || '[]').map(function (s) {
    return { step: s[4], r: A.el('rect', { x: s[0] + 1, y: s[1] + 1, width: s[2] - 2, height: s[3] - 2, rx: 16, fill: '#060606', stroke: '#262626', 'stroke-width': 1.5, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, el) };
  });
  function drawSlots(f) { slots.forEach(function (s) { A.show(s.r, f.step >= s.step ? 0 : 1); }); }

  if (KIND === 'cross') {
    var y = 222;
    A.el('path', { d: 'M8 ' + y + ' H56', fill: 'none', stroke: GREY, 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
    A.el('path', { d: head(58, y, 0, 15), fill: 'none', stroke: GREY, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    var ln = A.el('path', { d: 'M8 ' + y + ' H56', fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '48 60' }, el);
    var hd = A.el('path', { d: head(58, y, 0, 15), fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    var pd = dot('#fff');
    return function (f) {
      drawSlots(f);
      var t = f.step > 1 ? 1e3 : (f.step === 1 ? f.ts : -1), u = t < 0 ? 0 : A.ramp(t, 0.1, 0.6);
      A.show(ln, u > 0 ? 1 : 0); A.set(ln, { 'stroke-dashoffset': (48 * (1 - u)).toFixed(1) });
      A.show(hd, u >= 1 ? 1 : 0);
      var tau = f.step >= 1 ? A.loop(f.ts - 0.9, 1.8) : -1;
      put(pd, { x: 8 + 44 * A.ease(A.clamp(tau / 0.7, 0, 1)), y: y }, f.step >= 1 && f.ts >= 0.9 && tau < 0.7 ? 1 : 0);
    };
  }

  // ---- distill: three trackers -> one policy, guided by a cost     (viewBox 380 x 382)
  var TX = 30, TW = 84, TH = 52, TY = [86, 165, 244], BX = 214, BY = 136, BW = 126, BH = 110, CY = BY + BH / 2;
  A.el('text', { x: TX + TW / 2, y: 62, 'text-anchor': 'middle', text: 'trackers', style: F(21) + ';fill:#fff' }, el);
  var tiles = TY.map(function (ty) {
    return { glow: A.el('rect', { x: TX - 5, y: ty - 5, width: TW + 10, height: TH + 10, rx: 15, fill: 'none', stroke: C.g, 'stroke-width': 3, opacity: 0 }, el),
             box: A.el('rect', { x: TX, y: ty, width: TW, height: TH, rx: 11, fill: C.g }, el) };
  });
  // what comes next, as an outline
  var ghost = A.el('g', null, el);
  A.el('rect', { x: BX + 1.5, y: BY + 1.5, width: BW - 3, height: BH - 3, rx: 13, fill: 'none', stroke: GREY, 'stroke-width': 3, 'stroke-dasharray': '4 8', 'stroke-linecap': 'round' }, ghost);
  // the distillation arrows
  var arcs = TY.map(function (ty, i) {
    var y0 = ty + TH / 2, y1 = CY + (i - 1) * 26, d = 'M' + (TX + TW + 7) + ' ' + y0 + ' C' + (TX + TW + 52) + ' ' + y0 + ' ' + (BX - 54) + ' ' + y1 + ' ' + (BX - 10) + ' ' + y1;
    var p = A.el('path', { d: d, fill: 'none', stroke: C.amber, 'stroke-width': 3.5, 'stroke-dasharray': '9 8', 'stroke-linecap': 'round' }, el);
    return { p: p, len: p.getTotalLength(), hd: A.el('path', { d: head(BX - 5, y1, 0, 10), fill: 'none', stroke: C.amber, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el), dot: dot(C.amber) };
  });
  var lDist = A.el('text', { x: (TX + TW + BX) / 2, y: 62, 'text-anchor': 'middle', text: 'distill', style: F(21) + ';fill:' + C.amber }, el);
  // the one policy
  var big = A.el('g', null, el);
  A.el('rect', { x: BX + 1.5, y: BY + 1.5, width: BW - 3, height: BH - 3, rx: 13, fill: '#0f1a06', stroke: C.g, 'stroke-width': 3 }, big);
  ['one', 'diffusion', 'policy'].forEach(function (w, i) {
    A.el('text', { x: BX + BW / 2, y: CY - 19 + 27 * i, 'text-anchor': 'middle', text: w, style: F(22) + ';fill:#fff' }, big);
  });
  var lBig = A.el('g', null, el);
  // its output, on to the clip on the right
  var out = A.el('g', null, el);
  A.el('path', { d: 'M' + (BX + BW + 6) + ' ' + CY + ' H371', fill: 'none', stroke: C.g, 'stroke-width': 4, 'stroke-linecap': 'round' }, out);
  A.el('path', { d: head(375, CY, 0, 11), fill: 'none', stroke: C.g, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, out);
  // the cost function that guides it
  var cost = A.el('g', null, el), KX = BX + BW / 2, KY = 292;
  A.el('path', { d: 'M' + KX + ' ' + (KY - 4) + ' V' + (BY + BH + 13), fill: 'none', stroke: '#d8d8d8', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, cost);
  A.el('path', { d: head(KX, BY + BH + 7, -Math.PI / 2, 10), fill: 'none', stroke: '#d8d8d8', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, cost);
  A.el('rect', { x: KX - 72, y: KY, width: 144, height: 44, rx: 11, fill: '#171717', stroke: '#8a8a8a', 'stroke-width': 2.5 }, cost);
  A.el('text', { x: KX, y: KY + 29, 'text-anchor': 'middle', text: 'cost function', style: F(20) + ';fill:#fff' }, cost);
  A.el('text', { x: KX + 72, y: KY + 74, 'text-anchor': 'end', text: 'joystick · waypoints · obstacles', style: F(20, 500) + ';fill:' + C.mid }, cost);
  var cdot = dot('#fff');

  return function draw(f) {
    drawSlots(f);
    var st = f.step, t1 = st > 1 ? 1e3 : (st === 1 ? f.ts : -1), i;
    // step 0: the trackers take turns
    for (i = 0; i < 3; i++) {
      var ph = A.loop((st === 0 ? f.t : f.ts) - 0.5 - i * 0.7, 2.1);
      A.show(tiles[i].glow, st === 0 ? 0.9 * (1 - A.ramp(ph, 0, 0.7)) * ((st === 0 ? f.t : f.ts) > 0.5 + i * 0.7 ? 1 : 0) : 0);
    }
    A.show(ghost, t1 < 0.9 ? 1 : 0);
    // step 1: distil into one policy
    for (i = 0; i < 3; i++) {
      var a = arcs[i], u = t1 < 0 ? 0 : A.ramp(t1, 0.1 + 0.12 * i, 0.8 + 0.12 * i);
      A.show(a.p, u > 0 ? 1 : 0);
      A.set(a.p, { 'stroke-dasharray': dashes(a.len, u) });
      A.show(a.hd, u >= 1 ? 1 : 0);
      var tau = t1 < 0 ? -1 : A.loop((st === 1 ? f.ts : f.ts + 1.2) - 1.4 - 0.25 * i, 2.2), on = t1 >= 0 && (st > 1 || f.ts >= 1.4 + 0.25 * i) && tau < 0.9;
      if (on) put(a.dot, a.p.getPointAtLength(a.len * A.ease(tau / 0.9)), 1); else A.show(a.dot, 0);
    }
    A.show(lDist, A.ramp(t1, 0.5, 0.9));
    var tb = t1 - 0.9;
    A.show(big, tb >= 0 ? 1 : 0); A.show(lBig, A.ramp(tb, 0, 0.35));
    big.setAttribute('transform', tb >= 0 ? 'translate(' + (BX + BW / 2) + ' ' + CY + ') scale(' + (1 + 0.12 * (1 - A.ramp(tb, 0, 0.35))).toFixed(3) + ') translate(' + (-(BX + BW / 2)) + ' ' + (-CY) + ')' : '');
    A.show(cost, A.ramp(t1, 1.5, 1.9)); A.show(out, A.ramp(t1, 1.9, 2.2));
    var tc = t1 < 0 ? -1 : A.loop((st === 1 ? f.ts : f.ts + 1.2) - 2.2, 2.2);
    if (t1 >= 0 && (st > 1 || f.ts >= 2.2) && tc < 0.6) put(cdot, { x: KX, y: KY - 4 - (KY - 16 - BY - BH) * A.ease(tc / 0.6) }, 1); else A.show(cdot, 0);
  };
});
