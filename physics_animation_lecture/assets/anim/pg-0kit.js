/*! Shared helpers for the policy-gradient / PPO figures (slides 01_12_pg.py and 01_13_ppo.py). No figure is registered here.
 *  Loaded before the pg-*.js figures (file-name order); they read window.PGKit at set-up time. */
window.PGKit = (function () {
  'use strict';
  var MATH = "KaTeX_Math, 'Times New Roman', serif";
  var K = {
    /** italic math symbol inside an SVG <text> (use with A.set(node, {html: ...})) */
    mi: function (s) { return '<tspan style="font-family:' + MATH + ';font-style:italic;font-weight:400;font-size:1.16em">' + s + '</tspan>'; },
    /** subscript after a symbol */
    sub: function (s) { return '<tspan dy="5" style="font-family:' + MATH + ';font-style:italic;font-weight:400;font-size:.82em">' + s + '</tspan><tspan dy="-5">​</tspan>'; },
    /** coloured run of text */
    col: function (s, c) { return '<tspan style="fill:' + c + '">' + s + '</tspan>'; },
    /** set a node's markup only when it changed (draw() runs every frame) */
    html: function (n, s) { if (n._pgs !== s) { n._pgs = s; n.innerHTML = s; } },
    /** exp(-z^2 / 2): a Gaussian with peak 1 */
    g: function (z) { return Math.exp(-0.5 * z * z); },
    /** SVG path of a bell curve. X(a): action -> px; yb: baseline px; h: peak height px */
    bell: function (X, yb, h, mu, sg, a0, a1, close) {
      var s = '', n = 90;
      for (var i = 0; i <= n; i++) {
        var a = a0 + (a1 - a0) * i / n;
        s += (i ? 'L' : 'M') + X(a).toFixed(1) + ' ' + (yb - h * K.g((a - mu) / sg)).toFixed(1) + ' ';
      }
      return close ? s + 'L' + X(a1).toFixed(1) + ' ' + yb + ' L' + X(a0).toFixed(1) + ' ' + yb + ' Z' : s;
    },
    /** number with a real minus sign */
    fmt: function (v, d) { return v.toFixed(d).replace('-', '−'); },
    /** 1,234 */
    int: function (v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); },
    /** arrow head path at (x, y) pointing along (dx, dy), size s */
    head: function (x, y, dx, dy, s) {
      var l = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / l, uy = dy / l, px = -uy, py = ux;
      return 'M' + (x - ux * s + px * s * 0.62).toFixed(1) + ' ' + (y - uy * s + py * s * 0.62).toFixed(1) + ' L' + x.toFixed(1) + ' ' + y.toFixed(1) +
             ' L' + (x - ux * s - px * s * 0.62).toFixed(1) + ' ' + (y - uy * s - py * s * 0.62).toFixed(1);
    },

    /* ---- the PPO ratio example of "PPO in pictures": one joint, old policy N(MU, SG), sampled action ACT ---- */
    MU: 0.35, SG: 0.22, ACT: 0.60, EPS: 0.2,
    /** rho = pi_new(ACT) / pi_old(ACT) when the new mean sits d standard deviations to the right of the old one */
    rho: function (d) { var d0 = (K.ACT - K.MU) / K.SG; return Math.exp((2 * d0 * d - d * d) / 2); },
    /** PPO's clipped objective for one sample: min(rho A, clip(rho, 1 - eps, 1 + eps) A) */
    obj: function (rho, adv) { return Math.min(rho * adv, Math.max(1 - K.EPS, Math.min(1 + K.EPS, rho)) * adv); },
    /** piecewise-eased path through key frames [[t, value], ...], looping with the last key's time as period */
    keys: function (t, ks) {
      var T = ks[ks.length - 1][0];
      t = ((t % T) + T) % T;
      for (var i = 1; i < ks.length; i++) {
        if (t <= ks[i][0]) {
          var u = (t - ks[i - 1][0]) / Math.max(1e-6, ks[i][0] - ks[i - 1][0]);
          u = u * u * (3 - 2 * u);
          return ks[i - 1][1] + (ks[i][1] - ks[i - 1][1]) * u;
        }
      }
      return ks[ks.length - 1][1];
    }
  };
  var D0 = (K.ACT - K.MU) / K.SG;                 // 1.136 sigma: rho peaks at exp(D0^2 / 2) = 1.91 when the new mean reaches the action
  var DLO = D0 - Math.sqrt(D0 * D0 + 2 * Math.log(1 / 0.3));     // rho = 0.30
  /** where the new mean is (in sigma, relative to the old one) for build step `step`, ts seconds after the click */
  K.sweep = function (step, ts) {
    var t = Math.max(0, ts - 1.6);                 // steps 1 and 2 first draw their curve; then the policy starts to move
    if (step === 1) return K.keys(t, [[0, 0], [3.0, D0], [4.4, D0], [7.0, -0.45], [7.8, -0.45], [9.6, 0]]);          // good action: up to the flat part, then back
    if (step === 2) return K.keys(t, [[0, 0], [2.6, DLO], [3.8, DLO], [7.4, D0], [8.8, D0], [10.6, 0]]);             // bad action: down to the flat part, then up into the penalty
    return K.keys(ts, [[0, 0], [2.6, D0], [3.4, D0], [6.8, DLO], [7.6, DLO], [9.6, 0]]);
  };
  return K;
})();
