/* Slide "MaskedMimic — how": what the tracker is told, what the mask leaves, what the student does with it.
 *   <svg data-anim="maskedmimic-mask" viewBox="0 0 1150 351">
 * SCHEMATIC, no measured numbers. Left: a stick figure (white = the simulated character, green = the targets). Right: the goal board of
 * maskedmimic-0kit.js (rows = body parts, columns = future frames sliding toward "now", green = given, dark = hidden).
 *   step 0  the tracker's full goal: every joint, every frame                                   (Sec. 4, 5.1)
 *   step 1  the random mask closes: a pattern persists, then changes; gaps hide every joint; text / object / one later pose
 *           are given in some episodes only                                                     (Sec. 6.3 "Masking", App. B.2)
 *   step 2  the student: all it is told is what is left (here: the head) and it still moves the whole body   (Sec. 6.1)
 *   step 3  its target is the frozen tracker's action = PD targets (amber, dashed)              (Sec. 6.2, Eq. 8, DAgger)
 *   step 4  one partial goal, many motions: three samples of z, three bodies with the same head target       (Sec. 6.2)
 * The mask patterns of step 1 are two hand-picked "episodes" that show every rule of App. B.2 once; they are not samples of its probabilities.
 */
DeckAnim.register('maskedmimic-mask', function (el, A) {
  'use strict';
  var C = A.C, K = window.MMK, AMBER = C.amber, TAU = 2 * Math.PI, GY = 312, CX = 150;
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.15em">' + s + '</tspan>'; };
  function tx(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') }, p);
    n.innerHTML = s;
    return n;
  }

  // ------------------------------------------------------------------ the stick figure (profile, walking in place, facing the future)
  var TH = 62, SH = 60, TO = 84, UA = 44, FA = 42, HR = 16, LEAN = 0.07;
  function pose(ph, arms) {                                    // joint positions relative to the hip, y down
    var J = { hip: [0, 0] }, k, low = -1e9;
    J.neck = [TO * Math.sin(LEAN), -TO * Math.cos(LEAN)];
    J.head = [J.neck[0] + 4, J.neck[1] - HR - 5];
    J.sh = [J.neck[0] - 1, J.neck[1] + 9];
    for (k = 0; k < 2; k++) {
      var p = ph + k * Math.PI, th = 0.46 * Math.sin(p), kn = 0.12 + 0.75 * Math.max(0, Math.cos(p)), a = th - kn;
      var kx = TH * Math.sin(th), ky = TH * Math.cos(th), ax = kx + SH * Math.sin(a), ay = ky + SH * Math.cos(a);
      J['kn' + k] = [kx, ky]; J['an' + k] = [ax, ay]; J['to' + k] = [ax + 17 * Math.cos(a), ay - 17 * Math.sin(a)];
      low = Math.max(low, ay);
      var ua, fa;
      if (arms === 1) { ua = 2.5 + 0.1 * Math.sin(p); fa = ua + 0.35; }              // both arms raised
      else if (arms === 2) { ua = 0.3 + 0.05 * Math.sin(p); fa = ua + 1.9; }         // arms folded in front
      else { ua = -0.5 * Math.sin(p); fa = ua + 0.5; }                                // arms swinging
      var ex = J.sh[0] + UA * Math.sin(ua), ey = J.sh[1] + UA * Math.cos(ua);
      J['el' + k] = [ex, ey]; J['ha' + k] = [ex + FA * Math.sin(fa), ey + FA * Math.cos(fa)];
    }
    J.low = low;
    return J;
  }
  var FAR = [['sh', 'el0', 'ha0'], ['hip', 'kn0', 'an0', 'to0']], NEAR = [['hip', 'neck'], ['sh', 'el1', 'ha1'], ['hip', 'kn1', 'an1', 'to1']];
  function P(J, ox, oy, segs) {
    var d = '', i, j;
    for (i = 0; i < segs.length; i++) for (j = 0; j < segs[i].length; j++) d += (j ? 'L' : 'M') + (J[segs[i][j]][0] + ox).toFixed(1) + ' ' + (J[segs[i][j]][1] + oy).toFixed(1);
    return d;
  }
  function fig(col, far, sw, o) {
    o = o || {};
    var g = A.el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': sw }, el);
    if (o.dash) g.setAttribute('stroke-dasharray', o.dash);
    return { g: g, far: A.el('path', { stroke: far }, g), near: A.el('path', { stroke: col }, g),
             head: A.el('circle', { r: HR - (o.dash ? 2 : 0), fill: o.dash ? 'none' : col, stroke: o.dash ? col : 'none' }, g) };
  }
  function put(F, J, ox, oy) { A.set(F.far, { d: P(J, ox, oy, FAR) }); A.set(F.near, { d: P(J, ox, oy, NEAR) }); A.set(F.head, { cx: (J.head[0] + ox).toFixed(1), cy: (J.head[1] + oy).toFixed(1) }); }

  A.el('line', { x1: 0, y1: GY + 2, x2: 430, y2: GY + 2, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var ref = fig(C.g, C.g, 17); ref.g.setAttribute('stroke-opacity', 0.5); ref.head.setAttribute('fill-opacity', 0.5); ref.head.setAttribute('r', HR + 4);
  var hid = fig('#7a7a7a', '#5a5a5a', 3, { dash: '3 8' });                 // the part of the reference that the mask hides
  var act = fig(AMBER, AMBER, 4, { dash: '2 9' });                         // the tracker's action: a set of PD targets
  var v2 = fig('#fff', '#9b9b9b', 9), v1 = fig('#fff', '#9b9b9b', 9), me = fig('#fff', '#9b9b9b', 9);
  var KEY = ['head', 'ha0', 'ha1', 'hip', 'an0', 'an1'], OTH = ['neck', 'el0', 'el1', 'kn0', 'kn1'], kd = [], od = [], i;
  for (i = 0; i < OTH.length; i++) od.push(A.el('circle', { r: 5.5, fill: C.gbr, stroke: '#0c0c0c', 'stroke-width': 1.5 }, el));
  for (i = 0; i < KEY.length; i++) kd.push([A.el('circle', { r: 8, fill: '#0c0c0c', stroke: '#8a8a8a', 'stroke-width': 2.5, 'stroke-dasharray': '4 4' }, el),
                                             A.el('circle', { r: 9.5, fill: C.gbr, stroke: '#0c0c0c', 'stroke-width': 2.5 }, el)]);
  // who / what the stick figure stands for: the tracker (step 0), the same goal with the mask on it (step 1: nobody acts on it yet), the student (from step 2)
  var roleA = tx(el, 0, 22, 'the tracker', { weight: 700, size: 22 }), roleM = tx(el, 0, 22, 'the same goal, masked', { weight: 700, size: 22 }),
      roleB = tx(el, 0, 22, 'the student', { weight: 700, size: 22 });

  // legends, one per step, under the ground line
  var LG = [], lg, LY = 345;
  lg = A.el('g', {}, el); A.el('circle', { cx: 9, cy: LY - 7, r: 8, fill: C.gbr }, lg); tx(lg, 26, LY, 'a target for every joint, in every frame', { fill: C.mid }); LG.push(lg);
  lg = A.el('g', {}, el); A.el('circle', { cx: 9, cy: LY - 7, r: 8, fill: C.gbr }, lg); tx(lg, 26, LY, 'given', { fill: C.mid });
  A.el('circle', { cx: 109, cy: LY - 7, r: 7, fill: 'none', stroke: '#8a8a8a', 'stroke-width': 2.5, 'stroke-dasharray': '4 4' }, lg); tx(lg, 126, LY, 'hidden', { fill: C.mid }); LG.push(lg);
  lg = A.el('g', {}, el); A.el('circle', { cx: 9, cy: LY - 7, r: 8, fill: C.gbr }, lg); tx(lg, 26, LY, 'the only target the student sees', { fill: C.mid }); LG.push(lg);
  lg = A.el('g', {}, el); A.el('line', { x1: 0, y1: LY - 7, x2: 34, y2: LY - 7, stroke: AMBER, 'stroke-width': 4, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' }, lg);
  tx(lg, 46, LY, 'the tracker’s action: PD targets to copy', { fill: AMBER }); LG.push(lg);
  lg = A.el('g', {}, el); tx(lg, 0, LY, 'one head target, three samples of ' + MI('z'), { fill: C.mid }); LG.push(lg);

  // the prior and one sample (step 4)
  var bell = A.el('g', {}, el), BX = 356, BY = 170, SG = 30, BH = 54, pts = [], u;
  for (u = -66; u <= 66; u += 4) pts.push([BX + u, BY - BH * Math.exp(-u * u / (2 * SG * SG))]);
  A.el('line', { x1: BX - 72, y1: BY, x2: BX + 72, y2: BY, stroke: '#4a4a4a', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, bell);
  A.el('path', { d: A.path(pts), fill: 'none', stroke: '#d9d9d9', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, bell);
  tx(bell, BX, BY - BH - 16, 'prior over ' + MI('z'), { anchor: 'middle', fill: C.mid });
  var zl = A.el('line', { stroke: C.gbr, 'stroke-width': 3, 'stroke-linecap': 'round' }, bell), zd = A.el('circle', { r: 8, fill: C.gbr, stroke: '#0c0c0c', 'stroke-width': 2 }, bell);
  tx(bell, BX, BY + 30, 'one sample', { anchor: 'middle', fill: C.gbr, weight: 700 });
  var ZU = [-28, 6, 36];

  // ------------------------------------------------------------------ the goal board
  var B = K.board(el, A, { x: 606, y: 64, cw: 48, ch: 31, gap: 7, n: 10, lx: 462, gx: 14, rows: K.PARTS.concat(['other joints']), bars: ['text', 'object'], size: 20, barh: 24, bary: 285 });
  var ttlA = tx(el, 462, 22, 'Full goal: what the tracker is told', { weight: 700, size: 22 }), ttlB = tx(el, 462, 22, 'Partial goal: what the mask leaves visible', { weight: 700, size: 22 });
  tx(el, 606, 52, 'next frames', { fill: C.mute });
  A.el('path', { d: 'M731 45H773M765 38L773 45L765 52', fill: 'none', stroke: C.mute, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var lateT = tx(el, B.xl + B.W / 2, 52, 'later', { fill: C.mute, anchor: 'middle' });

  // two schematic episodes for step 1: [length in frames, visible rows or null = a gap]; text / object / one later pose are per episode
  var EP = [
    { runs: [[12, [0, 1, 2]], [4, null], [18, [3, 5]]], text: 0, object: 1, late: [] },          // gaps are 4 x (1..9) frames when text, object or a later pose is given
    { runs: [[9, [2]], [8, null], [17, [0, 3, 4]]], text: 1, object: 0, late: [3] }
  ];
  EP.forEach(function (ep) {
    ep.col = []; ep.gaps = [];
    ep.runs.forEach(function (r) {
      if (!r[1]) ep.gaps.push([ep.col.length, r[0], r[0] > 5 ? 'gap: no joint target' : 'gap']);
      for (var k = 0; k < r[0]; k++) ep.col.push(r[1]);
    });
  });
  var PER = 7.2, HOLD = 1.5, RUN = 24;

  return function draw(f) {
    var st = f.step, ts = f.ts, e = A.ease(A.ramp(ts, 0, 0.6)), j, k;
    var ph = TAU * f.t / 1.25, Jr = pose(ph + 0.28, 0), Jc = pose(ph, 0);
    var rx = CX + 6, ry = GY - 5 - Jr.low, cx = CX, cy = GY - 5 - Jc.low;

    // ---- board
    var S = { scroll: f.t * 4, gaps: [], lateShow: st === 0 ? 0 : 1 }, given;
    if (st === 0) {
      S.lit = function () { return 1; };
      S.bars = [{ v: 0, show: 0 }, { v: 0, show: 0 }];
      given = function () { return 1; };
    } else if (st === 1) {
      var ek = Math.floor(ts / PER), v = ts - ek * PER, ep = EP[ek % 2], out = 1 - A.ramp(v, PER - 0.3, PER), al = (ek ? A.ramp(v, 0, 0.3) : 1) * out, show = A.ramp(ts, 0.2, 0.8);
      S.scroll = RUN * A.ramp(v, HOLD, PER - 0.5);
      S.lit = function (n, r, jj) {
        var c = ep.col[Math.min(n, ep.col.length - 1)], tgt = (c && c.indexOf(r) >= 0) ? 1 : 0;
        if (ek) return tgt * al;
        return (1 + (tgt - 1) * A.ramp(ts, 0.35 + 0.06 * jj, 0.85 + 0.06 * jj)) * out;       // the very first episode: the mask closes from left to right
      };
      S.late = function (r) { return ep.late.indexOf(r) >= 0 ? al * (ek ? 1 : A.ramp(ts, 0.9, 1.4)) : 0; };
      S.lateShow = show;
      S.bars = [{ v: ep.text * al * (ek ? 1 : A.ramp(ts, 0.9, 1.4)), show: show, label: 'given', off: 'hidden' }, { v: ep.object * al * (ek ? 1 : A.ramp(ts, 0.9, 1.4)), show: show, label: 'given', off: 'hidden' }];
      S.gaps = ep.gaps.map(function (gp) { return [gp[0], gp[1], gp[2], al * (ek ? 1 : A.ramp(ts, 1.0, 1.4))]; });
      given = function (r) { return S.lit(Math.floor(S.scroll), r, 0); };
    } else {
      S.lit = function (n, r) { return r === 0 ? 1 : 0; };
      S.late = function () { return 0; };
      S.bars = [{ v: 0, show: 1, off: 'hidden' }, { v: 0, show: 1, off: 'hidden' }];
      given = function (r) { return r === 0 ? 1 : 0; };
    }
    S.rowOn = function (r) { return r < 6 ? given(r) : (st === 0 ? 1 : 0); };
    B.draw(S);
    A.show(ttlA, st === 0 ? 1 : 0); A.show(ttlB, st === 0 ? 0 : 1); A.show(lateT, S.lateShow);

    // ---- stick figures
    var close = st === 0 ? 0 : (st === 1 ? A.ramp(ts, 0.35, 1.2) : 1);                    // how far the mask has closed
    put(ref, Jr, rx, ry); A.show(ref.g, 1 - close);
    put(hid, Jr, rx, ry); A.show(hid.g, st === 1 ? close : (st === 2 ? 1 - e : 0));
    put(act, Jr, rx, ry); A.show(act.g, st === 3 ? e : 0);
    for (k = 0; k < OTH.length; k++) { A.set(od[k], { cx: (Jr[OTH[k]][0] + rx).toFixed(1), cy: (Jr[OTH[k]][1] + ry).toFixed(1) }); A.show(od[k], 1 - close); }
    var ring = st === 1 ? close : (st === 2 ? 1 - e : 0);
    for (k = 0; k < KEY.length; k++) {
      var gx = (Jr[KEY[k]][0] + rx).toFixed(1), gy = (Jr[KEY[k]][1] + ry).toFixed(1), gv = given(k);
      A.set(kd[k][0], { cx: gx, cy: gy }); A.set(kd[k][1], { cx: gx, cy: gy });
      A.show(kd[k][0], ring * (1 - gv)); A.show(kd[k][1], gv);
    }
    // step 4: three completions of the same head target; the sampled one is drawn solid
    var fan = st >= 4 ? e : 0, sel = Math.floor(ts / 1.7) % 3, hx = Jr.head[0] + rx, hy = Jr.head[1] + ry;
    var J1 = pose(ph + 2.1, 1), J2 = pose(ph + 4.2, 2);
    var w = [0, 0, 0], mix = A.ease(A.ramp(ts - Math.floor(ts / 1.7) * 1.7, 0, 0.35));
    w[sel] = mix; w[(sel + 2) % 3] = 1 - mix;
    var mx = cx + (hx - Jc.head[0] - cx) * fan, my = cy + (hy - Jc.head[1] - cy) * fan;
    put(me, Jc, mx, my); A.show(me.g, 1 - fan * (1 - (0.34 + 0.66 * w[0])));
    put(v1, J1, hx - J1.head[0], hy - J1.head[1]); A.show(v1.g, fan * (0.34 + 0.66 * w[1]));
    put(v2, J2, hx - J2.head[0], hy - J2.head[1]); A.show(v2.g, fan * (0.34 + 0.66 * w[2]));
    A.show(bell, fan);
    var zu = ZU[(sel + 2) % 3] + (ZU[sel] - ZU[(sel + 2) % 3]) * mix, zy = BY - BH * Math.exp(-zu * zu / (2 * SG * SG));
    A.set(zl, { x1: BX + zu, y1: BY, x2: BX + zu, y2: zy }); A.set(zd, { cx: BX + zu, cy: zy });

    A.show(roleA, st === 0 ? 1 : 0); A.show(roleM, st === 1 ? 1 : 0); A.show(roleB, st < 2 ? 0 : 1);
    for (j = 0; j < LG.length; j++) A.show(LG[j], j === Math.min(st, 4) ? 1 : 0);
  };
});
