/* SuperTrack figures: the stick figure shared by supertrack-roll.js and supertrack-horizon.js (this file loads first: file-name order).
 * A walker in profile, facing right, standing on the line y = gy. SCHEMATIC: a pose glyph, not motion data. */
window.STK = (function () {
  'use strict';
  /** x, gy: foot point · ph: walk phase (rad) · lean: torso tilt (rad) · k: size (1 = about 108 px tall)
   *  -> { segs: [[x1, y1, x2, y2], ...], head: [cx, cy, r] };  segs = thigh, shin, upper arm, forearm (twice), then the torso */
  function limbs(x, gy, ph, lean, k) {
    var TH = 25 * k, SH = 25 * k, TO = 36 * k, UA = 19 * k, FA = 17 * k, segs = [], i;
    var hy = gy - TH - SH + (3 + 2.5 * Math.abs(Math.cos(ph))) * k;
    var sx = x + TO * Math.sin(lean), sy = hy - TO * Math.cos(lean);
    for (i = 0; i < 2; i++) {
      var p = ph + i * Math.PI, th = 0.55 * Math.sin(p) + 0.3 * lean, kn = 0.12 + 0.85 * Math.max(0, Math.cos(p));
      var kx = x + TH * Math.sin(th), ky = hy + TH * Math.cos(th), fx = kx + SH * Math.sin(th - kn), fy = Math.min(gy - 3 * k, ky + SH * Math.cos(th - kn));
      segs.push([x, hy, kx, ky], [kx, ky, fx, fy]);
      var up = -0.5 * Math.sin(p) + lean, ax = sx, ay = sy + 4 * k, ex = ax + UA * Math.sin(up), ey = ay + UA * Math.cos(up);
      segs.push([ax, ay, ex, ey], [ex, ey, ex + FA * Math.sin(up + 0.6), ey + FA * Math.cos(up + 0.6)]);
    }
    segs.push([x, hy, sx, sy]);
    return { segs: segs, head: [sx + (3 * Math.sin(lean) + 2) * k, sy - 11 * k, 9 * k] };
  }
  /** SVG path of the segments; off(i) -> [dx, dy] moves segment i as a whole (used to pull a figure apart at its joints) */
  function path(segs, off) {
    var d = '', i, o;
    for (i = 0; i < segs.length; i++) {
      o = off ? off(i) : [0, 0];
      d += 'M' + (segs[i][0] + o[0]).toFixed(1) + ' ' + (segs[i][1] + o[1]).toFixed(1) + 'L' + (segs[i][2] + o[0]).toFixed(1) + ' ' + (segs[i][3] + o[1]).toFixed(1);
    }
    return d;
  }
  return { limbs: limbs, path: path };
})();
