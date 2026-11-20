/* AdaptNet, slide "how": what an internal adaptor is, and what it buys.     <svg data-anim="adaptnet-layer" data-s-in="2" data-s-train="3" data-s-alpha="4" viewBox="0 0 586 272">
 *
 * Top: SCHEMATIC of one fully-connected layer of the frozen policy with its adaptor (Eq. 7):  z_i = F_theta(z_{i-1}) + F_eta(z_{i-1}).
 *   The latent goes through the frozen layer (white pulses) and, in parallel, through the new layer (green pulses); the two outputs are added.
 *   The brightness of the green pulses and the label after the adaptor ("+ 0", "+ dz", "+ alpha dz") show the strength of the branch:
 *     data-s-in      1 (the trained adaptor)
 *     data-s-train   zero initialization: 0 at iteration 0, then growing (ADAPTNET.train: the same loop as in adaptnet-latent)
 *     data-s-alpha   the run-time scale alpha, measured on the clip's slider (Eq. 13 scales the adaptors and the latent offset alike)
 * Bottom: NUMBERS FROM THE PAPER, Table 2: mean imitation error in metres with the latent offset only (column "LSA", grey) and with
 *   the internal adaptors added (column "AdaptNet (LSA+IA)", green), for one easy style (Stoop) and the three styles the paper names
 *   as the ones where the adaptors help most (Goose Step, Jaunty Skip, Joyful Walk). The standard deviations of the table are not drawn.
 */
