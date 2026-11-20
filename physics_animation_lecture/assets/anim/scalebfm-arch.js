/* Slide "ScaleBFM — how", click 4: the Humanoid Transformer and its latent.   <svg data-anim="scalebfm-arch" data-step="4" viewBox="0 0 1740 334">
 * SCHEMATIC, no data.
 * Left card: the data flow of the paper's Fig. 3 and App. A.4, turned on its side.
 *   history    proprioception and action tokens, interleaved, then one learnable query token e (Eq. A.3, A.4). The history length
 *              is not given in the paper: the row is drawn with an ellipsis.
 *   command    six goal tokens: the next five frames (indices 0 to 4) and one frame drawn from 5 to 32 (Sec. 3.4)
 *   RMSNorm    puts the goal embeddings on a hypersphere (Eq. A.10); no auxiliary loss shapes this latent (Sec. 3.4)
 *   one layer  self-attention over the history, cross-attention to the goal tokens, feed-forward (Eq. A.9), repeated N times
 *              (N = 4 in the 3.00M model, App. B.6); a projection head on the query token gives the action
 * Right card: a drawing AFTER the paper's Fig. 10 (five motion sequences, goal latents projected to 3-D): each motion is a smooth
 * curve, the five lie in different regions, forward / backward and left / right on opposite sides. The curves here are drawn
 * by hand to show that arrangement; they are not the paper's data.
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('scalebfm-arch', function (el, A) {
  'use strict';
  var SB = window.SBF, C = A.C, G = C.g, AM = C.amber, STEP = parseInt(el.getAttribute('data-step') || '0', 10);
  // ---------------------------------------------------------------- left card: the data flow
  SB.card(A, el, 0, 0, 1176, 334);
  function tok(x, y, w, s, col, fillc) {
    A.el('rect', { x: x, y: y, width: w, height: 34, rx: 7, fill: fillc || '#161616', stroke: col, 'stroke-width': 2.2 }, el);
    if (s) SB.txt(A, el, x + w / 2, y + 24, s, { size: 20, weight: 700, anchor: 'middle', fill: fillc ? '#000' : col });
  }
  var HY = 92, CY = 232, sI = SB.mi('s'), aI = SB.mi('a');
  SB.txt(A, el, 28, 60, 'history: states and actions, interleaved', { size: 20, fill: C.mid });
  [28, 70, 112, 154].forEach(function (x, k) { tok(x, HY, 34, k % 2 ? aI : sI, k % 2 ? G : '#e6e6e6'); });
  SB.txt(A, el, 213, HY + 22, '…', { size: 24, weight: 700, anchor: 'middle', fill: C.mid });
  [240, 282, 324].forEach(function (x, k) { tok(x, HY, 34, k % 2 ? aI : sI, k % 2 ? G : '#e6e6e6'); });
  tok(372, HY, 34, SB.mi('e'), AM, AM);
  SB.txt(A, el, 389, HY + 62, 'query token', { size: 20, fill: AM, anchor: 'middle' });
  var p1 = [[412, HY + 17], [468, HY + 17]];
  SB.arrow(A, el, p1);
  // the layer
  A.el('rect', { x: 468, y: 62, width: 518, height: 94, rx: 14, fill: 'none', stroke: '#5a5a5a', 'stroke-width': 2, 'stroke-dasharray': '7 6' }, el);
  SB.txt(A, el, 986, 50, '× ' + SB.mi('N') + ' layers · ' + SB.mi('N') + ' = 4 in the 3.0M model', { size: 20, fill: C.mid, anchor: 'end' });
  [[482, 150, 'self-attention'], [650, 166, 'cross-attention'], [834, 138, 'feed-forward']].forEach(function (b) {
    A.el('rect', { x: b[0], y: 80, width: b[1], height: 58, rx: 10, fill: '#0f1a06', stroke: G, 'stroke-width': 2.2 }, el);
    SB.txt(A, el, b[0] + b[1] / 2, 116, b[2], { size: 20, weight: 700, anchor: 'middle' });
  });
  SB.arrow(A, el, [[632, 109], [650, 109]], { hs: 6 }); SB.arrow(A, el, [[816, 109], [834, 109]], { hs: 6 });
  var p2 = [[972, 109], [1026, 109]];
  SB.arrow(A, el, p2);
  A.el('rect', { x: 1026, y: 89, width: 100, height: 40, rx: 20, fill: G }, el);
  SB.txt(A, el, 1076, 116, 'action', { size: 21, weight: 700, anchor: 'middle', fill: '#000' });
  SB.txt(A, el, 1076, 156, 'joint targets', { size: 20, fill: C.mid, anchor: 'middle' });
  // the command
  SB.txt(A, el, 28, CY - 14, 'command: the next five frames, and one drawn from 5 to 32 ahead', { size: 20, fill: C.mid });
  ['0', '1', '2', '3', '4'].forEach(function (s, k) { tok(28 + 42 * k, CY, 34, s, '#e6e6e6'); });
  tok(238, CY, 70, '5–32', '#e6e6e6');
  var p3 = [[314, CY + 17], [364, CY + 17]];
  SB.arrow(A, el, p3);
  A.el('rect', { x: 364, y: CY - 3, width: 122, height: 40, rx: 20, fill: '#161616', stroke: '#8a8a8a', 'stroke-width': 2.2 }, el);
  SB.txt(A, el, 425, CY + 24, 'RMSNorm', { size: 20, weight: 700, anchor: 'middle' });
  var p4 = [[486, CY + 17], [699, CY + 17]];
  SB.arrow(A, el, p4);
  A.el('circle', { cx: 733, cy: CY + 17, r: 30, fill: '#101810', stroke: G, 'stroke-width': 2.4 }, el);
  A.el('ellipse', { cx: 733, cy: CY + 17, rx: 30, ry: 10, fill: 'none', stroke: '#4d7a0c', 'stroke-width': 1.6 }, el);
  A.el('ellipse', { cx: 733, cy: CY + 17, rx: 11, ry: 30, fill: 'none', stroke: '#4d7a0c', 'stroke-width': 1.6 }, el);
  var star = A.el('circle', { r: 5.5, fill: AM }, el);
  SB.txt(A, el, 779, CY + 10, 'goal latent on a sphere:', { size: 20, weight: 700 });
  SB.txt(A, el, 779, CY + 36, 'shaped by the tracking reward alone', { size: 20, fill: C.mid });
  var p5 = [[733, CY - 14], [733, 138]];
  SB.arrow(A, el, p5);
  SB.txt(A, el, 28, 314, 'Tokenizers and head are single linear layers; positions by RoPE; the feed-forward block is SwiGLU.', { size: 20, fill: C.mute });
  var pulses = [p1, p2, p3, p4, p5].map(function (p) { return { p: p, d: A.el('circle', { r: 4.5, fill: '#fff' }, el) }; });

  // ---------------------------------------------------------------- right card: the latent, after Fig. 10
  SB.card(A, el, 1200, 0, 540, 334);
  SB.txt(A, el, 1222, 42, 'Five motions on the sphere', { size: 25, weight: 700 });
  var SX = 1352, SY = 182, R = 116;
  A.el('circle', { cx: SX, cy: SY, r: R, fill: '#141414', stroke: '#5a5a5a', 'stroke-width': 2 }, el);
  [[R, 0.34], [R, 0.72], [0.36, R], [0.74, R]].forEach(function (e, k) {
    A.el('ellipse', { cx: SX, cy: SY, rx: k < 2 ? e[0] : R * e[0], ry: k < 2 ? R * e[1] : e[1], fill: 'none', stroke: '#2e2e2e', 'stroke-width': 1.5 }, el);
  });
  // name, colour, centre (in units of R), radii, rotation, wobble: each curve is a small closed loop, drawn by hand
  var MOT = [
    ['walk forward', '#2fb97c', 0.74, 0.16, 0.08, 0.27, 0.25, 3],
    ['walk backward', '#f0524a', -0.66, -0.30, 0.20, 0.26, -0.5, 2],
    ['crouch left', '#f0a020', 0.52, -0.50, 0.22, 0.09, 0.6, 2],
    ['crouch right', '#3a8fd8', -0.34, 0.26, 0.26, 0.20, 0.2, 3],
    ['squat', '#d68ac0', -0.14, -0.72, 0.28, 0.12, -0.12, 4]
  ];
  function pt(m, u) {
    var a = 2 * Math.PI * u, rr = 1 + 0.22 * Math.sin(m[7] * a + 1), x = m[4] * rr * Math.cos(a), y = m[5] * rr * Math.sin(a), c = Math.cos(m[6]), s = Math.sin(m[6]);
    return [SX + R * (m[2] + x * c - y * s), SY + R * (m[3] + x * s + y * c)];
  }
  var movers = MOT.map(function (m, k) {
    var pts = [], i;
    for (i = 0; i <= 80; i++) pts.push(pt(m, i / 80));
    A.el('path', { d: A.path(pts) + 'Z', fill: 'none', stroke: m[1], 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, el);
    A.el('circle', { cx: 1502, cy: 98 + 34 * k, r: 7, fill: m[1] }, el);
    SB.txt(A, el, 1518, 105 + 34 * k, m[0], { size: 21, weight: 700 });
    return A.el('circle', { r: 6.5, fill: '#fff', stroke: m[1], 'stroke-width': 3 }, el);
  });
  SB.txt(A, el, 1222, 318, 'Drawn after the paper’s Fig. 10; not its data.', { size: 20, fill: C.mute });

  return function draw(f) {
    var tt = SB.clock(f, STEP);
    pulses.forEach(function (q, k) {
      var u = A.loop(tt * 0.7 + (k >= 2 ? 0.5 : 0), 1), p = SB.along(q.p, u);
      A.set(q.d, { cx: p[0].toFixed(1), cy: p[1].toFixed(1) }); A.show(q.d, 0.9 * Math.sin(Math.PI * u));
    });
    var a = 2 * Math.PI * tt / 6;
    A.set(star, { cx: (733 + 20 * Math.cos(a)).toFixed(1), cy: (CY + 17 + 9 * Math.sin(a) - 6).toFixed(1) });
    movers.forEach(function (d, k) { var p = pt(MOT[k], A.loop(tt / 5 + 0.2 * k, 1)); A.set(d, { cx: p[0].toFixed(1), cy: p[1].toFixed(1) }); });
  };
});
