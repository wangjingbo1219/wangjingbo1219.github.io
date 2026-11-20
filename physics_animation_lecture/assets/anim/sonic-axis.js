/* Slide "SONIC — the bet": one small picture per row.   <svg data-anim="sonic-axis" data-k="0..3" viewBox="0 0 520 112">
 *   0 data      squares whose AREA is proportional to the training frames of the four runs: 4M, 10M, 22M, 100M (paper, section 2.1)
 *   1 model     squares whose area is proportional to the parameters of the three models: 1.2M, 16M, 42M
 *   2 compute   one cell per GPU, one column per node of 8: 16, 32, 128 GPUs (2, 4, 16 nodes)
 *   3 outcome   tracking error on unseen motions (test-content, MPJPE-L): 27.7 mm with the 1.2M model, 23.8 mm with the 42M model; bars to scale
 * Row k is revealed at build step k + 1: its items appear one after the other, smallest first, and the largest stays highlighted.
 * Every number is the paper's; nothing here is measured from a figure.
 */
DeckAnim.register('sonic-axis', function (el, A) {
  'use strict';
  var SN = window.SN, C = A.C, K = parseInt(el.getAttribute('data-k'), 10), S = K + 1, BASE = 82, GREY = '#6f6f6f';
  var items = [], i;
  // "then": a short arrow between two runs (an arrow, not a bare ">" that could be read as "greater than")
  function chevron(x) { return SN.arrow(A, el, [x - 11, BASE - 30], [x + 13, BASE - 30], { col: C.mute, w: 3, hs: 8 }); }

  if (K === 0 || K === 1) {
    var vals = K === 0 ? [4, 10, 22, 100] : [1.2, 16, 42], labs = K === 0 ? ['4M', '10M', '22M', '100M+'] : ['1.2M', '16M', '42M'];
    var cx = K === 0 ? [34, 122, 218, 350] : [40, 150, 300], vmax = vals[vals.length - 1], SMAX = 76;      // side of the largest square, px
    for (i = 0; i < vals.length; i++) {
      var s = SMAX * Math.sqrt(vals[i] / vmax);
      items.push({ s: s, cx: cx[i],
        rect: A.el('rect', { rx: Math.min(6, s / 4), 'stroke-width': 3 }, el),
        lab: SN.txt(A, el, cx[i], 108, labs[i], { anchor: 'middle', size: 21, weight: 700 }),
        chev: i ? chevron((cx[i - 1] + SMAX * Math.sqrt(vals[i - 1] / vmax) / 2 + cx[i] - s / 2) / 2 - 1) : null });
    }
    var unit = SN.txt(A, el, cx[cx.length - 1] + 54, 108, K === 0 ? 'frames' : 'parameters', { size: 21, fill: C.mid });
    return function draw(f) {
      var ts = SN.since(f, S);
      for (var k = 0; k < items.length; k++) {
        var it = items[k], u = A.ease(A.ramp(ts, 0.25 + 0.55 * k, 0.7 + 0.55 * k)), last = k === items.length - 1;
        var top = last || ts < 0.25 + 0.55 * (k + 1);                                   // the largest one shown so far is the green one
        var w = Math.max(0.01, it.s * u);
        A.set(it.rect, { x: (it.cx - w / 2).toFixed(1), y: (BASE - w).toFixed(1), width: w.toFixed(1), height: w.toFixed(1),
          fill: top ? C.g : '#191919', stroke: top ? C.g : GREY });
        A.show(it.rect, u > 0 ? 1 : 0);
        A.set(it.lab, { style: 'font:700 21px ' + A.FONT + ';fill:' + (top ? '#fff' : C.mid) }); A.show(it.lab, u);
        if (it.chev) A.show(it.chev, u);
      }
      A.show(unit, A.ramp(ts, 0.25 + 0.55 * (items.length - 1), 0.7 + 0.55 * (items.length - 1)));
    };
  }

  if (K === 2) {
    var nodes = [2, 4, 16], gl = ['16', '32', '128 GPUs'], x0 = [16, 96, 196], P = 10, CELL = 8;
    for (i = 0; i < 3; i++) {
      var cells = [], g = A.el('g', {}, el), c, r;
      for (c = 0; c < nodes[i]; c++) for (r = 0; r < 8; r++) cells.push(A.el('rect', { x: x0[i] + c * P, y: BASE - 78 + r * P, width: CELL, height: CELL, rx: 2 }, g));
      var wd = nodes[i] * P - (P - CELL);
      items.push({ cells: cells, n: nodes[i], lab: SN.txt(A, el, i === 2 ? x0[i] + 30 : x0[i] + wd / 2, 108, gl[i], { anchor: i === 2 ? 'start' : 'middle', size: 21, weight: 700 }),
        chev: i ? chevron((x0[i - 1] + nodes[i - 1] * P + x0[i]) / 2 - 2) : null });
    }
    var nd = SN.txt(A, el, x0[2] + 16 * P + 12, BASE - 44, '1 column =', { size: 20, fill: C.mid });
    var nd2 = SN.txt(A, el, x0[2] + 16 * P + 12, BASE - 18, '8-GPU node', { size: 20, fill: C.mid });
    return function draw(f) {
      var ts = SN.since(f, S), T0 = [0.25, 0.9, 1.55], T1 = [0.75, 1.4, 2.6];
      for (var k = 0; k < 3; k++) {
        var it = items[k], u = A.ramp(ts, T0[k], T1[k]), top = k === 2 || ts < T0[k + 1], m = it.cells.length;
        for (var j = 0; j < m; j++) {
          var on = u * m > j;                                                         // cells light up node by node
          A.set(it.cells[j], { fill: top ? C.g : '#3a3a3a' }); A.show(it.cells[j], on ? 1 : 0);
        }
        A.set(it.lab, { style: 'font:700 21px ' + A.FONT + ';fill:' + (top ? '#fff' : C.mid) }); A.show(it.lab, A.ramp(ts, T0[k], T0[k] + 0.3));
        if (it.chev) A.show(it.chev, A.ramp(ts, T0[k], T0[k] + 0.3));
      }
      A.show(nd, A.ramp(ts, 2.3, 2.7)); A.show(nd2, A.ramp(ts, 2.3, 2.7));
    };
  }

  // K === 3: tracking error on unseen motions, smallest against largest model (bars to scale: px per mm)
  var PX = 8.2, X0 = 142, rows = [{ y: 30, name: '1.2M model', v: 27.7, col: GREY, tc: C.mid }, { y: 76, name: '42M model', v: 23.8, col: C.g, tc: '#fff' }];
  for (i = 0; i < 2; i++) {
    var rw = rows[i];
    SN.txt(A, el, 0, rw.y + 7, rw.name, { size: 21, weight: 700, fill: rw.tc });
    rw.bar = A.el('rect', { x: X0, y: rw.y - 13, height: 26, rx: 5, fill: rw.col }, el);
    rw.val = SN.txt(A, el, 0, rw.y + 7, rw.v.toFixed(1) + ' mm', { size: 21, weight: 700, fill: rw.tc });
  }
  var note = SN.txt(A, el, X0, 110, 'tracking error on unseen motions', { size: 20, fill: C.mid });
  return function draw(f) {
    var ts = SN.since(f, S);
    for (var k = 0; k < 2; k++) {
      var u = A.ease(A.ramp(ts, 0.3 + 0.7 * k, 1.1 + 0.7 * k)), w = Math.max(0.01, rows[k].v * PX * u);
      A.set(rows[k].bar, { width: w.toFixed(1) });
      A.set(rows[k].val, { x: (X0 + w + 12).toFixed(1) }); A.show(rows[k].val, A.ramp(ts, 0.9 + 0.7 * k, 1.2 + 0.7 * k));
    }
    A.show(note, A.ramp(ts, 0.3, 0.8));
  };
});
