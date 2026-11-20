/* Slide "SONIC — how", click 2: one motion, three command formats.   <svg data-anim="sonic-formats" data-step="2" viewBox="0 0 1160 470">
 * SCHEMATIC. The same illustrative motion (sonic-0kit.js), drawn as each encoder receives it (paper, section 3.2 and Table S1):
 *   robot motion g_r   the G1's joint positions and velocities, 10 frames ahead, 0.1 s apart
 *   human motion g_h   3D joint positions of a human body (SMPL), 10 frames ahead, 0.02 s apart; the body is larger than the robot
 *   hybrid motion g_m  head and hands of the current frame, plus the robot's lower-body motion 10 frames ahead, 0.1 s apart
 * The faint figure is the last of the frames ahead: about 1 s for the robot formats, 0.2 s for the human one.
 */
DeckAnim.register('sonic-formats', function (el, A) {
  'use strict';
  var SN = window.SN, C = A.C, STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  var W = 372, H = 432, GAP = 22, GROUND = 322, SC = 166;      // SC: px per body unit; at 166 the human's raised hand stays clear of the card title
  var cards = [
    { key: 'r', title: 'Robot motion ' + SN.mi('g') + SN.sub('r'), l1: 'G1 joint angles and velocities', l2: '10 frames ahead, 0.1 s apart', body: SN.ROBOT, ahead: 1.0 },
    { key: 'h', title: 'Human motion ' + SN.mi('g') + SN.sub('h'), l1: '3D joint positions (SMPL)', l2: '10 frames ahead, 0.02 s apart', body: SN.HUMAN, ahead: 0.2 },
    { key: 'm', title: 'Hybrid motion ' + SN.mi('g') + SN.sub('m'), l1: 'head and hands now + G1 legs', l2: 'legs 10 frames ahead, 0.1 s apart', body: SN.ROBOT, ahead: 1.0 }
  ];
  function robotLayer(g, op, legsOnly) {
    var p = A.el('path', { fill: 'none', stroke: '#d2d2d2', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op }, g), hd = null, js = [];
    if (!legsOnly) hd = A.el('circle', { fill: '#d2d2d2', opacity: op }, g);
    if (op === 1) for (var i = 0; i < (legsOnly ? 4 : 8); i++) js.push(A.el('circle', { r: 4.5, fill: '#101010', stroke: '#fff', 'stroke-width': 2 }, g));
    return { p: p, hd: hd, js: js, legs: legsOnly };
  }
  function drawRobot(L, j) {
    A.set(L.p, { d: SN.bonePath(j, L.legs ? SN.LEGS : SN.BONES) });
    if (L.hd) A.set(L.hd, { cx: j.head[0].toFixed(1), cy: (j.head[1] - 3).toFixed(1), r: 12 });
    var names = L.legs ? ['hipL', 'hipR', 'knL', 'knR'] : ['hipL', 'hipR', 'knL', 'knR', 'shL', 'shR', 'elL', 'elR'];
    for (var i = 0; i < L.js.length; i++) A.set(L.js[i], { cx: j[names[i]][0].toFixed(1), cy: j[names[i]][1].toFixed(1) });
  }
  function dotsLayer(g, col, op, names, r) {
    var p = A.el('path', { fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-opacity': 0.42, opacity: op }, g), ds = [];
    for (var i = 0; i < names.length; i++) ds.push(A.el('circle', { r: r, fill: col, stroke: '#0c0c0c', 'stroke-width': 2, opacity: op }, g));
    return { p: p, ds: ds, names: names };
  }
  function drawDots(L, j, bones) {
    A.set(L.p, { d: bones ? SN.bonePath(j, bones) : '' });
    for (var i = 0; i < L.ds.length; i++) A.set(L.ds[i], { cx: j[L.names[i]][0].toFixed(1), cy: j[L.names[i]][1].toFixed(1) });
  }
  cards.forEach(function (c, k) {
    var x = k * (W + GAP), col = SN.COL[c.key], g = A.el('g', {}, el);
    c.g = g; c.cx = x + W / 2;
    A.el('rect', { x: x + 1, y: 1, width: W - 2, height: H - 2, rx: 16, fill: '#0c0c0c', stroke: C.line, 'stroke-width': 2 }, g);
    A.el('path', { d: 'M' + (x + 18) + ' 3.5H' + (x + W - 18), stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    SN.txt(A, g, x + 22, 44, c.title, { size: 25, weight: 700, fill: col });
    A.el('line', { x1: x + 40, x2: x + W - 40, y1: GROUND + 5, y2: GROUND + 5, stroke: C.line, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    SN.txt(A, g, x + 22, GROUND + 50, c.l1, { size: 21, weight: 700, fill: '#f0f0f0' });
    SN.txt(A, g, x + 22, GROUND + 82, c.l2, { size: 20, fill: C.mid });
    if (c.key === 'r') { c.ghost = robotLayer(g, 0.26, false); c.now = robotLayer(g, 1, false); }
    if (c.key === 'h') { c.ghost = dotsLayer(g, col, 0.3, SN.JOINTS, 5); c.now = dotsLayer(g, col, 1, SN.JOINTS, 6.5); }
    if (c.key === 'm') {
      c.ghost = robotLayer(g, 0.26, true); c.now = robotLayer(g, 1, true);
      c.rest = A.el('path', { fill: 'none', stroke: '#5c5c5c', 'stroke-width': 3, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' }, g);
      c.pts = dotsLayer(g, col, 1, ['head', 'haL', 'haR'], 11);
    }
  });
  SN.txt(A, el, 0, 462, 'Schematic: one motion as each encoder receives it. Faint: the last of the frames ahead.', { size: 20, fill: C.mute });
  var UPPER = [['pelvis', 'chest'], ['chest', 'head'], ['shL', 'shR'], ['shL', 'elL'], ['elL', 'haL'], ['shR', 'elR'], ['elR', 'haR']];

  return function draw(f) {
    var ts = STEP ? SN.since(f, STEP) : f.t, t = f.t;
    cards.forEach(function (c, k) {
      A.show(c.g, STEP ? A.ramp(ts, 0.15 + 0.5 * k, 0.6 + 0.5 * k) : 1);              // the three formats arrive left to right
      var j = SN.fk(SN.pose(t), c.body, c.cx, GROUND, SC), ja = SN.fk(SN.pose(t + c.ahead), c.body, c.cx, GROUND, SC);
      if (c.key === 'r') { drawRobot(c.ghost, ja); drawRobot(c.now, j); }
      if (c.key === 'h') { drawDots(c.ghost, ja, SN.BONES); drawDots(c.now, j, SN.BONES); }
      if (c.key === 'm') { drawRobot(c.ghost, ja); drawRobot(c.now, j); A.set(c.rest, { d: SN.bonePath(j, UPPER) }); drawDots(c.pts, j, null); }
    });
  };
});
