/*! "PPO in pictures: the clipped objective", left panel (slide 01_13_ppo.py): one sampled action under two policies.
 *  Old policy N(0.35, 0.22) over one joint's target angle (the policy that collected the data), sampled action a = 0.6 rad.
 *  The new policy slides (PGKit.sweep, the same motion the right panel uses); the two bars at a are pi_old(a) and
 *  pi_new(a), and rho is their ratio.   step 1: the action was good (green).   step 2: it was bad (amber). */
DeckAnim.register('pg-two', function (el, A) {
  'use strict';
  var K = window.PGKit, YB = 318, BH = 212, AMIN = -0.6, AMAX = 1.4, NEW = A.C.blue;
  function X(a) { return 60 + (a - AMIN) / (AMAX - AMIN) * 726; }
  var xa = X(K.ACT), hOld = BH * K.g((K.ACT - K.MU) / K.SG);

  // axis
  A.el('line', { x1: 60, y1: YB, x2: 786, y2: YB, stroke: A.C.line, 'stroke-width': 2 }, el);
  [-0.5, 0, 1].forEach(function (v) {
    A.el('line', { x1: X(v), y1: YB, x2: X(v), y2: YB + 7, stroke: A.C.line, 'stroke-width': 2 }, el);
    A.el('text', { x: X(v), y: YB + 30, 'text-anchor': 'middle', style: 'font:500 20px ' + A.FONT + ';fill:' + A.C.mid, text: K.fmt(v, v === -0.5 ? 1 : 0) }, el);
  });
  A.el('text', { x: 423, y: 394, 'text-anchor': 'middle', style: 'font:700 21px ' + A.FONT + ';fill:' + A.C.mid, text: 'target angle for one joint (rad)' }, el);

  // legend (top right)
  A.el('line', { x1: 512, y1: 23, x2: 556, y2: 23, stroke: A.C.white, 'stroke-width': 3, 'stroke-dasharray': '5 7', 'stroke-linecap': 'round' }, el);
  A.text(el, 568, 30, 'old policy', { size: 21, halo: false });
  A.el('line', { x1: 512, y1: 53, x2: 556, y2: 53, stroke: NEW, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  A.text(el, 568, 60, 'new policy', { size: 21, halo: false, fill: NEW });
  var lgDot = A.el('circle', { cx: 534, cy: 83, r: 8, stroke: '#101010', 'stroke-width': 2 }, el);
  var lgAct = A.text(el, 568, 90, '', { size: 21, halo: false });

  // bells, bars, the action
  A.el('path', { d: K.bell(X, YB, BH, K.MU, K.SG, AMIN, AMAX), fill: 'none', stroke: A.C.white, 'stroke-width': 3, 'stroke-dasharray': '5 7', 'stroke-linecap': 'round' }, el);
  var nb = A.el('path', { fill: 'none', stroke: NEW, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, el);
  A.el('rect', { x: xa - 15, y: YB - hOld, width: 14, height: hOld, fill: A.C.white }, el);
  var bNew = A.el('rect', { x: xa + 1, width: 14, fill: NEW }, el);
  var dot = A.el('circle', { cx: xa, cy: YB, r: 9, stroke: '#101010', 'stroke-width': 2 }, el);
  var aLab = A.el('text', { x: xa, y: YB + 30, 'text-anchor': 'middle', style: 'font:700 20px ' + A.FONT }, el);
  A.set(aLab, { html: K.mi('a') + ' = 0.6' });

  // read-out (top left)
  var ro = A.text(el, 60, 36, '', { size: 28, halo: false });
  var ro2 = A.el('text', { x: 60, y: 68, style: 'font:500 20px ' + A.FONT + ';fill:' + A.C.mid }, el);

  var LAB = ['one sampled action, ' + K.mi('a'), 'a good action: ' + K.mi('Â') + ' &gt; 0', 'a bad action: ' + K.mi('Â') + ' &lt; 0'];
  var COL = [A.C.white, A.C.g, A.C.amber];
  return function draw(f) {
    var mode = (f.step === 1 || f.step === 2) ? f.step : 0;
    var d = K.sweep(mode, f.ts), mu = K.MU + d * K.SG, rho = K.rho(d), hNew = BH * K.g((K.ACT - mu) / K.SG);
    A.set(nb, { d: K.bell(X, YB, BH, mu, K.SG, AMIN, AMAX) });
    A.set(bNew, { y: YB - hNew, height: hNew });
    K.html(ro, K.mi('ρ') + ' = ' + K.col('new', NEW) + ' / old = ' + K.fmt(rho, 2));
    K.html(ro2, rho > 1.005 ? 'the new policy makes this action more likely' : (rho < 0.995 ? 'the new policy makes this action less likely' : 'nothing has changed yet'));
    A.set(dot, { fill: COL[mode] }); A.set(lgDot, { fill: COL[mode] });
    A.set(aLab, { fill: COL[mode] });
    K.html(lgAct, K.col(LAB[mode], COL[mode]));
  };
});
