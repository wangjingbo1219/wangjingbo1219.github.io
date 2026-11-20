/* Slide "CALM — how" (Tessler et al. 2023, Sec. 5).   <svg data-anim="calm-latent" viewBox="0 0 1740 370">
 * A SCHEMATIC, not a simulation and not the authors' data: stick figures stand for motions, a circle for the 64-d unit hypersphere.
 * It carries no numbers. What it shows is the mechanism of the paper:
 *   step 0  ASE: z is sampled at random on the sphere; some skill comes out, nobody knows which (the clips are data, tied to no z);
 *           the places of the two judges are empty frames until click 2
 *   step 1  CALM: a 2-s window M of a real clip is encoded to a point z = E(M); every motion has an address
 *   step 2  the conditional discriminator D(s, s' | z): a natural sprint passes the unconditional judge of AMP / ASE,
 *           but not the judge that knows z = E(kick)  (Eq. 7: real data paired with another latent is a negative sample)
 *   step 3  its score is the reward r = -log(1 - D); the same reward reaches the encoder through z
 *   step 4  on demand: pick a motion, z = E(M), the policy performs it               (the authors' clip plays beside the figure)
 *   step 5  z slides from E(sprint) to E(crouch-idle); the character slows down and sinks  (in step with the clip's own progress bar)
 * Motion names are the paper's (Fig. 3 and 7: sprint · crouch, idle · kick).
 */
