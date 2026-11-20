/*! Shared helpers of the Omnigrasp figures (tools/slides/06b_30_omnigrasp.py: omnigrasp-noise, omnigrasp-goal, omnigrasp-reward).
 *  No figure is registered here. Loaded before the omnigrasp-*.js figures (file-name order); they read window.OGKit at set-up time.
 *  Everything drawn with this kit is a SCHEMATIC: a planar stick body and a cartoon hand, moved by formulas. Nothing here is simulated. */
window.OGKit = (function () {
  'use strict';
  var TAU = 2 * Math.PI;
  var MATH = "KaTeX_Math, 'Times New Roman', serif";
  var K = {
    /** italic math symbol inside an SVG <text> */
    mi: function (s) { return '<tspan style="font-family:' + MATH + ';font-style:italic;font-weight:400;font-size:1.18em">' + s + '</tspan>'; },
    /** <text> in the deck font whose content may contain tspans */
    text: function (A, parent, x, y, s, o) {
      o = o || {};
      var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
        style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.halo ? ';' + A.HALO : '') }, parent);
      n.innerHTML = s;
      return n;
    },
    pts: function (n, pts) {
      var s = '';
      for (var i = 0; i < pts.length; i++) s += pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1) + ' ';
      n.setAttribute('points', s);
    },
    /** n channels of smooth pseudo-noise (three sines each, fixed random frequencies in [f0, f1] Hz and phases): noise(i, t) is roughly in [-1, 1] */
    noise: function (A, seed, n, f0, f1) {
      var r = A.rand(seed), ch = [];
      for (var i = 0; i < n; i++) { var c = []; for (var k = 0; k < 3; k++) c.push([f0 + (f1 - f0) * r(), TAU * r()]); ch.push(c); }
      return function (i, t) { var c = ch[i], s = 0; for (var k = 0; k < 3; k++) s += Math.sin(TAU * c[k][0] * t + c[k][1]); return s / 1.9; };
    },

    // ---------------------------------------------------------------- a planar stick body, seen from the side, facing +x
    L: { shin: 52, thigh: 52, torso: 70, upper: 46, fore: 44, hand: 13, head: 13 },
    /** q = [ankle, knee, hip, shoulder, elbow, wrist] in radians, each RELATIVE to its parent link; the supporting foot stands at (x0, yG).
     *  A rotation at a joint turns everything further along the chain: that is how an error near the ground reaches the hand. */
    fk: function (q, x0, yG) {
      var L = K.L, a1 = q[0], a2 = a1 + q[1], a3 = a2 + q[2];            // shin, thigh, torso: angle from "straight up", toward +x
      var b1 = q[3] - a3, b2 = b1 + q[4], b3 = b2 + q[5];                 // upper arm, forearm, hand: angle from "straight down", toward +x
      var s3 = Math.sin(a3), c3 = Math.cos(a3);
      var An = [x0, yG - 5];
      var Kn = [An[0] + L.shin * Math.sin(a1), An[1] - L.shin * Math.cos(a1)];
      var H = [Kn[0] + L.thigh * Math.sin(a2), Kn[1] - L.thigh * Math.cos(a2)];
      var N = [H[0] + L.torso * s3, H[1] - L.torso * c3];
      var S = [H[0] + 0.86 * L.torso * s3, H[1] - 0.86 * L.torso * c3];
      var E = [S[0] + L.upper * Math.sin(b1), S[1] + L.upper * Math.cos(b1)];
      var W = [E[0] + L.fore * Math.sin(b2), E[1] + L.fore * Math.cos(b2)];
      return { A: An, K: Kn, H: H, N: N, S: S, E: E, W: W, a3: a3,
               Hd: [N[0] + (L.head + 3) * s3, N[1] - (L.head + 3) * c3],
               T: [W[0] + L.hand * Math.sin(b3), W[1] + L.hand * Math.cos(b3)] };
    },
    /** the joint between P and Q of a two-link limb (l1 from P, l2 to Q); sgn picks the side it bends to */
    ik: function (P, Q, l1, l2, sgn) {
      var dx = Q[0] - P[0], dy = Q[1] - P[1], D = Math.sqrt(dx * dx + dy * dy) || 1, d = Math.min(D, l1 + l2 - 0.01);
      var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), ux = dx / D, uy = dy / D;
      return [P[0] + a * ux - sgn * h * uy, P[1] + a * uy + sgn * h * ux];
    },
    /** create the body's nodes once; returns draw(P, F2, far): P = fk(...), F2 = the far foot (on the ground), far = [upper, fore] angles of the far arm */
    body: function (A, parent, col, colFar) {
      function mk(c, w) { return A.el('polyline', { fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent); }
      var farLeg = mk(colFar, 8), farArm = mk(colFar, 7), torso = mk(col, 11), leg = mk(col, 9);
      var head = A.el('circle', { r: K.L.head, fill: col }, parent), arm = mk(col, 8);
      return function (P, F2, far) {
        var K2 = K.ik(P.H, F2, K.L.thigh, K.L.shin, -1);
        K.pts(farLeg, [P.H, K2, F2, [F2[0] + 15, F2[1] + 3]]);
        var E2 = [P.S[0] + K.L.upper * Math.sin(far[0]), P.S[1] + K.L.upper * Math.cos(far[0])];
        K.pts(farArm, [P.S, E2, [E2[0] + (K.L.fore + 8) * Math.sin(far[1]), E2[1] + (K.L.fore + 8) * Math.cos(far[1])]]);
        K.pts(torso, [P.H, P.N]);
        K.pts(leg, [[P.A[0] + 15, P.A[1] + 3], P.A, P.K, P.H]);
        A.set(head, { cx: P.Hd[0].toFixed(1), cy: P.Hd[1].toFixed(1) });
        K.pts(arm, [P.S, P.E, P.W, P.T]);
      };
    },

    // ---------------------------------------------------------------- the object: a mug seen from the side (body + block handle)
    MUG: [[-20, -20], [12, -20], [12, -10], [24, -10], [24, 10], [12, 10], [12, 20], [-20, 20]],
    mugPts: function (cx, cy, s) { return K.MUG.map(function (p) { return [cx + s * p[0], cy + s * p[1]]; }); },
    mug: function (A, parent, col) {
      var n = A.el('polygon', { fill: col, stroke: col, 'stroke-width': 5, 'stroke-linejoin': 'round' }, parent);
      var draw = function (cx, cy, s) { K.pts(n, K.mugPts(cx, cy, s)); };
      draw.n = n;
      return draw;
    },
    /** the point of a closed polygon's outline that is nearest to p */
    nearest: function (poly, p) {
      var best = null, bd = 1e9;
      for (var i = 0; i < poly.length; i++) {
        var a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1];
        var u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
        var q = [a[0] + u * dx, a[1] + u * dy], d = (q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]);
        if (d < bd) { bd = d; best = q; }
      }
      return best;
    },

    // ---------------------------------------------------------------- a cartoon hand, seen from the side
    GRIP: [38, 8],                                                        // where a held object sits, in the hand's own frame (before scaling)
    /** wrist at (x, y), pointing along rot (rad, 0 = +x), curl 0 = open .. 1 = closed, scale s  ->  polylines + the grip point */
    handPts: function (x, y, rot, curl, s) {
      var c = Math.cos(rot), sn = Math.sin(rot);
      function w(p) { return [x + s * (p[0] * c - p[1] * sn), y + s * (p[0] * sn + p[1] * c)]; }
      function chain(bx, by, a0, da, lens) {
        var pts = [[bx, by]], a = a0, px = bx, py = by;
        for (var i = 0; i < lens.length; i++) { px += lens[i] * Math.cos(a); py += lens[i] * Math.sin(a); pts.push([px, py]); a += da; }
        return pts;
      }
      return { arm: [w([-28, 0]), w([0, 0])], palm: [w([0, 0]), w([30, 0])],
               fin: chain(30, -7, -0.30 + 0.55 * curl, 0.25 + 0.60 * curl, [17, 13, 10]).map(w),
               thu: chain(10, 8, 1.05 - 0.25 * curl, -0.25 - 0.55 * curl, [15, 12]).map(w),
               grip: w(K.GRIP) };
    },
    /** create a hand's nodes once; returns draw(x, y, rot, curl, s) -> the points (so that a figure can attach things to the joints).
     *  o.between(g): called after the forearm, palm and thumb exist and before the fingers, so that a held object can sit inside the grip.
     *  o.ghost: a translucent hand (a target pose, not a body). */
    hand: function (A, parent, col, o) {
      o = o || {};
      var g = A.el('g', { fill: 'none', stroke: col, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
      if (o.ghost) g.setAttribute('stroke-opacity', 0.5);
      var arm = A.el('polyline', { 'stroke-opacity': o.ghost ? 0.25 : 0.45 }, g), palm = A.el('polyline', {}, g), thu = A.el('polyline', {}, g);
      if (o.between) o.between(g);
      var fin = A.el('polyline', {}, g);
      var sw = 0;
      var draw = function (x, y, rot, curl, s) {
        var h = K.handPts(x, y, rot, curl, s);
        if (s !== sw) { sw = s; arm.setAttribute('stroke-width', 9 * s); palm.setAttribute('stroke-width', 12 * s); thu.setAttribute('stroke-width', 6 * s); fin.setAttribute('stroke-width', 6.5 * s); }
        K.pts(arm, h.arm); K.pts(palm, h.palm); K.pts(fin, h.fin); K.pts(thu, h.thu);
        return h;
      };
      draw.g = g;
      return draw;
    }
  };
  return K;
})();
