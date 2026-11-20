/*! Shared pieces of the C·ASE figures (tools/slides/03b_10_case.py): case-split.js, case-latent.js, case-focal.js.
 *  No figure is registered here. Loaded before them (file-name order); they read window.CaseKit at set-up time.
 *  Everything in these figures is SCHEMATIC: a stick figure with a sword and a shield, drawn in profile, with hand-made key poses
 *  for five skills that the paper names (idle, walk, kick, shield bash, sword swing). No data, no simulation, no numbers. */
window.CaseKit = (function () {
  'use strict';
  var R = Math.PI / 180, MATH = "KaTeX_Math, 'Times New Roman', serif";
  // pose = [lean, thF, knF, thB, knB, uaS, ebS, sw, uaH, ebH] in degrees, the character faces right:
  //   lean      torso, forward of upright
  //   thF, thB  thigh of the near / far leg, forward of straight down;   knF, knB  knee flexion (the shin swings back)
  //   uaS, ebS  sword arm: upper arm forward of straight down (180 = straight up), elbow flexion;   sw  sword relative to the forearm
  //   uaH, ebH  shield arm
  var REST = [2, 8, 8, -8, 6, 12, 40, 20, 14, 62];
  function mix(P, Q, u) { var o = []; for (var i = 0; i < P.length; i++) o.push(P[i] + (Q[i] - P[i]) * u); return o; }
  function ease(u) { u = u < 0 ? 0 : (u > 1 ? 1 : u); return u * u * (3 - 2 * u); }
  /** key frames [[u, pose], ...] with u rising from 0 to 1 -> pose at phase u (eased between keys) */
  function keys(u, ks) {
    u = ((u % 1) + 1) % 1;
    for (var i = 1; i < ks.length; i++) if (u <= ks[i][0]) return mix(ks[i - 1][1], ks[i][1], ease((u - ks[i - 1][0]) / Math.max(1e-6, ks[i][0] - ks[i - 1][0])));
    return ks[ks.length - 1][1];
  }
  var KICK_A = [-6, 72, 100, -4, 10, -22, 55, 30, 34, 80], KICK_B = [-20, 92, 4, -6, 6, -30, 50, 30, 40, 75];
  var BASH_A = [-5, 4, 8, -6, 8, -14, 40, 25, -8, 118], BASH_B = [17, 30, 14, -24, 8, -30, 35, 25, 78, 10];
  /** sword swing with a variation v = {hi: how high the sword is raised, lo: where it ends, lean, step} */
  function swing(u, v) {
    v = v || {};
    var up = [-7, 4, 8, -8, 8, v.hi === undefined ? 158 : v.hi, 28, -18, 22, 70];
    var dn = [v.lean === undefined ? 15 : v.lean, v.step === undefined ? 28 : v.step, 12, -(v.step === undefined ? 22 : 0.8 * v.step), 8, v.lo === undefined ? 52 : v.lo, 8, 28, 16, 75];
    return keys(u, [[0, REST], [0.30, up], [0.40, up], [0.52, dn], [0.66, dn], [0.90, REST], [1, REST]]);
  }
  var SK = {
    idle: { lines: ['idle'], period: 3.0, fn: function (u) {
      var s = Math.sin(2 * Math.PI * u), P = REST.slice(); P[0] += 1.5 * s; P[5] += 2 * s; P[8] -= 2 * s; return P; } },
    walk: { lines: ['walk'], period: 1.05, fn: function (u) {
      var p = 2 * Math.PI * u, s = Math.sin(p), c = Math.cos(p);
      return [6, 27 * s, 6 + 42 * Math.max(0, c), -27 * s, 6 + 42 * Math.max(0, -c), 12 - 16 * s, 40, 20, 14 + 16 * s, 62]; } },
    kick: { lines: ['kick'], period: 1.9, fn: function (u) {
      return keys(u, [[0, REST], [0.22, KICK_A], [0.40, KICK_B], [0.52, KICK_B], [0.72, KICK_A], [0.90, REST], [1, REST]]); } },
    bash: { lines: ['shield', 'bash'], period: 1.9, fn: function (u) {
      return keys(u, [[0, REST], [0.25, BASH_A], [0.42, BASH_B], [0.58, BASH_B], [0.85, REST], [1, REST]]); } },
    swing: { lines: ['sword', 'swing'], period: 2.1, fn: function (u) { return swing(u); } }
  };
  var ORDER = ['idle', 'walk', 'kick', 'bash', 'swing'];
  function d(a, l) { return [l * Math.sin(a * R), l * Math.cos(a * R)]; }      // a degrees forward of straight down, y points down
  function add(p, q) { return [p[0] + q[0], p[1] + q[1]]; }
  function pt(p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }

  var K = {
    REST: REST, SK: SK, ORDER: ORDER, mix: mix, ease: ease, swing: swing,
    /** display name of a skill on one line */
    name: function (key) { return SK[key].lines.join(' '); },
    /** pose of skill `key` at time t (seconds), looping with the skill's own period */
    pose: function (key, t, rate) { var s = SK[key]; return s.fn((t * (rate || 1)) / s.period); },
    /** italic math symbol inside an SVG <text> (set with A.set(node, {html: ...})) */
    mi: function (s) { return '<tspan style="font-family:' + MATH + ';font-style:italic;font-weight:400;font-size:1.18em">' + s + '</tspan>'; },
    /** subscript after a symbol */
    sub: function (s) { return '<tspan dy="5" style="font-size:.72em">' + s + '</tspan><tspan dy="-5">\u200b</tspan>'; },
    /** set a node's markup only when it changed (draw() runs every frame) */
    html: function (n, s) { if (n._cs !== s) { n._cs = s; n.innerHTML = s; } },
    /** a stick figure: create its nodes once */
    fig: function (A, parent, col, o) {
      o = o || {};
      var g = A.el('g', { fill: 'none', stroke: col, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
      var f = { g: g, col: col };
      f.far = A.el('path', { 'stroke-opacity': 0.55 }, g);
      f.shield = A.el('circle', { fill: col, 'fill-opacity': 0.28 }, g);
      f.near = A.el('path', {}, g);
      f.sword = A.el('path', { stroke: o.sword || '#e8e8e8' }, g);
      f.head = A.el('circle', { fill: col, stroke: 'none' }, g);
      return f;
    },
    /** put the figure at x (hip), with its lowest foot on y = ground, body height Hh, in pose P */
    put: function (A, f, x, ground, Hh, P) {
      var T = 0.30 * Hh, TH = 0.25 * Hh, SH = 0.25 * Hh, UA = 0.16 * Hh, FA = 0.16 * Hh, SW = 0.36 * Hh, HR = 0.072 * Hh, w = Math.max(3, 0.046 * Hh);
      var kF = d(P[1], TH), fF = add(kF, d(P[1] - P[2], SH)), kB = d(P[3], TH), fB = add(kB, d(P[3] - P[4], SH));
      var hip = [x, ground - Math.max(fF[1], fB[1])];
      var sh = add(hip, [T * Math.sin(P[0] * R), -T * Math.cos(P[0] * R)]), hd = add(sh, [(HR + 1.5) * Math.sin(P[0] * R), -(HR + 1.5) * Math.cos(P[0] * R)]);
      var eS = add(sh, d(P[5], UA)), hS = add(eS, d(P[5] + P[6], FA)), tip = add(hS, d(P[5] + P[6] + P[7], SW));
      var eH = add(sh, d(P[8], UA)), hH = add(eH, d(P[8] + P[9], FA));
      A.set(f.far, { 'stroke-width': w.toFixed(1), d: 'M' + pt(hip) + 'L' + pt(add(hip, kB)) + 'L' + pt(add(hip, fB)) + 'M' + pt(sh) + 'L' + pt(eH) + 'L' + pt(hH) });
      A.set(f.near, { 'stroke-width': w.toFixed(1), d: 'M' + pt(hip) + 'L' + pt(add(hip, kF)) + 'L' + pt(add(hip, fF)) + 'M' + pt(hip) + 'L' + pt(sh) + 'M' + pt(sh) + 'L' + pt(eS) + 'L' + pt(hS) });
      A.set(f.sword, { 'stroke-width': (0.6 * w).toFixed(1), d: 'M' + pt(hS) + 'L' + pt(tip) });
      A.set(f.shield, { cx: hH[0].toFixed(1), cy: hH[1].toFixed(1), r: (0.105 * Hh).toFixed(1), 'stroke-width': (0.75 * w).toFixed(1) });
      A.set(f.head, { cx: hd[0].toFixed(1), cy: hd[1].toFixed(1), r: HR.toFixed(1) });
    },
    /** arclength parametrisation of a polyline [[x, y], ...] */
    track: function (pts) {
      var L = [0], i;
      for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { len: L[L.length - 1], at: function (s) {
        s = Math.max(0, Math.min(L[L.length - 1], s));
        for (var j = 1; j < pts.length; j++) if (s <= L[j] || j === pts.length - 1) {
          var u = (s - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1]);
          return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u];
        }
      } };
    },
    dots: function (A, parent, n, col, r) { var o = []; for (var i = 0; i < n; i++) o.push(A.el('circle', { r: r || 5, fill: col, stroke: '#0b0b0b', 'stroke-width': 1.5 }, parent)); return o; },
    /** n pulses running along tr at `speed` px/s, all multiplied by opacity `op` */
    run: function (A, nodes, tr, t, speed, op) {
      var gap = tr.len / nodes.length;
      for (var i = 0; i < nodes.length; i++) {
        var s = (((t * speed + i * gap) % tr.len) + tr.len) % tr.len, p = tr.at(s);
        A.set(nodes[i], { cx: p[0].toFixed(1), cy: p[1].toFixed(1) });
        A.show(nodes[i], Math.min(1, s / 10, (tr.len - s) / 10) * (op === undefined ? 1 : op));
      }
    },
    /** polyline with an arrow head at its end; returns {line, head, set(pts)} */
    arrow: function (A, parent, col, o) {
      o = o || {};
      var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': o.w || 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
      var line = A.el('path', { 'stroke-dasharray': o.dash || 'none' }, g), head = A.el('path', {}, g);
      var a = { g: g, set: function (pts) {
        var n = pts.length, s = '', i, ang = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]), hs = o.head || 10;
        for (i = 0; i < n; i++) s += (i ? 'L' : 'M') + pt(pts[i]);
        var c = Math.cos(ang), q = Math.sin(ang), bx = pts[n - 1][0] - hs * c, by = pts[n - 1][1] - hs * q;
        A.set(line, { d: s });
        A.set(head, { d: 'M' + (bx - 0.6 * hs * q).toFixed(1) + ' ' + (by + 0.6 * hs * c).toFixed(1) + 'L' + pt(pts[n - 1]) + 'L' + (bx + 0.6 * hs * q).toFixed(1) + ' ' + (by - 0.6 * hs * c).toFixed(1) });
        return a;
      } };
      return a;
    }
  };
  return K;
})();
