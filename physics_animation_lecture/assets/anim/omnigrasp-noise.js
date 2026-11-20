/* Slide "Omnigrasp - how", clicks 0 and 1: where the exploration noise goes.   <svg data-anim="omnigrasp-noise" data-k="0|1" viewBox="0 0 596 298">
 * A SCHEMATIC (planar stick body, no simulation, no numbers). It restates two sentences of the paper (Luo et al. 2024):
 *   k = 0  section 1: "Exploration noise in the torso can lead to a large deviation in the location of the arm and wrist as the noise
 *          propagates through the kinematic chain. This can lead to the humanoid quickly knocking the object away."
 *          Every joint angle of the chain gets its own small noise of the same size; the amber scribbles are where the knee, the hip,
 *          the shoulder, the elbow and the hand go: they grow along the chain.
 *          The figure runs in short episodes: the first time the hand tip is inside the object (after a moment in which the noise can be
 *          watched), the object is knocked off its table and lies on the floor until the episode is reset.
 *   k = 1  section 2: with a motion latent "the policy can sample coherent motion instead of relying on random jittering noise".
 *          The dot in the square is the latent z (two of its dimensions drawn): a slow drift plus the SAME fast noise signals as in k = 0.
 *          The pose is a function of the dot and of nothing else, so every wiggle of z moves all joints together; the hand goes back and
 *          forth along "reach" and "lift" (green path) and stops at the object.
 * The mapping from z to the pose is two hand-made whole-body synergies; it stands for the PULSE-X decoder, it is not the decoder.
 * draw() is a pure function of f.t: the time of the first hit of an episode is found by scanning that episode (cached per episode).
 */
