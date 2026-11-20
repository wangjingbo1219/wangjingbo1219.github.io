/* Composite Motion Learning (Xu et al. 2023, sections 4.1-4.2): what each discriminator gets to see.
 *   <svg data-anim="composite-split" data-at="1" viewBox="0 0 566 228">   on the slide "Composite Motion Learning"; data-at = the build step that reveals it
 * A SCHEMATIC (a stick figure, no data). One character, controlled as a whole by one policy; its body links are split into two groups:
 *   upper body (arms, torso, head)   violet   -> the discriminator that has the punch clip as its reference
 *   lower body (pelvis, legs)        blue     -> the discriminator that has the run clip as its reference
 * ("upper body (arms, hands, torso and head)", "lower body (pelvis, legs and feet)", section 4.1; "each discriminator can take only its
 * own interested body link states as input", section 4.2.)
 * When the step is revealed: the figure is grey, then the two groups take their colours, then a copy of each group slides into its own
 * frame: the same motion, cut into two partial views. The limbs keep moving (legs and punching arm at their own, unrelated rhythms: the
 * two reference clips are not synchronized), so each frame shows only its part of the motion. The motion is drawn by hand, not simulated.
 */
DeckAnim.register('composite-split', function (el, A) {
  'use strict';
  var C = A.C, W = 566, H = 228, STEP = parseInt(el.getAttribute('data-at') || '0', 10);
  var UP = C.violet, LO = C.blue, GREY = '#b4b4b4';
  var TH = 28, SH = 28, TO = 41, UA = 21, FA = 20, HR = 8.5;               // thigh, shin, torso, upper arm, forearm, head radius (px)
  var FX = 72, FY = 137;                                                    // pelvis of the whole figure
  var VX = 230, VU = 121, VL = 149;                                         // pelvis of the two partial views (x; y of the upper and of the lower one)
  var FR = { x: 170, w: 130, h: 80, yu: 46, yl: 134 };                      // the two frames: every pose of a view stays inside its frame

  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function mix(a, b, u) {
    var p = rgb(a), q = rgb(b);
    return 'rgb(' + Math.round(A.lerp(p[0], q[0], u)) + ',' + Math.round(A.lerp(p[1], q[1], u)) + ',' + Math.round(A.lerp(p[2], q[2], u)) + ')';
  }
  /** joint positions relative to the pelvis (x forward, y down) at time t: the legs run on the spot, the near arm punches */
  function pose(t) {
    var p = 2 * Math.PI * t / 0.84, lean = 0.27 + 0.03 * Math.sin(2 * p), ux = Math.sin(lean), uy = -Math.cos(lean), P = { legs: [], arms: [] }, k;
    var py = -2 * Math.abs(Math.sin(p));                                    // the pelvis bobs a little
    P.pel = [0, py];
    P.waist = [8 * ux, py + 8 * uy];
    P.neck = [TO * ux, py + TO * uy];
    P.head = [(TO + HR + 2) * ux, py + (TO + HR + 2) * uy];
    var sx = (TO - 5) * ux, sy = py + (TO - 5) * uy;                        // shoulder
    for (k = 0; k < 2; k++) {
      var ph = p + k * Math.PI, th = 0.7 * Math.sin(ph), kn = 0.2 + 0.95 * Math.max(0, Math.cos(ph + 0.4));
      var kx = TH * Math.sin(th), ky = py + TH * Math.cos(th);
      P.legs.push([[0, py], [kx, ky], [kx + SH * Math.sin(th - kn), Math.min(TH + SH, ky + SH * Math.cos(th - kn))]]);
    }
    var u = A.loop(t, 1.5) / 1.5, e = A.ease(A.ramp(u, 0.08, 0.22)) - A.ease(A.ramp(u, 0.34, 0.62));      // 0 guard ... 1 arm stretched out
    var ang = [[A.lerp(0.35, 1.5, e), A.lerp(2.25, 0.08, e)], [0.3 - 0.3 * e, 2.3]];                       // upper-arm angle, elbow bend: near arm, far arm
    for (k = 0; k < 2; k++) {
      var a1 = ang[k][0], a2 = a1 + ang[k][1], ex = sx + UA * Math.sin(a1), ey = sy + UA * Math.cos(a1);
      P.arms.push([[sx, sy], [ex, ey], [ex + FA * Math.sin(a2), ey + FA * Math.cos(a2)]]);
    }
    return P;
  }
  function d3(q, x, y) {
    return 'M' + (x + q[0][0]).toFixed(1) + ' ' + (y + q[0][1]).toFixed(1) + 'L' + (x + q[1][0]).toFixed(1) + ' ' + (y + q[1][1]).toFixed(1) +
           'L' + (x + q[2][0]).toFixed(1) + ' ' + (y + q[2][1]).toFixed(1);
  }
  /** nodes of a figure: up / lo = which group of links it has. Far limbs first (dimmer), near limbs last. */
  function body(up, lo) {
    var g = A.el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el), o = { g: g, up: up, lo: lo };
    if (lo) o.legF = A.el('path', { 'stroke-width': 6.5, 'stroke-opacity': 0.5 }, g);
    if (up) o.armF = A.el('path', { 'stroke-width': 6, 'stroke-opacity': 0.5 }, g);
    if (up) { o.torso = A.el('path', { 'stroke-width': 8.5 }, g); o.head = A.el('circle', { r: HR, stroke: 'none' }, g); }
    if (lo) { o.pel = A.el('circle', { r: 6.5, stroke: 'none' }, g); o.legN = A.el('path', { 'stroke-width': 6.5 }, g); }
    if (up) o.armN = A.el('path', { 'stroke-width': 6 }, g);
    return o;
  }
  function place(o, P, x, y, cu, cl) {
    if (o.up) {
      A.set(o.armF, { d: d3(P.arms[1], x, y), stroke: cu });
      A.set(o.torso, { d: 'M' + (x + P.waist[0]).toFixed(1) + ' ' + (y + P.waist[1]).toFixed(1) + 'L' + (x + P.neck[0]).toFixed(1) + ' ' + (y + P.neck[1]).toFixed(1), stroke: cu });
      A.set(o.head, { cx: (x + P.head[0]).toFixed(1), cy: (y + P.head[1]).toFixed(1), fill: cu });
      A.set(o.armN, { d: d3(P.arms[0], x, y), stroke: cu });
    }
    if (o.lo) {
      A.set(o.legF, { d: d3(P.legs[1], x, y), stroke: cl });
      A.set(o.pel, { cx: (x + P.pel[0]).toFixed(1), cy: (y + P.pel[1]).toFixed(1), fill: cl });
      A.set(o.legN, { d: d3(P.legs[0], x, y), stroke: cl });
    }
  }
  function arrow(x1, y1, x2, y2, col) {
    var a = Math.atan2(y2 - y1, x2 - x1), g = A.el('g', { stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, el);
    A.el('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 }, g);
    A.el('path', { d: 'M' + (x2 - 9 * Math.cos(a - 0.5)).toFixed(1) + ' ' + (y2 - 9 * Math.sin(a - 0.5)).toFixed(1) + 'L' + x2 + ' ' + y2 +
                      'L' + (x2 - 9 * Math.cos(a + 0.5)).toFixed(1) + ' ' + (y2 - 9 * Math.sin(a + 0.5)).toFixed(1) }, g);
    return g;
  }

  A.el('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 16, fill: C.card, stroke: '#262626' }, el);
  var h0 = A.text(el, 20, 31, 'one policy moves the whole body', { size: 21, halo: false });
  var h1 = A.text(el, 20, 31, 'each discriminator sees one part', { size: 21, fill: C.g, halo: false });
  A.el('line', { x1: FX - 46, y1: FY + TH + SH + 4.5, x2: FX + 50, y2: FY + TH + SH + 4.5, stroke: '#333', 'stroke-width': 2 }, el);      // the ground under the whole figure
  var frames = A.el('g', {}, el);
  A.el('rect', { x: FR.x, y: FR.yu, width: FR.w, height: FR.h, rx: 12, fill: '#17121d', stroke: UP, 'stroke-width': 2 }, frames);
  A.el('rect', { x: FR.x, y: FR.yl, width: FR.w, height: FR.h, rx: 12, fill: '#0d171c', stroke: LO, 'stroke-width': 2 }, frames);
  arrow(138, 101, 163, 93, UP).setAttribute('data-k', 'u');
  arrow(138, 170, 163, 178, LO).setAttribute('data-k', 'l');
  var arrows = el.querySelectorAll('g[data-k]');
  var full = body(true, true), vu = body(true, false), vl = body(false, true);
  var LX = FR.x + FR.w + 16;
  var tu1 = A.text(el, LX, FR.yu + 33, 'upper body only', { size: 21, fill: UP, halo: false });
  var tu2 = A.text(el, LX, FR.yu + 61, 'like the punch clip?', { size: 20, weight: 500, fill: '#e2e2e2', halo: false });
  var tl1 = A.text(el, LX, FR.yl + 33, 'lower body only', { size: 21, fill: LO, halo: false });
  var tl2 = A.text(el, LX, FR.yl + 61, 'like the run clip?', { size: 20, weight: 500, fill: '#e2e2e2', halo: false });

  return function draw(f) {
    var ts = f.step > STEP ? 1e3 : (f.step === STEP ? f.ts : -1);          // finished once the step has passed, nothing before it
    var c = A.ease(A.ramp(ts, 0.5, 1.1)), m = A.ease(A.ramp(ts, 1.4, 2.4)), fr = A.ramp(ts, 1.2, 1.7);
    var P = pose(f.t), cu = mix(GREY, UP, c), cl = mix(GREY, LO, c);
    place(full, P, FX, FY, cu, cl);
    place(vu, P, A.lerp(FX, VX, m), A.lerp(FY, VU, m), UP, LO);
    place(vl, P, A.lerp(FX, VX, m), A.lerp(FY, VL, m), UP, LO);
    A.show(vu.g, A.ramp(m, 0, 0.06)); A.show(vl.g, A.ramp(m, 0, 0.06));     // the copies are hidden while they still lie on the whole figure
    A.show(frames, fr);
    A.show(arrows[0], A.ramp(ts, 1.3, 1.8)); A.show(arrows[1], A.ramp(ts, 1.3, 1.8));
    A.show(h0, 1 - A.ramp(ts, 1.1, 1.4)); A.show(h1, A.ramp(ts, 1.5, 1.9));
    A.show(tu1, A.ramp(ts, 2.3, 2.7)); A.show(tl1, A.ramp(ts, 2.3, 2.7));
    A.show(tu2, A.ramp(ts, 2.9, 3.3)); A.show(tl2, A.ramp(ts, 2.9, 3.3));
  };
});
