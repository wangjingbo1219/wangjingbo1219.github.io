/* AdaptNet, slide "how": what the latent injector does.     <svg data-anim="adaptnet-latent" data-s-in="1" data-s-train="3" data-s-alpha="4" viewBox="0 0 586 272">
 *
 * SCHEMATIC of the latent space Z0 (260-d in the paper, drawn as a plane; no axis, no numbers).
 *   grey cloud    where the frozen encoder puts the states of the pre-trained walk; the white dot E(s) runs round it once per gait cycle
 *   green arrow   the offset I(s, c) that the injector adds (Eq. 4): it depends on the state, so it changes along the cycle
 *   green dot     z0 = E(s) + strength * I(s, c): what the frozen FC layers receive. With the full offset it runs round the region of the new style.
 * strength, by build step of the slide:
 *   data-s-in      the figure appears: the offset is drawn in (once), then stays full (the figure dims while the next example is explained)
 *   data-s-train   zero initialization: strength 0 at iteration 0 (both dots coincide: the old behaviour), then it grows (ADAPTNET.train, a loop)
 *   data-s-alpha   the run-time scale alpha of Eq. 13, measured on the slider of the clip next to the figure and following that clip's clock
 * The strip under the plane changes with the step: legend of the two dots / training bar / the alpha slider.
 * draw(f) is a pure function of (f.t, f.step, f.ts) and, while the clip plays, of the clip's time.
 */
