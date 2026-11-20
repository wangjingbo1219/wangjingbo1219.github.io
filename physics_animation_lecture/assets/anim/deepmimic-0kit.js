/* DeepMimic slides (tools/slides/02_20_deepmimic.py): a SCHEMATIC stick figure in profile, shared by the figures
 * deepmimic-phase and deepmimic-episodes.
 *   DeepMimicKit.fig(parent, colour, width)   -> { g, set(pose, x, groundY, scale) }      one figure; set() only rewrites two paths and a circle
 *   DeepMimicKit.run(u)                       pose of a run cycle at phase u (one cycle = two steps)
 *   DeepMimicKit.flip(u)                      pose of a backflip at phase u in [0, 1]: stand, arms forward, crouch, take-off, tuck in the air, landing, stand
 * The poses are drawn by hand so that the motion can be read at a glance. They are not motion capture and carry no measurement.
 * Angles (rad): lean = torso from the vertical (+ forward); th = thigh from straight down (+ forward); kn = knee flexion;
 * sh = upper arm from straight down (+ forward); el = elbow flexion; rot = rotation of the whole body about the pelvis (+ = backward);
 * air = height of the pelvis above the ground in body heights (null: the lowest point of the body rests on the ground). */
(function () {
  'use strict';
  var A = window.DeckAnim.A, DM = window.DeepMimicKit = {};
  var L = { torso: 0.31, neck: 0.045, head: 0.078, thigh: 0.25, shin: 0.25, foot: 0.075, uarm: 0.165, farm: 0.155 };

  function joints(p) {
    var c = Math.cos(p.rot || 0), s = Math.sin(p.rot || 0), o = { leg: [], arm: [] }, k, lo = 0;
    function R(x, y) { var q = [x * c - y * s, x * s + y * c]; if (q[1] < lo) lo = q[1]; return q; }
    var tx = Math.sin(p.lean), ty = Math.cos(p.lean), hl = L.torso + L.neck + L.head;
    o.neck = R(L.torso * tx, L.torso * ty);
    o.head = R(hl * tx, hl * ty);
    lo = Math.min(lo, o.head[1] - L.head);
    var sx = 0.93 * L.torso * tx, sy = 0.93 * L.torso * ty;
    for (k = 0; k < 2; k++) {
      var a = p.th[k], b = a - p.kn[k];
      var kx = L.thigh * Math.sin(a), ky = -L.thigh * Math.cos(a), fx = kx + L.shin * Math.sin(b), fy = ky - L.shin * Math.cos(b);
      o.leg.push([R(kx, ky), R(fx, fy), R(fx + L.foot * Math.cos(b), fy + L.foot * Math.sin(b))]);
      var g = p.sh[k], e = g + p.el[k];
      var ex = sx + L.uarm * Math.sin(g), ey = sy - L.uarm * Math.cos(g);
      o.arm.push([R(sx, sy), R(ex, ey), R(ex + L.farm * Math.sin(e), ey - L.farm * Math.cos(e))]);
    }
    o.low = lo;
    return o;
  }
  /** pelvis height (body heights) at which the lowest point of the pose touches the ground */
  DM.rest = function (p) { return -joints(p).low; };

  DM.fig = function (parent, col, w) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': w || 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    var far = A.el('path', { 'stroke-opacity': 0.5 }, g), near = A.el('path', {}, g), head = A.el('circle', { fill: col, stroke: 'none' }, g);
    return {
      g: g,
      set: function (p, x, gy, S) {
        var o = joints(p), lift = (p.air === null || p.air === undefined) ? -o.low : p.air;
        function P(q) { return (x + S * q[0]).toFixed(1) + ' ' + (gy - S * (q[1] + lift)).toFixed(1); }
        function limb(k) { return 'M' + P([0, 0]) + 'L' + P(o.leg[k][0]) + 'L' + P(o.leg[k][1]) + 'L' + P(o.leg[k][2]) + 'M' + P(o.arm[k][0]) + 'L' + P(o.arm[k][1]) + 'L' + P(o.arm[k][2]); }
        A.set(far, { d: limb(1) });
        A.set(near, { d: 'M' + P([0, 0]) + 'L' + P(o.neck) + limb(0) });
        A.set(head, { cx: (x + S * o.head[0]).toFixed(1), cy: (gy - S * (o.head[1] + lift)).toFixed(1), r: (S * L.head).toFixed(1) });
      }
    };
  };

  DM.run = function (u) {
    var p = 2 * Math.PI * u, o = { lean: 0.2, th: [], kn: [], sh: [], el: [], rot: 0, air: null };
    for (var k = 0; k < 2; k++) {
      var ph = p + k * Math.PI;
      o.th.push(0.12 + 0.78 * Math.sin(ph));
      o.kn.push(0.22 + 1.35 * Math.max(0, Math.cos(ph)));
      o.sh.push(-0.75 * Math.sin(ph));
      o.el.push(1.35);
    }
    return o;
  };

  //            u     lean    th     kn     sh     el    rot
  var FLIP = [[0.00,  0.03,  0.02,  0.05,  0.10,  0.25, 0.00],
              [0.10,  0.08,  0.05,  0.10,  1.25,  0.25, 0.00],      // arms swing forward
              [0.20,  0.75,  1.05,  1.80, -0.80,  0.35, 0.00],      // crouch, arms back
              [0.30, -0.20, -0.10,  0.08,  2.95,  0.10, 0.30],      // take-off: stretched, leaning back, arms overhead
              [0.40,  0.40,  1.95,  2.25,  1.05,  0.75, 1.90],      // tuck, rotating backward
              [0.50,  0.45,  2.00,  2.30,  1.05,  0.75, 3.60],      // upside down
              [0.60,  0.40,  1.50,  1.60,  1.10,  0.70, 5.20],      // opening
              [0.70,  0.55,  1.00,  1.35,  0.95,  0.70, 6.2832],    // touch-down
              [0.80,  0.75,  1.10,  1.75,  0.55,  0.60, 6.2832],    // absorb
              [0.90,  0.30,  0.40,  0.60,  0.25,  0.40, 6.2832],
              [1.00,  0.03,  0.02,  0.05,  0.10,  0.25, 6.2832]];
  var UA = 0.30, UB = 0.70, PEAK = 0.36;        // the flight, and how high the pelvis rises in it (body heights)
  function key(u) {
    u = A.clamp(u, 0, 1);
    for (var i = 1; i < FLIP.length; i++) if (u <= FLIP[i][0] || i === FLIP.length - 1) {
      var a = FLIP[i - 1], b = FLIP[i], w = A.ease((u - a[0]) / (b[0] - a[0])), v = [];
      for (var j = 1; j < 7; j++) v.push(a[j] + (b[j] - a[j]) * w);
      return { lean: v[0], th: [v[1], v[1]], kn: [v[2], v[2]], sh: [v[3], v[3]], el: [v[4], v[4]], rot: v[5], air: null };
    }
  }
  var HA = DM.rest(key(UA)), HB = DM.rest(key(UB));
  DM.flip = function (u) {
    var p = key(u);
    if (u > UA && u < UB) { var s = (u - UA) / (UB - UA); p.air = HA + (HB - HA) * s + 4 * PEAK * s * (1 - s); }
    return p;
  };
  DM.FLIGHT = [UA, UB];
})();
