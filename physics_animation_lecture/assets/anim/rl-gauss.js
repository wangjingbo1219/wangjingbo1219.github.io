/* "The policy and the return, in pictures", left panel (804 x 380): the Gaussian policy for ONE joint.
 * Chart: the action distribution N(mu(s), sigma^2) over the PD target angle. At every policy step one target is sampled: a dot leaves the
 * curve and drops onto the axis. Right: a forearm on a PD-driven elbow chases each sampled target (amber = target, white = joint).
 * The joint is really integrated: inertia 0.05 kg m2, kp = 200 N m/rad, kd = 20 N m s/rad (the elbow gains of the standing example),
 * 1200 Hz, a new target 30 times a second. (Overdamped: the slow time constant is about 0.1 s, three policy steps, so the joint chases each
 * target but never reaches it before the next one arrives.)
 *   step 0   fixed mean, sigma = 0.15 rad: the first samples in slow motion, then real time; the dots pile up into the bell
 *   step 1   the mean moves, the bell and the samples follow
 *   step 2   sigma = 0.1, then 0.3, then test time (no noise), 3 s each, starting at the click
 *   step 3+  the same cycle goes on while the right panel is explained
 * From click 1 on everything is a function of the slide clock: the mean is a prescribed swing, 0.5 + 0.45 sin(2 pi t / 3) rad, standing in for a
 * network output; policy step j (= floor(30 t)) draws its noise from a hash of j; the joint angle is integrated from 1.2 s back at every frame
 * (twelve time constants, so the start value does not matter). So the mean, the samples and the joint do not jump when a click changes sigma. */
