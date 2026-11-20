/* Slide "InterPhys", click 2: what the discriminator looks at.   <svg data-anim="interphys-judge" data-step="2" viewBox="0 0 648 285">
 * A SCHEMATIC, not a simulation and not data. It restates two passages of the paper (Hassan et al. 2023):
 *   Sec. 1  "Unlike the AMP discriminator, which only considers the character's motion, our discriminator jointly examines the character and the
 *            object in the scene. This allows our discriminator to evaluate the realism of the character's movements within the context of a
 *            scene (e.g., a sitting motion is realistic only when a chair is present)."
 *   Sec. 4  "... object position, and object orientation are recorded in the character's local coordinate frame. ... These object features
 *            enable the discriminator to not only judge the realism of the motion but also how realistic the motion is w.r.t. to the object."
 * Two motions are played one after the other, and both are shown to two discriminators at once:
 *   motion 1  the character walks to the chair, turns and sits on it
 *   motion 2  the character stops short, turns and makes the same sitting motion where there is no chair
 *   left      a discriminator that is given the body only (AMP's): the chair is not drawn, because it is not in its input.
 *             The two motions are the same to it, so its verdict is the same.
 *   right     this paper's discriminator: it is also given the object's pose relative to the body (the blue arrow), and can tell them apart.
 * The verdicts are words, not scores: no numbers, no axes. data-step = the click that reveals the figure: its loop starts at that click.
 */
