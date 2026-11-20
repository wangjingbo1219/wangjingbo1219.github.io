/* "Why control is hard" / under-actuated: the 27 degrees of freedom of the humanoid used in the clips, one square each.
 * 21 green squares = joints with a motor: they flicker, each at its own rate (a motor can be commanded at any time).
 * 6 amber outlines = position and orientation of the root: no motor, nothing to command, so they never change.
 * Markup: <svg data-anim="ex-dof" viewBox="0 0 506 56"> */
DeckAnim.register('ex-dof', function (el, A) {
  var N_MOTOR = 21, N_ROOT = 6, W = 15, H = 22, PITCH = 18, X_ROOT = N_MOTOR * PITCH + 10;
  var rnd = A.rand(11), sq = [], rate = [], phase = [];
  for (var i = 0; i < N_MOTOR; i++) {
    sq.push(A.el('rect', { x: i * PITCH, y: 2, width: W, height: H, rx: 3, fill: A.C.g }, el));
    rate.push(0.7 + 1.3 * rnd());
    phase.push(6.283 * rnd());
  }
  for (var j = 0; j < N_ROOT; j++) {
    A.el('rect', { x: X_ROOT + j * PITCH + 1.5, y: 3.5, width: W - 3, height: H - 3, rx: 3, fill: 'none', stroke: A.C.amber, 'stroke-width': 3 }, el);
  }
  A.text(el, 0, 50, '21 joints with a motor', { size: 21, fill: A.C.g, halo: false });
  A.text(el, X_ROOT + N_ROOT * PITCH - 3, 50, '6 root DoF: no motor', { size: 21, fill: A.C.amber, anchor: 'end', halo: false });
  return function draw(f) {
    for (var i = 0; i < N_MOTOR; i++) {
      var s = 0.5 + 0.5 * Math.sin(6.283 * rate[i] * f.t + phase[i]);
      sq[i].setAttribute('fill-opacity', (0.42 + 0.58 * s).toFixed(3));
    }
  };
});
