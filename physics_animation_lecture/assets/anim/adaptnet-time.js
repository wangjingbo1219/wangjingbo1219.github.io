/* AdaptNet, opening slide: what an adaptation costs, next to what the policy cost.     <svg data-anim="adaptnet-time" viewBox="0 0 392 616">  (any size)
 *
 * NUMBERS FROM THE PAPER (training time; the full track of every bar is the 26 hours of pre-training):
 *   pre-training a walking / running policy   around 26 h                      Sec. 7
 *   a new style (reference clip 0.8-2.2 s)     within 10-30 min                 Sec. 8.1, Table 1
 *   a new body shape or locked joints          15-30 min                        Sec. 8.2
 *   rough terrain, height map as new input     within 1.5 h (easier) .. around 4 h (most rugged)   Sec. 8.3.2
 *   obstacle avoidance                         around 22 h                      Sec. 8.3.2
 * A range is drawn up to its upper end. A row appears with the clip of the same build step (data-step of the row = the click):
 * its bar grows from zero, so the eye compares its length with the grey bar above.
 */
DeckAnim.register('adaptnet-time', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, VB = el.viewBox.baseVal, X0 = 24, X1 = VB.width - 24, HMAX = 26, Y0 = 64, DY = (VB.height - Y0 - 46) / 5;
  var ROWS = [
    { n: 'Pre-training', s: 'a locomotion policy, from scratch', v: '≈ 26 h', h: 26, step: 0, col: '#8a8a8a', vc: '#fff', t0: 0.3 },      // walking or running (Sec. 8)
    { n: 'New style', s: 'from a 0.8–2.2 s clip', v: '10–30 min', h: 0.5, step: 0, col: G, vc: G, t0: 1.3 },
    { n: 'New body', s: 'longer limbs, bigger torso', v: '15–30 min', h: 0.5, step: 1, col: G, vc: G, t0: 0.2 },
    { n: 'Rough terrain', s: 'new input: a height map', v: '≤ 4 h', h: 4, step: 2, col: G, vc: G, t0: 0.2 },
    { n: 'Obstacles', s: 'learns to walk around them', v: '≈ 22 h', h: 22, step: 3, col: G, vc: G, t0: 0.2 }
  ];
  function T(p, x, y, s, o) {
    o = o || {};
    return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', text: s,
      style: 'font:' + (o.weight || 700) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.ls ? ';letter-spacing:' + o.ls : '') }, p);
  }
  T(el, X0, 40, 'TRAINING TIME', { size: 20, fill: G, ls: '.14em' });
  var rows = ROWS.map(function (r, k) {
    var y = Y0 + k * DY, g = A.el('g', null, el);
    A.el('rect', { x: X0, y: y + 65, width: X1 - X0, height: 16, rx: 5, fill: '#1e1e1e' }, el);      // the empty track is there from the start
    T(g, X0, y + 26, r.n, { size: 25 });
    T(g, X1, y + 26, r.v, { size: 27, fill: r.vc, anchor: 'end' });
    T(g, X0, y + 53, r.s, { size: 20, weight: 500, fill: C.mid });
    return { g: g, bar: A.el('rect', { x: X0, y: y + 65, width: 0, height: 16, rx: 5, fill: r.col }, el) };
  });
  var ya = Y0 + ROWS.length * DY - 4;
  [0, 10, 20, 26].forEach(function (h) {
    var x = X0 + (X1 - X0) * h / HMAX;
    A.el('line', { x1: x, y1: ya, x2: x, y2: ya + 8, stroke: C.line, 'stroke-width': 2 }, el);
    T(el, x, ya + 31, h === 26 ? '26 h' : String(h), { size: 20, weight: 500, fill: C.mid, anchor: h === 0 ? 'start' : (h === 26 ? 'end' : 'middle') });
  });
  A.el('line', { x1: X0, y1: ya, x2: X1, y2: ya, stroke: C.line, 'stroke-width': 2 }, el);

  return function draw(f) {
    ROWS.forEach(function (r, k) {
      var u = f.step > r.step ? 1 : (f.step < r.step ? 0 : (r.step === 0 ? A.ramp(f.t, r.t0, r.t0 + 0.9) : A.ramp(f.ts, r.t0, r.t0 + 0.9)));
      var on = f.step > r.step ? 1 : (f.step < r.step ? 0 : (r.step === 0 ? A.ramp(f.t, r.t0 - 0.3, r.t0) : A.ramp(f.ts, 0, 0.3)));
      A.show(rows[k].g, on);
      A.set(rows[k].bar, { width: (Math.max(6, (X1 - X0) * r.h / HMAX) * A.ease(u)).toFixed(1) });
    });
  };
});