DeckAnim.register('interphys-judge', function (el, A) {
  'use strict';
  var C = A.C, AMBER = C.amber, BLUE = C.blue, GREEN = C.g, RED = C.red, TAU = 2 * Math.PI;
  var STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var VW = 300, VX = [12, 336], GY = 212;                  // two views of 300 px; ground line of both
  var X0 = 34, XC = 244, BACK = 30, SPEED = 86;            // start of the walk, centre of the seat, how far the hip moves back when sitting, walking speed (px/s)
  var SEAT = 36;                                           // height of the seat above the ground

  // ---------- a stick figure seen from the side; dir = +1 faces right, -1 faces left (in between: turning)
  function fig(parent) {
    var g = A.el('g', { fill: 'none', stroke: AMBER, 'stroke-width': 7.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    return { g: g, far: A.el('path', { 'stroke-opacity': 0.5 }, g), near: A.el('path', {}, g), head: A.el('circle', { r: 11, fill: AMBER, stroke: 'none' }, g) };
  }
  // P = { ln: [thigh, knee], lf: [...], an: [upper arm, elbow], af: [...], lean }   n = near side, f = far side; angles in rad from "straight down"
  function walk(ph) {
    function leg(p) { return [0.46 * Math.sin(p), 0.1 + 0.85 * Math.max(0, Math.cos(p))]; }
    function arm(p) { return [-0.42 * Math.sin(p), 0.35 + 0.15 * Math.sin(p)]; }
    return { ln: leg(ph), lf: leg(ph + Math.PI), an: arm(ph + Math.PI), af: arm(ph), lean: 0.07 };
  }
  var STAND = { ln: [0.03, 0.06], lf: [-0.03, 0.06], an: [0.05, 0.25], af: [-0.05, 0.25], lean: 0.02 };
  var SIT = { ln: [1.46, 1.46], lf: [1.36, 1.40], an: [0.30, 1.05], af: [0.22, 1.00], lean: -0.10 };
  function mix(a, b, u) {
    var o = { lean: A.lerp(a.lean, b.lean, u) };
    ['ln', 'lf', 'an', 'af'].forEach(function (key) { o[key] = [A.lerp(a[key][0], b[key][0], u), A.lerp(a[key][1], b[key][1], u)]; });
    return o;
  }
  var TH = 35, SH = 35, TO = 49, UA = 27, LA = 26;
  function pose(F, x0, P, dir) {                           // -> hip position
    function ext(q) { return TH * Math.cos(q[0]) + SH * Math.cos(q[0] - q[1]); }
    var hy = GY - Math.max(ext(P.ln), ext(P.lf)), hx = x0; // the lower foot stands on the ground
    var sx = hx + dir * TO * Math.sin(P.lean), sy = hy - TO * Math.cos(P.lean);
    function leg(q) {
      var kx = hx + dir * TH * Math.sin(q[0]), ky = hy + TH * Math.cos(q[0]), fa = q[0] - q[1];
      return 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'L' + (kx + dir * SH * Math.sin(fa)).toFixed(1) + ' ' + (ky + SH * Math.cos(fa)).toFixed(1) + 'l' + (dir * 9).toFixed(1) + ' 0';
    }
    function arm(q) {
      var ex = sx + dir * UA * Math.sin(q[0]), ey = sy + UA * Math.cos(q[0]), fa = q[0] + q[1];
      return 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + (ex + dir * LA * Math.sin(fa)).toFixed(1) + ' ' + (ey + LA * Math.cos(fa)).toFixed(1);
    }
    A.set(F.far, { d: leg(P.lf) + arm(P.af) });
    A.set(F.near, { d: leg(P.ln) + 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + sx.toFixed(1) + ' ' + sy.toFixed(1) + arm(P.an) });
    A.set(F.head, { cx: sx + dir * 15 * Math.sin(P.lean), cy: sy - 15 * Math.cos(P.lean) });
    return [hx, hy];
  }

  // ---------- static parts: two views, their headers, the ground, the chair (right view only), the verdict pills
  function label(x, y, s, o) { return A.text(el, x, y, s, { size: o.size || 20, weight: o.weight || 500, fill: o.fill || C.mid, anchor: o.anchor || 'start', halo: false }); }
  A.el('line', { x1: 324, y1: 14, x2: 324, y2: 271, stroke: '#2c2c2c', 'stroke-width': 2 }, el);
  label(VX[0] + 6, 31, 'Body only', { size: 22, weight: 700, fill: '#fff' });
  label(VX[0] + 6, 57, 'AMP’s discriminator', {});
  var h2 = A.el('text', { x: VX[1] + 6, y: 31, style: 'font:700 22px ' + A.FONT + ';fill:#fff' }, el);
  A.el('tspan', { text: 'Body + ' }, h2); A.el('tspan', { text: 'object pose', style: 'fill:' + BLUE }, h2);
  label(VX[1] + 6, 57, 'this paper’s discriminator', {});
  var views = VX.map(function (vx, i) {
    var g = A.el('g', { transform: 'translate(' + vx + ' 0)' }, el), v = { g: g };
    A.el('line', { x1: 6, y1: GY + 3, x2: VW - 6, y2: GY + 3, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    if (i === 1) {                                         // the chair, and the arrow from the body to it: the object features of the state
      A.el('path', { d: 'M' + (XC - 19) + ' ' + (GY - SEAT + 4) + 'H' + (XC + 21) + 'M' + (XC + 21) + ' ' + (GY - SEAT - 44) + 'V' + (GY + 1) + 'M' + (XC - 17) + ' ' + (GY - SEAT + 4) + 'V' + (GY + 1),
        fill: 'none', stroke: BLUE, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      v.arrow = A.el('g', {}, g);
      v.shaft = A.el('line', { stroke: BLUE, 'stroke-width': 3, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }, v.arrow);
      v.tip = A.el('path', { fill: BLUE }, v.arrow);
    }
    v.f = fig(g);
    var cx = VW / 2, pw = 236, ph = 36, py = 232;
    v.pill = A.el('rect', { x: cx - pw / 2, y: py, width: pw, height: ph, rx: ph / 2, 'stroke-width': 2 }, g);
    v.mark = A.el('path', { fill: 'none', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    v.say = A.text(g, cx + 13, py + 25, '', { size: 20, anchor: 'middle', halo: false });
    v.cx = cx; v.py = py;
    return v;
  });
  function verdict(v, bad, o) {                            // bad: 0 = "like the data", 1 = "not like the data"
    var col = bad > 0.5 ? RED : GREEN, s = bad > 0.5 ? 'not like the data' : 'like the data', w = bad > 0.5 ? 86 : 64;
    A.set(v.pill, { fill: bad > 0.5 ? 'rgba(255,107,94,.13)' : 'rgba(118,185,0,.13)', stroke: col });
    A.set(v.say, { text: s }); v.say.style.fill = col;
    var mx = v.cx + 13 - w - 16, my = v.py + 18;
    A.set(v.mark, { stroke: col, d: bad > 0.5 ? 'M' + (mx - 6) + ' ' + (my - 6) + 'l12 12M' + (mx + 6) + ' ' + (my - 6) + 'l-12 12' : 'M' + (mx - 7) + ' ' + my + 'l5 6l9 -12' });
    var flip = Math.abs(bad - 0.5) * 2;                    // the pill fades through 0 while the verdict changes
    A.show(v.pill, o * flip); A.show(v.mark, o * flip); A.show(v.say, o * flip);
  }

  // ---------- one loop: motion 1 (sits on the chair), then motion 2 (sits where there is no chair)
  var EP = 5.2, T = 2 * EP, T_TURN = 0.45, T_SIT = 0.8, T_OUT = 0.4, PERIOD = 1.1;
  var STOP = [XC - BACK, 104];                             // where the character stops walking in motion 1 and in motion 2
  return function draw(f) {
    var t = A.loop(f.step >= STEP ? f.ts : f.t, T), m = t < EP ? 0 : 1, te = t - m * EP;
    var tw = (STOP[m] - X0) / SPEED, uTurn = A.ease(A.ramp(te, tw, tw + T_TURN)), uSit = A.ease(A.ramp(te, tw + T_TURN, tw + T_TURN + T_SIT));
    var x = A.lerp(X0, STOP[m], A.clamp(te / tw, 0, 1)) + BACK * uSit, dir = 1 - 2 * uTurn;
    dir = (dir > 0 ? 1 : -1) * Math.max(Math.abs(dir), 0.3);                  // while it turns the figure narrows, but never to a single line
    var P = te < tw ? walk(TAU * te / PERIOD) : mix(mix(walk(TAU * tw / PERIOD), STAND, A.ramp(te, tw, tw + 0.25)), SIT, uSit);
    var o = Math.min(A.ramp(te, 0, 0.3), 1 - A.ramp(te, EP - T_OUT, EP));
    var bad = m ? A.ramp(te, tw + T_TURN + 0.15, tw + T_TURN + 0.6) : 0;      // motion 2: the sitting starts, and there is no chair under it
    views.forEach(function (v, i) {
      var h = pose(v.f, x, P, dir);
      A.show(v.f.g, o);
      verdict(v, i ? bad : 0, o);
      if (i) {
        var tx = XC, ty = GY - SEAT - 2, dx = tx - h[0], dy = ty - h[1], L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
        var ax = h[0] + ux * 12, ay = h[1] + uy * 12 - 6, bx = tx - ux * 8, by = ty - uy * 8 - 6;      // drawn a little above the hip line, so the legs do not hide it
        A.set(v.shaft, { x1: ax, y1: ay, x2: bx - ux * 9, y2: by - uy * 9 });
        A.set(v.tip, { d: 'M' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'L' + (bx - ux * 13 - uy * 6).toFixed(1) + ' ' + (by - uy * 13 + ux * 6).toFixed(1) + 'L' + (bx - ux * 13 + uy * 6).toFixed(1) + ' ' + (by - uy * 13 - ux * 6).toFixed(1) + 'z' });
        A.show(v.arrow, o * A.ramp(L, 48, 74));
      }
    });
  };
});
