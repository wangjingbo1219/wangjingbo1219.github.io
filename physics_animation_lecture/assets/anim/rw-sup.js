/* Slide "Four ways to tell the policy what good means": one small diagram per column.   <svg data-anim="rw-sup" data-k="0..3" viewBox="0 0 368 200">
 * SCHEMATICS. Green box = the network being trained. Amber = the learning signal, with pulses that run from its source into that network:
 *   0 task reward     the simulator pays for progress toward a flag
 *   1 imitation       the same loop; the reward compares with a reference clip (tracking) or asks a discriminator (adversarial), alternating
 *   2 world model     the loss is differentiated back through a learned model into the policy; the simulator only supplies data
 *   3 distillation    a frozen teacher's action is the target for the student's action
 * Column k is revealed at build step k: its scene restarts at that click.
 */
DeckAnim.register('rw-sup', function (el, A) {
  'use strict';
  var C = A.C, RW = window.RW, K = parseInt(el.getAttribute('data-k'), 10), AMBER = C.amber, GREY = '#8d8d8d';
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.2em">' + s + '</tspan>'; };
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 700) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') }, p);
    n.innerHTML = s;
    return n;
  }
  function box(x, y, w, h, label, o) {
    o = o || {};
    A.el('rect', { x: x + 1.5, y: y + 1.5, width: w - 3, height: h - 3, rx: 11, fill: o.fill || '#161616', stroke: o.stroke || '#e8e8e8', 'stroke-width': 3, 'stroke-dasharray': o.dash || 'none' }, el);
    if (label) txt(el, x + w / 2, y + h / 2 + 7, label, { anchor: 'middle', size: 21, fill: o.text || '#fff' });
  }
  function line(pts, o) {                                       // polyline with an arrow head at its end
    o = o || {};
    var d = '', i, n = pts.length, a = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]);
    for (i = 0; i < n; i++) d += (i ? 'L' : 'M') + pts[i][0] + ' ' + pts[i][1];
    A.el('path', { d: d, fill: 'none', stroke: o.col || GREY, 'stroke-width': o.w || 3, 'stroke-dasharray': o.dash || 'none', 'stroke-linejoin': 'round', 'stroke-opacity': o.op || 1 }, el);
    A.el('path', { d: RW.head(pts[n - 1][0], pts[n - 1][1], a, 10), fill: 'none', stroke: o.col || GREY, 'stroke-width': o.w || 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  }
  function track(pts) {                                         // arclength parametrisation of a polyline
    var L = [0], i;
    for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { len: L[L.length - 1], at: function (s) {
      s = A.clamp(s, 0, L[L.length - 1]);
      for (var j = 1; j < pts.length; j++) if (s <= L[j] || j === pts.length - 1) {
        var u = (s - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1]);
        return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u];
      }
    } };
  }
  function dots(n, col, r) { var o = []; for (var i = 0; i < n; i++) o.push(A.el('circle', { r: r || 5.5, fill: col, stroke: '#101010', 'stroke-width': 1.5 }, el)); return o; }
  /** n pulses running along tr at `speed` px/s; gate(k, s) -> opacity (default 1) */
  function run(nodes, tr, t, speed, gate) {
    var gap = tr.len / nodes.length;
    for (var i = 0; i < nodes.length; i++) {
      var s = (((t * speed + i * gap) % tr.len) + tr.len) % tr.len, p = tr.at(s);
      A.set(nodes[i], { cx: p[0].toFixed(1), cy: p[1].toFixed(1) });
      A.show(nodes[i], Math.min(1, s / 10, (tr.len - s) / 10) * (gate ? gate(i, s) : 1));
    }
  }
  // a small stick figure in profile (walk phase ph, optional phase lead for a ghost)
  function figure(col, sw, op) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': sw || 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op || 1 }, el);
    return { g: g, body: A.el('path', {}, g), head: A.el('circle', { r: 6.5, fill: col, stroke: 'none' }, g) };
  }
  function walk(fg, x, y, ph, amp) {
    var TH = 15, SH = 15, TO = 22, AR = 13, hy = y - TH - SH + 1 + 1.2 * Math.abs(Math.cos(ph)), d = '', k;
    amp = amp === undefined ? 1 : amp;
    for (k = 0; k < 2; k++) {
      var p = ph + k * Math.PI, th = 0.5 * amp * Math.sin(p), kn = 0.1 + 0.8 * amp * Math.max(0, Math.cos(p));
      var kx = x + TH * Math.sin(th), ky = hy + TH * Math.cos(th), fx = kx + SH * Math.sin(th - kn), fy = Math.min(y, ky + SH * Math.cos(th - kn));
      d += 'M' + x.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'L' + fx.toFixed(1) + ' ' + fy.toFixed(1);
      var up = -0.45 * amp * Math.sin(p), ex = x + 1.5 + AR * Math.sin(up), ey = hy - TO + 2 + AR * Math.cos(up);
      d += 'M' + (x + 1.5).toFixed(1) + ' ' + (hy - TO + 2).toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + (ex + AR * Math.sin(up + 0.5)).toFixed(1) + ' ' + (ey + AR * Math.cos(up + 0.5)).toFixed(1);
    }
    d += 'M' + x.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + (x + 1.5).toFixed(1) + ' ' + (hy - TO).toFixed(1);
    A.set(fg.body, { d: d }); A.set(fg.head, { cx: x + 2.5, cy: hy - TO - 8 });
  }
  var local = function (f) { return (K > 0 && f.step === K) ? f.ts : f.t; };
  var POL = { fill: C.g, stroke: C.g, text: '#000' };

  // ---------------------------------------------------------------- 0 / 1: reward from the simulator
  if (K === 0 || K === 1) {
    box(0, 6, 118, 54, 'policy', POL);
    box(0, 96, 368, 104, '', { fill: '#0c0c0c' });
    txt(el, 288, 88, 'simulator', { weight: 500, fill: C.mid, anchor: 'end' });
    line([[44, 60], [44, 93]]);
    txt(el, 56, 84, 'action', { weight: 500, fill: C.mid });
    var rp = [[300, 96], [300, 33], [122, 33]];
    line(rp, { col: AMBER, w: 3.5 });
    txt(el, 212, 23, 'reward ' + MI('r'), { fill: AMBER, anchor: 'middle', size: 21 });
    var rtr = track(rp), rd = dots(4, AMBER), fwd = track([[44, 60], [44, 93]]), fd = dots(1, '#fff', 4.5);
    A.el('line', { x1: 14, y1: 187, x2: 354, y2: 187, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
    if (K === 0) {
      A.el('path', { d: 'M326 187V132', stroke: '#d9d9d9', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, el);
      var flag = A.el('path', { d: 'M327 133L352 141L327 150Z', fill: AMBER }, el), me = figure('#fff');
      var gl = txt(el, 338, 122, 'goal', { weight: 500, fill: C.mid, anchor: 'middle' });
      return function draw(f) {
        var t = local(f), u = A.loop(t, 5.2), go = A.clamp(u / 4.2, 0, 1), x = 150 + 150 * go;
        walk(me, x, 186, 2 * Math.PI * u / 0.75, go < 1 ? 1 : 0);
        A.show(me.g, Math.min(1, u / 0.3, (5.2 - u) / 0.3));
        A.set(flag, { fill: go >= 1 ? C.g : AMBER });
        run(rd, rtr, t, 95, function () { return go < 1 ? 1 : 0.15; });                 // reward flows while the character makes progress
        run(fd, fwd, t, 60);
      };
    }
    var ref = figure(C.g, 5, 0.95), sim = figure('#fff'), gapL = A.el('path', { fill: 'none', stroke: AMBER, 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
    var gD = A.el('g', {}, el);
    A.el('circle', { cx: 150, cy: 150, r: 24, fill: '#161616', stroke: '#e8e8e8', 'stroke-width': 3 }, gD);
    txt(gD, 150, 158, MI('D'), { anchor: 'middle', size: 21 });
    A.el('path', { d: 'M108 150H124', stroke: '#e8e8e8', 'stroke-width': 3, 'stroke-linecap': 'round' }, gD);
    var capA = A.el('g', {}, el), capB = A.el('g', {}, el);
    txt(capA, 196, 132, 'tracking', {}); txt(capA, 196, 158, 'distance to a', { weight: 500, fill: C.mid }); txt(capA, 196, 182, 'reference clip', { weight: 500, fill: C.g });
    txt(capB, 196, 132, 'adversarial', {}); txt(capB, 196, 158, 'a discriminator’s', { weight: 500, fill: C.mid }); txt(capB, 196, 182, 'score', { weight: 500, fill: C.mid });
    return function draw(f) {
      var t = local(f), u = A.loop(t, 9), a = A.ramp(u, 4.2, 4.7) - A.ramp(u, 8.5, 9), ph = 2 * Math.PI * t / 0.9;       // a: 0 tracking, 1 adversarial
      var xs = 74 - 14 * a;
      walk(sim, xs, 186, ph, 0.7); walk(ref, 100, 186, ph + 0.5, 1);
      A.show(ref.g, 0.95 * (1 - a)); A.show(gD, a); A.show(capA, 1 - a); A.show(capB, a);
      A.set(gapL, { d: 'M' + (xs + 6) + ' 127H' + (100 - 2) + 'M' + (xs + 4) + ' 157H' + (100 - 5) }); A.show(gapL, 1 - a);
      run(rd, rtr, t, 95); run(fd, fwd, t, 60);
    };
  }

  // ---------------------------------------------------------------- 2: gradient through a learned model
  if (K === 2) {
    var VI = C.violet;
    box(0, 6, 118, 54, 'policy', POL);
    box(232, 6, 136, 54, 'simulator', { stroke: '#6a6a6a', dash: '6 6', fill: '#0c0c0c', text: C.mid });
    box(0, 104, 240, 92, '', { stroke: VI, fill: '#17121d' });
    txt(el, 80, 132, 'learned model', { fill: VI });
    box(280, 122, 88, 56, 'loss', { stroke: AMBER, fill: '#1b1503', text: AMBER });
    var nn = [[150, [156, 178]], [182, [148, 167, 186]], [214, [156, 178]]], i, j, k2;
    for (i = 0; i < nn.length - 1; i++) for (j = 0; j < nn[i][1].length; j++) for (k2 = 0; k2 < nn[i + 1][1].length; k2++)
      A.el('line', { x1: nn[i][0], y1: nn[i][1][j], x2: nn[i + 1][0], y2: nn[i + 1][1][k2], stroke: VI, 'stroke-width': 1.5, 'stroke-opacity': 0.55 }, el);
    nn.forEach(function (c) { c[1].forEach(function (y) { A.el('circle', { cx: c[0], cy: y, r: 5, fill: '#17121d', stroke: VI, 'stroke-width': 2.5 }, el); }); });
    line([[26, 60], [26, 101]]);
    line([[240, 140], [277, 140]]);
    line([[318, 60], [318, 92], [206, 92], [206, 101]], { dash: '5 6', op: 0.9 });
    txt(el, 258, 84, 'data', { weight: 500, fill: C.mid, anchor: 'middle' });
    var gp = [[280, 167], [56, 167], [56, 64]];
    line(gp, { col: AMBER, w: 3.5, dash: '2 7' });
    txt(el, 70, 90, 'gradient', { fill: AMBER });
    var gtr = track(gp), gd = dots(5, AMBER), f1 = track([[26, 60], [26, 101]]), f2 = track([[240, 140], [277, 140]]), d1 = dots(1, '#fff', 4.5), d2 = dots(1, '#fff', 4.5);
    return function draw(f) { var t = local(f); run(gd, gtr, t, 105); run(d1, f1, t, 60); run(d2, f2, t + 0.4, 60); };
  }

  // ---------------------------------------------------------------- 3: a teacher's action is the target
  box(88, 6, 136, 54, 'teacher', { stroke: '#9a9a9a', dash: '6 6', fill: '#1c1c1c' });
  box(88, 140, 136, 54, 'student', POL);
  A.el('circle', { cx: 28, cy: 100, r: 22, fill: '#161616', stroke: '#e8e8e8', 'stroke-width': 3 }, el);
  txt(el, 28, 108, MI('s'), { anchor: 'middle', size: 21 });
  var s1 = [[45, 86], [85, 44]], s2 = [[45, 114], [85, 156]], tp = [[224, 33], [290, 33], [290, 167], [228, 167]];
  line(s1); line(s2); line(tp, { col: AMBER, w: 3.5 });
  txt(el, 302, 92, 'target', { fill: AMBER }); txt(el, 302, 118, 'action', { fill: AMBER });
  var ttr = track(tp), td = dots(4, AMBER), t1 = track(s1), t2 = track(s2), e1 = dots(1, '#fff', 4.5), e2 = dots(1, '#fff', 4.5);
  return function draw(f) { var t = local(f); run(td, ttr, t, 100); run(e1, t1, t, 60); run(e2, t2, t, 60); };
});
