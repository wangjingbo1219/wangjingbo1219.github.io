/* Slide "PHC — how" (tools/slides/05a_10_phc.py):  <svg data-anim="phc-recover" viewBox="0 0 720 300">, under the first two pipeline boxes.
 * SCHEMATIC side view: hand-posed stick figures, not a simulation. White = the simulated humanoid, green = the reference motion. 100 px = 1 m.
 *   step 0    a tracker that falls: the reference walks on, the humanoid stays down; more than 0.5 m apart counts as failure
 *             (Luo et al. 2023, Sec. 3.1 "early termination" and Sec. 4 "Metrics": joints on average > 0.5 m from the reference)
 *   step >= 1 the recovery primitive (Sec. 3.2 "Fail-state Recovery", Eq. 3 and 4): it starts fallen and far away (2-5 m in training),
 *             its goal is the reference ROOT only, its reward pays for the root distance d_t getting smaller;
 *             within 0.5 m the goal switches back to the full pose and imitation resumes
 * The only numbers are the paper's 0.5 m; the start distance drawn is 4.3 m, inside the paper's 2-5 m.
 */
DeckAnim.register('phc-recover', function (el, A) {
  'use strict';
  var C = A.C, K = window.PHCKit, GY = 250, XR = 580, ZONE = 50, PI = Math.PI;
  var L = { th: 42, sh: 40, to: 50, nk: 15, hd: 10, ua: 27, fa: 25 };
  var KEYS = ['lean', 'hl', 'kl', 'hr', 'kr', 'sl', 'el', 'sr', 'er'];
  // pose: lean = torso from vertical (+ = toward +x); hl / hr = thighs from "down" (+ = forward), kl / kr = knee bend; sl / sr = upper arms, el / er = elbow bend
  var STAND = { lean: 0, hl: 0.06, kl: 0.05, hr: -0.06, kr: 0.05, sl: 0.12, el: 0.25, sr: -0.12, er: 0.25 };
  var LIE = { lean: -PI / 2, hl: 0.05, kl: 0.05, hr: -0.04, kr: 0.12, sl: 0.3, el: 0.2, sr: 0.12, er: 0.3 };
  var SIT = { lean: -0.35, hl: 2.2, kl: 2.6, hr: 2.0, kr: 2.4, sl: -0.7, el: 0.2, sr: -0.5, er: 0.2 };
  var CROUCH = { lean: 0.75, hl: 1.9, kl: 2.3, hr: 1.7, kr: 2.2, sl: 0.2, el: 0.6, sr: 0.4, er: 0.6 };
  function WALK(ph) {
    var s = Math.sin(ph), c = Math.cos(ph);
    return { lean: 0.07, hl: 0.5 * s, kl: 0.12 + 0.75 * Math.max(0, c), hr: -0.5 * s, kr: 0.12 + 0.75 * Math.max(0, -c), sl: -0.5 * s, el: 0.45, sr: 0.5 * s, er: 0.45 };
  }
  function REF(t) {                                                   // the reference motion of step 1: on the spot, swaying, one arm raised
    var a = 1.6 * t;
    return { lean: 0.06 * Math.sin(a), hl: 0.22 * Math.sin(a), kl: 0.22 + 0.14 * Math.sin(a + 1), hr: -0.22 * Math.sin(a), kr: 0.22 - 0.14 * Math.sin(a + 1),
             sl: 1.5 + 0.6 * Math.sin(2.1 * t), el: 0.5, sr: -0.3 + 0.5 * Math.sin(2.1 * t + 2), er: 0.5 };
  }
  function blend(a, b, u) { var o = {}; for (var i = 0; i < KEYS.length; i++) o[KEYS[i]] = A.lerp(a[KEYS[i]], b[KEYS[i]], u); return o; }
  function keys(t, ks) {                                              // eased pose through key frames [[time, pose], ...]
    for (var i = 1; i < ks.length; i++) if (t <= ks[i][0]) return blend(ks[i - 1][1], ks[i][1], A.ease(A.ramp(t, ks[i - 1][0], ks[i][0])));
    return ks[ks.length - 1][1];
  }
  function v(a, len) { return [Math.sin(a) * len, Math.cos(a) * len]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  /** joint positions of pose p with the hip at x; the lowest joint rests on the ground */
  function fk(p, x) {
    var le = p.lean, up = [Math.sin(le), -Math.cos(le)], J = { hip: [0, 0] }, k, low = -1e9;
    J.kL = v(p.hl - le, L.th); J.fL = add(J.kL, v(p.hl - le - p.kl, L.sh));
    J.kR = v(p.hr - le, L.th); J.fR = add(J.kR, v(p.hr - le - p.kr, L.sh));
    J.nk = [up[0] * L.to, up[1] * L.to]; J.hd = [up[0] * (L.to + L.nk), up[1] * (L.to + L.nk)];
    J.eL = add(J.nk, v(p.sl - le, L.ua)); J.hL = add(J.eL, v(p.sl - le + p.el, L.fa));
    J.eR = add(J.nk, v(p.sr - le, L.ua)); J.hR = add(J.eR, v(p.sr - le + p.er, L.fa));
    for (k in J) low = Math.max(low, J[k][1] + (k === 'hd' ? L.hd - 4 : 0));
    var y = GY - 4 - low;
    for (k in J) J[k] = [J[k][0] + x, J[k][1] + y];
    return J;
  }
  function figure(col, sw, parent) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    return { g: g, back: A.el('path', { 'stroke-opacity': 0.5 }, g), front: A.el('path', {}, g), head: A.el('circle', { r: L.hd, fill: col, stroke: 'none' }, g) };
  }
  function P(a) { return a[0].toFixed(1) + ' ' + a[1].toFixed(1); }
  function put(fg, J) {
    A.set(fg.back, { d: 'M' + P(J.fR) + 'L' + P(J.kR) + 'L' + P(J.hip) + 'M' + P(J.hR) + 'L' + P(J.eR) + 'L' + P(J.nk) });
    A.set(fg.front, { d: 'M' + P(J.fL) + 'L' + P(J.kL) + 'L' + P(J.hip) + 'L' + P(J.nk) + 'M' + P(J.hL) + 'L' + P(J.eL) + 'L' + P(J.nk) });
    A.set(fg.head, { cx: J.hd[0].toFixed(1), cy: J.hd[1].toFixed(1) });
  }

  // ---- static parts
  var all = A.el('g', {}, el);
  A.el('path', { d: 'M4 14H34', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round' }, all); K.text(A, all, 44, 21, 'simulated humanoid', { fill: C.mid });
  A.el('path', { d: 'M262 14H292', stroke: C.g, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, all); K.text(A, all, 302, 21, 'reference', { fill: C.mid });
  A.el('path', { d: 'M6 ' + (GY + 1) + 'H714', stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, all);
  var scene = A.el('g', {}, all);
  // the 0.5 m zone around the reference root (step >= 1)
  var zone = A.el('g', {}, scene);
  A.el('path', { d: 'M' + (XR - ZONE) + ' ' + (GY + 1) + 'H' + (XR + ZONE), stroke: C.g, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-opacity': 0.6 }, zone);
  K.text(A, zone, XR + ZONE + 12, GY + 25, '0.5 m', { fill: C.g, weight: 700 });
  var ref = figure(C.g, 4.5, scene), JN = ['nk', 'hd', 'eL', 'hL', 'eR', 'hR', 'kL', 'fL', 'kR', 'fR'], rdots = A.el('g', {}, scene), rd = {};
  JN.forEach(function (k) { rd[k] = A.el('circle', { r: 4.6, fill: '#d9ff7a', stroke: '#101010', 'stroke-width': 1.5 }, rdots); });
  var goalLine = A.el('path', { stroke: C.g, 'stroke-width': 3, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round', fill: 'none' }, scene);
  var me = figure('#fff', 7, scene);
  var root = A.el('circle', { r: 7, fill: '#d9ff7a', stroke: '#101010', 'stroke-width': 2 }, scene), halo = A.el('circle', { fill: 'none', stroke: '#d9ff7a', 'stroke-width': 2.5 }, scene);
  var gRoot = K.text(A, scene, XR, 44, 'goal: the root only', { anchor: 'middle', fill: '#d9ff7a', weight: 700 });
  var gFull = K.text(A, scene, XR, 44, 'goal: the full pose', { anchor: 'middle', fill: '#d9ff7a', weight: 700 });
  var brk = A.el('path', { fill: 'none', 'stroke-width': 3, 'stroke-linecap': 'round' }, scene);
  var dLab = K.text(A, scene, 0, GY + 43, K.sub('d', 't'), { anchor: 'middle', fill: C.amber, weight: 700, size: 22 });
  var lost = K.text(A, scene, 0, GY + 43, 'more than 0.5 m apart: tracking failed', { anchor: 'middle', fill: C.red, weight: 700 });

  function bracket(x0, x1, col) { A.set(brk, { d: 'M' + x0.toFixed(1) + ' ' + (GY + 10) + 'v12M' + x0.toFixed(1) + ' ' + (GY + 16) + 'H' + x1.toFixed(1) + 'M' + x1.toFixed(1) + ' ' + (GY + 10) + 'v12', stroke: col }); }

  return function draw(f) {
    var st = f.step, T, tau, fade, Jm, Jr;
    A.show(all, st === 2 && st < f.steps ? 0.38 : 1);                 // the composer is being explained next to it
    if (st === 0) {                                                   // ---- a tracker that falls
      T = 9.5; tau = A.loop(f.t, T); fade = Math.min(A.ramp(tau, 0, 0.4), 1 - A.ramp(tau, T - 0.5, T));
      var W0 = 2 * PI / 0.9, tw = Math.min(tau, 6.4), xr = 150 + 70 * tw, xh, hp;
      Jr = fk(tau < 6.4 ? WALK(W0 * tau) : blend(WALK(W0 * 6.4), STAND, A.ease(A.ramp(tau, 6.4, 6.8))), xr);
      if (tau < 2.4) { xh = xr - 6; hp = WALK(W0 * tau); }
      else { var u = A.ease(A.ramp(tau, 2.4, 3.3)); xh = A.lerp(150 + 70 * 2.4 - 6, 300, u); hp = blend(WALK(W0 * 2.4), LIE, u); }
      Jm = fk(hp, xh);
      var far = A.ramp(xr - xh, ZONE, ZONE + 12);
      A.show(zone, 0); A.show(rdots, 0); A.show(goalLine, 0); A.show(root, 0); A.show(halo, 0); A.show(gRoot, 0); A.show(gFull, 0); A.show(dLab, 0);
      A.show(ref.g, 1);
      bracket(xh, xr, C.red); A.show(brk, far);
      A.set(lost, { x: ((xh + xr) / 2).toFixed(1) }); A.show(lost, far);
    } else {                                                          // ---- the recovery primitive
      T = 11.5; tau = A.loop(f.ts, T); fade = Math.min(A.ramp(tau, 0, 0.4), 1 - A.ramp(tau, T - 0.6, T));
      var W1 = 2 * PI / 0.85, rp = REF(tau), x, pose, full = A.ramp(tau, 7.4, 7.8);
      if (tau < 3.2) { pose = keys(tau, [[0.9, LIE], [1.7, SIT], [2.5, CROUCH], [3.2, STAND]]); x = A.lerp(150, 158, A.ramp(tau, 0.9, 3.2)); }
      else if (tau < 7.4) { pose = blend(STAND, WALK(W1 * (tau - 3.2)), A.ramp(tau, 3.2, 3.5)); x = A.lerp(158, XR - ZONE, A.ramp(tau, 3.2, 7.4)); }
      else { var b = A.ease(A.ramp(tau, 7.4, 8.2)); pose = blend(WALK(W1 * 4.2), rp, b); x = A.lerp(XR - ZONE, XR - 6, b); }
      Jr = fk(rp, XR); Jm = fk(pose, x);
      A.show(zone, 1); A.show(lost, 0);
      A.show(ref.g, 0.5 + 0.5 * full); A.show(rdots, full);
      JN.forEach(function (k) { A.set(rd[k], { cx: Jr[k][0].toFixed(1), cy: Jr[k][1].toFixed(1) }); });
      A.set(root, { cx: Jr.hip[0].toFixed(1), cy: Jr.hip[1].toFixed(1) }); A.show(root, 1);
      A.set(halo, { cx: Jr.hip[0].toFixed(1), cy: Jr.hip[1].toFixed(1), r: (11 + 9 * A.loop(tau, 1.2) / 1.2).toFixed(1) });
      A.show(halo, (1 - full) * (1 - A.loop(tau, 1.2) / 1.2));
      A.set(goalLine, { d: 'M' + P(Jm.hip) + 'L' + P(Jr.hip) }); A.show(goalLine, 1 - full);
      A.show(gRoot, 1 - A.ramp(tau, 7.4, 7.55)); A.show(gFull, A.ramp(tau, 7.55, 7.75));       // one label leaves before the other arrives
      bracket(x, XR, C.amber); A.show(brk, 1 - full);
      A.set(dLab, { x: ((x + XR) / 2).toFixed(1) }); A.show(dLab, 1 - full);
    }
    put(ref, Jr); put(me, Jm);
    A.show(scene, fade);
  };
});
