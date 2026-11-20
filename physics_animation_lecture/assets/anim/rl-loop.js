/* "Reinforcement learning in one slide": the policy <-> simulator loop, running.
 * 1740 x 250. Left: the policy (a network that fires when a state arrives). Right: the simulator with the humanoid of the standing task.
 * A state token travels back along the lower arrow, an action token forward along the upper one; then the simulator advances one step.
 * The first steps of a rollout are in slow motion, then the loop runs in real time (30 steps per second).
 * Everything that moves is replayed from window.RLDemo (real MuJoCo rollouts); timing comes from RLKit.at(t).
 * The reward token and the rollout strip belong to rl-strip.js, which runs on the same clock. */
DeckAnim.register('rl-loop', function (el, A) {
  var K = window.RLKit, D = window.RLDemo, C = A.C;
  var PX0 = 0, PX1 = 360, SX0 = 1240, SX1 = 1740, H = 250, YA = 34, YB = 216, AX0 = PX1 + 14, AX1 = SX0 - 14;

  // ---- policy box
  A.el('rect', { x: PX0, y: 0, width: PX1 - PX0, height: H, rx: 14, fill: C.g }, el);
  K.text(el, 26, 48, 'Policy ' + K.ss('π', 'θ', true, '(' + K.mi('a') + ' | ' + K.mi('s') + ')'), 30, '#000');
  K.text(el, 26, 82, 'a neural network: state in,', 21, 'rgba(0,0,0,.8)', 500);
  K.text(el, 26, 110, 'a Gaussian over actions out', 21, 'rgba(0,0,0,.8)', 500);
  var cols = [[62, 4], [180, 5], [298, 4]], nodes = [], gl = A.el('g', {}, el), c, i, j;
  function ny(c, i) { return 181 - (cols[c][1] - 1) * 12.5 + i * 25; }
  for (c = 0; c < 2; c++) for (i = 0; i < cols[c][1]; i++) for (j = 0; j < cols[c + 1][1]; j++)
    A.el('line', { x1: cols[c][0], y1: ny(c, i), x2: cols[c + 1][0], y2: ny(c + 1, j), stroke: 'rgba(0,0,0,.3)', 'stroke-width': 1.6 }, gl);
  for (c = 0; c < 3; c++) { nodes.push([]); for (i = 0; i < cols[c][1]; i++) nodes[c].push(A.el('circle', { cx: cols[c][0], cy: ny(c, i), r: 8.5, fill: '#16300a' }, el)); }

  // ---- simulator box
  var sbox = A.el('rect', { x: SX0 + 1, y: 1, width: SX1 - SX0 - 2, height: H - 2, rx: 14, fill: '#161616', stroke: '#303030', 'stroke-width': 2 }, el);
  K.text(el, SX0 + 26, 48, 'Simulator', 30, '#fff');
  K.text(el, SX0 + 26, 82, 'physics: ' + K.mi('s′') + ' = ' + K.mi('f') + '(' + K.mi('s') + ', ' + K.mi('a') + ')', 21, C.mid, 500);
  K.text(el, SX0 + 26, 122, 'task: stand', 21, C.mid, 500);
  K.text(el, SX0 + 26, 150, 'reward: how close', 21, C.mid, 500);
  K.text(el, SX0 + 26, 176, 'to the standing pose', 21, C.mid, 500);
  var FX = SX0 + 338, FY = 228, SC = 112;                       // world origin on the floor, px per metre
  A.el('line', { x1: SX0 + 262, y1: FY + 1.5, x2: SX1 - 16, y2: FY + 1.5, stroke: '#4a4a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var ghost = K.stick(el, { ghost: true }), body = K.stick(el);
  ghost(D.ref, FX, FY, SC);

  // ---- arrows and their labels
  var AR = { fill: 'none', stroke: C.g, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  function arrow(d) { AR.d = d; A.el('path', AR, el); }
  arrow('M' + AX0 + ' ' + YA + ' H' + AX1 + ' M' + (AX1 - 14) + ' ' + (YA - 12) + ' L' + (AX1 + 2) + ' ' + YA + ' L' + (AX1 - 14) + ' ' + (YA + 12));
  arrow('M' + AX1 + ' ' + YB + ' H' + AX0 + ' M' + (AX0 + 14) + ' ' + (YB - 12) + ' L' + (AX0 - 2) + ' ' + YB + ' L' + (AX0 + 14) + ' ' + (YB + 12));
  var XM = (AX0 + AX1) / 2;
  K.text(el, XM, YA + 40, 'action ' + K.ss('a', 't', true, '') + '<tspan style="font-weight:500;fill:' + C.mid + '">  ·  21 target joint angles</tspan>', 24, '#fff', 700, 'middle');
  K.text(el, XM, YB - 32, 'state ' + K.ss('s', 't+1', true, '') + '<tspan style="font-weight:500;fill:' + C.mid + '">  ·  54 numbers: pose and velocities        </tspan>reward ' + K.ss('r', 't', true, '') +
    '<tspan style="font-weight:500;fill:' + C.mid + '">  ·  one number</tspan>', 24, '#fff', 700, 'middle');
  var tRun = K.text(el, XM, 113, '', 27, '#fff', 700, 'middle');
  var tClk = K.text(el, XM, 144, '', 21, C.mid, 500, 'middle');

  // ---- tokens: one of each for the slow steps, a stream of dots once the loop runs in real time
  function token(fill, letter) {
    var g = A.el('g', {}, el);
    A.el('circle', { r: 17, fill: fill, stroke: '#000', 'stroke-width': 3 }, g);
    K.text(g, 0, 8, K.mi(letter), 22, '#000', 700, 'middle');
    return g;
  }
  var NS = 5, sa = [], ss = [];
  for (i = 0; i < NS; i++) { sa.push(A.el('circle', { r: 6, fill: C.amber }, el)); ss.push(A.el('circle', { r: 6, fill: i % 2 ? C.gbr : '#fff' }, el)); }
  var tokS = token('#fff', 's'), tokA = token(C.amber, 'a');
  var NAMES = ['the untrained policy', 'the policy after 0.25 million samples', 'the policy after 1.0 million samples'];

  return function draw(f) {
    var s = K.at(f.t), u = s.u, k = s.k, i, c;
    // tokens
    var vs = (!s.hold && u < K.P_S) ? s.slow : 0, va = (!s.hold && u >= K.P_A0 && u < K.P_A1) ? s.slow : 0;
    A.show(tokS, vs); A.show(tokA, va);
    if (vs) tokS.setAttribute('transform', 'translate(' + A.lerp(AX1, AX0, A.ease(u / K.P_S)).toFixed(1) + ' ' + YB + ')');
    if (va) tokA.setAttribute('transform', 'translate(' + A.lerp(AX0, AX1, A.ease((u - K.P_A0) / (K.P_A1 - K.P_A0))).toFixed(1) + ' ' + YA + ')');
    var st = s.hold ? 0 : 1 - s.slow;
    for (i = 0; i < NS; i++) {
      var ph = A.loop(f.t * 0.85 + i / NS, 1), edge = Math.min(1, ph * 8, (1 - ph) * 8);
      A.set(sa[i], { cx: A.lerp(AX0, AX1, ph).toFixed(1), cy: YA, opacity: (st * edge).toFixed(2) });
      A.set(ss[i], { cx: A.lerp(AX1, AX0, ph).toFixed(1), cy: YB, opacity: (st * edge).toFixed(2) });
    }
    // the policy network fires while it turns the state into an action (slow steps); it glows steadily in real time
    for (c = 0; c < 3; c++) {
      var x = (u - K.P_S) / (K.P_A0 - K.P_S) * 1.4 - c * 0.35, a = s.hold ? 0 : A.lerp(0.35, A.clamp(1 - Math.abs(x - 0.35) / 0.45, 0, 1), s.slow);
      var v = Math.round(22 + a * 233), col = 'rgb(' + v + ',' + Math.round(48 + a * 207) + ',' + Math.round(10 + a * 245) + ')';
      for (i = 0; i < nodes[c].length; i++) nodes[c][i].setAttribute('fill', col);
    }
    // the simulator: the body at the simulated time; its frame lights up while it advances (slow steps)
    var adv = (!s.hold && u >= K.P_A1) ? s.slow : 0;
    sbox.setAttribute('stroke', adv ? C.g : '#303030');
    var fell = s.D.fell > 0 && s.hold;
    body(K.pose(s.e, s.simT), FX, FY, SC, fell ? A.ramp(s.th, 0, 0.3) * 0.75 : 0);
    // which policy is running, and the clock
    tRun.textContent = 'In the loop: ' + NAMES[s.e];
    var step = Math.min(k, s.ep.n), sec = s.simT / 30;
    tClk.textContent = (s.hold ? (s.D.fell > 0 ? 'fell after ' + K.fix(s.ep.n / 30, 1) + ' s: the episode ends' : 'still standing after ' + K.fix(s.ep.n / 30, 1) + ' s')
                               : 'step ' + step + '  ·  ' + K.fix(sec, 2) + ' s  ·  ' + (s.dur > 0.05 ? 'slow motion' : 'real time, 30 steps per second'));
    tClk.style.fill = s.hold ? (s.D.fell > 0 ? C.red : C.gbr) : C.mid;
  };
});
