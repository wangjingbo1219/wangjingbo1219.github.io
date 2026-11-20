/* Shared by the figures of the slide "The policy sets targets; a PD controller makes the torques" (pd-track, pd-torque).
 *
 * ONE simulated joint: a rigid limb on a hinge, no gravity,  I * q'' = tau.
 *   pd    tau = kp (q_target - q) - kd q'   recomputed at every simulation step (240 Hz) and held during that step
 *   hold  the same law, but tau is recomputed only when the policy steps (30 Hz) and held in between
 * The policy changes q_target 30 times a second. Inside a simulation step the torque is constant, so the motion is an exact
 * parabola: the arrays below are the true trajectory of this system with the stated parameters, nothing is hand-animated.
 * On screen one policy step takes one second (30x slower than real time). */
(function () {
  'use strict';
  var D = Math.PI / 180;
  var P = {
    I: 0.03,            // kg m^2   (about a forearm turning about the elbow)
    kp: 120,            // N m / rad
    kd: 2.7,            // N m s / rad      -> natural frequency 63 rad/s, damping ratio 0.71
    hz: 30,             // policy steps per second
    sub: 8,             // simulation steps per policy step  -> 240 Hz
    tg: [25, 50, 35, 60, 42, 20, 40, 25]      // target angle of each policy step, degrees
  };
  var N = P.tg.length, n = N * P.sub, H = 1 / (P.hz * P.sub);

  function run(hold) {
    var q = new Float64Array(n + 1), v = new Float64Array(n + 1), tau = new Float64Array(n), sp = new Float64Array(n), da = new Float64Array(n);
    var loops = hold ? 1 : 4;                 // pd: keep the last of several loops (the periodic motion); hold: it diverges, start at rest
    var Q = P.tg[0] * D, V = 0, s = 0, d = 0;
    for (var L = 0; L < loops; L++) {
      for (var i = 0; i < n; i++) {
        var qt = P.tg[Math.floor(i / P.sub)] * D;
        if (!hold || i % P.sub === 0) { s = P.kp * (qt - Q); d = -P.kd * V; }
        q[i] = Q; v[i] = V; sp[i] = s; da[i] = d; tau[i] = s + d;
        var a = (s + d) / P.I;
        Q += V * H + 0.5 * a * H * H; V += a * H;
      }
      q[n] = Q; v[n] = V;
    }
    return { q: q, v: v, tau: tau, sp: sp, da: da };
  }

  /** state of a run at loop time u (in policy steps, 0 .. N) */
  function at(R, u) {
    u = Math.max(0, Math.min(N - 1e-9, u));
    var x = u * P.sub, i = Math.floor(x), s = (x - i) * H, a = R.tau[i] / P.I, k = Math.floor(i / P.sub);
    return { q: R.q[i] + R.v[i] * s + 0.5 * a * s * s, v: R.v[i] + a * s, tau: R.tau[i], spring: R.sp[i], damper: R.da[i],
             target: P.tg[k] * D, i: i, k: k, frac: u - k };
  }

  window.PDKit = {
    P: P, N: N, n: n, D: D, pd: run(false), hold: run(true), at: at,
    /** loop time in policy steps: every build step starts the loop again */
    clock: function (f) { return ((f.ts % N) + N) % N; }
  };
})();
