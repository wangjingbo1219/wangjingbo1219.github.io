/* ControlVAE: the latent space as a SCHEMATIC plane (two of the 64 latent dimensions, no numbers).
 *   <svg data-anim="controlvae-latent" data-mode="train|task" data-at="K" viewBox="0 0 417 235">     data-at = the click at which the tile appears
 *
 * mode "train" (Sec. 3.1-3.2 of the paper)
 *   green disc    the state-conditional prior p(z | s) = N(mu_p(s), sigma_p^2 I): its centre travels as the state changes (Eq. 3)
 *   white disc    the encoder q(z | s, s~') = N(mu_p + mu_q, sigma_p^2 I): same radius, centre shifted by the residual mu_q (Eq. 7, 8)
 *   amber arrow   the residual mu_q; the bar under the plane is the KL term, |mu_q|^2 / (2 sigma_p^2): it grows with the SQUARE of the arrow (Eq. 9)
 *   white dot     z, drawn from the encoder once per control step
 * mode "task" (Sec. 4.2)
 *   the same prior, frozen (grey, dashed); the task policy pi(z | s, g) = N(mu_p + mu_g, sigma^2 I) (green disc, Eq. 21): the goal g sets the offset mu_g.
 *   The goal marker in the corner turns every few seconds; each goal has an offset of its own (another direction, another length), and the disc
 *   moves to it. The four offsets are illustrative: the latent directions are not the walking directions.
 * When the tile appears (click data-at) the shifted disc grows out of the prior.
 * Lengths, directions and paths are illustrative; only the structure (same radius, mean = prior mean + offset, KL ~ squared offset) is the paper's.
 */
