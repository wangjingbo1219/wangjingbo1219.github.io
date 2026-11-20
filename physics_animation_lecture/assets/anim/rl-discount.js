/* "The policy and the return, in pictures", right panel (804 x 380): what a reward t steps ahead is worth, gamma^t.
 *   steps 0..2  the empty frame
 *   step 3      rewards of 1 arrive along the future (first slowly); each is cut down to its weight 0.95^t; the sum of the weights counts up to 20
 *   step 4      the effective horizon: the weights add up to 1 / (1 - 0.95) = 20, as much as the 20 full rewards in the box;
 *               20 steps = 0.67 s at 30 steps per second, where the weight has dropped to about 37 %
 *   step 5      gamma = 0.99: the same curve stretched five times, horizon 100 steps = 3.3 s
 * Exact numbers: 0.95^20 = 0.358, 0.99^100 = 0.366 (both about 1/e = 0.368); the 151 weights drawn add up to 19.99. */
DeckAnim.register('rl-discount', function (el, A) {
  var K = window.RLKit, C = A.C;
  var XL = 96, XR = 786, YB = 300, YT = 40, N = 150, PX = (XR - XL) / N;
  var X = function (t) { return XL + t * PX; }, Y = function (w) { return YB - w * (YB - YT); };
  var G1 = 0.95, G2 = 0.99, H1 = 20, H2 = 100, i;
  // frame
  [0, 0.5, 1].forEach(function (v) {
    A.el('line', { x1: XL, y1: Y(v), x2: XR, y2: Y(v), stroke: C.grid, 'stroke-width': 2 }, el);
    K.text(el, XL - 12, Y(v) + 7, String(v), 20, C.mid, 500, 'end');
  });
  [0, 30, 60, 90, 120, 150].forEach(function (t) {
    A.el('line', { x1: X(t), y1: YB, x2: X(t), y2: YB + 7, stroke: C.line, 'stroke-width': 2 }, el);
    K.text(el, X(t), YB + 30, t ? t + ' (' + (t / 30) + ' s)' : '0', 20, C.mid, 500, t === 150 ? 'end' : 'middle').setAttribute('dx', t === 150 ? 14 : 0);
  });
  A.el('path', { d: 'M' + XL + ' ' + (YT - 14) + ' V' + YB + ' H' + XR, fill: 'none', stroke: C.line, 'stroke-width': 2 }, el);
  K.text(el, (XL + XR) / 2, 364, 'policy steps into the future (30 per second)', 21, C.mid, 700, 'middle');
  var yl = K.text(el, 0, 0, 'weight of the reward, ' + K.ss('γ', 't', false, ''), 21, C.mid, 700, 'middle');
  yl.setAttribute('transform', 'translate(24 ' + (YT + YB) / 2 + ') rotate(-90)');
  // step 3: the rewards (full height, dark) and their weights (bright)
  var ghost = [], bar = [];
  for (i = 0; i <= N; i++) {
    ghost.push(A.el('rect', { x: (X(i) - 1.5).toFixed(1), y: Y(1), width: 3, height: YB - Y(1), fill: '#3a5c00', opacity: 0 }, el));
    bar.push(A.el('rect', { x: (X(i) - 1.5).toFixed(1), width: 3, fill: C.g, opacity: 0 }, el));
  }
  // step 4: the box of H1 full rewards
  var boxEl = A.el('path', { d: 'M' + (XL + 1) + ' ' + Y(1) + ' H' + X(H1) + ' V' + YB, fill: 'none', stroke: C.gbr, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, el);
  var c1 = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  var c2 = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  var e37 = A.el('line', { x1: XL, y1: Y(0.368), y2: Y(0.368), stroke: C.mid, 'stroke-width': 2, 'stroke-dasharray': '2 7' }, el);
  var t37 = K.text(el, XL - 12, Y(0.368) + 7, '0.37', 20, '#fff', 700, 'end');
  var h1 = A.el('line', { x1: X(H1), x2: X(H1), y1: YB, stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '3 7' }, el);
  var h2 = A.el('line', { x1: X(H2), x2: X(H2), y1: YB, stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '3 7' }, el);
  var d1 = A.el('circle', { cx: X(H1), cy: Y(Math.pow(G1, H1)), r: 8, fill: C.g, stroke: '#101010', 'stroke-width': 3 }, el);
  var d2 = A.el('circle', { cx: X(H2), cy: Y(Math.pow(G2, H2)), r: 8, fill: '#fff', stroke: '#101010', 'stroke-width': 3 }, el);
  var l1 = A.text(el, X(37), Y(0.205), '', { size: 21, fill: C.gbr });
  l1.innerHTML = K.mi('γ') + ' = 0.95: 20 steps ≈ 0.67 s';
  var l2 = A.text(el, X(64), Y(0.68), '', { size: 21, fill: '#fff' });
  l2.innerHTML = K.mi('γ') + ' = 0.99: 100 steps ≈ 3.3 s';
  var sum = A.text(el, XR, YT + 10, '', { size: 21, fill: C.gbr, anchor: 'end' });
  var now = K.text(el, XL + 8, YT - 16, 'now', 20, C.mid, 500);
  // on-screen time at which reward i arrives (click 3): the first ones slowly, then faster and faster
  var TA = [], t = 0.3;
  for (i = 0; i <= N; i++) { TA.push(t); t += Math.max(0.018, 0.6 * Math.pow(0.72, i)); }
  var TEND = t, cum1 = [0];
  for (i = 0; i <= N; i++) cum1.push(cum1[i] + Math.pow(G1, i));
  function curve(g, upto) { var p = [], k, m = Math.max(0, Math.min(N, upto)); for (k = 0; k <= Math.floor(m); k++) p.push([X(k), Y(Math.pow(g, k))]); if (m > Math.floor(m)) p.push([X(m), Y(Math.pow(g, m))]); return p.length > 1 ? A.path(p) : ''; }
  /** seconds since click k: -1 before it, a large number once a later click has been made */
  function since(f, k) { return f.step > k ? 1e9 : (f.step === k ? f.ts : -1); }

  var drawn = null;
  return function draw(f) {
    var s3 = since(f, 3), s4 = since(f, 4), s5 = since(f, 5), n = 0, k;
    var key = [s3 < 0 ? 'a' : (s3 > TEND + 1 ? 'c' : s3), s4 < 0 ? 'a' : (s4 > 2 ? 'c' : s4), s5 < 0 ? 'a' : (s5 > 3 ? 'c' : s5)].join('|');
    if (key === drawn) return;               // nothing moves before click 3 or once a click has played out: same picture, skip the work
    drawn = key;
    var a4 = A.ease(A.ramp(s4, 0.2, 0.9)), a5 = A.ramp(s5, 1.5, 2.1);
    // rewards arrive; each drops from 1 to its weight. Click 4 lights up the H1 full rewards of the box and dims the others.
    for (k = 0; k <= N; k++) {
      var age = s3 - TA[k];
      if (age < 0) { bar[k].setAttribute('opacity', 0); ghost[k].setAttribute('opacity', 0); continue; }
      n = k + 1;
      var w = A.lerp(1, Math.pow(G1, k), A.ease(A.ramp(age, 0.12, 0.5)));
      A.set(bar[k], { y: Y(w).toFixed(1), height: (YB - Y(w)).toFixed(1), opacity: 1 });
      ghost[k].setAttribute('opacity', (A.lerp(0.3, k < H1 ? 0.95 : 0.12, a4) * A.ramp(age, 0.12, 0.5)).toFixed(2));
    }
    A.show(now, s3 >= 0 ? 1 : 0);
    var head = n ? (n - 1) + A.ramp(s3, TA[n - 1] + 0.12, TA[n - 1] + 0.5) * (n <= N ? 1 : 0) : 0;
    c1.setAttribute('d', n ? curve(G1, Math.min(N, head)) : '');
    A.show(sum, n ? 1 : 0);
    sum.innerHTML = s4 >= 0.2 ? 'the weights add up to 1 / (1 − 0.95) = 20 full rewards'
                              : (s3 >= TEND + 0.3 ? 'sum of the weights: ' : 'weights so far: ') + K.fix(cum1[n], 1);
    // the effective horizon
    var a1 = A.ramp(s4, 0.9, 1.5);
    A.show(boxEl, a4);
    A.show(h1, a1); A.show(d1, a1); A.show(l1, a1);
    h1.setAttribute('y2', A.lerp(YB, Y(Math.pow(G1, H1)), A.ease(a1)).toFixed(1));
    A.show(e37, a1); A.show(t37, a1);
    e37.setAttribute('x2', A.lerp(X(H1), X(H2), A.ease(a5)).toFixed(1));
    // gamma = 0.99
    c2.setAttribute('d', s5 >= 0 ? curve(G2, A.ease(A.ramp(s5, 0.1, 1.5)) * N) : '');
    A.show(h2, a5); A.show(d2, a5); A.show(l2, A.ramp(s5, 0.8, 1.4));
    h2.setAttribute('y2', A.lerp(YB, Y(Math.pow(G2, H2)), A.ease(a5)).toFixed(1));
  };
});
