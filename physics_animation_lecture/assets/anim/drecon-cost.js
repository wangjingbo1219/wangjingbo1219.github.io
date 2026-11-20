/* DReCon — results (tools/slides/02_30_drecon.py): the runtime of the pipeline, stage by stage.   <svg data-anim="drecon-cost" viewBox="0 0 564 317">
 * The four numbers are Table 4 of the paper (single thread, Intel Xeon E5-1650 V3): kinematic control 40 us, state construction 40 us,
 * policy evaluation 60 us, physics simulation 200 us, total 340 us. A cursor runs through the stages in the order of the pipeline and
 * each bar grows while the cursor is inside its stage; bar lengths are to scale. The chart appears at click 2 of the slide and animates
 * while that click is current; afterwards it shows the finished state.
 */
DeckAnim.register('drecon-cost', function (el, A) {
  'use strict';
  var C = A.C, GREY = '#8d8d8d';
  function txt(x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 500) + ' ' + (o.size || 21) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') }, el);
    n.textContent = s;
    return n;
  }
  var ST = [['kinematic control', 40, '#f0f0f0'], ['state construction', 40, '#8d8d8d'], ['policy evaluation', 60, C.g], ['physics simulation', 200, '#6170ff']];
  var X0 = 226, X1 = 452, VX = 540, TOT = 340, PX = (X1 - X0) / TOT, Y0 = 34, RH = 54, BH = 30, rows = [], acc = 0;
  ST.forEach(function (s, k) {
    var y = Y0 + k * RH;
    A.el('rect', { x: X0, y: y, width: X1 - X0, height: BH, rx: 6, fill: '#1a1a1a' }, el);
    var name = txt(24, y + 22, s[0]);
    var bar = A.el('rect', { x: X0 + acc * PX, y: y, height: BH, rx: 5, fill: s[2] }, el);
    var val = txt(VX, y + 22, s[1] + ' µs', { weight: 700, anchor: 'end' });
    rows.push({ a: acc, d: s[1], bar: bar, name: name, val: val });
    acc += s[1];
  });
  var YB = Y0 + 4 * RH - 8;
  A.el('path', { d: 'M' + X0 + ' ' + (YB - 7) + 'V' + (YB + 7) + 'M' + X0 + ' ' + YB + 'H' + X1 + 'M' + X1 + ' ' + (YB - 7) + 'V' + (YB + 7), fill: 'none', stroke: C.line, 'stroke-width': 2.5 }, el);
  txt(24, YB + 44, 'whole pipeline', { size: 24, weight: 700 });
  txt(VX, YB + 44, '340 µs', { weight: 700, anchor: 'end', size: 26, fill: C.g });
  var cur = A.el('path', { stroke: C.amber, 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var SWEEP = 3.4, LOOP = 5.6;
  return function draw(f) {
    // click 2 brings the chart: the cursor runs from that click on. Once a later click is being explained (and on the still frame) the
    // chart is simply complete, so that it does not compete with what that click shows.
    var u = f.step === 2 ? A.loop(f.ts, LOOP) : LOOP, c = TOT * A.clamp(u / SWEEP, 0, 1), run = u < SWEEP;
    rows.forEach(function (r) {
      var w = A.clamp(c - r.a, 0, r.d), inside = run && c >= r.a && c < r.a + r.d;
      A.set(r.bar, { width: Math.max(0.01, w * PX).toFixed(1) });
      A.show(r.bar, run && !inside ? 0.55 : 1);
      A.show(r.name, run && !inside ? 0.55 : 1);
      A.show(r.val, c >= r.a + r.d ? 1 : 0);
    });
    A.set(cur, { d: 'M' + (X0 + c * PX).toFixed(1) + ' ' + (Y0 - 10) + 'V' + (YB + 8) });
    A.show(cur, run ? 1 : 0);
  };
});
