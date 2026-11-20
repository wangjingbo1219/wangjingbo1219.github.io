/* Slide "Omnigrasp - how", click 3: what the goal state contains.   <svg data-anim="omnigrasp-goal" data-step="3" viewBox="0 0 596 298">
 * A SCHEMATIC of the goal state s^g of the paper (Luo et al. 2024, eq. 2): everything in it is about the object.
 *   green    the reference path of the object: the next 20 frames (phi = 20) are the bright dots; the window slides as the object moves
 *   violet   the object shape code: distances from basis points around the object to its surface (Basis Point Set, 512 numbers in the paper;
 *            a handful of points drawn)
 *   amber    the offsets from the object to the joints of the hand (p^obj - p^hand)
 * The goal also holds the object's current pose and the velocity terms of the path; they are not drawn. The path is a made-up curve.
 * The loop: the open hand comes to the object (the offsets shrink), then the object is carried along its path (the window of 20 frames slides).
 * The three parts arrive one after the other after the click (data-step) that reveals the figure: path, offsets, shape.
 */
DeckAnim.register('omnigrasp-goal', function (el, A) {
  'use strict';
  var K = window.OGKit, C = A.C, TAU = 2 * Math.PI;
  var STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var N = 40, PHI = 20, LAST = N - 1 - PHI, T = 11;

  // ---------- the reference path, one dot per frame
  var path = [];
  for (var i = 0; i < N; i++) {
    var u = i / (N - 1);
    path.push([310 + 262 * u + 20 * (Math.sin(TAU * 1.3 * u + 0.4) - Math.sin(0.4)), 212 - 150 * (1 - Math.pow(1 - u, 1.6)) + 14 * Math.sin(TAU * 1.7 * u)]);
  }
  function at(s) { var i0 = Math.min(N - 2, Math.floor(s)), w = s - i0; return [A.lerp(path[i0][0], path[i0 + 1][0], w), A.lerp(path[i0][1], path[i0 + 1][1], w)]; }

  // ---------- the shape code (left): basis points on a ring, each joined to the nearest point of the object
  var gS = A.el('g', {}, el), SC = [92, 192], mugS = K.mugPts(SC[0] - 2, SC[1], 1.15), r = A.rand(4);
  for (var b = 0; b < 14; b++) {
    var an = TAU * (b + 0.7 * (r() - 0.5)) / 14, p = [SC[0] + 62 * Math.cos(an), SC[1] + 62 * Math.sin(an)], q = K.nearest(mugS, p);
    A.el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: C.violet, 'stroke-width': 1.6, 'stroke-opacity': 0.75 }, gS);
    A.el('circle', { cx: p[0], cy: p[1], r: 4, fill: C.violet }, gS);
  }
  K.mug(A, gS, C.blue)(SC[0] - 2, SC[1], 1.15);
  K.text(A, gS, SC[0], 84, 'its shape', { size: 21, weight: 700, fill: C.violet, anchor: 'middle' });
  K.text(A, gS, SC[0], 109, '512 numbers', { size: 20, fill: C.mid, anchor: 'middle' });

  // ---------- the path (right)
  var gP = A.el('g', {}, el), dots = [];
  for (i = 0; i < N; i++) dots.push(A.el('circle', { cx: path[i][0].toFixed(1), cy: path[i][1].toFixed(1), r: 2.4, fill: C.g }, gP));
  K.text(A, gP, 200, 38, 'its path: the next 20 frames', { size: 21, weight: 700, fill: C.g });

  // ---------- the object and the hand, then (on top) the offsets to the hand joints
  var gH = A.el('g', {}, el), mug = null, hand = K.hand(A, gH, '#e6e6e6', { between: function (g) { mug = K.mug(A, g, C.blue); } });
  var gO = A.el('g', {}, el), gL = A.el('g', {}, gO), offs = [], jd = [];
  for (i = 0; i < 7; i++) offs.push(A.el('line', { stroke: C.amber, 'stroke-width': 2 }, gL));
  for (i = 0; i < 7; i++) jd.push(A.el('circle', { r: 4, fill: C.amber, stroke: '#101010', 'stroke-width': 1.2 }, gL));
  K.text(A, gO, 586, 284, 'its offsets to the hand joints', { size: 21, weight: 700, fill: C.amber, anchor: 'end' });
  A.el('rect', { x: path[0][0] - 34, y: path[0][1] + 23, width: 76, height: 6, rx: 2, fill: '#444' }, gP);       // where the object starts
  var HS = 1.2, MS = 1.0, R0 = 0.55, R1 = 0.1, H0 = [208, 108], TA = 3.6, TC = 9.6;
  function grip(rot) { return [HS * (K.GRIP[0] * Math.cos(rot) - K.GRIP[1] * Math.sin(rot)), HS * (K.GRIP[0] * Math.sin(rot) + K.GRIP[1] * Math.cos(rot))]; }

  return function draw(f) {
    var now = f.step === STEP, ts = now ? f.ts : 99;
    A.show(gP, A.ramp(ts, 0.1, 0.7)); A.show(gO, A.ramp(ts, 1.2, 1.8)); A.show(gS, A.ramp(ts, 2.8, 3.4));
    var tl = A.loop(now ? f.ts : f.t, T);
    var s = LAST * A.clamp((tl - TA) / (TC - TA), 0, 1), o = at(s), x, y, rot, curl;
    if (tl < TA) {                                    // the hand comes to the object: the offsets shrink
      var u = A.ease(tl / TA), g1 = grip(R1);
      x = A.lerp(H0[0], o[0] - g1[0], u); y = A.lerp(H0[1], o[1] - g1[1], u); rot = A.lerp(R0, R1, u); curl = A.lerp(0.15, 0.7, A.ramp(tl, TA - 0.8, TA));
    } else {                                          // the object follows its path: the window of 20 frames slides
      rot = R1; curl = 0.7; var g = grip(rot); x = o[0] - g[0]; y = o[1] - g[1];
    }
    var vis = Math.min(A.ramp(tl, 0, 0.4), 1 - A.ramp(tl, T - 0.6, T));
    A.show(gH, vis); A.show(gL, vis);
    for (var i = 0; i < N; i++) {
      var d = i - s, on = d > 0.2 && d <= PHI + 0.2;
      dots[i].setAttribute('r', on ? 3.5 : 2.4);
      dots[i].setAttribute('fill-opacity', d <= 0.2 ? 0.14 : (on ? 1 : 0.32));
    }
    mug(o[0], o[1], MS);
    var h = hand(x, y, rot, curl, HS);
    var js = [h.palm[0], h.palm[1], h.fin[1], h.fin[2], h.fin[3], h.thu[1], h.thu[2]];
    for (i = 0; i < 7; i++) {
      A.set(offs[i], { x1: o[0].toFixed(1), y1: o[1].toFixed(1), x2: js[i][0].toFixed(1), y2: js[i][1].toFixed(1) });
      A.set(jd[i], { cx: js[i][0].toFixed(1), cy: js[i][1].toFixed(1) });
    }
  };
});
