/* SuperTrack, "how" slide: a frame strip of the step that the current click explains.   <svg data-anim="supertrack-roll" viewBox="0 0 1064 304">
 * SCHEMATIC, no data: stick figures in profile are the frames of a roll-out, the chips between them are what produces the next frame.
 *   step 0  the gym        frame -> [Π][sim] -> frame ...   white = simulated S, green = kinematic target K; the error cannot flow back through "sim"
 *   step 1  collect        the same roll-out; every frame drops a tile into the buffer row
 *   step 2  fit W          a window of 8 stored frames: W rolled out from its first state (violet P) against the stored states (white S),
 *                          fed with the stored PD targets T (not with the policy); the error flows back along the chain into every W,
 *                          then the prediction moves onto the stored states
 *   step 3  fit Π          a window of 32 frames: Π and W rolled out from its first state against the target (green K);
 *                          the error flows back THROUGH W (dashed: not updated by this loss) into every Π
 *   the chips that produce the next frame light up white while the roll-out advances; amber = the gradient reaching a chip that is updated;
 *   the gradient dots run BEHIND the chips (they pass through them and never cover a letter)
 *   step 4  alternate      collect -> fit W -> fit Π, in turn
 * Window lengths (8, 32) are the paper's (Table 1); the strip draws the first frames of a window and its last one.
 * drawn 1:1 (viewBox = size on the slide), so text sizes are slide pixels.
 */
