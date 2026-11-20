/* Slide "UniHSI - how": a sentence becomes a Chain of Contacts, and the contact pairs light up on the body.
 *   <svg data-anim="unihsi-chain" viewBox="0 0 1012 396">
 * A SCHEMATIC, not a simulation and not data. Everything written in it is the paper's own example (Xiao et al., ICLR 2024, Table 7:
 * the prompt given to the LLM planner and the plan it returned); the stick figure only illustrates what the steps ask for.
 *   left    the command, then (click 0) what else the prompt holds (with one rule quoted), then (click 1 on) the seven steps of the plan
 *   top     click 0: the background information of the prompt (objects with their parts, the joint names)
 *           click 1 on: the contact pairs {object, part, joint, contact type, direction} of one step, verbatim
 *           click 3 on: for each pair a bar R_k (how well it is satisfied) and a bar w_k (its adaptive weight, eq. 8)
 *   scene   side view of the room of the prompt: chair, table with laptop, bed. Blue = a pair that is wanted, green = satisfied.
 * Clicks:  0 the prompt · 1 the plan is written, step by step, then the steps that name contacts take turns (joint and part joined by a line)
 *          2 the controller runs steps 1 and 2: a pseudo-contact pulls the pelvis to a target point; the character waits in front of the chair
 *            with the vector d_k (named beside it) at full length, then sits down and d_k to the nearest seat point shrinks to zero
 *          3 step 3 alone: three pairs, the weights sit on the pairs not yet satisfied · 4 the whole chain, step after step, in a loop
 * A step is ticked when the drawn joints are at their parts; the next step starts a moment later.
 * R_k in the bars is exp(-distance / scale) of the drawn distance (the shape of the paper's kernel, eq. 7; its weights are not stated),
 * a touching pair staying just below 1; w_k is eq. 8 applied to those R_k. No numbers are shown, and nothing is to scale.
 */
