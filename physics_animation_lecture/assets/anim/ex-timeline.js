/* "What came before learning": the time line above the four clips. It advances by one stop per click:
 * step 0 -> 2007, 1 -> 2010, 2 -> 2012, 3 -> from 2016, 4 (the conclusion) -> the line runs on to the right.
 * Stops that have not been reached are shown dimmed, so the frame of the figure is there from the start.
 * Markup: <svg data-anim="ex-timeline" viewBox="0 0 1740 52">; the stops sit above the centres of the four columns. */
DeckAnim.register('ex-timeline', function (el, A) {
  var CX = [208.5, 649.5, 1090.5, 1531.5], Y = 40, END = 1724, DIM = '#6a6a6a';
  var STOPS = [['2007', 'SIMBICON'], ['2010', 'SAMCON'], ['2012', 'contact-invariant optimization'], ['from 2016', 'deep RL']];
  A.el('line', { x1: 0, y1: Y, x2: 1740, y2: Y, stroke: '#303030', 'stroke-width': 3, 'stroke-linecap': 'round' }, el);
  var prog = A.el('line', { x1: 0, y1: Y, x2: 0, y2: Y, stroke: A.C.g, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var head = A.el('path', { fill: 'none', stroke: A.C.g, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var ring = A.el('circle', { cy: Y, r: 9, fill: 'none', stroke: A.C.g, 'stroke-width': 3 }, el);
  var dots = [], years = [], names = [];
  STOPS.forEach(function (s, i) {
    var t = A.el('text', { x: CX[i], y: 22, 'text-anchor': 'middle', style: 'font:700 21px ' + A.FONT + ';' + A.HALO }, el);
    years.push(A.el('tspan', { text: s[0] }, t));
    A.el('tspan', { text: '  ·  ', fill: DIM }, t);
    names.push(A.el('tspan', { text: s[1] }, t));
    dots.push(A.el('circle', { cx: CX[i], cy: Y, r: 8, stroke: '#000', 'stroke-width': 3 }, el));
  });
  return function draw(f) {
    var k = Math.min(f.step, 3);                                  // the stop this build step is about
    var u = A.ease(A.ramp(f.step === 0 ? f.t : f.ts, 0, 0.8));
    var X = f.step >= 4 ? A.lerp(CX[3], END, u) : A.lerp(k === 0 ? 0 : CX[k - 1], CX[k], u);
    prog.setAttribute('x2', X.toFixed(1));
    for (var i = 0; i < 4; i++) {
      var on = X >= CX[i] - 0.5;
      dots[i].setAttribute('fill', on ? A.C.g : '#3a3a3a');
      years[i].setAttribute('fill', on ? A.C.g : DIM);
      names[i].setAttribute('fill', on ? '#fff' : DIM);
    }
    if (f.step >= 4) {                                            // deep RL goes on: an arrow head at the running end
      head.setAttribute('d', 'M' + (X - 11).toFixed(1) + ' ' + (Y - 9) + ' L' + X.toFixed(1) + ' ' + Y + ' L' + (X - 11).toFixed(1) + ' ' + (Y + 9));
      A.show(head, 1); A.show(ring, 0);
    } else {                                                      // a ring breathes around the stop being explained
      A.show(head, 0);
      var p = A.loop(f.t, 1.6) / 1.6;
      A.set(ring, { cx: CX[k], r: (9 + 5 * p).toFixed(1) });
      A.show(ring, X >= CX[k] - 0.5 ? (1 - p).toFixed(2) : 0);
    }
  };
});