DeckAnim.register('calm-latent', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, AM = C.amber, RED = C.red, TAU = 2 * Math.PI, L = A.lerp;
  var frozen = /[?&](animt|still|audit|print)\b/.test(location.search), shot = /[?&](animt|still)\b/.test(location.search);
  var sec = el.closest('section'), vid = sec ? sec.querySelector('video[src*="calm_interp_bar"]') : null;
  var MI = function (s, k) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:' + (k || 1.2) + 'em">' + s + '</tspan>'; };
  function txt(parent, x, y, html, o) { var n = A.text(parent, x, y, '', o); n.innerHTML = html; return n; }

  // ---------------------------------------------------------------- stick figure (side view, facing right)
  // pose = [thigh1, knee1, thigh2, knee2, upper arm1, elbow1, upper arm2, elbow2, lean, lift]; leg / arm 1 is the near one
  function Fig(parent, col, s) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': 7.5 * s, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    var far = A.el('path', { 'stroke-opacity': 0.45 }, g), near = A.el('path', {}, g), head = A.el('circle', { r: 11.5 * s, fill: col, stroke: 'none' }, g);
    var TH = 34 * s, SH = 34 * s, TO = 46 * s, UA = 25 * s, LA = 24 * s;
    function f1(v) { return v.toFixed(1); }
    return { g: g, draw: function (p, x, yg) {
      var r1 = TH * Math.cos(p[0]) + SH * Math.cos(p[0] - p[1]), r2 = TH * Math.cos(p[2]) + SH * Math.cos(p[2] - p[3]);
      var hy = yg - Math.max(r1, r2) - p[9] * s, sx = x + TO * Math.sin(p[8]), sy = hy - TO * Math.cos(p[8]);
      function leg(th, kn) {
        var kx = x + TH * Math.sin(th), ky = hy + TH * Math.cos(th), fx = kx + SH * Math.sin(th - kn), fy = Math.min(yg, ky + SH * Math.cos(th - kn));
        return 'M' + f1(x) + ' ' + f1(hy) + 'L' + f1(kx) + ' ' + f1(ky) + 'L' + f1(fx) + ' ' + f1(fy) + 'l' + f1(8 * s) + ' 0';
      }
      function arm(up, e) {
        var ex = sx + UA * Math.sin(up), ey = sy + UA * Math.cos(up);
        return 'M' + f1(sx) + ' ' + f1(sy) + 'L' + f1(ex) + ' ' + f1(ey) + 'L' + f1(ex + LA * Math.sin(up + e)) + ' ' + f1(ey + LA * Math.cos(up + e));
      }
      far.setAttribute('d', leg(p[2], p[3]) + arm(p[6], p[7]));
      near.setAttribute('d', leg(p[0], p[1]) + 'M' + f1(x) + ' ' + f1(hy) + 'L' + f1(sx) + ' ' + f1(sy) + arm(p[4], p[5]));
      head.setAttribute('cx', f1(sx + 15 * s * Math.sin(p[8]))); head.setAttribute('cy', f1(sy - 15 * s * Math.cos(p[8])));
    } };
  }
  function mix(a, b, u) { var o = [], i; for (i = 0; i < a.length; i++) o.push(L(a[i], b[i], u)); return o; }
  function sprintAt(ph, amp) {                                  // ph = phase in radians, amp = 1 full stride
    function leg(q) { return [0.2 + 0.8 * amp * Math.sin(q), 0.25 + 1.35 * amp * Math.max(0, Math.cos(q))]; }
    var a = leg(ph), b = leg(ph + Math.PI);
    return [a[0], a[1], b[0], b[1], -0.1 - 0.9 * amp * Math.sin(ph), 1.45, -0.1 + 0.9 * amp * Math.sin(ph), 1.45, 0.3, 3 * amp * Math.abs(Math.sin(ph))];
  }
  function sprint(t) { return sprintAt(TAU * t / 0.66, 1); }
  function crouch(t) { var b = Math.sin(TAU * t / 2.4); return [1.15, 1.75, 0.55, 1.7, 0.75 + 0.04 * b, 1.25, 0.45 + 0.04 * b, 1.5, 0.5 + 0.02 * b, 1.2 * b]; }
  var KK = [[0, 0.05, 0.1], [0.18, 0.35, 1.0], [0.36, 1.3, 1.8], [0.48, 1.5, 0.05], [0.6, 1.5, 0.1], [0.74, 1.1, 1.6], [0.9, 0.15, 0.4], [1, 0.05, 0.1]];
  function kick(t) {
    var u = A.loop(t, 1.8) / 1.8, i = 0, th, kn, w, e;
    while (i < KK.length - 2 && u > KK[i + 1][0]) i++;
    e = A.ease((u - KK[i][0]) / (KK[i + 1][0] - KK[i][0]));
    th = L(KK[i][1], KK[i + 1][1], e); kn = L(KK[i][2], KK[i + 1][2], e);
    w = A.ease(A.ramp(u, 0.14, 0.4)) * (1 - A.ease(A.ramp(u, 0.66, 0.92)));          // 1 while the leg is up
    return [th, kn, -0.12, 0.12 + 0.12 * w, 0.5, 1.6, -0.2 - 0.45 * w, 1.2, -0.3 * w, 0];
  }
  var IDLE = [0.12, 0.18, -0.12, 0.18, 0.1, 0.25, -0.05, 0.25, 0.04, 0];
  var MOT = [sprint, crouch, kick], NAME = ['sprint', 'crouch-idle', 'kick'], DOES = ['it sprints', 'it crouches', 'it kicks'];

  // ---------------------------------------------------------------- geometry
  var CY = [0, 130, 260], CW = 300, CH = 110;                                   // library cards
  var SX = 520, SY = 178, SR = 118;                                             // the latent sphere, drawn as a circle
  var ANG = [-128, 178, 128].map(function (d) { return d * Math.PI / 180; });   // E(sprint), E(crouch-idle), E(kick)
  function onS(a) { return [SX + SR * Math.cos(a), SY + SR * Math.sin(a)]; }
  var ENC = ANG.map(onS);
  var BX = 740, BW = 300, BH = 370, PX = 890, PG = 334;                         // policy box, the character's x and ground
  var JX = 1150, JW = 590;                                                      // the two judges

  // ---------------------------------------------------------------- latent sphere
  A.el('circle', { cx: SX, cy: SY, r: SR, fill: '#0c0c0c', stroke: '#6a6a6a', 'stroke-width': 2.5 }, el);
  A.el('ellipse', { cx: SX, cy: SY, rx: SR, ry: 34, fill: 'none', stroke: '#2e2e2e', 'stroke-width': 2, 'stroke-dasharray': '4 7' }, el);
  A.text(el, SX, SY + SR + 36, 'latent sphere, 64-d', { size: 20, weight: 500, fill: C.mid, anchor: 'middle', halo: false });
  var capA = txt(el, SX, 24, 'ASE: ' + MI('z') + ' is drawn at random', { size: 21, weight: 700, fill: '#fff', anchor: 'middle' });
  var capC = txt(el, SX, 24, 'CALM: ' + MI('z = E(M)'), { size: 21, weight: 700, fill: G, anchor: 'middle' });
  var arc = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-opacity': 0.28 }, el);    // step 5: the way from E(sprint) to E(crouch-idle)
  (function () { var p = [], i, a; for (i = 0; i <= 24; i++) { a = ANG[0] - (ANG[0] + TAU - ANG[1]) * i / 24; p.push(onS(a)); } arc.setAttribute('d', A.path(p)); })();

  // ---------------------------------------------------------------- library cards and the encoder lines
  var card = [], gLib = A.el('g', {}, el);
  CY.forEach(function (y, k) {
    var g = A.el('g', {}, gLib);
    var ln = A.el('line', { x1: CW, y1: y + CH / 2, x2: ENC[k][0], y2: ENC[k][1], stroke: G, 'stroke-width': 2.5, 'stroke-opacity': 0.75 }, g);
    var r = A.el('rect', { x: 1.5, y: y + 1.5, width: CW - 3, height: CH - 3, rx: 14, fill: '#101010', stroke: G, 'stroke-width': 3 }, g);
    A.text(g, 20, y + 40, NAME[k], { size: 24, fill: G, halo: false });
    var sub = A.text(g, 20, y + 70, '', { size: 20, weight: 500, fill: C.mid, halo: false });
    A.el('line', { x1: 176, y1: y + 98, x2: 276, y2: y + 98, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    var dot = A.el('circle', { cx: ENC[k][0], cy: ENC[k][1], r: 8, fill: G, stroke: '#0c0c0c', 'stroke-width': 2.5 }, g);
    card.push({ g: g, rect: r, line: ln, dot: dot, sub: sub, fig: Fig(g, G, 0.56), y: y });
  });
  var encLab = txt(gLib, 348, 162, MI('E'), { size: 23, fill: G, anchor: 'middle' });
  var tokE = A.el('rect', { x: -7, y: -7, width: 14, height: 14, rx: 3, fill: G, stroke: '#0c0c0c', 'stroke-width': 2 }, el);          // a window on its way through the encoder

  // ---------------------------------------------------------------- z and the link to the policy
  var link = A.el('path', { fill: 'none', stroke: '#e8e8e8', 'stroke-width': 3 }, el);
  var linkHead = A.el('path', { d: 'M722 177 L734 185 L722 193', fill: 'none', stroke: '#e8e8e8', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var grad = A.text(el, 730, 166, 'gradient', { size: 20, fill: AM, anchor: 'end' });
  var gp = [0, 1, 2].map(function () { return A.el('circle', { r: 5.5, fill: AM, stroke: '#0c0c0c', 'stroke-width': 1.5 }, el); });
  var zd = A.el('circle', { r: 11, fill: '#fff', stroke: '#0c0c0c', 'stroke-width': 3 }, el);
  var zl = txt(el, 0, 0, MI('z', 1), { size: 30, fill: '#fff' });

  // ---------------------------------------------------------------- the policy in the simulator
  var gPol = A.el('g', {}, el);
  A.el('rect', { x: BX + 1.5, y: 1.5, width: BW - 3, height: BH - 3, rx: 16, fill: '#101010', stroke: AM, 'stroke-width': 3 }, gPol);
  A.text(gPol, BX + 20, 38, 'Policy', { size: 24, fill: AM, halo: false });
  A.text(gPol, BX + 20, 66, 'in the simulator', { size: 20, weight: 500, fill: C.mid, halo: false });
  A.el('line', { x1: PX - 110, y1: PG + 4, x2: PX + 120, y2: PG + 4, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, gPol);
  var hero = Fig(gPol, AM, 1.45);
  var does = A.text(gPol, BX + BW - 20, 38, '', { size: 21, weight: 700, fill: AM, anchor: 'end', halo: false });     // what the character is doing

  // ---------------------------------------------------------------- the two judges (steps 2 and 3)
  // their places are there from the start, empty: the frame of the figure (as in the Foundations chapter); the authors' clips take the place at click 4
  var gF = A.el('g', {}, el);
  A.el('rect', { x: JX + 1, y: 1, width: JW - 2, height: 116, rx: 14, fill: '#0e0e0e', stroke: '#262626', 'stroke-width': 2 }, gF);
  A.el('rect', { x: JX + 1, y: 151, width: JW - 2, height: 218, rx: 14, fill: '#0e0e0e', stroke: '#262626', 'stroke-width': 2 }, gF);
  var gJ = A.el('g', {}, el), gRw = A.el('g', {}, el);
  function arrow(parent, x1, x2, y, col, dash) {
    var d = x2 > x1 ? 1 : -1;
    A.el('line', { x1: x1, y1: y, x2: x2 - 3 * d, y2: y, stroke: col, 'stroke-width': 3, 'stroke-dasharray': dash || 'none' }, parent);
    A.el('path', { d: 'M' + (x2 - 13 * d) + ' ' + (y - 8) + ' L' + x2 + ' ' + y + ' L' + (x2 - 13 * d) + ' ' + (y + 8), fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  }
  var AY = [59, 215], RY = 318, tokJ = [];
  AY.forEach(function (y) {
    arrow(gJ, BX + BW + 4, JX - 4, y, '#b4b4b4');
    txt(gJ, (BX + BW + JX) / 2, y - 15, MI('(s, s′)', 1), { size: 24, fill: '#d6d6d6', anchor: 'middle', weight: 500 });
    tokJ.push(A.el('circle', { r: 6, cy: y, fill: AM, stroke: '#0c0c0c', 'stroke-width': 1.5 }, gJ));
  });
  // row 1: the unconditional judge of AMP and ASE
  A.el('rect', { x: JX + 1, y: 1, width: JW - 2, height: 116, rx: 14, fill: '#101010', stroke: '#565656', 'stroke-width': 2 }, gJ);
  txt(gJ, JX + 22, 46, MI('D(s, s′)', 1), { size: 29, fill: '#c8c8c8', weight: 500, halo: false });
  A.text(gJ, JX + 154, 44, 'AMP · ASE', { size: 20, weight: 500, fill: C.mid, halo: false });
  A.text(gJ, JX + 22, 88, 'does it look like the data?', { size: 22, weight: 500, fill: '#c8c8c8', halo: false });
  // row 2: CALM's judge also sees z
  A.el('rect', { x: JX + 1.5, y: 151.5, width: JW - 3, height: 217, rx: 14, fill: '#101010', stroke: '#e8e8e8', 'stroke-width': 3 }, gJ);
  txt(gJ, JX + 22, 198, MI('D(s, s′ | z)', 1), { size: 29, fill: '#fff', weight: 500, halo: false });
  A.text(gJ, JX + 196, 196, 'CALM', { size: 20, weight: 700, fill: G, halo: false });
  txt(gJ, JX + 22, 240, 'is it the motion ' + MI('z') + ' stands for?', { size: 22, weight: 500, fill: '#fff', halo: false });
  txt(gJ, JX + 22, 318, MI('z = E(') + 'kick' + MI(')') + ':', { size: 21, weight: 500, fill: G, halo: false });
  A.el('line', { x1: JX + 176, y1: 350, x2: JX + 286, y2: 350, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, gJ);
  var refFig = Fig(gJ, G, 0.56);
  function Pill(y) {
    var g = A.el('g', {}, gJ), r = A.el('rect', { x: JX + JW - 180, y: y, width: 158, height: 58, rx: 29, 'stroke-width': 3 }, g);
    var t = A.text(g, JX + JW - 101, y + 39, '', { size: 27, anchor: 'middle', halo: false });
    return function (ok) {
      A.set(r, { fill: ok ? '#12210a' : '#2a100d', stroke: ok ? G : RED });
      t.textContent = ok ? '✓ yes' : '✗ no'; t.style.fill = ok ? G : RED;
    };
  }
  var pill1 = Pill(30), pill2 = Pill(276);
  // the reward (step 3)
  arrow(gRw, JX - 4, BX + BW + 4, RY, AM, '7 6');
  A.text(gRw, (BX + BW + JX) / 2, RY - 16, 'reward', { size: 20, fill: AM, anchor: 'middle' });
  var rlev = A.text(gRw, (BX + BW + JX) / 2, RY + 32, '', { size: 21, fill: AM, anchor: 'middle' });
  var tokR = [0, 1].map(function () { return A.el('circle', { r: 6, cy: RY, fill: AM, stroke: '#0c0c0c', 'stroke-width': 1.5 }, gRw); });

  // ---------------------------------------------------------------- helpers for draw
  function bez(p, u) {
    var v = 1 - u;
    return [v * v * v * p[0][0] + 3 * v * v * u * p[1][0] + 3 * v * u * u * p[2][0] + u * u * u * p[3][0],
            v * v * v * p[0][1] + 3 * v * v * u * p[1][1] + 3 * v * u * u * p[2][1] + u * u * u * p[3][1]];
  }
  function linkOf(z) {                                                          // from just after the letter z to the policy box; an S-curve whatever side of the sphere z is on
    var x0 = z[0] + 34, d = 0.5 * (734 - x0);
    return [[x0, z[1]], [x0 + d, z[1]], [734 - d, 185], [734, 185]];
  }
  var HOP = 1.9, SEQ0 = [0, 2, 1, 2, 0, 1];                                     // step 0: a new random z every HOP seconds, and whatever skill it gives
  function hopAngle(i) { return TAU * A.rand(i * 97 + 5)(); }
  var CYC = 3.2, SEQ4 = [2, 0, 1];                                              // step 4: kick, sprint, crouch-idle, asked for in turn
  var CLIP = 16.2, U0 = 1.3, U1 = 14.7;                                         // step 5: the clip's bar leaves 0 % at 1.3 s and reaches 100 % at 14.7 s
  var W0 = TAU / 0.66, W1 = TAU / 1.25;                                         // stride frequency at 0 % and at 100 %
  function interp(ct) {                                                         // -> [u, stride phase]; phase = integral of the frequency
    var u = A.clamp((ct - U0) / (U1 - U0), 0, 1), x = A.clamp(ct - U0, 0, U1 - U0);
    return [u, W0 * Math.min(ct, U0) + W0 * x + (W1 - W0) * x * x / (2 * (U1 - U0)) + W1 * Math.max(0, ct - U1)];
  }

  return function draw(f) {
    var t = f.t, st = f.step, ts = f.ts, k, i, w, z, zo = 1, pose, sel = -1, act = [0, 0, 0], polO = 1, label = '';

    // ---------- which z, which motion
    if (st === 0) {
      i = Math.floor(t / HOP); w = A.ramp(t - i * HOP, 0, 0.3);
      z = onS(hopAngle(i)); zo = t < HOP ? 1 : Math.abs(2 * w - 1);
      if (w < 0.5 && i > 0) z = onS(hopAngle(i - 1));
      pose = mix(MOT[SEQ0[(i + 5) % 6]](t), MOT[SEQ0[i % 6]](t), i > 0 ? A.ease(A.ramp(t - i * HOP, 0.15, 0.6)) : 1);
    } else if (st === 1) {
      k = Math.max(0, ts - 1.9); i = Math.floor(k / 2.4); sel = i % 3; w = k - i * 2.4;
      z = ENC[sel]; zo = ts < 1.9 ? 0 : A.ramp(w, 0.55, 0.8) * (1 - A.ramp(w, 2.25, 2.4));
      act[sel] = ts < 1.9 ? 0 : 1; pose = IDLE; polO = 0.3;
    } else if (st === 2 || st === 3) {
      sel = 2; z = ENC[2]; act[2] = 1;
      k = A.loop(ts, 8);                                                        // 0..4 s it sprints, 4..8 s it kicks
      w = k < 4 ? 1 - A.ease(A.ramp(k, 0, 0.5)) : A.ease(A.ramp(k, 4, 4.5));
      pose = mix(sprint(t), kick(k < 4 ? k + 3.6 : k - 4.4), w); label = w > 0.5 ? DOES[2] : DOES[0];     // the kick ends standing when the loop restarts
    } else if (st === 4) {
      i = Math.floor(ts / CYC); w = ts - i * CYC; sel = SEQ4[i % 3]; k = SEQ4[(i + 2) % 3];
      z = ENC[sel]; zo = i === 0 ? 1 : Math.abs(2 * A.ramp(w, 0, 0.3) - 1);
      if (i > 0 && w < 0.15) z = ENC[k];
      act[sel] = 1;
      pose = i === 0 ? MOT[sel](w) : mix(MOT[k](ts - (i - 1) * CYC), MOT[sel](w), A.ease(A.ramp(w, 0.15, 0.65)));
      label = (i === 0 || w > 0.4) ? DOES[sel] : DOES[k];
    } else {
      var live = !frozen && vid && !vid.paused && !vid.seeking && vid.readyState >= 2;
      var ct = live ? A.loop(vid.currentTime, CLIP) : A.loop(ts, CLIP), q = interp(ct), u = q[0];
      if (shot && vid && Math.abs(vid.currentTime - ct) > 0.05) { try { vid.pause(); vid.currentTime = ct; } catch (e) {} }      // review screenshots (?animt, ?still): hold the clip at the figure's moment
      z = onS(ANG[0] - (ANG[0] + TAU - ANG[1]) * u); act[0] = 1; act[1] = 1;
      pose = mix(sprintAt(q[1], 1 - 0.72 * u), crouch(ct), u * (0.55 + 0.45 * u));
    }

    // ---------- sphere captions, cards, encoder lines
    A.show(capA, st === 0 ? 1 : 0); A.show(capC, st === 0 ? 0 : (st === 1 ? A.ramp(ts, 0.1, 0.6) : 1));
    A.show(arc, st >= 5 ? A.ramp(ts, 0, 0.6) : 0);
    A.show(encLab, st === 1 ? A.ramp(ts, 0.9, 1.4) : (st > 1 ? 1 : 0));
    for (k = 0; k < 3; k++) {
      // step 0: the clips are in the data set, but nothing ties them to z. Step 1: the encoder gives each one its point.
      var c = card[k], grow = st === 0 ? 0 : (st === 1 ? A.ease(A.ramp(ts, 0.3 + 0.4 * k, 0.9 + 0.4 * k)) : 1);
      var on = st === 0 ? 0.6 : (st === 1 && ts < 1.9 ? L(0.6, 1, A.ramp(ts, 0, 0.4)) : (act[k] ? 1 : 0.42));
      A.show(c.g, on);
      A.set(c.line, { x2: L(CW, ENC[k][0], grow), y2: L(c.y + CH / 2, ENC[k][1], grow), 'stroke-width': act[k] ? 3.5 : 2.5 });
      A.show(c.dot, grow > 0.98 ? 1 : 0); A.show(c.line, grow > 0 ? 1 : 0);
      A.set(c.rect, { fill: act[k] ? '#14200a' : '#101010' });
      c.sub.textContent = st === 0 ? 'a clip in the data' : '2-s window';             // the windows arrive with the encoder
      c.fig.draw(MOT[k](t + 0.3 * k), 226, c.y + 96);
    }
    // a window travels through the encoder to its point (step 1, at the start of every turn)
    if (st === 1 && ts >= 1.9 && w < 0.6) {
      var e1 = A.ease(w / 0.6);
      A.set(tokE, { transform: 'translate(' + L(CW, ENC[sel][0], e1).toFixed(1) + ' ' + L(card[sel].y + CH / 2, ENC[sel][1], e1).toFixed(1) + ')' });
      A.show(tokE, Math.min(1, w / 0.1, (0.6 - w) / 0.1));
    } else A.show(tokE, 0);

    // ---------- z, its link to the policy
    A.set(zd, { cx: z[0].toFixed(1), cy: z[1].toFixed(1) }); A.show(zd, zo);
    A.set(zl, { x: (z[0] + 14).toFixed(1), y: (z[1] + 9).toFixed(1) }); A.show(zl, zo);       // close to the dot: its halo hides the start of the line (no "-z")
    var lk = linkOf(z);
    link.setAttribute('d', 'M' + lk[0][0].toFixed(1) + ' ' + lk[0][1].toFixed(1) + 'C' + lk[1][0].toFixed(1) + ' ' + lk[1][1].toFixed(1) + ' ' + lk[2] + ' ' + lk[3]);
    A.show(link, st === 1 ? 0.3 * zo : (0.35 + 0.65 * zo)); A.show(linkHead, st === 1 ? 0.3 * zo : 1);

    // ---------- the policy
    A.show(gPol, polO);
    hero.draw(pose, PX, PG);
    does.textContent = st === 0 ? 'which skill?' : label; does.style.fill = st === 0 ? C.mid : AM;

    // ---------- the judges and the reward
    var jo = st === 2 ? A.ramp(ts, 0.15, 0.7) : (st === 3 ? 1 : 0), ro = st === 3 ? A.ramp(ts, 0.15, 0.7) : 0;
    A.show(gF, st < 4 ? 1 : (st === 4 ? 1 - A.ramp(ts, 0, 0.3) : 0)); A.show(gJ, jo); A.show(gRw, ro); A.show(grad, ro);
    if (jo > 0) {
      var k8 = A.loop(ts, 8), ok = k8 >= 4.45 || k8 < 0.25;                    // the verdict follows the motion
      pill1(true); pill2(ok);
      refFig.draw(kick(t + 0.9), JX + 226, 348);
      for (i = 0; i < 2; i++) { var u2 = A.loop(t * 0.9 + 0.5 * i, 1); A.set(tokJ[i], { cx: L(BX + BW + 10, JX - 16, u2) }); A.show(tokJ[i], Math.min(1, u2 / 0.15, (1 - u2) / 0.15)); }
      if (ro > 0) {
        rlev.textContent = ok ? 'high' : 'low'; rlev.style.fill = ok ? AM : '#8f6a0a';
        for (i = 0; i < 2; i++) {
          var u3 = A.loop(t * 0.8 + 0.5 * i, 1);
          A.set(tokR[i], { cx: L(JX - 12, BX + BW + 14, u3) }); A.show(tokR[i], (ok ? 1 : 0.3) * Math.min(1, u3 / 0.15, (1 - u3) / 0.15));
        }
        for (i = 0; i < 3; i++) {                                               // the same signal, back through z and the encoder
          var u4 = A.loop(t * 0.45 + i / 3, 1), p4 = u4 < 0.7 ? bez(lk, 1 - u4 / 0.7) : [L(ENC[2][0], CW, (u4 - 0.7) / 0.3), L(ENC[2][1], card[2].y + CH / 2, (u4 - 0.7) / 0.3)];
          A.set(gp[i], { cx: p4[0].toFixed(1), cy: p4[1].toFixed(1) }); A.show(gp[i], ro * (ok ? 1 : 0.35) * Math.min(1, u4 / 0.08, (1 - u4) / 0.08));
        }
      }
    }
    if (ro <= 0) for (i = 0; i < 3; i++) A.show(gp[i], 0);
  };
});
