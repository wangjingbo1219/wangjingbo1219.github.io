/* NCP, slide "NCP — how", example panel of clicks 1 and 2 (tools/slides/03b_20_ncp.py).   <svg data-anim="ncp-vq" viewBox="0 0 332 249">
 *
 * SCHEMATIC of the discrete bottleneck (Zhu et al. 2023, Sec. 5.2, Eq. 2). No data: twelve codes in a plane stand for the K = 256 or 512 codes in 64-d.
 *   grey dots     the codes e_1 .. e_K of the codebook; the thin lines are the borders between "nearest to this code" regions
 *                 (the line under the plane says so until click 2, then it becomes the legend of the prior)
 *   white dot     the encoder's output z^e: it moves continuously, one value per control step
 *   green         the nearest code e_k and its region: this code, not z^e, is what the decoder receives. It changes only when z^e crosses a border.
 *   from click 2  amber discs: the probability the prior pi^p(k | s) gives to each code (disc area). The prior is distilled from the encoder's
 *                 picks (Sec. 6.1, Eq. 8), so its probability sits on and around the code the encoder picks; it is spread out because the prior
 *                 does not see the future clip frames.
 * draw(f) is a pure function of (f.t, f.step, f.ts). The panel is revealed at click 1.
 */
DeckAnim.register('ncp-vq', function (el, A) {
  'use strict';
  var C = A.C, X0 = 8, X1 = 324, Y0 = 8, Y1 = 208, T = 24, SIG = 46;
  var CODES = [[46, 48], [122, 34], [208, 46], [284, 38], [64, 110], [142, 98], [202, 120], [278, 104], [44, 170], [120, 176], [208, 182], [286, 168]];
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.25em">' + s + '</tspan>'; };
  var SUP = function (s, up) { return '<tspan dy="' + (up ? -9 : 6) + '" style="font-family:' + A.MATH + ';font-style:italic;font-size:.82em">' + s + '</tspan>'; };

  // region of the plane that is nearer to code i than to any other code: the frame clipped by the bisector to every other code
  function cell(i) {
    var poly = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], a = CODES[i];
    for (var j = 0; j < CODES.length && poly.length; j++) {
      if (j === i) continue;
      var b = CODES[j], nx = b[0] - a[0], ny = b[1] - a[1], c = (b[0] * b[0] + b[1] * b[1] - a[0] * a[0] - a[1] * a[1]) / 2, out = [];
      for (var k = 0; k < poly.length; k++) {
        var p = poly[k], q = poly[(k + 1) % poly.length], dp = nx * p[0] + ny * p[1] - c, dq = nx * q[0] + ny * q[1] - c;
        if (dp <= 0) out.push(p);
        if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { var u = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]); }
      }
      poly = out;
    }
    return poly;
  }
  var CELLS = CODES.map(function (c, i) { return A.path(cell(i)) + 'Z'; });
  function ze(t) {                                   // the encoder output: a smooth closed path through the plane
    var th = 2 * Math.PI * t / T;
    return [166 + 114 * Math.sin(2 * th + 0.5), 108 + 66 * Math.sin(3 * th)];
  }
  function nearest(p) {
    var best = 0, bd = 1e9;
    for (var i = 0; i < CODES.length; i++) { var d = Math.hypot(CODES[i][0] - p[0], CODES[i][1] - p[1]); if (d < bd) { bd = d; best = i; } }
    return best;
  }

  A.el('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, rx: 10, fill: '#0b0b0b', stroke: '#2a2a2a', 'stroke-width': 1.5 }, el);
  CELLS.forEach(function (d) { A.el('path', { d: d, fill: 'none', stroke: '#2a2a2a', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, el); });
  var hot = A.el('path', { fill: C.g, 'fill-opacity': 0.17, stroke: C.g, 'stroke-opacity': 0.6, 'stroke-width': 2, 'stroke-linejoin': 'round' }, el);
  var discs = CODES.map(function (c) { return A.el('circle', { cx: c[0], cy: c[1], r: 0, fill: C.amber, 'fill-opacity': 0.24, stroke: C.amber, 'stroke-width': 2 }, el); });
  var trail = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-opacity': 0.34, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var snap = A.el('line', { stroke: C.g, 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var dots = CODES.map(function (c) { return A.el('circle', { cx: c[0], cy: c[1], r: 5.5, fill: '#8d8d8d', stroke: '#101010', 'stroke-width': 1.5 }, el); });
  var zdot = A.el('circle', { r: 7, fill: '#fff', stroke: '#101010', 'stroke-width': 2 }, el);
  var zl = A.text(el, 0, 0, '', { size: 21, anchor: 'middle' }); zl.innerHTML = MI('z') + SUP('e', true);
  var el_ = A.text(el, 0, 0, '', { size: 21, fill: C.g, anchor: 'middle' }); el_.innerHTML = MI('e') + SUP('k', false);
  var leg0 = A.el('g', {}, el), leg = A.el('g', {}, el);
  A.el('circle', { cx: 24, cy: 230, r: 5.5, fill: '#8d8d8d' }, leg0);
  A.text(leg0, 42, 237, 'the K codes of the codebook', { size: 20, fill: C.mid, weight: 500, halo: false });
  A.el('circle', { cx: 24, cy: 230, r: 9, fill: C.amber, 'fill-opacity': 0.24, stroke: C.amber, 'stroke-width': 2 }, leg);
  A.text(leg, 42, 237, 'prior: a probability per code', { size: 20, fill: C.amber, weight: 500, halo: false });

  return function draw(f) {
    var t = f.t, p = ze(t), k = nearest(p), c = CODES[k], i;
    A.set(hot, { d: CELLS[k] });
    A.set(snap, { x1: p[0].toFixed(1), y1: p[1].toFixed(1), x2: c[0], y2: c[1] });
    var tr = [];
    for (i = 0; i <= 14; i++) tr.push(ze(t - 1.5 * (1 - i / 14)));
    A.set(trail, { d: A.path(tr) });
    for (i = 0; i < CODES.length; i++) A.set(dots[i], { r: i === k ? 8.5 : 5.5, fill: i === k ? C.g : '#8d8d8d' });
    A.set(zdot, { cx: p[0].toFixed(1), cy: p[1].toFixed(1) });
    // labels: z^e beyond the point on the side away from the chosen code, e_k beyond the code on the side away from the point
    var dx = p[0] - c[0], dy = p[1] - c[1], dl = Math.hypot(dx, dy), b = A.ramp(dl, 3, 16);
    dx = A.lerp(0.9, dx / Math.max(dl, 1e-3), b); dy = A.lerp(-0.44, dy / Math.max(dl, 1e-3), b); dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
    A.set(zl, { x: A.clamp(p[0] + 25 * dx, X0 + 16, X1 - 18).toFixed(1), y: A.clamp(p[1] + 23 * dy + 7, Y0 + 20, Y1 - 6).toFixed(1) });
    A.set(el_, { x: A.clamp(c[0] - 27 * dx, X0 + 16, X1 - 18).toFixed(1), y: A.clamp(c[1] - 25 * dy + 6, Y0 + 20, Y1 - 10).toFixed(1) });
    // the prior: a categorical distribution over the codes, fitted to the encoder's pick
    var on = f.step > 2 ? 1 : (f.step === 2 ? A.ease(A.ramp(f.ts, 0, 0.7)) : 0), w = [], sum = 0;
    for (i = 0; i < CODES.length; i++) {
      var d2 = (CODES[i][0] - p[0]) * (CODES[i][0] - p[0]) + (CODES[i][1] - p[1]) * (CODES[i][1] - p[1]);
      w.push(Math.exp(-d2 / (2 * SIG * SIG))); sum += w[i];
    }
    for (i = 0; i < CODES.length; i++) { A.set(discs[i], { r: (on * 30 * Math.sqrt(w[i] / sum)).toFixed(1) }); A.show(discs[i], on); }
    // the line under the plane: the old legend leaves before the new one arrives (the two never overlap)
    var lo = f.step > 2 ? 1 : (f.step === 2 ? A.ramp(f.ts, 0.35, 0.7) : 0), l0 = f.step > 2 ? 0 : (f.step === 2 ? 1 - A.ramp(f.ts, 0, 0.3) : 1);
    A.show(leg, lo); A.show(leg0, l0);
  };
});
