/* OmniH2O, slide "how": what is trained in simulation, stage by stage.   <svg data-anim="omnih2o-train" viewBox="0 0 1150 373">
 * A SCHEMATIC (stick figures in profile, no numbers except the paper's "25 steps"); three zones, one under each of the first three pipeline boxes:
 *   zone 0  (click 0)  the data: a retargeted clip, and its standing and squatting variants (root and lower body fixed, upper body unchanged; Fig. 2)
 *   zone 1  (click 1)  the teacher's view: the full-body reference (green ghost) and pose + velocity of every body (amber dots and arrows)
 *   zone 2  (click 2)  the student's view of the SAME state: three target points (head, hands), what the robot can measure (blue: joints, root
 *                      gravity) and the last 25 steps of it (the strip). On the click the full-body ghost fades until only the three points are left.
 *   click 3            DAgger: the teacher's action for this state travels to the student (the arc); at six joints of the student's view an amber
 *                      hand is the teacher's action and a green hand the student's; the wedge between them is what the loss penalises, and it closes.
 *   click 4            training under pushes: every 5 s a push hits the robot (both views show the same robot), it sways and recovers.
 * Colours: green = reference / the policy's action, white = simulated robot, amber = the teacher (privileged state, its action), blue = onboard signals.
 * Zones that are not being explained dim; on the finished slide everything is at full strength.
 */
