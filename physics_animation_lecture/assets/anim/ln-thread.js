/* "Six questions, one thread"  (tools/slides/01_17_roadmap.py)
 *
 * The svg covers the whole stage (viewBox = slide coordinates) and lies under the six chapter cards.
 * A thread runs above the cards: Imitate -> fork into three roads (Priors, Models, Scale) -> merge -> Interact -> Reality.
 *   step 0   the whole route is there as a grey track; the thread is drawn up to Imitate
 *   step 1-3 one road per click: the thread forks and reaches Priors, then Models, then Scale
 *   step 4   the three roads merge and reach Interact          step 5   on to Reality
 *   step 6   signals run along the whole thread; the caption words light up as the signal passes the chapter they belong to
 * data-top / data-h: top edge and height of the cards (px, slide coordinates).
 * draw(f) is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('ln-thread', function (el, A) {
  'use strict';
  var sec = el.closest('section');
  var CC = JSON.parse(el.getAttribute('data-colors') || '["#76B900","#d6e86b","#c58cff","#ffffff","#f5b301","#4fc3f7"]');
  var CT = parseFloat(el.getAttribute('data-top') || '318'), CH = parseFloat(el.getAttribute('data-h') || '612');
  var X0 = 90, CW = 275, PITCH = 293, YM = 280, YL = [262, 280, 298], XF = 300, XM = 1254, V = 560;
  function cx(i) { return X0 + PITCH * i + CW / 2; }
  function crv(xa, ya, yb) { return 'C' + (xa + 36) + ' ' + ya + ' ' + (xa + 36) + ' ' + yb + ' ' + (xa + 72) + ' ' + yb; }

  // ghost: the card slots still to come, and the whole route
  var ghost = A.el('g', null, el);
  for (var i = 1; i < 6; i++) {
    A.el('rect', { x: X0 + PITCH * i + 1, y: CT + 1, width: CW - 2, height: CH - 2, rx: 16, fill: '#070707', stroke: '#222', 'stroke-width': 1.5, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, ghost);
    A.el('text', { x: cx(i), y: CT + CH / 2 + 40, 'text-anchor': 'middle', text: String(i + 1), style: 'font:700 120px ' + A.FONT + ';fill:#171717' }, ghost);
  }

  // the thread, piece by piece: d, colour, the step that draws it, when it grows within that step (s), start distance along the route
  var D = [
    ['M' + X0 + ' ' + YM + ' H' + cx(0), 0, 0, 0.2, 0.9],
    ['M' + cx(0) + ' ' + YM + ' H' + XF, 0, 1, 0, 0.2],
    ['M' + XF + ' ' + YM + ' ' + crv(XF, YM, YL[0]) + ' H' + cx(1), 1, 1, 0.2, 0.9],
    ['M' + XF + ' ' + YM + ' H' + cx(2), 2, 2, 0, 0.9],
    ['M' + XF + ' ' + YM + ' ' + crv(XF, YM, YL[2]) + ' H' + cx(3), 3, 3, 0, 1.0],
    ['M' + cx(1) + ' ' + YL[0] + ' H' + XM + ' ' + crv(XM, YL[0], YM), 1, 4, 0, 0.8],
    ['M' + cx(2) + ' ' + YL[1] + ' H' + (XM + 72), 2, 4, 0, 0.8],
    ['M' + cx(3) + ' ' + YL[2] + ' H' + XM + ' ' + crv(XM, YL[2], YM), 3, 4, 0, 0.8],
    ['M' + (XM + 72) + ' ' + YM + ' H' + cx(4), 4, 4, 0.8, 1.05],
    ['M' + cx(4) + ' ' + YM + ' H' + cx(5), 5, 5, 0, 0.8],
    ['M' + cx(5) + ' ' + YM + ' H1818', 5, 5, 0.8, 1.1]
  ];
  var PREV = [-1, 0, 1, 1, 1, 2, 3, 4, 6, 8, 9];       // the piece each piece continues from (for distances along the route)
  D.forEach(function (d) { A.el('path', { d: d[0], fill: 'none', stroke: '#2a2a2a', 'stroke-width': 5, 'stroke-linecap': 'round' }, ghost); });
  A.el('path', { d: 'M1806 268 L1820 280 L1806 292', fill: 'none', stroke: '#2a2a2a', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ghost);

  // stations: x, y, chapter, the step that reaches it, the moment (s) within that step
  var ST = [[cx(0), YM, 0, 0, 0.9], [cx(1), YL[0], 1, 1, 0.9], [cx(2), YL[1], 2, 2, 0.9], [cx(3), YL[2], 3, 3, 1.0], [cx(4), YM, 4, 4, 1.05], [cx(5), YM, 5, 5, 0.8]];
  var stems = ST.map(function (s) { return A.el('line', { x1: s[0], y1: s[1] + 8, x2: s[0], y2: CT, stroke: CC[s[2]], 'stroke-width': 3, 'stroke-linecap': 'round' }, el); });
  var P = D.map(function (d, k) {
    var cas = A.el('path', { d: d[0], fill: 'none', stroke: '#000', 'stroke-width': 11, 'stroke-linecap': 'butt' }, el);
    var p = A.el('path', { d: d[0], fill: 'none', stroke: CC[d[1]], 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    var len = p.getTotalLength();
    A.set(p, { 'stroke-dasharray': len + ' ' + (len + 20) }); A.set(cas, { 'stroke-dasharray': len + ' ' + (len + 20) });
    return { p: p, cas: cas, len: len, col: CC[d[1]], step: d[2], a: d[3], b: d[4], d0: 0 };
  });
  P.forEach(function (p, k) { p.d0 = PREV[k] < 0 ? 0 : P[PREV[k]].d0 + P[PREV[k]].len; });
  var REACH = P[10].d0 + P[10].len, DMERGE = P[8].d0;
  var tip = A.el('path', { d: 'M1806 268 L1820 280 L1806 292', fill: 'none', stroke: CC[5], 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var dots = ST.map(function (s) {
    return { ring: A.el('circle', { cx: s[0], cy: s[1], r: 11, fill: 'none', stroke: CC[s[2]], 'stroke-width': 3, opacity: 0 }, el),
             dot: A.el('circle', { cx: s[0], cy: s[1], r: 11, fill: CC[s[2]], stroke: '#000', 'stroke-width': 4 }, el) };
  });
  var pulses = P.map(function (p) {
    var g = A.el('g', { opacity: 0 }, el);
    A.el('circle', { r: 15, fill: p.col, opacity: 0.35 }, g); A.el('circle', { r: 6.5, fill: '#fff' }, g);
    return g;
  });
  // what each stretch of the thread is, in the words of the story
  var LAB = [
    [A.text(el, cx(0), 256, 'the recipe', { size: 21, fill: '#e6e6e6', anchor: 'middle', halo: false }), 0, 0.9],
    [A.text(el, cx(2), 245, 'three roads', { size: 21, fill: '#e6e6e6', anchor: 'middle', halo: false }), 1, 0.2],
    [A.text(el, XM + 84, 256, 'the world gets objects', { size: 21, fill: '#e6e6e6', anchor: 'start', halo: false }), 4, 1.05],
    [A.text(el, 1830, 256, 'the recipe on robots', { size: 21, fill: '#e6e6e6', anchor: 'end', halo: false }), 5, 0.8]
  ];
  var words = Array.prototype.slice.call(sec.querySelectorAll('.ln-sv'));      // caption words: data-z = the piece of thread they belong to

  return function draw(f) {
    var st = f.step, k;
    function tm(step) { return st > step ? 1e3 : (st === step ? (step === 0 ? f.t : f.ts) : -1); }     // seconds since `step` began (-1: not yet)
    var done = 0;                                                                                       // when the growth of the current step ends
    for (k = 0; k < P.length; k++) {
      var p = P[k], t = tm(p.step), u = t < 0 ? 0 : A.ramp(t, p.a, p.b);
      p.u = u;
      A.show(p.p, u > 0 ? 1 : 0); A.show(p.cas, u > 0 ? 1 : 0);
      A.set(p.p, { 'stroke-dashoffset': (p.len * (1 - u)).toFixed(1) }); A.set(p.cas, { 'stroke-dashoffset': (p.len * (1 - u)).toFixed(1) });
      if (p.step === st) done = Math.max(done, p.b);
    }
    A.show(tip, P[10].u >= 1 ? 1 : 0);
    for (k = 0; k < ST.length; k++) {
      var s = ST[k], ts = tm(s[3]) - s[4], on = ts >= 0;
      A.show(dots[k].dot, on ? 1 : 0); A.set(dots[k].dot, { r: on ? 11 + 5 * (1 - A.ramp(ts, 0, 0.35)) * A.ramp(ts, 0, 0.08) : 11 });
      A.show(dots[k].ring, on ? 1 - A.ramp(ts, 0, 0.7) : 0); A.set(dots[k].ring, { r: 11 + 26 * A.ease(A.ramp(ts, 0, 0.7)) });
      var su = on ? A.ramp(ts, 0.05, 0.4) : 0;
      A.show(stems[k], su > 0 ? 0.85 : 0); A.set(stems[k], { y2: A.lerp(s[1] + 8, CT, su) });
    }
    for (k = 0; k < LAB.length; k++) { var tl = tm(LAB[k][1]) - LAB[k][2]; A.show(LAB[k][0], A.ramp(tl, 0, 0.4)); }

    // signals running along what has been drawn so far
    var reach = 0;
    for (k = 0; k < P.length; k++) if (P[k].u >= 1) reach = Math.max(reach, P[k].d0 + P[k].len);
    var tau = (st === 0 ? f.t : f.ts) - done - 0.35, T = reach / V + 0.9, d = tau >= 0 ? V * A.loop(tau, T) : -1;
    for (k = 0; k < P.length; k++) {
      var q = P[k], on2 = d >= 0 && q.u >= 1 && d >= q.d0 && d < q.d0 + q.len && !(k === 10 && d > q.d0 + q.len - 14);
      if (on2) { var pt = q.p.getPointAtLength(d - q.d0); A.set(pulses[k], { transform: 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')' }); }
      A.show(pulses[k], on2 ? 1 : 0);
    }
    // step 6: the caption follows the signal
    for (k = 0; k < words.length; k++) {
      var z = parseInt(words[k].getAttribute('data-z'), 10), lit = false;
      if (st >= 6 && d >= 0) lit = d >= DMERGE || (z === 0 ? d < P[2].d0 : d >= P[2].d0);        // z 0: before the fork, z 2: on the three roads
      words[k].style.color = lit ? CC[parseInt(words[k].getAttribute('data-c'), 10)] : '';
    }
  };
});
