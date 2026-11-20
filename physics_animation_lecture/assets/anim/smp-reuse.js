/* Slide "SMP": two small SCHEMATICS, one per card.   <svg data-anim="smp-reuse" data-k="0|1" viewBox="0 0 340 176">
 *   0  AMP: every policy needs its own discriminator D, trained together with it (samples up, reward down) on the motion data, all the time
 *   1  SMP: the motion data trains one diffusion model f, once; it is frozen (dashed, padlock), the data is no longer needed,
 *      and every policy only queries the same f: its motion goes up (white pulse), a reward comes back (amber pulse); f is not updated
 * Three policies stand for "any number of policies"; nothing here is a measurement.
 * Figure 1 appears at build step 1: its scene restarts at that click.
 */
DeckAnim.register('smp-reuse', function (el, A) {
  'use strict';
  var C = A.C, K = parseInt(el.getAttribute('data-k'), 10), AMBER = C.amber, GREY = '#9a9a9a';
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.2em">' + s + '</tspan>'; };
  function txt(p, x, y, s, o) { var n = A.text(p, x, y, '', o); n.innerHTML = s; return n; }
  function box(p, x, y, w, h, label, o) {
    o = o || {};
    var r = A.el('rect', { x: x + 1.5, y: y + 1.5, width: w - 3, height: h - 3, rx: 9, fill: o.fill || '#161616', stroke: o.stroke || '#5a5a5a', 'stroke-width': 3 }, p);
    txt(p, x + w / 2, y + h / 2 + 7, label, { anchor: 'middle', size: 20, fill: o.text || '#fff', halo: false });
    return r;
  }
  function line(p, x1, y1, x2, y2, col) {                         // straight arrow
    var a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a), h = 8;
    A.el('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + 'M' + (x2 - h * c + 0.6 * h * s).toFixed(1) + ' ' + (y2 - h * s - 0.6 * h * c).toFixed(1) + 'L' + x2 + ' ' + y2 +
      'L' + (x2 - h * c - 0.6 * h * s).toFixed(1) + ' ' + (y2 - h * s + 0.6 * h * c).toFixed(1), fill: 'none', stroke: col, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p);
    return { x1: x1, y1: y1, x2: x2, y2: y2, dot: A.el('circle', { r: 4.6, fill: col === GREY ? '#fff' : col, stroke: '#101010', 'stroke-width': 1.2 }, p) };
  }
  function run(ln, t, period, on) {                               // one pulse along an arrow
    var u = A.loop(t, period) / period;
    A.set(ln.dot, { cx: A.lerp(ln.x1, ln.x2, u).toFixed(1), cy: A.lerp(ln.y1, ln.y2, u).toFixed(1) });
    A.show(ln.dot, on ? Math.min(1, u / 0.15, (1 - u) / 0.15) : 0);
  }
  var POL = { fill: C.g, stroke: C.g, text: '#000' }, CX = [56, 170, 284], SUB = ['₁', '₂', '₃'];
  var local = function (f) { return (K === 1 && f.step === 1) ? f.ts : f.t; };

  if (K === 0) {
    box(el, 96, 2, 148, 40, 'motion data', { stroke: '#5a5a5a' });
    var cols = [];
    CX.forEach(function (cx, k) {
      var g = A.el('g', {}, el);
      var dn = line(g, k === 1 ? cx : (k === 0 ? 124 : 216), 42, cx, 62, GREY);
      box(g, cx - 50, 64, 100, 42, MI('D') + SUB[k], { stroke: C.g, fill: '#0f1a06' });
      box(g, cx - 54, 132, 108, 42, 'policy ' + (k + 1), POL);
      cols.push({ g: g, dn: dn, up: line(g, cx - 20, 131, cx - 20, 108, GREY), rw: line(g, cx + 20, 107, cx + 20, 130, AMBER) });
    });
    return function draw(f) {
      var t = local(f);
      cols.forEach(function (c, k) {
        var t0 = 0.3 + 2.2 * k;
        A.show(c.g, A.ramp(t, t0, t0 + 0.5));
        run(c.dn, t + 0.3 * k, 1.5, t > t0); run(c.up, t + 0.2 * k, 1.2, t > t0); run(c.rw, t + 0.6 + 0.2 * k, 1.2, t > t0);
      });
    };
  }

  var gD = A.el('g', {}, el);
  box(gD, 96, 2, 148, 40, 'motion data', { stroke: '#5a5a5a' });
  var tr = line(gD, 170, 42, 170, 62, GREY);
  var fTrain = A.el('g', {}, el), fFrozen = A.el('g', {}, el);
  box(fTrain, 86, 64, 168, 42, 'diffusion model', { stroke: C.g, fill: '#0f1a06' });
  var fr = box(fFrozen, 86, 64, 168, 42, 'frozen model', { stroke: '#9a9a9a', fill: '#1c1c1c' });
  fr.setAttribute('stroke-dasharray', '7 5');
  // padlock at the right end of the frozen box
  A.el('path', { d: 'M266 82v-5a7 7 0 0 1 14 0v5', fill: 'none', stroke: '#fff', 'stroke-width': 2.8, 'stroke-linecap': 'round' }, fFrozen);
  A.el('rect', { x: 262, y: 82, width: 22, height: 17, rx: 3.5, fill: '#fff' }, fFrozen);
  var pols = [];
  CX.forEach(function (cx, k) {
    var g = A.el('g', {}, el);
    var rw = line(g, k === 1 ? cx : (k === 0 ? 124 : 216), 107, cx, 130, AMBER);
    var ask = A.el('circle', { r: 4.6, fill: '#fff', stroke: '#101010', 'stroke-width': 1.2 }, g);      // the policy's motion, sent up to be scored
    box(g, cx - 54, 132, 108, 42, 'policy ' + (k + 1), POL);
    pols.push({ g: g, rw: rw, ask: ask });
  });
  /** a query: a white pulse (the policy's motion) runs up to the model, an amber pulse (the reward) comes back down the same arrow */
  function query(p, t, on) {
    var u = A.loop(t, 1.8) / 1.8, up = u < 0.5, v = up ? u / 0.5 : (u - 0.5) / 0.5, ln = p.rw, o = on ? Math.min(1, v / 0.15, (1 - v) / 0.15) : 0;
    A.set(p.ask, { cx: A.lerp(ln.x2, ln.x1, v).toFixed(1), cy: A.lerp(ln.y2, ln.y1, v).toFixed(1) });
    A.set(ln.dot, { cx: A.lerp(ln.x1, ln.x2, v).toFixed(1), cy: A.lerp(ln.y1, ln.y2, v).toFixed(1) });
    A.show(p.ask, up ? o : 0); A.show(ln.dot, up ? 0 : o);
  }
  return function draw(f) {
    var t = local(f), fz = A.ramp(t, 2.2, 2.7);
    A.show(gD, 1 - 0.72 * fz); run(tr, t, 0.8, t < 2.3);
    A.show(fTrain, 1 - fz); A.show(fFrozen, fz);
    pols.forEach(function (p, k) {
      var t0 = 2.9 + 1.4 * k;
      A.show(p.g, A.ramp(t, t0, t0 + 0.5));
      query(p, t - t0, t > t0);                                               // each policy starts by asking
    });
  };
});
