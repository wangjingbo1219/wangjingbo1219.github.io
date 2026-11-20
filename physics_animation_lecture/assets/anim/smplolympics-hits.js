/* SMPLOlympics - how: what the video demonstrations are worth in table tennis.   <svg data-anim="smplolympics-hits" data-step="3" viewBox="0 0 682 108">
 * A bar chart of the paper's numbers, not a simulation. Table 5 (appendix C), table tennis, "Avg Hits":
 *   PULSE 0.74 · PULSE + AMP without PHC (raw pose estimates as discriminator data) 0.91 · PULSE + AMP with PHC (tracked motion) 1.83.
 * The bars grow once when build step data-step is entered, one after the other, then hold.
 * Colour: grey bars and one green bar (the row the click is about); every row carries its name.
 */
DeckAnim.register('smplolympics-hits', function (el, A) {
  'use strict';
  var C = A.C, ST = parseInt(el.getAttribute('data-step') || '3', 10), X0 = 250, PX = 150, TOP = 27, PITCH = 27, BH = 16, GREY = '#7d7d7d';
  var ROWS = [
    { n: 'PULSE alone', v: 0.74, s: '0.74', col: GREY },
    { n: '+ AMP, raw estimates', v: 0.91, s: '0.91', col: GREY },
    { n: '+ AMP, PHC-tracked', v: 1.83, s: '1.83', col: C.g }
  ];
  function txt(p, x, y, s, o) {
    o = o || {};
    return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', text: s,
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || C.mid) }, p);
  }
  function bar(x, y, w, h) {
    var r = Math.min(4, w / 2);
    if (w < 0.5) return 'M' + x + ' ' + y + 'Z';
    return 'M' + x + ' ' + y + 'H' + (x + w - r).toFixed(1) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'V' + (y + h - r) +
           'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + r + 'H' + x + 'Z';
  }
  txt(el, 0, 18, 'Table tennis · average hits');
  A.el('line', { x1: X0, y1: 24, x2: X0, y2: TOP + 3 * PITCH - 2, stroke: '#4a4a4a', 'stroke-width': 1.5 }, el);
  var rows = ROWS.map(function (R, j) {
    var y = TOP + j * PITCH;
    return {
      R: R, y: y + (PITCH - BH) / 2,
      bar: A.el('path', { fill: R.col }, el),
      name: txt(el, 0, y + 21, R.n, { weight: j === 2 ? 700 : 500, size: 21, fill: '#fff' }),
      val: txt(el, X0 + R.v * PX + 10, y + 21, R.s, { weight: 700, size: 22, fill: '#fff' })
    };
  });
  return function draw(f) {
    for (var j = 0; j < rows.length; j++) {
      var o = rows[j], t = f.step > ST ? 99 : (f.step === ST ? f.ts - 0.45 * j : -1);
      var u = A.ease(A.ramp(t, 0.3, 1.3));
      A.set(o.bar, { d: bar(X0, o.y, o.R.v * PX * u, BH) });
      A.show(o.name, A.ramp(t, 0.1, 0.4));
      A.show(o.val, A.ramp(t, 1.2, 1.5));
    }
  };
});
