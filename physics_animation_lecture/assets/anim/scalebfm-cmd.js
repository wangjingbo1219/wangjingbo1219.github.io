/* Slide "ScaleBFM — how", click 1: what the command is.   <svg data-anim="scalebfm-cmd" data-step="1" viewBox="0 0 1740 334">
 * SCHEMATIC, no data: the stick figures and their poses are made up. What is drawn is the paper's control interface
 * (Sec. 3.2, Control Interface Design) and its two ways of anchoring the command (Sec. 1; App. B.1).
 *
 * Left card: "masked whole-body target poses in the root-relative Cartesian space", without the mask (that is the next click).
 *   white   the robot now, seen from the front; amber dot and axes = its root (pelvis) and the root frame
 *   green   the reference's next frame, drawn BESIDE the robot so that both can be seen (a real next frame lies almost on the
 *           robot: the distance between the two figures means nothing; the label says "drawn apart"), and the target of each
 *           of the 14 links
 *   the whole-body target x_t has, for every link, four parts (the paper's formula):
 *     p_ref(t+1) - p_root(t)        the target position seen from the current root      -> a green line from the root to the target
 *     p_ref(t+1) - p(t)             its offset from where that link is now              -> a dashed white arrow (drawn for one hand)
 *     theta_ref(t+1) (-) theta_root(t), theta_ref(t+1) (-) theta(t)   the same for the rotation -> the small frame at the hand target
 *   The words and symbols of the legend are HTML next to this figure (tools/slides/07_35_scalebfm.py, SB_LEG).
 * Right card: one model, global or local control (App. B.1).
 *   global mode   the root target is a place in the room (amber pin under the reference); on the real robot the root is localized
 *                 with HTC VIVE Ultimate Trackers
 *   local mode    "the current root position specified by the control signal is treated as the robot's actual root position":
 *                 the reference (dashed outline: where it is in the room) is drawn on the robot; root orientation and whole-body
 *                 pose remain to be tracked. The paper's introduction calls this "re-anchoring the control signals to the
 *                 robot's current root state"
 *   The walk cycle is schematic; the ground runs under both walkers so that neither picture suggests a measured distance.
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('scalebfm-cmd', function (el, A) {
  'use strict';
  var SB = window.SBF, C = A.C, G = C.g, AM = C.amber, STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var i;

  // ---------------------------------------------------------------- left card: the whole-body target
  SB.card(A, el, 0, 0, 960, 334);
  SB.txt(A, el, 24, 42, 'The command: link targets, seen from the root', { size: 25, weight: 700 });
  var GY = 284, SC = 160, CX = 100, DX = 158, HI = 'haR';     // ground line, px per body unit, where the robot stands, offset of the target drawing, the link that is spelled out
  A.el('path', { d: 'M24 ' + (GY + 7) + 'H350', fill: 'none', stroke: '#4a4a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  SB.txt(A, el, CX, GY + 34, 'robot now', { size: 20, fill: '#d8d8d8', anchor: 'middle' });
  SB.txt(A, el, CX + DX + 10, GY + 34, 'target <tspan style="font-weight:500;fill:#9a9a9a">(drawn apart)</tspan>', { size: 20, fill: G, anchor: 'middle', weight: 700 });
  var ghost = A.el('path', { fill: 'none', stroke: G, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.55 }, el);
  var ghead = A.el('circle', { r: 11, fill: G, opacity: 0.55 }, el);
  var body = A.el('path', { fill: 'none', stroke: '#d8d8d8', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var head = A.el('circle', { r: 11, fill: '#d8d8d8' }, el);
  var rays = [], dots = [];
  for (i = 0; i < SB.LINKS.length; i++) rays.push(A.el('path', { fill: 'none', stroke: G, 'stroke-linecap': 'round' }, el));
  var off = A.el('g', { fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var offL = A.el('path', { 'stroke-dasharray': '6 6' }, off), offH = A.el('path', {}, off);
  for (i = 0; i < SB.LINKS.length; i++) dots.push(A.el('circle', { r: 5.5, fill: G, stroke: '#0c0c0c', 'stroke-width': 2 }, el));
  var tfr = A.el('path', { fill: 'none', stroke: G, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);      // the frame of the hand target
  var rfr = A.el('path', { fill: 'none', stroke: AM, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);     // the root frame
  var root = A.el('circle', { r: 7.5, fill: AM, stroke: '#0c0c0c', 'stroke-width': 2 }, el);
  var hiDot = A.el('circle', { r: 8, fill: G, stroke: '#fff', 'stroke-width': 2.5 }, el);

  function pose(t) {
    var u = 2 * Math.PI * t / 6, a = (1 - Math.cos(u)) / 2, b = (1 - Math.cos(u - 0.9)) / 2;
    return { squat: 0.03 + 0.08 * a, sway: 0.04 * Math.sin(u), aL: 0.26 + 0.5 * b, bL: 0.3, aR: 0.35 + 1.45 * a, bR: 0.3 - 0.1 * a };
  }
  function frame(o, ang, s) {                                  // two short axes at o, turned by ang
    var c = Math.cos(ang), n = Math.sin(ang);
    return 'M' + (o[0] + s * c).toFixed(1) + ' ' + (o[1] + s * n).toFixed(1) + 'L' + o[0].toFixed(1) + ' ' + o[1].toFixed(1) + 'L' + (o[0] + s * n).toFixed(1) + ' ' + (o[1] - s * c).toFixed(1);
  }

  // ---------------------------------------------------------------- right card: global and local control
  var RX = 984, RW = 756, PW = (RW - 48 - 24) / 2, GA = RX + 24, GB = GA + PW + 24, WY = 232, H = 128;
  SB.card(A, el, RX, 0, RW, 334);
  SB.txt(A, el, RX + 24, 42, 'One model, two ways to place the root target', { size: 25, weight: 700 });
  SB.txt(A, el, GA, 82, 'Global mode', { size: 23, weight: 700, fill: G });
  SB.txt(A, el, GB, 82, 'Local mode', { size: 23, weight: 700, fill: C.blue });
  var treads = [GA, GB].map(function (x) {
    return A.el('path', { d: 'M' + x + ' ' + (WY + 7) + 'h' + PW, fill: 'none', stroke: '#5a5a5a', 'stroke-width': 4, 'stroke-dasharray': '14 12', 'stroke-linecap': 'round' }, el);
  });
  var gRef = SB.walker(A, el, G, 10, H), gRob = SB.walker(A, el, '#f2f2f2', 5, H);
  var gRay = A.el('g', { fill: 'none', stroke: AM, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var gRayL = A.el('path', { 'stroke-dasharray': '6 6' }, gRay), gRayH = A.el('path', {}, gRay);
  var gRoot = A.el('circle', { r: 6.5, fill: AM, stroke: '#0c0c0c', 'stroke-width': 2 }, el);
  var pin = A.el('path', { fill: AM }, el);
  var lWas = SB.walker(A, el, G, 3.5, H);                       // local mode: where the reference is in the room
  lWas.g.firstChild.setAttribute('stroke-dasharray', '5 7'); lWas.g.lastChild.setAttribute('fill', 'none'); lWas.g.lastChild.setAttribute('stroke', G); lWas.g.lastChild.setAttribute('stroke-width', 3);
  var lMove = A.el('g', { fill: 'none', stroke: '#9a9a9a', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var lMoveL = A.el('path', {}, lMove), lMoveH = A.el('path', {}, lMove);
  var lRef = SB.walker(A, el, G, 10, H), lRob = SB.walker(A, el, '#f2f2f2', 5, H);
  var lRoot = A.el('circle', { r: 6.5, fill: AM, stroke: '#0c0c0c', 'stroke-width': 2 }, el);
  SB.txt(A, el, GA, 286, 'The root target is a place in the', { size: 20, fill: '#dcdcdc' });
  SB.txt(A, el, GA, 312, 'room: the robot is localized.', { size: 20, fill: '#dcdcdc' });
  SB.txt(A, el, GB, 286, 'The commanded root position is', { size: 20, fill: '#dcdcdc' });
  SB.txt(A, el, GB, 312, 'taken to be the robot’s own.', { size: 20, fill: '#dcdcdc' });

  return function draw(f) {
    var tt = SB.clock(f, STEP), ts = STEP ? SB.since(f, STEP) : f.t;
    // ---- left card
    var j = SB.front(pose(tt), CX, GY, SC), jt = SB.front(pose(tt + 0.9), CX + DX, GY, SC);
    A.set(body, { d: SB.bonePath(j, SB.FBONES) }); A.set(head, { cx: j.head[0].toFixed(1), cy: (j.head[1] - 3).toFixed(1) });
    A.set(ghost, { d: SB.bonePath(jt, SB.FBONES) }); A.set(ghead, { cx: jt.head[0].toFixed(1), cy: (jt.head[1] - 3).toFixed(1) });
    A.set(root, { cx: j.pelvis[0].toFixed(1), cy: j.pelvis[1].toFixed(1) });
    A.set(rfr, { d: frame(j.pelvis, 0, 30) });
    var grow = A.ease(A.ramp(ts, 0.3, 1.5));                  // the lines from the root are drawn once, when the click arrives
    for (i = 0; i < SB.LINKS.length; i++) {
      var n = SB.LINKS[i], p = jt[n], hi = n === HI;
      A.set(dots[i], { cx: p[0].toFixed(1), cy: p[1].toFixed(1) });
      A.set(rays[i], { d: 'M' + j.pelvis[0].toFixed(1) + ' ' + j.pelvis[1].toFixed(1) + 'L' + (j.pelvis[0] + (p[0] - j.pelvis[0]) * grow).toFixed(1) + ' ' + (j.pelvis[1] + (p[1] - j.pelvis[1]) * grow).toFixed(1),
        'stroke-width': hi ? 4 : 1.8, opacity: hi ? 1 : 0.55 });
    }
    // the hand that is spelled out: its offset from where it is now, and the frame of its target
    var a = j[HI], b = jt[HI], d = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / Math.max(1e-6, d), uy = (b[1] - a[1]) / Math.max(1e-6, d);
    var e = [b[0] - 11 * ux, b[1] - 11 * uy], o2 = A.ramp(ts, 1.5, 2.1) * A.ramp(d, 18, 30);
    A.set(offL, { d: 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1) });
    A.set(offH, { d: 'M' + (e[0] - 9 * ux + 6 * uy).toFixed(1) + ' ' + (e[1] - 9 * uy - 6 * ux).toFixed(1) + 'L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1) +
      'L' + (e[0] - 9 * ux - 6 * uy).toFixed(1) + ' ' + (e[1] - 9 * uy + 6 * ux).toFixed(1) });
    A.show(off, o2);
    var fa = Math.atan2(jt[HI][1] - jt.elR[1], jt[HI][0] - jt.elR[0]);
    A.set(tfr, { d: frame(b, fa, 22) }); A.show(tfr, A.ramp(ts, 2.1, 2.7));
    A.set(hiDot, { cx: b[0].toFixed(1), cy: b[1].toFixed(1) });
    // ---- right card: the ground runs under both walkers
    var ph = 2 * Math.PI * tt * 0.8, gap = 104 + 16 * Math.sin(2 * Math.PI * tt / 5);
    treads.forEach(function (t_) { A.set(t_, { 'stroke-dashoffset': (tt * 54 % 26).toFixed(1) }); });
    var xr = GA + 84, jr = SB.side(ph, xr, WY, H), jg = SB.side(ph + 0.7, xr + gap, WY, H);
    gRef.set(jg, 0.8); gRob.set(jr);
    var r0 = jr.hip, r1 = jg.hip, h0 = [r1[0] - 10, r1[1] + (r0[1] - r1[1]) * 10 / gap];
    A.set(gRayL, { d: 'M' + r0[0].toFixed(1) + ' ' + r0[1].toFixed(1) + 'L' + h0[0].toFixed(1) + ' ' + h0[1].toFixed(1) });
    A.set(gRayH, { d: 'M' + (h0[0] - 9).toFixed(1) + ' ' + (h0[1] - 6).toFixed(1) + 'L' + h0[0].toFixed(1) + ' ' + h0[1].toFixed(1) + 'L' + (h0[0] - 9).toFixed(1) + ' ' + (h0[1] + 6).toFixed(1) });
    A.set(gRoot, { cx: r0[0].toFixed(1), cy: r0[1].toFixed(1) });
    A.set(pin, { d: 'M' + r1[0].toFixed(1) + ' ' + (WY + 12) + 'l-8 12h16z' });
    var xl = GB + 84, jl = SB.side(ph, xl, WY, H), jlg = SB.side(ph + 0.7, xl, WY, H), jw = SB.side(ph + 0.7, xl + gap, WY, H);
    lWas.set(jw, 0.75); lRef.set(jlg, 0.8); lRob.set(jl);
    var m0 = [jw.hip[0] - 14, jw.hip[1] - 0.52 * H], m1 = [jl.hip[0] + 16, jl.hip[1] - 0.52 * H], mc = [(m0[0] + m1[0]) / 2, m0[1] - 26];      // an arc over the heads, back onto the robot
    A.set(lMoveL, { d: 'M' + m0[0].toFixed(1) + ' ' + m0[1].toFixed(1) + 'Q' + mc[0].toFixed(1) + ' ' + mc[1].toFixed(1) + ' ' + m1[0].toFixed(1) + ' ' + m1[1].toFixed(1) });
    A.set(lMoveH, { d: 'M' + (m1[0] + 11).toFixed(1) + ' ' + (m1[1] - 1).toFixed(1) + 'L' + m1[0].toFixed(1) + ' ' + m1[1].toFixed(1) + 'L' + (m1[0] + 4).toFixed(1) + ' ' + (m1[1] - 11).toFixed(1) });
    A.set(lRoot, { cx: jl.hip[0].toFixed(1), cy: jl.hip[1].toFixed(1) });
  };
});
