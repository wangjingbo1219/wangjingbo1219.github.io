/* Shared pieces of the reward figures (slides 01_14_rewards.py, 01_15_supervision.py).
 * RW.TERMS  the four DeepMimic tracking terms (Peng et al. 2018, section 5.3): weight w, kernel scale k in exp(-k * E), E = summed squared error
 * RW.at(t)  the simulated tracking example (window.RW_TRACK, made by tools/fig/rw_track_sim.py) sampled at time t of its loop
 */
(function () {
  'use strict';
  var RW = window.RW = {};
  // xmax: right end of the kernel plot (in the unit of the formula: rad, rad/s, m); xlab / fmt: the same quantity in the unit the audience reads
  var DEG = function (e) { return Math.round(e * 180 / Math.PI) + '°'; }, CM = function (e) { return Math.round(e * 100) + ' cm'; };
  RW.TERMS = [
    { key: 'pose', name: 'Pose', w: 0.65, k: 2, col: '#ffffff', xmax: Math.PI / 2, xlab: '90°', half: '34°', fmt: DEG },
    { key: 'vel', name: 'Velocity', w: 0.10, k: 0.1, col: '#c58cff', xmax: 6, xlab: '6 rad/s', half: '2.6 rad/s', fmt: function (e) { return e.toFixed(1) + ' rad/s'; } },
    { key: 'ee', name: 'End-effectors', w: 0.15, k: 40, col: '#f5b301', xmax: 0.6, xlab: '60 cm', half: '13 cm', fmt: CM },
    { key: 'com', name: 'Centre of mass', w: 0.10, k: 10, col: '#4fc3f7', xmax: 0.6, xlab: '60 cm', half: '26 cm', fmt: CM }
  ];
  /** frame pair and blend for time t (seconds) of the loop */
  RW.at = function (t) {
    var D = window.RW_TRACK, x = (((t % D.T) + D.T) % D.T) * D.fps, i0 = Math.floor(x) % D.n;
    return { i0: i0, i1: (i0 + 1) % D.n, u: x - Math.floor(x) };
  };
  /** summed squared errors [pose, vel, ee, com] at time t */
  RW.E = function (t) {
    var D = window.RW_TRACK, p = RW.at(t), a = D.E[p.i0], b = D.E[p.i1], o = [];
    for (var k = 0; k < 4; k++) o.push(a[k] + (b[k] - a[k]) * p.u);
    return o;
  };
  /** the four kernel values exp(-k E) and the weighted sum, at time t */
  RW.r = function (t) {
    var E = RW.E(t), o = [], s = 0;
    for (var k = 0; k < 4; k++) { o.push(Math.exp(-RW.TERMS[k].k * E[k])); s += RW.TERMS[k].w * o[k]; }
    o.sum = s; o.E = E;
    return o;
  };
  /** the same for frame i (no blending) */
  RW.rf = function (i) {
    var E = window.RW_TRACK.E[i], o = [], s = 0;
    for (var k = 0; k < 4; k++) { o.push(Math.exp(-RW.TERMS[k].k * E[k])); s += RW.TERMS[k].w * o[k]; }
    o.sum = s;
    return o;
  };
  /** arrow head path at (x, y) pointing along angle a (rad), size s */
  RW.head = function (x, y, a, s) {
    var c = Math.cos(a), n = Math.sin(a), bx = x - s * c, by = y - s * n;
    return 'M' + (bx - 0.6 * s * n).toFixed(1) + ' ' + (by + 0.6 * s * c).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) +
      'L' + (bx + 0.6 * s * n).toFixed(1) + ' ' + (by - 0.6 * s * c).toFixed(1);
  };
})();
