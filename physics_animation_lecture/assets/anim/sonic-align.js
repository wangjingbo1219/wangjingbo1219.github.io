/* Slide "SONIC — how", click 3: what makes the three encoders agree.   <svg data-anim="sonic-align" data-step="3" viewBox="0 0 1160 470">
 * SCHEMATIC of the token space (a 2-D drawing of a 64-dimensional space; the curves are illustrative, not data):
 *   three curves = the tokens of ONE motion from the robot, human and hybrid encoders; three dots = the same frame.
 *   They start apart and are pulled together: L_token (dashed amber lines between the dots). The distance between the curves shrinks by a
 *   factor of 8: the paper reports that removing the consistency losses increases the cross-encoder divergence 8x (Fig. S7).
 *   D_r decodes any of the tokens to the robot motion (L_recon); re-encoding that motion must give the robot token again (L_cycle).
 * Bars (to scale, numbers from Table 3C): tracking error on unseen motions when the policy is driven through each encoder.
 */
DeckAnim.register('sonic-align', function (el, A) {
  'use strict';
  var SN = window.SN, C = A.C, STEP = parseInt(el.getAttribute('data-step') || '0', 10), AMB = C.amber, i;
  var CW = 490, CH = 432, CX = 245, CY = 240;
  A.el('rect', { x: 1, y: 1, width: CW - 2, height: CH - 2, rx: 16, fill: '#0c0c0c', stroke: C.line, 'stroke-width': 2 }, el);
  SN.txt(A, el, 22, 44, 'Token space', { size: 25, weight: 700 });
  SN.txt(A, el, CW - 22, 44, 'one motion, three encoders', { size: 20, fill: C.mid, anchor: 'end' });
  var KEYS = ['r', 'h', 'm'], OFF = { r: [0, 0], h: [6, -4.5], m: [-5.5, 5] }, curves = {}, dots = {};
  function base(th) { return [CX + 122 * Math.cos(th) + 24 * Math.cos(2 * th), CY + 76 * Math.sin(th) + 20 * Math.sin(2 * th + 0.6)]; }
  KEYS.forEach(function (k) { curves[k] = A.el('path', { fill: 'none', stroke: SN.COL[k], 'stroke-width': 3, 'stroke-opacity': 0.75, 'stroke-linejoin': 'round' }, el); });
  var spring = A.el('path', { fill: 'none', stroke: AMB, 'stroke-width': 3, 'stroke-dasharray': '6 6', 'stroke-linejoin': 'round' }, el);
  KEYS.forEach(function (k) { dots[k] = A.el('circle', { r: 9, fill: SN.COL[k], stroke: '#0c0c0c', 'stroke-width': 2.5 }, el); });
  // legend of the three encoders
  [['r', 'robot'], ['h', 'human'], ['m', 'hybrid']].forEach(function (p, n) {
    A.el('circle', { cx: 30 + n * 122, cy: 82, r: 7, fill: SN.COL[p[0]] }, el);
    SN.txt(A, el, 44 + n * 122, 89, p[1], { size: 20, fill: '#d6d6d6' });
  });
  var st0 = SN.txt(A, el, 22, CH - 24, 'without the consistency losses', { size: 21, weight: 700, fill: C.mid });
  var st1 = SN.txt(A, el, 22, CH - 24, 'with ' + SN.cal('L') + SN.subt('token') + ' and ' + SN.cal('L') + SN.subt('cycle') + ': 8× closer', { size: 21, weight: 700, fill: AMB });
  // ---- decoder and the robot motion it reconstructs
  var DX0 = 520, DY = 226, RX = 706, GROUND = 322, SC = 150;
  SN.arrow(A, el, [CW + 5, DY], [DX0 - 7, DY], { col: '#9a9a9a', hs: 8 });
  A.el('path', { d: 'M' + DX0 + ' ' + (DY - 30) + 'L' + (DX0 + 66) + ' ' + (DY - 54) + 'V' + (DY + 54) + 'L' + DX0 + ' ' + (DY + 30) + 'Z', fill: '#0f1a06', stroke: C.g, 'stroke-width': 3, 'stroke-linejoin': 'round' }, el);
  SN.txt(A, el, DX0 + 34, DY + 10, SN.cal('D') + SN.sub('r'), { size: 27, weight: 700, anchor: 'middle' });
  SN.arrow(A, el, [DX0 + 73, DY], [DX0 + 98, DY], { col: '#9a9a9a', hs: 8 });
  A.el('line', { x1: RX - 80, x2: RX + 80, y1: GROUND + 5, y2: GROUND + 5, stroke: C.line, 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var tgt = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var tgtIn = A.el('path', { fill: 'none', stroke: '#000', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var tgtHead = A.el('circle', { r: 12, fill: '#000', stroke: C.g, 'stroke-width': 3 }, el);
  var rec = A.el('path', { fill: 'none', stroke: '#d6d6d6', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var recHead = A.el('circle', { r: 10, fill: '#d6d6d6' }, el);
  SN.txt(A, el, RX, 60, 'decoded robot motion', { size: 20, fill: '#d6d6d6', anchor: 'middle' });
  SN.txt(A, el, RX, 86, 'against the clip', { size: 20, fill: C.g, anchor: 'middle' });
  SN.txt(A, el, RX, GROUND + 46, SN.cal('L') + SN.subt('recon') + ': every token', { size: 21, weight: 700, fill: AMB, anchor: 'middle' });
  SN.txt(A, el, RX, GROUND + 74, 'decodes to the robot motion', { size: 20, fill: C.mid, anchor: 'middle' });
  // ---- numbers: Table 3C, test-content (unseen motions), MPJPE-L in mm
  var BX = 884, PX = 5.4, rows = [['r', 'robot', 23.8], ['h', 'human', 24.4], ['m', 'hybrid', 26.5]], bars = [];
  SN.txt(A, el, BX, 44, 'Tracking error', { size: 25, weight: 700 });
  SN.txt(A, el, BX, 76, 'unseen motions, by encoder', { size: 20, fill: C.mid });
  rows.forEach(function (r, n) {
    var y = 132 + n * 78;
    bars.push({ v: r[2], name: SN.txt(A, el, BX, y - 14, r[1], { size: 21, weight: 700, fill: SN.COL[r[0]] }), bar: A.el('rect', { x: BX, y: y, height: 24, rx: 5, fill: SN.COL[r[0]] }, el), val: SN.txt(A, el, 0, y + 20, r[2].toFixed(1) + ' mm', { size: 21, weight: 700 }) });
  });
  var ok = SN.txt(A, el, BX, 372, 'success 99.2 % or more', { size: 20, fill: '#d6d6d6' });
  var ok2 = SN.txt(A, el, BX, 398, 'through every encoder', { size: 20, fill: '#d6d6d6' });
  SN.txt(A, el, 0, 462, 'Schematic of the token space (it has 64 dimensions). Bars: the paper’s Table 3C, to scale.', { size: 20, fill: C.mute });

  return function draw(f) {
    var ts = STEP ? SN.since(f, STEP) : f.t, t = f.t;
    var al = A.ease(A.ramp(ts, 1.6, 3.6)), sc = 8 - 7 * al, th = 2 * Math.PI * t / SN.T, P = {};
    KEYS.forEach(function (k) {
      var pts = [], n = 72, j, b;
      for (j = 0; j <= n; j++) { b = base(2 * Math.PI * j / n); pts.push([b[0] + OFF[k][0] * sc, b[1] + OFF[k][1] * sc]); }
      A.set(curves[k], { d: A.path(pts) + 'Z' });
      b = base(th); P[k] = [b[0] + OFF[k][0] * sc, b[1] + OFF[k][1] * sc];
      A.set(dots[k], { cx: P[k][0].toFixed(1), cy: P[k][1].toFixed(1) });
    });
    A.set(spring, { d: A.path([P.r, P.h, P.m]) + 'Z' }); A.show(spring, A.ramp(ts, 0.9, 1.4));
    A.show(st0, 1 - A.ramp(ts, 1.5, 1.9)); A.show(st1, A.ramp(ts, 1.9, 2.3));
    // the clip (green outline) and what D_r decodes from the token (grey): this mismatch closes first (L_recon), while the three curves are
    // still apart; only then do the consistency losses pull the curves together
    var p = SN.pose(t), q = SN.pose(t), e = 1 - A.ease(A.ramp(ts, 0.4, 1.4));     // L_recon first: the decoder learns to give back the robot motion
    q.aL += 0.42 * e; q.aR -= 0.5 * e; q.squat += 0.07 * e; q.sway += 0.05 * e;
    var jt = SN.fk(p, SN.ROBOT, RX, GROUND, SC), jr = SN.fk(q, SN.ROBOT, RX, GROUND, SC);
    A.set(tgt, { d: SN.bonePath(jt, SN.BONES) }); A.set(tgtIn, { d: SN.bonePath(jt, SN.BONES) }); A.set(tgtHead, { cx: jt.head[0].toFixed(1), cy: (jt.head[1] - 3).toFixed(1) });
    A.set(rec, { d: SN.bonePath(jr, SN.BONES) }); A.set(recHead, { cx: jr.head[0].toFixed(1), cy: (jr.head[1] - 3).toFixed(1) });
    for (var k2 = 0; k2 < bars.length; k2++) {
      var u = A.ease(A.ramp(ts, 3.2 + 0.35 * k2, 4.0 + 0.35 * k2)), w = Math.max(0.01, bars[k2].v * PX * u);
      A.set(bars[k2].bar, { width: w.toFixed(1) }); A.show(bars[k2].name, A.ramp(ts, 3.0 + 0.35 * k2, 3.4 + 0.35 * k2));
      A.set(bars[k2].val, { x: (BX + w + 10).toFixed(1) }); A.show(bars[k2].val, A.ramp(ts, 3.9 + 0.35 * k2, 4.2 + 0.35 * k2));
    }
    A.show(ok, A.ramp(ts, 4.9, 5.3)); A.show(ok2, A.ramp(ts, 4.9, 5.3));
  };
});
