/* SuperTrack, results slide: why the roll-outs are short.   <svg data-anim="supertrack-horizon" data-k="3" viewBox="0 0 855 176">
 * SCHEMATIC after Fig. 14 of the paper ("predictions for 32, 64, and 128 frames. Beyond 64 frames, the world model struggles to maintain
 * the joint constraints"): the world model is rolled out along a frame axis; white = the simulated character, violet = the prediction,
 * which stays on it up to the policy window (32 frames), has drifted but is still in one piece at 64, and comes apart at the joints
 * only beyond 64. No measured values: only the three frame counts are the paper's.
 * data-k = the build step that reveals the figure: the sweep runs while that step is current. Drawn 1:1 (viewBox = size on the slide).
 */
DeckAnim.register('supertrack-horizon', function (el, A) {
  'use strict';
  var C = A.C, VI = C.violet, WH = '#f2f2f2', K = parseInt(el.getAttribute('data-k') || '0', 10);
  var X0 = 44, X1 = 797, GY = 126, SC = 1.08, FX = function (f) { return X0 + (X1 - X0) * f / 128; };
  var PI = '<tspan style="font-family:KaTeX_Main,\'Times New Roman\',serif;font-size:1.14em">Π</tspan>';       // Π as KaTeX sets it in the pipeline boxes
  function txt(x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'middle', style: 'font:' + (o.weight || 500) + ' 20px ' + A.FONT + ';fill:' + (o.fill || C.mid) }, el);
    n.innerHTML = s;
    return n;
  }
  var band = function (a, b, col) { A.el('path', { d: 'M' + FX(a) + ' ' + (GY + 6) + 'H' + FX(b), stroke: col, 'stroke-width': 6, 'stroke-linecap': 'butt', fill: 'none' }, el); };
  band(0, 32, C.g); band(32, 64, '#6a6a6a'); band(64, 128, C.red);
  [0, 32, 64, 128].forEach(function (f) { A.el('path', { d: 'M' + FX(f) + ' ' + (GY + 1) + 'v12', stroke: '#d0d0d0', 'stroke-width': 2.5, fill: 'none' }, el); });
  txt(FX(16), GY + 36, PI + '’s window', { fill: C.g, weight: 700 });
  txt(FX(32), GY + 36, '32'); txt(FX(64), GY + 36, '64');
  txt(FX(96) - 22, GY + 36, '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">W</tspan> loses the joints', { fill: C.red, weight: 700 });
  txt(FX(128) + 14, GY + 36, '128 frames', { anchor: 'end' });

  function figure(col, w) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    return { g: g, body: A.el('path', {}, g), head: A.el('circle', { stroke: 'none', fill: col }, g) };
  }
  var rnd = A.rand(11), OFF = [], i;
  for (i = 0; i < 10; i++) OFF.push([2 * rnd() - 1, -rnd()]);                 // direction in which each limb (and the head) leaves its joint: sideways and up, never through the ground
  var drift = function (f) { return f <= 32 ? 0.08 * f / 32 : (f <= 64 ? A.lerp(0.08, 0.45, (f - 32) / 32) : A.lerp(0.45, 1, (f - 64) / 64)); };
  function pair() { return { s: figure(WH, 4), p: figure(VI, 5) }; }
  function put(pr, f, alpha) {
    var d = drift(f), x = FX(f), ph = 0.5 + 0.21 * f, L = window.STK.limbs(x, GY, ph, 0, SC), P = window.STK.limbs(x - 8 * d, GY, ph - 0.7 * d, -0.15 * d, SC);
    A.set(pr.s.body, { d: window.STK.path(L.segs) }); A.set(pr.s.head, { cx: L.head[0].toFixed(1), cy: L.head[1].toFixed(1), r: L.head[2] });
    var m = 34 * Math.max(0, d - 0.45);                                       // the joints hold up to 64 frames (d = 0.45) and separate beyond
    A.set(pr.p.body, { d: window.STK.path(P.segs, function (k) { return [OFF[k][0] * m, OFF[k][1] * m * 0.8]; }) });
    A.set(pr.p.head, { cx: (P.head[0] + OFF[9][0] * m).toFixed(1), cy: (P.head[1] + OFF[9][1] * m * 0.8).toFixed(1), r: P.head[2] });
    A.show(pr.s.g, 0.8 * alpha); A.show(pr.p.g, alpha);
  }
  var stamps = [[32, pair()], [64, pair()], [128, pair()]], run = pair();
  var SWEEP = 4.4, LOOP = 7.2;

  return function draw(f) {
    var cur = f.step === K, u = cur ? A.loop(f.ts, LOOP) : LOOP - 1, fr = 128 * A.clamp(u / SWEEP, 0, 1), fade = cur ? Math.min(1, (LOOP - u) / 0.4) : 1;
    stamps.forEach(function (s) { put(s[1], s[0], fade * A.ramp(fr, s[0] - 4, s[0])); });
    put(run, fr, fr < 128 ? fade * Math.min(1, fr / 3) : 0);
  };
});
