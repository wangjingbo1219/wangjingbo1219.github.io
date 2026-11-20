/* Shared pieces of the ScaleBFM figures (tools/slides/07_35_scalebfm.py): scalebfm-frame, -mask, -rollouts, -motions, -arch, -size.
 * SBF.txt / mi        text in the deck font (innerHTML: may contain <tspan>), a math symbol as a tspan
 * SBF.since(f, k)     time since click k revealed a figure: -1 before it, f.ts while it is the current click, 1000 afterwards
 * SBF.clock(f, k)     a running clock for a figure that is revealed by click k (0 before the click)
 * SBF.card            the dark card behind a figure
 * SBF.heat / cell     a table cell shaded by where its value lies in its row: all numbers in such cells are the paper's
 * SBF.front(p, …)     a stick robot seen from the front, with the 14 links of the paper's Table 4 (schematic proportions)
 * SBF.side(phi, …)    a stick figure walking, seen from the side (schematic walk cycle, not motion data)
 */
(function () {
  'use strict';
  var SB = window.SBF = {};
  SB.since = function (f, step) { return f.step > step ? 1e3 : (f.step === step ? f.ts : -1); };
  SB.clock = function (f, step) { return step === 0 ? f.t : (f.step < step ? 0 : (f.step === step ? f.ts : f.t)); };
  SB.txt = function (A, p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.halo ? ';' + A.HALO : '') }, p);
    n.innerHTML = s;
    return n;
  };
  SB.mi = function (s) { return '<tspan style="font-family:KaTeX_Math,\'Times New Roman\',serif;font-style:italic;font-size:1.14em">' + s + '</tspan>'; };
  SB.card = function (A, p, x, y, w, h) {
    return A.el('rect', { x: x + 1, y: y + 1, width: w - 2, height: h - 2, rx: 16, fill: '#0c0c0c', stroke: A.C.line, 'stroke-width': 2 }, p);
  };
  /** shade of a table cell: u = 0 (worst of its row) .. 1 (best of its row) */
  SB.heat = function (u) {
    u = Math.max(0, Math.min(1, u));
    var a = [30, 30, 30], b = [58, 92, 6];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * u) + ',' + Math.round(a[1] + (b[1] - a[1]) * u) + ',' + Math.round(a[2] + (b[2] - a[2]) * u) + ')';
  };
  /** a table cell with a number: returns its group (for A.show). o: size, best (ring), blank (no value in the paper) */
  SB.cell = function (A, p, x, y, w, h, s, u, o) {
    o = o || {};
    var g = A.el('g', {}, p);
    if (o.blank) {
      A.el('rect', { x: x + 1, y: y + 1, width: w - 2, height: h - 2, rx: 9, fill: 'none', stroke: '#333', 'stroke-width': 2, 'stroke-dasharray': '5 6' }, g);
      return g;
    }
    A.el('rect', { x: x, y: y, width: w, height: h, rx: 9, fill: SB.heat(u), stroke: o.best ? A.C.g : 'none', 'stroke-width': 3 }, g);
    SB.txt(A, g, x + w / 2, y + h / 2 + (o.size || 22) * 0.35, s, { size: o.size || 22, weight: 700, anchor: 'middle', fill: '#fff' });
    return g;
  };
  SB.arrow = function (A, p, pts, o) {
    o = o || {};
    var g = A.el('g', { fill: 'none', stroke: o.col || '#9a9a9a', 'stroke-width': o.w || 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p);
    A.el('path', { d: A.path(pts), 'stroke-dasharray': o.dash || 'none' }, g);
    var a = pts[pts.length - 2], b = pts[pts.length - 1], an = Math.atan2(b[1] - a[1], b[0] - a[0]), s = o.hs || 9;
    var c = Math.cos(an), n = Math.sin(an), bx = b[0] - s * c, by = b[1] - s * n;
    A.el('path', { d: 'M' + (bx - 0.6 * s * n).toFixed(1) + ' ' + (by + 0.6 * s * c).toFixed(1) + 'L' + b[0] + ' ' + b[1] + 'L' + (bx + 0.6 * s * n).toFixed(1) + ' ' + (by - 0.6 * s * c).toFixed(1) }, g);
    return g;
  };
  /** point at fraction u (0..1) along a polyline */
  SB.along = function (pts, u) {
    var L = [], tot = 0, i;
    for (i = 1; i < pts.length; i++) { L.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); tot += L[i - 1]; }
    var d = Math.max(0, Math.min(1, u)) * tot;
    for (i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { var q = L[i] ? d / L[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * q, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * q]; } d -= L[i]; }
    return pts[0];
  };

  // ---------------------------------------------------------------- front view: the 14 links of Table 4
  SB.BODY = { thigh: 0.30, shin: 0.30, hipw: 0.085, spine: 0.27, neck: 0.125, shw: 0.165, upper: 0.185, fore: 0.20, headr: 0.062 };
  SB.LINKS = ['pelvis', 'torso', 'shL', 'shR', 'elL', 'elR', 'haL', 'haR', 'hipL', 'hipR', 'knL', 'knR', 'ftL', 'ftR'];
  SB.FBONES = [['hipL', 'hipR'], ['pelvis', 'chest'], ['chest', 'head'], ['shL', 'shR'], ['shL', 'elL'], ['elL', 'haL'], ['shR', 'elR'], ['elR', 'haR'],
               ['hipL', 'knL'], ['knL', 'ftL'], ['hipR', 'knR'], ['knR', 'ftR']];
  /** joint positions of pose p = {squat, sway, aL, bL, aR, bR}: feet on the ground at (x, y), s px per body unit */
  SB.front = function (p, x, y, s) {
    var B = SB.BODY, L = B.thigh + B.shin, hh = L * (1 - p.squat), px = x + p.sway * s, py = y - hh * s, o = {};
    function leg(sg) {
      var hx = px + sg * B.hipw * s, hy = py, fx = x + sg * (B.hipw + 0.035) * s, fy = y;
      var dx = fx - hx, dy = fy - hy, D = Math.max(1e-6, Math.hypot(dx, dy)), a = B.thigh * s, b = B.shin * s;
      var al = (a * a - b * b + D * D) / (2 * D), h = Math.sqrt(Math.max(0, a * a - al * al));
      return { hip: [hx, hy], kn: [hx + al * dx / D + sg * h * dy / D, hy + al * dy / D - sg * h * dx / D], ft: [fx, fy] };
    }
    function arm(sg, a, bnd) {
      var sx = px + sg * B.shw * s, sy = py - B.spine * s;
      var ex = sx + sg * Math.sin(a) * B.upper * s, ey = sy + Math.cos(a) * B.upper * s;
      return { sh: [sx, sy], el: [ex, ey], ha: [ex + sg * Math.sin(a + bnd) * B.fore * s, ey + Math.cos(a + bnd) * B.fore * s] };
    }
    var l = leg(-1), r = leg(1), al_ = arm(-1, p.aL, p.bL), ar = arm(1, p.aR, p.bR);
    o.pelvis = [px, py]; o.chest = [px, py - B.spine * s]; o.torso = [px, py - 0.55 * B.spine * s]; o.head = [px, py - (B.spine + B.neck) * s];
    o.hipL = l.hip; o.knL = l.kn; o.ftL = l.ft; o.hipR = r.hip; o.knR = r.kn; o.ftR = r.ft;
    o.shL = al_.sh; o.elL = al_.el; o.haL = al_.ha; o.shR = ar.sh; o.elR = ar.el; o.haR = ar.ha;
    return o;
  };
  SB.bonePath = function (j, bones) {
    var d = '';
    for (var i = 0; i < bones.length; i++) {
      var a = j[bones[i][0]], b = j[bones[i][1]];
      d += 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }
    return d;
  };

  // ---------------------------------------------------------------- side view: a schematic walk cycle
  SB.SBONES = [['hip', 'neck'], ['hip', 'kn1'], ['kn1', 'ft1'], ['hip', 'kn2'], ['kn2', 'ft2'], ['neck', 'el1'], ['el1', 'ha1'], ['neck', 'el2'], ['el2', 'ha2']];
  /** joints of a walker at phase phi (one stride = 2 pi), hips above x, feet on the ground line, H = body height in px */
  SB.side = function (phi, x, ground, H) {
    var TH = 0.25 * H, SH = 0.25 * H, TO = 0.30 * H, UA = 0.15 * H, FA = 0.15 * H, o = {}, low = 0, i, legs = [];
    for (i = 0; i < 2; i++) {
      var p = phi + i * Math.PI, a = 0.40 * Math.sin(p), b = 0.08 + 0.62 * Math.max(0, Math.cos(p));
      var kx = TH * Math.sin(a), ky = TH * Math.cos(a), fx = kx + SH * Math.sin(a - b), fy = ky + SH * Math.cos(a - b);
      legs.push([kx, ky, fx, fy]); low = Math.max(low, fy);
    }
    var hy = ground - low;
    o.hip = [x, hy]; o.neck = [x + TO * Math.sin(0.05), hy - TO * Math.cos(0.05)]; o.head = [o.neck[0] + 0.02 * H, o.neck[1] - 0.085 * H];
    for (i = 0; i < 2; i++) {
      o['kn' + (i + 1)] = [x + legs[i][0], hy + legs[i][1]]; o['ft' + (i + 1)] = [x + legs[i][2], hy + legs[i][3]];
      var c = -0.36 * Math.sin(phi + i * Math.PI), ex = o.neck[0] + UA * Math.sin(c), ey = o.neck[1] + UA * Math.cos(c);
      o['el' + (i + 1)] = [ex, ey]; o['ha' + (i + 1)] = [ex + FA * Math.sin(c + 0.4), ey + FA * Math.cos(c + 0.4)];
    }
    return o;
  };
  /** a walker made of one path and a head: returns { set(j, opacity) } */
  SB.walker = function (A, p, col, w, H) {
    var g = A.el('g', {}, p);
    var path = A.el('path', { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    var head = A.el('circle', { r: 0.058 * H, fill: col }, g);
    return { g: g, set: function (j, op) {
      A.set(path, { d: SB.bonePath(j, SB.SBONES) }); A.set(head, { cx: j.head[0].toFixed(1), cy: j.head[1].toFixed(1) }); A.show(g, op === undefined ? 1 : op);
    } };
  };
})();
