/* "One number per step" card (506 x 130): the reward of the step the loop figure has just simulated, taken apart.
 * The standing task uses DeepMimic's imitation reward with a standing pose as the reference: four terms, each between 0 and 1,
 * weights 0.65 / 0.1 / 0.15 / 0.1 (Peng et al. 2018, section 5.3). Bars = the four terms, number = their weighted sum r_t.
 * Runs on the clock of the loop figure (RLKit.at), so the number is the bar that has just landed in the rollout strip. */
DeckAnim.register('rl-card-reward', function (el, A) {
  var K = window.RLKit, D = window.RLDemo, C = A.C;
  var NAMES = ['pose', 'velocity', 'hands, feet', 'centre of mass'], W = D.weights, X0 = 236, BW = 112, i, bars = [];
  for (i = 0; i < 4; i++) {
    var y = 2 + i * 32;
    K.text(el, 0, y + 21, W[i].toFixed(2) + ' ×<tspan style="font-weight:500;fill:' + C.mid + '"> ' + NAMES[i] + '</tspan>', 20, '#fff', 700);
    A.el('rect', { x: X0, y: y + 5, width: BW, height: 18, rx: 4, fill: '#222' }, el);
    bars.push(A.el('rect', { x: X0, y: y + 5, height: 18, rx: 4, fill: C.g }, el));
  }
  A.el('path', { d: 'M356 6 h8 v118 h-8 M364 65 h10', fill: 'none', stroke: C.line, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  K.text(el, 388, 38, 'reward ' + K.ss('r', 't', true, ''), 21, C.mid, 500);
  var num = K.text(el, 386, 98, '', 48, C.gbr, 700);
  return function draw(f) {
    var s = K.at(f.t), j = Math.min(s.landed, s.ep.n) - 1, T = j >= 0 ? s.D.terms[j] : null;       // j < 0: a new rollout, no reward has come back yet
    for (i = 0; i < 4; i++) bars[i].setAttribute('width', T ? Math.max(0.5, T[i] * BW).toFixed(1) : 0);
    num.textContent = T ? K.fix(s.D.r[j], 2) : '–';
  };
});
