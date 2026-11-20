/* Slide "Tennis - how", last click: the hybrid control.   <svg data-anim="tennis-wrist" data-step="4" viewBox="0 0 760 190">
 * A SCHEMATIC, not a simulation and not data: a side view of one shot, played twice.
 *   grey    the swing arm as the motion embedding gives it. The embedding was learned from video, where blur and occlusion hide the wrist
 *           (Zhang et al. 2023, section 7: "notable errors in the character's estimated wrist motion (and corresponding racket motion).
 *           Even small errors in swing motion can prevent the high-level policy from finding motion solutions that accurately hit the ball").
 *           The ball is hit, but it misses the court: Table 2, "w/o HybridCtr", keeps a hit rate of 0.85 and loses half of the bounce-in rate.
 *   green   the same pose with the wrist and the elbow twist overwritten by the high-level policy (section 7.1: "The joint corrections
 *           overwrite the rotations from the MVAE-produced pose"). The ball comes down near the target.
 * No numbers, no axes, no scale: the arm is drawn much larger than the court. data-step = the click that reveals the figure; its loop starts there.
 */
DeckAnim.register('tennis-wrist', function (el, A) {
  'use strict';
  var C = A.C, GREEN = C.g, GREY = '#a4a4a4', DIM = '#5a5a5a', RED = C.red;
  var STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var GY = 150, NX = 430, BX = 700, TX = 655;                       // ground, net, far baseline, target
  var S = [130, 64], E = [170, 99], WR = [213, 85];                 // shoulder, elbow, wrist
  var PHI_G = 31 * Math.PI / 180, PHI_C = 2 * Math.PI / 180;        // racket angle from the vertical: as decoded, as corrected
  function headOf(phi) { return [WR[0] - 52 * Math.sin(phi), WR[1] - 52 * Math.cos(phi)]; }
  var CG = headOf(PHI_G), CC = headOf(PHI_C);
  var LG = [742, GY - 7], QG = [430, -38];                              // grey flight: long, beyond the baseline
  var LC = [641, GY - 7], QC = [372, 8];                                // green flight: comes down at the target
  var I0 = [752, 80], IQ = [540, 66], IB = [352, GY - 7], IQ2 = [292, 58];   // the incoming ball: over the net, one bounce, up to the racket

  function mix(a, b, u) {                                           // blend of two '#rrggbb' colours
    var o = '#';
    for (var i = 1; i < 7; i += 2) { var x = parseInt(a.substr(i, 2), 16), y = parseInt(b.substr(i, 2), 16); o += ('0' + Math.round(x + (y - x) * u).toString(16)).slice(-2); }
    return o;
  }
  function bez(p0, q, p1, u) { var v = 1 - u; return [v * v * p0[0] + 2 * u * v * q[0] + u * u * p1[0], v * v * p0[1] + 2 * u * v * q[1] + u * u * p1[1]]; }
  function arc(p0, q, p1, u) {                                      // the part 0..u of a quadratic Bezier, as a path
    var a = [A.lerp(p0[0], q[0], u), A.lerp(p0[1], q[1], u)], b = bez(p0, q, p1, u);
    return 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + 'Q' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
  }

  // ---------- the court, seen from the side
  A.el('line', { x1: 96, y1: GY, x2: BX, y2: GY, stroke: '#4a4a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  A.el('line', { x1: BX, y1: GY, x2: 754, y2: GY, stroke: '#4a4a4a', 'stroke-width': 3, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, el);
  A.el('line', { x1: BX, y1: GY - 9, x2: BX, y2: GY + 9, stroke: '#8a8a8a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  A.el('path', { d: 'M' + NX + ' ' + GY + 'V' + (GY - 30) + 'M' + (NX - 5) + ' ' + (GY - 30) + 'h10', fill: 'none', stroke: '#9a9a9a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var tring = A.el('circle', { cx: TX, cy: GY, fill: 'none', stroke: RED, 'stroke-width': 3 }, el);
  A.el('rect', { x: TX - 22, y: GY - 4, width: 44, height: 8, rx: 4, fill: RED }, el);
  A.text(el, TX, GY + 30, 'target', { size: 20, weight: 500, fill: RED, anchor: 'middle', halo: false });
  A.text(el, 0, GY + 30, 'schematic', { size: 20, weight: 500, fill: C.mute, halo: false });

  // ---------- the player: a dim stick figure, the swing arm drawn larger and brighter
  var body = A.el('g', { fill: 'none', stroke: DIM, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  A.el('path', { d: 'M129 58 L122 106 L106 ' + GY + ' M122 106 L142 ' + GY }, body);
  A.el('circle', { cx: 130, cy: 40, r: 12, fill: DIM, stroke: 'none' }, body);
  A.el('path', { d: A.path([S, E, WR]), fill: 'none', stroke: '#d4d4d4', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);

  // ---------- flights (under the rackets and the ball)
  var trailG = A.el('path', { fill: 'none', stroke: GREY, 'stroke-width': 3.5, 'stroke-dasharray': '9 8', 'stroke-linecap': 'round' }, el);
  var trailC = A.el('path', { fill: 'none', stroke: GREEN, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var miss = A.el('g', {}, el);
  A.el('path', { d: 'M' + (LG[0] - 8) + ' ' + (GY - 8) + 'l16 16 M' + (LG[0] + 8) + ' ' + (GY - 8) + 'l-16 16', stroke: GREY, 'stroke-width': 4, 'stroke-linecap': 'round' }, miss);
  A.text(miss, LG[0], GY - 20, 'out', { size: 20, fill: GREY, anchor: 'middle' });

  // ---------- rackets: the decoded one stays as a dashed ghost once the corrected one has taken over
  function racket(parent, col, dash) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round' }, parent);
    if (dash) g.setAttribute('stroke-dasharray', dash);
    return { g: g, shaft: A.el('line', {}, g), head: A.el('ellipse', { rx: 26, ry: 6.5, fill: '#101010' }, g) };
  }
  function place(R, phi) {
    var dx = -Math.sin(phi), dy = -Math.cos(phi), deg = Math.atan2(dy, dx) * 180 / Math.PI;
    A.set(R.shaft, { x1: WR[0], y1: WR[1], x2: WR[0] + 26 * dx, y2: WR[1] + 26 * dy });
    A.set(R.head, { cx: WR[0] + 52 * dx, cy: WR[1] + 52 * dy, transform: 'rotate(' + deg.toFixed(1) + ' ' + (WR[0] + 52 * dx).toFixed(1) + ' ' + (WR[1] + 52 * dy).toFixed(1) + ')' });
  }
  var ghost = racket(el, GREY, '6 7'), act = racket(el, GREY, null);
  place(ghost, PHI_G);

  // ---------- the two joints the policy overwrites
  var jw = A.el('circle', { cx: WR[0], cy: WR[1], r: 9, fill: '#101010', 'stroke-width': 4 }, el);
  var je = A.el('circle', { cx: E[0], cy: E[1], r: 9, fill: '#101010', 'stroke-width': 4 }, el);
  var pw = A.el('circle', { cx: WR[0], cy: WR[1], fill: 'none', stroke: GREEN, 'stroke-width': 3 }, el);
  var pe = A.el('circle', { cx: E[0], cy: E[1], fill: 'none', stroke: GREEN, 'stroke-width': 3 }, el);
  var lw = A.text(el, WR[0] + 17, WR[1] + 25, 'wrist', { size: 20 });
  var le = A.text(el, E[0] - 4, E[1] + 32, 'elbow', { size: 20 });

  // ---------- legend under the court
  A.el('line', { x1: 128, y1: GY + 23, x2: 164, y2: GY + 23, stroke: GREY, 'stroke-width': 3.5, 'stroke-dasharray': '9 8', 'stroke-linecap': 'round' }, el);
  A.text(el, 174, GY + 30, 'decoder\u2019s wrist', { size: 20, weight: 500, fill: GREY, halo: false });
  A.el('line', { x1: 346, y1: GY + 23, x2: 382, y2: GY + 23, stroke: GREEN, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  A.text(el, 392, GY + 30, 'overwritten', { size: 20, weight: 500, fill: GREEN, halo: false });

  var ball = A.el('circle', { r: 7, fill: '#f2ff5a', stroke: '#101010', 'stroke-width': 2 }, el);

  // ---------- one loop: the shot with the decoded arm, the correction, the same shot again
  var T = 8.2, IN = 0.8, FLY_G = 1.4, FLY_C = 1.25;               // both results stay on screen for a good second before the loop fades out
  var A0 = 0.3, A1 = A0 + IN, A2 = A1 + FLY_G;                      // grey: incoming, contact, landing
  var FIX0 = 3.1, FIX1 = 3.8;                                       // the policy overwrites wrist and elbow
  var B0 = 3.95, B1 = B0 + IN, B2 = B1 + FLY_C;                     // green: incoming, contact, landing
  function incoming(u, c) { return u < 0.62 ? bez(I0, IQ, IB, u / 0.62) : bez(IB, IQ2, c, (u - 0.62) / 0.38); }
  return function draw(f) {
    var t = A.loop(f.step >= STEP ? f.ts : f.t, T);
    var out = 1 - A.ramp(t, T - 0.65, T - 0.35);                    // everything that was drawn fades before the loop restarts ...
    var back = 1 - A.ease(A.ramp(t, T - 0.45, T - 0.05));           // ... and the arm goes back to the decoded pose, so that the loop restarts where it ends
    var fix = A.ease(A.ramp(t, FIX0, FIX1)) * back, fixed = t >= FIX0;
    var hue = A.ramp(t, FIX0, FIX0 + 0.2) * back;                   // 0 = as decoded (grey), 1 = overwritten (green)
    // rackets and joints
    place(act, A.lerp(PHI_G, PHI_C, fix));
    act.g.setAttribute('stroke', mix(GREY, GREEN, hue));
    A.show(ghost.g, A.ramp(t, FIX0, FIX0 + 0.3) * out);
    var jc = mix(GREY, GREEN, hue), lc = mix('#d4d4d4', GREEN, hue);
    jw.setAttribute('stroke', jc); je.setAttribute('stroke', jc);
    lw.style.fill = lc; le.style.fill = lc;
    var pu = A.ramp(t, FIX0, FIX0 + 0.9);
    A.set(pw, { r: 9 + 20 * pu }); A.set(pe, { r: 9 + 20 * pu });
    A.show(pw, fixed ? 1 - pu : 0); A.show(pe, fixed ? 1 - pu : 0);
    // flights
    var ug = A.ramp(t, A1, A2), uc = A.ramp(t, B1, B2);
    A.set(trailG, { d: arc(CG, QG, LG, Math.max(ug, 0.001)) }); A.show(trailG, t >= A1 ? out : 0);
    A.set(trailC, { d: arc(CC, QC, LC, Math.max(uc, 0.001)) }); A.show(trailC, t >= B1 ? out : 0);
    A.show(miss, A.ramp(t, A2, A2 + 0.25) * out);
    var hit = t - B2;
    A.set(tring, { r: 6 + 26 * A.ramp(hit, 0, 0.6) }); A.show(tring, hit >= 0 ? (1 - A.ramp(hit, 0, 0.6)) : 0);
    // the ball
    var p = null;
    if (t >= A0 && t < A1) p = incoming((t - A0) / IN, CG);
    else if (t >= A1 && t < A2) p = bez(CG, QG, LG, ug);
    else if (t >= A2 && t < FIX0) p = LG;
    else if (t >= B0 && t < B1) p = incoming((t - B0) / IN, CC);
    else if (t >= B1 && t < B2) p = bez(CC, QC, LC, uc);
    else if (t >= B2) p = LC;
    if (p) A.set(ball, { cx: p[0].toFixed(1), cy: p[1].toFixed(1) });
    A.show(ball, p ? (t >= A2 && t < FIX0 ? 1 - A.ramp(t, FIX0 - 0.5, FIX0 - 0.1) : out) : 0);
  };
});
