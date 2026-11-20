/* Slide "InterMimic — how" (tools/slides/06b_40_intermimic.py):  <svg data-anim="intermimic-mix" viewBox="0 0 560 256">, revealed at click 4.
 * SCHEMATIC of the student's update (Xu et al. 2025, Alg. 1 lines 15-18, Sec. 3.3):  grad( w L_PPO + (1 - w) ||a_S - a_T|| ),  w = min(t / beta, 1).
 *   right   the bar is that mix: green = PPO on the reward (share w), amber = copy the teacher's action (share 1 - w); w grows linearly with training
 *           (the paper does not give beta, so the axis has no numbers); at the end of the loop the moving parts fade out and start again
 *           from w = 0 (they are not wound back, which would read as w falling)
 *   left    the reason the authors give for the RL part (Sec. 3.3, 4.3): two teachers may answer a similar motion with different actions
 *           (dashed arrows); copying both puts the student's action (green arrow) between them; with RL it moves to an action that earns
 *           reward (drawn as a direction of its own, not as one teacher's). Directions and angles are made up; the figure prints no values.
 */
DeckAnim.register('intermimic-mix', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, AM = C.amber, T = 9, OX = 62, OY = 120, LEN = 124, TH = 30 * Math.PI / 180, BX = 306, BWD = 236, BY = 84, BHH = 32, AY = 172;
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-weight:400;font-size:1.16em">' + s + '</tspan>'; };
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') }, p);
    n.innerHTML = s;
    return n;
  }
  function head(x, y, a, s) {
    var c = Math.cos(a), n = Math.sin(a), bx = x - s * c, by = y - s * n;
    return 'M' + (bx - 0.6 * s * n).toFixed(1) + ' ' + (by + 0.6 * s * c).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) + 'L' + (bx + 0.6 * s * n).toFixed(1) + ' ' + (by - 0.6 * s * c).toFixed(1);
  }
  function arrow(col, w, dash) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    return { l: A.el('path', dash ? { 'stroke-dasharray': dash } : {}, g), h: A.el('path', {}, g) };
  }
  function aim(ar, ang, len) {
    var x = OX + len * Math.cos(ang), y = OY + len * Math.sin(ang);
    A.set(ar.l, { d: 'M' + (OX + 20 * Math.cos(ang)).toFixed(1) + ' ' + (OY + 20 * Math.sin(ang)).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) });
    A.set(ar.h, { d: head(x, y, ang, 12) });
  }
  A.el('path', { d: 'M294 14V206', stroke: '#262626', 'stroke-width': 2, 'stroke-linecap': 'round' }, el);      // the two halves: the reason (left), the schedule (right)
  // left: one state, two teachers, the student
  txt(el, 14, 28, 'similar motion, two teachers', { fill: C.mid });
  var ta = arrow('#b4b4b4', 3, '7 6'), tb = arrow('#b4b4b4', 3, '7 6'), su = arrow(G, 6), suG = su.l.parentNode;
  aim(ta, -TH, LEN); aim(tb, TH, LEN);
  txt(el, OX + LEN * Math.cos(TH) + 10, OY - LEN * Math.sin(TH) + 2, 'teacher A', { fill: '#cfcfcf' });
  txt(el, OX + LEN * Math.cos(TH) + 10, OY + LEN * Math.sin(TH) + 12, 'teacher B', { fill: '#cfcfcf' });
  A.el('circle', { cx: OX, cy: OY, r: 17, fill: '#161616', stroke: '#e8e8e8', 'stroke-width': 3 }, el);
  txt(el, OX, OY + 7, MI('s'), { anchor: 'middle', size: 21 });
  var SP = function (c, s) { return '<tspan style="fill:' + c + '">' + s + '</tspan>'; };
  var capA = txt(el, 14, 238, SP(AM, 'copying:') + ' ' + SP(G, 'the student') + ' lands between them', { fill: '#e6e6e6', weight: 700 });
  var capB = txt(el, 14, 238, SP(G, 'RL: the student') + ' moves to what earns reward', { fill: '#e6e6e6', weight: 700 });
  // right: the mix
  txt(el, BX, 28, 'the student’s update', { fill: C.mid });
  txt(el, BX, BY - 12, 'RL', { fill: G, weight: 700 });
  txt(el, BX + BWD, BY - 12, 'copy', { fill: AM, weight: 700, anchor: 'end' });
  A.el('rect', { x: BX, y: BY, width: BWD, height: BHH, rx: 8, fill: '#151515', stroke: '#2c2c2c', 'stroke-width': 1 }, el);
  var dyn = A.el('g', {}, el);                                                                        // the moving parts of the right half
  A.el('rect', { x: BX, y: BY, width: BWD, height: BHH, rx: 8, fill: G }, dyn);                      // green = RL (share w, growing from the left), uncovered as the amber part shrinks
  var bc = A.el('rect', { y: BY, height: BHH, rx: 8, fill: AM }, dyn);
  var mark = A.el('path', { fill: '#fff' }, dyn), wl = txt(dyn, 0, BY + BHH + 35, MI('w'), { anchor: 'middle', size: 21 });
  A.el('path', { d: 'M' + BX + ' ' + AY + 'H' + (BX + BWD - 2), stroke: '#8d8d8d', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, el);
  A.el('path', { d: head(BX + BWD, AY, 0, 10), fill: 'none', stroke: '#8d8d8d', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var U0 = 0.6, U1 = 8.2, UB = 5.2, XB = BX + (UB - U0) / (U1 - U0) * (BWD - 16);          // the moment t = beta on the time axis
  A.el('path', { d: 'M' + XB.toFixed(1) + ' ' + (AY - 7) + 'v14', stroke: '#8d8d8d', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, el);
  txt(el, XB, AY + 27, MI('t') + ' = ' + MI('β'), { anchor: 'middle', fill: C.mid });
  var dot = A.el('circle', { cy: AY, r: 6, fill: '#fff' }, el);                                       // on top of the axis
  txt(el, BX, AY + 27, 'training', { fill: C.mid });

  return function draw(f) {
    var t = f.step >= 4 ? f.ts : 0, u = A.loop(t, T);
    var w = A.ramp(u, U0, UB);                                              // w = min(t / beta, 1)
    var vis = A.ramp(u, 0, 0.35) * (1 - A.ramp(u, 8.45, 8.9));              // the loop: fade out at full RL, fade in again at w = 0
    var e = A.ease(w), xs = BX + w * BWD;
    aim(su, -TH * 0.55 * e, LEN);
    A.set(bc, { x: xs.toFixed(1), width: Math.max(0, (1 - w) * BWD).toFixed(1) }); A.show(bc, w < 0.995 ? 1 : 0);
    A.set(mark, { d: 'M' + xs.toFixed(1) + ' ' + (BY + BHH + 3) + 'l8 12h-16z' });
    A.set(wl, { x: xs.toFixed(1) });
    A.set(dot, { cx: (BX + A.ramp(u, U0, U1) * (BWD - 16)).toFixed(1) });
    A.show(dyn, vis); A.show(suG, vis); A.show(dot, vis);
    A.show(capA, vis * (1 - A.ramp(w, 0.47, 0.5))); A.show(capB, vis * A.ramp(w, 0.5, 0.53));
  };
});