DeckAnim.register('controlvae-latent', function (el, A) {
  'use strict';
  var C = A.C, TASK = el.getAttribute('data-mode') === 'task', AT = parseFloat(el.getAttribute('data-at') || '0');
  var R = 44, LMAX = 78, STEP = 0.7, CY = 116;             // disc radius (sigma), longest offset, seconds per control step of the picture, mid line of the plane
  var cPrior = TASK ? '#b0b0b0' : C.g, cPost = TASK ? C.g : '#ffffff', cArr = TASK ? C.gbr : C.amber;
  var HALO = A.HALO.replace('#101010', '#141414');
  var MATH = 'font-family:' + A.MATH + ';font-style:italic';

  function label(x, y, html, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 700) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + ';' + (o.halo ? HALO : '') }, el);
    n.innerHTML = html;
    return n;
  }
  var mi = function (s) { return '<tspan style="' + MATH + ';font-size:1.2em">' + s + '</tspan>'; };
  var sub = function (a, b, rest) {                       // a with subscript b, then `rest` back on the baseline
    return mi(a) + '<tspan dy="6" style="' + MATH + ';font-size:.85em">' + b + '</tspan>' + (rest ? '<tspan dy="-6">' + rest + '</tspan>' : '');
  };

  // legend (top row)
  A.el('circle', { cx: 24, cy: 22, r: 8.5, fill: 'none', stroke: cPrior, 'stroke-width': 3, 'stroke-dasharray': TASK ? '5 4' : 'none' }, el);
  label(40, 29, TASK ? 'prior, frozen' : 'prior: follows the state', { fill: cPrior });
  var lx = TASK ? 196 : 292;
  A.el('circle', { cx: lx, cy: 22, r: 8.5, fill: 'none', stroke: cPost, 'stroke-width': 3 }, el);
  label(lx + 16, 29, TASK ? 'task policy' : 'encoder', { fill: cPost });

  // the plane
  A.el('line', { x1: 14, y1: CY, x2: 403, y2: CY, stroke: '#2c2c2c', 'stroke-width': 2, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }, el);
  var prior = A.el('circle', { r: R, fill: TASK ? 'rgba(176,176,176,.10)' : 'rgba(118,185,0,.17)', stroke: cPrior, 'stroke-width': 3, 'stroke-dasharray': TASK ? '8 6' : 'none' }, el);
  var post = A.el('circle', { r: R, fill: TASK ? 'rgba(118,185,0,.22)' : 'rgba(255,255,255,.10)', stroke: cPost, 'stroke-width': 3 }, el);
  var pdot = A.el('circle', { r: 5, fill: cPrior }, el);
  var shaft = A.el('line', { stroke: cArr, 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
  var head = A.el('path', { fill: cArr, stroke: cArr, 'stroke-width': 2, 'stroke-linejoin': 'round' }, el);
  var zdot = A.el('circle', { r: 6, fill: '#fff', stroke: '#141414', 'stroke-width': 2 }, el);
  var lMu = label(0, 0, sub('μ', TASK ? 'g' : 'q'), { fill: cArr, anchor: 'middle', size: 21, halo: true });
  var lZ = label(0, 0, mi('z'), { fill: '#fff', size: 20, halo: true });

  // bottom row (kept 6 px clear of the lower edge of the tile, and below the lowest point a disc can reach, y = 190)
  var bar = null, goal = null;
  if (!TASK) {                                             // the KL term: proportional to the squared length of the arrow
    label(14, 216, 'KL', { fill: C.amber });
    A.el('rect', { x: 54, y: 200, width: 190, height: 16, rx: 8, fill: '#272727' }, el);
    bar = A.el('rect', { x: 54, y: 200, width: 0, height: 16, rx: 8, fill: C.amber }, el);
    label(256, 218, '<tspan style="font-size:1.25em">∝</tspan> ' + mi('‖') + sub('μ', 'q', mi('‖')) + '<tspan dy="-10" style="font-size:.8em">2</tspan>', { fill: '#e0e0e0', weight: 500, size: 24 });
  } else {                                                 // the goal: a marker that turns; the offset follows it
    label(14, 216, 'goal ' + mi('g'), { fill: C.amber });
    goal = A.el('path', { fill: 'none', stroke: C.amber, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    label(150, 216, 'sets the offset ' + sub('μ', 'g'), { fill: '#d0d0d0', weight: 500, size: 21 });
  }

  // z samples: one per control step, as offsets inside the disc (deterministic)
  var rnd = A.rand(TASK ? 23 : 11), Z = [], i;
  for (i = 0; i < 64; i++) {
    var gx = A.gauss(rnd), gy = A.gauss(rnd), gl = Math.hypot(gx, gy), k = gl > 1.5 ? 1.5 / gl : 1;
    Z.push([gx * k * R * 0.42, gy * k * R * 0.42]);          // at most 0.63 R from the centre, so that with the shift below the dot stays inside the disc
  }
  // task mode: one offset per goal (direction, length); it holds while the goal holds, then moves to the next one
  var DIRS = [-0.4, 0.42, 2.72, 3.56], LENS = [56, 42, 54, 44], GOAL = [0, 1.5708, 3.1416, 4.7124], HOLD = 3.4;
  function turn(t, arr) {
    var n = Math.floor(t / HOLD), u = A.ease(A.ramp(t - n * HOLD, 0, 1.0)), a = arr[((n - 1) % 4 + 4) % 4], b = arr[n % 4];
    if (b < a) b += 6.2832;
    return a + (b - a) * u;
  }

  return function draw(f) {
    var t = f.t, grow = f.step === AT ? A.ease(A.ramp(f.ts, 0.8, 2.0)) : 1;
    var L, ph, px, py = CY + 6 * Math.sin(0.8 * t + 1);
    if (TASK) {                                             // while the goal turns, the offset draws back and comes out again as the offset of the new goal
      var gi = Math.floor(t / HOLD), w = A.ramp(t - gi * HOLD, 0, 1.0), la = LENS[((gi - 1) % 4 + 4) % 4], lb = LENS[gi % 4];
      L = (la + (lb - la) * A.ease(w) + 3 * Math.sin(1.3 * t)) * (1 - 0.7 * Math.sin(Math.PI * w));
      ph = turn(t, DIRS); px = 208 + 34 * Math.sin(0.45 * t + 2);
    }
    else { L = 52 + 26 * Math.sin(0.9 * t + 0.6); ph = 0.28 * Math.sin(0.61 * t + 1.2); px = 150 + 78 * Math.sin(0.45 * t + 2); }
    L *= grow;
    var ux = Math.cos(ph), uy = Math.sin(ph), qx = px + L * ux, qy = py + L * uy;
    A.set(prior, { cx: px.toFixed(1), cy: py.toFixed(1) });
    A.set(pdot, { cx: px.toFixed(1), cy: py.toFixed(1) });
    A.set(post, { cx: qx.toFixed(1), cy: qy.toFixed(1) });
    A.show(post, A.ramp(grow, 0, 0.12));
    // the offset arrow, from the prior mean to the shifted mean
    var hl = Math.min(15, L * 0.5), bx = qx - ux * hl, by = qy - uy * hl;
    A.set(shaft, { x1: px.toFixed(1), y1: py.toFixed(1), x2: bx.toFixed(1), y2: by.toFixed(1) });
    A.set(head, { d: 'M' + qx.toFixed(1) + ' ' + qy.toFixed(1) + 'L' + (bx - uy * hl * 0.6).toFixed(1) + ' ' + (by + ux * hl * 0.6).toFixed(1) +
      'L' + (bx + uy * hl * 0.6).toFixed(1) + ' ' + (by - ux * hl * 0.6).toFixed(1) + 'Z' });
    var vis = A.ramp(L, 5, 12);
    A.show(shaft, vis); A.show(head, vis);
    var up = ux >= 0 ? 1 : -1;                              // the label stays above the arrow
    A.set(lMu, { x: ((px + qx) / 2 + uy * 23 * up).toFixed(1), y: ((py + qy) / 2 - ux * 23 * up + 6).toFixed(1) });
    A.show(lMu, A.ramp(L, 12, 22));
    // z: one sample per control step, drawn from the shifted Gaussian (it hops inside the disc, and travels with it)
    var n = Math.floor(t / STEP), u = A.ease(A.ramp(t - n * STEP, 0, 0.3)), a = Z[((n - 1) % 64 + 64) % 64], b = Z[n % 64];
    var zx = qx + a[0] + (b[0] - a[0]) * u, zy = qy + 17 + 0.45 * Math.abs(a[1] + (b[1] - a[1]) * u);       // kept in the lower half of the disc, clear of the arrow
    A.set(zdot, { cx: zx.toFixed(1), cy: zy.toFixed(1) });
    A.set(lZ, { x: (zx + 10).toFixed(1), y: (zy + 7).toFixed(1) });
    if (bar) A.set(bar, { width: Math.max(0, 190 * (L / LMAX) * (L / LMAX)).toFixed(1) });
    if (goal) {
      var g = turn(t, GOAL), cx = 112, cy = 208, gxx = Math.cos(g), gyy = -Math.sin(g), tx = cx + 16 * gxx, ty = cy + 16 * gyy;
      A.set(goal, { d: 'M' + (cx - 16 * gxx).toFixed(1) + ' ' + (cy - 16 * gyy).toFixed(1) + 'L' + tx.toFixed(1) + ' ' + ty.toFixed(1) +
        'M' + (tx - 10 * gxx - 7 * gyy).toFixed(1) + ' ' + (ty - 10 * gyy + 7 * gxx).toFixed(1) + 'L' + tx.toFixed(1) + ' ' + ty.toFixed(1) +
        'L' + (tx - 10 * gxx + 7 * gyy).toFixed(1) + ' ' + (ty - 10 * gyy - 7 * gxx).toFixed(1) });
    }
  };
});
