/* Slide "SONIC — how", before the first click: the motion command becomes a token.   <svg data-anim="sonic-fsq" viewBox="0 0 1160 470">
 * SCHEMATIC. Left: the next 10 frames of a reference motion (the illustrative motion of sonic-0kit.js, frames 0.1 s apart, as in Table S1).
 * Right: the encoder's output, 2 tokens x 32 numbers (the paper's FSQ-32-32). Every number is rounded to the nearest of 32 levels:
 * the white dash is the encoder output, the green square the rounded value. Counts are the paper's; the values themselves are illustrative
 * (smooth periodic functions with random phases, in step with the motion), so that the squares can be seen hopping between levels.
 * The strip under the columns is the same token as 64 cells, one shade per level.
 */
DeckAnim.register('sonic-fsq', function (el, A) {
  'use strict';
  var SN = window.SN, C = A.C, i, k;
  var NF = 10, CWd = 60, CHt = 104, CG = 4, GY0 = 74, SC = 48;
  // ---- the reference: 10 frames ahead, one small frame each (read left to right, top row first)
  SN.txt(A, el, 0, 30, 'the reference: 10 frames ahead', { size: 22, weight: 700 });
  var frames = [];
  for (k = 0; k < NF; k++) {
    var fx = (k % 5) * (CWd + CG), fy = GY0 + Math.floor(k / 5) * (CHt + CG);
    A.el('rect', { x: fx + 1, y: fy + 1, width: CWd - 2, height: CHt - 2, rx: 8, fill: '#0c0c0c', stroke: k ? C.line : '#8a8a8a', 'stroke-width': 2 }, el);
    var g = A.el('g', { fill: 'none', stroke: k ? '#a9a9a9' : '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    frames.push({ k: k, x: fx + CWd / 2, y: fy + CHt - 12, body: A.el('path', {}, g), head: A.el('circle', { r: 4.5, fill: k ? '#a9a9a9' : '#fff', stroke: 'none' }, g) });
  }
  SN.txt(A, el, 0, GY0 + 2 * CHt + CG + 34, 'joint angles and velocities,', { size: 20, fill: C.mid });
  SN.txt(A, el, 0, GY0 + 2 * CHt + CG + 60, 'frames 0.1 s apart', { size: 20, fill: C.mid });
  // ---- encoder
  var EX = 346, EY = 180;
  SN.arrow(A, el, [322, EY], [EX - 7, EY], { col: '#9a9a9a', hs: 8 });
  A.el('path', { d: 'M' + EX + ' ' + (EY - 62) + 'L' + (EX + 74) + ' ' + (EY - 34) + 'V' + (EY + 34) + 'L' + EX + ' ' + (EY + 62) + 'Z', fill: C.g, stroke: C.g, 'stroke-width': 3, 'stroke-linejoin': 'round' }, el);
  SN.txt(A, el, EX + 37, EY + 10, SN.cal('E') + SN.sub('r'), { size: 27, weight: 700, fill: '#000', anchor: 'middle' });
  SN.txt(A, el, EX + 37, EY + 96, 'encoder', { size: 20, fill: C.mid, anchor: 'middle' });
  SN.arrow(A, el, [EX + 82, EY], [EX + 118, EY], { col: '#9a9a9a' });
  // ---- the two tokens: 32 numbers each, 32 levels
  var NL = 32, ND = 32, TOP = 62, BOT = 318, LV = (BOT - TOP) / (NL - 1), P = 9.5, GX = [526, 854];
  var cols = [], rnd = A.rand(11);
  for (var gI = 0; gI < 2; gI++) {
    A.el('rect', { x: GX[gI] - 9, y: TOP - 12, width: ND * P + 8, height: BOT - TOP + 24, rx: 10, fill: '#0c0c0c', stroke: C.line, 'stroke-width': 2 }, el);
    for (k = 0; k < NL; k++) A.el('line', { x1: GX[gI] - 5, x2: GX[gI] + ND * P - 5, y1: BOT - k * LV, y2: BOT - k * LV, stroke: k % 8 === 0 || k === NL - 1 ? '#343434' : '#1d1d1d', 'stroke-width': 1.5 }, el);
    SN.txt(A, el, GX[gI] - 9, 30, 'token ' + (gI + 1), { size: 22, weight: 700 });
    SN.txt(A, el, GX[gI] + ND * P - 1, 30, '32 numbers', { size: 20, fill: C.mid, anchor: 'end' });
    for (i = 0; i < ND; i++) {
      cols.push({ x: GX[gI] + i * P, p1: 6.283 * rnd(), p2: 6.283 * rnd(), a: 1.2 + 2.8 * rnd(), c: 5 + 21 * rnd(),
        sq: A.el('rect', { width: 7, height: 7, rx: 1.5, fill: C.g }, el) });
    }
  }
  for (i = 0; i < cols.length; i++) cols[i].ring = A.el('line', { stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round' }, el);
  // level scale at the left of token 1
  A.el('path', { d: 'M' + (GX[0] - 22) + ' ' + TOP + 'V' + BOT, stroke: C.mid, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, el);
  A.el('path', { d: 'M' + (GX[0] - 28) + ' ' + TOP + 'h12M' + (GX[0] - 28) + ' ' + BOT + 'h12', stroke: C.mid, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, el);
  var lv = SN.txt(A, el, 0, 0, '32 levels', { size: 20, fill: C.mid, anchor: 'middle' });
  lv.setAttribute('transform', 'translate(' + (GX[0] - 34) + ' ' + ((TOP + BOT) / 2) + ') rotate(-90)');
  // the token as what leaves the box: 64 numbers, each one of 32 levels
  var strip = [], SY = 352;
  for (i = 0; i < 64; i++) strip.push(A.el('rect', { x: cols[i].x - 4.2, y: SY, width: 8.4, height: 24, rx: 2, fill: C.g }, el));
  var note = SN.txt(A, el, GX[0] - 9, SY + 56, 'the token ' + SN.mi('z') + ': 64 numbers, one shade per level', { size: 20, fill: '#d6d6d6' });
  // legend
  var LY = 452;
  SN.txt(A, el, 0, LY, 'Schematic, illustrative values', { size: 20, fill: C.mute });
  A.el('line', { x1: GX[0] - 9, x2: GX[0] + 5, y1: LY - 7, y2: LY - 7, stroke: '#fff', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, el);
  SN.txt(A, el, GX[0] + 16, LY, 'encoder output', { size: 20, fill: C.mid });
  var lg = A.el('g', {}, el);
  A.el('rect', { x: GX[0] + 196, y: LY - 14, width: 13, height: 13, rx: 2.5, fill: C.g }, lg);
  SN.txt(A, lg, GX[0] + 218, LY, 'rounded to the nearest of 32 levels', { size: 20, fill: C.mid });

  return function draw(f) {
    var t = f.t, u = 2 * Math.PI * t / SN.T, s;
    // the reference frames: frame k is the pose k * 0.1 s ahead
    for (i = 0; i < frames.length; i++) {
      var fr = frames[i], j = SN.fk(SN.pose(t + 0.1 * fr.k), SN.ROBOT, fr.x, fr.y, SC);
      A.set(fr.body, { d: SN.bonePath(j, SN.BONES) });
      A.set(fr.head, { cx: j.head[0].toFixed(1), cy: (j.head[1] - 1.5).toFixed(1) });
    }
    // quantization: the encoder outputs first, then the squares arrive column by column (first 2.6 s of the slide); both follow the motion
    var sweep = f.step > 0 ? 1 : A.ramp(t, 1.0, 2.6);
    for (i = 0; i < cols.length; i++) {
      var c = cols[i], v = A.clamp(c.c + c.a * Math.sin(u + c.p1) + 0.4 * c.a * Math.sin(2 * u + c.p2), 0, NL - 1), q = Math.round(v), y = BOT - v * LV;
      A.set(c.ring, { x1: c.x - 4.2, x2: c.x + 4.2, y1: y.toFixed(1), y2: y.toFixed(1) });
      s = sweep * cols.length > i ? 1 : 0;
      A.set(c.sq, { x: c.x - 3.5, y: (BOT - q * LV - 3.5).toFixed(1) }); A.show(c.sq, s);
      A.set(strip[i], { 'fill-opacity': (0.14 + 0.86 * q / (NL - 1)).toFixed(2) }); A.show(strip[i], s);
    }
    A.show(note, f.step > 0 ? 1 : A.ramp(t, 2.4, 2.9)); A.show(lg, f.step > 0 ? 1 : A.ramp(t, 1.0, 1.4));
  };
});
