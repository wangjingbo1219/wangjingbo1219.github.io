/* Slide "Omnigrasp - how", click 4: the stepwise reward along one episode.   <svg data-anim="omnigrasp-reward" data-step="4" viewBox="0 0 640 298">
 * A SCHEMATIC of eq. 4 of the paper (Luo et al. 2024, section 4.2); no reward values are shown, only which term is active.
 *   t < 1.5 s and the hand more than 0.2 m from the pre-grasp   r_approach   (blue)    paid for getting closer to the pre-grasp
 *   t < 1.5 s and the hand within 0.2 m                         r_pre-grasp  (violet)  paid for matching the pre-grasp hand pose
 *   t >= 1.5 s                                                  r_obj        (green)   paid for the object being on its reference path,
 *                                                                                     only while the hand is in contact with it
 * Violet translucent hand = the pre-grasp (one frame of hand pose), violet dashed circle = the 0.2 m threshold around it,
 * green dots = the reference path of the object, white outline on the object = the hand is in contact with it.
 * The hand, the object, the path and the moment the hand crosses the circle are made up; 0.2 m and 1.5 s are the paper's.
 * The drawing is not to scale. The time bar runs at a constant speed: it is the episode's clock.
 * The three rows beside the figure (HTML, .og-rr inside the same card) are lit in step with the phase.
 */