DeckAnim.register('rl-gauss', function (el, A) {
  var K = window.RLKit, C = A.C;
  var XL = 70, XR = 520, YB = 300, A0 = -0.6, A1 = 1.6, PXR = (XR - XL) / (A1 - A0), DEN = 57.6;      // px per rad, px per unit of density
  var X = function (a) { return XL + (A.clamp(a, A0, A1) - A0) * PXR; };
  var pdf = function (a, mu, sg) { var z = (a - mu) / sg; return Math.exp(-0.5 * z * z) / (sg * 2.5066282746); };
  var HZ = 30, SUB = 40, DT = 1 / (HZ * SUB), INERTIA = 0.05, KP = 200, KD = 20, MU0 = 0.5, SG0 = 0.15, BACK = 36;
  var i, j, k;

  // ---- step 0: one fixed scenario. On-screen duration of each sample, its start time, and its slot in the pile (bins of 0.05 rad, 10 px per dot;
  //      DEN is chosen so that the pile of all 115 dots has the height of the bell)
  var N0 = 115, S0 = (function () {
    var r = A.rand(11), a = [], th = MU0, om = 0, q = new Float32Array(N0 * SUB + 1), loop;
    for (j = 0; j < N0; j++) a.push(MU0 + SG0 * A.gauss(r));
    for (loop = 0; loop < 2; loop++) for (j = 0; j < N0; j++) for (k = 0; k < SUB; k++) {      // two passes: the second starts where the first ended
      if (loop) q[j * SUB + k] = th;
      om += DT * (KP * (a[j] - th) - KD * om) / INERTIA; th += DT * om;
    }
    q[N0 * SUB] = th;
    return { a: a, q: q };
  })();
  var SLOW = [1.0, 1.0, 0.9, 0.7, 0.5, 0.35, 0.22, 0.14, 0.09, 0.06, 0.045], T0 = [], D0 = [], REST0 = [], cnt = {}, t = 0;
  for (j = 0; j < N0; j++) {
    var d = j < SLOW.length ? SLOW[j] : 1 / HZ, b = Math.floor((S0.a[j] - A0) / 0.05);
    T0.push(t); D0.push(d); t += d;
    cnt[b] = (cnt[b] || 0) + 1;
    REST0.push([X(A0 + (b + 0.5) * 0.05), YB - 5 - (cnt[b] - 1) * 10]);
  }
  var RUN0 = t, PERIOD0 = RUN0 + 2.2;
  /** where scenario 0 is at time tt of its loop: sample index, policy time (steps / HZ), the joint angle, and whether the run is over */
  function at0(tt) {
    var jc, tau, over = tt >= RUN0;
    if (over) { jc = N0 - 1; tau = N0 / HZ; }
    else { jc = 0; while (jc + 1 < N0 && T0[jc + 1] <= tt) jc++; tau = (jc + (tt - T0[jc]) / D0[jc]) / HZ; }
    var x = A.clamp(tau * HZ * SUB, 0, N0 * SUB - 1e-6), n = Math.floor(x);
    return { jc: jc, over: over, th: S0.q[n] + (S0.q[n + 1] - S0.q[n]) * (x - n) };
  }

  // ---- from click 1 on: mean, sigma and noise as functions of the slide clock
  function eps(n) { return A.gauss(A.rand(n * 7919 + 101)); }                 // the noise of policy step n: a hash, the same at every frame
  function cycle(s) {                                                           // 3 s of each setting, blended over the last 0.4 s
    var v = [0.1, 0.3, 0], m = Math.floor(s / 3), n = ((m % 3) + 3) % 3, u = A.ease(A.ramp(s - 3 * m, 2.6, 3));
    return A.lerp(v[n], v[(n + 1) % 3], u);
  }
  function world(f) {
    var tc = f.t - f.ts, st = f.step;                                           // tc: the slide time of the last click
    return {
      tc: tc,
      mu: function (tau) { return MU0 + (st >= 2 ? 1 : A.ease(A.ramp(tau - tc, 0, 1.5))) * 0.45 * Math.sin(2 * Math.PI * tau / 3); },
      sg: st === 1 ? function () { return SG0; }
        : st === 2 ? function (tau) { var s = tau - tc; return s < 0 ? SG0 : (s < 0.4 ? A.lerp(SG0, 0.1, A.ease(s / 0.4)) : cycle(s)); }
        : cycle,
      since: (st === 1 || st === 3) ? tc : -1e9                                 // samples drawn before these clicks belong to another setting: not shown
    };
  }
  function action(W, n) { return W.mu(n / HZ) + W.sg(n / HZ) * eps(n); }
  function joint(W, T) {                                                        // the PD joint at slide time T, integrated from BACK policy steps earlier
    var n1 = Math.floor(T * HZ), n, th = W.mu((n1 - BACK) / HZ), om = 0, a, m, rest;
    for (n = n1 - BACK; n <= n1; n++) {
      a = action(W, n);
      rest = n < n1 ? SUB : (T * HZ - n1) * SUB; m = Math.floor(rest);
      for (k = 0; k < m; k++) { om += DT * (KP * (a - th) - KD * om) / INERTIA; th += DT * om; }
      if (n === n1) { var h = (rest - m) * DT; om += h * (KP * (a - th) - KD * om) / INERTIA; th += h * om; }
    }
    return th;
  }

  // ---- static parts: axes, labels
  A.el('path', { d: 'M' + XL + ' 44 V' + YB + ' H' + XR, fill: 'none', stroke: C.line, 'stroke-width': 2 }, el);
  [-0.5, 0, 0.5, 1, 1.5].forEach(function (v) {
    A.el('line', { x1: X(v), y1: YB, x2: X(v), y2: YB + 7, stroke: C.line, 'stroke-width': 2 }, el);
    K.text(el, X(v), YB + 30, K.fix(v, v % 1 ? 1 : 0), 20, C.mid, 500, 'middle');
  });
  K.text(el, (XL + XR) / 2, 364, 'PD target angle for one joint (rad)', 21, C.mid, 700, 'middle');
  var yl = K.text(el, 0, 0, 'probability density', 21, C.mid, 700, 'middle');
  yl.setAttribute('transform', 'translate(34 ' + (44 + YB) / 2 + ') rotate(-90)');
  var pace = K.text(el, XL + 2, 24, '', 21, C.mid, 500);
  var meanLine = A.el('line', { stroke: C.g, 'stroke-width': 3, 'stroke-dasharray': '3 8', 'stroke-linecap': 'round' }, el);
  var bell = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  var sgBar = A.el('line', { stroke: '#fff', 'stroke-width': 3 }, el);
  var NREC = 40, pile = [], rec = [];
  for (i = 0; i < N0; i++) pile.push(A.el('circle', { r: 4.4, fill: C.amber, opacity: 0 }, el));
  for (i = 0; i < NREC; i++) rec.push(A.el('circle', { r: 4.4, fill: C.amber, opacity: 0 }, el));
  var muLab = A.text(el, 0, 0, '', { size: 21, fill: C.g });
  muLab.innerHTML = K.mi('μ') + '(' + K.mi('s') + '): the network output';
  var sgLab = A.text(el, 0, 0, '', { size: 21, fill: '#fff' });
  // ---- the joint
  var SX = 688, SY = 34, EY = 140, FL = 118;
  A.el('line', { x1: SX, y1: EY, x2: SX, y2: EY + FL + 14, stroke: C.line, 'stroke-width': 2, 'stroke-dasharray': '2 7' }, el);          // zero angle
  A.el('line', { x1: SX, y1: SY, x2: SX, y2: EY, stroke: '#62676e', 'stroke-width': 20, 'stroke-linecap': 'round' }, el);                 // upper arm
  A.el('circle', { cx: SX, cy: SY, r: 13, fill: '#62676e' }, el);
  var muArm = A.el('line', { x1: SX, y1: EY, stroke: C.g, 'stroke-width': 3, 'stroke-dasharray': '3 8', 'stroke-linecap': 'round' }, el);
  var tgArm = A.el('line', { x1: SX, y1: EY, stroke: C.amber, 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var fore = A.el('line', { x1: SX, y1: EY, stroke: '#e9ecef', 'stroke-width': 16, 'stroke-linecap': 'round' }, el);
  var hand = A.el('circle', { r: 11, fill: '#e9ecef' }, el);
  A.el('circle', { cx: SX, cy: EY, r: 6, fill: '#101010' }, el);
  var tgDot = A.el('circle', { r: 7, fill: C.amber, stroke: '#101010', 'stroke-width': 2.5 }, el);
  var tgTxt = K.text(el, 578, 316, '', 22, C.amber, 700), jtTxt = K.text(el, 578, 346, '', 22, '#fff', 700);
  K.text(el, 578, 374, 'elbow, PD-controlled', 20, C.mid, 500);
  function tip(th, L) { return [SX + L * Math.sin(th), EY + L * Math.cos(th)]; }

  /** the dots of scenario 0 at time tt of its loop, times an extra opacity */
  function drawPile(tt, alpha) {
    var s = at0(tt), fade = s.over ? 1 - A.ramp(tt, PERIOD0 - 0.5, PERIOD0) : 1;
    for (k = 0; k < N0; k++) {
      if (k > s.jc || alpha * fade <= 0) { pile[k].setAttribute('opacity', 0); continue; }
      var fall = A.clamp(D0[k] * 0.55, 0.22, 0.5), p = A.clamp((tt - T0[k]) / fall, 0, 1), y0 = YB - pdf(S0.a[k], MU0, SG0) * DEN, x0 = X(S0.a[k]);
      A.set(pile[k], { cx: A.lerp(x0, REST0[k][0], p).toFixed(1), cy: A.lerp(y0, REST0[k][1], p * p).toFixed(1), opacity: (alpha * fade).toFixed(2) });
    }
    return s;
  }

  return function draw(f) {
    var mu, sg, th, tg, text;
    if (f.step === 0) {                                     // slow, then real time; the dots stay where they land
      var tt = A.loop(f.t, PERIOD0), s0 = drawPile(tt, 1);
      for (k = 0; k < NREC; k++) rec[k].setAttribute('opacity', 0);
      mu = MU0; sg = SG0; th = s0.th; tg = S0.a[s0.jc];
      text = s0.over ? 'the samples pile up into the bell' : (D0[s0.jc] > 0.05 ? 'slow motion: one sample per policy step' : 'real time: 30 samples per second');
    } else {                                                // real time on the slide clock; the dots fade after landing
      var W = world(f), T = f.t, n1 = Math.floor(T * HZ);
      for (k = 0; k < NREC; k++) {                            // node k shows the sample drawn k policy steps ago
        var n = n1 - k, tj = n / HZ, age = T - tj, sj = W.sg(tj), a;
        if (age > 1.2 || sj < 0.04 || tj < W.since) { rec[k].setAttribute('opacity', 0); continue; }
        a = action(W, n);
        var q = A.clamp(age / 0.25, 0, 1);
        A.set(rec[k], { cx: X(a).toFixed(1), cy: A.lerp(YB - pdf(a, W.mu(tj), sj) * DEN, YB - 5, q * q).toFixed(1), opacity: (1 - A.ramp(age, 0.45, 1.2)).toFixed(2) });
      }
      mu = W.mu(T); sg = W.sg(T); th = joint(W, T); tg = action(W, n1);
      if (f.step === 1) {                                     // the pile of step 0 fades out, its joint hands over to the running one
        var was = drawPile(A.loop(W.tc, PERIOD0), 1 - A.ramp(f.ts, 0, 0.6));
        th = A.lerp(was.th, th, A.ease(A.ramp(f.ts, 0, 0.35)));
      } else for (k = 0; k < N0; k++) pile[k].setAttribute('opacity', 0);
      var sc = f.step === 2 ? f.ts : T, seg = ((Math.floor(sc / 3) % 3) + 3) % 3;
      text = f.step === 1 ? 'real time: the mean moves, the samples follow'
                          : ['small noise: cautious, smooth', 'large noise: explores more, shakes more', 'test time: no noise, act with the mean'][seg];
    }
    pace.textContent = text;
    // the bell, its mean and its width
    var xm = X(mu), on = A.ramp(sg, 0.07, 0.095), pk = on ? pdf(mu, mu, sg) * DEN : 0, pts = [];
    if (on) for (k = 0; k <= 150; k++) { var av = A0 + (A1 - A0) * k / 150; pts.push([X(av), Math.max(46, YB - pdf(av, mu, sg) * DEN)]); }
    A.show(bell, on); if (on) bell.setAttribute('d', A.path(pts));
    A.set(meanLine, { x1: xm.toFixed(1), y1: YB, x2: xm.toFixed(1), y2: 46, 'stroke-dasharray': on > 0.5 ? '3 8' : 'none', 'stroke-width': on > 0.5 ? 3 : 5 });
    A.set(muLab, { x: (xm + 12).toFixed(1), y: 66 });                         // both labels stay on the right of the mean: no flipping while it swings
    A.show(sgBar, on); A.show(sgLab, on);
    if (on) {
      var ys = YB - 0.6065 * pk, xs = X(mu + sg);                               // the bell is exp(-1/2) = 0.6065 of its peak at one sigma
      A.set(sgBar, { x1: xm.toFixed(1), y1: ys.toFixed(1), x2: xs.toFixed(1), y2: ys.toFixed(1) });
      A.set(sgLab, { x: (xs + 14).toFixed(1), y: (ys + 7).toFixed(1) });
      sgLab.innerHTML = K.mi('σ') + ' = ' + K.fix(sg, 2) + ' rad';
    }
    // the joint chases the target that was sampled last
    var pt = tip(th, FL), pg = tip(tg, FL + 16), pm = tip(mu, FL + 16);
    A.set(fore, { x2: pt[0].toFixed(1), y2: pt[1].toFixed(1) }); A.set(hand, { cx: pt[0].toFixed(1), cy: pt[1].toFixed(1) });
    A.set(tgArm, { x2: pg[0].toFixed(1), y2: pg[1].toFixed(1) }); A.set(tgDot, { cx: pg[0].toFixed(1), cy: pg[1].toFixed(1) });
    A.set(muArm, { x2: pm[0].toFixed(1), y2: pm[1].toFixed(1) });
    tgTxt.textContent = 'target ' + K.fix(tg, 2) + ' rad';
    jtTxt.textContent = 'joint ' + K.fix(th, 2) + ' rad';
  };
});
