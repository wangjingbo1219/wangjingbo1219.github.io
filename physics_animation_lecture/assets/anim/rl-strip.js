/* "Reinforcement learning in one slide": the rollout strip under the loop, and the return.
 * 1380 x 140, placed at slide (450, 500): its x = 0 is the right edge of the policy box, the simulator starts at x = 880.
 * One bar per policy step: the reward r_t the simulator returned (real values, window.RLDemo), 90 steps = 3 s.
 * In the slow steps the reward travels back along the lower arrow of the loop (drawn here, above this figure's box) and drops into its cell.
 * Build step 1 (the objective): every bar is weighted by gamma^t, and the discounted sum counts up next to the strip. */
DeckAnim.register('rl-strip', function (el, A) {
  var K = window.RLKit, D = window.RLDemo, C = A.C;
  var N = D.nshow, W = 880, CW = W / N, Y0 = 102, HB = 70, G = D.gamma;
  var YARROW = 236 + 216 - 500, XSIM = 90 + 1240 - 14 - 450, XPOL = 90 + 360 + 14 - 450;     // the loop figure's lower arrow, in this figure's coordinates
  var i;
  // axis
  A.el('line', { x1: 0, y1: Y0 + 1, x2: W, y2: Y0 + 1, stroke: C.line, 'stroke-width': 2 }, el);
  [0, 30, 60, 90].forEach(function (j) {
    A.el('line', { x1: j * CW, y1: Y0 + 1, x2: j * CW, y2: Y0 + 8, stroke: C.line, 'stroke-width': 2 }, el);
    K.text(el, j * CW, Y0 + 28, j ? (j / 30) + ' s' : '0', 20, C.mid, 500, j === 0 ? 'start' : (j === 90 ? 'end' : 'middle'));
  });
  var full = [], solid = [];
  for (i = 0; i < N; i++) {
    full.push(A.el('rect', { x: (i * CW + 1.4).toFixed(2), width: (CW - 2.8).toFixed(2), fill: '#2f4a00', rx: 1.5 }, el));
    solid.push(A.el('rect', { x: (i * CW + 1.4).toFixed(2), width: (CW - 2.8).toFixed(2), fill: C.g, rx: 1.5 }, el));
  }
  // legend (top right, above the low end of the bars) and the weight curve
  var leg0 = K.text(el, W, 18, '<tspan style="fill:' + C.g + '">■</tspan>  reward ' + K.ss('r', 't', true, '\u2009: one number per step'), 20, C.mid, 500, 'end');
  var leg1 = K.text(el, W, 18, '<tspan style="fill:' + C.g + '">■</tspan>  what the return counts: ' + K.ss('γ', 't', false, '') + K.ss(' r', 't', true, '') +
                    '        <tspan style="fill:#fff;font-weight:700">—</tspan>  weight ' + K.ss('γ', 't', false, ''), 20, C.mid, 500, 'end');
  var pts = [];
  for (i = 0; i < N; i++) pts.push([(i + 0.5) * CW, Y0 - HB * Math.pow(G, i)]);
  var curve = A.el('path', { d: A.path(pts), fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, el);
  var fellLab = K.text(el, 0, Y0 - 10, 'fell', 20, C.red, 700);
  // the return (right of the strip)
  var RX = 906;                       // lines up with the text inside the simulator box above
  var retLab = K.text(el, RX, 26, 'discounted return of this rollout (' + K.mi('γ') + ' = ' + G + ')', 21, C.mid, 500);
  var retSym = K.text(el, RX, 86, K.mi('Σ') + ' ' + K.ss('γ', 't', false, '') + K.ss(' r', 't', true, ' ='), 32, '#fff', 500);
  var retNum = K.text(el, RX + 168, 88, '', 50, C.gbr, 700);
  // the returns of the three rollouts side by side, each filled in when its rollout is over: training makes this number go up
  var hist = K.text(el, RX, 130, '', 20, C.mute, 500), hsp = [];
  for (i = 0; i < 3; i++) { if (i) A.el('tspan', { text: '  ›  ' }, hist); hsp.push(A.el('tspan', {}, hist)); }
  // the travelling reward
  var pill = A.el('g', {}, el);
  A.el('rect', { x: -33, y: -16, width: 66, height: 32, rx: 16, fill: C.g, stroke: '#000', 'stroke-width': 3 }, pill);
  var pillT = K.text(pill, 0, 7, '', 20, '#000', 700, 'middle');
  // discounted partial sums of each rollout
  var cum = D.episodes.map(function (e) { var c = [0], s = 0; e.r.forEach(function (r, t) { s += Math.pow(G, t) * r; c.push(s); }); return c; });

  return function draw(f) {
    var s = K.at(f.t), R = s.D.r, n = s.ep.n, i;
    var w = f.step >= 2 ? 1 : (f.step === 1 ? A.ease(A.ramp(f.ts, 0.1, 1.0)) : 0);       // 0: plain rewards, 1: discounted
    // bars: those that have landed, plus the one that is landing (it grows while the pill drops)
    var grow = (s.k >= 1 && s.u >= K.P_S && s.u < K.P_DROP) ? (s.u - K.P_S) / (K.P_DROP - K.P_S) : 0;
    for (i = 0; i < N; i++) {
      var vis = i < s.landed ? 1 : ((i === s.landed && i === s.k - 1 && grow) ? grow : 0);
      if (!vis || i >= n) { full[i].setAttribute('height', 0); solid[i].setAttribute('height', 0); continue; }
      var h = R[i] * HB * vis, hs = h * A.lerp(1, Math.pow(G, i), w);
      A.set(full[i], { y: (Y0 - h).toFixed(1), height: h.toFixed(1), opacity: w });
      A.set(solid[i], { y: (Y0 - hs).toFixed(1), height: hs.toFixed(1) });
    }
    A.show(leg0, A.clamp(1 - 2 * w, 0, 1)); A.show(leg1, A.clamp(2 * w - 1, 0, 1)); A.show(curve, w * 0.9);
    // a fall ends the rollout: say so once its last reward is in
    var fell = s.D.fell > 0 && s.landed >= n;
    A.show(fellLab, fell ? 1 : 0);
    if (fell) fellLab.setAttribute('x', (n * CW + 10).toFixed(1));
    // the return counts up with the bars
    A.show(retLab, w); A.show(retSym, w); A.show(retNum, w); A.show(hist, w);
    for (i = 0; i < 3; i++) {
      var over = i < s.e || (i === s.e && s.landed >= n);
      hsp[i].textContent = ['untrained', '0.25 M', '1.0 M'][i] + ' ' + (over ? K.fix(cum[i][D.episodes[i].n], 1) : '…');
      hsp[i].style.fill = i === s.e ? '#fff' : C.mute; hsp[i].style.fontWeight = i === s.e ? 700 : 500;
    }
    retNum.textContent = K.fix(cum[s.e][s.landed] + (grow ? grow * Math.pow(G, s.landed) * R[s.landed] : 0), 1);
    // the reward of the step just simulated comes back with the next state, then drops into its cell (slow steps only)
    var j = s.k - 1, on = (!s.hold && j >= 0 && s.u < K.P_DROP) ? s.slow : 0;
    A.show(pill, on);
    if (on) {
      var cx = (j + 0.5) * CW, xEnd = Math.max(cx, XPOL + 58), x, y, sc = 1;           // it rides 58 px behind the state token
      if (s.u < K.P_S) { x = Math.max(cx, A.lerp(XSIM, XPOL, A.ease(s.u / K.P_S)) + 58); y = YARROW; }
      else { var d = A.ease((s.u - K.P_S) / (K.P_DROP - K.P_S)); x = A.lerp(xEnd, cx, d); y = A.lerp(YARROW, Y0 - R[j] * HB, d); sc = 1 - 0.75 * d; }
      pill.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + sc.toFixed(2) + ')');
      pillT.textContent = K.fix(R[j], 2);
    }
  };
});
