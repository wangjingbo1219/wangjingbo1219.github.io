/* GPC, slide "how": what passes between the two halves of the tracker, and who writes it.
 *   <svg data-anim="gpc-code" viewBox="0 0 1116 374">   (+ an optional sibling <div class="gpc-eq"> with the FSQ formula, shown during step 1)
 *
 * A SCHEMATIC. The dots, the levels they land on, the token colours and the bar heights are made up (smooth pseudo-random signals, no data).
 * A token's colour only tells the tokens of ONE control step apart: different tokens never share a colour there, equal tokens do.
 * Taken from the paper is the structure only:
 *   d = 40 latent numbers per control step, L = 9 levels per number, z_hat = round(4 tanh z)                       (Sec. 5, Eq. 4; Sec. 8.1)
 *   groups of G = 5 numbers -> 8 tokens, each with 9^5 = 59,049 possible values                                    (Sec. 6, Table 10)
 *   the GPT writes the 8 tokens of a control step one after the other, from the state                              (Eq. 5)
 *   nucleus sampling with top-p = 0.9                                                                               (App. C.1)
 *   adapted rollouts: support = the frozen model's top-p set, the adapted distribution renormalised on it          (App. D.3)
 *
 * Build steps of the slide:
 *   0  the encoder's output: 40 numbers that change with the reference        right: one of them, any real number
 *   1  FSQ: every number snaps to the nearest of 9 levels                     right: the squash-and-round curve for that one number
 *   2  the columns pack into groups of five: 8 tokens                         right: one group, five levels -> one token
 *      (the picture now holds ONE control step's code, then moves on to the next one: the tokens can be read before they change)
 *   3  no encoder: the GPT writes the 8 tokens one by one, every control step right: its next-token probabilities, the top-p set, the pick
 *   4  with adapters: the probabilities are re-weighted inside the frozen GPT's top-p set
 */
