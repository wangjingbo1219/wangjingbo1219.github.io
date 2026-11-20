/* Slide "The policy sets targets; a PD controller makes the torques": one joint follows the targets, next to its chart.
 * Left: the limb (white) and the target set by the policy (green ghost). Right: the same two angles against time, traced by a cursor.
 * step 0  the policy sets a new target at every policy step          (ghost jumps, limb follows)
 * step 1  + the PD loop: error arc, torque arrow, simulation-step ticks
 * step 2  + red: the same law with the torque refreshed only at policy steps (30 Hz): overshoots and diverges
 * step 3  back to the clean picture
 * Trajectories come from assets/anim/pd-0kit.js (a real simulation of the stated joint). viewBox 0 0 1000 404. */
DeckAnim.register('pd-track', function (el, A) {
  var K = window.PDKit, P = K.P, N = K.N, D = K.D, C = A.C;
  var PX = 118, PY = 326, L = 182;                                  // pivot and limb length
  var X0 = 404, X1 = 972, YT = 58, YB = 278, A0 = 10, A1 = 70;      // chart area, angle range in degrees
  function X(u) { return X0 + (X1 - X0) * u / N; }
  function Y(deg) { return YB - (deg - A0) / (A1 - A0) * (YB - YT); }
  function tip(q, r) { return [PX + r * Math.cos(q), PY - r * Math.sin(q)]; }
  function arc(r, a, b) {                                           // circular arc about the pivot from angle a to b (radians, counter-clockwise positive)
    var p = tip(a, r), e = tip(b, r);
    return 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + (Math.abs(b - a) > Math.PI ? 1 : 0) + ' ' + (b > a ? 0 : 1) + ' ' + e[0].toFixed(1) + ' ' + e[1].toFixed(1);
  }
  function curve(R) {
    var pts = [], m = 4;
    for (var i = 0; i <= K.n * m; i++) {
      var q = (i < K.n * m ? K.at(R, i / (P.sub * m)).q : R.q[K.n]) / D;
      if (Math.abs(q - 40) > 150) break;                           // the diverging run: stop once the limb has left the picture for good
      pts.push([X(i / (P.sub * m)), Y(q)]);
    }
    return A.path(pts);
  }

  // ---------- static frame ----------
  var cid = 'pdtr-clip';
  var defs = A.el('defs', null, el), cp = A.el('clipPath', { id: cid }, defs), cr = A.el('rect', { x: X0, y: YT - 12, width: 0, height: YB - YT + 20 }, cp);
  [20, 40, 60].forEach(function (a) {
    A.el('line', { x1: X0, y1: Y(a), x2: X1, y2: Y(a), stroke: C.grid, 'stroke-width': 2 }, el);
    A.text(el, X0 - 12, Y(a) + 7, a + '°', { size: 20, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  });
  A.el('path', { d: 'M' + X0 + ' ' + (YT - 12) + ' V' + (YB + 8), fill: 'none', stroke: C.line, 'stroke-width': 2 }, el);
  // legend (one row, shared by the limb and the chart)
  A.el('line', { x1: 24, y1: 28, x2: 68, y2: 28, stroke: C.g, 'stroke-width': 5, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, el);
  A.text(el, 80, 35, 'target, set by the policy', { size: 21, fill: C.g, halo: false });
  A.el('line', { x1: 362, y1: 28, x2: 406, y2: 28, stroke: C.white, 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
  A.text(el, 418, 35, 'joint angle', { size: 21, fill: C.white, halo: false });
  var legR = A.el('g', null, el);
  A.el('line', { x1: 566, y1: 28, x2: 610, y2: 28, stroke: C.red, 'stroke-width': 4, 'stroke-linecap': 'round' }, legR);
  A.text(legR, 622, 35, 'same law, torque refreshed at 30 Hz', { size: 21, fill: C.red, halo: false });
  // tick rows under the chart
  var simT = A.el('g', null, el);
  for (var i = 0; i <= K.n; i++) {
    if (i % P.sub) A.el('line', { x1: X(i / P.sub), y1: 304, x2: X(i / P.sub), y2: 316, stroke: '#777', 'stroke-width': 2 }, simT);
  }
  for (var k = 0; k <= N; k++) A.el('line', { x1: X(k), y1: 290, x2: X(k), y2: 316, stroke: C.g, 'stroke-width': 4 }, el);
  A.el('line', { x1: X0, y1: 316, x2: X1, y2: 316, stroke: '#3a3a3a', 'stroke-width': 2 }, el);
  A.text(el, X0, 350, 'policy step: a new target, 30 times a second', { size: 21, fill: C.g, halo: false });
  var simL = A.text(el, X0, 382, 'simulation step: PD recomputes the torque (240 Hz here)', { size: 21, fill: C.mid, halo: false });
  var simNow = A.el('line', { x1: 0, y1: 298, x2: 0, y2: 316, stroke: C.white, 'stroke-width': 4 }, el);

  // ---------- curves, revealed by the cursor ----------
  var stairs = 'M' + X(0) + ' ' + Y(P.tg[0]) + ' ';
  P.tg.forEach(function (a, k) { stairs += 'V' + Y(a).toFixed(1) + ' H' + X(k + 1).toFixed(1) + ' '; });
  var gTr = A.el('g', { 'clip-path': 'url(#' + cid + ')' }, el);
  var cRed = A.el('path', { d: curve(K.hold), fill: 'none', stroke: C.red, 'stroke-width': 4, 'stroke-linejoin': 'round' }, gTr);
  A.el('path', { d: stairs, fill: 'none', stroke: C.g, 'stroke-width': 4, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, gTr);
  A.el('path', { d: curve(K.pd), fill: 'none', stroke: C.white, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gTr);
  var cur = A.el('line', { y1: YT - 12, y2: 316, stroke: '#6a6a6a', 'stroke-width': 2 }, el);
  var dotT = A.el('circle', { r: 7, fill: C.g }, el), dotQ = A.el('circle', { r: 8, fill: C.white, stroke: '#101010', 'stroke-width': 3 }, el);
  var unst = A.text(el, X(2.9), YB - 8, 'unstable', { size: 22, fill: C.red });

  // ---------- the joint ----------
  A.el('line', { x1: PX, y1: PY, x2: PX, y2: PY + 62, stroke: '#4d4d4d', 'stroke-width': 18, 'stroke-linecap': 'round' }, el);            // the fixed link
  var pulse = A.el('circle', { fill: 'none', stroke: C.g, 'stroke-width': 4 }, el);
  var ghostW = A.el('line', { x1: PX, y1: PY, stroke: C.g, 'stroke-width': 26, 'stroke-linecap': 'round', opacity: 0.24 }, el);
  var ghost = A.el('line', { x1: PX, y1: PY, stroke: C.g, 'stroke-width': 4, 'stroke-dasharray': '3 10', 'stroke-linecap': 'round' }, el);
  var limbR = A.el('line', { x1: PX, y1: PY, stroke: C.red, 'stroke-width': 9, 'stroke-linecap': 'round' }, el);
  var errA = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 6, 'stroke-linecap': 'round' }, el);
  var limb = A.el('line', { x1: PX, y1: PY, stroke: C.white, 'stroke-width': 16, 'stroke-linecap': 'round' }, el);
  var tqA = A.el('path', { fill: 'none', stroke: C.amber, 'stroke-width': 6, 'stroke-linecap': 'round' }, el);
  var tqH = A.el('path', { fill: C.amber }, el);
  A.el('circle', { cx: PX, cy: PY, r: 13, fill: '#101010', stroke: C.white, 'stroke-width': 5 }, el);
  var errL = A.text(el, 0, 0, 'error', { size: 21, fill: C.g });
  var tqL = A.text(el, 0, 0, 'torque', { size: 21, fill: C.amber });               // sits on the side the arrow is on, beyond its reach (see draw)
  var TMAX = 60;                                                   // N m shown as a 110 degree arrow

  return function draw(f) {
    var u = K.clock(f), s = K.at(K.pd, u), h = K.at(K.hold, u);
    var in1 = f.step > 1 ? 1 : (f.step === 1 ? A.ramp(f.ts, 0, 0.5) : 0);        // the PD loop is being shown
    var in2 = f.step === 2 ? A.ramp(f.ts, 0, 0.4) : 0;                            // the 30 Hz variant is being shown
    var fade = Math.min(A.ramp(u, 0, 0.12), 1 - A.ramp(u, N - 0.3, N - 0.02));   // the trace fades out just before the loop restarts

    // chart
    A.set(cr, { width: Math.max(0, X(u) - X0) });
    A.show(gTr, fade);
    A.set(cur, { x1: X(u), x2: X(u) });
    A.set(dotT, { cx: X(u), cy: Y(s.target / D) });
    A.set(dotQ, { cx: X(u), cy: Y(s.q / D) });
    A.show(cRed, in2); A.show(legR, in2);
    A.show(unst, in2 * A.ramp(u, 2.7, 2.9) * fade);
    A.show(simT, in1); A.show(simL, in1);
    A.set(simNow, { x1: X(s.i / P.sub), x2: X(s.i / P.sub) }); A.show(simNow, in1);

    // joint
    var tg = tip(s.target, L), tq = tip(s.q, L);
    A.set(ghostW, { x2: tg[0], y2: tg[1] }); A.set(ghost, { x2: tg[0], y2: tg[1] });
    A.set(limb, { x2: tq[0], y2: tq[1] });
    var pf = A.clamp(s.frac / 0.4, 0, 1);                                        // a ring leaves the target when the policy has just spoken
    A.set(pulse, { cx: tg[0], cy: tg[1], r: 12 + 34 * pf }); A.show(pulse, (1 - pf) * 0.9);
    var e = s.target - s.q;
    A.set(errA, { d: arc(L - 44, s.q, s.target) }); A.show(errA, in1 * (Math.abs(e) > 0.4 * D ? 1 : 0));
    var em = tip(Math.min(s.q, s.target) - 13 * D, L - 36);                     // under the lower of limb and ghost, next to the arc's end:
    A.set(errL, { x: em[0], y: em[1] + 7 });                                   // never beside the axis numbers
    A.show(errL, in1 * A.ramp(Math.abs(e), 2.5 * D, 4 * D));                   // only with the error arc, and only while there is an error to name
    var sw = A.clamp(s.tau / TMAX, -1, 1) * 110 * D, r = 64;
    if (Math.abs(sw) > 12 * D) {                                                 // below about 6 N m there is no shaft to draw
      var a0 = s.q + (sw > 0 ? 14 : -14) * D, a1 = a0 + sw, pe = tip(a1, r), sg = sw > 0 ? 1 : -1;
      // arrow head: a triangle at the end of the arc, pointing along the tangent
      var tx = -Math.sin(a1) * sg, ty = -Math.cos(a1) * sg, nx = Math.cos(a1), ny = -Math.sin(a1);
      A.set(tqA, { d: arc(r, a0, a1 - sg * 7 * D) });
      A.set(tqH, { d: 'M' + (pe[0] + tx * 6).toFixed(1) + ' ' + (pe[1] + ty * 6).toFixed(1) + ' L' + (pe[0] - tx * 12 + nx * 11).toFixed(1) + ' ' + (pe[1] - ty * 12 + ny * 11).toFixed(1) +
                      ' L' + (pe[0] - tx * 12 - nx * 11).toFixed(1) + ' ' + (pe[1] - ty * 12 - ny * 11).toFixed(1) + ' Z' });
      // the label: up-left of the pivot for a raising torque, down-right for a lowering one; the arrow (radius 64) ends short of both spots
      A.set(tqL, sw > 0 ? { x: 20, y: 240 } : { x: 186, y: 390 });
      A.show(tqA, in1); A.show(tqH, in1); A.show(tqL, in1);
    } else { A.show(tqA, 0); A.show(tqH, 0); A.show(tqL, 0); }
    // the 30 Hz variant: shown while it is still near the picture. It is gone before it points below the horizontal or past
    // the vertical, so the limb never crosses the edge of the card (figures are drawn with overflow: visible).
    var hq = h.q, dev = Math.abs(hq - 40 * D), th = tip(hq, L - 12);
    A.set(limbR, { x2: th[0], y2: th[1] }); A.show(limbR, in2 * (1 - A.ramp(dev, 30 * D, 50 * D)) * fade);
  };
});
