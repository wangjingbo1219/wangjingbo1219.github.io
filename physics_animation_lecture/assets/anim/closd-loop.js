/* CLoSD — how it works (tools/slides/05b_20_closd.py).   <svg data-anim="closd-loop" viewBox="0 0 1152 353">
 * ONE figure, a SCHEMATIC time line that follows the clicks of the pipeline drawn above it. One dot = one frame
 * (DiP uses one token per frame). Height = one coordinate of the motion; the curves are illustrations, not data.
 *   step 0  DiP continues a motion: 20 prefix frames in, the next 40 frames come out of noise in 10 denoising steps (Sec. 4.1, 5.1)
 *   step 1  the two conditions: a text prompt (the paper's two examples for one strike target, Sec. 4) and a target location
 *           that one joint must reach at the last frame of the plan (Sec. 4.1, "adaptive target conditioning"). The label at the
 *           ring names the joint the target is given to, as in the paper: the right foot for the kick, a hand for the push
 *   step 2  the tracker executes the plan one frame at a time; white dots = the simulated body, close to the plan but not on it
 *   step 3  the loop (Sec. 4.3): after 40 frames the last 20 SIMULATED frames become the prefix and DiP plans the next 40 from there.
 *           Two clocks: the tracker ticks every frame, DiP every 40 frames
 *   step 4  fine-tuning (Sec. 4.3): the same loop; the gap between plan and body is what PHC's reward scores
 * The only numbers from the paper: 20 prefix frames, 40 planned frames (= 2 s), 10 denoising steps.
 */