DeckAnim.register('supertrack-roll', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, AM = C.amber, VI = C.violet, WH = '#f2f2f2', RED = C.red;
  var GY = 190, CY = 140;                               // ground line, height of the chain
  var XS = [100, 276, 452, 628, 894];                   // frames: four consecutive ones, an ellipsis, the last of the window
  var GC = [188, 364, 540, 806];                        // centre of the chips between frame k and k + 1
  var NB = 60, BX = 130, BP = 15, BY = 258;             // buffer row: tiles, first x, pitch, top
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">' + s + '</tspan>'; };
  var PI = '<tspan style="font-family:KaTeX_Main,\'Times New Roman\',serif;font-size:1.14em">Π</tspan>';       // Π as KaTeX sets it in the pipeline boxes
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.halo ? ';' + A.HALO : '') }, p);
    n.innerHTML = s;
    return n;
  }
  var ln = function (p, d, col, w, dash) { return A.el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': w || 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dash || 'none' }, p); };

  // ---------------------------------------------------------------- static frame of the figure
  ln(el, 'M56 ' + GY + 'H934', '#333', 3);
  var k, j, chain = A.el('g', {}, el);
  for (k = 0; k < 3; k++) ln(chain, 'M' + (XS[k] + 32) + ' ' + CY + 'H' + (XS[k + 1] - 38) + 'm-9 -7l9 7l-9 7', '#6a6a6a', 2.5);
  ln(chain, 'M' + (XS[3] + 32) + ' ' + CY + 'H692M740 ' + CY + 'H' + (XS[4] - 38) + 'm-9 -7l9 7l-9 7', '#6a6a6a', 2.5);
  for (j = 0; j < 3; j++) A.el('circle', { cx: 704 + 12 * j, cy: CY, r: 3.2, fill: '#9a9a9a' }, chain);

  // legend, one group per kind of roll-out
  function legend(items) {
    var g = A.el('g', {}, el), x = 28;
    items.forEach(function (it) {
      if (it[3] === 'box') A.el('rect', { x: x, y: 13, width: 26, height: 20, rx: 5, fill: '#1c1c1c', stroke: it[0], 'stroke-width': 2.2, 'stroke-dasharray': '5 4' }, g);
      else ln(g, 'M' + x + ' 23H' + (x + 26), it[0], 7);
      var t = txt(g, x + 38, 30, it[1], { fill: '#d6d6d6' });
      x += 38 + it[2] + 34;
    });
    return g;
  }
  var LG = {
    gym: legend([[G, 'target ' + MI('K'), 76], [WH, 'simulated ' + MI('S'), 112], [AM, 'tracking error', 124]]),
    col: legend([[G, 'target ' + MI('K'), 76], [WH, 'simulated ' + MI('S'), 112]]),
    wm: legend([[WH, 'simulated ' + MI('S') + ' = the label', 226], [VI, 'predicted ' + MI('P'), 112], [AM, 'error', 46]]),
    pol: legend([[G, 'target ' + MI('K') + ' = the label', 190], [VI, 'predicted ' + MI('P'), 112], [AM, 'error', 46], ['#8a8a8a', MI('W') + ' frozen', 84, 'box']])
  };

  // the three phases, top right: collect -> fit W -> fit Π (and back)
  var PH = [[740, 96, 'collect'], [860, 76, 'fit ' + MI('W')], [960, 76, 'fit ' + PI]], pills = [], parr = [];
  PH.forEach(function (p, i) {
    var g = A.el('g', {}, el);
    var r = A.el('rect', { x: p[0], y: 8, width: p[1], height: 32, rx: 16, 'stroke-width': 2 }, g);
    var t = txt(g, p[0] + p[1] / 2, 31, p[2], { anchor: 'middle', weight: 700 });
    pills.push({ g: g, r: r, t: t });
    if (i) parr.push(ln(el, 'M' + (p[0] - 18) + ' 24h10m-6 -6l6 6l-6 6', '#8d8d8d', 2.5));
  });
  var pback = ln(el, 'M998 44v8H788v-9m-6 7l6 -7l6 7', '#8d8d8d', 2.5);

  // frames: the reference figure behind, the rolled-out figure in front
  function figure(w) {
    var g = A.el('g', { fill: 'none', 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    return { g: g, body: A.el('path', {}, g), head: A.el('circle', { r: 9, stroke: 'none' }, g) };
  }
  function pose(fg, x, ph, lean, col) {
    var L = window.STK.limbs(x, GY, ph, lean, 1);
    A.set(fg.body, { d: window.STK.path(L.segs), stroke: col });
    A.set(fg.head, { cx: L.head[0].toFixed(1), cy: L.head[1].toFixed(1), fill: col });
  }
  var PHI = [0.5, 1.55, 2.6, 3.65, 5.9];                // walk phase of the target in the five frames
  var EG = [0, 0.26, 0.36, 0.42, 0.46];                 // how far the simulated frame is from its target (schematic)
  var EW = [0, 0.34, 0.58, 0.8, 1];                     // how far a prediction is from its label before the update: it grows along the roll-out
  function place(fg, kk, e, col) { pose(fg, XS[kk] - 11 * e, PHI[kk] - 0.95 * e, -0.2 * e, col); }
  var ref = [], cur = [], bars = [];
  for (k = 0; k < 5; k++) ref.push(figure(5));
  for (k = 0; k < 5; k++) { cur.push(figure(6.5)); bars.push(A.el('rect', { y: GY + 7, height: 8, rx: 4, fill: AM }, el)); }

  var gDots = A.el('g', {}, el);                        // gradient dots: under the chips, over the frames
  // chips between the frames: A = Π, B = sim or W
  var chips = [];
  for (k = 0; k < 4; k++) {
    var g = A.el('g', {}, el), o = {};
    o.ra = A.el('rect', { y: CY - 17, height: 34, rx: 8, width: 38, fill: G, stroke: G, 'stroke-width': 2.5 }, g);
    o.ta = txt(g, 0, CY + 7, PI, { anchor: 'middle', weight: 700, fill: '#000' });
    o.rb = A.el('rect', { y: CY - 17, height: 34, rx: 8, 'stroke-width': 2.5 }, g);
    o.tsim = txt(g, 0, CY + 7, 'sim', { anchor: 'middle', weight: 700, fill: '#000' });
    o.tw = txt(g, 0, CY + 8, MI('W'), { anchor: 'middle', weight: 700, fill: '#fff' });
    o.fa = A.el('rect', { y: CY - 22, height: 44, rx: 12, width: 48, fill: 'none', stroke: AM, 'stroke-width': 4 }, g);
    o.fb = A.el('rect', { y: CY - 22, height: 44, rx: 12, width: 54, fill: 'none', stroke: AM, 'stroke-width': 4 }, g);
    o.x = ln(g, 'M-7 -7L7 7M7 -7L-7 7', RED, 4.5);
    chips.push(o);
  }
  var startL = txt(el, XS[0], GY + 25, 'a stored ' + MI('S'), { anchor: 'middle', fill: '#d6d6d6' });
  var gT = A.el('g', {}, el);                           // fit W: every W is fed the PD targets T that were stored with that frame
  for (k = 0; k < 4; k++) {
    txt(gT, GC[k], CY - 42, (k ? '' : 'stored ') + MI('T'), { anchor: 'middle', fill: '#d6d6d6' });
    ln(gT, 'M' + GC[k] + ' ' + (CY - 36) + 'V' + (CY - 24) + 'm-5 -6l5 6l5 -6', '#9a9a9a', 2.2);
  }
  var noGrad = txt(el, 497, 240, 'the tracking error cannot flow back through the simulator', { anchor: 'middle', fill: RED, weight: 700 });

  // loss chip at the end of the chain, fed by the error of every frame
  var gLoss = A.el('g', {}, el);
  var rail = ln(gLoss, 'M' + (XS[1] - 34) + ' ' + (GY + 22) + 'H993V' + (CY + 24) + 'm-7 9l7 -9l7 9', AM, 2.5);
  A.el('rect', { x: 950, y: CY - 18, width: 86, height: 36, rx: 9, fill: '#1b1503', stroke: AM, 'stroke-width': 2.5 }, gLoss);
  txt(gLoss, 993, CY + 7, 'loss', { anchor: 'middle', weight: 700, fill: '#ffd76a' });

  // moving dots
  function dots(n, col, r) { var a = []; for (var i = 0; i < n; i++) a.push(A.el('circle', { r: r, fill: col, stroke: '#101010', 'stroke-width': 1.5 }, gDots)); return a; }
  var grad = dots(6, AM, 5.5), back = dots(4, AM, 5);

  // buffer row, the sampled window and its "zoom" up to the strip
  var gBuf = A.el('g', {}, el), tiles = [];
  txt(gBuf, 28, BY + 21, 'buffer', { fill: C.mid });
  for (j = 0; j < NB; j++) tiles.push(A.el('rect', { x: BX + j * BP, y: BY, width: 12, height: 28, rx: 3, fill: '#d8d8d8' }, gBuf));
  var gWin = A.el('g', {}, el);
  var zoom = ln(gWin, '', '#5c5c5c', 1.8), brack = ln(gWin, 'M72 224v7H922v-7', '#8d8d8d', 2.2);
  var winR = A.el('rect', { y: BY - 4, height: 36, rx: 6, fill: 'none', stroke: '#fff', 'stroke-width': 2.5 }, gWin);
  var wl8 = txt(gWin, 497, 238, 'a window of 8 stored frames', { anchor: 'middle', halo: true, fill: '#e2e2e2' });
  var wl32 = txt(gWin, 497, 238, 'a window of 32 frames', { anchor: 'middle', halo: true, fill: '#e2e2e2' });
  var fly = [];
  for (k = 0; k < 5; k++) fly.push(A.el('rect', { width: 12, height: 28, rx: 3, fill: '#fff' }, el));
  var WS8 = [10, 38, 23, 47, 4], WS32 = [18, 6, 24, 11, 27];           // window starts, one per pass

  var RATE = 9;                                                       // buffer tiles written per second while collecting
  var FIT = 7.0, GYM = 7.0, COL = 2.6, CYC = [2.6, 3.6, 3.6];         // loop lengths; the three phases of "alternate"

  // ---------------------------------------------------------------- one picture: kind of roll-out, time inside it, how visible
  // kind: 'gym' | 'col' | 'wm' | 'pol';  tau: seconds into the pass;  alpha: 0..1;  pass: index of the pass (picks the window);  tw: seconds of collecting so far
  function scene(kind, tau, alpha, pass, tw, full) {
    var real = kind === 'gym' || kind === 'col', fit = !real, i, e;
    var shown = function (kk) { return kk === 0 ? 1 : A.ramp(tau, kk * 0.5 - 0.12, kk * 0.5 + 0.06); };
    var errV = kind === 'col' ? 0 : A.ramp(tau, 2.0, 2.5);
    var gp = fit ? A.ramp(tau, 2.6, 3.9) : 0, sn = fit ? A.ease(A.ramp(tau, 3.9, 4.8)) : 0;
    var front = A.lerp(950, 70, gp);
    A.show(LG.gym, kind === 'gym' ? alpha : 0); A.show(LG.col, kind === 'col' ? alpha : 0); A.show(LG.wm, kind === 'wm' ? alpha : 0); A.show(LG.pol, kind === 'pol' ? alpha : 0);
    A.show(chain, 1);
    // frames
    for (i = 0; i < 5; i++) {
      var eRef = kind === 'wm' ? EG[i] : 0, eCur = real ? EG[i] : (kind === 'wm' ? EG[i] : 0) + EW[i] * (1 - 0.88 * sn);
      place(ref[i], i, eRef, kind === 'wm' ? WH : G);
      place(cur[i], i, i === 0 && fit ? eRef : eCur, real || i === 0 ? WH : VI);
      A.show(ref[i].g, alpha * (i === 0 && kind !== 'gym' && kind !== 'col' ? 0 : (kind === 'wm' ? 0.75 : 0.9)));
      A.show(cur[i].g, alpha * shown(i));
      e = real ? EG[i] : EW[i] * (1 - 0.88 * sn);
      var bw = i === 0 ? 0 : (9 + 58 * e) * errV * shown(i);
      A.set(bars[i], { x: (XS[i] - bw / 2).toFixed(1), width: bw.toFixed(1) });
      A.show(bars[i], bw > 0.5 ? alpha : 0);
    }
    // chips
    for (i = 0; i < 4; i++) {
      var c = chips[i], cx = GC[i], two = kind !== 'wm', wB = real ? 50 : 44, xB = two ? cx - 4 : cx - 22, xA = cx - 50;
      A.set(c.ra, { x: xA }); A.set(c.ta, { x: xA + 19 }); A.show(c.ra, two ? alpha : 0); A.show(c.ta, two ? alpha : 0);
      A.set(c.rb, { x: xB, width: wB, fill: real ? '#e8e8e8' : (kind === 'pol' ? '#1c1c1c' : '#0f1a06'), stroke: real ? '#e8e8e8' : (kind === 'pol' ? '#8a8a8a' : G),
        'stroke-dasharray': kind === 'pol' ? '5 4' : 'none' });
      A.show(c.rb, alpha);
      A.set(c.tsim, { x: xB + wB / 2 }); A.set(c.tw, { x: xB + wB / 2 }); A.show(c.tsim, real ? alpha : 0); A.show(c.tw, fit ? alpha : 0);
      // the gradient front lights the chip that this loss updates
      var xc = kind === 'wm' ? xB + wB / 2 : xA + 19, lit = 0;
      if (fit && gp > 0) lit = (front < xc ? A.clamp(1 - (xc - front) / 300, 0.25, 1) : 0) * (1 - 0.75 * A.ramp(tau, 4.0, 5.0));
      // the roll-out itself: the chips that produce frame i + 1 light up white, one after the other
      var uf = tau / 0.5 - i, on = uf > 0 && uf < 1, ha = on && two ? A.clamp(Math.min(uf / 0.12, (0.6 - uf) / 0.12), 0, 1) : 0;
      var hb = on ? A.clamp(Math.min((uf - (two ? 0.4 : 0)) / 0.12, (1 - uf) / 0.12), 0, 1) : 0;
      A.set(c.fa, { x: xA - 5, stroke: ha > 0 ? '#fff' : AM }); A.set(c.fb, { x: xB - 5, width: wB + 10, stroke: hb > 0 ? '#fff' : AM });
      A.show(c.fa, alpha * Math.max(ha, kind === 'pol' ? lit : 0)); A.show(c.fb, alpha * Math.max(hb, kind === 'wm' ? lit : 0));
      // real roll-out: the error stops at the simulator
      c.x.setAttribute('transform', 'translate(' + (xB + wB + 7) + ' ' + CY + ')');
      A.show(c.x, kind === 'gym' ? alpha * A.ramp(tau, 3.1, 3.3) : 0);
      var bu = A.ramp(tau, 2.6, 3.1);
      A.set(back[i], { cx: (A.lerp(XS[i + 1] - 6, xB + wB + 12, bu)).toFixed(1), cy: CY });
      A.show(back[i], kind === 'gym' && bu > 0 && bu < 1 ? alpha : 0);
    }
    A.show(noGrad, kind === 'gym' ? alpha * A.ramp(tau, 3.2, 3.6) : 0);
    A.show(startL, kind === 'pol' ? alpha : 0);
    A.show(gT, kind === 'wm' ? alpha : 0);
    // loss and gradient
    A.show(gLoss, fit ? alpha * (0.35 + 0.65 * errV) : 0);
    for (i = 0; i < grad.length; i++) {
      var xg = front + i * 36;
      A.set(grad[i], { cx: xg.toFixed(1), cy: CY });
      A.show(grad[i], fit && gp > 0 && gp < 1 && xg < 948 && xg > 84 ? alpha : 0);
    }
    // buffer
    var hasBuf = kind !== 'gym', head = Math.floor(tw * RATE), wrapped = full || head >= NB, n8 = kind === 'wm' ? 8 : 32, w0 = (kind === 'wm' ? WS8 : WS32)[pass % 5];
    A.show(gBuf, hasBuf ? 1 : 0);
    for (i = 0; i < NB; i++) {
      var op;
      if (kind === 'col') {
        var age = wrapped ? ((head - i) % NB + NB) % NB : head - i;          // tiles written since this one
        op = age < 0 ? 0.1 : A.lerp(1, 0.42, A.clamp((age + (tw * RATE - head)) / 5, 0, 1));
      } else op = fit && i >= w0 && i < w0 + n8 ? 1 : 0.42;
      tiles[i].setAttribute('fill-opacity', (hasBuf ? op : 0).toFixed(2));
    }
    A.show(gWin, fit ? alpha : 0);
    if (fit) {
      var x0 = BX + w0 * BP - 4, x1 = BX + (w0 + n8) * BP + 1;
      A.set(winR, { x: x0, width: x1 - x0 });
      A.set(zoom, { d: 'M72 233L' + x0 + ' ' + (BY - 5) + 'M922 233L' + x1 + ' ' + (BY - 5) });
      A.show(wl8, kind === 'wm' ? 1 : 0); A.show(wl32, kind === 'pol' ? 1 : 0);
    }
    for (i = 0; i < 5; i++) {                                              // a tile flies from each new frame to the write head
      var t0 = i * 0.5, u = (tau - t0) / 0.45, on = kind === 'col' && u > 0 && u < 1;
      if (on) {
        var hx = BX + ((Math.floor((tw - tau + t0 + 0.45) * RATE) % NB + NB) % NB) * BP, uu = A.ease(u);
        A.set(fly[i], { x: A.lerp(XS[i] - 6, hx, uu).toFixed(1), y: A.lerp(GY + 6, BY, uu).toFixed(1) });
      }
      A.show(fly[i], on ? alpha : 0);
    }
  }
  function pillState(i, st) {                                              // 0 hidden · 1 idle · 2 current
    A.show(pills[i].g, st ? 1 : 0);
    A.set(pills[i].r, { fill: st === 2 ? '#fff' : '#161616', stroke: st === 2 ? '#fff' : '#5a5a5a' });
    pills[i].t.style.fill = st === 2 ? '#000' : '#b8b8b8';
  }
  var env = function (u, T) { return Math.min(1, u / 0.3, (T - u) / 0.35); };

  return function draw(f) {
    var s = Math.min(f.step, 4), ts = Math.max(0, f.ts), u, i;
    for (i = 0; i < 3; i++) pillState(i, s < i + 1 ? 0 : (s === i + 1 ? 2 : 1));
    A.show(parr[0], s >= 2 ? 1 : 0); A.show(parr[1], s >= 3 ? 1 : 0); A.show(pback, s >= 4 ? 1 : 0);
    if (s === 0) { u = A.loop(ts, GYM); scene('gym', u, env(u, GYM), 0, 0, false); }
    else if (s === 1) { u = A.loop(ts, COL); scene('col', u, env(u, COL), 0, ts, false); }
    else if (s === 2) { u = A.loop(ts, FIT); scene('wm', u, env(u, FIT), Math.floor(ts / FIT), 0, true); }
    else if (s === 3) { u = A.loop(ts, FIT); scene('pol', u, env(u, FIT), Math.floor(ts / FIT), 0, true); }
    else {
      var T = CYC[0] + CYC[1] + CYC[2], pass = Math.floor(ts / T);
      u = A.loop(ts, T);
      if (u < CYC[0]) { pillState(0, 2); scene('col', u, env(u, CYC[0]), pass, 60 / RATE + pass * CYC[0] + u, true); }
      else if (u < CYC[0] + CYC[1]) { pillState(1, 2); u -= CYC[0]; scene('wm', u * 1.6, env(u, CYC[1]), pass, 0, true); }
      else { pillState(2, 2); u -= CYC[0] + CYC[1]; scene('pol', u * 1.6, env(u, CYC[2]), pass, 0, true); }
    }
  };
});
