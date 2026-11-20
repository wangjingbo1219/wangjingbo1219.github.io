/* Slide "PD gains: how stiff, how damped": one chart per column (data-run = soft | balanced | ring).
 * The curve is the right knee angle RECORDED from the MuJoCo simulation that is playing in the clip of the same column
 * (assets/anim/pd-gains-data.js, written by tools/fig/pd_gains.py); the little joint on the left shows the same angle.
 * The cursor follows the clip's own clock, so chart, joint and clip stay together; when the clip is not playing
 * (screenshots, print) the clock is the time since the build step.            viewBox 0 0 560 210. */
DeckAnim.register('pd-gain', function (el, A) {
  var DATA = window.PD_GAINS_DATA, C = A.C, run = el.getAttribute('data-run'), R = DATA.runs[run], q = R.q;
  var T = DATA.cycle, SLOW = DATA.slow, HZ = DATA.hz;
  var frozen = /[?&](animt|still|audit|print)\b/.test(location.search);
  var col = el.closest('.pd-col'), vid = col ? col.querySelector('video') : null, sec = el.closest('section');
  var X0 = 208, X1 = 530, YT = 16, YB = 162, A0 = -10, A1 = 150;
  function X(t) { return X0 + (X1 - X0) * t / T; }
  function Y(a) { return YB - (a - A0) / (A1 - A0) * (YB - YT); }
  function ang(t) { var x = A.clamp(t, 0, T) * HZ, i = Math.min(q.length - 2, Math.floor(x)); return A.lerp(q[i], q[i + 1], x - i); }
  function tgt(t) { return (t >= DATA.t_up && t < DATA.t_down) ? DATA.up : DATA.rest; }

  // ---------- chart frame ----------
  [0, 50, 100, 150].forEach(function (a) {
    A.el('line', { x1: X0, y1: Y(a), x2: X1, y2: Y(a), stroke: C.grid, 'stroke-width': 2 }, el);
    A.text(el, X0 - 10, Y(a) + 7, a + '°', { size: 20, weight: 500, fill: C.mid, anchor: 'end', halo: false });
  });
  for (var s = 0; s <= T; s++) {
    A.el('line', { x1: X(s), y1: YB + 4, x2: X(s), y2: YB + 11, stroke: C.line, 'stroke-width': 2 }, el);
    A.text(el, X(s), YB + 34, s === T ? s + ' s' : '' + s, { size: 20, weight: 500, fill: C.mid, anchor: s === T ? 'end' : 'middle', halo: false }).setAttribute('dx', s === T ? 12 : 0);
  }
  A.el('path', { d: 'M' + X0 + ' ' + YT + ' V' + (YB + 4) + ' H' + X1, fill: 'none', stroke: C.line, 'stroke-width': 2 }, el);
  var pts = [];
  for (var i = 0; i < q.length; i += 2) pts.push([X(i / HZ), Y(q[i])]);
  pts.push([X(T), Y(q[q.length - 1])]);
  var dTarget = 'M' + X(0) + ' ' + Y(DATA.rest) + ' H' + X(DATA.t_up) + ' V' + Y(DATA.up) + ' H' + X(DATA.t_down) + ' V' + Y(DATA.rest) + ' H' + X(T);
  var cid = 'pdg-clip-' + run;
  var cp = A.el('clipPath', { id: cid }, A.el('defs', null, el)), cr = A.el('rect', { x: X0 - 4, y: 0, width: 0, height: 210 }, cp);
  A.el('path', { d: dTarget, fill: 'none', stroke: C.g, 'stroke-width': 3.5, 'stroke-dasharray': '3 8', 'stroke-linecap': 'round' }, el);
  A.el('path', { d: A.path(pts), fill: 'none', stroke: C.white, 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0.2 }, el);     // the whole loop, faint
  A.el('path', { d: A.path(pts), fill: 'none', stroke: C.white, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'clip-path': 'url(#' + cid + ')' }, el);
  var cur = A.el('line', { y1: YT, y2: YB + 4, stroke: '#6a6a6a', 'stroke-width': 2 }, el);
  var dot = A.el('circle', { r: 7, fill: C.white, stroke: '#101010', 'stroke-width': 3 }, el);
  var zeta = A.el('text', { x: X1, y: YT + 22, 'text-anchor': 'end', style: 'font:700 23px ' + A.FONT + ';fill:' + C.amber + ';' + A.HALO }, el);
  var I_KNEE = 0.32;                                      // kg m^2: shin and foot about the knee (diagonal of the model's mass matrix)
  zeta.innerHTML = '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">ζ</tspan> ≈ ' + (R.kd / (2 * Math.sqrt(R.kp * I_KNEE))).toFixed(1);

  // ---------- the knee, drawn as one joint ----------
  var HX = 30, HY = 34, KX = 96, KY = 74, SL = 74, TH = Math.atan2(KY - HY, KX - HX);
  function shin(a) { var th = TH + a * Math.PI / 180; return [KX + SL * Math.cos(th), KY + SL * Math.sin(th)]; }
  var gw = A.el('line', { x1: KX, y1: KY, stroke: C.g, 'stroke-width': 20, 'stroke-linecap': 'round', opacity: 0.26 }, el);
  var gl = A.el('line', { x1: KX, y1: KY, stroke: C.g, 'stroke-width': 3.5, 'stroke-dasharray': '3 8', 'stroke-linecap': 'round' }, el);
  A.el('line', { x1: HX, y1: HY, x2: KX, y2: KY, stroke: '#5a5a5a', 'stroke-width': 15, 'stroke-linecap': 'round' }, el);
  var sh = A.el('line', { x1: KX, y1: KY, stroke: C.white, 'stroke-width': 12, 'stroke-linecap': 'round' }, el);
  A.el('circle', { cx: KX, cy: KY, r: 9, fill: '#101010', stroke: C.white, 'stroke-width': 4 }, el);
  A.text(el, 88, 198, 'right knee', { size: 20, weight: 500, fill: C.mid, anchor: 'middle', halo: false });

  function clock(f) {
    // live: the clip's own time. When a new column appears its clip starts at 0, and the clips already playing jump to the
    // same moment (one seek each), so that the three bodies move together.
    if (!frozen && vid && !vid.paused && !vid.seeking && vid.readyState >= 2) {
      // the reference is the clip of the column revealed last; if that one is not running yet, wait (no seek toward an older one)
      var cols = Array.prototype.filter.call(sec.querySelectorAll('.pd-col'), function (c) { return !c.classList.contains('fx') || c.classList.contains('on'); });
      var lead = cols.length ? cols[cols.length - 1].querySelector('video') : null, D = T * SLOW;
      if (lead && lead !== vid && !lead.paused && !lead.seeking && lead.readyState >= 2) {
        var dt = Math.abs(vid.currentTime - lead.currentTime), now = performance.now();
        // only while the lead is near its start: the clips have one keyframe (frame 0), so a seek to an early moment costs a
        // few frames, a seek into the middle would have to decode everything before it and stutter
        if (lead.currentTime < 1.2 && Math.min(dt, D - dt) > 0.25 && !(now - (vid._pdSync || -1e9) < 1500)) {
          vid._pdSync = now;
          try { vid.currentTime = (lead.currentTime + 0.06) % D; } catch (e) {}
        }
      }
      return A.loop(vid.currentTime, D) / SLOW;
    }
    return A.loop(f.ts, T * SLOW) / SLOW;
  }

  return function draw(f) {
    var t = clock(f), a = ang(t), g = shin(tgt(t)), p = shin(a);
    A.set(cr, { width: X(t) - X0 + 4 });
    A.set(cur, { x1: X(t), x2: X(t) });
    A.set(dot, { cx: X(t), cy: Y(a) });
    A.set(gw, { x2: g[0], y2: g[1] }); A.set(gl, { x2: g[0], y2: g[1] });
    A.set(sh, { x2: p[0], y2: p[1] });
    A.show(zeta, f.step >= f.steps ? A.ramp(f.ts, 0, 0.5) : 0);
  };
});
