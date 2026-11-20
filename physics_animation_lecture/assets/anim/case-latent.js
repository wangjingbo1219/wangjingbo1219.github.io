/* Slide "C·ASE — how", click 2 (beside the authors' clip "random latents, one fixed skill label").   <svg data-anim="case-latent" viewBox="0 0 662 291">
 * SCHEMATIC (stick figure from case-0kit.js, hand-made variations of one sword swing; no data).
 * The skill label c is fixed. A new latent z is drawn on the sphere (blue dot), the policy performs the skill in another way,
 * and the encoder q has to say from the motion which z it was (dashed ring = its guess). Each z leaves its variation on the right.
 * Layout: the figures stand on one ground line; the encoder's path runs UNDER it (a raised sword must never cross a label or an arrow).
 */
DeckAnim.register('case-latent', function (el, A) {
  'use strict';
  var K = window.CaseKit, C = A.C, BLUE = C.blue, AMB = C.amber, MID = C.mid, VIO = C.violet;
  var SX = 114, SY = 134, SR = 82, MX = 308, GY = 226, HM = 140, HG = 66, GX0 = 436, GDX = 57, LY = 258, QY = 272;
  var SEG = 3.0, N = 4, HOLD = 1.5, PER = N * SEG + HOLD;
  var ZP = [[-0.42, -0.50], [0.52, -0.30], [0.30, 0.56], [-0.56, 0.28]].map(function (p) { return [SX + SR * p[0], SY + SR * p[1]]; });
  // four hand-made ways to do the same swing: how high it starts, where it ends, how far the body leans and steps
  var VAR = [{ hi: 158, lo: 52, lean: 15, step: 28 }, { hi: 128, lo: 95, lean: 2, step: 6 }, { hi: 172, lo: 18, lean: 30, step: 42 }, { hi: 146, lo: 70, lean: -6, step: -14 }];
  var SUBS = [1, 2, 3, 4].map(function (i) { return K.sub(i); });
  function T(p, x, y, s, o) {
    o = o || {};
    var n = A.text(p, x, y, '', { size: o.size || 20, fill: o.fill || '#fff', anchor: o.anchor || 'middle', weight: o.weight || 700, halo: !!o.halo });
    n.innerHTML = s;
    return n;
  }
  // ---- the latent sphere of this skill
  T(el, SX, 30, 'latent sphere of skill ' + '<tspan style="fill:' + VIO + '">' + K.mi('c') + '</tspan>', { fill: MID, weight: 500 });
  A.el('circle', { cx: SX, cy: SY, r: SR, fill: '#0b1216', stroke: '#cfd8dc', 'stroke-width': 2.5 }, el);
  A.el('ellipse', { cx: SX, cy: SY, rx: SR, ry: 0.3 * SR, fill: 'none', stroke: '#56646b', 'stroke-width': 2, 'stroke-dasharray': '5 6' }, el);
  A.el('ellipse', { cx: SX, cy: SY, rx: 0.34 * SR, ry: SR, fill: 'none', stroke: '#3b464b', 'stroke-width': 2, 'stroke-dasharray': '5 6' }, el);
  var old = ZP.map(function (p) { return A.el('circle', { cx: p[0], cy: p[1], r: 5, fill: BLUE, 'fill-opacity': 0.55 }, el); });
  var ring = A.el('circle', { r: 13, fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }, el);
  var dot = A.el('circle', { r: 8, fill: BLUE, stroke: '#0b0b0b', 'stroke-width': 2 }, el), zl = T(el, 0, 0, '', { anchor: 'start', fill: BLUE, halo: true, size: 21 });
  // ---- z goes into the policy; the encoder reads the motion and answers with a point on the sphere
  var QX = SX - 56, aZ = [[SX + SR + 8, SY], [MX - 50, SY]];
  var aQ = [[MX, GY + 9], [MX, QY], [QX, QY], [QX, SY + Math.sqrt(SR * SR - 56 * 56) + 7]];
  K.arrow(A, el, BLUE).set(aZ);
  K.arrow(A, el, '#e8e8e8', { dash: '7 6' }).set(aQ);
  T(el, (QX + MX) / 2, LY, 'encoder ' + K.mi('q') + ': which ' + K.mi('z') + '?');        // about 213 px wide: 19 px clear of the path on either side
  var dZ = K.dots(A, el, 1, BLUE, 4.5), dQ = K.dots(A, el, 2, '#fff', 4.5), tZ = K.track(aZ), tQ = K.track(aQ);
  A.el('line', { x1: MX - 62, y1: GY, x2: MX + 98, y2: GY, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var me = K.fig(A, el, AMB);
  // ---- one variation per z
  var gh = VAR.map(function (v, k) {
    var g = A.el('g', {}, el), f = K.fig(A, g, AMB), x = GX0 + GDX * k;
    K.put(A, f, x, GY, HG, K.swing(0.6, v));
    T(g, x + 6, GY - HG - 18, K.mi('z') + SUBS[k], { fill: BLUE });
    return g;
  });
  A.el('line', { x1: GX0 - 16, y1: GY, x2: 656, y2: GY, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  T(el, (GX0 - 16 + 656) / 2, LY, 'each ' + K.mi('z') + ', its own variation', { fill: MID, weight: 500 });

  return function draw(f) {
    var t = f.step === 2 ? f.ts : f.t, u = A.loop(t, PER), k = Math.min(N - 1, Math.floor(u / SEG)), tau = u - k * SEG, end = u >= N * SEG;
    var p0 = k ? ZP[k - 1] : ZP[0], p1 = ZP[k], e = k ? K.ease(tau / 0.45) : 1;
    var zx = A.lerp(p0[0], p1[0], e), zy = A.lerp(p0[1], p1[1], e);
    A.set(dot, { cx: zx.toFixed(1), cy: zy.toFixed(1) });
    A.set(zl, { x: (zx + 13).toFixed(1), y: (zy - 9).toFixed(1) }); K.html(zl, K.mi('z') + SUBS[k]);
    old.forEach(function (n, j) { A.show(n, j < k ? 1 : 0); });
    // the encoder's guess: it follows after it has seen the motion
    var g0 = k ? [ZP[k - 1][0] + 4, ZP[k - 1][1] - 3] : [SX, SY], g1 = [p1[0] + 4, p1[1] - 3], ge = K.ease((tau - 1.2) / 1.0);
    A.set(ring, { cx: A.lerp(g0[0], g1[0], ge).toFixed(1), cy: A.lerp(g0[1], g1[1], ge).toFixed(1) });
    A.show(ring, k ? 1 : A.ramp(tau, 0.9, 1.3));
    // the policy performs the skill once per z, in the way this z stands for
    K.put(A, me, MX, GY, HM, end ? K.REST : K.swing(A.clamp((tau - 0.35) / 2.1, 0, 1), VAR[k]));
    var fade = 1 - A.ramp(u, PER - 0.4, PER);
    gh.forEach(function (g, j) { A.show(g, (j < k ? 1 : (j === k ? A.ramp(tau, 1.5, 1.9) : 0)) * fade); });
    K.run(A, dZ, tZ, t, 40); K.run(A, dQ, tQ, t, 80);
  };
});