DeckAnim.register('gpc-code', function (el, A) {
  'use strict';
  var C = A.C, N = 40, GS = 5, NG = 8, LM = 4;                       // 40 numbers, groups of 5 -> 8 tokens, levels -4 .. +4 (L = 9)
  var FX0 = 104, FW = 656, UP = FW / N, CP = 15, GW = GS * CP, GG = (FW - NG * GW) / (NG - 1);
  var YC = 150, LP = 20, FT = YC - LM * LP - 15, FB = YC + LM * LP + 15;   // level 0 at YC; the field's frame is FT .. FB
  var ZI = 12, ZG = 2;                                                // the number (column) and the group (token) shown up close
  var P = 5.2, TW0 = 0.4, TWD = 0.5, T4 = 1.3;                        // GPT mode: seconds per control step, time of the first token, token pitch; delay at step 4
  var BLUE = C.blue, DIM = '#8d8d8d';
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">' + s + '</tspan>'; };
  var i, g, l, k;

  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 700) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') }, p);
    n.innerHTML = s;
    return n;
  }
  function tanh(x) { var e = Math.exp(2 * x); return (e - 1) / (e + 1); }
  // one smooth signal per number: the encoder's output while a reference plays (schematic)
  var sig = [];
  (function () {
    var r = A.rand(41);
    for (var q = 0; q < N; q++) sig.push([0.75 + 0.55 * r(), 0.30 + 0.45 * r(), 6.283 * r(), 0.25 + 0.45 * r(), 0.8 + 0.9 * r(), 6.283 * r()]);
    sig[ZI] = [1.45, 0.8, 0.4, 0.5, 1.9, 0];
  })();
  function zOf(q, t) { var s = sig[q]; return s[0] * Math.sin(s[1] * t + s[2]) + s[3] * Math.sin(s[4] * t + s[5]); }
  function vOf(q, t) { return LM * tanh(zOf(q, t)); }                 // 4 tanh z: between -4 and 4
  function lev(v) { var r = Math.round(v); return r === 0 ? 0 : r; }  // the FSQ level (no "-0")
  function xU(q) { return FX0 + (q + 0.5) * UP; }                     // 40 evenly spaced columns
  function gx(q) { return FX0 + q * (GW + GG); }                      // left edge of group q
  function xG(q) { return gx(Math.floor(q / GS)) + (q % GS + 0.5) * CP; }
  function yL(v) { return YC - v * LP; }
  // ten colours that can be told apart on a projector (none of them the green of the levels or the grey of the bars)
  var PAL = ['#ff6b5e', '#ff9f43', '#f2d94e', '#35c9c0', '#4fc3f7', '#5b8def', '#9a7bff', '#e77bf0', '#ff8ab8', '#c8a27c'];
  /** The colours of the 8 tokens of one control step: the colour is picked from the token's five levels; a token that would get the
      colour of a DIFFERENT token of the same step takes the next free colour, so that equal colours always mean equal tokens. */
  function tokCols(ls) {
    var ids = [], idx = [], used = {}, gq, q;
    for (gq = 0; gq < NG; gq++) {
      var id = 0, m = 1;
      for (q = 0; q < GS; q++) { id += (ls[gq * GS + q] + LM) * m; m *= 2 * LM + 1; }
      var same = ids.indexOf(id), ci;
      if (same >= 0) ci = idx[same];
      else { ci = (Math.imul(id + 1, 2654435761) >>> 8) % PAL.length; while (used[ci]) ci = (ci + 1) % PAL.length; used[ci] = 1; }
      ids.push(id); idx.push(ci);
    }
    return idx.map(function (ci) { return PAL[ci]; });
  }
  // Step 2 shows control steps one at a time: the code is held for the reader, then glides to the next control step's code.
  var H0 = 3.4, PS = 2.6, GL = 0.4, DS = 1.25;                        // first hold, period, glide (s); how far the signals move per step
  function sigTime(st, t, ts) {                                       // the time at which the encoder's signals are read
    if (st !== 2) return t;
    var t0 = t - ts;                                                  // the moment of the click: the code is frozen there
    if (ts < H0) return t0;
    var kk = Math.floor((ts - H0) / PS);
    return t0 + DS * (kk + A.ease(A.ramp(ts - H0 - kk * PS, 0, GL)));
  }
  function sgn(v) { return v > 0 ? '+' + v : (v < 0 ? '−' + (-v) : '0'); }

  // ------------------------------------------------------------------------------------------ left: the code
  var gL = A.el('g', {}, el);
  A.el('rect', { x: FX0 - 10, y: FT, width: FW + 20, height: FB - FT, rx: 13, fill: '#0b0b0b', stroke: '#2c2c2c', 'stroke-width': 1.5 }, gL);
  var band = A.el('rect', { y: FT + 6, width: 13, height: FB - FT - 12, rx: 6.5, fill: BLUE, 'fill-opacity': 0.24 }, gL);
  var grp = [];
  for (g = 0; g < NG; g++) grp.push(A.el('rect', { y: FT + 5, height: FB - FT - 10, rx: 9, fill: 'none', 'stroke-width': 1.5 }, gL));
  var rungs = A.el('g', { stroke: '#404040', 'stroke-width': 1.5, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, gL);
  for (l = -LM; l <= LM; l++) A.el('line', { x1: FX0, x2: FX0 + FW, y1: yL(l), y2: yL(l) }, rungs);
  var axis = A.el('g', {}, gL);
  txt(axis, FX0 - 22, yL(4) + 7, '+4', { anchor: 'end', fill: C.mid, weight: 500 });
  txt(axis, FX0 - 22, yL(0) + 7, '0', { anchor: 'end', fill: C.mid, weight: 500 });
  txt(axis, FX0 - 22, yL(-4) + 7, '−4', { anchor: 'end', fill: C.mid, weight: 500 });
  var sqr = [], dot = [];
  for (i = 0; i < N; i++) sqr.push(A.el('rect', { width: 11, height: 11, rx: 2.5, fill: C.g }, gL));
  for (i = 0; i < N; i++) dot.push(A.el('circle', { fill: '#fff' }, gL));
  var BRY = FB + 8, CHY = FB + 24, CHH = 38;                          // brackets and token chips under the field
  var brk = [], slot = [], chip = [];
  for (g = 0; g < NG; g++) {
    brk.push(A.el('path', { d: 'M' + gx(g).toFixed(1) + ' ' + BRY + 'v7h' + GW + 'v-7', fill: 'none', stroke: '#6a6a6a', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gL));
    slot.push(A.el('rect', { x: gx(g) + 1, y: CHY + 1, width: GW - 2, height: CHH - 2, rx: 8, fill: 'none', stroke: '#4a4a4a', 'stroke-width': 2, 'stroke-dasharray': '4 5' }, gL));
    chip.push(A.el('rect', { x: gx(g), y: CHY, width: GW, height: CHH, rx: 8 }, gL));
  }
  var cur1 = A.el('rect', { y: CHY - 4, width: GW + 8, height: CHH + 8, rx: 11, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, gL);
  var tokLab = txt(gL, FX0 - 22, CHY + 26, 'tokens', { anchor: 'end', fill: C.mid, weight: 500 });
  var HEAD = ['Encoder output: 40 numbers per control step', 'FSQ: every number snaps to one of 9 levels', '5 levels → 1 token · 8 tokens per control step',
              'No encoder: the GPT writes the 8 tokens, one by one', 'With adapters: the same vocabulary, new probabilities'];
  var head = HEAD.map(function (s) { return txt(gL, FX0 - 10, 37, s, { size: 22 }); });
  // legend (encoder mode) and the control loop (GPT mode), on one line under the tokens
  var LY = 352, leg0 = A.el('g', {}, gL), leg1 = A.el('g', {}, gL);
  A.el('circle', { cx: FX0 - 2, cy: LY - 7, r: 5.5, fill: '#fff' }, leg0);
  var legRaw = txt(leg0, FX0 + 12, LY, 'the encoder’s number', { weight: 500, fill: C.mid });
  var legSq = txt(leg0, FX0 + 12, LY, 'the encoder’s number, squashed', { weight: 500, fill: C.mid });   // from step 1 on: the dot sits at 4 tanh z
  A.el('rect', { x: FX0 + 344, y: LY - 13.5, width: 13, height: 13, rx: 3, fill: C.g }, leg1);
  txt(leg1, FX0 + 366, LY, 'its level: what the decoder gets', { weight: 500, fill: C.mid });
  var loop = A.el('text', { x: FX0 - 10, y: LY, style: 'font:500 20px ' + A.FONT + ';fill:' + C.mute }, gL);
  var LOOP = ['state', '8 tokens', 'frozen decoder', 'simulator', 'next state'], lp = [];
  LOOP.forEach(function (s, q) {
    if (q) A.el('tspan', { text: '  →  ', fill: '#5a5a5a' }, loop);
    lp.push(A.el('tspan', { text: s }, loop));
  });

  // ------------------------------------------------------------------------------------------ right: up close
  var PX = 804, PR = 1096, PM = (PX + PR) / 2;
  A.el('line', { x1: 784, x2: 784, y1: 22, y2: 356, stroke: '#2a2a2a', 'stroke-width': 1.5 }, el);
  var eqEl = el.parentNode && el.parentNode.querySelector ? el.parentNode.querySelector('.gpc-eq') : null;

  // A: one number, squashed and rounded
  var gA = A.el('g', {}, el);
  A.el('rect', { x: PX, y: 21, width: 13, height: 18, rx: 6.5, fill: BLUE, 'fill-opacity': 0.5 }, gA);
  txt(gA, PX + 24, 37, 'One number, up close', { size: 22 });
  var AX0 = 846, AX1 = 1090, AZ = 2.5, AY0 = 204, AS = 24;            // z in [-2.5, 2.5] -> AX0 .. AX1; value v -> AY0 - v * AS
  function aX(zv) { return AX0 + (A.clamp(zv, -AZ, AZ) + AZ) / (2 * AZ) * (AX1 - AX0); }
  function aY(v) { return AY0 - v * AS; }
  var aR = A.el('g', { stroke: '#404040', 'stroke-width': 1.5, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, gA);
  for (l = -LM; l <= LM; l++) A.el('line', { x1: AX0, x2: AX1, y1: aY(l), y2: aY(l) }, aR);
  var aLab = {}, aLabs = A.el('g', {}, gA);
  for (l = -LM; l <= LM; l++) aLab[l] = txt(aLabs, AX0 - 12, aY(l) + 7, sgn(l), { anchor: 'end', fill: C.mid, weight: 500 });
  A.el('path', { d: 'M' + AX0 + ' ' + AY0 + 'H' + AX1, stroke: '#6a6a6a', 'stroke-width': 2, 'stroke-linecap': 'round' }, gA);
  var aEnds = A.el('path', { d: 'M' + (AX0 + 9) + ' ' + (AY0 - 7) + 'L' + AX0 + ' ' + AY0 + 'L' + (AX0 + 9) + ' ' + (AY0 + 7) + 'M' + (AX1 - 9) + ' ' + (AY0 - 7) + 'L' + AX1 + ' ' + AY0 + 'L' + (AX1 - 9) + ' ' + (AY0 + 7),
                             fill: 'none', stroke: '#6a6a6a', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gA);
  var aCap0 = txt(gA, (AX0 + AX1) / 2, AY0 + 46, 'any real number', { anchor: 'middle', weight: 500, fill: C.mid });
  var aCurve = A.el('path', { fill: 'none', stroke: '#d0d0d0', 'stroke-width': 3, 'stroke-linecap': 'round' }, gA);
  (function () { var pts = []; for (var q = 0; q <= 60; q++) { var zv = -AZ + 2 * AZ * q / 60; pts.push([aX(zv), aY(LM * tanh(zv))]); } A.set(aCurve, { d: A.path(pts) }); })();
  var aCap = txt(gA, (AX0 + AX1) / 2, 348, 'the encoder’s number ' + MI('z'), { anchor: 'middle', weight: 500, fill: C.mid });
  var aLink = A.el('line', { stroke: C.g, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, gA);
  var aSq = A.el('rect', { width: 16, height: 16, rx: 3.5, fill: C.g }, gA);
  var aDot = A.el('circle', { r: 7, fill: '#fff', stroke: '#0b0b0b', 'stroke-width': 2 }, gA);

  // B: one token = five levels
  var gB = A.el('g', {}, el);
  A.el('rect', { x: PX, y: 21, width: 18, height: 18, rx: 5, fill: 'none', stroke: BLUE, 'stroke-width': 2.5 }, gB);
  txt(gB, PX + 28, 37, 'One token, up close', { size: 22 });
  var bBox = [], bNum = [], BW5 = 48, BG5 = 9, BX5 = PM - (GS * BW5 + (GS - 1) * BG5) / 2;
  for (k = 0; k < GS; k++) {
    bBox.push(A.el('rect', { x: BX5 + k * (BW5 + BG5), y: 62, width: BW5, height: 48, rx: 9, fill: '#0f1a06', stroke: C.g, 'stroke-width': 2 }, gB));
    bNum.push(txt(gB, BX5 + k * (BW5 + BG5) + BW5 / 2, 94, '0', { anchor: 'middle', size: 23 }));
  }
  A.el('path', { d: 'M' + BX5 + ' 120v8H' + (BX5 + GS * BW5 + (GS - 1) * BG5) + 'v-8M' + PM + ' 128V150M' + (PM - 8) + ' 142L' + PM + ' 151L' + (PM + 8) + ' 142',
                 fill: 'none', stroke: '#8a8a8a', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gB);
  var bChip = A.el('rect', { x: PM - 96, y: 160, width: 192, height: 50, rx: 11 }, gB);
  txt(gB, PM, 193, '1 token', { anchor: 'middle', size: 23, fill: '#000' });
  txt(gB, PM, 248, 'one of 9<tspan dy="-9" style="font-size:15px">5</tspan><tspan dy="9"> = 59,049 values</tspan>', { anchor: 'middle', size: 21 });
  var bMini = [], MW = 27, MG = 7, MX = PM - (NG * MW + (NG - 1) * MG) / 2;
  for (g = 0; g < NG; g++) bMini.push(A.el('rect', { x: MX + g * (MW + MG), y: 282, width: MW, height: 20, rx: 5, 'stroke-width': 2.5 }, gB));
  var bStep = txt(gB, PM, 338, '8 tokens per control step', { anchor: 'middle', weight: 500, fill: C.mid });

  // C: the next token's probabilities
  var gC = A.el('g', {}, el), NB = 12, BX0 = PX + 6, BP = 22, BW = 16, BY = 262, BH = 146;
  txt(gC, PX, 37, 'Next-token probabilities', { size: 22 });
  var cLegend = A.el('g', {}, gC);
  A.el('rect', { x: PX + 1, y: 56, width: 13, height: 16, rx: 2.5, fill: 'none', stroke: '#cfcfcf', 'stroke-width': 2 }, cLegend);
  txt(cLegend, PX + 23, 72, 'frozen GPT', { weight: 500, fill: C.mid });
  A.el('rect', { x: PX + 148, y: 56, width: 13, height: 16, rx: 2.5, fill: C.g }, cLegend);
  txt(cLegend, PX + 170, 72, 'with adapter', { weight: 500, fill: C.mid });
  A.el('path', { d: 'M' + (BX0 - 6) + ' ' + BY + 'H' + (PR + 2), stroke: '#5a5a5a', 'stroke-width': 2, 'stroke-linecap': 'round' }, gC);
  var cFill = [], cOut = [];
  for (k = 0; k < NB; k++) cFill.push(A.el('rect', { x: BX0 + k * BP, width: BW, rx: 3 }, gC));
  for (k = 0; k < NB; k++) cOut.push(A.el('rect', { x: BX0 + k * BP + 1, width: BW - 2, rx: 2.5, fill: 'none', 'stroke-width': 2 }, gC));
  txt(gC, BX0 + NB * BP + 2, BY - 6, '…', { size: 22, fill: DIM });
  var cBr = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gC);
  var cTop = txt(gC, 0, BY + 44, 'top-' + MI('p') + ' = 0.9', { anchor: 'middle', fill: C.g });
  var cOutL = A.el('g', {}, gC);
  txt(cOutL, PR, BY - 50, 'never', { anchor: 'end', weight: 500, fill: DIM }); txt(cOutL, PR, BY - 26, 'sampled', { anchor: 'end', weight: 500, fill: DIM });
  var cPick = A.el('path', { d: 'M-8 -12L8 -12L0 0Z', fill: '#fff' }, gC);
  var cWhat = txt(gC, PM, 346, '', { anchor: 'middle', weight: 500, fill: C.mid });

  /** The schematic distribution of token j in control step c: p = the frozen GPT (12 most likely values + a tail), n = size of its top-p set,
      q = the adapted distribution, zero outside that set and renormalised on it, pk / qk = the value sampled from p / from q. */
  function dist(c, j) {
    var r = A.rand(7919 * (c + 1) + 31 * j), rho = 0.60 + 0.15 * r(), w = [], q, tot = 0;
    for (q = 0; q < NB; q++) w.push(Math.pow(rho, q) * (0.84 + 0.32 * r()));
    w.sort(function (a, b) { return b - a; });
    for (q = 0; q < NB; q++) tot += w[q];
    tot += Math.pow(rho, NB) / (1 - rho);                              // the rest of the vocabulary
    var p = w.map(function (x) { return x / tot; }), cum = 0, n = NB;
    for (q = 0; q < NB; q++) { cum += p[q]; if (cum >= 0.9) { n = q + 1; break; } }
    var fav = 1 + Math.floor(r() * (n - 1)), qq = [], qt = 0, pn = 0;   // the token the task prefers: in the set, but not the most likely one
    for (q = 0; q < NB; q++) { var b = q < n ? p[q] * (q === fav ? 5.5 : 0.3 + 0.5 * r()) : 0; qq.push(b); qt += b; if (q < n) pn += p[q]; }
    for (q = 0; q < NB; q++) qq[q] /= qt;
    var u = r(), pk = n - 1, qk = n - 1, acc = 0;
    for (q = 0; q < n; q++) { acc += p[q] / pn; if (u <= acc) { pk = q; break; } }
    for (q = 0, acc = 0; q < n; q++) { acc += qq[q]; if (u <= acc) { qk = q; break; } }
    return { p: p, q: qq, n: n, pk: pk, qk: qk };
  }

  return function draw(f) {
    var st = f.step, ts = f.ts, t = f.t, q, gi;
    var gpt = st >= 3;
    var uR = st > 1 ? 1 : (st === 1 ? A.ease(A.ramp(ts, 0.05, 0.6)) : 0);          // the 9 levels appear
    var uG = st > 2 ? 1 : (st === 2 ? A.ease(A.ramp(ts, 0.1, 1.0)) : 0);           // the columns close up into groups of five
    var uT = st > 2 ? 1 : (st === 2 ? A.ramp(ts, 0.8, 1.3) : 0);                   // brackets and tokens appear
    var uE = gpt ? (st === 3 ? 1 - A.ramp(ts, 0, 0.35) : 0) : 1;                   // the encoder's numbers (gone in GPT mode)
    // GPT mode: one control step every P seconds; token j is written at TW0 + j * TWD
    var tl = st > 3 ? Math.max(0, ts - T4) : ts;                                    // step 4 starts with the adapter coming in
    var c = gpt ? Math.floor(tl / P) + (st > 3 ? 7 : 0) : 0, u = gpt ? tl - Math.floor(tl / P) * P : 0;
    var tc = 50 + 0.9 * c + (st > 3 ? 31 : 0);                                      // where that control step's code is read off the signals
    var endFade = gpt ? 1 - A.ramp(u, P - 0.25, P) : 1;
    function written(gq) { return A.ramp(u - (TW0 + gq * TWD + 0.28), 0, 0.12); }
    var jc = gpt ? Math.floor((u - TW0) / TWD) : -1;                                // the token being written (-1 before, >= NG after)
    var tS = sigTime(st, t, ts);                                                    // encoder mode: where the signals are read
    var uR2 = st > 1 ? 1 : (st === 1 ? A.ease(A.ramp(ts, 0.2, 0.65)) : 0);          // right panel: the levels come in after "any real number" has gone

    // ---- left
    for (q = 0; q < 5; q++) A.show(head[q], q === Math.min(st, 4) ? 1 : 0);
    A.show(rungs, 0.9 * uR); A.show(axis, uR);
    A.set(band, { x: (A.lerp(xU(ZI), xG(ZI), uG) - 6.5).toFixed(1) });
    A.show(band, st <= 1 ? 1 : (st === 2 ? 1 - A.ramp(ts, 0, 0.3) : 0));
    var levels = [];
    for (q = 0; q < N; q++) {
      var x = A.lerp(xU(q), xG(q), uG), v = gpt ? LM * tanh(zOf(q, tc)) : vOf(q, tS), L = lev(v);
      gi = Math.floor(q / GS);
      levels.push(L);
      A.set(dot[q], { cx: x.toFixed(1), cy: yL(v).toFixed(1), r: (5 - 1.4 * uR).toFixed(2) });
      A.show(dot[q], uE * (1 - 0.2 * uR));
      A.set(sqr[q], { x: (x - 5.5).toFixed(1), y: (yL(L) - 5.5).toFixed(1) });
      A.show(sqr[q], gpt ? A.ramp(u - (TW0 + gi * TWD + 0.34), 0, 0.12) * endFade
                         : (st > 1 ? 1 : (st === 1 ? A.ramp(ts - 0.35 - q * 0.02, 0, 0.15) : 0)));
    }
    var cols = tokCols(levels);
    for (gi = 0; gi < NG; gi++) {
      var on = gpt && gi === jc;
      A.set(grp[gi], { x: (gx(gi) - 2).toFixed(1), width: GW + 4, stroke: on ? '#fff' : (st === 2 && gi === ZG ? BLUE : '#3c3c3c'), 'stroke-width': on || (st === 2 && gi === ZG) ? 2.5 : 1.5 });
      A.show(grp[gi], uG >= 1 ? 1 : A.ramp(uG, 0.6, 1));
      A.show(brk[gi], uT);
      A.set(chip[gi], { fill: cols[gi] });
      A.show(chip[gi], gpt ? written(gi) * endFade : uT);
      A.show(slot[gi], gpt ? 1 : 0);
    }
    A.show(tokLab, uT);
    A.set(cur1, { x: (gx(A.clamp(jc, 0, NG - 1)) - 4).toFixed(1) });
    A.show(cur1, gpt && jc >= 0 && jc < NG ? 1 : 0);
    A.show(leg0, gpt ? 0 : 1); A.show(legRaw, 1 - uR); A.show(legSq, uR); A.show(leg1, gpt ? 0 : (st > 1 ? 1 : (st === 1 ? A.ramp(ts, 0.5, 0.9) : 0)));
    A.show(loop, gpt ? 1 : 0);
    if (gpt) {
      var ph = u < TW0 ? 0 : (u < TW0 + NG * TWD ? 1 : (u < TW0 + NG * TWD + 0.3 ? 2 : (u < P - 0.25 ? 3 : 4)));
      for (q = 0; q < lp.length; q++) A.set(lp[q], { fill: q === ph ? '#fff' : C.mute, 'font-weight': q === ph ? 700 : 500 });
    }

    // ---- right, A: one number (steps 0 and 1)
    var oA = st <= 1 ? 1 : (st === 2 ? 1 - A.ramp(ts, 0, 0.3) : 0);
    A.show(gA, oA);
    if (oA > 0) {
      var zz = zOf(ZI, tS), vv = LM * tanh(zz), LL = lev(vv), lift = st >= 1 ? (st > 1 ? 1 : A.ease(A.ramp(ts, 0.25, 0.95))) : 0;
      var uOld = st === 0 ? 1 : (st === 1 ? 1 - A.ramp(ts, 0, 0.2) : 0);            // "any real number" and the open ends of the axis leave first
      A.show(aR, 0.9 * uR2); A.show(aLabs, uR2); A.show(aCurve, lift); A.show(aCap, uR2); A.show(aCap0, uOld); A.show(aEnds, uOld);
      A.set(aDot, { cx: aX(zz).toFixed(1), cy: A.lerp(AY0, aY(vv), lift).toFixed(1) });
      var sOn = st > 1 ? 1 : (st === 1 ? A.ramp(ts, 0.95, 1.25) : 0);
      A.set(aSq, { x: (aX(zz) - 8).toFixed(1), y: (aY(LL) - 8).toFixed(1) }); A.show(aSq, sOn);
      A.set(aLink, { x1: aX(zz).toFixed(1), x2: aX(zz).toFixed(1), y1: aY(vv).toFixed(1), y2: aY(LL).toFixed(1) }); A.show(aLink, sOn);
      for (var key in aLab) { aLab[key].style.fill = sOn > 0.5 && +key === LL ? C.g : C.mid; aLab[key].style.fontWeight = sOn > 0.5 && +key === LL ? 700 : 500; }
    }
    if (eqEl) eqEl.style.opacity = st === 1 ? A.ramp(ts, 0.5, 0.9) : 0;

    // ---- right, B: one token (step 2)
    var oB = st === 2 ? A.ramp(ts, 0.3, 0.7) : 0;
    A.show(gB, oB);
    if (oB > 0) {
      var five = levels.slice(ZG * GS, ZG * GS + GS);
      for (q = 0; q < GS; q++) bNum[q].textContent = sgn(five[q]);
      A.set(bChip, { fill: cols[ZG] });
      for (gi = 0; gi < NG; gi++) A.set(bMini[gi], { fill: cols[gi], stroke: gi === ZG ? '#fff' : 'none' });
      var ph2 = ts < H0 ? PS : (ts - H0) % PS, fresh = ph2 < GL + 0.6;              // the code has just moved on to the next control step
      bStep.style.fill = fresh ? '#fff' : C.mid; bStep.style.fontWeight = fresh ? 700 : 500;
    }

    // ---- right, C: the next token's probabilities (steps 3 and 4)
    var oC = st === 3 ? A.ramp(ts, 0.2, 0.55) : (st > 3 ? 1 : 0);
    A.show(gC, oC);
    if (oC > 0) {
      var jd = A.clamp(jc, 0, NG - 1), D = dist(c, jd), D0 = jd > 0 ? dist(c, jd - 1) : D;
      var mix = jd > 0 ? A.ease(A.ramp(u - (TW0 + jd * TWD), 0, 0.16)) : 1;       // bars slide from the previous token's distribution
      var ad = st > 3 ? A.ease(A.ramp(ts, 0.25, 1.35)) : 0;                        // the adapter comes in
      var picked = jc >= 0 && u >= TW0 + jd * TWD + 0.22, pk = st > 3 ? D.qk : D.pk;
      var top = Math.max(D.p[0], st > 3 ? Math.max.apply(null, D.q) : 0), top0 = Math.max(D0.p[0], st > 3 ? Math.max.apply(null, D0.q) : 0);
      var n = D.n, colNow = cols[jd];
      for (q = 0; q < NB; q++) {
        var hp = A.lerp(D0.p[q] / top0, D.p[q] / top, mix) * BH, hq = A.lerp(D0.q[q] / top0, D.q[q] / top, mix) * BH, hf = A.lerp(hp, hq, ad);
        var inside = q < n;
        A.set(cFill[q], { y: (BY - hf).toFixed(1), height: Math.max(0, hf).toFixed(1), fill: picked && q === pk ? colNow : (inside ? (st > 3 ? C.g : '#cfcfcf') : '#3a3a3a') });
        A.set(cOut[q], { y: (BY - hp).toFixed(1), height: Math.max(0, hp).toFixed(1), stroke: inside ? '#cfcfcf' : '#4a4a4a' });
        A.show(cOut[q], ad);
      }
      var bx0 = BX0 - 3, bx1 = BX0 + (n - 1) * BP + BW + 3;
      A.set(cBr, { d: 'M' + bx0 + ' ' + (BY + 9) + 'v7H' + bx1 + 'v-7' });
      A.set(cTop, { x: Math.max(PX + 56, (bx0 + bx1) / 2).toFixed(1) });
      A.set(cPick, { transform: 'translate(' + (BX0 + pk * BP + BW / 2) + ' ' + (BY - Math.max(D.p[pk], st > 3 ? D.q[pk] : 0) / top * BH - 7).toFixed(1) + ')' });
      A.show(cPick, picked ? 1 : 0);
      A.show(cLegend, ad);
      var say = st > 3 && ts < T4 ? 're-weighted inside top-p' : (jc < 0 ? 'state in: a new control step' : (jc >= NG ? 'all 8 written: decode, simulate' : 'writing token ' + (jd + 1) + ' of 8'));
      if (cWhat.textContent !== say) cWhat.textContent = say;
    }
  };
});
