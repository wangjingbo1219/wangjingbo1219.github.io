/* "What the simulator does at every step": the step loop.
 * Five boxes in a row and a return arrow; the active box moves along once every 2.5 s, so the loop is seen running.
 * Markup: <svg data-anim="bd-steploop" viewBox="0 0 1740 120">   (text at slide scale, the figure is drawn 1:1) */
DeckAnim.register('bd-steploop', function (el, A) {
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">' + s + '</tspan>'; };
  var BOX = [
    { w: 214, t: 'State (' + MI('q') + ', ' + MI('v') + ')' },
    { w: 360, t: 'Add gravity and torques ' + MI('τ') },
    { w: 372, t: 'Find contacts, solve ' + MI('f'), s: 'no penetration · friction' },
    { w: 330, t: 'Solve for ' + MI('v̇') + ', step Δ' + MI('t') },
    { w: 196, t: 'Next state' }
  ];
  var GAP = 54, H = 66, Y = 2, total = 0, i;
  for (i = 0; i < BOX.length; i++) total += BOX[i].w;
  total += GAP * (BOX.length - 1);
  var x = (1740 - total) / 2, rect = [], lab = [], sub = [], arr = [];
  for (i = 0; i < BOX.length; i++) {
    var b = BOX[i];
    b.x = x;
    rect.push(A.el('rect', { x: x, y: Y, width: b.w, height: H, rx: 12, fill: '#161616', stroke: '#303030', 'stroke-width': 2 }, el));
    var t = A.el('text', { x: x + b.w / 2, y: Y + (b.s ? 29 : 42), 'text-anchor': 'middle', style: 'font:700 24px ' + A.FONT + ';fill:#fff' }, el);
    t.innerHTML = b.t;
    lab.push(t);
    sub.push(b.s ? A.el('text', { x: x + b.w / 2, y: Y + 54, 'text-anchor': 'middle', text: b.s, style: 'font:400 20px ' + A.FONT + ';fill:' + A.C.mid }, el) : null);
    if (i < BOX.length - 1) {
      var ax = x + b.w + 8;
      arr.push(A.el('path', { d: 'M' + ax + ' ' + (Y + H / 2) + ' h' + (GAP - 18) + ' m-10 -9 l10 9 l-10 9', fill: 'none', stroke: A.C.g, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el));
    }
    x += b.w + GAP;
  }
  // return arrow: from under the last box back to under the first one
  var x1 = BOX[4].x + BOX[4].w / 2, x0 = BOX[0].x + BOX[0].w / 2, yb = Y + H, yl = 88;
  var back = A.el('path', { d: 'M' + x1 + ' ' + (yb + 4) + ' V' + (yl - 12) + ' Q' + x1 + ' ' + yl + ' ' + (x1 - 12) + ' ' + yl + ' H' + (x0 + 12) + ' Q' + x0 + ' ' + yl + ' ' + x0 + ' ' + (yl - 12) + ' V' + (yb + 8) + ' m-9 10 l9 -10 l9 10',
    fill: 'none', stroke: A.C.line, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var note = A.el('text', { x: 870, y: yl + 27, 'text-anchor': 'middle', style: 'font:500 21px ' + A.FONT + ';fill:' + A.C.mid }, el);     // under the return line
  note.innerHTML = 'again, every Δ' + MI('t') + ':  1 ms in these clips · 1/120 s in ASE · 1/1200 s in DeepMimic';
  var dot = A.el('circle', { r: 7, fill: A.C.g }, el);
  var PER = 2.5, SEG = PER / 5;
  return function draw(f) {
    var u = A.loop(f.ts, PER), k = Math.min(4, Math.floor(u / SEG)), v = (u - k * SEG) / SEG;
    for (var j = 0; j < 5; j++) {
      var on = j === k;
      A.set(rect[j], { fill: on ? '#1c2a05' : '#161616', stroke: on ? A.C.g : '#303030', 'stroke-width': on ? 3 : 2 });
    }
    // the dot rides the arrow out of the active box during the last third of its turn, then the return line after the last box
    if (k < 4) {
      var e = A.ease(A.ramp(v, 0.6, 1));
      A.set(dot, { cx: BOX[k].x + BOX[k].w + 8 + e * (GAP - 16), cy: Y + H / 2, opacity: v > 0.6 ? 1 : 0 });
    } else {
      var e2 = A.ease(A.ramp(v, 0.35, 1));
      A.set(dot, { cx: x1 - 12 + (x0 + 12 - (x1 - 12)) * e2, cy: yl, opacity: v > 0.35 ? 1 : 0 });
    }
    A.set(back, { stroke: k === 4 ? A.C.g : A.C.line });
  };
});
