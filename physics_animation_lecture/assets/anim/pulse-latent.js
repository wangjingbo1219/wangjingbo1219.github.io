/* PULSE, slide "how": who writes the latent z?     <svg data-anim="pulse-latent" viewBox="0 0 560 360">
 * SCHEMATIC, no data: a plane spanned by two of the 32 latent dimensions. Nothing here is measured; positions and shapes are made up
 * to show the logic of the paper (Sec. 4.2, 4.3, Eq. 1 and 4 of arXiv:2310.04582):
 *   step 0, 1  the encoder (it sees the reference) writes one z per frame: a green point that moves smoothly (L_regu keeps neighbours close)
 *   step 2     the learned prior R(z | body state): a blue Gaussian. It starts where a VAE's fixed N(0, I) would sit (grey circle) and the
 *              KL term (amber tether, labelled) pulls it onto the encoder's z; from then on it follows the body state. The paper's prior is a DIAGONAL
 *              Gaussian (Eq. 1), so in a plane of two latent dimensions its contour is an axis-aligned ellipse: it moves and changes
 *              size, it never tilts
 *   step 3     no encoder: every frame a fresh z is drawn inside the prior (white points; the last few draws are shown inside the prior as
 *              it is now, and the drawing is slowed down from the paper's 30 per second so that it can be seen)
 *   step 4     a task policy outputs an offset from the prior mean (green arrow); the small dots are its exploration noise (fixed variance)
 * draw(f) is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('pulse-latent', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, BLUE = C.blue, AMBER = C.amber, GREY = '#8d8d8d';
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.2em">' + s + '</tspan>'; };
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 21) + 'px ' + A.FONT + ';fill:' + (o.fill || '#e2e2e2') + (o.halo ? ';' + A.HALO : '') }, p);
    n.innerHTML = s;
    return n;
  }

  // ---- the plane: a faint grid and two axis arrows
  var X0 = 20, X1 = 540, Y0 = 104, Y1 = 344, i;
  for (i = 0; i <= 13; i++) A.el('line', { x1: X0 + 40 * i, y1: Y0, x2: X0 + 40 * i, y2: Y1, stroke: '#1b1b1b', 'stroke-width': 1.5 }, el);
  for (i = 0; i <= 6; i++) A.el('line', { x1: X0, y1: Y0 + 40 * i, x2: X1, y2: Y0 + 40 * i, stroke: '#1b1b1b', 'stroke-width': 1.5 }, el);

  // ---- the body state changes as the character moves, and the prior with it: centre and radii of the prior over time (no tilt: diagonal Gaussian)
  function cen(t) { return [282 + 112 * Math.sin(0.42 * t + 0.3) + 20 * Math.sin(1.1 * t), 226 + 34 * Math.sin(0.63 * t + 1.2) + 9 * Math.sin(1.7 * t + 0.4)]; }
  function shape(t) { return [84 + 13 * Math.sin(0.37 * t), 52 + 8 * Math.cos(0.53 * t + 1)]; }                                    // rx, ry
  function enc(t) { var c = cen(t); return [c[0] + 36 * Math.sin(1.9 * t + 1), c[1] + 20 * Math.sin(2.6 * t)]; }
  function inEll(c, s, u, v) { return [c[0] + u * s[0], c[1] + v * s[1]]; }      // point at (u, v) in units of the radii
  var VAE = [282, 226, 54];                                      // where a fixed N(0, I) sits: the middle of the plane

  // ---- layers (back to front)
  var gVae = A.el('g', {}, el);
  A.el('circle', { cx: VAE[0], cy: VAE[1], r: VAE[2], fill: 'none', stroke: GREY, 'stroke-width': 2.5, 'stroke-dasharray': '5 7' }, gVae);
  var gPrior = A.el('g', {}, el);
  var ell = A.el('ellipse', { fill: 'rgba(79,195,247,.13)', stroke: BLUE, 'stroke-width': 3, 'stroke-dasharray': '9 7' }, gPrior);
  var gKL = A.el('g', {}, el);
  var klLine = A.el('line', { stroke: AMBER, 'stroke-width': 3, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, gKL);
  var klTxt = txt(gKL, 0, 0, 'KL', { weight: 700, fill: AMBER, anchor: 'middle', halo: true });

  var NT = 34, trail = [], gEnc = A.el('g', {}, el);
  for (i = 0; i < NT; i++) trail.push(A.el('circle', { r: (4.6 - 0.08 * i).toFixed(2), fill: G }, gEnc));
  var encDot = A.el('circle', { r: 8.5, fill: G, stroke: '#0c0c0c', 'stroke-width': 2.5 }, gEnc);

  var NS = 10, gSam = A.el('g', {}, el), samLine = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 1.8, 'stroke-opacity': 0.35, 'stroke-linejoin': 'round' }, gSam), sam = [];
  for (i = 0; i < NS; i++) sam.push(A.el('circle', { r: i ? 4.2 : 8, fill: '#fff', stroke: '#0c0c0c', 'stroke-width': i ? 1.5 : 2.5 }, gSam));

  var gTask = A.el('g', {}, el), NX = 7, cloud = [];
  for (i = 0; i < NX; i++) cloud.push(A.el('circle', { r: 3.8, fill: '#d9ff7a' }, gTask));
  var arrow = A.el('path', { fill: 'none', stroke: C.gbr, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gTask);
  var tip = A.el('circle', { r: 7.5, fill: C.gbr, stroke: '#0c0c0c', 'stroke-width': 2.5 }, gTask);
  var mean = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }, gTask);
  var muTxt = txt(gTask, 0, 0, MI('μ') + '<tspan dy="-9" style="font-family:' + A.MATH + ';font-style:italic;font-size:17px">p</tspan>', { weight: 700, fill: '#fff', anchor: 'middle', halo: true });
  var zTxt = txt(gTask, 0, 0, MI('z'), { weight: 700, fill: C.gbr, anchor: 'middle', halo: true });

  // ---- legend: row A = who writes z now, row B = the prior (from step 2), row C = the fixed prior of a VAE (step 2 only)
  var LX = 22, LT = 50;
  var lgEnc = A.el('g', {}, el), lgSam = A.el('g', {}, el), lgTask = A.el('g', {}, el), lgPrior = A.el('g', {}, el), lgVae = A.el('g', {}, el);
  A.el('circle', { cx: LX + 10, cy: 23, r: 8, fill: G }, lgEnc);
  txt(lgEnc, LT, 30, MI('z') + ' from the encoder, one per frame');
  A.el('circle', { cx: LX + 10, cy: 23, r: 8, fill: '#fff' }, lgSam);
  txt(lgSam, LT, 30, MI('z') + ' drawn from the prior, every frame');
  A.el('path', { d: 'M' + (LX - 2) + ' 23H' + (LX + 20) + 'M' + (LX + 12) + ' 15L' + (LX + 21) + ' 23L' + (LX + 12) + ' 31', fill: 'none', stroke: C.gbr, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, lgTask);
  txt(lgTask, LT, 30, 'task policy: an offset from the prior mean');
  A.el('ellipse', { cx: LX + 10, cy: 53, rx: 12, ry: 8, fill: 'rgba(79,195,247,.13)', stroke: BLUE, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }, lgPrior);
  txt(lgPrior, LT, 60, 'learned prior: moves with the body state');
  A.el('circle', { cx: LX + 10, cy: 83, r: 8.5, fill: 'none', stroke: GREY, 'stroke-width': 2.5, 'stroke-dasharray': '4 4' }, lgVae);
  txt(lgVae, LT, 90, 'a VAE’s prior: fixed, one for every state', { fill: '#b0b0b0' });

  return function draw(f) {
    var t = f.t, st = f.step, ts = f.ts, k, p;
    var on = function (s) { return st > s ? 1 : (st === s ? A.ramp(ts, 0, 0.5) : 0); };       // 0 -> 1 when step s is entered
    // the first legend line is replaced at steps 3 and 4: the old text leaves BEFORE the new one arrives (two lines never overprint)
    var gone = function (s) { return st > s ? 1 : (st === s ? A.ramp(ts, 0, 0.22) : 0); };
    var come = function (s) { return st > s ? 1 : (st === s ? A.ramp(ts, 0.26, 0.5) : 0); };
    var c = cen(t), sh = shape(t), e = enc(t);

    // encoder: the point and its trail; it leaves when z is drawn from the prior
    var aEnc = 1 - on(3);
    A.show(gEnc, aEnc); A.show(lgEnc, 1 - gone(3));
    A.set(encDot, { cx: e[0].toFixed(1), cy: e[1].toFixed(1) });
    for (k = 0; k < NT; k++) { p = enc(t - 0.085 * (k + 1)); A.set(trail[k], { cx: p[0].toFixed(1), cy: p[1].toFixed(1), opacity: (0.66 * (1 - k / NT)).toFixed(2) }); }

    // prior: at step 2 it grows out of the fixed circle and is pulled onto the encoder's z; afterwards it follows the body state
    var u = st > 2 ? 1 : (st === 2 ? A.ease(A.ramp(ts, 0.9, 3.2)) : 0);
    var pc = [A.lerp(VAE[0], c[0], u), A.lerp(VAE[1], c[1], u)], prx = A.lerp(VAE[2], sh[0], u), pry = A.lerp(VAE[2], sh[1], u);
    A.show(gPrior, on(2)); A.show(lgPrior, on(2));
    A.set(ell, { cx: pc[0].toFixed(1), cy: pc[1].toFixed(1), rx: prx.toFixed(1), ry: pry.toFixed(1) });
    var aVae = on(2) * (1 - on(3));
    A.show(gVae, aVae); A.show(lgVae, aVae);
    // the KL term: a tether between the prior's centre and the encoder's z (step 2 only), amber like the KL arrow of the pipeline.
    // Its name rides above the tether: over the middle, clear of both ends, so it stays readable however short the tether gets
    A.show(gKL, aVae);
    A.set(klLine, { x1: pc[0].toFixed(1), y1: pc[1].toFixed(1), x2: e[0].toFixed(1), y2: e[1].toFixed(1) });
    A.set(klTxt, { x: ((pc[0] + e[0]) / 2).toFixed(1), y: (Math.min(pc[1], e[1]) - 18).toFixed(1) });

    // sampling: a fresh z inside the prior, a few times per second (the paper samples every frame; slowed down so that it can be seen)
    var aSam = on(3) * (1 - on(4));
    A.show(gSam, aSam); A.show(lgSam, come(3) * (1 - gone(4)));
    if (aSam > 0) {
      var n = Math.floor(t / 0.22), pts = [];
      for (k = 0; k < NS; k++) {
        var j = n - k, r = A.rand(4000 + j);                     // the recent draws are shown inside the prior as it is now: they travel with it
        p = inEll(c, sh, A.clamp(0.46 * A.gauss(r), -0.8, 0.8), A.clamp(0.46 * A.gauss(r), -0.8, 0.8));
        pts.push(p);
        A.set(sam[k], { cx: p[0].toFixed(1), cy: p[1].toFixed(1), opacity: k ? (0.8 * (1 - k / NS)).toFixed(2) : 1 });
      }
      A.set(samLine, { d: A.path(pts) });
    }

    // task policy: an arrow from the prior mean to its z, with exploration noise around the tip
    var aTask = on(4);
    A.show(gTask, aTask); A.show(lgTask, come(4));
    if (aTask > 0) {
      var phi = 0.9 + 0.55 * t + 1.1 * Math.sin(0.31 * t);
      var rad = sh[0] * sh[1] / Math.hypot(sh[1] * Math.cos(phi), sh[0] * Math.sin(phi));       // radius of the prior in that direction
      var L = (0.74 + 0.1 * Math.sin(0.8 * t)) * rad * A.ease(A.ramp(st > 4 ? 9 : ts, 0.3, 1.3));
      var tx = c[0] + L * Math.cos(phi), ty = c[1] + L * Math.sin(phi), hx = Math.cos(phi), hy = Math.sin(phi);
      A.set(arrow, { d: 'M' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + 'L' + (tx - 9 * hx).toFixed(1) + ' ' + (ty - 9 * hy).toFixed(1) });
      A.set(tip, { cx: tx.toFixed(1), cy: ty.toFixed(1) });
      A.set(mean, { d: 'M' + (c[0] - 7).toFixed(1) + ' ' + c[1].toFixed(1) + 'h14M' + c[0].toFixed(1) + ' ' + (c[1] - 7).toFixed(1) + 'v14' });
      A.set(muTxt, { x: (c[0] - 27 * hx - 3).toFixed(1), y: (c[1] - 25 * hy + 8).toFixed(1) });
      A.set(zTxt, { x: (tx + 22 * hx).toFixed(1), y: (ty + 22 * hy + 8).toFixed(1) });
      var m = Math.floor(t / 0.11), rr = A.rand(9000 + m);
      for (k = 0; k < NX; k++) A.set(cloud[k], { cx: (tx + 11 * A.gauss(rr)).toFixed(1), cy: (ty + 11 * A.gauss(rr)).toFixed(1), opacity: L > 12 ? 0.85 : 0 });
    }
  };
});
