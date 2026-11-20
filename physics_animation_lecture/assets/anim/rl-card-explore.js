/* "Stochastic on purpose" card (506 x 130): what the policy of the standing task sends to ONE joint, the right ankle.
 * Real data (window.RLDemo): green line = the mean the network outputs at every step, amber dots = the PD targets actually sampled
 * around it (sigma = 0.1 rad), band = +- sigma. Then the same policy from the same start, acting with its mean: no noise, higher reward.
 * Right: the body in that rollout, and the mean reward per step so far. Real time (30 steps per second), 3 s per phase. */
DeckAnim.register('rl-card-explore', function (el, A) {
  var K = window.RLKit, D = window.RLDemo, C = A.C;
  var TR = D.episodes[2], TE = D.episodes[3], N = D.nshow, SG = D.sigma;
  var X0 = 4, DX = 3.4, YZ = 64, PR = 92;                        // plot: x of step 0, px per step, y of 0 rad, px per rad
  var X = function (j) { return X0 + j * DX; }, Y = function (v) { return YZ - v * PR; };
  var i;
  var head = K.text(el, 0, 18, '', 20, '#fff', 700);
  A.el('line', { x1: 0, y1: YZ, x2: 312, y2: YZ, stroke: C.line, 'stroke-width': 2, 'stroke-dasharray': '2 6' }, el);
  var band = A.el('path', { fill: C.amber, opacity: 0.16 }, el);
  var line = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  var dots = [];
  for (i = 0; i < N; i++) dots.push(A.el('circle', { r: 3.2, fill: C.amber }, el));
  K.text(el, 0, 127, 'PD target of the right ankle, 3 s', 20, C.mid, 500);
  // the body and the reward
  var FX = 392, FY = 126, SC = 62;
  A.el('line', { x1: 352, y1: FY + 1, x2: 438, y2: FY + 1, stroke: C.line, 'stroke-width': 2, 'stroke-linecap': 'round' }, el);
  var body = K.stick(el);
  K.text(el, 506, 44, 'mean', 20, C.mid, 500, 'end');
  K.text(el, 506, 66, 'reward', 20, C.mid, 500, 'end');
  var rnum = K.text(el, 506, 98, '', 28, C.gbr, 700, 'end');
  var cumR = [TR, TE].map(function (e) { var c = [0], s = 0; e.r.forEach(function (r) { s += r; c.push(s); }); return c; });

  return function draw(f) {
    var t = A.loop(f.step === 2 ? f.ts : f.t, 10), test = t >= 4.6, tp = test ? t - 4.6 : t;
    var E = test ? TE : TR, n = A.clamp(Math.floor(tp * 30) + 1, 1, N), sim = A.clamp(tp * 30, 0, N), j, up = [], lo = [], mid = [];
    head.innerHTML = test ? 'Test: action = the mean ' + K.mi('μ') + '(' + K.mi('s') + ')'
                          : 'Training: action = mean + <tspan style="fill:' + C.amber + '">noise</tspan>, ' + K.mi('σ') + ' = ' + SG + ' rad';
    for (j = 0; j < n; j++) { mid.push([X(j), Y(E.mu[j])]); up.push([X(j), Y(E.mu[j] + SG)]); lo.push([X(j), Y(E.mu[j] - SG)]); }
    line.setAttribute('d', A.path(mid));
    A.show(band, test ? 0 : 0.16);
    if (!test) band.setAttribute('d', A.path(up) + A.path(lo.reverse()).replace('M', 'L') + 'Z');
    for (j = 0; j < N; j++) {                     // at test time the training samples stay as a faint cloud, for comparison
      if (!test && j >= n) { dots[j].setAttribute('opacity', 0); continue; }
      A.set(dots[j], { cx: X(j).toFixed(1), cy: Y(TR.act[j]).toFixed(1), opacity: test ? 0.22 : 1 });
    }
    body(K.pose(test ? 3 : 2, sim), FX, FY, SC, 0);
    rnum.textContent = K.fix(cumR[test ? 1 : 0][n] / n, 2);
  };
});