DeckAnim.register('closd-loop', function (el, A) {
  'use strict';
  var C = A.C, BLUE = C.blue, AMB = C.amber, G = C.g, GREY = '#8d8d8d';
  var NP = 20, NG = 40, NK = 10;                                 // prefix frames, planned frames, denoising steps
  var X0 = 268, DX = 14.3, YT = 94, YB = 258;                   // frame -20 starts at X0; value 1 at YT, value 0 at YB
  var XD = X0 + NP * DX, XE = X0 + (NP + NG) * DX;               // "now" (prefix | plan), right end of the window
  var TY = 286, DY = 319;                                        // the two clock rows
  function X(f) { return X0 + (f + NP + 0.5) * DX; }             // centre of frame f (f = 0 is the first planned frame)
  function Y(v) { return YB - A.clamp(v, 0.02, 0.98) * (YB - YT); }
  function sm(u) { u = A.clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  var ramp = A.ramp, lerp = A.lerp;
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + ';' + (o.halo ? A.HALO : '') }, p);
    n.textContent = s;
    return n;
  }

  // ------------------------------------------------------------------------------------------- the illustration (computed once)
  // Three plans that follow each other in the loop. Plan c starts where the body really is (s0) and ends at TG[c]
  // (the target ring is drawn at clicks 1 and 2 only, where the plan is plan 0).
  var NC = 3, TG = [0.92, 0.16, 0.60];
  function env(u) { return sm(u / 0.12) * sm((1 - u) / 0.10); }  // a wiggle that leaves both ends of a plan alone
  function planOf(c, s0) {
    var p = [], i, u, v;
    for (i = 0; i < NG; i++) {
      u = i / (NG - 1);
      if (c === 0) v = s0 + (TG[0] - s0) * sm((u - 0.5) / 0.5) - 0.36 * Math.exp(-Math.pow((u - 0.42) / 0.16, 2)) + 0.04 * Math.sin(18.8 * u) * env(u);
      else if (c === 1) v = s0 + (TG[1] - s0) * sm(u / 0.9) + 0.09 * Math.sin(14.1 * u) * env(u);
      else v = s0 + (TG[2] - s0) * sm(u) + 0.14 * Math.sin(15.7 * u + 0.6) * env(u);
      p.push(v);
    }
    return p;
  }
  // The body follows the plan with a lag and, from some frame on, stays off it (off): physics does not do exactly what was planned.
  function off(c, i) {
    if (c === 0) return -0.11 * sm((i - 27) / 8);
    if (c === 1) return 0.22 * sm((i - 14) / 9);
    return -0.05 * Math.sin(Math.PI * i / (NG - 1));
  }
  function simOf(c, plan, s0) {
    var s = [], v = s0, i;
    for (i = 0; i < NG; i++) { v += 0.4 * (plan[i] + off(c, i) - v); s.push(v); }
    return s;
  }
  var PLAN = [], SIM = [], s0 = 0.6, pass, c;
  for (pass = 0; pass < 5; pass++) for (c = 0; c < NC; c++) { PLAN[c] = planOf(c, s0); SIM[c] = simOf(c, PLAN[c], s0); s0 = SIM[c][NG - 1]; }   // periodic after a few passes
  var S0 = SIM[NC - 1][NG - 1];
  // step 0: no conditions, some continuation of the prefix. step 1: the same target with another prompt gives another plan.
  var P0 = [], PB = [], i_, u_;
  for (i_ = 0; i_ < NG; i_++) {
    u_ = i_ / (NG - 1);
    P0.push(S0 + (0.34 - S0) * sm(u_) + 0.17 * Math.sin(13.8 * u_) * env(u_));
    PB.push(S0 + (TG[0] - S0) * sm(u_ / 0.85) + 0.04 * Math.sin(18.8 * u_) * env(u_));
  }
  // noise: NS different starting points, and a little fresh noise per denoising step
  var NS = 6, NZ = [], JT = [], s_, k_;
  for (s_ = 0; s_ < NS; s_++) {
    var r_ = A.rand(31 + 17 * s_), row = [], jt = [];
    for (i_ = 0; i_ < NG; i_++) row.push(0.04 + 0.92 * r_());
    for (k_ = 0; k_ <= NK; k_++) { var jr = []; for (i_ = 0; i_ < NG; i_++) jr.push(r_() - 0.5); jt.push(jr); }
    NZ.push(row); JT.push(jt);
  }
  function mix(k) { return Math.pow((NK - k) / NK, 1.25); }      // how much noise is left after k denoising steps
  function noisy(clean, seed, k, i) { var m = mix(k); return clean[i] + m * (NZ[seed][i] - clean[i]) + (k ? 0.16 * m * JT[seed][k][i] : 0); }
  /** value of planned frame i after kf denoising steps (kf may be fractional: the dots move during the first part of a step) */
  function den(clean, seed, kf, i) {
    if (kf >= NK) return clean[i];
    var k0 = Math.floor(kf), e = A.ease(ramp(kf - k0, 0, 0.55));
    return lerp(noisy(clean, seed, k0, i), noisy(clean, seed, k0 + 1, i), e);
  }

  // ------------------------------------------------------------------------------------------- static parts
  A.el('rect', { x: X0, y: YT - 10, width: XD - X0, height: YB - YT + 20, rx: 10, fill: '#fff', 'fill-opacity': 0.05, stroke: '#5a5a5a', 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, el);
  var bandNew = A.el('rect', { y: YT - 10, width: XD - X0, height: YB - YT + 20, rx: 10, fill: '#fff', 'fill-opacity': 0.09, stroke: '#fff', 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, el);
  A.el('path', { d: 'M' + XD + ' 20V' + (DY + 14), stroke: '#6a6a6a', 'stroke-width': 2, 'stroke-dasharray': '3 6' }, el);
  txt(el, 24, 34, 'schematic', { fill: GREY });
  var labPre0 = txt(el, X0 + 4, 34, 'prefix · last 20 frames', { fill: C.mid });
  var labPre1 = txt(el, X0 + 4, 34, 'prefix · 20 simulated frames', { fill: '#fff', weight: 700 });
  txt(el, XD + 14, 34, 'plan · next 40 frames = 2 s', { fill: BLUE, weight: 700 });
  // the text prompt (two alternatives, the paper's own pair of examples for one strike target)
  var chip = A.el('g', {}, el);
  txt(chip, XD + 14, 64, 'text', { fill: GREY });
  var chipA = txt(chip, XD + 62, 64, '“strike the target using a high kick”', { weight: 700 });
  var chipB = txt(chip, XD + 62, 64, '“strike the target by pushing it”', { weight: 700 });
  // legend, left column
  function legend(y, s, draw) { var g = A.el('g', {}, el); draw(g, 36, y - 7); return { g: g, t: txt(g, 60, y, s, { fill: '#e6e6e6' }) }; }
  legend(126, 'plan (DiP)', function (g, x, y) { A.el('circle', { cx: x, cy: y, r: 6.5, fill: BLUE }, g); });
  var lgSim0 = legend(158, 'motion so far', function (g, x, y) { A.el('circle', { cx: x, cy: y, r: 6.5, fill: '#fff' }, g); });
  var lgSim1 = legend(158, 'simulated body', function (g, x, y) { A.el('circle', { cx: x, cy: y, r: 6.5, fill: '#fff' }, g); });
  var lgTar = legend(190, 'target', function (g, x, y) { A.el('circle', { cx: x, cy: y, r: 8, fill: 'none', stroke: BLUE, 'stroke-width': 3.5 }, g); });
  var lgGap = legend(222, 'gap: tracker input', function (g, x, y) { A.el('path', { d: 'M' + x + ' ' + (y - 10) + 'V' + (y + 10), stroke: G, 'stroke-width': 5, 'stroke-linecap': 'round' }, g); });
  var lgRew = legend(222, 'gap → PHC reward', function (g, x, y) { A.el('path', { d: 'M' + x + ' ' + (y - 10) + 'V' + (y + 10), stroke: AMB, 'stroke-width': 5, 'stroke-linecap': 'round' }, g); });
  lgRew.t.style.fill = AMB;
  // clock rows
  var rowT0 = txt(el, 24, TY + 7, 'frames', { fill: GREY });
  var rowT1 = txt(el, 24, TY + 7, 'tracker: every frame', { fill: G, weight: 700 });
  var rowD0 = txt(el, 24, DY + 7, 'DiP: 10 denoising steps', { fill: BLUE, weight: 700 });
  var rowD1 = txt(el, 24, DY + 7, 'DiP: every 40 frames', { fill: BLUE, weight: 700 });

  // ------------------------------------------------------------------------------------------- moving parts (created once)
  var gErr = A.el('g', {}, el);
  var lnGhost = A.el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 2, 'stroke-opacity': 0.3, 'stroke-linejoin': 'round' }, el);
  var lnPlan = A.el('path', { fill: 'none', stroke: BLUE, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, el);
  var lnPre = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-opacity': 0.55, 'stroke-linejoin': 'round' }, el);
  var lnSim = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-opacity': 0.55, 'stroke-linejoin': 'round' }, el);
  function dots(n, attrs) { var o = [], i; for (i = 0; i < n; i++) o.push(A.el('circle', attrs, el)); return o; }
  var dGhost = dots(NP, { r: 4.4, fill: BLUE });
  var dPlan = dots(NG, { r: 4.8, fill: BLUE });
  var dPre = dots(NP, { r: 4.6, fill: '#fff', stroke: '#101010', 'stroke-width': 1.2 });
  var dSim = dots(NG, { r: 4.6, fill: '#fff', stroke: '#101010', 'stroke-width': 1.2 });
  var eBars = []; for (i_ = 0; i_ < NP + NG; i_++) eBars.push(A.el('path', { stroke: AMB, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, gErr));
  var cursor = A.el('path', { stroke: '#fff', 'stroke-width': 2, 'stroke-opacity': 0.4 }, el);
  var gap = A.el('path', { stroke: G, 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
  var ringNow = A.el('circle', { r: 9, fill: 'none', stroke: '#fff', 'stroke-width': 2.5 }, el);
  var tarA = A.el('circle', { r: 10, fill: 'none', stroke: BLUE, 'stroke-width': 3.5 }, el);
  var tarLabA = txt(el, XE - 2, 0, 'target · right foot', { fill: BLUE, weight: 700, anchor: 'end', halo: true });
  var tarLabB = txt(el, XE - 2, 0, 'target · a hand', { fill: BLUE, weight: 700, anchor: 'end', halo: true });
  var NT = NP + 2 * NG, ticks = []; for (i_ = 0; i_ < NT; i_++) ticks.push(A.el('path', { 'stroke-width': 3, 'stroke-linecap': 'round' }, el));
  var marks = []; for (i_ = 0; i_ < 3; i_++) marks.push(A.el('path', { stroke: BLUE, 'stroke-width': 4, 'stroke-linecap': 'round' }, el));
  var cells = []; for (i_ = 0; i_ < NK; i_++) cells.push(A.el('rect', { y: DY - 7, width: 12, height: 14, rx: 3, stroke: BLUE, 'stroke-width': 1.5 }, el));
  var cellTxt = txt(el, 0, DY + 7, '', { fill: C.mid });
  var flash = A.el('circle', { cy: DY, fill: 'none', stroke: BLUE, 'stroke-width': 3 }, el);

  function vis(n, o) { n.style.opacity = o < 0.004 ? 0 : o.toFixed(3); }
  function edge(f) { return A.clamp((f + NP + 0.7) / 0.7, 0, 1); }                                             // frames fade as they leave the window on the left
  function linePath(frames, vals, n) { var d = '', i; for (i = 0; i < n; i++) d += (i ? 'L' : 'M') + X(frames[i]).toFixed(1) + ' ' + Y(vals[i]).toFixed(1); return d; }

  /** One picture. S: prefix (20 values), ghost (20 values of the plan that was meant for those frames, or null), plan (40 clean values),
   *  seed, kf (denoising steps done, 0..10), sim (40 values or null), fpos (frames executed, 0..40), shift (frames the window has moved, 0..40),
   *  aPlan (opacity of the plan), tar (target value or null), tarLab (0..1 the label at the target), alt (the second prompt of the pair),
   *  err (0..1 strength of the amber error bars),
   *  band (0..1 the band on the 20 newest simulated frames), ring (0..1 highlight on the newest frame of the prefix), flash (0..1) */
  function scene(S) {
    var i, f, v, o, sh = S.shift || 0, d, n, fr = [], va = [];
    // prefix and the ghost of the plan that was meant for those frames
    for (i = 0; i < NP; i++) {
      f = i - NP - sh; o = edge(f);
      A.set(dPre[i], { cx: X(f).toFixed(1), cy: Y(S.prefix[i]).toFixed(1) }); vis(dPre[i], o);
      if (S.ghost) { A.set(dGhost[i], { cx: X(f).toFixed(1), cy: Y(S.ghost[i]).toFixed(1) }); vis(dGhost[i], 0.3 * o); } else vis(dGhost[i], 0);
      if (S.ghost && S.err) { A.set(eBars[i], { d: 'M' + X(f).toFixed(1) + ' ' + Y(S.ghost[i]).toFixed(1) + 'V' + Y(S.prefix[i]).toFixed(1) }); vis(eBars[i], 0.55 * S.err * o); } else vis(eBars[i], 0);
    }
    // the plan
    var kf = S.kf === undefined ? NK : S.kf, m = kf >= NK ? 0 : mix(Math.floor(kf)), ap = S.aPlan === undefined ? 1 : S.aPlan, old = ramp(sh, 0, NG);
    for (i = 0; i < NG; i++) {
      f = i - sh; v = den(S.plan, S.seed || 0, kf, i);
      A.set(dPlan[i], { cx: X(f).toFixed(1), cy: Y(v).toFixed(1) });
      vis(dPlan[i], ap * edge(f) * lerp(1, 0.55, m) * lerp(1, 0.3, old));
      fr.push(f); va.push(v);
    }
    A.set(lnPlan, { d: linePath(fr, va, NG) }); vis(lnPlan, ap * (kf >= NK ? 0.6 : 0) * lerp(1, 0.4, old) * (sh > NP ? 0 : 1));
    if (S.ghost && !sh) { fr = []; for (i = 0; i < NP; i++) fr.push(i - NP); A.set(lnGhost, { d: linePath(fr, S.ghost, NP) }); vis(lnGhost, 1); } else vis(lnGhost, 0);
    // the simulated body
    n = S.sim ? Math.min(NG, Math.floor(S.fpos)) : 0; fr = []; va = [];
    for (i = 0; i < NP; i++) if (i - NP - sh > -NP - 0.5) { fr.push(i - NP - sh); va.push(S.prefix[i]); }
    A.set(lnPre, { d: fr.length > 1 ? linePath(fr, va, fr.length) : 'M0 0' }); vis(lnPre, fr.length > 1 ? 1 : 0);
    fr = []; va = [];
    if (-1 - sh > -NP - 0.5) { fr.push(-1 - sh); va.push(S.prefix[NP - 1]); }
    for (i = 0; i < NG; i++) {
      f = i - sh; o = i < n ? edge(f) * (S.aSim === undefined ? 1 : S.aSim) : 0;
      if (S.sim) A.set(dSim[i], { cx: X(f).toFixed(1), cy: Y(S.sim[i]).toFixed(1) });
      vis(dSim[i], o);
      if (i < n && f > -NP - 0.5) { fr.push(f); va.push(S.sim[i]); }
      if (S.sim && S.err && i < n) { A.set(eBars[NP + i], { d: 'M' + X(f).toFixed(1) + ' ' + Y(S.plan[i]).toFixed(1) + 'V' + Y(S.sim[i]).toFixed(1) }); vis(eBars[NP + i], 0.95 * S.err * edge(f)); }
      else vis(eBars[NP + i], 0);
    }
    A.set(lnSim, { d: fr.length > 1 ? linePath(fr, va, fr.length) : 'M0 0' }); vis(lnSim, fr.length > 1 ? (S.aSim === undefined ? 1 : S.aSim) : 0);
    // the frame being executed: cursor, and the gap between the planned and the simulated pose
    if (S.sim && n > 0 && n < NG && !sh) {
      A.set(cursor, { d: 'M' + X(n - 1).toFixed(1) + ' ' + (YT + 3) + 'V' + (TY + 8) }); vis(cursor, 1);   // starts under the label at the target
      A.set(gap, { d: 'M' + X(n - 1).toFixed(1) + ' ' + Y(S.plan[n - 1]).toFixed(1) + 'V' + Y(S.sim[n - 1]).toFixed(1) }); vis(gap, S.err ? 0 : 1);
    } else { vis(cursor, 0); vis(gap, 0); }
    // the band on the newest 20 simulated frames, and the frame from which the next plan starts
    A.set(bandNew, { x: (X0 + (NG - sh) * DX).toFixed(1) }); vis(bandNew, S.band || 0);
    A.set(ringNow, { cx: X(-1).toFixed(1), cy: Y(S.prefix[NP - 1]).toFixed(1), r: (9 + 5 * (1 - (S.ring || 0))).toFixed(1) }); vis(ringNow, S.ring || 0);
    // targets
    if (S.tar !== null && S.tar !== undefined) { A.set(tarA, { cx: X(NG - 1 - sh).toFixed(1), cy: Y(S.tar).toFixed(1) }); vis(tarA, (S.aTar === undefined ? 1 : S.aTar) * edge(NG - 1 - sh) * lerp(1, 0.3, old)); } else vis(tarA, 0);
    var tl = S.tarLab || 0;
    if (tl) { A.set(tarLabA, { y: (Y(S.tar) - 18).toFixed(1) }); A.set(tarLabB, { y: (Y(S.tar) - 18).toFixed(1) }); }
    vis(tarLabA, S.alt ? 0 : tl); vis(tarLabB, S.alt ? tl : 0);
    // clock rows: one tick per frame (green once that frame has been executed), one mark per plan
    for (i = 0; i < NT; i++) {
      f = i - NP - sh; o = (f > -NP - 0.6 && f < NG - 0.4) ? 1 : 0;
      d = S.clock && (i - NP) < Math.floor(S.fpos) ? 1 : 0;                       // this frame has been executed
      var cur = S.clock && S.sim && !sh && Math.floor(S.fpos) - 1 === i - NP && S.fpos < NG;
      A.set(ticks[i], { d: 'M' + X(f).toFixed(1) + ' ' + (TY - (cur ? 9 : 5)) + 'V' + (TY + (cur ? 9 : 5)), stroke: d ? G : '#5c5c5c' }); vis(ticks[i], o * (d ? 1 : 0.9));
    }
    for (i = 0; i < 3; i++) {
      var xm = X0 + (NP + i * NG - sh) * DX; o = (S.marks && xm > X0 - 1 && xm < XE + 1) ? 1 : 0;
      A.set(marks[i], { d: 'M' + xm.toFixed(1) + ' ' + (DY - 11) + 'V' + (DY + 11) }); vis(marks[i], o);
    }
    var cx0 = XD + 14 - sh * DX, co = S.cells === undefined ? 1 : S.cells;
    for (i = 0; i < NK; i++) { A.set(cells[i], { x: (cx0 + i * 17).toFixed(1), fill: i < Math.floor(kf + 1e-6) ? BLUE : '#141414' }); vis(cells[i], co * A.clamp(1 - sh / 6, 0, 1)); }
    A.set(cellTxt, { x: (cx0 + NK * 17 + 10).toFixed(1), text: kf >= NK ? 'done' : (kf < 1e-6 ? 'noise' : 'step ' + Math.floor(kf + 1e-6) + ' / ' + NK) }); vis(cellTxt, co * (S.cellTxt === undefined ? 1 : S.cellTxt) * A.clamp(1 - sh / 6, 0, 1));
    if (S.flash) { A.set(flash, { cx: XD.toFixed(1), r: (6 + 20 * (1 - S.flash)).toFixed(1) }); vis(flash, S.flash); } else vis(flash, 0);
  }

  var PRE0 = SIM[NC - 1].slice(NG - NP);                         // the prefix of plan 0 = the last 20 simulated frames before it
  var TD = 7.2, TT = 5.4, TC = 5.8, LEAD = 1.9;                  // periods of the denoising loop, the tracking loop, one plan-execute cycle

  return function draw(f) {
    var step = f.step, t = step === 0 ? f.t : f.ts, on = function (k) { return step > k ? 1 : (step === k ? ramp(f.ts, 0, 0.5) : 0); };
    // two labels that share one place: the old one leaves (out) before the new one arrives (inn), so that they never overprint
    var out = function (k) { return step > k ? 0 : (step === k ? 1 - ramp(f.ts, 0, 0.22) : 1); };
    var inn = function (k) { return step > k ? 1 : (step === k ? ramp(f.ts, 0.26, 0.6) : 0); };
    // labels that change with the click
    vis(labPre0, out(3)); vis(labPre1, inn(3));
    vis(lgSim0.g, out(2)); vis(lgSim1.g, inn(2)); vis(lgTar.g, on(1) * out(3));
    vis(lgGap.g, on(2) * out(4)); vis(lgRew.g, inn(4));
    var up = 'translate(0 ' + (-32 * A.ease(inn(3))).toFixed(1) + ')'; lgGap.g.setAttribute('transform', up); lgRew.g.setAttribute('transform', up);   // the target's line is free in the loop
    vis(rowT0, out(2)); vis(rowT1, inn(2)); vis(rowD0, out(3)); vis(rowD1, inn(3));
    vis(chip, step >= 3 ? 0.55 * (1 - on(3)) : (step === 2 ? 0.55 : on(1)));

    if (step <= 1) {                                             // ---- DiP alone: noise -> plan, again and again
      var n = Math.floor(t / TD), u = t - n * TD, kf = A.clamp((u - 0.7) / 0.34, 0, NK), a = Math.min(ramp(u, 0, 0.3), 1 - ramp(u, TD - 0.4, TD));
      var alt = step === 1 && (n % 2 === 1), clean = step === 0 ? P0 : (alt ? PB : PLAN[0]);
      vis(chipA, alt ? 0 : (step === 1 ? a : 1)); vis(chipB, alt ? a : 0);                            // the prompt changes while the plan is away
      scene({ prefix: PRE0, ghost: null, plan: clean, seed: (n + (step ? 3 : 0)) % NS, kf: kf, aPlan: a, sim: null, fpos: 0,
              tar: step === 1 ? TG[0] : null, aTar: on(1), tarLab: step === 1 ? on(1) * a : 0, alt: alt, clock: false, marks: false, cells: a });
      return;
    }
    vis(chipA, 1); vis(chipB, 0);
    if (step === 2) {                                            // ---- the tracker executes one plan, frame by frame
      var u2 = A.loop(t, TT), fp = NG * ramp(u2, 0.3, 3.9), a2 = 1 - ramp(u2, TT - 0.4, TT);
      scene({ prefix: PRE0, ghost: null, plan: PLAN[0], kf: NK, sim: SIM[0], fpos: fp, aSim: a2, tar: TG[0], tarLab: lerp(1, 0.55, ramp(f.ts, 0.2, 0.8)),
              clock: true, marks: false, cells: 1, cellTxt: 0 });
      return;
    }
    // ---- the loop: execute 40 frames | the newest 20 simulated frames become the prefix | the window moves on | DiP plans again
    var tl = t + LEAD, cyc = Math.floor(tl / TC), ph = tl - cyc * TC, c = cyc % NC, cn = (c + 1) % NC, cp = (c + NC - 1) % NC;
    var err = step >= 4 ? on(4) : 0, first = cyc === 0;          // before the first hand-over there is no earlier plan to compare with
    if (ph < 4.3) {                                              // executing plan c (0 .. 3.0), hand-over (3.0 .. 3.6), window moves (3.6 .. 4.3)
      scene({ prefix: SIM[cp].slice(NG - NP), ghost: first ? null : PLAN[cp].slice(NG - NP), plan: PLAN[c], kf: NK, sim: SIM[c], fpos: NG * ramp(ph, 0, 3.0),
              shift: NG * A.ease(ramp(ph, 3.6, 4.3)), tar: first && step === 3 ? TG[0] : null, aTar: 1 - ramp(f.ts, 0, 0.5),
              tarLab: first && step === 3 ? 0.55 * (1 - ramp(f.ts, 0, 0.5)) : 0, err: err, band: ramp(ph, 3.0, 3.4),
              clock: true, marks: true, cells: 1, cellTxt: 0 });
    } else {                                                     // DiP plans from the new prefix: 10 denoising steps (4.3 .. 5.5), then a short hold
      var k2 = A.clamp((ph - 4.4) / 0.11, 0, NK);
      scene({ prefix: SIM[c].slice(NG - NP), ghost: PLAN[c].slice(NG - NP), plan: PLAN[cn], seed: (cyc + 1) % NS, kf: k2, sim: SIM[cn], fpos: 0,
              shift: 0, tar: null, err: err, band: 0, ring: 1 - ramp(ph, 5.2, 5.8), flash: 1 - ramp(ph, 4.3, 5.0),
              clock: true, marks: true, cells: 1, cellTxt: k2 >= NK ? 0 : 1 });
    }
  };
});