DeckAnim.register('omnigrasp-reward', function (el, A) {
  'use strict';
  var K = window.OGKit, C = A.C, TAU = 2 * Math.PI;
  var STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var COLS = [C.blue, C.violet, C.g];
  var TE1 = 0.9, LAM = 1.5, TEND = 4.2, RATE = 0.5, T = 10.6;          // episode seconds; RATE = episode seconds per wall second; T = loop (wall seconds)
  var HS = 1.45, MS = 1.0, O0 = [360, 176], RG = 0.55, CG = 0.4, R = 88;
  function grip(rot) { return [HS * (K.GRIP[0] * Math.cos(rot) - K.GRIP[1] * Math.sin(rot)), HS * (K.GRIP[0] * Math.sin(rot) + K.GRIP[1] * Math.cos(rot))]; }
  var G = [O0[0] - grip(RG)[0], O0[1] - grip(RG)[1]];                   // wrist of the pre-grasp
  var S0 = [70, 66], dn = Math.sqrt((S0[0] - G[0]) * (S0[0] - G[0]) + (S0[1] - G[1]) * (S0[1] - G[1]));
  var C1 = [G[0] + R * (S0[0] - G[0]) / dn, G[1] + R * (S0[1] - G[1]) / dn], CT = [172, 58];     // where the hand crosses the circle; control point of the approach
  function Q(u) { return [O0[0] + 232 * u + 14 * Math.sin(TAU * 1.1 * u), O0[1] - 104 * (1 - (1 - u) * (1 - u)) + 9 * Math.sin(TAU * 1.6 * u)]; }
  var X0 = 34, X1 = 606, BY = 266;
  function tx(te) { return X0 + (X1 - X0) * te / TEND; }

  // ---------- scenery
  A.el('rect', { x: 351, y: 205, width: 8, height: 40, fill: '#262626' }, el);
  A.el('rect', { x: 270, y: 199, width: 170, height: 7, rx: 2, fill: '#444' }, el);
  var ND = 26, dots = [];
  for (var i = 1; i <= ND; i++) { var q = Q(i / ND); dots.push(A.el('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: 2.8, fill: C.g }, el)); }
  var ring = A.el('circle', { cx: G[0], cy: G[1], r: R, fill: 'none', stroke: C.violet, 'stroke-width': 2, 'stroke-dasharray': '7 7' }, el);
  var ringT = K.text(A, el, G[0] - 0.94 * R - 8, G[1] + 0.34 * R + 7, '0.2 m', { size: 20, fill: C.violet, anchor: 'end' });
  var dist = A.el('line', { stroke: C.blue, 'stroke-width': 2.6, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }, el);
  var ghost = K.hand(A, el, C.violet, { ghost: true });
  ghost(G[0], G[1], RG, CG, HS);
  var mug = null, hand = K.hand(A, el, '#e6e6e6', { between: function (g) { mug = K.mug(A, g, C.blue); } });
  // ---------- the episode clock
  A.el('line', { x1: X0, y1: BY, x2: X1, y2: BY, stroke: '#2e2e2e', 'stroke-width': 8, 'stroke-linecap': 'round' }, el);
  var seg = COLS.map(function (c) { return A.el('line', { y1: BY, y2: BY, stroke: c, 'stroke-width': 8 }, el); });
  A.el('line', { x1: tx(LAM), y1: BY - 10, x2: tx(LAM), y2: BY + 10, stroke: '#fff', 'stroke-width': 2 }, el);
  K.text(A, el, X0, 293, '0', { size: 20, fill: C.mid, anchor: 'middle' });
  K.text(A, el, tx(LAM), 293, '1.5 s', { size: 20, weight: 700, anchor: 'middle' });
  K.text(A, el, X1, 293, 'time', { size: 20, fill: C.mid, anchor: 'end' });
  var cur = A.el('path', { fill: '#fff' }, el);
  var card = el.parentNode, rows = card ? Array.prototype.slice.call(card.querySelectorAll('.og-rr')) : [];

  return function draw(f) {
    var tl = A.loop(f.step === STEP ? f.ts : f.t, T);
    var te = Math.min(TEND, tl * RATE), ph = te < TE1 ? 0 : (te < LAM ? 1 : 2);
    var x, y, rot, curl, o = O0;
    if (te <= TE1) {
      var u = A.ease(te / TE1), v = 1 - u;
      x = v * v * S0[0] + 2 * v * u * CT[0] + u * u * C1[0]; y = v * v * S0[1] + 2 * v * u * CT[1] + u * u * C1[1];
      rot = A.lerp(-0.1, 0.22, u); curl = 0.12;
    } else if (te <= 1.36) {
      var w = A.ease((te - TE1) / (1.36 - TE1));
      x = A.lerp(C1[0], G[0], w); y = A.lerp(C1[1], G[1], w); rot = A.lerp(0.22, RG, w); curl = A.lerp(0.12, CG, w);
    } else if (te <= LAM) {
      x = G[0]; y = G[1]; rot = RG; curl = A.lerp(CG, 0.75, (te - 1.36) / (LAM - 1.36));
    } else {
      var p = (te - LAM) / (TEND - LAM);
      o = Q(p); rot = A.lerp(RG, 0.15, A.ease(p)); curl = 0.75;
      var g = grip(rot); x = o[0] - g[0]; y = o[1] - g[1];
    }
    var vis = Math.min(A.ramp(tl, 0, 0.4), 1 - A.ramp(tl, T - 0.6, T));
    mug(o[0], o[1], MS); mug.n.setAttribute('stroke', ph === 2 ? '#fff' : C.blue); mug.n.setAttribute('stroke-width', ph === 2 ? 3 : 5);
    hand(x, y, rot, curl, HS); A.show(hand.g, vis);
    A.show(ghost.g, ph === 1 ? 1 : (ph === 0 ? 0.6 : 0.3));
    A.show(ring, ph === 1 ? 1 : (ph === 0 ? 0.6 : 0.3)); A.show(ringT, ph === 2 ? 0.45 : 1);
    A.set(dist, { x1: x.toFixed(1), y1: y.toFixed(1), x2: G[0].toFixed(1), y2: G[1].toFixed(1) }); A.show(dist, ph === 0 ? vis : 0);
    var pp = ph === 2 ? (te - LAM) / (TEND - LAM) : 0;
    for (var i = 0; i < ND; i++) {
      var d = (i + 1) / ND - pp;
      dots[i].setAttribute('fill-opacity', ph === 2 ? (d < 0.01 ? 0.12 : 1) : 0.45);
      dots[i].setAttribute('r', ph === 2 && d >= 0.01 ? 3.4 : 2.8);
    }
    var ends = [Math.min(te, TE1), Math.min(te, LAM), te], from = [0, TE1, LAM];
    for (var s = 0; s < 3; s++) { A.set(seg[s], { x1: tx(from[s]).toFixed(1), x2: tx(Math.max(from[s], ends[s])).toFixed(1) }); A.show(seg[s], te > from[s] ? 1 : 0); }
    var cx = tx(te);
    cur.setAttribute('d', 'M' + (cx - 7).toFixed(1) + ' ' + (BY - 20) + 'H' + (cx + 7).toFixed(1) + 'L' + cx.toFixed(1) + ' ' + (BY - 8) + 'Z');
    for (var r = 0; r < rows.length; r++) {
      var cls = 'og-rr' + (r === ph ? ' on' : (r < ph ? ' done' : ''));
      if (rows[r].className !== cls) rows[r].className = cls;
    }
  };
});