DeckAnim.register('omnigrasp-noise', function (el, A) {
  'use strict';
  var K = window.OGKit, C = A.C, k = parseInt(el.getAttribute('data-k') || '0', 10);
  var YG = 276, X0 = k ? 250 : 236;
  var BASE = [0.10, -0.22, 0.42, 1.05, 0.50, 0.15];                    // ankle, knee, hip, shoulder, elbow, wrist: standing, one arm reaching for the object
  var M1 = [0.04, -0.10, 0.16, 0.30, -0.32, 0.0], M2 = [0, 0.06, -0.06, 0.22, 0.30, -0.10];     // k = 1: "reach" and "lift" synergies
  var SIG = 0.12;                                                       // k = 0: size of the noise on every joint angle (rad)
  var ZJ = 0.12;                                                        // k = 1: size of the same noise on each of the two drawn dimensions of z
  var DX = k ? 126 : 110;                                               // k = 1: the object stands where the reach ends, so the hand arrives at it and does not go through it
  var OB = [X0 + DX, 152, 24, 24];                                      // the object (x, y, w, h)
  var COL = k ? C.g : C.amber;
  var jit = K.noise(A, 11, 8, 2.6, 6.5), slow = K.noise(A, 5, 2, 0.16, 0.42);
  var T0 = 4.4, GRACE = 1.3, FLY = 0.62, MS = 0.6;                      // k = 0: an episode (s), time before a hit counts, flight of the knocked object, size of the object

  // ---------- scenery
  A.el('line', { x1: 20, y1: YG + 1, x2: 576, y2: YG + 1, stroke: '#333', 'stroke-width': 2 }, el);
  A.el('rect', { x: X0 + DX + 15, y: 183, width: 8, height: YG - 182, fill: '#262626' }, el);
  A.el('rect', { x: X0 + DX - 6, y: 176, width: 50, height: 7, rx: 2, fill: '#444' }, el);
  K.text(A, el, 20, 38, k ? 'one ' + K.mi('z') + ' moves the whole body together' : 'noise adds up along the body', { size: 22, weight: 700 });
  var zdot = null, ztr = null, ZC = [62, 192], ZS = 42;
  if (k) {
    A.el('rect', { x: ZC[0] - ZS, y: ZC[1] - ZS, width: 2 * ZS, height: 2 * ZS, rx: 8, fill: '#141414', stroke: '#4a4a4a', 'stroke-width': 2 }, el);
    A.el('path', { d: 'M' + ZC[0] + ' ' + (ZC[1] - ZS) + 'V' + (ZC[1] + ZS) + 'M' + (ZC[0] - ZS) + ' ' + ZC[1] + 'H' + (ZC[0] + ZS), stroke: '#2c2c2c', 'stroke-width': 2 }, el);
    K.text(A, el, ZC[0], ZC[1] - ZS - 12, 'latent ' + K.mi('z'), { size: 20, anchor: 'middle', fill: C.mid });
    A.el('path', { d: 'M114 192H194M184 185L196 192L184 199', fill: 'none', stroke: C.mid, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    K.text(A, el, 154, 180, 'decoder', { size: 20, anchor: 'middle', fill: C.mid });
    ztr = A.el('polyline', { fill: 'none', stroke: C.g, 'stroke-width': 2, 'stroke-opacity': 0.55, 'stroke-linejoin': 'round' }, el);
    zdot = A.el('circle', { r: 6, fill: C.g }, el);
  }
  var trail = A.el('polyline', { fill: 'none', stroke: COL, 'stroke-width': k ? 3 : 2.2, 'stroke-opacity': 0.9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  var body = K.body(A, el, '#e6e6e6', '#63676d');
  var JT = ['K', 'H', 'S', 'E'], jtr = JT.map(function () {                     // where the knee, hip, shoulder and elbow go (drawn over the body)
    return A.el('polyline', { fill: 'none', stroke: COL, 'stroke-width': 2, 'stroke-opacity': 0.9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el); });
  var obj = K.mug(A, el, C.blue);
  var tip = A.el('circle', { r: 5, fill: COL }, el);
  var LX = k ? 416 : X0 + 172, LE = k ? [370, 146] : [X0 + 136, 147];  // the label of the hand's path and where its leader ends (just left of the object's top)
  A.el('path', { d: 'M' + (LX - 6) + ' 138L' + LE[0] + ' ' + LE[1], stroke: COL, 'stroke-width': 1.6, 'stroke-opacity': 0.7 }, el);
  K.text(A, el, LX, 134, 'path of the hand', { size: 20, fill: COL });
  var OX = OB[0] + 12, OY = OB[1] + 12, LANDX = OX + 96, LANDY = YG - 20 * MS - 2.5;     // the object at rest on the table; where it lies after the knock
  var knockT = k ? null : K.text(A, el, LANDX + 6, LANDY - 26, 'knocked away', { size: 20, weight: 700, fill: C.red, anchor: 'middle' });

  /** k = 1: the latent at time t = a slow drift (what the policy asks for) + the same fast noise as the joints get in k = 0 */
  function zs(t) {
    return [-0.2 + 0.8 * A.clamp(slow(0, t) * 1.45, -1, 1) + ZJ * jit(0, t), A.clamp(slow(1, t) * 1.45, -1, 1) + ZJ * jit(1, t)];
  }
  function pose(t) {
    var q = BASE.slice(), i;
    if (k) { var z = zs(t); for (i = 0; i < 6; i++) q[i] += z[0] * M1[i] + z[1] * M2[i]; }
    else for (i = 0; i < 6; i++) q[i] += SIG * jit(i, t);
    return q;
  }
  function inObj(p) { return p[0] > OB[0] - 4 && p[0] < OB[0] + OB[2] + 6 && p[1] > OB[1] - 4 && p[1] < OB[1] + OB[3] + 4; }
  var hitCache = {};
  /** k = 0: the first moment of episode n (after the grace time) at which the hand tip is inside the object, or -1 */
  function hitTime(n) {
    if (!(n in hitCache)) {
      var th = -1;
      for (var t = n * T0 + GRACE; t < (n + 1) * T0 - 1.6; t += 1 / 60) if (inObj(K.fk(pose(t), X0, YG).T)) { th = t; break; }
      hitCache[n] = th;
    }
    return hitCache[n];
  }
  /** the object: centre (x, y), turned by rot */
  function place(x, y, rot) {
    var c = Math.cos(rot), s = Math.sin(rot);
    K.pts(obj.n, K.MUG.map(function (p) { return [x + MS * (p[0] * c - p[1] * s), y + MS * (p[0] * s + p[1] * c)]; }));
  }
  place(OX, OY, 0);
  var F2 = [X0 - 30, YG - 5];

  return function draw(f) {
    var t = f.t, P = K.fk(pose(t), X0, YG), far, z = k ? zs(t) : null;
    if (k) far = [-P.a3 - 0.05 - 0.28 * z[0], -P.a3 + 0.3 - 0.2 * z[0]];
    else far = [-P.a3 + 0.2 + SIG * jit(6, t), -P.a3 + 0.5 + SIG * (jit(6, t) + jit(7, t))];
    body(P, F2, far);
    A.set(tip, { cx: P.T[0].toFixed(1), cy: P.T[1].toFixed(1) });
    var n = k ? 100 : 60, dt = 0.03, pts = [], i;
    var jp = [[], [], [], []];
    for (i = 0; i < n; i++) {
      var tt = t - i * dt; if (tt < 0) break;
      var Pt = K.fk(pose(tt), X0, YG); pts.push(Pt.T);
      for (var c = 0; c < 4; c++) jp[c].push(Pt[JT[c]]);
    }
    K.pts(trail, pts);
    for (i = 0; i < jtr.length; i++) K.pts(jtr[i], jp[i]);
    if (k) {
      var zp = [], j;
      for (j = 0; j < 16; j++) {
        var tj = t - j * 0.03; if (tj < 0) break;
        var zz = zs(tj);
        zp.push([ZC[0] + 6 + 30 * zz[0], ZC[1] - 26 * zz[1]]);
      }
      K.pts(ztr, zp);
      A.set(zdot, { cx: zp[0][0].toFixed(1), cy: zp[0][1].toFixed(1) });
    } else {
      var ep = Math.floor(t / T0), tl = t - ep * T0, th = hitTime(ep), u = th >= 0 ? t - th : -1;
      var vis = Math.min(A.ramp(tl, 0, 0.35), 1 - A.ramp(tl, T0 - 0.45, T0)), oc = u >= 0 ? C.red : C.blue;
      if (u >= 0) {                                   // knocked: a short flight off the table, then it lies on the floor until the reset
        var w = A.clamp(u / FLY, 0, 1);
        place(A.lerp(OX, LANDX, w), OY - 120 * (w * FLY) + (LANDY - OY + 120 * FLY) * w * w, Math.PI * w);
      } else place(OX, OY, 0);
      if (obj.n.getAttribute('fill') !== oc) A.set(obj.n, { fill: oc, stroke: oc });
      A.show(obj.n, vis);
      A.show(knockT, u >= 0 ? Math.min(A.ramp(u, FLY, FLY + 0.25), vis) : 0);          // the label comes once the object has landed (it flies through that spot)
    }
  };
});