DeckAnim.register('omnih2o-train', function (el, A) {
  'use strict';
  var C = A.C, GRN = C.g, AMB = C.amber, BLU = C.blue, RED = C.red, GREY = '#8a8f96', DIM = '#5e5e5e', DIM2 = '#454545';
  var YF = 306, ZC = [181, 575, 1000], S1 = 1.02, S0 = 0.8, TL = 9, LAG = 0.16;
  var TAU = 2 * Math.PI;

  // ------------------------------------------------------------------ kinematics of the profile figure (angles in rad; y grows downwards)
  function kin(p, x0, s) {
    var TH = 62 * s, SH = 62 * s, TO = 80 * s, NK = 27 * s, UA = 46 * s, FA = 44 * s, AK = 8 * s, FT = 22 * s;
    var eN = TH * Math.cos(p.hN) + SH * Math.cos(p.hN - p.kN), eF = TH * Math.cos(p.hF) + SH * Math.cos(p.hF - p.kF);
    var px = x0 + (p.dx || 0) * s, py = YF - AK - Math.max(eN, eF);
    function leg(h, k) {
      var kx = px + TH * Math.sin(h), ky = py + TH * Math.cos(h), ax = kx + SH * Math.sin(h - k), ay = ky + SH * Math.cos(h - k);
      return { k: [kx, ky], a: [ax, ay], t: [ax + FT, ay + AK * 0.55] };
    }
    function arm(sx, sy, a, b) {
      var ex = sx + UA * Math.sin(a), ey = sy + UA * Math.cos(a);
      return { e: [ex, ey], h: [ex + FA * Math.sin(a + b), ey + FA * Math.cos(a + b)] };
    }
    var sx = px + TO * Math.sin(p.l), sy = py - TO * Math.cos(p.l);
    return { P: [px, py], S: [sx, sy], H: [sx + NK * Math.sin(p.l), sy - NK * Math.cos(p.l)], r: 13 * s,
             lN: leg(p.hN, p.kN), lF: leg(p.hF, p.kF), aN: arm(sx, sy, p.aN, p.bN), aF: arm(sx, sy, p.aF, p.bF) };
  }
  function sm(u) { return u <= 0 ? 0 : (u >= 1 ? 1 : u * u * (3 - 2 * u)); }
  function arms(u, q) {
    var c = 0.5 - 0.5 * Math.cos(TAU * u / 3), d = 1 - c;
    return { aN: (0.25 + 0.95 * c) * (1 - q) + 1.0 * q, bN: (0.95 - 0.5 * c) * (1 - q) + 0.3 * q,
             aF: (0.25 + 0.95 * d) * (1 - q) + 0.85 * q, bF: (0.95 - 0.5 * d) * (1 - q) + 0.35 * q };
  }
  /** the reference motion of zones 1 and 2: steps on the spot with the arms working, then a squat with a forward reach; loops every TL seconds */
  function ref(t) {
    var u = ((t % TL) + TL) % TL;
    var q = u > 4.5 ? Math.pow(Math.sin(Math.PI * (u - 4.5) / 4.5), 2) : 0;
    var m = u < 4.5 ? sm(u / 0.4) * sm((4.5 - u) / 0.4) : 0, s1 = Math.sin(TAU * u / 1.5);
    var p = arms(u, q);
    p.hN = m * 0.8 * Math.max(0, s1) + q * 1.05; p.kN = m * 1.5 * Math.max(0, s1) + q * 2.1;
    p.hF = m * 0.8 * Math.max(0, -s1) + q * 1.05; p.kF = m * 1.5 * Math.max(0, -s1) + q * 2.1;
    p.l = 0.05 + 0.42 * q;
    return p;
  }
  /** zone 0: the clip (k = 0), its standing variant (1) and its squatting variant (2): same arms, lower body fixed in the variants */
  function clip(t, k) {
    var p = arms(t, 0), s1 = Math.sin(TAU * t / 1.5);
    if (k === 0) { p.hN = 0.8 * Math.max(0, s1); p.kN = 1.5 * Math.max(0, s1); p.hF = 0.8 * Math.max(0, -s1); p.kF = 1.5 * Math.max(0, -s1); p.l = 0.05; p.dx = 9 * Math.sin(TAU * t / 3); }
    else if (k === 1) { p.hN = p.kN = p.hF = p.kF = 0; p.l = 0.05; }
    else { p.hN = p.hF = 1.05; p.kN = p.kF = 2.1; p.l = 0.3; }
    return p;
  }
  /** push response: starts at u = 0, peaks after 0.18 s, gone after about 1.5 s (px at scale 1) */
  function sway(u) { return u <= 0 ? 0 : 40 * (Math.exp(-3 * u) - Math.exp(-9 * u)); }

  // ------------------------------------------------------------------ drawing helpers
  function P(a) { return a[0].toFixed(1) + ' ' + a[1].toFixed(1); }
  function fig(parent, o) {            // o: col (near), far, legs (near legs colour), legsFar, w
    var g = A.el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    return { g: g,
      legF: A.el('path', { stroke: o.legsFar || o.far, 'stroke-width': o.w }, g), armF: A.el('path', { stroke: o.far, 'stroke-width': o.w }, g),
      legN: A.el('path', { stroke: o.legs || o.col, 'stroke-width': o.w }, g), body: A.el('path', { stroke: o.col, 'stroke-width': o.w }, g),
      head: A.el('circle', { fill: o.headFill || o.col, stroke: 'none' }, g) };
  }
  function put(f, K) {
    A.set(f.legF, { d: 'M' + P(K.P) + 'L' + P(K.lF.k) + 'L' + P(K.lF.a) + 'L' + P(K.lF.t) });
    A.set(f.armF, { d: 'M' + P(K.S) + 'L' + P(K.aF.e) + 'L' + P(K.aF.h) });
    A.set(f.legN, { d: 'M' + P(K.P) + 'L' + P(K.lN.k) + 'L' + P(K.lN.a) + 'L' + P(K.lN.t) });
    A.set(f.body, { d: 'M' + P(K.P) + 'L' + P(K.S) + 'M' + P(K.S) + 'L' + P(K.aN.e) + 'L' + P(K.aN.h) });
    A.set(f.head, { cx: K.H[0].toFixed(1), cy: K.H[1].toFixed(1), r: K.r.toFixed(1) });
  }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  function bodies(K) {                 // one point per rigid body
    return [K.H, mid(K.P, K.S), K.P, mid(K.S, K.aN.e), mid(K.aN.e, K.aN.h), mid(K.S, K.aF.e), mid(K.aF.e, K.aF.h),
            mid(K.P, K.lN.k), mid(K.lN.k, K.lN.a), K.lN.t, mid(K.P, K.lF.k), mid(K.lF.k, K.lF.a), K.lF.t];
  }
  function joints(K) { return [K.S, K.aN.e, K.aF.e, K.P, K.lN.k, K.lF.k, K.lN.a, K.lF.a]; }
  /** the six joints whose action is drawn: [joint, the point its limb leads to] */
  function acts(K) { return [[K.S, K.aN.e], [K.aN.e, K.aN.h], [K.P, K.lN.k], [K.lN.k, K.lN.a], [K.S, K.aF.e], [K.P, K.lF.k]]; }
  function ang(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]); }
  function label(parent, x, y, s, col, anchor) { return A.text(parent, x, y, s, { size: 20, weight: 600, fill: col, anchor: anchor || 'middle', halo: false }); }
  function arrowHead(x, y, a, s) {
    return 'M' + (x - s * Math.cos(a - 0.45)).toFixed(1) + ' ' + (y - s * Math.sin(a - 0.45)).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) +
           'L' + (x - s * Math.cos(a + 0.45)).toFixed(1) + ' ' + (y - s * Math.sin(a + 0.45)).toFixed(1);
  }

  // ------------------------------------------------------------------ static parts
  A.el('path', { d: 'M362 82V355M787 82V355', stroke: '#242424', 'stroke-width': 2 }, el);          // both start below the arc of click 3
  var Z = [A.el('g', {}, el), A.el('g', {}, el), A.el('g', {}, el)], OV = A.el('g', {}, el);
  Z.forEach(function (g, k) {          // the floor of each zone
    var x0 = [14, 380, 805][k], x1 = [348, 772, 1136][k];
    A.el('path', { d: 'M' + x0 + ' ' + (YF + 1) + 'H' + x1, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  });

  // zone 0: a clip and its two variants
  var X0 = [44, 153, 262], F0 = [];
  for (var k0 = 0; k0 < 3; k0++) {
    F0.push(fig(Z[0], k0 ? { col: GRN, far: '#4f7a06', legs: GREY, legsFar: '#5b6066', w: 7 } : { col: GRN, far: '#4f7a06', w: 7 }));
    label(Z[0], X0[k0], 337, ['clip', 'standing', 'squatting'][k0], k0 ? '#fff' : GRN);
  }
  A.el('path', { d: 'M92 324V347', stroke: '#3a3a3a', 'stroke-width': 2 }, Z[0]);
  label(Z[0], 207.5, 361, 'lower body fixed', C.mid);
  var pins = [A.el('path', { fill: GREY, stroke: 'none' }, Z[0]), A.el('path', { fill: GREY, stroke: 'none' }, Z[0])];

  // zone 1: the teacher's view
  var ghost1 = fig(Z[1], { col: GRN, far: GRN, w: 17 }); ghost1.g.setAttribute('opacity', 0.34);
  var rob1 = fig(Z[1], { col: '#f2f2f2', far: '#9a9a9a', w: 8 });
  var pv = [], pd = [];
  for (var i1 = 0; i1 < 13; i1++) {
    pv.push(A.el('path', { fill: 'none', stroke: AMB, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, Z[1]));
    pd.push(A.el('circle', { r: 4.6, fill: AMB, stroke: '#101010', 'stroke-width': 1.5 }, Z[1]));
  }
  label(Z[1], 575, 337, 'every body: pose and velocity', AMB);
  label(Z[1], 575, 361, 'the full-body reference', GRN);

  // zone 2: the student's view of the same state
  var ghost2 = fig(Z[2], { col: GRN, far: GRN, w: 17 });
  var rob2 = fig(Z[2], { col: DIM, far: DIM2, w: 8 });
  var grav = A.el('path', { fill: 'none', stroke: BLU, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, Z[2]);
  var wed = [], sAct = [], tAct2 = [];
  for (var i3 = 0; i3 < 6; i3++) {
    wed.push(A.el('path', { fill: AMB, 'fill-opacity': 0.42, stroke: 'none' }, Z[2]));
    tAct2.push(A.el('path', { fill: 'none', stroke: AMB, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, Z[2]));
    sAct.push(A.el('path', { fill: 'none', stroke: GRN, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, Z[2]));
  }
  var jd = [];
  for (var i4 = 0; i4 < 8; i4++) jd.push(A.el('circle', { r: 5.2, fill: BLU, stroke: '#101010', 'stroke-width': 1.5 }, Z[2]));
  var imu = A.el('rect', { width: 15, height: 15, rx: 3, fill: BLU, stroke: '#101010', 'stroke-width': 1.5 }, Z[2]);
  var tl = [], td = [];
  for (var i5 = 0; i5 < 3; i5++) {
    tl.push(A.el('path', { fill: 'none', stroke: GRN, 'stroke-width': 2.4, 'stroke-dasharray': '4 4' }, Z[2]));
    td.push(A.el('circle', { r: 8.5, fill: GRN, stroke: '#fff', 'stroke-width': 2.4 }, Z[2]));
  }
  // the last 25 steps of an onboard signal (schematic; here: the near shoulder), newest on the right
  var HX = 806, HY = 280, HN = 25, HP = 4.9, hist = [], hg = A.el('g', {}, Z[2]);          // below the height at which a push arrives
  label(hg, HX, 222, 'last 25 steps', BLU, 'start');
  A.el('path', { d: 'M' + (HX - 2) + ' ' + (HY + 1.5) + 'H' + (HX + HN * HP), stroke: '#3a3a3a', 'stroke-width': 2 }, hg);
  for (var i6 = 0; i6 < HN; i6++) hist.push(A.el('rect', { x: (HX + i6 * HP).toFixed(1), width: 3.1, fill: BLU }, hg));
  label(Z[2], 968, 337, '3 target points: head, hands', GRN);
  label(Z[2], 968, 361, 'what the robot can measure', BLU);

  // overlay: the teacher's action travels to the student (click 3), pushes (click 4)
  var arc = A.el('path', { fill: 'none', stroke: AMB, 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' }, OV);
  var arcH = A.el('path', { fill: 'none', stroke: AMB, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, OV);
  var arcL = label(OV, 787, 64, 'the teacher’s action', AMB), arcD = [];
  for (var i7 = 0; i7 < 4; i7++) arcD.push(A.el('circle', { r: 5.5, fill: '#ffe08a', stroke: '#101010', 'stroke-width': 1.5 }, OV));
  var AP = [[622, 42], [787, 2], [952, 42]];
  function arcAt(u) { var v = 1 - u; return [v * v * AP[0][0] + 2 * v * u * AP[1][0] + u * u * AP[2][0], v * v * AP[0][1] + 2 * v * u * AP[1][1] + u * u * AP[2][1]]; }
  A.set(arc, { d: 'M' + P(AP[0]) + 'Q' + P(AP[1]) + ' ' + P(AP[2]) });
  A.set(arcH, { d: arrowHead(AP[2][0], AP[2][1], Math.atan2(AP[2][1] - AP[1][1], AP[2][0] - AP[1][0]), 12) });
  var push = [A.el('path', { fill: 'none', stroke: RED, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, OV),
              A.el('path', { fill: 'none', stroke: RED, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, OV)];
  var pushL = [label(OV, 0, 0, 'push', RED), label(OV, 0, 0, 'push', RED)];

  var ERR = [0.62, -0.5, -0.46, 0.55, -0.58, 0.44];       // how far the untrained student's action is off, per drawn joint (rad; schematic)

  return function draw(f) {
    var st = f.step, t = f.t, ts = f.ts, last = st >= f.steps;
    var on = function (k) { return st > k ? 1 : (st === k ? A.ramp(ts, 0, 0.5) : 0); };
    var lit = [last || st === 0, last || st === 1 || st >= 3, last || st >= 2];
    A.show(Z[0], lit[0] ? 1 : 0.42);
    A.show(Z[1], on(1) * (lit[1] ? 1 : 0.42));
    A.show(Z[2], on(2) * (lit[2] ? 1 : 0.42));

    // ---- zone 0
    for (var k = 0; k < 3; k++) {
      var K0 = kin(clip(t, k), X0[k], S0);
      put(F0[k], K0);
      if (k) A.set(pins[k - 1], { d: 'M' + (K0.P[0] - 6).toFixed(1) + ' ' + (K0.P[1] - 6).toFixed(1) + 'h12v12h-12z' });
    }

    // ---- the robot of zones 1 and 2 (one state, two views) and its reference
    var tp = st === 4 ? ts - 0.7 : t - 1.0, per = 5, u = st >= 4 ? ((((tp + 0.5) % per) + per) % per) - 0.5 : -1;
    if (st === 4 && tp < 0) u = tp;                      // the first push comes 0.7 s after the click, then one every 5 s (App. F)
    var pr = ref(t - LAG), dxp = sway(u);
    pr.dx = dxp; pr.l += 0.006 * dxp;
    var R = [kin(pr, ZC[1], S1), kin(pr, ZC[2], S1)], G = [kin(ref(t), ZC[1], S1), kin(ref(t), ZC[2], S1)];
    var pr0 = ref(t - LAG - 0.05); pr0.dx = sway(u - 0.05); pr0.l += 0.006 * pr0.dx;
    var Rm = kin(pr0, ZC[1], S1);

    // zone 1
    if (st >= 1) {
      put(ghost1, G[0]); put(rob1, R[0]);
      var B = bodies(R[0]), B0 = bodies(Rm);
      for (var i = 0; i < 13; i++) {
        var vx = (B[i][0] - B0[i][0]) / 0.05 * 0.2, vy = (B[i][1] - B0[i][1]) / 0.05 * 0.2, vl = Math.hypot(vx, vy);
        if (vl > 46) { vx *= 46 / vl; vy *= 46 / vl; vl = 46; }
        if (B[i][1] + vy > YF - 3) { var cut = Math.max(0, (YF - 3 - B[i][1]) / vy); vx *= cut; vy *= cut; vl *= cut; }      // an arrow stops at the floor
        A.set(pd[i], { cx: B[i][0].toFixed(1), cy: B[i][1].toFixed(1) });
        if (vl > 5) {
          var ex = B[i][0] + vx, ey = B[i][1] + vy;
          A.set(pv[i], { d: 'M' + P(B[i]) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + arrowHead(ex, ey, Math.atan2(vy, vx), 7) });
          A.show(pv[i], 1);
        } else A.show(pv[i], 0);
      }
    }

    // zone 2
    if (st >= 2) {
      var gh = st === 2 ? 0.34 * (1 - A.ease(A.ramp(ts, 1.0, 2.2))) : 0;
      A.show(ghost2.g, gh); if (gh > 0) put(ghost2, G[1]);
      put(rob2, R[1]);
      var J = joints(R[1]);
      for (var j = 0; j < 8; j++) A.set(jd[j], { cx: J[j][0].toFixed(1), cy: J[j][1].toFixed(1) });
      var Pp = R[1].P, gx = Pp[0] - 22, gy = Pp[1] - 8;
      A.set(imu, { x: (gx - 7.5).toFixed(1), y: (gy - 7.5).toFixed(1) });
      A.set(grav, { d: 'M' + gx.toFixed(1) + ' ' + gy.toFixed(1) + 'V' + (gy + 34).toFixed(1) + arrowHead(gx, gy + 34, Math.PI / 2, 8) });
      var T3 = [G[1].H, G[1].aN.h, G[1].aF.h], R3 = [R[1].H, R[1].aN.h, R[1].aF.h];
      for (var m = 0; m < 3; m++) {
        A.set(td[m], { cx: T3[m][0].toFixed(1), cy: T3[m][1].toFixed(1) });
        A.set(tl[m], { d: 'M' + P(R3[m]) + 'L' + P(T3[m]) });
      }
      var tq = Math.floor(t / 0.09) * 0.09;
      for (var h = 0; h < HN; h++) {
        var a = ref(tq - (HN - 1 - h) * 0.09 - LAG).aN, v = A.clamp((a - 0.2) / 1.0, 0, 1), hh = 5 + 38 * v;
        A.set(hist[h], { y: (HY - hh).toFixed(1), height: hh.toFixed(1), 'fill-opacity': h === HN - 1 ? 1 : 0.35 + 0.4 * h / HN });
      }
    }

    // ---- click 3: the teacher's action and the student's, joint by joint
    var o3 = on(3), prog = st > 3 ? 1 : (st === 3 ? 1 - Math.exp(-Math.max(0, ts - 1.2) / 1.5) : 0);
    A.show(arc, o3); A.show(arcH, o3); A.show(arcL, o3);
    for (var d = 0; d < 4; d++) {
      var ua = (((t * 0.42 + d / 4) % 1) + 1) % 1, pa = arcAt(ua);
      A.set(arcD[d], { cx: pa[0].toFixed(1), cy: pa[1].toFixed(1) });
      A.show(arcD[d], o3 * Math.min(1, ua / 0.08, (1 - ua) / 0.08));
    }
    if (st >= 3) {
      var Kn = kin(ref(t + 0.1), ZC[2], S1), AT = acts(R[1]), AN = acts(Kn), L = 38;
      for (var n = 0; n < 6; n++) {
        var th = ang(AN[n][0], AN[n][1]), wob = 0.75 + 0.25 * Math.sin(1.7 * t + 2.1 * n);
        var er = ERR[n] * (1 - prog) * wob + 0.05 * Math.sin(2.3 * t + n) * prog, ts2 = th + er, o = AT[n][0];
        A.set(tAct2[n], { d: 'M' + P(o) + 'l' + (L * Math.cos(th)).toFixed(1) + ' ' + (L * Math.sin(th)).toFixed(1) });
        A.set(sAct[n], { d: 'M' + P(o) + 'l' + (L * Math.cos(ts2)).toFixed(1) + ' ' + (L * Math.sin(ts2)).toFixed(1) });
        var r = L - 4, big = Math.abs(er) > Math.PI ? 1 : 0, sw = er > 0 ? 1 : 0;
        A.set(wed[n], { d: 'M' + P(o) + 'l' + (r * Math.cos(th)).toFixed(1) + ' ' + (r * Math.sin(th)).toFixed(1) +
          'A' + r + ' ' + r + ' 0 ' + big + ' ' + sw + ' ' + (o[0] + r * Math.cos(ts2)).toFixed(1) + ' ' + (o[1] + r * Math.sin(ts2)).toFixed(1) + 'Z' });
        A.show(tAct2[n], o3); A.show(sAct[n], o3); A.show(wed[n], o3);
      }
    } else for (var n2 = 0; n2 < 6; n2++) { A.show(tAct2[n2], 0); A.show(sAct[n2], 0); A.show(wed[n2], 0); }

    // ---- click 4: pushes
    var po = st >= 4 ? A.ramp(u, -0.45, -0.3) * (1 - A.ramp(u, 0.25, 0.6)) : 0;
    for (var z = 0; z < 2; z++) {
      var c = R[z].S, reach = 22 + 60 * (1 - A.ease(A.ramp(u, -0.45, 0))), x1 = c[0] - reach, y1 = c[1] + 26;
      A.set(push[z], { d: 'M' + (x1 - 52).toFixed(1) + ' ' + y1.toFixed(1) + 'H' + x1.toFixed(1) + arrowHead(x1, y1, 0, 14) });
      A.set(pushL[z], { x: (x1 - 28).toFixed(1), y: (y1 - 16).toFixed(1) });
      A.show(push[z], po); A.show(pushL[z], z ? 0 : po);
    }
  };
});
