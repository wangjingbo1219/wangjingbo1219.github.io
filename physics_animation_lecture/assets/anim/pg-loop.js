/*! "PPO in pictures: the training loop" (slide 01_13_ppo.py): collect -> score -> update -> repeat.
 *  An overlay over the three columns of the slide (the stage boxes and the clip are HTML). Schematic, with DeepMimic's sizes:
 *    the batch     64 x 64 = 4,096 cells, one per sample
 *    collect       cells fill up while samples arrive from the simulation
 *    score         every cell gets the sign of its advantage (green > 0, amber < 0; drawn at random, about half each)
 *    update        16 minibatches of 256 random cells (one pass over the batch) light up, fly to the policy, and each one
 *                  moves the policy a little
 *    repeat        the batch is thrown away and the new policy collects the next one
 *  step 0 loops "collect", step 1 "score", step 2 "update"; on the fully built slide (step 3) the whole loop runs.
 *  The stage box of the running stage gets the class .lit (elements .pg-st in the same section, made for this script). */
DeckAnim.register('pg-loop', function (el, A) {
  'use strict';
  var K = window.PGKit, NEW = A.C.blue;
  var GX = 726, GY = 128, P = 4.5, NC = 64, NS = NC * NC, MB = 256, NM = NS / MB;       // 16 minibatches: one pass over the batch
  var TC = 6.6, TS = 4.0, STEPDT = 0.55, TU = 0.3 + NM * STEPDT + 1.9, CYCLE = TC + TS + TU;
  var FILL = ['none', '#7b7b7b', A.C.g, A.C.amber, '#ffffff'];

  // ---- fixed random structure: sign of each sample's advantage, the order in which minibatches take the samples, the size of each policy step
  var rnd = A.rand(41), sign = new Uint8Array(NS), order = [], mbOf = new Int16Array(NS), i, j;
  for (i = 0; i < NS; i++) { sign[i] = rnd() < 0.5 ? 2 : 3; order.push(i); }
  for (i = NS - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
  for (i = 0; i < NS; i++) mbOf[order[i]] = Math.floor(i / MB);            // 16 disjoint minibatches = every sample is used once
                                                                           // (DeepMimic's released configuration: one epoch per batch)
  var nud = [], cum = [0];
  for (j = 0; j < NM; j++) { nud.push(0.0085 * (0.55 + 0.9 * rnd())); cum.push(cum[j] + nud[j]); }
  var MU0 = 0.12, SG = 0.22, DIT = cum[NM];                                // the policy mean moves by DIT per iteration

  // ---- stage boxes (HTML) and connectors
  var sec = el.closest('section'), boxes = sec ? sec.querySelectorAll('.pg-st') : [], litNow = -2;
  function light(n) {
    if (n === litNow) return;
    litNow = n;
    for (var b = 0; b < boxes.length; b++) boxes[b].classList.toggle('lit', b === n);
  }
  function arrow(x1, x2, y) { return A.el('path', { d: 'M' + x1 + ' ' + y + ' H' + x2 + ' ' + K.head(x2, y, 1, 0, 11), fill: 'none', stroke: A.C.g, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el); }
  arrow(548, 590, 68); arrow(1148, 1190, 68);
  // the way back: update -> collect, over the top of the three boxes (fully built slide only)
  var back = A.el('g', null, el);
  var backA = A.el('path', { d: 'M1470 30 V14 H1180', fill: 'none', stroke: A.C.g, 'stroke-width': 4, 'stroke-linejoin': 'round' }, back);
  var backB = A.el('path', { d: 'M560 14 H270 V20', fill: 'none', stroke: A.C.g, 'stroke-width': 4, 'stroke-linejoin': 'round' }, back);
  A.el('path', { d: 'M260 17 H280 L270 31 Z', fill: A.C.g, stroke: A.C.g, 'stroke-width': 2, 'stroke-linejoin': 'round' }, back);
  A.text(back, 870, 21, 'throw the data away, collect again with the new policy', { size: 21, anchor: 'middle', fill: A.C.g, halo: false });

  // ---- the batch
  var defs = A.el('defs', null, el);
  var pat = A.el('pattern', { id: 'pg-loop-cells', x: GX, y: GY, width: P, height: P, patternUnits: 'userSpaceOnUse' }, defs);
  A.el('rect', { x: 0, y: 0, width: P - 1, height: P - 1, fill: '#1e1e1e' }, pat);
  A.el('rect', { x: GX - 7, y: GY - 7, width: NC * P + 13, height: NC * P + 13, rx: 8, fill: '#0b0b0b', stroke: A.C.line, 'stroke-width': 2 }, el);
  A.el('rect', { x: GX, y: GY, width: NC * P, height: NC * P, fill: 'url(#pg-loop-cells)' }, el);
  var cellG = A.el('g', { 'shape-rendering': 'crispEdges' }, el), cells = [], state = new Uint8Array(NS);
  for (i = 0; i < NS; i++) cells.push(A.el('rect', { x: GX + (i % NC) * P, y: GY + Math.floor(i / NC) * P, width: P - 1, height: P - 1, fill: 'none' }, cellG));
  var scan = A.el('line', { x1: GX - 4, x2: GX + NC * P + 3, stroke: A.C.white, 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var capB = A.el('text', { x: GX + NC * P / 2, y: 448, 'text-anchor': 'middle', style: 'font:500 20px ' + A.FONT + ';fill:#d2d2d2' }, el);
  // legend of the two colours (appears with "score")
  var leg = A.el('g', null, el);
  A.el('rect', { x: 1032, y: 322, width: 16, height: 16, rx: 2, fill: A.C.g }, leg);
  A.set(A.text(leg, 1056, 337, '', { size: 20, halo: false }), { html: K.mi('Â') + ' &gt; 0' });
  A.el('rect', { x: 1032, y: 356, width: 16, height: 16, rx: 2, fill: A.C.amber }, leg);
  A.set(A.text(leg, 1056, 371, '', { size: 20, halo: false }), { html: K.mi('Â') + ' &lt; 0' });

  // ---- samples streaming in from the simulation (collect)
  var NP = 16, parts = [];
  for (i = 0; i < NP; i++) parts.push(A.el('rect', { width: 6, height: 6, rx: 1, fill: '#b8b8b8' }, el));

  // ---- one minibatch on its way to the policy (update)
  var tile = A.el('g', null, el), TW = 48;
  A.el('rect', { x: -TW / 2, y: -TW / 2, width: TW, height: TW, rx: 5, fill: '#0b0b0b', stroke: A.C.white, 'stroke-width': 2 }, tile);
  var tr = A.rand(9);
  for (i = 0; i < 36; i++) A.el('rect', { x: -TW / 2 + 5 + (i % 6) * 6.6, y: -TW / 2 + 5 + Math.floor(i / 6) * 6.6, width: 5, height: 5, fill: tr() < 0.5 ? A.C.g : A.C.amber }, tile);
  A.text(tile, 0, TW / 2 + 24, '256', { size: 20, anchor: 'middle' });

  // ---- the policy (one joint)
  var z3 = A.el('g', null, el), YB = 400, BH = 168;
  function X3(a) { return 1310 + (a + 0.3) * 236; }
  A.el('line', { x1: 1230, y1: YB, x2: 1730, y2: YB, stroke: A.C.line, 'stroke-width': 2 }, z3);
  var oldB = A.el('path', { fill: 'none', stroke: A.C.white, 'stroke-width': 3, 'stroke-dasharray': '5 7', 'stroke-linecap': 'round' }, z3);
  var newB = A.el('path', { fill: 'none', stroke: NEW, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, z3);
  A.el('line', { x1: 1232, y1: 143, x2: 1276, y2: 143, stroke: A.C.white, 'stroke-width': 3, 'stroke-dasharray': '5 7', 'stroke-linecap': 'round' }, z3);
  A.text(z3, 1288, 150, 'old policy: it collected this batch', { size: 20, halo: false });
  A.el('line', { x1: 1232, y1: 175, x2: 1276, y2: 175, stroke: NEW, 'stroke-width': 4, 'stroke-linecap': 'round' }, z3);
  A.text(z3, 1288, 182, 'new policy: a small step per minibatch', { size: 20, halo: false, fill: NEW });
  A.el('text', { x: 1480, y: 448, 'text-anchor': 'middle', style: 'font:500 20px ' + A.FONT + ';fill:#d2d2d2', text: 'The policy for one joint (target angle)' }, z3);

  function paint(filled, rows, mbi, alpha) {
    for (var c = 0; c < NS; c++) {
      var s = c >= filled ? 0 : (mbi >= 0 && mbOf[c] === mbi ? 4 : (Math.floor(c / NC) < rows ? sign[c] : 1));
      if (s !== state[c]) { state[c] = s; cells[c].setAttribute('fill', FILL[s]); }
    }
    A.show(cellG, alpha);
  }
  function bells(muOld, muNew, o) {
    A.set(oldB, { d: K.bell(X3, YB, BH, muOld, SG, muOld - 3.1 * SG, muOld + 3.1 * SG) });
    A.set(newB, { d: K.bell(X3, YB, BH, muNew, SG, muNew - 3.1 * SG, muNew + 3.1 * SG) });
    A.show(oldB, o); A.show(newB, o);
  }

  return function draw(f) {
    var full = f.step >= 3, ph, u, it = 0, wrap = 1;
    if (!full) {
      ph = Math.min(2, Math.max(0, f.step));
      u = A.loop(f.ts, [TC + 0.7, TS + 0.7, TU + 0.6][ph]);
    } else {
      var c = A.loop(f.ts, CYCLE);
      it = Math.floor(f.ts / CYCLE) % 3;
      ph = c < TC ? 0 : (c < TC + TS ? 1 : 2);
      u = c - [0, TC, TC + TS][ph];
      if (ph === 0 && it === 0 && f.ts > CYCLE) wrap = A.ramp(u, 0.05, 0.6);            // the policy returns to its starting place
    }
    light(ph);
    A.show(back, full ? A.ramp(f.ts, 0.1, 0.7) : 0);
    var off = (-(f.t * 50) % 24).toFixed(1);                     // dashes run from "update" back to "collect"
    A.set(backA, { 'stroke-dasharray': '14 10', 'stroke-dashoffset': off }); A.set(backB, { 'stroke-dasharray': '14 10', 'stroke-dashoffset': off });

    var filled = NS, rows = NC, mbi = -1, alpha = 1, muOld = MU0 + it * DIT, muNew = muOld, cap = '';
    var showParts = 0, showScan = 0, showTile = 0, tx = 0, legO = 1;
    if (ph === 0) {                                              // ---- collect
      var pf = A.ramp(u, 0.5, 5.3);
      filled = Math.round(NS * pf); rows = 0; legO = 0;
      alpha = full ? 1 : 1 - A.ramp(u, TC + 0.15, TC + 0.6);
      showParts = (u > 0.2 && pf < 1) ? 1 : 0;
      cap = K.int(filled) + ' of 4,096 samples collected';
    } else if (ph === 1) {                                       // ---- score
      var ps = A.ramp(u, 0.4, 2.8);
      rows = Math.round(NC * ps) * (full ? 1 : (u > TS + 0.25 ? 0 : 1));
      showScan = (ps > 0 && ps < 1) ? 1 : 0;
      legO = A.ramp(u, 0.4, 0.9);
      cap = ps < 1 ? 'scoring: ' + K.int(rows * NC) + ' of 4,096' : (rows ? '4,096 samples, each with its advantage' : '4,096 of 4,096 samples collected');
    } else {                                                     // ---- update
      var k = Math.floor((u - 0.3) / STEPDT), v = u - 0.3 - k * STEPDT, endT = 0.3 + NM * STEPDT;
      if (u >= 0.3 && k < NM) {
        if (v < 0.30) mbi = k;
        showTile = A.ramp(v, 0.02, 0.12) * (1 - A.ramp(v, 0.42, 0.53));
        tx = A.ease(A.ramp(v, 0.08, 0.48));
        muNew = muOld + cum[k] + nud[k] * A.ease(A.ramp(v, 0.38, 0.54));
        cap = 'minibatches of 256, drawn at random';
      } else if (u >= endT) {                                    // the batch is thrown away; the new policy is now the one that collects
        muNew = muOld + cum[NM];
        alpha = 1 - A.ramp(u, endT + 0.25, endT + 1.05);
        muOld = A.lerp(muOld, muNew, A.ease(A.ramp(u, endT + 0.5, endT + 1.3)));
        cap = u > endT + 0.25 ? 'batch thrown away' : 'minibatches of 256, drawn at random';
        if (!full) wrap = 1 - A.ramp(u, TU + 0.1, TU + 0.55);              // step 2 loops this stage: the policy fades back to where it started
        else if (it === 2) wrap = 1 - A.ramp(u, TU - 0.45, TU - 0.05);     // after three rounds the picture starts over
      } else {
        cap = '4,096 samples, each with its advantage';
        if (!full && f.ts > TU + 0.6) { alpha = A.ramp(u, 0, 0.3); wrap = alpha; }      // restart of the loop: the batch is back
      }
    }
    paint(filled, rows, mbi, alpha);
    A.show(leg, legO * alpha);
    A.set(scan, { y1: GY + rows * P, y2: GY + rows * P }); A.show(scan, showScan);
    K.html(capB, cap);
    for (var n = 0; n < NP; n++) {
      var q = A.loop(f.ts * 0.9 + n / NP, 1), yEnd = GY + Math.min(NC - 1, Math.floor(filled / NC)) * P, y0 = 212 + 120 * ((n * 7) % NP) / NP;
      A.set(parts[n], { x: A.lerp(548, GX - 12, q), y: A.lerp(y0, yEnd, q * q) - 3 });
      A.show(parts[n], showParts * Math.min(1, q * 6) * (1 - A.ramp(q, 0.9, 1)));
    }
    A.set(tile, { transform: 'translate(' + A.lerp(GX + NC * P + 34, 1256, tx).toFixed(1) + ' 236)' }); A.show(tile, showTile);
    bells(muOld, muNew, wrap);
    A.show(z3, f.step >= 2 ? 1 : 0.35);                         // the policy panel waits, dimmed, until "update" is explained
  };
});