DeckAnim.register('adaptnet-layer', function (el, A) {
  'use strict';
  var C = A.C, AN = window.ADAPTNET, G = C.g, sec = el.closest('section');
  var S_IN = +el.getAttribute('data-s-in'), S_TRAIN = +el.getAttribute('data-s-train'), S_ALPHA = +el.getAttribute('data-s-alpha');
  var mi = function (s, z) { return AN.mi(A, s, z); }, T = function (p, x, y, h, o) { return AN.txt(A, p, x, y, h, o); };
  var TAB = [['Stoop', 0.07, 0.07], ['Goose step', 0.18, 0.11], ['Jaunty skip', 0.22, 0.16], ['Joyful walk', 0.22, 0.17]];      // Table 2: LSA, AdaptNet (LSA+IA)

  T(el, 22, 35, 'ONE FC LAYER · SCHEMATIC', { size: 20, fill: G, ls: '.09em' });

  // ---------- the layer and its branch ----------
  var YT = 66, YB = 112, YM = 89, BX0 = 170, BX1 = 350, PX = 426;
  function wire(pts, col) {
    var d = '', k;
    for (k = 0; k < pts.length; k++) d += (k ? 'L' : 'M') + pts[k][0] + ' ' + pts[k][1];
    return A.el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  }
  var pTop = [[84, YM], [116, YM], [116, YT], [BX0, YT], [BX1, YT], [PX, YT], [PX, YM - 16]];
  var pBot = [[116, YM], [116, YB], [BX0, YB], [BX1, YB], [PX, YB], [PX, YM + 16]];
  var pOut = [[PX + 16, YM], [PX + 62, YM]];
  wire(pTop, '#8d8d8d'); var wBot = wire(pBot, G); wire(pOut, '#8d8d8d');
  A.el('path', { d: 'M' + (PX + 62) + ' ' + YM + 'l-11 -7v14z', fill: '#8d8d8d' }, el);
  T(el, 22, YM + 8, mi('z') + AN.sup(mi('i') + '−1', 9), { size: 21 });
  T(el, PX + 74, YM + 8, mi('z') + AN.sup(mi('i'), 9), { size: 21 });
  function dots(n, col) { var o = [], k; for (k = 0; k < n; k++) o.push(A.el('circle', { r: 5.5, fill: col, stroke: '#101010', 'stroke-width': 1.5 }, el)); return o; }
  var dTop = dots(3, '#fff'), dBot = dots(3, '#d9ff7a'), dOut = dots(1, '#fff');          // created before the boxes: the pulses pass behind them
  A.el('rect', { x: BX0, y: YT - 19, width: BX1 - BX0, height: 38, rx: 10, fill: '#1c1c1c', stroke: '#8a8a8a', 'stroke-width': 2, 'stroke-dasharray': '7 5' }, el);
  T(el, (BX0 + BX1) / 2, YT + 7, 'frozen FC layer', { size: 20, anchor: 'middle' });
  A.el('rect', { x: BX0, y: YB - 19, width: BX1 - BX0, height: 38, rx: 10, fill: G, stroke: G, 'stroke-width': 2 }, el);
  T(el, (BX0 + BX1) / 2, YB + 7, 'adaptor (new FC)', { size: 20, anchor: 'middle', fill: '#000' });
  A.el('circle', { cx: PX, cy: YM, r: 15, fill: '#161616', stroke: '#e8e8e8', 'stroke-width': 3 }, el);
  A.el('path', { d: 'M' + (PX - 8) + ' ' + YM + 'h16M' + PX + ' ' + (YM - 8) + 'v16', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var lAdd = T(el, BX1 + 14, YB + 28, '', { size: 20, fill: G });
  var trTop = AN.track(pTop), trBot = AN.track(pBot), trOut = AN.track(pOut);
  function run(nodes, tr, t, speed, op) {
    var gap = tr.len / nodes.length, k, s, p;
    for (k = 0; k < nodes.length; k++) {
      s = (((t * speed + k * gap) % tr.len) + tr.len) % tr.len; p = tr.at(s);
      A.set(nodes[k], { cx: p[0].toFixed(1), cy: p[1].toFixed(1) });
      A.show(nodes[k], Math.min(1, s / 12, (tr.len - s) / 12) * op);
    }
  }

  // ---------- Table 2 ----------
  var BY = 176, CW = 138, BW = 118, SC = BW / 0.25;                 // bar scale: 0.25 m = full track
  T(el, 22, BY, 'Mean imitation error (m)', { size: 20, weight: 500, fill: C.mid });
  A.el('rect', { x: 298, y: BY - 14, width: 14, height: 14, rx: 3, fill: '#8a8a8a' }, el);
  T(el, 318, BY, 'offset only', { size: 20, weight: 500, fill: C.mid });
  A.el('rect', { x: 444, y: BY - 14, width: 14, height: 14, rx: 3, fill: G }, el);
  T(el, 464, BY, '+ adaptors', { size: 20, weight: 500, fill: G });
  var cols = TAB.map(function (r, k) {
    var x = 22 + k * CW, g = A.el('g', null, el);
    T(g, x, BY + 29, r[0], { size: 20 });
    A.el('rect', { x: x, y: BY + 38, width: BW, height: 13, rx: 4, fill: '#1e1e1e' }, g);
    var o = { lsa: A.el('rect', { x: x, y: BY + 38, width: 0, height: 13, rx: 4, fill: '#8a8a8a' }, g),
              all: A.el('rect', { x: x, y: BY + 38, width: 0, height: 13, rx: 4, fill: G }, g) };
    o.n1 = T(g, x, BY + 76, r[1].toFixed(2), { size: 20, weight: 500, fill: C.mid });
    o.n2 = T(g, x + 48, BY + 76, (r[2] < r[1] ? '→ ' : '= ') + r[2].toFixed(2), { size: 20, fill: r[2] < r[1] ? G : '#fff' });
    return o;
  });
  var last = {};
  function setText(node, key, html) { if (last[key] !== html) { last[key] = html; A.set(node, { html: html }); } }

  return function draw(f) {
    var st = f.step, mode = st >= S_ALPHA ? 2 : (st === S_TRAIN ? 1 : 0), g, tr = null;
    if (mode === 2) g = AN.alpha(AN.clock(sec, f));
    else if (mode === 1) { tr = AN.train(f.ts); g = tr.g; }
    else g = 1;
    run(dTop, trTop, f.t, 90, 1); run(dBot, trBot, f.t, 90, g); run(dOut, trOut, f.t + 0.2, 90, 1);
    A.show(wBot, 0.35 + 0.65 * g);
    setText(lAdd, 'l', mode === 2 ? '+ ' + mi('α') + ' Δ' + mi('z') : (mode === 1 && tr.zero ? '+ 0 at iteration 0' : '+ Δ' + mi('z')));
    lAdd.style.fill = (mode === 1 && tr.zero) ? C.amber : G;
    // the bars are drawn in when the figure appears: first the offset alone, then with the adaptors
    var u1 = st === S_IN ? A.ease(A.ramp(f.ts, 0.5, 1.4)) : 1, u2 = st === S_IN ? A.ease(A.ramp(f.ts, 1.9, 2.8)) : 1;
    cols.forEach(function (c, k) {
      var r = TAB[k];
      A.set(c.lsa, { width: (r[1] * SC * u1).toFixed(1) }); A.set(c.all, { width: (r[2] * SC * u2).toFixed(1) });
      A.show(c.n1, A.ramp(u1, 0.6, 1)); A.show(c.n2, A.ramp(u2, 0.6, 1));
    });
  };
});
