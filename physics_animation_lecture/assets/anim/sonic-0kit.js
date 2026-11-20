/* Shared pieces of the SONIC figures (tools/slides/07_30_sonic.py): sonic-axis, sonic-fsq, sonic-formats, sonic-align, sonic-stage.
 * SN.COL          one colour per command format, the same on every SONIC slide: robot motion (white), human motion (blue), hybrid (violet)
 * SN.pose(t)      one illustrative whole-body motion (a squat with both arms raised, 4 s loop), in joint angles
 * SN.fk(p, B, …)  that pose on a body with the proportions B, seen from the front -> joint positions
 * SN.ROBOT / SN.HUMAN   two bodies of different proportions (the human is about a third taller: 1.75 m against the G1's 1.3 m)
 * The figures are schematics: the motion and all token values are illustrative, not data.
 */
(function () {
  'use strict';
  var SN = window.SN = {};
  SN.COL = { r: '#ffffff', h: '#4fc3f7', m: '#c58cff' };
  SN.T = 4;                                              // period of the illustrative motion, seconds
  // lengths in body units (1 unit = the robot's leg length x 1.67); w = half widths
  SN.ROBOT = { thigh: 0.30, shin: 0.30, hipw: 0.085, spine: 0.27, neck: 0.125, shw: 0.165, upper: 0.185, fore: 0.20, headr: 0.062 };
  SN.HUMAN = { thigh: 0.415, shin: 0.415, hipw: 0.08, spine: 0.31, neck: 0.165, shw: 0.175, upper: 0.27, fore: 0.26, headr: 0.088 };
  SN.BONES = [['hipL', 'hipR'], ['pelvis', 'chest'], ['chest', 'head'], ['shL', 'shR'], ['shL', 'elL'], ['elL', 'haL'], ['shR', 'elR'], ['elR', 'haR'],
              ['hipL', 'knL'], ['knL', 'ftL'], ['hipR', 'knR'], ['knR', 'ftR']];
  SN.LEGS = [['hipL', 'hipR'], ['hipL', 'knL'], ['knL', 'ftL'], ['hipR', 'knR'], ['knR', 'ftR']];
  SN.JOINTS = ['pelvis', 'chest', 'head', 'shL', 'shR', 'elL', 'elR', 'haL', 'haR', 'hipL', 'hipR', 'knL', 'knR', 'ftL', 'ftR'];

  /** joint angles of the illustrative motion at time t (seconds) */
  SN.pose = function (t) {
    var u = 2 * Math.PI * t / SN.T, a = (1 - Math.cos(u)) / 2, b = (1 - Math.cos(u - 0.7)) / 2;
    return { squat: 0.04 + 0.14 * a, sway: 0.035 * Math.sin(u), aL: 0.22 + 1.3 * b, bL: 0.25 + 0.5 * Math.sin(u) * Math.sin(u), aR: 0.22 + 2.45 * a, bR: 0.3 - 0.2 * a };
  };
  /** joint positions of pose p on body B: feet on the ground at (x, y), s px per body unit */
  SN.fk = function (p, B, x, y, s) {
    var L = B.thigh + B.shin, hh = L * (1 - p.squat), px = x + p.sway * s, py = y - hh * s, o = {};
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
    o.pelvis = [px, py]; o.chest = [px, py - B.spine * s]; o.head = [px, py - (B.spine + B.neck) * s];
    o.hipL = l.hip; o.knL = l.kn; o.ftL = l.ft; o.hipR = r.hip; o.knR = r.kn; o.ftR = r.ft;
    o.shL = al_.sh; o.elL = al_.el; o.haL = al_.ha; o.shR = ar.sh; o.elR = ar.el; o.haR = ar.ha;
    return o;
  };
  /** 'M..L..' path through the named bones of a posed body */
  SN.bonePath = function (j, bones) {
    var d = '';
    for (var i = 0; i < bones.length; i++) {
      var a = j[bones[i][0]], b = j[bones[i][1]];
      d += 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }
    return d;
  };
  /** text in the deck font; s may contain <tspan>. o: size, weight, fill, anchor */
  SN.txt = function (A, p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.halo ? ';' + A.HALO : '') }, p);
    n.innerHTML = s;
    return n;
  };
  /** math symbol (KaTeX italic) / calligraphic capital, as a tspan */
  SN.mi = function (s) { return '<tspan style="font-family:KaTeX_Math,\'Times New Roman\',serif;font-style:italic;font-size:1.16em">' + s + '</tspan>'; };
  SN.cal = function (s) { return '<tspan style="font-family:KaTeX_Caligraphic,KaTeX_Math,serif;font-size:1.2em">' + s + '</tspan>'; };
  // subscripts: SN.sub = a symbol (italic), SN.subt = a word (upright); the zero-width space that follows brings the baseline back
  SN.sub = function (s) { return '<tspan dy="0.3em" style="font-family:KaTeX_Math,\'Times New Roman\',serif;font-style:italic;font-size:0.8em">' + s + '</tspan><tspan dy="-0.3em" style="font-size:0.8em">&#8203;</tspan>'; };
  SN.subt = function (s) { return '<tspan dy="0.34em" style="font-size:0.7em">' + s + '</tspan><tspan dy="-0.34em" style="font-size:0.7em">&#8203;</tspan>'; };
  /** arrow head (open chevron) at (x, y) pointing along angle a */
  SN.head = function (x, y, a, s) {
    var c = Math.cos(a), n = Math.sin(a), bx = x - s * c, by = y - s * n;
    return 'M' + (bx - 0.6 * s * n).toFixed(1) + ' ' + (by + 0.6 * s * c).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) +
      'L' + (bx + 0.6 * s * n).toFixed(1) + ' ' + (by - 0.6 * s * c).toFixed(1);
  };
  /** straight arrow from a to b; returns the group */
  SN.arrow = function (A, p, a, b, o) {
    o = o || {};
    var g = A.el('g', { fill: 'none', stroke: o.col || '#8d8d8d', 'stroke-width': o.w || 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p);
    A.el('path', { d: 'M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1], 'stroke-dasharray': o.dash || 'none' }, g);
    A.el('path', { d: SN.head(b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), o.hs || 10) }, g);
    return g;
  };
  /** time since the click that reveals this figure: -1 before it, f.ts while it is the current click, a large number afterwards */
  SN.since = function (f, step) { return f.step > step ? 1e3 : (f.step === step ? f.ts : -1); };
})();
