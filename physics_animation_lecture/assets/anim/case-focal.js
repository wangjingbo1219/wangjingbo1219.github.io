/* Slide "C·ASE — how", click 3: focal skill sampling.   <svg data-anim="case-focal" viewBox="0 0 1196 291">
 * SCHEMATIC with five skills. The scores b_c are made-up curves WITHOUT a scale (two easy skills are imitated early, three hard ones late);
 * the sampling shares are computed from them exactly as the paper does (Dou et al. 2023, Eq. 4):
 *     w_c <- (1 - alpha) w_c + alpha (1 - b_c / sum_c' b_c'),  alpha = 0.2,  share of skill c = w_c / sum_c' w_c'      (one update per "training step" of the figure)
 * White bar = D's average score on the policy's motion under skill c (the paper's b_c), green bar = its share of the reference samples.
 * Right: the same shares as one bar, against equal shares (dashed). No numbers are printed: only the direction is the message.
 */
DeckAnim.register('case-focal', function (el, A) {
  'use strict';
  var K = window.CaseKit, C = A.C, GRN = C.g, MID = C.mid;
  var BW = 112, BG = 10, BASE = 236, HMAX = 150, WFULL = 0.4, RX = 700, RW = 496, ALPHA = 0.2, DT = 0.2, ON = 2.5, PER = 13.5, NS = 5;
  function T(p, x, y, s, o) {
    o = o || {};
    var n = A.text(p, x, y, '', { size: o.size || 20, fill: o.fill || '#fff', anchor: o.anchor || 'middle', weight: o.weight || 700, halo: !!o.halo });
    n.innerHTML = s;
    return n;
  }
  // schematic scores: [early value, late value, when the skill starts and finishes being learned]
  var SC = { idle: [0.84, 0.84, 0, 1], walk: [0.76, 0.76, 0, 1], kick: [0.22, 0.72, 6.0, 10.0], bash: [0.36, 0.74, 5.5, 9.0], swing: [0.16, 0.68, 6.5, 11.0] };
  function score(i, tau) {
    var s = SC[K.ORDER[i]];
    return A.lerp(s[0], s[1], K.ease((tau - s[2]) / (s[3] - s[2]))) + 0.012 * Math.sin(1.7 * tau + 1.3 * i);
  }
  /** raw weights w_c after n updates of Eq. 4 (focal sampling starts at tau = ON) */
  function weights(n) {
    var w = [], i, k, b, sum;
    for (i = 0; i < NS; i++) w.push(1 / NS);
    for (k = 0; k < n; k++) {
      b = []; sum = 0;
      for (i = 0; i < NS; i++) { b.push(score(i, ON + k * DT)); sum += b[i]; }
      for (i = 0; i < NS; i++) w[i] = (1 - ALPHA) * w[i] + ALPHA * (1 - b[i] / sum);
    }
    return w;
  }
  function shares(tau) {
    var x = Math.max(0, (tau - ON) / DT), n = Math.floor(x), a = weights(n), b = weights(n + 1), o = [], s = 0, i;
    for (i = 0; i < NS; i++) { o.push(tau < ON ? 1 / NS : A.lerp(a[i], b[i], x - n)); s += o[i]; }
    for (i = 0; i < NS; i++) o[i] /= s;
    return o;
  }
  // ---- left: one column per skill
  A.el('line', { x1: 2, y1: BASE, x2: 600, y2: BASE, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);      // round caps stay inside the box
  var dyn = A.el('g', {}, el);
  var cols = K.ORDER.map(function (key, i) {
    var x = i * (BW + BG), cx = x + BW / 2, ln = K.SK[key].lines;
    ln.forEach(function (s, j) { T(el, cx, ln.length === 1 ? 34 : 22 + 23 * j, s); });
    var yu = BASE - HMAX * (1 / NS) / WFULL;
    A.el('line', { x1: cx, y1: yu, x2: cx + 46, y2: yu, stroke: '#9a9a9a', 'stroke-width': 2, 'stroke-dasharray': '5 5' }, el);
    return { b: A.el('rect', { x: cx - 40, width: 36, rx: 5, fill: '#e8e8e8' }, dyn), w: A.el('rect', { x: cx + 5, width: 36, rx: 5, fill: GRN }, dyn) };
  });
  T(el, 606, BASE - HMAX * (1 / NS) / WFULL + 7, 'equal', { anchor: 'start', fill: MID, weight: 500 });
  A.el('rect', { x: 0, y: 262, width: 18, height: 18, rx: 4, fill: '#e8e8e8' }, el);
  T(el, 26, 278, K.mi('D') + '’s score on the policy’s motion', { anchor: 'start', fill: MID, weight: 500 });
  A.el('rect', { x: 352, y: 262, width: 18, height: 18, rx: 4, fill: GRN }, el);
  T(el, 378, 278, 'share of reference samples', { anchor: 'start', fill: MID, weight: 500 });
  // ---- right: the next reference samples, by skill
  T(el, RX, 22, 'the next “real” samples for ' + K.mi('D') + ', by skill', { anchor: 'start' });
  var SHORT = { idle: 'idle', walk: 'walk', kick: 'kick', bash: 'bash', swing: 'swing' };
  var seg = K.ORDER.map(function (key) {
    return { r: A.el('rect', { y: 40, height: 60, stroke: '#000', 'stroke-width': 2 }, dyn), t: T(dyn, 0, 77, SHORT[key]) };
  });
  for (var q = 1; q < NS; q++) {                                  // where the boundaries are when every skill has an equal share
    A.el('path', { d: 'M' + (RX + RW * q / NS) + ' 31V39M' + (RX + RW * q / NS) + ' 101V109', stroke: '#c8c8c8', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  }
  var l1 = T(el, RX, 150, '', { anchor: 'start', size: 23 }), l2 = T(el, RX, 181, '', { anchor: 'start', size: 23, weight: 500, fill: '#e0e0e0' });
  A.el('line', { x1: RX + 2, y1: 226, x2: RX + RW - 2, y2: 226, stroke: '#3a3a3a', 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var prog = A.el('line', { x1: RX + 2, y1: 226, y2: 226, stroke: '#e8e8e8', 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var XON = RX + 2 + (RW - 4) * ON / PER;
  A.el('line', { x1: XON, y1: 216, x2: XON, y2: 236, stroke: GRN, 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  T(el, XON - 6, 262, 'focal sampling starts', { anchor: 'start', fill: GRN, weight: 500 });
  T(el, RX + RW, 262, 'training →', { anchor: 'end', fill: MID, weight: 500 });
  var PH = [['Before focal sampling:', 'every skill is drawn equally often.'], ['Focal sampling:', 'a low score earns a larger share.'], ['As the hard skills catch up,', 'the shares even out again.']];

  return function draw(f) {
    var t = f.step === 3 ? f.ts : f.t, tau = A.loop(t, PER), sh = shares(tau), x = RX, i;
    for (i = 0; i < NS; i++) {
      var hb = HMAX * score(i, tau), hw = HMAX * sh[i] / WFULL, w = RW * sh[i], ex = A.clamp((sh[i] * NS - 1) / 0.2, -1, 1);
      A.set(cols[i].b, { y: (BASE - hb).toFixed(1), height: hb.toFixed(1) });
      A.set(cols[i].w, { y: (BASE - hw).toFixed(1), height: hw.toFixed(1) });
      A.set(seg[i].r, { x: x.toFixed(1), width: w.toFixed(1), fill: ex > 0 ? 'rgb(' + Math.round(42 + 40 * ex) + ',' + Math.round(42 + 100 * ex) + ',' + Math.round(42 - 30 * ex) + ')' : '#2a2a2a' });
      A.set(seg[i].t, { x: (x + w / 2).toFixed(1) });
      x += w;
    }
    var ph = tau < ON ? 0 : (tau < 6.2 ? 1 : 2);
    K.html(l1, PH[ph][0]); K.html(l2, PH[ph][1]);
    A.set(prog, { x2: (RX + 2 + (RW - 4) * tau / PER).toFixed(1) });
    A.show(dyn, A.ramp(tau, 0, 0.35) * (1 - A.ramp(tau, PER - 0.35, PER)) * 0.85 + 0.15);
  };
});
