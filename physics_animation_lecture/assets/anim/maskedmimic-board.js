/* Slide "MaskedMimic — results": the prompt board.   <svg data-anim="maskedmimic-board" viewBox="0 0 566 316">  (first tile of the 3 x 2 wall)
 * The goal board of maskedmimic-0kit.js, now filled in by the user: for the clip that the current click adds, it lights exactly the targets
 * that the paper gives the controller for that task (Sec. 7.2, 8.2, 8.3). SCHEMATIC: which slots are filled, not their values.
 *   step 0  VR           head (position + rotation) and both hand positions, every frame                        (Sec. 7.2 "Joint sparsity")
 *   step 1  joystick     pelvis rotation and position, one second ahead                                         (Sec. 8.2 "Steering")
 *   step 2  text         a sentence and no joint target                                                         (Sec. 8.4)
 *   step 3  sit          a two-state machine: far away a walking direction (1 m/s) + "the person walks normally";
 *                        within 2 m only the object's bounding box                                              (Sec. 8.3)
 *   step 4  path + text  head targets at the next five frames and one 0.8 s ahead, plus a sentence              (Sec. 8.2 "Path-Following", Fig. 7f)
 *   step 5  (hand-off)   the board cycles through the five prompts; a ring marks the clip each one belongs to
 * The ring is drawn outside this svg's box (overflow is visible), on the inside of the clip's edge so that it stays within the slide margins:
 * tile s of the wall sits at (587 * (s % 3) - 1, 362 * floor(s / 3) - 1) from this svg (the card that holds the svg has a 1 px border).
 */
DeckAnim.register('maskedmimic-board', function (el, A) {
  'use strict';
  var C = A.C, K = window.MMK;
  function tx(p, x, y, s, o) {
    o = o || {};
    return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', text: s, style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') }, p);
  }
  // x / gx are chosen so that the tag right of the 'later' column ('0.8 s') ends about as far from the card's edge as the row names start from it
  var B = K.board(el, A, { x: 144, y: 96, cw: 31, ch: 25, gap: 5, n: 10, lx: 20, gx: 14, rows: K.PARTS, bars: ['text', 'object'], size: 20, barh: 25, bary: 251 });
  var name = tx(el, 20, 34, '', { weight: 700, size: 24 }), sub = tx(el, 20, 62, '', { fill: C.mid });
  tx(el, 144, 87, 'next frames', { fill: C.mute });
  A.el('path', { d: 'M267 80H301M293 73L301 80L293 87', fill: 'none', stroke: C.mute, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  tx(el, B.xl + B.W / 2, 87, 'later', { fill: C.mute, anchor: 'middle' });
  var tag = [], i;
  for (i = 0; i < 6; i++) tag.push(tx(el, B.xl + B.W + 8, B.cy(i) + 7, '', { fill: C.gbr, weight: 700 }));
  var dir = A.el('g', {}, el);
  A.el('rect', { x: 152, y: 150, width: 290, height: 36, rx: 9, fill: '#0c0c0c', stroke: C.g, 'stroke-width': 2.5 }, dir);
  tx(dir, 297, 175, 'a walking direction, 1 m/s', { anchor: 'middle', fill: C.gbr, weight: 700 });
  var ring = A.el('rect', { 'class': 'mm-ring', width: 562.5, height: 312.5, rx: 14.25, fill: 'none', stroke: C.gbr, 'stroke-width': 3.5 }, el);      // hidden in print and overview by the slide's CSS

  // near: {row: how many of the next frames carry a target}; late: {row: label of the one target further ahead}
  var PR = [
    { tile: 1, name: 'VR headset', ph: [{ sub: 'head and both hands, every frame', near: { 0: 10, 1: 10, 2: 10 } }] },
    { tile: 2, name: 'Joystick', ph: [{ sub: 'pelvis position and heading, 1 s ahead', late: { 3: '1 s' } }] },
    { tile: 3, name: 'Text', ph: [{ sub: 'a sentence, no joint target', text: '“… performs a handstand”' }] },
    { tile: 4, name: 'Goal engineering: sit down', ph: [{ sub: 'far away: a walking direction + a sentence', dir: 1, text: '“the person walks normally”' },
                                                  { sub: 'within 2 m: only the object’s bounding box', object: 'bounding box' }] },
    { tile: 5, name: 'Path + text', ph: [{ sub: 'head: the next 5 frames and 0.8 s ahead', near: { 0: 5 }, late: { 0: '0.8 s' }, text: '“… walks with its hands raised”' }] }
  ];
  var CYC = 3.6, PH = 2.6;

  return function draw(f) {
    var st = f.step, ts = f.ts, k, loc, pi, P, p;
    if (st < 5) { k = Math.min(st, 4); P = PR[k]; pi = Math.floor(ts / PH) % P.ph.length; loc = P.ph.length > 1 ? ts - Math.floor(ts / PH) * PH : ts; }
    else { k = Math.floor(ts / CYC) % 5; P = PR[k]; loc = ts - Math.floor(ts / CYC) * CYC; pi = 0; if (P.ph.length > 1) { pi = loc < CYC / 2 ? 0 : 1; loc -= pi * CYC / 2; } }
    p = P.ph[pi];
    var al = A.ramp(loc, 0, 0.35), near = p.near || {}, late = p.late || {};
    B.draw({
      scroll: f.t * 5,
      lit: function (n, r, pos) { return near[r] ? al * A.clamp(near[r] - pos, 0, 1) : 0; },
      late: function (r) { return late[r] ? al : 0; },
      rowOn: function (r) { return (near[r] || late[r]) ? al : 0; },
      bars: [{ v: p.text ? al : 0, label: p.text || '' }, { v: p.object ? al : 0, label: p.object || '' }]
    });
    if (name.textContent !== P.name) name.textContent = P.name;
    if (sub.textContent !== p.sub) sub.textContent = p.sub;
    A.show(sub, 0.25 + 0.75 * al);
    for (i = 0; i < 6; i++) { if (tag[i].textContent !== (late[i] || '')) tag[i].textContent = late[i] || ''; A.show(tag[i], al); }
    A.show(dir, p.dir ? al : 0);
    A.set(ring, { x: 587 * (P.tile % 3) + 0.75, y: 362 * Math.floor(P.tile / 3) + 0.75 });
    A.show(ring, st === 0 ? 0 : (st < 5 ? 1 : Math.min(1, loc / 0.3 + pi)));
  };
});