DeckAnim.register('adaptnet-latent', function (el, A) {
  'use strict';
  var C = A.C, AN = window.ADAPTNET, G = C.g, sec = el.closest('section');
  var S_IN = +el.getAttribute('data-s-in'), S_TRAIN = +el.getAttribute('data-s-train'), S_ALPHA = +el.getAttribute('data-s-alpha');
  var mi = function (s, z) { return AN.mi(A, s, z); }, cal = AN.cal, T = function (p, x, y, h, o) { return AN.txt(A, p, x, y, h, o); };
  var W = 586, WC = [140, 118], SC = [440, 116], GAIT = 1.4;

  // ---------- title and formula ----------
  T(el, 22, 35, 'LATENT SPACE · SCHEMATIC', { size: 20, fill: G, ls: '.09em' });
  var Z0 = mi('z') + AN.sup('0', 10), ES = cal('E') + '(' + mi('s') + ')', IS = '<tspan fill="' + G + '">' + cal('I') + '(' + mi('s') + ', ' + mi('c') + ')</tspan>';
  var fPlain = T(el, W - 22, 37, Z0 + ' = ' + ES + ' + ' + IS, { size: 22, weight: 500, anchor: 'end' });
  var fAlpha = T(el, W - 22, 37, Z0 + ' = ' + ES + ' + ' + mi('α') + ' ' + IS, { size: 22, weight: 500, anchor: 'end' });

  // ---------- the plane: two regions, each a cloud of latents ----------
  var r = A.rand(11), i, x, y;
  function cloud(c, rx, ry, col, op, blob) {
    A.el('ellipse', { cx: c[0], cy: c[1], rx: rx, ry: ry, fill: col, opacity: blob }, el);
    for (i = 0; i < 70; i++) {
      do { x = 0.46 * A.gauss(r); y = 0.46 * A.gauss(r); } while (x * x + y * y > 0.86);
      A.el('circle', { cx: (c[0] + rx * x).toFixed(1), cy: (c[1] + ry * y).toFixed(1), r: 3.2, fill: col, opacity: op }, el);
    }
  }
  cloud(WC, 84, 56, '#9a9a9a', 0.62, 0.10);
  cloud(SC, 88, 58, G, 0.5, 0.13);
  T(el, WC[0], 201, 'pre-trained walk', { size: 20, weight: 500, fill: C.mid, anchor: 'middle' });
  T(el, SC[0], 201, 'new style', { size: 20, fill: G, anchor: 'middle' });
  function pw(ph) { return [WC[0] + 36 * Math.cos(ph), WC[1] + 20 * Math.sin(ph)]; }
  function ps(ph) { return [SC[0] + 38 * Math.cos(ph + 0.7) + 7 * Math.cos(2 * ph), SC[1] - 23 * Math.sin(ph + 0.7)]; }
  function ring(fn, col, op) {
    var d = '', k, p;
    for (k = 0; k <= 60; k++) { p = fn(2 * Math.PI * k / 60); d += (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
    A.el('path', { d: d + 'Z', fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round', opacity: op }, el);
  }
  ring(pw, '#e0e0e0', 0.8); ring(ps, '#b6f23a', 0.85);

  // ---------- the offset arrow and the two dots ----------
  var shaft = A.el('path', { fill: 'none', stroke: G, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var head = A.el('path', { fill: G, stroke: G, 'stroke-width': 2, 'stroke-linejoin': 'round' }, el);
  var lOff = T(el, 0, 0, 'offset', { size: 20, fill: G, anchor: 'middle', halo: true });
  var dZ = A.el('circle', { r: 10.5, fill: G, stroke: '#101010', 'stroke-width': 3 }, el);
  var dW = A.el('circle', { r: 6.5, fill: '#fff', stroke: '#101010', 'stroke-width': 2.5 }, el);      // on top: with no offset the two dots are one, white inside green
  var lW = T(el, 0, 0, ES, { size: 21, anchor: 'end', halo: true });
  var lZ = T(el, 0, 0, Z0, { size: 22, halo: true });

  // ---------- the strip under the plane ----------
  var SY = 244;
  var gLeg = A.el('g', null, el), gTrain = A.el('g', null, el), gAlpha = A.el('g', null, el);
  A.el('circle', { cx: 32, cy: SY - 7, r: 8, fill: '#fff' }, gLeg);
  T(gLeg, 50, SY, 'the encoder’s latent', { size: 20, weight: 500, fill: C.mid });
  A.el('circle', { cx: 286, cy: SY - 7, r: 9, fill: G }, gLeg);
  T(gLeg, 304, SY, 'what the FC layers receive', { size: 20, weight: 500, fill: C.mid });

  var TX0 = 300, TX1 = W - 24;
  var tLab = T(gTrain, 22, SY, '', { size: 20 });
  A.el('rect', { x: TX0, y: SY - 15, width: TX1 - TX0, height: 14, rx: 7, fill: '#242424' }, gTrain);
  var tBar = A.el('rect', { x: TX0, y: SY - 15, width: 0, height: 14, rx: 7, fill: C.amber }, gTrain);

  var AX0 = 150, AX1 = 462;
  T(gAlpha, 22, SY, 'scale ' + mi('α'), { size: 20 });
  T(gAlpha, AX0 - 26, SY, '0', { size: 20, weight: 500, fill: C.mid, anchor: 'middle' });
  A.el('line', { x1: AX0, y1: SY - 7, x2: AX1, y2: SY - 7, stroke: '#3a3a3a', 'stroke-width': 6, 'stroke-linecap': 'round' }, gAlpha);
  var aBar = A.el('line', { x1: AX0, y1: SY - 7, x2: AX0, y2: SY - 7, stroke: G, 'stroke-width': 6, 'stroke-linecap': 'round' }, gAlpha);
  var aKnob = A.el('circle', { cy: SY - 7, r: 10, fill: '#fff', stroke: '#101010', 'stroke-width': 3 }, gAlpha);
  T(gAlpha, AX1 + 26, SY, '1', { size: 20, weight: 500, fill: C.mid, anchor: 'middle' });
  var aVal = T(gAlpha, W - 22, SY, '', { size: 22, anchor: 'end' });        // the value read off the clip's slider
  var last = {};
  function setText(node, key, html) { if (last[key] !== html) { last[key] = html; A.set(node, { html: html }); } }

  return function draw(f) {
    var st = f.step, mode = st >= S_ALPHA ? 2 : (st === S_TRAIN ? 1 : 0), g, tr = null, ck = 0;
    if (mode === 2) { ck = AN.clock(sec, f); g = AN.alpha(ck); }
    else if (mode === 1) { tr = AN.train(f.ts); g = tr.g; }
    else g = st === S_IN ? A.ease(A.ramp(f.ts, 0.4, 1.8)) : 1;

    var ph = 2 * Math.PI * f.t / GAIT, a = pw(ph), s = ps(ph), z = [A.lerp(a[0], s[0], g), A.lerp(a[1], s[1], g)];
    A.set(dW, { cx: a[0].toFixed(1), cy: a[1].toFixed(1) });
    A.set(dZ, { cx: z[0].toFixed(1), cy: z[1].toFixed(1) });
    var dx = z[0] - a[0], dy = z[1] - a[1], L = Math.hypot(dx, dy), ux = dx / Math.max(L, 1e-6), uy = dy / Math.max(L, 1e-6);
    var vis = A.ramp(L, 26, 44);                                           // no arrow while the two dots (nearly) coincide
    var x0 = a[0] + ux * 11, y0 = a[1] + uy * 11, x1 = z[0] - ux * 16, y1 = z[1] - uy * 16;
    A.set(shaft, { d: 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'L' + (x1 - ux * 10).toFixed(1) + ' ' + (y1 - uy * 10).toFixed(1) });
    A.set(head, { d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + (x1 - ux * 13 - uy * 7).toFixed(1) + ' ' + (y1 - uy * 13 + ux * 7).toFixed(1) +
                     'L' + (x1 - ux * 13 + uy * 7).toFixed(1) + ' ' + (y1 - uy * 13 - ux * 7).toFixed(1) + 'Z' });
    A.show(shaft, vis); A.show(head, vis);
    A.set(lOff, { x: A.lerp(a[0], z[0], 0.56).toFixed(1), y: (A.lerp(a[1], z[1], 0.56) - 15).toFixed(1) }); A.show(lOff, A.ramp(L, 96, 120));
    A.set(lW, { x: (a[0] - 14).toFixed(1), y: (a[1] - 14).toFixed(1) });
    A.set(lZ, { x: (z[0] + 14).toFixed(1), y: (z[1] - 13).toFixed(1) });

    el.style.opacity = (st > S_IN && st < S_TRAIN) ? 0.42 : 1;          // another example is being explained: step back
    A.show(fPlain, mode === 2 ? 0 : 1); A.show(fAlpha, mode === 2 ? 1 : 0);
    A.show(gLeg, mode === 0 ? 1 : 0); A.show(gTrain, mode === 1 ? 1 : 0); A.show(gAlpha, mode === 2 ? 1 : 0);
    if (mode === 1) {
      setText(tLab, 't', tr.zero ? 'iteration 0: offset = 0' : 'training: the offset grows');
      tLab.style.fill = tr.zero ? C.amber : '#fff';
      A.show(tLab, tr.rew ? 0 : 1);                                        // no "grows" while the loop rewinds
      A.set(tBar, { width: ((TX1 - TX0) * tr.p).toFixed(1) });
    }
    if (mode === 2) {
      var ax = AX0 + (AX1 - AX0) * g;
      A.set(aBar, { x2: ax.toFixed(1) }); A.set(aKnob, { cx: ax.toFixed(1) });
      setText(aVal, 'a', g.toFixed(2)); A.show(aVal, AN.inFade(ck) ? 0 : 1);
    }
  };
});
