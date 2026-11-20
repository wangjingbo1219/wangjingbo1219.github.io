/* SMPLOlympics - how: the hurdling track, to scale, and how far each baseline gets on it.   <svg data-anim="smplolympics-track" viewBox="0 0 1034 108">
 * A bar chart of the paper's numbers, not a simulation.
 *   Table 1 (hurdling): average distance and success rate of PPO (108.9, 57.6 %), AMP (13.24, 0 %) and PULSE (122.1, 100 %).
 *   Sec. 4.1: the finish line is 110 m ahead; 10 hurdles, the first 13.72 m from the start, then one every 9.14 m.
 * Lane k arrives at build step k (0 PPO, 1 AMP, 2 PULSE): its bar grows once and holds. Lanes explained earlier dim until the slide is fully built.
 * The hurdles are notches across the lanes (and ticks above them), the finish line is the bright line.
 * Four columns, like a table: name | the track with the bar | avg. distance | success rate. The numbers sit in columns of their own
 * (right-aligned under their headers), so no label covers the track, its notches or the finish line.
 * Colour: grey bars and ONE green bar (the baseline the slide ends on). Every lane carries its name, so identity never rests on colour
 * (the deck's amber and green are too close for red-green colour blindness to tell two series apart).
 * draw() is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('smplolympics-track', function (el, A) {
  'use strict';
  var C = A.C, X0 = 96, PX = 5.2, TOP = 27, PITCH = 27, BH = 16, GREY = '#7d7d7d';
  var XV = 884, XS = 1034;                       // right edges of the two number columns
  var LANES = [
    { n: 'PPO', d: 108.9, v: '108.9 m', s: '57.6 %', col: GREY },
    { n: 'AMP', d: 13.24, v: '13.24 m', s: '0 %', col: GREY },
    { n: 'PULSE', d: 122.1, v: '122.1 m', s: '100 %', col: C.g }
  ];
  var FIN = X0 + 110 * PX, END = X0 + 125 * PX, i;
  function txt(p, x, y, s, o) {
    o = o || {};
    return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', text: s,
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || C.mid) }, p);
  }
  /** a bar that starts square on the baseline and ends in a 4 px rounded tip */
  function bar(x, y, w, h) {
    var r = Math.min(4, w / 2);
    if (w < 0.5) return 'M' + x + ' ' + y + 'Z';
    return 'M' + x + ' ' + y + 'H' + (x + w - r).toFixed(1) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'V' + (y + h - r) +
           'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + r + 'H' + x + 'Z';
  }
  // header: the two landmarks of the track, and the two number columns
  txt(el, X0 + 13.72 * PX, 18, 'first hurdle, 13.72 m');
  txt(el, FIN - 8, 18, 'finish line, 110 m', { anchor: 'end' });
  txt(el, XV, 18, 'avg. distance', { anchor: 'end' });
  txt(el, XS, 18, 'success rate', { anchor: 'end' });
  // layer 1: one rail and one bar per lane
  var lanes = LANES.map(function (L, j) {
    var y = TOP + j * PITCH + (PITCH - BH) / 2, g = A.el('g', {}, el);
    A.el('rect', { x: X0, y: y, width: END - X0, height: BH, rx: 4, fill: '#232323' }, g);
    return { L: L, g: g, y: y, bar: A.el('path', { fill: L.col }, g) };
  });
  // layer 2: the ten hurdles (a notch across the lanes that are shown, a tick above them) and the finish line
  var notch = [], fin;
  for (i = 0; i < 10; i++) {
    var hx = X0 + (13.72 + 9.14 * i) * PX;
    notch.push(A.el('line', { x1: hx, y1: TOP, x2: hx, stroke: '#000', 'stroke-width': 2 }, el));
    A.el('line', { x1: hx, y1: 22, x2: hx, y2: TOP + 2, stroke: i ? '#6e6e6e' : '#d0d0d0', 'stroke-width': 2 }, el);
  }
  fin = A.el('line', { x1: FIN, y1: 22, x2: FIN, stroke: '#fff', 'stroke-width': 2 }, el);
  // layer 3: the name and the two numbers of each lane
  lanes.forEach(function (o, j) {
    var y = TOP + j * PITCH;
    o.t = A.el('g', {}, el);
    txt(o.t, 0, y + 21, o.L.n, { weight: 700, size: 22, fill: '#fff' });
    o.val = txt(o.t, XV, y + 21, o.L.v, { weight: 700, size: 22, fill: '#fff', anchor: 'end' });
    o.suc = txt(o.t, XS, y + 21, o.L.s, { weight: 700, size: 22, fill: '#fff', anchor: 'end' });
  });
  return function draw(f) {
    var shown = Math.min(f.step, 2) + (f.step < 3 && f.step > 0 ? A.ease(A.ramp(f.ts, 0, 0.4)) : 1);      // lanes on show (the newest one slides in)
    var y2 = (TOP + shown * PITCH - 2).toFixed(1);
    for (var m = 0; m < notch.length; m++) notch[m].setAttribute('y2', y2);
    fin.setAttribute('y2', y2);
    for (var j = 0; j < lanes.length; j++) {
      var o = lanes[j], on = f.step >= j, cur = f.step === j, t = j === 0 ? f.t : f.ts;
      var u = !on ? 0 : (cur ? A.ease(A.ramp(t, 0.35, 1.9)) : 1);
      var op = !on ? 0 : ((f.step > j && f.step < f.steps) ? 0.45 : 1);
      A.set(o.bar, { d: bar(X0, o.y, o.L.d * PX * u, BH) });
      A.show(o.g, op); A.show(o.t, op);
      A.show(o.val, cur ? A.ramp(t, 1.7, 2.1) : (on ? 1 : 0));
      A.show(o.suc, cur ? A.ramp(t, 2.0, 2.4) : (on ? 1 : 0));
    }
  };
});
