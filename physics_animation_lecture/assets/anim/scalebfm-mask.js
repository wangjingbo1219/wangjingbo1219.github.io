/* Slide "ScaleBFM — how", click 2: the mask.   <svg data-anim="scalebfm-mask" data-step="2" viewBox="0 0 560 334">
 * SCHEMATIC, no data: a stick robot seen from the front (white) and its target for the next frame (green), drawn beside it as in
 * scalebfm-cmd. The pose is made up.
 * What is drawn is the paper's control interface (Sec. 3.2, Control Interface Design, and App. A.1, Table 4):
 *   - the command holds target poses of body links in the robot's ROOT frame (previous click, scalebfm-cmd): a line runs from the
 *     root (pelvis, amber) to every commanded target link;
 *   - a link-wise mask says which of the 14 links are commanded. The eight control modes of Table 4 are listed with their number
 *     of links and shown one after the other: commanded target links are filled green, masked ones are hollow.
 * Links per mode (Table 4): Root = pelvis · Bimanual = both hands · Root-and-Hand = pelvis, hands · End-Effector = hands, feet ·
 * Root-and-End-Effector = pelvis, hands, feet · Upper-Body = shoulders, elbows, hands · Root-and-Upper-Body = pelvis + those ·
 * Whole-Body = pelvis, shoulders, elbows, hands, torso, hips, knees, feet.
 * The white robot keeps moving with its whole body under every mode: the links that are not commanded are "inpainted" (App. A.1).
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('scalebfm-mask', function (el, A) {
  'use strict';
  var SB = window.SBF, C = A.C, G = C.g, AM = C.amber, STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var GY = 282, SC = 150, CX = 86, DX = 96;            // ground line, px per body unit, where the robot stands, how far to its right the target is drawn
  var HANDS = ['haL', 'haR'], FEET = ['ftL', 'ftR'], ARMS = ['shL', 'shR', 'elL', 'elR', 'haL', 'haR'];
  var MODES = [
    ['Root', ['pelvis']],
    ['Bimanual', HANDS],
    ['Root-and-Hand', ['pelvis'].concat(HANDS)],
    ['End-Effector', HANDS.concat(FEET)],
    ['Root-and-End-Effector', ['pelvis'].concat(HANDS, FEET)],
    ['Upper-Body', ARMS],
    ['Root-and-Upper-Body', ['pelvis'].concat(ARMS)],
    ['Whole-Body', SB.LINKS]
  ];
  var HOLD = 1.5, FIRST = 2.2;                           // seconds per mode; how long Whole-Body is shown first
  SB.card(A, el, 0, 0, 560, 334);
  SB.txt(A, el, 24, 42, 'A mask picks the commanded links', { size: 25, weight: 700 });
  A.el('path', { d: 'M20 ' + (GY + 7) + 'H262', fill: 'none', stroke: '#4a4a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var rays = [], dots = [], i;
  var ghost = A.el('path', { fill: 'none', stroke: G, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.55 }, el);
  var ghead = A.el('circle', { r: 10.5, fill: G, opacity: 0.55 }, el);
  var body = A.el('path', { fill: 'none', stroke: '#d8d8d8', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var head = A.el('circle', { r: 10.5, fill: '#d8d8d8' }, el);
  for (i = 0; i < SB.LINKS.length; i++) rays.push(A.el('path', { fill: 'none', stroke: G, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, el));
  for (i = 0; i < SB.LINKS.length; i++) dots.push(A.el('circle', { 'stroke-width': 2.2 }, el));
  var root = A.el('circle', { r: 7.5, fill: AM, stroke: '#0c0c0c', 'stroke-width': 2 }, el);
  SB.txt(A, el, CX, GY + 34, 'robot now', { size: 20, fill: '#d8d8d8', anchor: 'middle' });
  SB.txt(A, el, CX + DX, GY + 34, 'target', { size: 20, fill: G, anchor: 'middle', weight: 700 });
  // the eight control modes
  SB.txt(A, el, 290, 78, 'control mode', { size: 20, fill: C.mute });
  SB.txt(A, el, 546, 78, 'links', { size: 20, fill: C.mute, anchor: 'end' });
  SB.txt(A, el, 24, 78, '<tspan style="fill:#76B900">●</tspan> commanded  ○ masked', { size: 20, fill: C.mid });
  var rows = MODES.map(function (m, k) {
    var y = 110 + 28 * k, g = A.el('g', {}, el);
    var bg = A.el('rect', { x: 281, y: y - 20.5, width: 271, height: 28, rx: 7, fill: '#22360a' }, g);
    var a = SB.txt(A, g, 290, y, m[0], { size: 20, weight: 700 }), b = SB.txt(A, g, 546, y, String(m[1].length), { size: 20, weight: 700, anchor: 'end' });
    return { bg: bg, a: a, b: b };
  });

  function pose(t) {
    var u = 2 * Math.PI * t / 6, a = (1 - Math.cos(u)) / 2, b = (1 - Math.cos(u - 0.9)) / 2;     // the same made-up motion as in scalebfm-cmd
    return { squat: 0.03 + 0.08 * a, sway: 0.04 * Math.sin(u), aL: 0.26 + 0.5 * b, bL: 0.3, aR: 0.35 + 1.45 * a, bR: 0.3 - 0.1 * a };
  }
  return function draw(f) {
    var tt = SB.clock(f, STEP), ts = STEP ? SB.since(f, STEP) : f.t;
    var k = tt < FIRST ? 7 : Math.floor((tt - FIRST) / HOLD) % 8, on = {};
    MODES[k][1].forEach(function (n) { on[n] = 1; });
    var j = SB.front(pose(tt), CX, GY, SC), jt = SB.front(pose(tt + 0.9), CX + DX, GY, SC);
    A.set(body, { d: SB.bonePath(j, SB.FBONES) }); A.set(head, { cx: j.head[0].toFixed(1), cy: (j.head[1] - 3).toFixed(1) });
    A.set(ghost, { d: SB.bonePath(jt, SB.FBONES) }); A.set(ghead, { cx: jt.head[0].toFixed(1), cy: (jt.head[1] - 3).toFixed(1) });
    A.set(root, { cx: j.pelvis[0].toFixed(1), cy: j.pelvis[1].toFixed(1) });
    var grow = A.ease(A.ramp(ts, 0.3, 1.3));               // the lines from the root are drawn once, when the click arrives
    for (i = 0; i < SB.LINKS.length; i++) {
      var n = SB.LINKS[i], p = jt[n], c = on[n];
      A.set(dots[i], { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: c ? 7 : 5, fill: c ? G : '#0c0c0c', stroke: c ? '#0c0c0c' : '#7a7a7a' });
      A.set(rays[i], { d: c ? 'M' + j.pelvis[0].toFixed(1) + ' ' + j.pelvis[1].toFixed(1) + 'L' + (j.pelvis[0] + (p[0] - j.pelvis[0]) * grow).toFixed(1) + ' ' + (j.pelvis[1] + (p[1] - j.pelvis[1]) * grow).toFixed(1) : '' });
    }
    rows.forEach(function (r, m) {
      var cur = m === k;
      A.show(r.bg, cur ? 1 : 0);
      r.a.style.fill = cur ? '#fff' : '#9a9a9a'; r.b.style.fill = cur ? G : '#9a9a9a';
    });
  };
});
