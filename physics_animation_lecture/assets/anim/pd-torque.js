/* Slide "The policy sets targets; a PD controller makes the torques": the two terms of the PD law and their sum, live.
 * Same simulated joint and same clock as pd-track (assets/anim/pd-0kit.js). The bars change once per simulation step,
 * because that is when the controller recomputes the torque. The sign is spelled out under the bars: a positive torque turns the
 * limb toward larger angles (up, in the picture above). viewBox 0 0 1000 160. */
DeckAnim.register('pd-torque', function (el, A) {
  var K = window.PDKit, C = A.C;
  var ZX = 626, SC = 3.85, FS = 60;                      // zero line, pixels per N m, full scale in N m
  var rows = [
    { y: 19, name: 'spring', note: 'pulls toward the target', col: C.g, key: 'spring' },
    { y: 63, name: 'damper', note: 'brakes the motion', col: C.blue, key: 'damper' },
    { y: 107, name: 'torque', note: 'what the motor applies', col: C.amber, key: 'tau' }
  ];
  A.el('line', { x1: ZX, y1: 0, x2: ZX, y2: 126, stroke: '#5a5a5a', 'stroke-width': 2 }, el);
  rows.forEach(function (r) {
    A.el('rect', { x: ZX - FS * SC, y: r.y - 15, width: 2 * FS * SC, height: 30, rx: 6, fill: '#181818' }, el);
    A.text(el, 24, r.y + 8, r.name, { size: 24, fill: r.col, halo: false });
    A.text(el, 122, r.y + 8, r.note, { size: 21, weight: 500, fill: C.mid, halo: false });
    r.bar = A.el('rect', { y: r.y - 15, height: 30, rx: 4, fill: r.col }, el);
    r.val = A.text(el, 986, r.y + 8, '', { size: 23, fill: r.col, anchor: 'end', halo: false });
    r.val.style.fontVariantNumeric = 'tabular-nums';
  });
  A.el('line', { x1: ZX, y1: 0, x2: ZX, y2: 126, stroke: '#8a8a8a', 'stroke-width': 2 }, el);
  // what the sign means (angles grow counter-clockwise, so a positive torque raises the limb)
  A.text(el, ZX - FS * SC, 150, '−  lowers the limb', { size: 20, weight: 500, fill: C.mid, halo: false });
  A.text(el, ZX + FS * SC, 150, 'raises the limb  +', { size: 20, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  return function draw(f) {
    var s = K.at(K.pd, K.clock(f));
    rows.forEach(function (r) {
      var v = s[r.key], w = A.clamp(v, -FS, FS) * SC;
      A.set(r.bar, { x: Math.min(ZX, ZX + w), width: Math.abs(w) });
      var n = Math.round(v);
      A.set(r.val, { text: (n > 0 ? '+' : (n < 0 ? '−' : '')) + Math.abs(n) + ' N·m' });
    });
  };
});
