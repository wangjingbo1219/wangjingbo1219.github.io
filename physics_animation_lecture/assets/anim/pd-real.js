/* Slide "PD gains in practice": what the numbers in the table mean.
 * A hip joint is held an angle away from its target; its motor pushes back with  kp x error, up to its torque limit.
 *   DeepMimic humanoid hip   kp = 500 N m/rad, limit 200 N m     (xbpeng/DeepMimic: humanoid3d_ctrl.txt, humanoid3d.txt)
 *   Unitree G1 hip pitch     kp = 100 N m/rad, limit  88 N m     (unitree_rl_gym: g1_config.py, g1_12dof.urdf)
 * The error is prescribed (a slow sweep 0 -> max -> 0): this is the static spring law, not a simulation.
 * step 0  the character: torque = kp x error                (sweep up to 0.36 rad, below the limit)
 * step 1  + its torque limit                                (sweep up to 0.6 rad: the hip saturates at 200 N m)
 * step 2  + the robot, same error                           (five times less torque)
 * step 3  + how a G1 action becomes a target: default pose + 0.25 a
 * viewBox 0 0 890 690. */
DeckAnim.register('pd-real', function (el, A) {
  var C = A.C, EMAX = 0.6, E0 = 0.36, PERIOD = 6;
  var J = [
    { name: 'DeepMimic hip', kp: 500, lim: 200, col: C.g, px: 112, step: 0 },
    { name: 'Unitree G1 hip', kp: 100, lim: 88, col: C.blue, px: 532, step: 2 }
  ];
  var PY = 56, L = 172, R = 82;                       // pivot height, limb length, radius of the torque arrow
  var X0 = 96, X1 = 850, YB = 520, YT = 332, TMAX = 220;
  function X(e) { return X0 + (X1 - X0) * e / EMAX; }
  function Y(t) { return YB - (YB - YT) * t / TMAX; }
  function tq(j, e) { return Math.min(j.lim, j.kp * e); }
  function M(s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">' + s + '</tspan>'; }
  var KP = M('k') + '<tspan dy="6" style="font-size:.74em;font-family:' + A.MATH + ';font-style:italic">p</tspan>';
  function on(f, k) { return f.step > k ? 1 : (f.step === k ? (k ? A.ramp(f.ts, 0, 0.5) : 1) : 0); }      // a part that appears at step k

  // ---------- chart: torque against error ----------
  [0, 50, 100, 150, 200].forEach(function (t) {
    A.el('line', { x1: X0, y1: Y(t), x2: X1, y2: Y(t), stroke: C.grid, 'stroke-width': 2 }, el);
    A.text(el, X0 - 12, Y(t) + 7, '' + t, { size: 20, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  });
  [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach(function (e) {
    A.el('line', { x1: X(e), y1: YB, x2: X(e), y2: YB + 8, stroke: C.line, 'stroke-width': 2 }, el);
    A.text(el, X(e), YB + 32, e === 0 ? '0' : e.toFixed(1), { size: 20, weight: 500, fill: C.mid, anchor: 'middle', halo: false });
  });
  A.el('path', { d: 'M' + X0 + ' ' + (YT - 14) + ' V' + YB + ' H' + X1, fill: 'none', stroke: C.line, 'stroke-width': 2 }, el);
  A.text(el, X0 - 62, YT - 20, 'torque (N·m)', { size: 21, fill: C.mid, halo: false });
  A.text(el, X1, YB + 64, 'error: how far the joint is from its target (rad)', { size: 21, fill: C.mid, anchor: 'end', halo: false });
  var cur = A.el('line', { y1: YT - 8, y2: YB, stroke: '#6a6a6a', 'stroke-width': 2 }, el);
  J.forEach(function (j) { j.g = A.el('g', null, el); });
  // the character: the spring law up to the limit (step 0), then the flat part (step 1)
  var EL = J[0].lim / J[0].kp;                                                   // 0.4 rad: where the hip reaches its limit
  A.el('path', { d: 'M' + X(0) + ' ' + Y(0) + ' L' + X(EL) + ' ' + Y(J[0].lim), fill: 'none', stroke: C.g, 'stroke-width': 5, 'stroke-linecap': 'round' }, J[0].g);
  var flat = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 5, 'stroke-linecap': 'round' }, J[0].g);
  var limT = A.text(J[0].g, X(EL) + 14, Y(200) - 14, 'torque limit 200 N·m', { size: 21, fill: C.g });
  var s0 = A.text(J[0].g, X(0.16) - 16, Y(120), '', { size: 21, fill: C.g, anchor: 'end' });
  s0.innerHTML = 'slope ' + KP + '<tspan dy="-6"> = 500</tspan>';
  // the robot: the same law with kp = 100; its limit (88 N m) lies beyond the errors shown
  A.el('path', { d: 'M' + X(0) + ' ' + Y(0) + ' L' + X(EMAX) + ' ' + Y(tq(J[1], EMAX)), fill: 'none', stroke: C.blue, 'stroke-width': 5, 'stroke-linecap': 'round' }, J[1].g);
  A.el('line', { x1: X(0.42), y1: Y(88), x2: X(EMAX), y2: Y(88), stroke: C.blue, 'stroke-width': 3, 'stroke-dasharray': '3 8', 'stroke-linecap': 'round' }, J[1].g);
  A.text(J[1].g, X(EMAX) - 10, Y(88) - 10, 'torque limit 88 N·m', { size: 21, fill: C.blue, anchor: 'end' });
  var s1 = A.text(J[1].g, X(0.40), Y(40) - 14, '', { size: 21, fill: C.blue, anchor: 'end' });
  s1.innerHTML = 'slope ' + KP + '<tspan dy="-6"> = 100</tspan>';
  J.forEach(function (j) { j.dot = A.el('circle', { r: 9, fill: j.col, stroke: '#101010', 'stroke-width': 3 }, j.g); });

  // ---------- the two joints ----------
  J.forEach(function (j) {
    var g = j.g;
    A.el('line', { x1: j.px - 46, y1: PY - 26, x2: j.px + 46, y2: PY - 26, stroke: '#4d4d4d', 'stroke-width': 18, 'stroke-linecap': 'round' }, g);      // the pelvis
    A.el('line', { x1: j.px, y1: PY, x2: j.px, y2: PY + L, stroke: j.col, 'stroke-width': 24, 'stroke-linecap': 'round', opacity: 0.24 }, g);            // target: straight down
    A.el('line', { x1: j.px, y1: PY, x2: j.px, y2: PY + L, stroke: j.col, 'stroke-width': 4, 'stroke-dasharray': '3 10', 'stroke-linecap': 'round' }, g);
    j.limb = A.el('line', { x1: j.px, y1: PY, stroke: C.white, 'stroke-width': 16, 'stroke-linecap': 'round' }, g);
    j.arc = A.el('path', { fill: 'none', stroke: C.amber, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    j.head = A.el('path', { fill: C.amber }, g);
    A.el('circle', { cx: j.px, cy: PY, r: 13, fill: '#101010', stroke: C.white, 'stroke-width': 5 }, g);
    A.text(g, j.px + 150, PY + 2, j.name, { size: 24, fill: j.col, halo: false });
    j.kpT = A.text(g, j.px + 150, PY + 40, '', { size: 22, weight: 500, fill: C.mid, halo: false });
    j.kpT.innerHTML = KP + '<tspan dy="-6"> = ' + j.kp + ' N·m/rad</tspan>';
    j.val = A.text(g, j.px + 150, PY + 112, '', { size: 44, fill: C.amber, halo: false });
    j.val.style.fontVariantNumeric = 'tabular-nums';
    j.sub = A.text(g, j.px + 150, PY + 146, 'pushing back', { size: 21, weight: 500, fill: C.mid, halo: false });
    j.err = A.text(g, j.px + 20, PY + L + 52, '', { size: 21, fill: C.white, anchor: 'middle' });
    j.err.style.fontVariantNumeric = 'tabular-nums';
  });

  // ---------- step 3: a G1 action becomes a target ----------
  var gA = A.el('g', null, el), SX0 = 150, SX1 = 400, SY = 642;
  A.el('line', { x1: 24, y1: 604, x2: 866, y2: 604, stroke: '#2a2a2a', 'stroke-width': 2 }, gA);
  var aT = A.text(gA, 24, SY + 8, '', { size: 23, fill: C.blue, halo: false });
  aT.innerHTML = 'action ' + M('a');
  A.el('line', { x1: SX0, y1: SY, x2: SX1, y2: SY, stroke: '#5a5a5a', 'stroke-width': 6, 'stroke-linecap': 'round' }, gA);
  [-1, 0, 1].forEach(function (v) {
    var x = A.lerp(SX0, SX1, (v + 1) / 2);
    A.el('line', { x1: x, y1: SY - 10, x2: x, y2: SY + 10, stroke: '#8a8a8a', 'stroke-width': 3 }, gA);
    A.text(gA, x, SY + 36, (v < 0 ? '−' : '') + Math.abs(v), { size: 20, weight: 500, fill: C.mid, anchor: 'middle', halo: false });
  });
  var knob = A.el('circle', { cy: SY, r: 12, fill: C.blue, stroke: '#101010', 'stroke-width': 3 }, gA);
  var eqT = A.text(gA, 440, SY + 8, '', { size: 23, fill: C.white, halo: false });
  eqT.style.fontVariantNumeric = 'tabular-nums';
  eqT.innerHTML = M('a') + ' = <tspan class="pa"></tspan>   →   target = default <tspan class="pb"></tspan> rad';
  var pa = eqT.querySelector('.pa'), pb = eqT.querySelector('.pb');

  // a point on the circle of radius r about the pivot; angles are measured from straight down, positive toward +x
  function P(px, r, a) { return [px + r * Math.sin(a), PY + r * Math.cos(a)]; }
  function fmt(v) { return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2); }

  return function draw(f) {
    // the error sweeps 0 -> amp -> 0; the amplitude grows when the torque limit is introduced
    var amp = f.step > 1 ? EMAX : (f.step === 1 ? A.lerp(E0, EMAX, A.ease(A.ramp(f.ts, 0, 1.2))) : E0);
    var e = amp * (0.5 - 0.5 * Math.cos(2 * Math.PI * f.t / PERIOD));
    A.set(cur, { x1: X(e), x2: X(e) });
    var o1 = on(f, 1), grow = f.step > 1 ? 1 : (f.step === 1 ? A.ease(A.ramp(f.ts, 0, 1.2)) : 0);
    A.set(flat, { d: 'M' + X(EL) + ' ' + Y(200) + ' H' + X(A.lerp(EL, EMAX, grow)).toFixed(1) }); A.show(flat, grow > 0 ? 1 : 0);
    A.show(limT, o1);
    J.forEach(function (j) {
      A.show(j.g, on(f, j.step));
      var t = tq(j, e), tip = P(j.px, L, e);
      A.set(j.limb, { x2: tip[0], y2: tip[1] });
      A.set(j.dot, { cx: X(e), cy: Y(t) });
      A.set(j.val, { text: Math.round(t) + ' N·m' });
      A.set(j.sub, { text: t >= j.lim - 0.5 ? 'at its torque limit' : 'pushing back' });
      A.set(j.err, { text: 'error ' + e.toFixed(2) + ' rad' });
      // restoring torque: an arrow that leaves the limb on the target's side and points back toward the target.
      // Its length is the torque (200 N m = 1.9 rad of arc); a small torque is a small arrow head.
      var sw = t / 200 * 1.9, a0 = e - 0.14, a1 = a0 - sw, hl = Math.min(22, sw * R), hw = 0.58 * hl;
      if (hl > 3) {
        var ab = a1 + hl / R, pt = P(j.px, R, a1), c1 = P(j.px, R + hw, ab), c2 = P(j.px, R - hw, ab);
        A.set(j.head, { d: 'M' + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1) + ' L' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' L' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' Z' });
        A.show(j.head, 1);
        if (sw * R > hl + 2) {
          var p0 = P(j.px, R, a0), p1 = P(j.px, R, ab + 2 / R);
          A.set(j.arc, { d: 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + R + ' ' + R + ' 0 0 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) });
          A.show(j.arc, 1);
        } else A.show(j.arc, 0);
      } else { A.show(j.arc, 0); A.show(j.head, 0); }
    });
    var a = 0.8 * Math.sin(2 * Math.PI * f.t / PERIOD + 0.3403);
    A.show(gA, on(f, 3));
    A.set(knob, { cx: A.lerp(SX0, SX1, (a + 1) / 2) });
    pa.textContent = fmt(a);
    pb.textContent = (a < 0 ? '− ' : '+ ') + Math.abs(0.25 * a).toFixed(2);
  };
});
