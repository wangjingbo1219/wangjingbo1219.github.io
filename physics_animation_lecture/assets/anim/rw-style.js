/* Slide "The style reward: a learned judge" (AMP, Peng et al. 2021, section 5.2).   <svg data-anim="rw-style" viewBox="0 0 1740 400">
 * A SCHEMATIC, not a simulation: two sources of transitions (s, s') feed a discriminator; every transition comes out as a score that
 * lands on the score axis; the reward curve r = max[0, 1 - 0.25 (D - 1)^2] is exact.
 * Steps: 0 untrained discriminator: both sources score around 0 (it cannot tell them apart)
 *        1 trained by least squares: dataset -> +1, policy -> -1
 *        2 the reward curve; a probe sweeps D from -1 to +1 and back
 *        3 the policy starts to move like the data: its scores, and its reward, rise (the discriminator is less sure about both sources)
 *        4 final state (the bottom of the slide brings the task reward in)
 * Score clusters are illustrative (Gaussian samples); only their targets (-1, +1) and the curve come from the paper.
 */
DeckAnim.register('rw-style', function (el, A) {
  'use strict';
  var C = A.C, RW = window.RW, GREEN = C.g, AMBER = C.amber;
  var T = function (x, y, s, o) { return A.text(el, x, y, s, o); };
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.18em">' + s + '</tspan>'; };

  // ---------- left: the two sources and the discriminator
  var BOX = [{ y: 0, col: GREEN, name: 'Motion dataset', sub: 'mocap clips' }, { y: 212, col: AMBER, name: 'Policy', sub: 'in the simulator' }];
  var walker = [];
  BOX.forEach(function (b) {
    A.el('rect', { x: 1.5, y: b.y + 1.5, width: 297, height: 185, rx: 16, fill: '#101010', stroke: b.col, 'stroke-width': 3 }, el);
    T(20, b.y + 36, b.name, { size: 24, fill: b.col, halo: false });
    T(20, b.y + 64, b.sub, { size: 20, weight: 500, fill: C.mid, halo: false });
    A.el('line', { x1: 176, y1: b.y + 172, x2: 286, y2: b.y + 172, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
    var g = A.el('g', { fill: 'none', stroke: b.col, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    walker.push({ far: A.el('path', { 'stroke-opacity': 0.5 }, g), near: A.el('path', {}, g), head: A.el('circle', { r: 12, fill: b.col, stroke: 'none' }, g), y: b.y + 170 });
  });
  var PATHS = [[[300, 94], [384, 94], [366, 180], [446, 180]], [[300, 306], [384, 306], [366, 220], [446, 220]]];
  PATHS.forEach(function (p, i) {
    A.el('path', { d: 'M' + p[0] + 'C' + p[1] + ' ' + p[2] + ' ' + p[3], fill: 'none', stroke: BOX[i].col, 'stroke-width': 3, 'stroke-opacity': 0.55 }, el);
    A.el('path', { d: RW.head(p[3][0] + 2, p[3][1], 0, 12), fill: 'none', stroke: BOX[i].col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  });
  var lab = A.el('text', { x: 322, y: 208, style: 'font:500 21px ' + A.FONT + ';fill:' + C.mid }, el);
  lab.innerHTML = MI('(s, s′)');
  A.el('rect', { x: 451.5, y: 120, width: 248, height: 160, rx: 16, fill: '#161616', stroke: '#e8e8e8', 'stroke-width': 3 }, el);
  T(575, 188, 'Discriminator', { size: 25, anchor: 'middle', halo: false });
  var dl = A.el('text', { x: 575, y: 232, 'text-anchor': 'middle', style: 'font:500 23px ' + A.FONT + ';fill:#fff' }, el);
  dl.innerHTML = MI('D(s, s′)');
  T(712, 186, 'score', { size: 20, weight: 500, fill: C.mid, halo: false });

  // ---------- right: score axis, dot strip, reward curve
  var XL = 962, XR = 1722, YB = 284, YT = 50, DMIN = -1.6, DMAX = 1.6, RMAX = 1.42;
  var X = function (d) { return XL + (XR - XL) * (d - DMIN) / (DMAX - DMIN); }, Y = function (r) { return YB - (YB - YT) * r / RMAX; };
  var rOf = function (d) { return Math.max(0, 1 - 0.25 * (d - 1) * (d - 1)); };
  A.el('line', { x1: XL, y1: YB, x2: XR, y2: YB, stroke: '#6a6a6a', 'stroke-width': 2.5 }, el);
  [-1, 0, 1].forEach(function (d) {
    A.el('line', { x1: X(d), y1: YB, x2: X(d), y2: YB + 64, stroke: '#333', 'stroke-width': 2, 'stroke-dasharray': '3 6' }, el);
    T(X(d), YB + 88, (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d), { size: 21, weight: 500, fill: C.mid, anchor: 'middle', halo: false });
  });
  var xt = A.el('text', { x: (XL + XR) / 2, y: YB + 113, 'text-anchor': 'middle', style: 'font:700 21px ' + A.FONT + ';fill:' + C.mid }, el);
  xt.innerHTML = 'discriminator score ' + MI('D(s, s′)');
  // targets (step 1)
  var gT = A.el('g', {}, el);
  [[-1, AMBER, 'looks like the policy'], [1, GREEN, 'looks like the data']].forEach(function (q) {
    A.el('line', { x1: X(q[0]), y1: YT + 34, x2: X(q[0]), y2: YB, stroke: q[1], 'stroke-width': 2.5, 'stroke-dasharray': '4 7', 'stroke-opacity': 0.8 }, gT);
    A.text(gT, X(q[0]), YT + 22, q[2], { size: 21, fill: q[1], anchor: 'middle' });
  });
  var gU = A.el('g', {}, el);                                    // step 0: what the dots show
  A.text(gU, X(0), YB - 26, 'untrained: it cannot tell them apart', { size: 21, weight: 500, fill: C.mid, anchor: 'middle' });
  // reward axis + curve (step 2)
  var gR = A.el('g', {}, el);
  A.el('line', { x1: XL, y1: YT + 34, x2: XL, y2: YB, stroke: '#6a6a6a', 'stroke-width': 2.5 }, gR);
  [0.5, 1].forEach(function (r) {
    A.el('line', { x1: XL, y1: Y(r), x2: XR, y2: Y(r), stroke: C.grid, 'stroke-width': 2 }, gR);
    A.text(gR, XL - 12, Y(r) + 7, String(r), { size: 20, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  });
  A.text(gR, XL - 12, YB + 7, '0', { size: 20, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  var yl = A.el('text', { transform: 'translate(' + (XL - 62) + ' ' + ((YB + YT + 34) / 2) + ') rotate(-90)', 'text-anchor': 'middle', style: 'font:700 21px ' + A.FONT + ';fill:' + C.mid }, gR);
  yl.innerHTML = 'style reward ' + MI('r');
  var pts = [], n = 160, i;
  for (i = 0; i <= n; i++) { var d0 = DMIN + (DMAX - DMIN) * i / n; pts.push([X(d0), Y(rOf(d0))]); }
  var curve = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gR);
  var gE = A.el('g', {}, gR);                                   // the two ends of the curve
  A.el('circle', { cx: X(-1), cy: Y(0), r: 8, fill: AMBER, stroke: '#101010', 'stroke-width': 2.5 }, gE);
  A.el('circle', { cx: X(1), cy: Y(1), r: 8, fill: GREEN, stroke: '#101010', 'stroke-width': 2.5 }, gE);
  var e0 = A.text(gE, X(-1) - 14, Y(0) - 14, '', { size: 21, fill: AMBER, anchor: 'end' }); e0.innerHTML = MI('r') + ' = 0';
  var e1 = A.text(gE, X(1) + 16, Y(1) + 34, '', { size: 21, fill: GREEN }); e1.innerHTML = MI('r') + ' = 1';
  // probe
  var gP = A.el('g', {}, el);
  var pDrop = A.el('line', { stroke: '#fff', 'stroke-width': 2.5, 'stroke-opacity': 0.6 }, gP);
  var pDot = A.el('circle', { r: 11, fill: '#fff', stroke: '#101010', 'stroke-width': 3 }, gP);
  var pLab = A.text(gP, 0, 0, '', { size: 26 });
  pLab.style.fontVariantNumeric = 'tabular-nums';

  // ---------- tokens: a transition goes in, a score comes out
  var EVERY = 0.3, TRAVEL = 0.9, INSIDE = 0.2, FLY = 0.9, LIFE = 7.0, NT = Math.ceil((LIFE + 0.6) / EVERY) + 2;
  var tok = [], dotN = [];
  for (i = 0; i < NT; i++) {
    var g = A.el('g', {}, el);
    A.el('rect', { x: -13, y: -13, width: 17, height: 17, rx: 3, fill: '#101010', 'stroke-width': 2.5 }, g);
    A.el('rect', { x: -4, y: -4, width: 17, height: 17, rx: 3, fill: '#101010', 'stroke-width': 2.5 }, g);
    tok.push(g);
    dotN.push(A.el('circle', { r: 6.2, stroke: '#101010', 'stroke-width': 1.5 }, el));
  }
  function bez(p, u) {
    var v = 1 - u;
    return [v * v * v * p[0][0] + 3 * v * v * u * p[1][0] + 3 * v * u * u * p[2][0] + u * u * u * p[3][0],
            v * v * v * p[0][1] + 3 * v * v * u * p[1][1] + 3 * v * u * u * p[2][1] + u * u * u * p[3][1]];
  }
  var learn = function (ts) { return A.ease(A.ramp(ts, 0.6, 6.6)); };
  function score(idx, src, step, ts) {                          // deterministic sample for token idx; every dot follows the current state of D and of the policy
    var z = A.gauss(A.rand(idx * 7919 + 13)), raw = 0.26 * z;
    var at = function (a) { return src === 0 ? (1 - 0.3 * a) + 0.15 * z : (-1 + 0.9 * a) + (0.17 + 0.03 * a) * z; };
    var d = step === 0 ? raw : step === 1 ? A.lerp(raw, at(0), A.ease(A.ramp(ts, 0.3, 2.0))) : step === 2 ? at(0) : step === 3 ? at(learn(ts)) : at(1);
    return A.clamp(d, -1.52, 1.52);
  }
  // stick figure walking on the spot: a = 0 awkward (an untrained policy), a = 1 natural
  function pose(w, t, a) {
    var ps = 2 * Math.PI * t / 1.15, L = A.lerp, x0 = 232, y0 = w.y, TH = 34, SH = 34, TO = 48, UA = 26, LA = 26;
    function leg(ph) {
      var th = L(0.22 * Math.sin(2.3 * ph + 0.4), 0.46 * Math.sin(ph), a), kn = L(0.06, 0.1 + 0.85 * Math.max(0, Math.cos(ph)), a);
      return [th, kn];
    }
    function arm(ph, k) {
      var up = L(2.3 + 0.5 * Math.sin(2.9 * ph + k), -0.42 * Math.sin(ph), a), el2 = L(0.9 + 0.5 * Math.sin(3.3 * ph + 2 * k), 0.35 + 0.15 * Math.sin(ph), a);
      return [up, el2];
    }
    var lean = L(-0.24 + 0.1 * Math.sin(2.3 * ps), 0.07, a), bob = L(3 * Math.sin(4.6 * ps), 2.5 * Math.abs(Math.cos(ps)), a);
    var l1 = leg(ps), l2 = leg(ps + Math.PI), hipY = y0 - (TH + SH) + 4 + bob, hx = x0;
    var sx = hx + TO * Math.sin(lean), sy = hipY - TO * Math.cos(lean);
    function legPath(q) {
      var kx = hx + TH * Math.sin(q[0]), ky = hipY + TH * Math.cos(q[0]), fa = q[0] - q[1];
      var fx = kx + SH * Math.sin(fa), fy = Math.min(y0, ky + SH * Math.cos(fa));
      return 'M' + hx.toFixed(1) + ' ' + hipY.toFixed(1) + 'L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'L' + fx.toFixed(1) + ' ' + fy.toFixed(1) + 'l9 0';
    }
    function armPath(q) {
      var ex = sx + UA * Math.sin(q[0]), ey = sy + UA * Math.cos(q[0]), fa = q[0] + q[1];
      return 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + (ex + LA * Math.sin(fa)).toFixed(1) + ' ' + (ey + LA * Math.cos(fa)).toFixed(1);
    }
    A.set(w.far, { d: legPath(l2) + armPath(arm(ps, 0.7)) });
    A.set(w.near, { d: legPath(l1) + 'M' + hx.toFixed(1) + ' ' + hipY.toFixed(1) + 'L' + sx.toFixed(1) + ' ' + sy.toFixed(1) + armPath(arm(ps + Math.PI, 2.1)) });
    A.set(w.head, { cx: sx + 16 * Math.sin(lean), cy: sy - 16 * Math.cos(lean) });
  }

  return function draw(f) {
    var t = f.t, step = f.step, ts = f.ts, k;
    // walkers
    pose(walker[0], t, 1);
    pose(walker[1], t + 0.3, step < 3 ? 0 : (step > 3 ? 1 : learn(ts)));
    // chart layers
    A.show(gU, step === 0 ? 1 : (step === 1 ? 1 - A.ramp(ts, 0, 0.4) : 0));
    A.show(gT, step === 1 ? A.ramp(ts, 0.2, 0.8) : (step > 1 ? 1 : 0));
    A.show(gR, step === 2 ? A.ramp(ts, 0, 0.5) : (step > 2 ? 1 : 0));
    var grow = step === 2 ? A.ease(A.ramp(ts, 0.3, 1.5)) : 1;
    A.set(curve, { d: A.path(pts.slice(0, Math.max(2, Math.round(grow * n) + 1))) });
    A.show(gE, step === 2 ? A.ramp(ts, 1.4, 1.9) : 1);
    // probe
    var pd = null;
    if (step === 2 && ts > 1.9) pd = -Math.cos(2 * Math.PI * (ts - 1.9) / 7);
    else if (step === 3) pd = -1 + 0.9 * learn(ts);
    else if (step > 3) pd = -0.1;
    if (pd === null) A.show(gP, 0);
    else {
      var pr = rOf(pd);
      A.show(gP, step === 2 ? A.ramp(ts, 1.9, 2.3) : 1);
      A.set(pDot, { cx: X(pd), cy: Y(pr) }); A.set(pDrop, { x1: X(pd), y1: Y(pr), x2: X(pd), y2: YB });
      // label above the curve, clear of the "r = 0" mark and of the reward axis
      A.set(pLab, { x: Math.max(X(pd) - 16, XL + 14 + (step >= 3 ? 204 : 108)), y: Y(pr) - 16 - 38 * (1 - A.ramp(pd, -1, -0.5)), 'text-anchor': 'end' });
      pLab.innerHTML = (step >= 3 ? 'policy: ' : '') + MI('r') + ' = ' + pr.toFixed(2);
    }
    // tokens
    var i1 = Math.floor(t / EVERY), landed = [], rows = [];
    for (k = 0; k < NT; k++) {
      var idx = i1 - k, te = idx * EVERY, age = t - te, src = ((idx % 2) + 2) % 2, node = tok[k], dn = dotN[k];
      if (age > LIFE + 0.5) { A.show(node, 0); A.show(dn, 0); continue; }
      var col = src === 0 ? GREEN : AMBER;
      if (age < TRAVEL) {
        var p = bez(PATHS[src], A.ease(age / TRAVEL));
        node.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')');
        node.setAttribute('stroke', col);
        A.show(node, Math.min(1, age / 0.15, (TRAVEL - age) / 0.12)); A.show(dn, 0);
        continue;
      }
      A.show(node, 0);
      var a2 = age - TRAVEL - INSIDE;
      if (a2 < 0) { A.show(dn, 0); continue; }
      landed.push({ dn: dn, x: X(score(idx, src, step, ts)), a2: a2, col: col, age: age, idx: idx });
    }
    landed.sort(function (p, q) { return p.idx - q.idx; });                 // oldest first: they sit nearest to the axis
    landed.forEach(function (L) {
      var row = 0, ok = false, j;
      while (!ok) {                                                         // lowest row with room at this x
        ok = true; rows[row] = rows[row] || [];
        for (j = 0; j < rows[row].length; j++) if (Math.abs(rows[row][j] - L.x) < 13.5) { ok = false; break; }
        if (!ok) row++;
      }
      rows[row].push(L.x);
      var ty = YB + 11 + row * 13, x = L.x, y = ty;
      if (L.a2 < FLY) {
        var u = A.ease(L.a2 / FLY), v = 1 - u, cx = 820, cy = 400;          // dips under the chart first: the path stays clear of the reward axis and its tick labels
        x = v * v * 704 + 2 * v * u * cx + u * u * L.x; y = v * v * 200 + 2 * v * u * cy + u * u * ty;
      }
      A.set(L.dn, { cx: x.toFixed(1), cy: y.toFixed(1), fill: L.col });
      A.show(L.dn, row > 4 ? 0 : Math.min(1, (LIFE + 0.5 - L.age) / 0.5));
    });
  };
});
