/*! Policy gradient on one joint angle (slide 01_12_pg.py, row 1).
 *  A real, tiny problem computed once at set-up: the policy is N(mu, SG) over the target angle of one joint, the reward
 *  R(a) peaks at a = 0.9 (unknown to the policy). Every iteration: sample N actions, advantage = reward - batch mean
 *  (standardized), and one gradient step  mu += LR * mean[(a - mu) / SG^2 * A].
 *  step 0: the policy only samples.   step >= 1: sample -> score -> shift, iteration after iteration.
 *  From step 1 the reward R(a) itself is drawn as a faint green hill behind the policy: the policy never sees that curve,
 *  only the rewards of the actions it tried, but the audience can see why the samples on the right score better. */
DeckAnim.register('pg-shift', function (el, A) {
  'use strict';
  var K = window.PGKit;
  var X0 = 50, X1 = 850, AMIN = -0.7, AMAX = 1.5, YB = 130, BH = 92, SG = 0.2, N = 12, ITERS = 5, LR = 0.04, STEM = 18;
  function X(a) { return X0 + (a - AMIN) / (AMAX - AMIN) * (X1 - X0); }
  function R(a) { return Math.exp(-0.5 * Math.pow((a - 0.9) / 0.45, 2)); }

  // ---- the training run (deterministic)
  var rnd = A.rand(26), mus = [0.0], batches = [], k, i;
  for (k = 0; k < ITERS; k++) {
    var mu = mus[k], as = [], rs = [], m = 0;
    for (i = 0; i < N; i++) { var a = mu + SG * A.gauss(rnd); as.push(a); rs.push(R(a)); m += R(a) / N; }
    var sd = 0; for (i = 0; i < N; i++) sd += Math.pow(rs[i] - m, 2) / N; sd = Math.sqrt(sd) || 1;
    var adv = rs.map(function (r) { return (r - m) / sd; });
    var g = 0; for (i = 0; i < N; i++) g += (as[i] - mu) / (SG * SG) * adv[i] / N;
    mus.push(mu + LR * g);
    batches.push({ a: as, adv: adv });
  }
  // three more batches from the untrained policy, for step 0 (sampling only)
  var r0 = A.rand(17), idle = [];          // a seed without a 3-sigma outlier (a lone dot at the foot of the bell reads as a glitch)
  for (k = 0; k < 3; k++) { var b = []; for (i = 0; i < N; i++) b.push(SG * A.gauss(r0)); idle.push(b); }

  // ---- nodes
  // the reward of every action (the hill the policy climbs), fading out at the right end of the axis
  var RH = 76, AEND = 1.6, hp = [], ah;
  for (ah = AMIN - 0.04; ah <= AEND + 1e-6; ah += 0.02) hp.push([X(ah), YB - RH * R(ah)]);
  var defs = A.el('defs', null, el);
  function fadeGrad(id, o) {
    var gr = A.el('linearGradient', { id: id, gradientUnits: 'userSpaceOnUse', x1: X(1.36), y1: 0, x2: X(AEND), y2: 0 }, defs);
    A.el('stop', { offset: 0, 'stop-color': A.C.g, 'stop-opacity': o }, gr);
    A.el('stop', { offset: 1, 'stop-color': A.C.g, 'stop-opacity': 0 }, gr);
    return 'url(#' + id + ')';
  }
  var hill = A.el('g', null, el);
  A.el('path', { d: A.path(hp) + 'L' + X(AEND).toFixed(1) + ' ' + YB + ' L' + X(AMIN - 0.04).toFixed(1) + ' ' + YB + ' Z', fill: fadeGrad('pg-shift-hill-f', 0.15), stroke: 'none' }, hill);
  A.el('path', { d: A.path(hp), fill: 'none', stroke: fadeGrad('pg-shift-hill-s', 0.55), 'stroke-width': 2 }, hill);
  A.text(hill, 748, 60, 'reward', { size: 20, fill: A.C.g });
  A.el('line', { x1: 40, y1: YB, x2: 860, y2: YB, stroke: A.C.line, 'stroke-width': 2 }, el);
  var ghost = A.el('path', { fill: 'none', stroke: A.C.mute, 'stroke-width': 3, 'stroke-dasharray': '5 8', 'stroke-linecap': 'round' }, el);
  var area = A.el('path', { fill: '#ffffff', 'fill-opacity': 0.06, stroke: 'none' }, el);
  var bell = A.el('path', { fill: 'none', stroke: A.C.white, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  var mid = A.el('line', { stroke: A.C.white, 'stroke-width': 2, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round' }, el);
  var arrow = A.el('path', { fill: 'none', stroke: A.C.g, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var stems = [], dots = [];
  for (i = 0; i < N; i++) stems.push(A.el('line', { 'stroke-width': 4, 'stroke-linecap': 'round' }, el));
  for (i = 0; i < N; i++) dots.push(A.el('circle', { r: 6.5, stroke: '#101010', 'stroke-width': 2 }, el));
  A.el('text', { x: 50, y: 196, style: 'font:500 20px ' + A.FONT + ';fill:' + A.C.mid, text: 'target angle of one joint' }, el);
  var caps = [
    A.text(el, 850, 196, 'the policy samples actions', { size: 21, anchor: 'end' }),
    A.text(el, 850, 196, '1 · sample actions', { size: 21, anchor: 'end' }),
    A.text(el, 850, 196, '', { size: 21, anchor: 'end' }),
    A.text(el, 850, 196, '3 · shift the policy toward the better ones', { size: 21, anchor: 'end', fill: A.C.g }),
    A.text(el, 850, 196, 'repeat: the policy climbs to the best action', { size: 21, anchor: 'end', fill: A.C.g })
  ];
  A.set(caps[2], { html: '2 · score them (' + String.fromCharCode(0x2009) + K.mi('Â') + '): ' + K.col('better', A.C.g) + ' or ' + K.col('worse', A.C.amber) + ' than expected' });

  function setBell(muNow, o) {
    A.set(bell, { d: K.bell(X, YB, BH, muNow, SG, muNow - 3.2 * SG, muNow + 3.2 * SG) });
    A.set(area, { d: K.bell(X, YB, BH, muNow, SG, muNow - 3.2 * SG, muNow + 3.2 * SG, true) });
    A.set(mid, { x1: X(muNow), y1: YB - BH + 6, x2: X(muNow), y2: YB - 2 });
    A.show(bell, o); A.show(area, o); A.show(mid, o);
  }
  function cap(n, o) { for (var j = 0; j < caps.length; j++) A.show(caps[j], j === n ? o : 0); }
  function hideDots() { for (var j = 0; j < N; j++) { A.show(dots[j], 0); A.show(stems[j], 0); } }

  // step 0: sample, hold, fade; a new batch every 3.4 s
  function idleFrame(t) {
    var P = 3.4, n = Math.floor(t / P) % idle.length, u = A.loop(t, P), off = idle[n];
    setBell(mus[0], 1); A.show(ghost, 0); A.show(arrow, 0); cap(0, 1);
    var fade = 1 - A.ramp(u, 2.9, 3.3);
    for (var j = 0; j < N; j++) {
      var a = mus[0] + off[j], d = A.ease(A.ramp(u, 0.15 + j * 0.1, 0.5 + j * 0.1)), top = YB - BH * K.g(off[j] / SG);
      A.set(dots[j], { cx: X(a), cy: A.lerp(top, YB, d), fill: '#fff' });
      A.show(dots[j], (u > 0.15 + j * 0.1 ? 1 : 0) * fade); A.show(stems[j], 0);
    }
  }

  // step >= 1: the training run. First iteration slow, the rest faster.
  var D = [4.8, 3.2, 3.2, 3.2, 3.2], HOLD = 2.2, TOT = HOLD;
  for (k = 0; k < ITERS; k++) TOT += D[k];
  function trainFrame(tRaw) {
    var t = A.loop(tRaw, TOT);
    var it = 0, acc = 0;
    while (it < ITERS && t >= acc + D[it]) { acc += D[it]; it++; }
    if (it >= ITERS) {                     // arrived: hold, then fade back to the start
      var h = t - acc, o = 1 - A.ramp(h, HOLD - 0.5, HOLD - 0.05);
      setBell(mus[ITERS], o); A.show(ghost, 0); A.show(arrow, 0); hideDots(); cap(4, o);
      return;
    }
    var u = (t - acc) / D[it], bt = batches[it], mu0 = mus[it], mu1 = mus[it + 1];
    var pS = A.ramp(u, 0.02, 0.30), pA = A.ease(A.ramp(u, 0.34, 0.52)), pM = A.ease(A.ramp(u, 0.62, 0.88)), pF = 1 - A.ramp(u, 0.93, 0.99);
    var muNow = A.lerp(mu0, mu1, pM);
    setBell(muNow, (it === 0 && tRaw >= TOT) ? A.ramp(t, 0, 0.4) : 1);      // fades in only when the run starts over, not at the click
    A.set(ghost, { d: K.bell(X, YB, BH, mu0, SG, mu0 - 3.2 * SG, mu0 + 3.2 * SG) });
    A.show(ghost, pM > 0 ? pF : 0);
    var xa = X(mu0), xb = X(muNow), ya = YB - BH - 14;
    A.set(arrow, { d: 'M' + xa.toFixed(1) + ' ' + ya + ' L' + xb.toFixed(1) + ' ' + ya + ' ' + K.head(xb, ya, 1, 0, 11) });
    A.show(arrow, xb - xa > 14 ? pF : 0);
    for (var j = 0; j < N; j++) {
      var s0 = j / N * 0.72, d = A.ease(A.ramp(pS, s0, s0 + 0.28)), top = YB - BH * K.g((bt.a[j] - mu0) / SG), x = X(bt.a[j]);
      var good = bt.adv[j] > 0, c = pA > 0.02 ? (good ? A.C.g : A.C.amber) : '#fff', yd = YB - STEM * bt.adv[j] * pA;
      A.set(dots[j], { cx: x, cy: d < 1 ? A.lerp(top, YB, d) : yd, fill: c });
      A.set(stems[j], { x1: x, y1: YB, x2: x, y2: yd, stroke: c });
      A.show(dots[j], (pS > s0 ? 1 : 0) * pF); A.show(stems[j], pA > 0.02 ? pF : 0);
    }
    cap(u < 0.32 ? 1 : (u < 0.60 ? 2 : 3), 1);
  }

  var STILL = 4.8 + 3.2 * 0.9;            // second iteration, shifted: ghost, arrow, scored samples
  return function draw(f) {
    A.show(hill, f.step < 1 ? 0 : (f.step === 1 ? A.ramp(f.ts, 0.1, 0.9) : 1));
    if (f.step < 1) return idleFrame(f.ts);
    trainFrame((f.step === 1 || f.step >= f.steps) ? f.ts : STILL);
  };
});
