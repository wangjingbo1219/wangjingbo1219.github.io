/* Slide "SONIC — how", click 4: one training stage.   <svg data-anim="sonic-stage" data-step="4" viewBox="0 0 1160 190">
 * SCHEMATIC, no time scale: the recipe of the previous paper (OmniH2O: a privileged teacher trained by RL, then a student distilled from it)
 * has two stages; SONIC has one. The bars are stages, not durations.
 */
DeckAnim.register('sonic-stage', function (el, A) {
  'use strict';
  var SN = window.SN, C = A.C, STEP = parseInt(el.getAttribute('data-step') || '0', 10), X0 = 292, X1 = 1158, H = 64, GREY = '#8a8a8a';
  function bar(x, y, w, col, label, tcol) {
    A.el('rect', { x: x, y: y, width: w, height: H, rx: 12, fill: '#0c0c0c', stroke: col, 'stroke-width': 2.5 }, el);
    var fill = A.el('rect', { x: x, y: y, height: H, rx: 12, fill: col, 'fill-opacity': col === C.g ? 0.3 : 0.2 }, el);
    SN.txt(A, el, x + 20, y + H / 2 + 8, label, { size: 21, weight: 700, fill: tcol || '#e6e6e6' });
    return { fill: fill, w: w };
  }
  SN.txt(A, el, 0, 28, 'Teacher, then student', { size: 23, weight: 700, fill: '#d6d6d6' });
  SN.txt(A, el, 0, 56, 'OmniH2O: two stages', { size: 20, fill: C.mid });
  var a1 = bar(X0, 1, 388, GREY, '1 · RL teacher, privileged state');
  var a2 = bar(X0 + 404, 1, X1 - X0 - 404, GREY, '2 · distill it into the deployable student');
  SN.txt(A, el, 0, 152, 'SONIC', { size: 23, weight: 700, fill: C.g });
  SN.txt(A, el, 0, 180, 'one stage', { size: 20, fill: C.mid });
  var b1 = bar(X0, 125, X1 - X0, C.g, 'PPO and the three losses together · only the critic sees privileged state', '#fff');
  return function draw(f) {
    var ts = STEP ? SN.since(f, STEP) : f.t;
    A.set(a1.fill, { width: Math.max(0.01, a1.w * A.ramp(ts, 0.4, 1.3)).toFixed(1) });
    A.set(a2.fill, { width: Math.max(0.01, a2.w * A.ramp(ts, 1.4, 2.3)).toFixed(1) });
    A.set(b1.fill, { width: Math.max(0.01, b1.w * A.ramp(ts, 2.6, 4.2)).toFixed(1) });
  };
});