DeckAnim.register('unihsi-chain', function (el, A) {
  'use strict';
  var C = A.C, BLUE = C.blue, GREEN = C.g, AMBER = C.amber, GY = 350;
  var PX = 22, SX = 414, SR = 996;                        // the plan column starts at PX; scene and top panel span SX .. SR
  function Y(h) { return GY - h; }
  function T(x, y, s, o) { o = o || {}; if (o.halo === undefined) o.halo = false; if (!o.weight) o.weight = 500; if (!o.size) o.size = 20; return A.text(o.parent || el, x, y, s, o); }
  function mi(s, sub) {
    return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-weight:400;font-size:1.2em">' + s + '</tspan>' +
      '<tspan dy="6" style="font-family:' + A.MATH + ';font-style:italic;font-weight:400;font-size:.9em">' + sub + '</tspan><tspan dy="-6">​</tspan>';
  }
  function setText(n, s) { if (n._s !== s) { n._s = s; n.textContent = s; } }
  function fill(n, c) { if (n._f !== c) { n._f = c; n.style.fill = c; } }
  function attr(n, k, v) { var c = n._a || (n._a = {}); if (c[k] !== v) { c[k] = v; n.setAttribute(k, v); } }
  function dist(p, q) { return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1])); }

  // ---------------------------------------------------------------- the paper's example (Table 7)
  var CMD = ['“I want to play video games', 'for a while, then go to sleep.”'];
  var STEPS = [
    { name: 'Get close to the chair', pairs: [['chair', 'none', 'none', 'none', 'front']] },
    { name: 'Sit on the chair', pairs: [['chair', 'seat_surface', 'pelvis', 'contact', 'up']] },
    { name: 'Use the laptop to play video games', pairs: [['chair', 'seat_surface', 'pelvis', 'contact', 'up'], ['laptop', 'keyboard', 'left hand', 'contact', 'up'], ['laptop', 'keyboard', 'right hand', 'contact', 'up']] },
    { name: 'Stand up from the chair', pairs: [['chair', 'none', 'none', 'none', 'front']] },
    { name: 'Get close to the bed', pairs: [['bed', 'none', 'none', 'none', 'front']] },
    { name: 'Sit on the bed', pairs: [['bed', 'mattress', 'pelvis', 'contact', 'up']] },
    { name: 'Lie down on the bed', pairs: [['bed', 'mattress', 'pelvis', 'contact', 'up'], ['bed', 'mattress', 'torso', 'contact', 'up'], ['bed', 'pillow', 'head', 'contact', 'up']] }
  ];
  var PROMPT = ['+ the room: objects, parts, layout', '+ the body: 15 joint names', '+ rules, and one example plan'];
  var RULE = '“Only interact with still objects.”';        // rule 5 of the prompt, verbatim (its first sentence)
  var INFO = [['chair', 'PARTS', 'back_soft_surface, seat_surface, …'], ['table', 'PARTS', 'board'], ['laptop', 'PARTS', 'screen, keyboard'],
              ['bed', 'PARTS', 'pillow, mattress'], ['human', 'JOINTS', 'pelvis, torso, head, left hand, … (15 names)']];

  // ---------------------------------------------------------------- the room (side view; heights above the floor)
  var X0 = 438;                                            // where the character starts
  var PARTS = {                                            // the parts the plan names, each with a run of sample points (its "point cloud")
    'chair/seat_surface': { a: [522, 42], b: [568, 42] },
    'laptop/keyboard': { a: [602, 72], b: [630, 72] },
    'bed/mattress': { a: [782, 47], b: [926, 47] },
    'bed/pillow': { a: [938, 58], b: [974, 58] }
  };
  var TARGET = { chair: [564, 78], bed: [768, 78] };       // pseudo-contact: the point the pelvis is pulled to ("get close to", "stand up")
  var OFF = { pelvis: 6.5, torso: 7.5, head: 11.5, 'left hand': 2.5, 'right hand': 2.5 };     // joint centre to surface when touching
  Object.keys(PARTS).forEach(function (k) {
    var p = PARTS[k], n = Math.max(2, Math.round((p.b[0] - p.a[0]) / 7)); p.pts = [];
    for (var i = 0; i <= n; i++) p.pts.push([A.lerp(p.a[0], p.b[0], i / n), A.lerp(p.a[1], p.b[1], i / n)]);
  });

  A.el('line', { x1: SX, y1: GY + 2, x2: SR, y2: GY + 2, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var OBJ = { chair: [], table: [], laptop: [], bed: [] };
  function P_(o, d, w, col) { var n = A.el('path', { d: d, fill: 'none', stroke: col || '#6b6b6b', 'stroke-width': w || 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el); n._base = col || '#6b6b6b'; OBJ[o].push(n); }
  function R_(o, x, h, w, ht, rx) { var n = A.el('rect', { x: x, y: Y(h), width: w, height: ht, rx: rx, fill: '#1c1c1c', stroke: '#6b6b6b', 'stroke-width': 3.5 }, el); n._base = '#6b6b6b'; OBJ[o].push(n); }
  P_('chair', 'M522 ' + Y(42) + ' L512 ' + Y(108), 6); P_('chair', 'M520 ' + Y(40) + ' H570', 6);
  P_('chair', 'M525 ' + Y(36) + ' V' + GY + ' M566 ' + Y(36) + ' V' + GY, 3.5);
  P_('table', 'M590 ' + Y(67) + ' H682', 6); P_('table', 'M597 ' + Y(63) + ' V' + GY + ' M675 ' + Y(63) + ' V' + GY, 3.5);
  P_('laptop', 'M600 ' + Y(72) + ' H632', 3.5, '#9a9a9a'); P_('laptop', 'M632 ' + Y(72) + ' L646 ' + Y(103), 3.5, '#9a9a9a');
  P_('bed', 'M780 ' + Y(26) + ' H978 V' + GY + ' M784 ' + Y(24) + ' V' + GY, 3.5);
  R_('bed', 776, 45, 204, 19, 7); R_('bed', 934, 56, 44, 12, 6); P_('bed', 'M984 ' + Y(102) + ' V' + Y(24), 6);
  var olab = { human: T(X0, GY + 31, 'human', { fill: C.mute, anchor: 'middle' }), chair: T(545, GY + 31, 'chair', { fill: C.mute, anchor: 'middle' }),
    table: T(650, GY + 31, 'table, laptop', { fill: C.mute, anchor: 'middle' }), bed: T(878, GY + 31, 'bed', { fill: C.mute, anchor: 'middle' }) };

  // parts: a highlight under the sample points, the points themselves
  var partN = {};
  Object.keys(PARTS).forEach(function (k) {
    var p = PARTS[k], g = A.el('g', {}, el);
    partN[k] = { g: g, glow: A.el('line', { x1: p.a[0], y1: Y(p.a[1]), x2: p.b[0], y2: Y(p.b[1]), stroke: BLUE, 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.3 }, g),
      dots: p.pts.map(function (q) { return A.el('circle', { cx: q[0], cy: Y(q[1]), r: 2.2, fill: BLUE }, g); }) };
  });
  var tgt = {};
  ['chair', 'bed'].forEach(function (k) {
    var g = A.el('g', {}, el), q = TARGET[k];
    A.el('circle', { cx: q[0], cy: Y(q[1]), r: 10, fill: 'none', stroke: BLUE, 'stroke-width': 3, 'stroke-dasharray': '4 4' }, g);
    A.el('circle', { cx: q[0], cy: Y(q[1]), r: 2.8, fill: BLUE }, g);
    tgt[k] = g;
  });

  // ---------------------------------------------------------------- the character: a stick figure posed by inverse kinematics
  var TH = 40, SH = 40, TO = 54, NK = 22, HR = 11, UA = 32, LA = 32, BODY = '#dedede';
  var gBody = A.el('g', { fill: 'none', stroke: BODY, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var nFar = A.el('path', { 'stroke-width': 7, 'stroke-opacity': 0.42 }, gBody), nTorso = A.el('path', { 'stroke-width': 10 }, gBody);
  var nHead = A.el('circle', { r: HR, fill: BODY, stroke: 'none' }, gBody), nNear = A.el('path', { 'stroke-width': 7 }, gBody);
  var jdots = []; for (var jd = 0; jd < 12; jd++) jdots.push(A.el('circle', { r: 4, fill: '#0c0c0c', stroke: BLUE, 'stroke-width': 2.6 }, el));

  var R_HN = ['r', 25, -49], R_HF = ['r', 12, -57], ST_FN = ['r', 5, 0], ST_FF = ['r', -5, 0], LIE = -1.51;
  // keyframes: pelvis x, height h, torso lean, head nod, facing dir, feet (fn, ff) and hands (hn, hf): 'a' = a point of the room, 'r' = relative to pelvis / shoulder
  var K = [
    { t: 0.0, x: X0, h: 78, lean: 0.03, nod: 0, dir: 1, fn: ST_FN, ff: ST_FF, hn: R_HN, hf: R_HF },
    { t: 0.5 },
    { t: 2.5, x: 564, gait: 1 },                           // step 1: get close to the chair
    { t: 2.9 },
    { t: 3.5, x: 554, h: 64, lean: 0.52, fn: ['a', 578, 0], ff: ['a', 572, 0], hn: ['r', 18, -49], hf: ['r', 13, -49] },
    { t: 4.1, x: 543, h: 48, lean: 0.06, fn: ['a', 580, 0], ff: ['a', 575, 0], hn: ['r', 8, -58], hf: ['r', 3, -58] },       // step 2: sit on the chair
    { t: 4.5 },
    { t: 5.7, lean: 0.42, hn: ['a', 609, 74], hf: ['a', 621, 74] },                                                          // step 3: both hands on the keyboard
    { t: 6.9 },
    { t: 7.5, x: 553, h: 62, lean: 0.55, hn: ['r', 16, -51], hf: ['r', 11, -51] },
    { t: 8.1, x: 564, h: 78, lean: 0.03, fn: ['a', 569, 0], ff: ['a', 559, 0], hn: R_HN, hf: R_HF },                         // step 4: stand up
    { t: 8.4, fn: ST_FN, ff: ST_FF },
    { t: 11.6, x: 768, gait: 1 },                          // step 5: get close to the bed
    { t: 12.2, dir: -1 },
    { t: 12.8, x: 788, h: 64, lean: 0.48, fn: ['a', 766, 0], ff: ['a', 772, 0], hn: ['r', 18, -49], hf: ['r', 13, -49] },
    { t: 13.4, x: 808, h: 51, lean: 0.05, fn: ['a', 768, 0], ff: ['a', 773, 0], hn: ['r', 27, -44], hf: ['r', 22, -44] },     // step 6: sit on the bed
    { t: 13.7 },
    { t: 14.7, x: 840, h: 52, lean: -0.85, nod: 0.25, fn: ['a', 778, 40], ff: ['a', 784, 35], hn: ['r', 34, -30], hf: ['r', 29, -27] },
    { t: 15.7, x: 866, h: 52, lean: LIE, nod: 0.52, fn: ['a', 790, 52], ff: ['a', 796, 51], hn: ['r', 61, 1], hf: ['r', 58, 4] },   // step 7: lie down
    { t: 17.6 }
  ];
  (function () { var keys = ['x', 'h', 'lean', 'nod', 'dir', 'fn', 'ff', 'hn', 'hf']; for (var i = 1; i < K.length; i++) keys.forEach(function (k) { if (K[i][k] === undefined) K[i][k] = K[i - 1][k]; }); })();
  var START = [0, 2.9, 4.5, 6.9, 8.4, 12.2, 13.7];                             // when the TaskParser hands out step i
  var DONE = [2.7, 4.25, 5.85, 8.25, 11.75, 13.55, 15.85], T_END = 17.6;      // when all the pairs of step i hold

  function ik(ax, ay, tx, ty, l1, l2, s) {                 // two-link limb from (ax, ay) to (tx, ty), in screen coordinates; s picks the side of the bend
    var dx = tx - ax, dy = ty - ay, d = Math.sqrt(dx * dx + dy * dy) || 1e-6, m = l1 + l2 - 0.05;
    if (d > m) { tx = ax + dx / d * m; ty = ay + dy / d * m; d = m; }
    var a = Math.atan2(dy, dx), b = Math.acos(A.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    return [ax + l1 * Math.cos(a + s * b), ay + l1 * Math.sin(a + s * b), tx, ty];
  }
  function absF(sp, x, dir) { return sp[0] === 'a' ? [sp[1], sp[2]] : [x + sp[1] * dir, sp[2]]; }
  function absH(sp, sx, sh, dir) { return sp[0] === 'a' ? [sp[1], sp[2]] : [sx + sp[1] * dir, sh + sp[2]]; }
  function mix2(p, q, u) { return [A.lerp(p[0], q[0], u), A.lerp(p[1], q[1], u)]; }
  function gaitFoot(x, s, len, off, dir) {                 // one foot of a walk: s = distance walked so far, len = length of the walk
    var S = 14 * Math.min(A.ramp(s, 0, 20), A.ramp(len - s, 0, 20)), u = A.loop(s / 56 + off, 1);
    return u < 0.5 ? [x + dir * (S - 4 * S * u), 0] : [x + dir * (-S + 4 * S * (u - 0.5)), 8 * Math.sin(Math.PI * (u - 0.5) / 0.5) * (S / 14)];
  }
  /** the pose at time tau of the timeline: limbs in screen coordinates, the joints the plan names as (x, height) */
  function rig(tau) {
    var i = 0; while (i < K.length - 2 && tau >= K[i + 1].t) i++;
    var a = K[i], b = K[i + 1], lin = A.clamp((tau - a.t) / (b.t - a.t), 0, 1), u = b.gait ? lin : A.ease(lin);
    var x = A.lerp(a.x, b.x, u), h = A.lerp(a.h, b.h, u), lean = A.lerp(a.lean, b.lean, u), nod = A.lerp(a.nod, b.nod, u), dir = A.lerp(a.dir, b.dir, u);
    var sg = dir >= 0 ? 1 : -1;
    var cx = x + TO * Math.sin(lean) * dir, ch = h + TO * Math.cos(lean);
    var hx = cx + NK * Math.sin(lean + nod) * dir, hh = ch + NK * Math.cos(lean + nod);
    var fn, ff, hn, hf;
    fn = mix2(absF(a.fn, x, dir), absF(b.fn, x, dir), u); ff = mix2(absF(a.ff, x, dir), absF(b.ff, x, dir), u);
    hn = mix2(absH(a.hn, cx, ch, dir), absH(b.hn, cx, ch, dir), u); hf = mix2(absH(a.hf, cx, ch, dir), absH(b.hf, cx, ch, dir), u);
    if (b.gait) {                                          // a walk: feet and hands swing, blended in and out of the standing pose
      var s = Math.abs(x - a.x), len = Math.abs(b.x - a.x), amp = Math.min(A.ramp(s, 0, 20), A.ramp(len - s, 0, 20)), sw = 13 * Math.sin(2 * Math.PI * s / 56);
      fn = mix2(fn, gaitFoot(x, s, len, 0, sg), amp); ff = mix2(ff, gaitFoot(x, s, len, 0.5, sg), amp);
      hn = mix2(hn, [cx + (5 - sw) * dir, ch - 60], amp); hf = mix2(hf, [cx + sw * dir, ch - 60], amp);
    }
    var ln = ik(x, Y(h), fn[0], Y(fn[1]), TH, SH, -sg), lf = ik(x, Y(h), ff[0], Y(ff[1]), TH, SH, -sg);
    var an = ik(cx, Y(ch), hn[0], Y(hn[1]), UA, LA, sg), af = ik(cx, Y(ch), hf[0], Y(hf[1]), UA, LA, sg);
    return { x: x, h: h, dir: dir, chest: [cx, ch], head: [hx, hh], ln: ln, lf: lf, an: an, af: af,
      J: { pelvis: [x, h], torso: [A.lerp(x, cx, 0.62), A.lerp(h, ch, 0.62)], head: [hx, hh], 'left hand': [an[2], GY - an[3]], 'right hand': [af[2], GY - af[3]] } };
  }
  function f1(v) { return v.toFixed(1); }
  function limb(ax, ay, L, foot) { return 'M' + f1(ax) + ' ' + f1(ay) + 'L' + f1(L[0]) + ' ' + f1(L[1]) + 'L' + f1(L[2]) + ' ' + f1(L[3]) + (foot ? 'l' + f1(foot) + ' 0' : ''); }
  /** draws the body; returns the screen positions of the joints (for the dots of click 0) */
  function drawBody(R) {
    var px = R.x, py = Y(R.h), cx = R.chest[0], cy = Y(R.chest[1]), ft = 8 * R.dir;
    A.set(nFar, { d: limb(px, py, R.lf, ft) + limb(cx, cy, R.af) });
    A.set(nTorso, { d: 'M' + f1(px) + ' ' + f1(py) + 'L' + f1(cx) + ' ' + f1(cy) });
    A.set(nNear, { d: limb(px, py, R.ln, ft) + limb(cx, cy, R.an) });
    A.set(nHead, { cx: R.head[0], cy: Y(R.head[1]) });
    return [[px, py], [R.ln[0], R.ln[1]], [R.ln[2], R.ln[3]], [R.lf[0], R.lf[1]], [R.lf[2], R.lf[3]], [A.lerp(px, cx, 0.62), A.lerp(py, cy, 0.62)], [cx, cy],
            [R.head[0], Y(R.head[1])], [R.an[0], R.an[1]], [R.an[2], R.an[3]], [R.af[0], R.af[1]], [R.af[2], R.af[3]]];
  }

  // ---------------------------------------------------------------- left column: the command, then the prompt, then the plan
  var cmd = [T(PX, 42, '', { size: 22, weight: 700 }), T(PX, 73, '', { size: 22, weight: 700 })];
  A.el('line', { x1: PX, y1: 94, x2: 384, y2: 94, stroke: '#2e2e2e', 'stroke-width': 2 }, el);
  A.el('line', { x1: 398, y1: 18, x2: 398, y2: 378, stroke: '#232323', 'stroke-width': 2 }, el);
  var gPrompt = A.el('g', {}, el), prow = PROMPT.map(function (s, i) { return T(PX, 138 + i * 50, s, { parent: gPrompt, size: 22, fill: '#d6d6d6' }); });
  var prule = T(PX + 17, 268, RULE, { parent: gPrompt, fill: '#a6a6a6' });
  var gPlan = A.el('g', {}, el), RY0 = 131, RP = 37;
  var bar = A.el('rect', { x: PX - 9, width: 376, height: 32, rx: 8, fill: '#17210a', stroke: GREEN, 'stroke-width': 1.5 }, gPlan);
  var rows = STEPS.map(function (s, i) {
    var y = RY0 + i * RP;
    return { num: T(PX, y, String(i + 1), { parent: gPlan, weight: 700, fill: C.mute }), name: T(PX + 23, y, s.name, { parent: gPlan }),
      ok: A.el('path', { d: 'M' + (PX - 1) + ' ' + (y - 7) + ' l5 5 l9 -11', fill: 'none', stroke: GREEN, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gPlan) };
  });

  // ---------------------------------------------------------------- top of the scene: the prompt's background information, or the pairs of one step
  var gInfo = A.el('g', {}, el), irow = INFO.map(function (r, i) {
    var t = T(SX, 38 + i * 28, '', { parent: gInfo });
    t.innerHTML = '<tspan style="font-weight:700;fill:#fff">' + r[0] + '</tspan><tspan dx="9" style="fill:' + C.mute + ';letter-spacing:.06em">' + r[1] + '</tspan><tspan dx="9" style="fill:#cfcfcf">' + r[2] + '</tspan>';
    return t;
  });
  var gPairs = A.el('g', {}, el);
  var hStep = T(SX, 38, '', { parent: gPairs, weight: 700 }), hLeg = T(SX + 72, 38, '{object, part, joint, contact type, direction}', { parent: gPairs, fill: C.mute });
  var BW = 64, BX = [SR - 2 * BW - 12, SR - BW];
  var hR = T(BX[0] + BW / 2, 38, '', { parent: gPairs, fill: AMBER, anchor: 'middle' }), hW = T(BX[1] + BW / 2, 38, '', { parent: gPairs, fill: '#fff', anchor: 'middle' });
  hR.innerHTML = mi('R', 'k'); hW.innerHTML = mi('w', 'k');
  var prs = [0, 1, 2].map(function (j) {
    var y = 72 + j * 32;
    return { dot: A.el('circle', { cx: SX + 8, cy: y - 7, r: 6.5, fill: 'none', 'stroke-width': 3 }, gPairs), txt: T(SX + 25, y, '', { parent: gPairs }),
      rb: A.el('rect', { x: BX[0], y: y - 15, width: BW, height: 14, rx: 4, fill: '#202020' }, gPairs), rf: A.el('rect', { x: BX[0], y: y - 15, height: 14, rx: 4, fill: AMBER }, gPairs),
      wb: A.el('rect', { x: BX[1], y: y - 15, width: BW, height: 14, rx: 4, fill: '#202020' }, gPairs), wf: A.el('rect', { x: BX[1], y: y - 15, height: 14, rx: 4, fill: '#fff' }, gPairs) };
  });
  var note = T(SX + 25, 104, 'a pseudo-contact: the pelvis is pulled to a target point', { parent: gPairs, fill: C.mute });
  var noteD = T(SX + 25, 104, '', { parent: gPairs, fill: C.mute });
  noteD.innerHTML = '<tspan style="fill:' + BLUE + '">' + mi('d', 'k') + '</tspan><tspan dx="3">: from the joint to the nearest point of the part</tspan>';
  // on the scene: joint -> nearest point of the part
  var links = [0, 1, 2].map(function () {
    return { ln: A.el('line', { 'stroke-width': 3.5, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }, el), near: A.el('circle', { r: 5.5, fill: 'none', 'stroke-width': 3 }, el),
      jt: A.el('circle', { r: 6.5, stroke: '#0c0c0c', 'stroke-width': 2 }, el) };
  });

  var dTag = T(0, 0, '', { fill: BLUE, anchor: 'end', halo: true });      // the name of the vector, beside it (click 2, step 2)
  dTag.innerHTML = mi('d', 'k');

  /** a pair as the plan writes it; the part and the joint, the two things that have to meet, in bold white */
  function chip(n, p) {
    var key = p.join('|'); if (n._s === key) return; n._s = key;
    var b = function (t) { return t === 'none' ? t : '<tspan style="font-weight:700;fill:#fff">' + t + '</tspan>'; };
    n.innerHTML = '{' + p[0] + ', ' + b(p[1]) + ', ' + b(p[2]) + ', ' + p[3] + ', ' + p[4] + '}';
  }
  /** one pair, for a pose: joint position, nearest target point, the gap that is left, its reward */
  function pairGeom(p, R) {
    var pseudo = p[1] === 'none', j = R.J[pseudo ? 'pelvis' : p[2]], best = null, bd = 1e9;
    if (pseudo) { best = TARGET[p[0]]; bd = dist(best, j); }
    else PARTS[p[0] + '/' + p[1]].pts.forEach(function (q) { var d = dist(q, j); if (d < bd) { bd = d; best = q; } });
    var gap = Math.max(0, bd - (pseudo ? 0 : OFF[p[2]]));
    return { j: j, q: best, gap: gap, R: Math.exp(-(gap + 1.5) / 36), ok: gap < 3.2, pseudo: pseudo, key: pseudo ? null : p[0] + '/' + p[1] };
  }
  var T_ROW = [2.3, 2.75, 3.2, 3.65, 4.7], T_PROMPT = [2.1, 4.5, 5.6];      // click 0: when the lines of the prompt arrive

  return function draw(f) {
    var st = f.step, ts = f.ts, k, j;
    // ---------- the command is typed at click 0 and stays
    var typed = st === 0 ? 2 * A.ramp(ts, 0.2, 1.9) : 2;
    setText(cmd[0], CMD[0].slice(0, Math.round(A.clamp(typed, 0, 1) * CMD[0].length)));
    setText(cmd[1], CMD[1].slice(0, Math.round(A.clamp(typed - 1, 0, 1) * CMD[1].length)));
    // ---------- click 0: the rest of the prompt; from click 1: the plan
    var inPrompt = st === 0 ? 1 : (st === 1 ? 1 - A.ramp(ts, 0, 0.3) : 0), inPlan = st === 0 ? 0 : (st === 1 ? A.ramp(ts, 0.2, 0.5) : 1);
    A.show(gPrompt, inPrompt); A.show(gInfo, inPrompt); A.show(gPlan, inPlan); A.show(gPairs, inPlan);
    var lit = {};
    for (k = 0; k < 3; k++) A.show(prow[k], st === 0 ? A.ramp(ts, T_PROMPT[k], T_PROMPT[k] + 0.35) : 1);
    A.show(prule, st === 0 ? A.ramp(ts, T_PROMPT[2] + 0.4, T_PROMPT[2] + 0.75) : 1);
    for (k = 0; k < INFO.length; k++) {
      var on0 = st === 0 ? A.ramp(ts, T_ROW[k], T_ROW[k] + 0.35) : 1;
      A.show(irow[k], on0);
      lit[INFO[k][0]] = st === 0 ? on0 * (1 - 0.6 * A.ramp(ts, T_ROW[k] + 1.0, T_ROW[k] + 1.6)) : 0;       // the object flashes when its line arrives, then stays softly lit
    }
    Object.keys(OBJ).forEach(function (o) { var v = lit[o] || 0; OBJ[o].forEach(function (n) { attr(n, 'stroke', v > 0.02 ? '#bfe9fb' : n._base); attr(n, 'stroke-opacity', v > 0.02 ? (0.4 + 0.6 * v).toFixed(2) : 1); }); });
    fill(olab.human, lit.human > 0.02 ? '#fff' : C.mute); A.show(olab.human, st >= 2 ? 0 : 1); fill(olab.chair, lit.chair > 0.02 ? '#fff' : C.mute);
    fill(olab.table, (lit.table > 0.02 || lit.laptop > 0.02) ? '#fff' : C.mute); fill(olab.bed, lit.bed > 0.02 ? '#fff' : C.mute);

    // ---------- the clock of the character, and the step that is shown
    var tau = 0, cur = 0, fade = 1, shown = -1;
    if (st === 1) {                                        // the plan is written: step i arrives at 0.5 + 0.5 i; then the steps that name contacts take turns
      shown = ts < 4.6 ? A.clamp(Math.floor((ts - 0.5) / 0.5), -1, 6) : [1, 2, 5, 6][Math.floor(A.loop(ts - 4.6, 10.4) / 2.6)];
    } else if (st >= 2) {                                  // the plan is executed
      if (st === 3) {                                      // step 3 alone, slowly: the hands wait, reach the keyboard, rest there, come back
        var t3 = A.loop(ts, 6.6);
        tau = 4.5 + 1.4 * (t3 < 1.0 ? 0 : (t3 < 3.6 ? (t3 - 1.0) / 2.6 : (t3 < 5.8 ? 1 : 1 - (t3 - 5.8) / 0.8)));
      } else if (st === 2) {                               // steps 1 and 2: the end of the walk, a pause in front of the chair (the vector d_k at full length),
        var t2 = A.loop(ts, 8.6);                          // then the sitting down at half speed (d_k shrinks to zero)
        tau = t2 < 2.0 ? 0.9 + t2 : (t2 < 3.3 ? 2.9 : (t2 < 6.1 ? 2.9 + (t2 - 3.3) * 0.5 : 4.3));
        fade = Math.min(A.ramp(t2, 0, 0.3), 1 - A.ramp(t2, 8.3, 8.6));
      } else {                                             // the whole chain: a loop with a short pause, the figure fades out and in
        var tt = A.loop(ts, T_END + 0.7);
        tau = Math.min(tt, T_END);
        fade = Math.min(A.ramp(tt, 0, 0.3), 1 - A.ramp(tt, T_END + 0.4, T_END + 0.7));
      }
      while (cur < 7 && tau >= DONE[cur]) cur++;
      shown = 0; while (shown < 6 && tau >= START[shown + 1]) shown++;
    }
    for (k = 0; k < 7; k++) {
      var vis = st === 1 ? A.ramp(ts, 0.45 + 0.5 * k, 0.55 + 0.5 * k) : 1, isCur = k === shown, done = st >= 2 && k < cur;
      A.show(rows[k].num, done ? 0 : vis); A.show(rows[k].name, vis); A.show(rows[k].ok, done ? 1 : 0);
      fill(rows[k].name, isCur ? '#fff' : (done ? '#9a9a9a' : (st === 1 ? '#cfcfcf' : '#8a8a8a')));
      if (rows[k].name._w !== isCur) { rows[k].name._w = isCur; rows[k].name.style.fontWeight = isCur ? 700 : 500; }
      fill(rows[k].num, isCur ? GREEN : C.mute);
    }
    A.show(bar, shown >= 0 ? 1 : 0); if (shown >= 0) attr(bar, 'y', RY0 + shown * RP - 23);

    // ---------- the character
    var R = rig(tau), JP = drawBody(R);
    A.show(gBody, fade);
    var jOn = st === 0 ? A.ramp(ts, T_ROW[4], T_ROW[4] + 0.35) : 0;
    for (k = 0; k < jdots.length; k++) { A.set(jdots[k], { cx: JP[k][0], cy: JP[k][1], r: 4 + 2.4 * (lit.human || 0) }); A.show(jdots[k], jOn); }

    // ---------- the pairs of the step that is shown
    var S = shown >= 0 ? STEPS[shown] : null, n = S ? S.pairs.length : 0, gs = [], sum = 0, used = {}, tg = null;
    if (S) setText(hStep, 'Step ' + (shown + 1));
    var legOut = st >= 3 ? (st === 3 ? A.ramp(ts, 0, 0.25) : 1) : 0;         // the field names leave first, then the bars' headings take their place
    var bars = st >= 3 && S ? (st === 3 ? A.ramp(ts, 0.3, 0.8) : 1) : 0, wOn = n > 1 ? bars : 0;
    A.show(hStep, S ? 1 : 0); A.show(hLeg, S ? 1 - legOut : 0);
    A.show(hR, bars); A.show(hW, wOn);
    for (j = 0; j < n; j++) { gs.push(pairGeom(S.pairs[j], R)); sum += gs[j].R; }
    A.show(note, n === 1 && gs[0].pseudo ? 1 : 0); A.show(noteD, st >= 2 && n === 1 && !gs[0].pseudo ? 1 : 0);
    var dOn = 0;
    if (st === 2 && n === 1 && !gs[0].pseudo) {                               // shown while the vector is long enough to carry a name
      dOn = fade * A.ramp(gs[0].gap, 14, 22);
      A.set(dTag, { x: ((gs[0].j[0] + gs[0].q[0]) / 2 - 11).toFixed(1), y: ((Y(gs[0].j[1]) + Y(gs[0].q[1])) / 2 + 7).toFixed(1) });
    }
    A.show(dTag, dOn);
    for (j = 0; j < 3; j++) {
      var pr = prs[j], lk = links[j], on = j < n;
      A.show(pr.dot, on ? 1 : 0); A.show(pr.txt, on ? 1 : 0);
      A.show(pr.rb, on ? bars : 0); A.show(pr.rf, on ? bars : 0); A.show(pr.wb, on ? wOn : 0); A.show(pr.wf, on ? wOn : 0);
      A.show(lk.ln, 0); A.show(lk.near, 0); A.show(lk.jt, 0);
      if (!on) continue;
      var g = gs[j], sat = st >= 2 && g.ok, col = sat ? GREEN : BLUE;
      chip(pr.txt, S.pairs[j]); fill(pr.txt, sat ? '#b9e350' : '#bfe9fb');
      attr(pr.dot, 'stroke', col); attr(pr.dot, 'fill', sat ? GREEN : 'none');
      attr(pr.rf, 'width', (BW * g.R).toFixed(1));
      attr(pr.wf, 'width', (BW * A.clamp((1 - g.R) / (n - sum + 0.02), 0, 1)).toFixed(1));      // eq. 8
      var jx = g.j[0], jy = Y(g.j[1]), qx = g.q[0], qy = Y(g.q[1]);
      A.set(lk.ln, { x1: jx, y1: jy, x2: qx, y2: qy, stroke: col }); A.show(lk.ln, g.gap > 2 ? fade : 0);
      A.set(lk.jt, { cx: jx, cy: jy, fill: col }); A.show(lk.jt, fade);
      if (g.pseudo) tg = S.pairs[j][0];
      else { used[g.key] = sat ? 2 : 1; A.set(lk.near, { cx: qx, cy: qy, stroke: sat ? GREEN : '#fff' }); A.show(lk.near, st >= 2 ? fade : 0); }
    }
    Object.keys(partN).forEach(function (key) {
      var u = used[key] || 0, pn = partN[key], c = u === 2 ? GREEN : BLUE;
      A.show(pn.g, u ? 1 : 0);
      if (u && pn._c !== c) { pn._c = c; pn.glow.setAttribute('stroke', c); pn.dots.forEach(function (d) { d.setAttribute('fill', c); }); }
    });
    A.show(tgt.chair, tg === 'chair' ? 1 : 0); A.show(tgt.bed, tg === 'bed' ? 1 : 0);
  };
});
