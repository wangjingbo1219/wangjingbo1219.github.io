/* Slide "AMP - how", last click: who picks the skill?   <svg data-anim="amp-pick" data-step="3" viewBox="0 0 570 330">
 * A SCHEMATIC, not a simulation and not data. It restates one sentence of the paper (Peng et al. 2021, section 8.2, Strike task):
 * "The resulting policy learns to walk to the target when it is far away, and then transition to a punching motion once it is within
 * range to hit the target ... the motion clips in the dataset contain strictly walking-only motions or punching-only motion".
 *   top     five clips of the dataset (green, as in the authors' video): three walking, two punching, in no order and without labels
 *   bottom  the policy's character (amber) walks to the target and punches it; the target turns green when it is hit (as in the video)
 *   glow    the clips that the policy's current motion resembles. The discriminator itself never names a clip.
 * The task reward of the paper (eq. 18) pays for approaching while the target is far, for striking once it is near, and a constant 1 (its
 * maximum) after the hit: the amber line.
 * No numbers, no axes. data-step = the click that reveals the figure: its loop starts at that click.
 */
DeckAnim.register('amp-pick', function (el, A) {
  'use strict';
  var C = A.C, GREEN = C.g, AMBER = C.amber, TAU = 2 * Math.PI;
  var STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var W = 570, GY = 313;                                   // ground line of the scene

  // ---------- a stick figure seen from the side, facing right
  function fig(parent, col, k, sw) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    return { g: g, far: A.el('path', { 'stroke-opacity': 0.5 }, g), near: A.el('path', {}, g), head: A.el('circle', { r: 11.5 * k, fill: col, stroke: 'none' }, g), k: k };
  }
  // P = { ln: [thigh, knee], lf: [...], an: [upper arm, elbow], af: [...], lean }   n = near side, f = far side; angles in rad from "straight down"
  function walk(ph) {
    function leg(p) { return [0.46 * Math.sin(p), 0.1 + 0.85 * Math.max(0, Math.cos(p))]; }
    function arm(p) { return [-0.42 * Math.sin(p), 0.35 + 0.15 * Math.sin(p)]; }
    return { ln: leg(ph), lf: leg(ph + Math.PI), an: arm(ph + Math.PI), af: arm(ph), lean: 0.07 };
  }
  function punch(e) {                                      // e = 0 guard, 1 arm stretched out
    return { ln: [0.40, 0.30], lf: [-0.36, 0.10], an: [A.lerp(0.75, 1.50, e), A.lerp(2.0, 0.06, e)], af: [0.55, 2.15], lean: 0.13 + 0.10 * e };
  }
  function mix(a, b, u) {
    var o = { lean: A.lerp(a.lean, b.lean, u) };
    ['ln', 'lf', 'an', 'af'].forEach(function (key) { o[key] = [A.lerp(a[key][0], b[key][0], u), A.lerp(a[key][1], b[key][1], u)]; });
    return o;
  }
  function jab(tau) {                                      // arm extension over one jab that starts at tau = 0
    if (tau < 0 || tau > 0.52) return 0;
    if (tau < 0.12) return A.ease(tau / 0.12);
    if (tau < 0.22) return 1;
    return 1 - A.ease((tau - 0.22) / 0.30);
  }
  function pose(F, x0, y0, P) {
    var k = F.k, TH = 34 * k, SH = 34 * k, TO = 48 * k, UA = 26 * k, LA = 26 * k;
    function ext(q) { return TH * Math.cos(q[0]) + SH * Math.cos(q[0] - q[1]); }
    var hy = y0 - Math.max(ext(P.ln), ext(P.lf)), hx = x0;               // the lower foot stands on the ground
    var sx = hx + TO * Math.sin(P.lean), sy = hy - TO * Math.cos(P.lean);
    function leg(q) {
      var kx = hx + TH * Math.sin(q[0]), ky = hy + TH * Math.cos(q[0]), fa = q[0] - q[1];
      return 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'L' + (kx + SH * Math.sin(fa)).toFixed(1) + ' ' + (ky + SH * Math.cos(fa)).toFixed(1) + 'l' + (9 * k).toFixed(1) + ' 0';
    }
    function arm(q) {
      var ex = sx + UA * Math.sin(q[0]), ey = sy + UA * Math.cos(q[0]), fa = q[0] + q[1];
      return 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + (ex + LA * Math.sin(fa)).toFixed(1) + ' ' + (ey + LA * Math.cos(fa)).toFixed(1);
    }
    A.set(F.far, { d: leg(P.lf) + arm(P.af) });
    A.set(F.near, { d: leg(P.ln) + 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + sx.toFixed(1) + ' ' + sy.toFixed(1) + arm(P.an) });
    A.set(F.head, { cx: sx + 15 * k * Math.sin(P.lean), cy: sy - 15 * k * Math.cos(P.lean) });
  }

  // ---------- top: five clips of the dataset
  A.text(el, 14, 25, 'the clips', { size: 20, weight: 500, fill: C.mid, halo: false });
  A.text(el, W - 14, 25, 'style reward: move like these', { size: 20, fill: GREEN, anchor: 'end', halo: false });
  var KIND = ['w', 'p', 'w', 'w', 'p'], CW = 98, CH = 94, CX0 = 14, CGAP = 13, CY = 36, cards = [];
  KIND.forEach(function (kind, i) {
    var x = CX0 + i * (CW + CGAP), g = A.el('g', {}, el);
    var halo = A.el('rect', { x: x - 3, y: CY - 3, width: CW + 6, height: CH + 6, rx: 13, fill: 'none', stroke: GREEN, 'stroke-width': 5, 'stroke-opacity': 0.35 }, g);
    A.el('rect', { x: x + 1.5, y: CY + 1.5, width: CW - 3, height: CH - 3, rx: 10, fill: '#0c0c0c', stroke: GREEN, 'stroke-width': 2.5 }, g);
    A.el('line', { x1: x + 16, y1: CY + CH - 10, x2: x + CW - 16, y2: CY + CH - 10, stroke: '#3a3a3a', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
    cards.push({ kind: kind, g: g, halo: halo, f: fig(g, GREEN, 0.5, 4.6), x: x + (kind === 'w' ? CW / 2 - 2 : CW / 2 - 12), ph: i * 1.7 });
  });

  // ---------- bottom: the policy's character and the target
  var say = A.text(el, 14, 161, '', { size: 20, fill: AMBER, halo: false });
  A.el('line', { x1: 14, y1: GY + 2, x2: W - 14, y2: GY + 2, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var BX = 508, BY = GY - 106, BR = 20;                    // the target: a ball at shoulder height
  var ring = A.el('circle', { cx: BX, cy: BY, fill: 'none', stroke: GREEN, 'stroke-width': 3 }, el);
  var ball = A.el('circle', { cy: BY, r: BR, stroke: '#101010', 'stroke-width': 2 }, el);
  var tl = A.text(el, BX, BY - 33, 'target', { size: 20, weight: 500, fill: C.mid, anchor: 'middle', halo: false });
  var pol = fig(el, AMBER, 0.95, 8);

  // ---------- one loop
  // walk -> set the feet -> hold the guard for a moment (the label and the glow have switched) -> ONE jab -> stand. No second jab: once the target
  // has been hit the task reward is a constant 1 (eq. 18), so nothing pays for hitting it again.
  var T = 8.0, X0 = 58, X1 = 431, T_WALK = 4.2, T_SET = 4.6, T_JAB = 5.3, T_HIT = T_JAB + 0.12, T_OUT = 7.0, T_GONE = 7.5, PERIOD = 1.15;
  return function draw(f) {
    var t = A.loop(f.step >= STEP ? f.ts : f.t, T), k;
    // the policy: walks, sets its feet, jabs once
    var x = A.lerp(X0, X1, A.clamp(t / T_WALK, 0, 1)), u = A.ease(A.ramp(t, T_WALK - 0.1, T_SET));
    var e = jab(t - T_JAB);
    pose(pol, x, GY, mix(walk(TAU * t / PERIOD), punch(e), u));
    A.show(pol.g, Math.min(A.ramp(t, 0, 0.35), 1 - A.ramp(t, T_OUT, T_GONE)));
    // the target
    var hit = t >= T_HIT, since = t - T_HIT;
    A.set(ball, { cx: BX + (hit ? 7 * Math.exp(-5 * since) * Math.sin(14 * since) : 0), fill: hit ? GREEN : C.red });
    A.set(ring, { r: BR + 22 * A.ramp(since, 0, 0.45) }); A.show(ring, hit ? 1 - A.ramp(since, 0, 0.45) : 0);
    A.set(tl, { text: hit && t < T_GONE ? 'hit' : 'target' }); tl.style.fill = hit && t < T_GONE ? GREEN : C.mid;
    if (t >= T_GONE) A.set(ball, { fill: C.red });
    // what the task reward pays for (paper, eq. 18: approach while far, strike once near, a constant 1 after the hit)
    A.set(say, { text: t < T_WALK || t >= T_GONE ? 'task reward: far away, come closer' : (hit ? 'task reward: target hit, paid in full' : 'task reward: within reach, hit it') });
    // the clips: walking ones glow while the policy walks, punching ones while it punches
    var near = t >= T_GONE ? 1 - A.ease(A.ramp(t, T_GONE, T)) : u;
    for (k = 0; k < cards.length; k++) {
      var c = cards[k], on = c.kind === 'w' ? 1 - near : near;
      if (c.kind === 'w') pose(c.f, c.x, CY + CH - 10, walk(TAU * (f.t / PERIOD) + c.ph));
      else pose(c.f, c.x, CY + CH - 10, punch(jab(A.loop(f.t + c.ph, 1.25) - 0.3)));
      A.show(c.g, 0.3 + 0.7 * on); A.show(c.halo, on);
    }
  };
});
