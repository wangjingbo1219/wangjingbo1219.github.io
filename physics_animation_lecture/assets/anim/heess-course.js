/* Slide "Emergence — how" (tools/slides/02_10_heess.py): the course under the pipeline.
 *   <svg data-anim="heess-course" viewBox="0 0 1740 320">
 * A SCHEMATIC, with no numbers: a stick walker on a track seen from the side. The picture follows the clicks of the pipeline above it
 * (Heess et al. 2017, arXiv:1707.02286, sections 2, 3.1, 4 and appendix B.1):
 *   0  flat ground: it runs slower and faster, and the reward bar follows its forward speed v_x
 *   1  procedural terrain: every episode a new random course (hurdles, gaps, platforms); an obstacle that stops the walker stops the reward
 *   2  perception: height samples that move with the body, and the same samples as the array the policy receives
 *   3  curriculum: the hurdles grow along the track; run after run the walker gets further
 *   4  distributed PPO: workers on their own courses send gradients to the parameter server and get the same updated policy back
 * Nothing here is simulated: the walker is drawn from a hand-written gait (feet do not slide, jumps are parabolas).
 */
DeckAnim.register('heess-course', function (el, A) {
  'use strict';
  var C = A.C, GY = 258, EARTH = 32, HIP = 46, TH = 25, SH = 25, TOR = 36, HR = 8.5, S = 46, X0 = 44, X1 = 1696, PLAT = 80, LY = GY + EARTH + 22;
  var SUB = '<tspan dy="5" style="font-family:' + A.MATH + ';font-style:italic;font-size:.85em">x</tspan>';
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.2em">' + s + '</tspan>'; };
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 700) + ' ' + (o.size || 21) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') }, p);
    n.innerHTML = s;
    return n;
  }

  // ------------------------------------------------------------------ courses
  var cache = {};
  /** a random course: two hurdles, a gap and a platform, in random order, sizes and places */
  function course(seed, firstHurdle) {
    var key = seed + (firstHurdle ? 'h' : '');
    if (cache[key]) return cache[key];
    var r = A.rand(seed), slots = [400, 740, 1080, 1420], types = ['h', 'g', 'p', 'h'], obs = [], i, j, t, w;
    for (i = types.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = types[i]; types[i] = types[j]; types[j] = t; }
    if (firstHurdle && types[0] !== 'h') { j = types.indexOf('h'); types[j] = types[0]; types[0] = 'h'; }
    for (i = 0; i < 4; i++) {
      var cx = slots[i] + (r() - 0.5) * 90;
      if (types[i] === 'h') obs.push({ type: 'h', x0: cx - 14, w: 28, h: 26 + r() * 24, cx: cx });
      else if (types[i] === 'g') { w = 74 + r() * 40; obs.push({ type: 'g', x0: cx - w / 2, w: w, h: 0, cx: cx }); }
      else { w = 150 + r() * 60; obs.push({ type: 'p', x0: cx - w / 2, w: w, h: PLAT, cx: cx }); }
    }
    return (cache[key] = { obs: obs });
  }
  var FLAT = { obs: [] };
  /** the curriculum course: hurdles that grow along the track (the last one nearly as tall as the body) */
  var CUR = { obs: [300, 560, 820, 1080, 1340, 1590].map(function (x, i) { return { type: 'h', x0: x - 14, w: 28, h: 16 + 14 * i, cx: x }; }) };

  /** what the body does at x on a course: lift (px above standing height) and crouch (0..1) */
  function kin(c, x, skip) {
    var lift = 0, cr = 0, i, o, a, u;
    for (i = 0; i < c.obs.length; i++) {
      if (i === skip) continue;
      o = c.obs[i];
      if (o.type === 'h') { a = 40 + 0.4 * o.h; u = (x - (o.x0 - a)) / (o.w + 2 * a); if (u > 0 && u < 1) lift = Math.max(lift, (o.h + 10) * 4 * u * (1 - u)); }
      else if (o.type === 'g') { a = 16; u = (x - (o.x0 - a)) / (o.w + 2 * a); if (u > 0 && u < 1) lift = Math.max(lift, (20 + 0.12 * o.w) * 4 * u * (1 - u)); }
      else cr = Math.max(cr, A.ease(A.ramp(x, o.x0 - 110, o.x0 - 26)) * (1 - A.ease(A.ramp(x, o.x0 + o.w + 16, o.x0 + o.w + 100))));
    }
    return { lift: lift, c: cr };
  }
  /** terrain under x: y of the ground / hurdle top / pit floor, and the underside of a platform above it (or 0) */
  function surf(c, x) {
    var y = GY, p = 0, i, o;
    for (i = 0; i < c.obs.length; i++) {
      o = c.obs[i];
      if (x >= o.x0 && x <= o.x0 + o.w) { if (o.type === 'h') y = GY - o.h; else if (o.type === 'g') y = GY + EARTH - 6; else p = GY - o.h; }
    }
    return { y: y, p: p };
  }

  // ------------------------------------------------------------------ episodes
  /** one run over a course at speed V; stall = index of the hurdle it fails at (or -1) */
  function ep(c, V, stall, tag) {
    var e = { c: c, V: V, stall: stall, tag: tag || '' };
    if (stall >= 0) { e.xs = c.obs[stall].x0 - 26; e.tr = (e.xs - X0) / V; e.dur = e.tr + 2.7; }
    else { e.xs = X1; e.tr = (X1 - X0) / V; e.dur = e.tr + 0.2; }
    return e;
  }
  function pick(list, tau) {
    var tot = 0, i, u;
    for (i = 0; i < list.length; i++) tot += list[i].dur;
    u = A.loop(tau, tot);
    for (i = 0; i < list.length; i++) { if (u < list[i].dur || i === list.length - 1) return { e: list[i], t: u, i: i }; u -= list[i].dur; }
  }
  /** walker state at time t of episode e: x, body kinematics, speed fraction (0..1), opacity */
  function state(e, t) {
    var x = X0 + e.V * t, k, v = 1, vf = 1;
    if (e.wave) {                                   // flat ground: slow, fast, slow again, so that the reward bar has something to follow
      var w = 2 * Math.PI / e.tr, a = 0.6;
      x = X0 + (X1 - X0) * (t - a * Math.sin(w * t) / w) / e.tr; vf = (1 - a * Math.cos(w * Math.min(t, e.tr))) / (1 + a);
    }
    if (e.stall >= 0 && t >= e.tr) {
      var o = e.c.obs[e.stall], s = t - e.tr, u = -1;
      x = e.xs;
      if (s > 0.3 && s < 1.1) u = (s - 0.3) / 0.8; else if (s > 1.45 && s < 2.25) u = (s - 1.45) / 0.8;
      k = { lift: 0, c: 0 };
      if (u >= 0) { k.lift = 0.55 * o.h * 4 * u * (1 - u); x += 9 * Math.sin(Math.PI * u); }       // two hops that are not high enough
      v = 1 - A.ramp(s, 0, 0.18);
    } else k = kin(e.c, x, e.stall);
    return { x: x, k: k, v: v, vf: v * vf, op: Math.min(1, t / 0.25, (e.dur - t) / 0.25) };
  }
  var EP = [
    [ep(FLAT, 275, -1)],
    [ep(course(11, true), 300, 0, 'early in training'), ep(course(12), 300, -1, 'later in training'), ep(course(15), 300, -1, 'later in training')],
    [ep(course(21), 270, -1), ep(course(24), 270, -1), ep(course(27), 270, -1)],
    [ep(CUR, 330, 2, 'early in training'), ep(CUR, 330, 4, 'later in training'), ep(CUR, 330, -1, 'end of training')]
  ];

  EP[0][0].wave = true;

  // ------------------------------------------------------------------ a scene = one course + one walker
  function Scene(parent, k) {             // k: stroke scale (the worker lanes are drawn small)
    var g = A.el('g', {}, parent), i, boxes = [];
    var earth = A.el('path', { fill: '#171717' }, g);
    var line = A.el('path', { fill: 'none', stroke: '#8a8a8a', 'stroke-width': 3 * k, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
    for (i = 0; i < 6; i++) boxes.push(A.el('rect', { fill: '#2c2c2c', stroke: '#b0b0b0', 'stroke-width': 2.5 * k, rx: 3 }, g));
    var wg = A.el('g', { fill: 'none', stroke: '#fff', 'stroke-width': 6.5 * k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    var body = A.el('path', {}, wg), head = A.el('circle', { r: HR, fill: '#fff', stroke: 'none' }, wg);
    function leg(hx, hy, fx, fy) {         // two-link leg, knee forward -> [knee x, knee y, foot x, foot y]
      var dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), TH + SH - 0.5), a = Math.atan2(dy, dx);
      var al = Math.acos(A.clamp((TH * TH + d * d - SH * SH) / (2 * TH * d), -1, 1)), ka = a - al;
      return [hx + TH * Math.cos(ka), hy + TH * Math.sin(ka), hx + d * Math.cos(a), hy + d * Math.sin(a)];
    }
    return {
      /** draw the course; grow 0..1 lets the obstacles rise out of the ground */
      course: function (c, grow) {
        var segs = [], a = 20, i, o, n = 0, de = '', dl = '';
        for (i = 0; i < c.obs.length; i++) if (c.obs[i].type === 'g') { o = c.obs[i]; segs.push([a, o.x0 + o.w / 2 * (1 - grow)]); a = o.x0 + o.w / 2 * (1 + grow); }
        segs.push([a, 1720]);
        for (i = 0; i < segs.length; i++) {
          de += 'M' + segs[i][0].toFixed(1) + ' ' + GY + 'H' + segs[i][1].toFixed(1) + 'V' + (GY + EARTH) + 'H' + segs[i][0].toFixed(1) + 'Z';
          dl += 'M' + segs[i][0].toFixed(1) + ' ' + GY + 'H' + segs[i][1].toFixed(1);
        }
        A.set(earth, { d: de }); A.set(line, { d: dl });
        for (i = 0; i < c.obs.length; i++) {
          o = c.obs[i];
          if (o.type === 'h') A.set(boxes[n++], { x: o.x0, y: (GY - o.h * grow).toFixed(1), width: o.w, height: Math.max(0.1, o.h * grow).toFixed(1), opacity: grow > 0.02 ? 1 : 0 });
          else if (o.type === 'p') A.set(boxes[n++], { x: o.x0.toFixed(1), y: GY - o.h - 15, width: o.w.toFixed(1), height: 15, opacity: grow.toFixed(2) });
        }
        for (; n < boxes.length; n++) A.set(boxes[n], { opacity: 0 });
      },
      /** draw the walker: x, {lift, c}, speed fraction v (stride), opacity; returns the middle of the torso */
      walker: function (x, kk, v, op) {
        var tk = A.clamp(kk.lift / 18, 0, 1), ph = x / (2 * S), bob = (1 - tk) * v * 2.5 * Math.abs(Math.sin(2 * Math.PI * ph));
        var hx = x, hy = GY - HIP - kk.lift + 16 * kk.c + bob, lean = 0.13 * v + 0.8 * kk.c + 0.22 * tk;
        var tx = hx + TOR * Math.sin(lean), ty = hy - TOR * Math.cos(lean), d = '', j;
        var st = S * v * (1 - 0.3 * kk.c);
        for (j = 0; j < 2; j++) {
          var p = ((ph + j / 2) % 1 + 1) % 1, gx, gy;
          if (p < 0.5) { gx = hx + st / 2 - st * (p / 0.5); gy = GY; }
          else { var u = (p - 0.5) / 0.5; gx = hx - st / 2 + st * u; gy = GY - 13 * v * Math.sin(Math.PI * u); }
          var kn = leg(hx, hy, A.lerp(gx, hx + (j ? -11 : 13), tk), A.lerp(gy, hy + HIP - 22, tk));
          d += 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + kn[0].toFixed(1) + ' ' + kn[1].toFixed(1) + 'L' + kn[2].toFixed(1) + ' ' + kn[3].toFixed(1);
        }
        d += 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'L' + tx.toFixed(1) + ' ' + ty.toFixed(1);
        A.set(body, { d: d });
        A.set(head, { cx: (tx + (HR + 1) * Math.sin(lean)).toFixed(1), cy: (ty - (HR + 1) * Math.cos(lean)).toFixed(1) });
        A.show(wg, op);
        return [(hx + tx) / 2, (hy + ty) / 2];
      }
    };
  }

  // ------------------------------------------------------------------ nodes: the one big course (steps 0 to 3)
  var gW = A.el('g', {}, el), main = Scene(gW, 1), i;
  // height samples that move with the body
  var NS = 16, DX = 25, OFF0 = -75, gS = A.el('g', {}, gW), sd = [], sp = [];
  for (i = 0; i < NS; i++) {
    sd.push(A.el('circle', { r: 5, fill: C.blue, stroke: '#0c0c0c', 'stroke-width': 1.5 }, gS));
    sp.push(A.el('circle', { r: 4.5, fill: '#0c0c0c', stroke: C.blue, 'stroke-width': 2.5 }, gS));
  }
  // forward speed on the body
  var gV = A.el('g', {}, gW), vl = A.el('path', { fill: 'none', stroke: C.g, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gV);
  var vt = txt(gV, 0, 0, MI('v') + SUB, { fill: C.g, size: 22, anchor: 'middle' });
  // reward gauge
  var gG = A.el('g', {}, gW);
  txt(gG, 24, 34, 'reward ≈ ' + MI('v') + SUB, { fill: C.amber, size: 22 });
  A.el('rect', { x: 24, y: 48, width: 300, height: 16, rx: 8, fill: '#1c1c1c', stroke: '#3a3a3a', 'stroke-width': 1.5 }, gG);
  var gbar = A.el('rect', { x: 24, y: 48, height: 16, rx: 8, fill: C.amber }, gG);
  var gno = txt(gG, 340, 63, 'no progress, no reward', { fill: C.red, size: 21 });
  // the array the policy receives
  var gP = A.el('g', {}, gW), PX = 940, PB = 60, PW = 20, PS = 0.55, bars = [], pbar = [];
  txt(gP, PX - 22, 39, 'what the policy receives', { anchor: 'end', size: 21 });
  txt(gP, PX - 22, 66, 'terrain heights at sample points', { anchor: 'end', size: 20, weight: 500, fill: C.blue });
  A.el('line', { x1: PX - 6, y1: PB, x2: PX + NS * PW + 2, y2: PB, stroke: '#4a4a4a', 'stroke-width': 2 }, gP);
  for (i = 0; i < NS; i++) {
    bars.push(A.el('rect', { x: PX + i * PW + 3, width: PW - 6, rx: 2, fill: C.blue }, gP));
    pbar.push(A.el('rect', { x: PX + i * PW + 4, width: PW - 8, height: 7, y: PB - PLAT * PS, fill: 'none', stroke: C.blue, 'stroke-width': 2 }, gP));
  }
  A.el('path', { d: 'M' + (PX + (-OFF0 / DX) * PW + PW / 2 - 8) + ' ' + (PB + 27) + 'h16l-8 -11z', fill: '#fff' }, gP);
  txt(gP, PX + NS * PW + 14, 66, 'ahead', { size: 20, weight: 500, fill: C.mid });
  // labels under the obstacles
  var gL = A.el('g', {}, gW), ol = [];
  for (i = 0; i < 4; i++) {
    var t_ = A.el('text', { y: LY, style: 'font:500 20px ' + A.FONT + ';fill:' + C.mid }, gL);
    ol.push({ t: t_, a: A.el('tspan', {}, t_), b: A.el('tspan', { style: 'font-weight:700;fill:' + C.g }, t_), name: '' });
  }
  var NAME = { h: 'hurdle', g: 'gap', p: 'platform' }, VERB = { h: ' → jump', g: ' → leap', p: ' → crouch' }, HALF = { h: 29, g: 17, p: 40 };
  // curriculum: easy -> hard, and the furthest point reached so far
  var gC = A.el('g', {}, gW);
  txt(gC, 44, LY, 'easy', { size: 20, weight: 500, fill: C.mid });
  txt(gC, 1696, LY, 'hard', { size: 20, weight: 500, fill: C.mid, anchor: 'end' });
  A.el('path', { d: 'M104 ' + (LY - 7) + 'H1632m-12 -7l12 7l-12 7', fill: 'none', stroke: '#5a5a5a', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gC);
  var mk = A.el('path', { fill: C.g }, gC), mkt = txt(gC, 0, GY + 24, 'furthest so far', { size: 20, fill: C.g, anchor: 'end' });
  var tag = txt(gW, 1716, 32, '', { size: 21, weight: 500, fill: C.mid, anchor: 'end' }), tagName = '';
  var neu = txt(gW, 870, 38, 'new episode, new random course', { size: 21, weight: 500, fill: C.mid, anchor: 'middle' });

  // ------------------------------------------------------------------ nodes: three workers and the parameter server (step 4)
  var gD = A.el('g', {}, el), LS = 0.46, lanes = [], LX = 812, CX0 = 1280, pa = [], pg = [];
  var LAB = ['worker 1', 'worker 2', '… worker ' + MI('W')], LV = [455, 490, 470];
  for (i = 0; i < 3; i++) {
    var ya = 44 + 100 * i, yg = 72 + 100 * i;
    lanes.push(Scene(A.el('g', { transform: 'translate(0 ' + (100 * i - 34) + ') scale(' + LS + ')' }, gD), 1.5));
    txt(gD, 26, 30 + 100 * i, LAB[i], { size: 20, weight: 500, fill: C.mid });
    A.el('path', { d: 'M' + LX + ' ' + ya + 'H' + (CX0 - 10), fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '7 6' }, gD);
    A.el('path', { d: 'M' + (CX0 - 18) + ' ' + (ya - 8) + 'l13 8l-13 8', fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gD);
    A.el('path', { d: 'M' + (CX0 - 2) + ' ' + yg + 'H' + (LX + 6) + 'M' + (LX + 19) + ' ' + (yg - 8) + 'l-13 8l13 8', fill: 'none', stroke: C.g, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gD);
    pa.push(A.el('circle', { r: 7, fill: '#ffe08a', stroke: '#0c0c0c', 'stroke-width': 1.5, cy: ya }, gD));
    pg.push(A.el('circle', { r: 7, fill: '#d9ff7a', stroke: '#0c0c0c', 'stroke-width': 1.5, cy: yg }, gD));
  }
  txt(gD, (LX + CX0) / 2, 32, 'its gradient', { size: 20, fill: C.amber, anchor: 'middle' });
  txt(gD, (LX + CX0) / 2, 100, 'the updated policy', { size: 20, fill: C.g, anchor: 'middle' });
  A.el('rect', { x: CX0, y: 14, width: 436, height: 288, rx: 14, fill: '#141414', stroke: '#4a4a4a', 'stroke-width': 2.5 }, gD);
  txt(gD, CX0 + 218, 50, 'parameter server', { size: 20, weight: 500, fill: C.mid, anchor: 'middle' });
  var bA = A.el('rect', { x: CX0 + 38, y: 76, width: 360, height: 68, rx: 12, fill: '#1b1503', stroke: C.amber, 'stroke-width': 3 }, gD);
  txt(gD, CX0 + 218, 118, 'average the gradients', { size: 24, fill: '#ffd76a', anchor: 'middle' });
  A.el('path', { d: 'M' + (CX0 + 218) + ' 150V191m-8 -11l8 12l8 -12', fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gD);
  var bP = A.el('rect', { x: CX0 + 38, y: 198, width: 360, height: 68, rx: 12, fill: C.g, stroke: C.g, 'stroke-width': 3 }, gD);
  txt(gD, CX0 + 218, 240, 'one policy for all workers', { size: 24, fill: '#000', anchor: 'middle' });

  // ------------------------------------------------------------------ draw
  function drawMain(mode, tau) {
    var list = EP[mode], cur = pick(list, tau), e = cur.e, s = state(e, cur.t), c = e.c, j, o;
    var first = tau < list[0].dur;                                                    // the first run after the click
    var edge = Math.min(A.ramp(cur.t, 0, 0.3), A.ramp(e.dur - cur.t, 0, 0.3));        // a new course grows in, the old one sinks away
    var grow = mode === 3 ? A.ease(A.ramp(tau, 0, 0.7)) : (mode === 1 && first ? Math.min(A.ease(A.ramp(tau, 0, 0.7)), A.ramp(e.dur - cur.t, 0, 0.3)) : edge);
    main.course(c, mode === 0 ? 0 : grow);
    var tc = main.walker(s.x, s.k, s.v, s.op);
    // forward speed on the body, and the reward bar
    var len = 56 * s.vf, ax = tc[0] + 16, ay = tc[1] - 4;
    A.set(vl, { d: 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + 'h' + len.toFixed(1) + 'm-11 -8l11 8l-11 8' });
    A.set(vt, { x: (ax + Math.max(len, 24) / 2).toFixed(1), y: (ay - 19).toFixed(1) });
    A.show(gV, mode < 2 ? s.op * A.ramp(s.v, 0.15, 0.6) * (1 - A.ramp(s.k.c, 0.04, 0.3)) * (1 - A.ramp(ax + len + 6, 1712, 1736)) : 0);
    A.set(gbar, { width: Math.max(16, 300 * s.vf).toFixed(1) }); A.show(gbar, A.ramp(s.vf, 0.01, 0.06));
    A.show(gno, e.stall >= 0 ? A.ramp(cur.t, e.tr + 0.15, e.tr + 0.5) * A.ramp(e.dur - cur.t, 0, 0.3) : 0);
    // labels under the obstacles (steps 1 and 2)
    for (j = 0; j < 4; j++) {
      o = (mode === 1 || mode === 2) ? c.obs[j] : null;
      if (!o) { A.show(ol[j].t, 0); continue; }
      if (ol[j].name !== o.type) { ol[j].name = o.type; ol[j].a.textContent = NAME[o.type]; ol[j].b.textContent = VERB[o.type]; }
      A.set(ol[j].t, { x: (o.cx - HALF[o.type]).toFixed(1) });
      ol[j].b.setAttribute('fill-opacity', e.stall >= 0 ? 0 : A.ramp(s.x, o.x0 - 30, o.x0 + 10).toFixed(2));
      A.show(ol[j].t, grow);
    }
    // height samples (from step 2)
    var on = mode >= 2 ? (mode === 2 ? A.ramp(tau, 0.1, 0.7) : 1) : 0, x0 = s.x + OFF0;
    A.show(gS, on * s.op); A.show(gP, on);
    if (mode >= 2) {
      for (j = 0; j < NS; j++) {
        var x = x0 + j * DX, inb = x >= 24 && x <= 1716, sf = surf(c, x), up = GY - sf.y;
        A.set(sd[j], { cx: x.toFixed(1), cy: (GY - up * grow).toFixed(1), opacity: inb ? 1 : 0 });
        A.set(sp[j], { cx: x.toFixed(1), cy: sf.p || 0, opacity: inb && sf.p ? grow.toFixed(2) : 0 });
        var hgt = up >= 0 ? Math.max(4, up * PS * grow) : 14 * grow;
        A.set(bars[j], { y: (up >= 0 ? PB - hgt : PB).toFixed(1), height: Math.max(0.1, hgt).toFixed(1), opacity: inb ? 1 : 0.18 });
        A.set(pbar[j], { opacity: inb && sf.p ? grow.toFixed(2) : 0 });
      }
    }
    // curriculum: the furthest point reached so far (step 3)
    A.show(gC, mode === 3 ? A.ramp(tau, 0, 0.6) : 0);
    if (mode === 3) {
      var best = Math.min(X1, cur.i === 0 ? s.x : Math.max(s.x, list[cur.i - 1].xs));
      A.set(mk, { d: 'M' + (best - 9).toFixed(1) + ' ' + (GY + 23) + 'h18l-9 -15z' });
      A.set(mkt, { x: (best - 18).toFixed(1) });
      A.show(mk, A.ramp(best, 70, 110)); A.show(mkt, A.ramp(best, 230, 300));
    }
    if (tagName !== e.tag) { tagName = e.tag; tag.textContent = e.tag; }
    A.show(tag, e.tag ? edge : 0);
    A.show(neu, mode === 1 && !first ? A.ramp(cur.t, 0.05, 0.4) * (1 - A.ramp(cur.t, 1.9, 2.4)) : 0);
  }
  function drawLanes(tau) {
    var T = 7.2, n = Math.floor(tau / T), u = tau - n * T, j;
    for (j = 0; j < 3; j++) {
      var e = ep(course(40 + 7 * j + 3 * (n % 4)), LV[j], -1), s = state(e, Math.min(u, e.tr));
      lanes[j].course(e.c, 1);
      lanes[j].walker(s.x, s.k, 1, Math.min(1, u / 0.25) * (1 - A.ramp(u, e.tr - 0.1, e.tr + 0.15)));
      var a = A.ramp(u, 3.7, 4.7), b = A.ramp(u, 5.4, 6.4);
      A.set(pa[j], { cx: (LX + 8 + (CX0 - LX - 22) * A.ease(a)).toFixed(1), opacity: a > 0 && a < 1 ? 1 : 0 });
      A.set(pg[j], { cx: (CX0 - 12 - (CX0 - LX - 24) * A.ease(b)).toFixed(1), opacity: b > 0 && b < 1 ? 1 : 0 });
    }
    var hot = A.ramp(u, 4.6, 4.8) * (1 - A.ramp(u, 5.2, 5.5)), hot2 = A.ramp(u, 5.1, 5.3) * (1 - A.ramp(u, 6.3, 6.6));
    A.set(bA, { 'stroke-width': (3 + 4 * hot).toFixed(1), fill: hot > 0.5 ? '#3a2c05' : '#1b1503' });
    A.set(bP, { 'stroke-width': (3 + 5 * hot2).toFixed(1), stroke: hot2 > 0.5 ? '#d9ff7a' : C.g });
  }
  return function draw(f) {
    var mode = Math.min(f.step, 4), tau = f.ts;
    gW.style.display = mode < 4 ? '' : 'none'; gD.style.display = mode === 4 ? '' : 'none';
    A.show(gD, mode === 4 ? A.ramp(tau, 0, 0.5) : 0);
    if (mode < 4) drawMain(mode, tau); else drawLanes(tau);
  };
});
