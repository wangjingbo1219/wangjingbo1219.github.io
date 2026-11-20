/* Slide "PHC — primitives" (tools/slides/05a_10_phc.py):  <svg data-anim="phc-grow" viewBox="0 0 1150 300">, directly under the three pipeline boxes.
 * SCHEMATIC, not to scale and without numbers. A dot is a motion sequence of AMASS; green = the primitive above it can imitate it, red = it fails.
 *   step 0   one network on everything: dots turn green, then some keep flipping (learned / forgotten) and the share imitated stops rising
 *            (Luo et al. 2023, Sec. 3.2 and App. C.1 with Fig. 7: the policy learns new sequences while forgetting ones already learned)
 *   step 1   P(1) is frozen and evaluated; the sequences it fails become the training set of P(2) (a copy of P(1)), which learns most of them
 *   step 2   the same again for P(3)
 *   step 3   numbers appear on the slide; the figure rests
 *   step 4   the sequences that still fail are marked: highly dynamic motions (Sec. 5 "Limitations", App. C.2 "Number of primitives")
 * The dot counts (120 -> 24 -> 8 -> 3) only say "smaller every round"; the legend says that the figure is not to scale.
 */
DeckAnim.register('phc-grow', function (el, A) {
  'use strict';
  var C = A.C, K = window.PHCKit, GREEN = K.col(C.g), RED = K.col(C.red), IDLE = K.col('#4a4a4a');
  var PITCH = 22, R = 7.2, PAD = 14, CX = [135, 575, 1015], CYM = 155;          // column centres = centres of the pipeline boxes above
  var T_EVAL = 3.2, EPOCH = 0.9, FLIP = 0.3;                          // step 0: first evaluation, then one every EPOCH seconds
  var rnd = A.rand(11), i, j;

  function panel(cols, rows, cx) { var w = (cols - 1) * PITCH + 2 * PAD, h = (rows - 1) * PITCH + 2 * PAD; return { cols: cols, rows: rows, n: cols * rows, x: cx - w / 2, y: CYM - h / 2, w: w, h: h }; }
  var P = [panel(12, 10, CX[0]), panel(6, 4, CX[1]), panel(4, 2, CX[2])];          // panel 1 is as wide as the box above it
  function slot(p, k) { return [p.x + PAD + (k % p.cols) * PITCH, p.y + PAD + Math.floor(k / p.cols) * PITCH]; }

  // ---- which dot does what (fixed at set-up)
  var N1 = P[0].n, order = [];
  for (i = 0; i < N1; i++) order.push(i);
  for (i = N1 - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
  var kind = [], learnT = [];                                         // 0 learned and kept, 1 unstable (learned, forgotten, learned ...), 2 never learned
  for (i = 0; i < N1; i++) { kind.push(0); learnT.push(0.5 + 2.4 * Math.pow(rnd(), 0.8)); }
  var core = order.slice(0, P[2].n), unst = order.slice(P[2].n, P[2].n + 32), NF = P[1].n - P[2].n;     // 8 never learned; 16 of the 32 unstable fail at any time
  core.forEach(function (d) { kind[d] = 2; }); unst.forEach(function (d) { kind[d] = 1; });
  var ecache = {};
  function failing(e) {                                               // the unstable dots that fail at evaluation e (pure, memoised)
    if (!ecache[e]) {
      var a = unst.map(function (d) { return [K.hash(d, e), d]; }).sort(function (p, q) { return p[0] - q[0]; }), m = {};
      for (var k = 0; k < NF; k++) m[a[k][1]] = 1;
      ecache[e] = m;
    }
    return ecache[e];
  }
  var F1 = {}, f1 = [];                                               // what the frozen P(1) fails: the never-learned + the evaluation at freeze time
  for (i = 0; i < N1; i++) if (kind[i] === 2 || failing(-7)[i]) { F1[i] = 1; f1.push(i); }
  var f2 = [];                                                        // their slots in panel 2 that P(2) still fails (the never-learned ones)
  f1.forEach(function (d, k) { if (kind[d] === 2) f2.push(k); });
  var learn2 = f1.map(function (d) { return kind[d] === 2 ? 1e9 : 2.1 + 2.3 * rnd(); });
  var learn3 = f2.map(function (d, k) { return k % 3 === 1 ? 1e9 : 1.9 + 1.7 * rnd(); });          // three of the eight stay red

  /** step 0: [green, red] share of dot d at time t (the rest is "not learned yet") */
  function st0(d, t) {
    var k = kind[d], on = A.ramp(t, learnT[d], learnT[d] + 0.25);
    if (k === 0) return [on, 0];
    if (k === 2) return [0, A.ramp(t, T_EVAL, T_EVAL + FLIP)];
    if (t < T_EVAL) return failing(0)[d] ? [0, 0] : [on, 0];
    var e = Math.floor((t - T_EVAL) / EPOCH), u = A.ramp(t - T_EVAL - e * EPOCH, 0, FLIP), cur = failing(e)[d] ? 1 : 0;
    if (e === 0) return cur ? [0, u] : [1, 0];
    var bad = A.lerp(failing(e - 1)[d] ? 1 : 0, cur, u);
    return [1 - bad, bad];
  }
  var fcache = {};
  function share(q) {                                                 // share of dots that are green at time q / 10 (memoised on a 0.1 s grid)
    if (fcache[q] === undefined) { var s = 0; for (var d = 0; d < N1; d++) s += st0(d, q / 10)[0]; fcache[q] = s / N1; }
    return fcache[q];
  }
  function fill(n, g, r) { K.attr(n, 'fill', K.mix([[1 - g - r, IDLE], [g, GREEN], [r, RED]])); }

  // ---- static parts
  var gP = [], frames = [], arrows = [], labs = [], caps = [], locks = [], pulses = [];
  var CAP = ['all of AMASS', 'what ' + K.prim(1) + ' fails', 'what ' + K.prim(2) + ' fails'];
  for (i = 0; i < 3; i++) {
    var p = P[i], g = A.el('g', {}, el);
    gP.push(g);
    frames.push(A.el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, rx: 12, fill: '#0c0c0c', stroke: '#3d3d3d', 'stroke-width': 2 }, g));
    var ya = p.y - 6, ym = (ya - 12) / 2 + 7;
    A.el('path', { d: 'M' + CX[i] + ' ' + ya + 'V-9', stroke: '#b4b4b4', 'stroke-width': 2.4, fill: 'none' }, g);
    A.el('path', { d: K.head(CX[i], -12, -Math.PI / 2, 9), stroke: '#b4b4b4', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    labs.push(K.text(A, g, CX[i] + 16, ym, 'trains on', { fill: C.mid }));
    var lk = A.el('g', { transform: 'translate(' + (CX[i] + 16) + ' ' + (ym - 17) + ')' }, g);
    A.el('rect', { x: 0, y: 8, width: 15, height: 11, rx: 2.5, fill: '#b4b4b4' }, lk);
    A.el('path', { d: 'M3.2 8V5.2a4.3 4.3 0 0 1 8.6 0V8', stroke: '#b4b4b4', 'stroke-width': 2.4, fill: 'none' }, lk);
    K.text(A, lk, 23, 17, 'frozen', { fill: C.mid });
    locks.push(lk);
    caps.push(K.text(A, g, CX[i], p.y + p.h + 27, CAP[i], { anchor: 'middle', fill: C.mid }));
    pulses.push([A.el('circle', { r: 4.2, fill: '#fff', cx: CX[i] }, g), A.el('circle', { r: 4.2, fill: '#fff', cx: CX[i] }, g)]);
  }
  var d1 = [], ring1 = [], d2 = [], d3 = [], ring3 = [];
  for (i = 0; i < N1; i++) { var s = slot(P[0], i); d1.push(A.el('circle', { cx: s[0], cy: s[1], r: R }, gP[0])); }
  f1.forEach(function (d) { var s = slot(P[0], d); ring1.push(A.el('circle', { cx: s[0], cy: s[1], r: R + 3.4, fill: 'none', stroke: C.red, 'stroke-width': 2 }, gP[0])); });
  var gM2 = A.el('g', {}, el), gM3 = A.el('g', {}, el);
  f1.forEach(function () { d2.push(A.el('circle', { r: R }, gM2)); });
  f2.forEach(function (d, k) {
    d3.push(A.el('circle', { r: R }, gM3));
    ring3.push(learn3[k] > 1e8 ? A.el('circle', { r: R + 3.8, fill: 'none', stroke: C.red, 'stroke-width': 2.2, cx: slot(P[2], k)[0], cy: slot(P[2], k)[1] }, gM3) : null);
  });
  var gLeft = A.el('g', {}, el);
  K.text(A, gLeft, CX[2], 238, 'still failing:', { anchor: 'middle', fill: C.red, weight: 700 });
  K.text(A, gLeft, CX[2], 265, 'high jumps, backflips', { anchor: 'middle', weight: 700 });
  // legend
  A.el('circle', { cx: 318, cy: 288, r: R, fill: C.g }, el); K.text(A, el, 333, 295, 'imitated', { fill: C.mid });
  A.el('circle', { cx: 438, cy: 288, r: R, fill: C.red }, el); K.text(A, el, 453, 295, 'fails', { fill: C.mid });
  K.text(A, el, 524, 295, 'a dot is a motion sequence · schematic, not to scale', { fill: C.mute });

  // ---- step 0 only: the share of sequences the single network can imitate, over training time
  var X0 = 478, X1 = 1128, YB = 236, YT = 80, WIN = 14;
  var gC = A.el('g', {}, el);
  A.el('path', { d: 'M' + X0 + ' ' + (YT - 12) + 'V' + YB + 'H' + (X1 + 8), stroke: C.line, 'stroke-width': 2, fill: 'none' }, gC);
  A.el('path', { d: 'M' + X0 + ' ' + YT + 'H' + X1, stroke: '#5a5a5a', 'stroke-width': 2, 'stroke-dasharray': '3 7', fill: 'none' }, gC);
  K.text(A, gC, X0 + 12, YT - 12, 'all sequences', { fill: C.mute });
  K.text(A, gC, X1 + 8, YB + 27, 'training time \u2192', { fill: C.mute, anchor: 'end' });            // the arrows say which axis a label belongs to
  K.text(A, gC, X0 + 12, YB + 27, '\u2191 share of the sequences it can imitate', { fill: C.mid });
  var curve = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gC);
  var now = A.el('circle', { r: 7, fill: C.g, stroke: '#101010', 'stroke-width': 2 }, gC);
  var plat = K.text(A, gC, 0, 0, 'no longer improving', { fill: '#fff', weight: 700, anchor: 'end', halo: true });

  function fly(n, a, b, u) {                                          // a dot on its way from one panel to the next, on a shallow arc
    K.attr(n, 'cx', A.lerp(a[0], b[0], u).toFixed(1)); K.attr(n, 'cy', (A.lerp(a[1], b[1], u) - 30 * Math.sin(Math.PI * u)).toFixed(1));
  }
  function arrow(k, vis, train, frozen, t) {
    A.show(gP[k], vis);
    A.show(labs[k], frozen ? 0 : 1); A.show(locks[k], frozen ? 1 : 0);
    var y0 = P[k].y - 8, len = y0 + 8;
    for (var q = 0; q < 2; q++) {
      var s = A.loop(t * 60 + q * len / 2, len);
      K.attr(pulses[k][q], 'cy', (y0 - s).toFixed(1));
      A.show(pulses[k][q], train ? Math.min(1, s / 8, (len - s) / 8) : 0);
    }
  }

  return function draw(f) {
    var st = f.step, ts = f.ts, t = f.t, d, k, u, a;
    // ---- panel 1
    var tc = Math.max(0, t - ts), set = st === 1 ? A.ramp(ts, 0, 0.4) : 1;
    for (d = 0; d < N1; d++) {
      if (st === 0) a = st0(d, t);
      else { a = F1[d] ? [0, 1] : [1, 0]; if (set < 1) { var b = st0(d, tc); a = [A.lerp(b[0], a[0], set), A.lerp(b[1], a[1], set)]; } }
      fill(d1[d], a[0], a[1]);
    }
    var rg = st === 1 ? A.ramp(ts, 0.3, 0.6) * (1 - A.ramp(ts, 1.7, 2.1)) : 0;
    for (k = 0; k < ring1.length; k++) A.show(ring1[k], rg);
    arrow(0, 1, st === 0 && t > 0.3, st >= 1, t);                        // the single network keeps training while it plateaus

    // ---- panel 2: what P(1) fails, learned by P(2)
    var v2 = st < 1 ? 0 : (st === 1 ? A.ramp(ts, 0.4, 0.8) : 1);
    A.show(gM2, v2);
    for (k = 0; k < d2.length; k++) {
      u = st === 1 ? A.ease(A.ramp(ts, 0.7 + 0.016 * k, 1.5 + 0.016 * k)) : 1;
      fly(d2[k], slot(P[0], f1[k]), slot(P[1], k), u);
      var g2 = st === 1 ? A.ramp(ts, learn2[k], learn2[k] + 0.3) : (learn2[k] > 1e8 ? 0 : 1);
      fill(d2[k], g2, 1 - g2);
    }
    arrow(1, v2, st === 1 && ts > 1.9 && ts < 4.7, st >= 2, ts);

    // ---- panel 3: what P(2) fails, learned by P(3)
    var v3 = st < 2 ? 0 : (st === 2 ? A.ramp(ts, 0.4, 0.8) : 1);
    A.show(gM3, v3);
    for (k = 0; k < d3.length; k++) {
      u = st === 2 ? A.ease(A.ramp(ts, 0.7 + 0.03 * k, 1.5 + 0.03 * k)) : 1;
      fly(d3[k], slot(P[1], f2[k]), slot(P[2], k), u);
      var g3 = st === 2 ? A.ramp(ts, learn3[k], learn3[k] + 0.3) : (learn3[k] > 1e8 ? 0 : 1);
      fill(d3[k], g3, 1 - g3);
      if (ring3[k]) {
        A.show(ring3[k], st >= 4 ? A.ramp(ts, 0, 0.4) : 0);
        K.attr(ring3[k], 'r', (R + 3.8 + 1.6 * Math.sin(4 * ts)).toFixed(1));
      }
    }
    arrow(2, v3, st === 2 && ts > 1.7 && ts < 3.9, false, ts);
    A.show(gLeft, st >= 4 ? A.ramp(ts, 0.1, 0.6) : 0);

    // ---- the plateau chart (step 0; it leaves when the second primitive arrives)
    var vc = st === 0 ? 1 : (st === 1 ? 1 - A.ramp(ts, 0, 0.35) : 0);
    A.show(gC, vc);
    if (vc > 0) {
      // The chart is complete once the curve reaches its right end (WIN seconds): it then rests there, with the rise and the plateau both
      // in view, however long the slide stays on this step. (It used to scroll, and the rise left the picture.) The dots keep flipping.
      var tt = Math.min(st === 0 ? t : tc, WIN), q1 = Math.floor(tt * 10), pts = [], X = function (x) { return X0 + (X1 - X0) * x / WIN; };
      for (var q = 0; q <= q1; q++) pts.push([X(q / 10), YB - (YB - YT) * share(q)]);
      var sh = 0; for (d = 0; d < N1; d++) sh += st0(d, tt)[0];
      var hx = X(tt), hy = YB - (YB - YT) * sh / N1;
      pts.push([hx, hy]);
      A.set(curve, { d: A.path(pts) }); A.set(now, { cx: hx.toFixed(1), cy: hy.toFixed(1) });
      A.set(plat, { x: (hx - 14).toFixed(1), y: (hy + 36).toFixed(1) }); A.show(plat, A.ramp(tt, 5.2, 5.9));       // under the curve: the space above belongs to the dashed line
    }
  };
});
