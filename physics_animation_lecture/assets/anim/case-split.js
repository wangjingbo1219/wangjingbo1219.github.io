/* Slide "C·ASE — how", before the first click and at click 1.   <svg data-anim="case-split" viewBox="0 0 1196 291">
 * SCHEMATIC (stick figures from case-0kit.js, no data). Green = the motion clips, violet = the skill label c, amber = the policy's motion.
 *   step 0   every clip carries a skill label; the label that is asked for is an input of the policy, which performs that skill
 *   step 1+  the discriminator D sits between the two and gets the label as well: it compares the policy's motion with the
 *            clips of skill c only. Asked for a kick, a character that stands idle is scored "fake"; one that kicks is scored "real".
 * The score gauge has no scale: D's output is a probability between "fake" and "real" (paper, focal skill sampling: b_c in (0, 1)).
 */
DeckAnim.register('case-split', function (el, A) {
  'use strict';
  var K = window.CaseKit, C = A.C, VIO = C.violet, AMB = C.amber, GRN = C.g, MID = C.mid;
  var BW = 112, BG = 10, BY = 46, BH = 210, CX = 715, DY = 140, FX = 840, FW = 356, FCX = FX + FW / 2, LANE = 22, BLEND = 0.45;
  function T(p, x, y, s, o) {
    o = o || {};
    var n = A.text(p, x, y, '', { size: o.size || 20, fill: o.fill || '#fff', anchor: o.anchor || 'middle', weight: o.weight || 700, halo: !!o.halo });
    n.innerHTML = s;
    return n;
  }
  // ---- the clips, one group per skill label
  var bins = K.ORDER.map(function (key, i) {
    var x = i * (BW + BG), g = A.el('g', {}, el), ln = K.SK[key].lines;
    var r = A.el('rect', { x: x + 1.5, y: BY + 1.5, width: BW - 3, height: BH - 3, rx: 12, fill: '#0e0e0e', stroke: '#2a2a2a', 'stroke-width': 2 }, g);
    var lab = ln.map(function (s, j) { return T(g, x + BW / 2, BY + (ln.length === 1 ? 38 : 27 + 23 * j), s); });
    return { key: key, cx: x + BW / 2, x: x, g: g, r: r, lab: lab, f: K.fig(A, g, GRN) };
  });
  var cxOf = {}; bins.forEach(function (b) { cxOf[b.key] = b.cx; });
  var OFF = [0, 0.3, 0.9, 1.7, 2.6];                         // seconds: the groups do not move in step
  T(el, 300, 282, 'motion clips, grouped by skill label', { fill: MID, weight: 500 });
  // ---- the label that is asked for
  var link = A.el('path', { fill: 'none', stroke: VIO, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var linkDot = A.el('circle', { r: 6, fill: VIO }, el);
  K.arrow(A, el, VIO).set([[CX + 95, LANE], [FCX, LANE], [FCX, BY - 3]]);
  A.el('rect', { x: CX - 95, y: 4, width: 190, height: 36, rx: 18, fill: '#1d1526', stroke: VIO, 'stroke-width': 2.5 }, el);
  var pill = T(el, CX, 29, '');
  // ---- what the policy does under that label
  A.el('rect', { x: FX + 1.5, y: BY + 1.5, width: FW - 3, height: BH - 3, rx: 14, fill: '#0c0c0c', stroke: '#2a2a2a', 'stroke-width': 2 }, el);
  A.el('line', { x1: FX + 24, y1: 238, x2: FX + FW - 24, y2: 238, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  T(el, FX + 20, BY + 34, 'the policy’s motion', { anchor: 'start', fill: AMB, weight: 500 });
  var me = K.fig(A, el, AMB), cap = T(el, FCX, 282, '', { weight: 500, fill: MID });
  // ---- the discriminator (from click 1)
  var gD = A.el('g', {}, el);
  K.arrow(A, gD, VIO).set([[CX, 41], [CX, DY - 37]]);
  var aReal = [[604, DY], [CX - 37, DY]], aPol = [[FX - 4, DY], [CX + 37, DY]];
  K.arrow(A, gD, GRN).set(aReal); K.arrow(A, gD, AMB).set(aPol);
  T(gD, 640, DY - 12, 'real', { fill: GRN }); T(gD, 795, DY - 12, 'policy', { fill: AMB });
  var dReal = K.dots(A, gD, 2, GRN, 4.5), dPol = K.dots(A, gD, 2, AMB, 4.5), tReal = K.track(aReal), tPol = K.track(aPol);
  A.el('circle', { cx: CX, cy: DY, r: 34, fill: '#0f1a06', stroke: GRN, 'stroke-width': 3 }, gD);
  T(gD, CX, DY + 9, K.mi('D'), { size: 25 });
  T(gD, CX, 202, K.mi('D') + '’s score', { fill: MID, weight: 500 });
  A.el('line', { x1: CX - 65, y1: 218, x2: CX + 65, y2: 218, stroke: '#4a4a4a', 'stroke-width': 6, 'stroke-linecap': 'round' }, gD);
  var mark = A.el('circle', { cy: 218, r: 9, stroke: '#0b0b0b', 'stroke-width': 2 }, gD);
  T(gD, CX - 73, 250, 'fake', { anchor: 'start', fill: C.red, weight: 500 }); T(gD, CX + 73, 250, 'real', { anchor: 'end', fill: GRN, weight: 500 });

  // which label is asked for, and what the policy does: c = label, a = the skill it performs, d = seconds, s = where D's score settles
  var S0 = ['walk', 'kick', 'bash', 'swing', 'idle'].map(function (k) { return { c: k, a: k, d: 2.9, s: 0.5 }; });
  var S1 = [{ c: 'kick', a: 'idle', d: 4.4, s: 0.1 }, { c: 'kick', a: 'kick', d: 4.4, s: 0.86 }, { c: 'swing', a: 'swing', d: 3.4, s: 0.82 }, { c: 'walk', a: 'walk', d: 3.4, s: 0.88 }];
  var VERB = { idle: 'stands idle', walk: 'walks', kick: 'kicks', bash: 'bashes', swing: 'swings' };
  function at(t, S) {
    var per = 0, i, acc = 0;
    for (i = 0; i < S.length; i++) per += S[i].d;
    var u = ((t % per) + per) % per;
    for (i = 0; i < S.length - 1; i++) { if (u < acc + S[i].d) break; acc += S[i].d; }
    return { cur: S[i], prev: S[(i + S.length - 1) % S.length], tau: u - acc, first: t < S[0].d };
  }
  var col = function (s, c) { return '<tspan style="fill:' + c + ';font-weight:700">' + s + '</tspan>'; };

  return function draw(f) {
    var judged = f.step >= 1, t = f.step === 1 ? f.ts : f.t, s = at(t, judged ? S1 : S0);
    var e = s.first ? 1 : K.ease(s.tau / BLEND), pc = s.first ? s.cur.c : s.prev.c;
    // the clips: every group loops its own skill; the group with the asked label is lit
    bins.forEach(function (b, i) {
      var w = (b.key === s.cur.c ? e : 0) + (b.key === pc ? 1 - e : 0);
      w = Math.min(1, w);
      K.put(A, b.f, b.x + 40, BY + BH - 14, 96, K.pose(b.key, f.t + OFF[i], 0.8));
      A.show(b.g, A.lerp(judged ? 0.5 : 0.62, 1, w));
      A.set(b.r, { stroke: w > 0.5 ? VIO : '#2a2a2a', 'stroke-width': w > 0.5 ? 3 : 2 });
      b.lab.forEach(function (n) { n.style.fill = w > 0.5 ? VIO : '#fff'; });
    });
    var xa = A.lerp(cxOf[pc], cxOf[s.cur.c], e);
    A.set(link, { d: 'M' + (CX - 95) + ' ' + LANE + 'H' + xa.toFixed(1) + 'V' + (BY - 2) });
    A.set(linkDot, { cx: xa.toFixed(1), cy: BY - 2 });
    K.html(pill, K.mi('c') + ' = ' + K.name(s.cur.c));
    // the policy
    var P = K.mix(s.first ? K.REST : K.pose(s.prev.a, s.prev.d), K.pose(s.cur.a, s.tau), K.ease(s.tau / BLEND));
    K.put(A, me, FX + 212, 238, 124, P);
    K.html(cap, 'asked for ' + col('“' + K.name(s.cur.c) + '”', VIO) + (judged ? ' · it ' + col(VERB[s.cur.a], AMB) : ''));
    // the discriminator
    // (its nodes are set at every call, also while the group is hidden: the picture depends on (t, step, ts) only)
    A.show(gD, judged ? (f.step === 1 ? A.ramp(f.ts, 0, 0.5) : 1) : 0);
    var sc = A.lerp(s.first ? 0.5 : s.prev.s, s.cur.s, K.ease((s.tau - 0.8) / 0.9));
    A.set(mark, { cx: (CX - 65 + 130 * sc).toFixed(1), fill: sc < 0.42 ? C.red : (sc > 0.58 ? GRN : '#e8e8e8') });
    K.run(A, dReal, tReal, t, 46); K.run(A, dPol, tPol, t, 46);
  };
});
