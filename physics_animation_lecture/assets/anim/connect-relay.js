/* "The decade as a relay"  (the two recap slides of tools/slides/08_outro.py)
 *
 * The svg covers the whole stage (viewBox = slide coordinates) and lies over the HTML cards. Geometry comes from the slide file (data-fig):
 *   x, top   the rail on the left          bands[j] = { c: colour, y: height of its dot on the rail, cards: [[x, y, w, h], ...] in reading order }
 *   head     (second slide) the rail arrives from the slide before, in that chapter's colour       tail  (first slide) the rail goes on below the last band
 * One band per click, in the order of the story:
 *   step 0     the rail and the frames of the cards to come, in grey (each frame stays until its own card arrives); the baton waits at the top of the rail
 *   step j+1   the rail reaches band j, and the baton runs along the top edge of its cards in reading order, at the pace at which the cards appear
 *              (the HTML cards carry the same delays); the card under the baton lights up. While nothing is clicked, the run repeats.
 *   last step  after the last band's run, the baton runs the whole relay, band after band, again and again
 * Bands of earlier clicks dim while a later one is explained (as the cards do); all are at full strength on the finished slide.
 * draw(f) is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('connect-relay', function (el, A) {
  'use strict';
  var D = JSON.parse(el.getAttribute('data-fig')), X = D.x, DT = D.dt, B = D.bands, GREY = '#2a2a2a';
  var RAIL = 0.35, T0 = 0.5, TAILT = 0.6;                         // seconds: down the rail, on to the first card, after the last card
  function dur(b) { return T0 + b.cards.length * DT + TAILT; }

  // ---- frame: the whole rail and the places of the cards to come
  var yEnd = D.tail ? D.tail.y : B[B.length - 1].y;
  A.el('path', { d: 'M' + X + ' ' + D.top + ' V' + yEnd, fill: 'none', stroke: GREY, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  if (D.tail) A.el('path', { d: 'M' + (X - 9) + ' ' + (yEnd - 10) + ' L' + X + ' ' + (yEnd + 2) + ' L' + (X + 9) + ' ' + (yEnd - 10), fill: 'none', stroke: GREY, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var CARD0 = 0.4;                                                // seconds after the click at which the first card starts to appear (the HTML cards: 0.4 + i * dt)
  var ghosts = B.map(function (b) {
    return { dot: A.el('circle', { cx: X, cy: b.y, r: 9, fill: '#000', stroke: '#3a3a3a', 'stroke-width': 3 }, el),
             frames: b.cards.map(function (c) {
               var g = A.el('g', null, el);                       // the black plate keeps a frozen review frame (?animt, where the HTML cards do not wait) like the live picture
               A.el('rect', { x: c[0] - 1, y: c[1] - 1, width: c[2] + 2, height: c[3] + 2, fill: '#000' }, g);
               A.el('rect', { x: c[0] + 1, y: c[1] + 1, width: c[2] - 2, height: c[3] - 2, rx: 12, fill: '#060606', stroke: '#242424', 'stroke-width': 1.5, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, g);
               return g;
             }) };
  });

  // ---- the rail in colour, piece by piece, and the dots of the bands
  var head = null;
  if (D.head) head = A.el('path', { d: 'M' + X + ' ' + D.top + ' V' + (B[0].y - 14), fill: 'none', stroke: D.head.c, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var segs = B.map(function (b, j) {
    var y0 = j ? B[j - 1].y : (D.head ? b.y - 14 : D.top), len = b.y - y0, g = A.el('g', null, el);
    var p = A.el('path', { d: 'M' + X + ' ' + y0 + ' V' + b.y, fill: 'none', stroke: b.c, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': len + ' ' + (len + 20) }, g);
    return { g: g, p: p, y0: j ? B[j - 1].y : D.top, len: len, dot: A.el('circle', { cx: X, cy: b.y, r: 9, fill: b.c, stroke: '#000', 'stroke-width': 4 }, g) };
  });
  var tail = null;
  if (D.tail) {
    var yl = B[B.length - 1].y, tl = D.tail.y - yl;
    tail = { len: tl, p: A.el('path', { d: 'M' + X + ' ' + yl + ' V' + D.tail.y, fill: 'none', stroke: D.tail.c, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': tl + ' ' + (tl + 20) }, el),
             hd: A.el('path', { d: 'M' + (X - 9) + ' ' + (D.tail.y - 10) + ' L' + X + ' ' + (D.tail.y + 2) + ' L' + (X + 9) + ' ' + (D.tail.y - 10), fill: 'none', stroke: D.tail.c, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el) };
  }

  // ---- the light on the card that holds the baton, and the baton
  var lights = B.map(function (b) {
    return b.cards.map(function (c) {
      return A.el('rect', { x: c[0] - 1.5, y: c[1] - 1.5, width: c[2] + 3, height: c[3] + 3, rx: 13, fill: b.c, 'fill-opacity': 0.1, stroke: b.c, 'stroke-width': 3, opacity: 0 }, el);
    });
  });
  var baton = A.el('g', { opacity: 0 }, el);
  var bGlow = A.el('circle', { r: 15, fill: '#fff', opacity: 0.4 }, baton);
  A.el('circle', { r: 6.5, fill: '#fff' }, baton);
  function put(x, y, col, o, r) { A.set(baton, { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' }); A.set(bGlow, { fill: col, r: r || 15 }); A.show(baton, o); }
  function anchor(c) { return [c[0] + 18, c[1]]; }

  /** band j at t seconds after the rail started toward it: places the baton, lights its cards. y0 = where on the rail the baton comes from. */
  function run(j, t, L) {
    var b = B[j], n = b.cards.length, s = segs[j], i, a, a2;
    for (i = 0; i < n; i++) { var ti = t - (T0 + i * DT); L[j][i] = ti < 0 ? 0 : Math.max(0, 1 - ti / 0.9); }
    if (t < RAIL) { put(X, A.lerp(s.y0, b.y, A.ease(t / RAIL)), b.c, 1); return; }
    a = anchor(b.cards[0]);
    if (t < T0) { var u = A.ease((t - RAIL) / (T0 - RAIL)); put(A.lerp(X, a[0], u), A.lerp(b.y, a[1], u), b.c, 1); return; }
    i = Math.min(n - 1, Math.floor((t - T0) / DT));
    a = anchor(b.cards[i]);
    if (i === n - 1) { put(a[0], a[1], b.c, 1); return; }
    a2 = anchor(b.cards[i + 1]);
    var v = (t - T0) / DT - i;
    if (a2[1] !== a[1]) { if (v < 0.5) put(a[0], a[1], b.c, 1 - v / 0.5); else put(a2[0], a2[1], b.c, (v - 0.5) / 0.5); }      // next row: fade out, fade in
    else put(A.lerp(a[0], a2[0], A.ease(v)), a[1], b.c, 1);
  }

  return function draw(f) {
    var st = f.step, last = f.steps, nb = B.length, j, i;
    var L = B.map(function (b) { return b.cards.map(function () { return 0; }); });
    // what has been reached so far
    for (j = 0; j < nb; j++) {
      var tb = st > j + 1 ? 1e3 : (st === j + 1 ? f.ts : -1), s = segs[j], u = tb < 0 ? 0 : A.ramp(tb, 0, RAIL);
      A.show(ghosts[j].dot, tb < RAIL ? 1 : 0);
      for (i = 0; i < ghosts[j].frames.length; i++) A.show(ghosts[j].frames[i], tb < CARD0 + i * DT ? 1 : 0);      // a frame stays until its own card arrives
      A.show(s.g, tb < 0 ? 0 : ((st > j + 1 && st < last) ? 0.38 : 1));
      A.set(s.p, { 'stroke-dashoffset': (s.len * (1 - u)).toFixed(1) });
      var td = tb - RAIL;
      A.show(s.dot, td >= 0 ? 1 : 0); A.set(s.dot, { r: td >= 0 ? 9 + 5 * (1 - A.ramp(td, 0, 0.35)) : 9 });
    }
    if (head) A.show(head, st > 0 && st < last ? 0.38 : 1);
    var dl = dur(B[nb - 1]);
    if (tail) {
      var tt = st >= last ? f.ts - dl : -1, ut = A.ramp(tt, 0, 0.5);
      A.show(tail.p, ut > 0 ? 1 : 0); A.set(tail.p, { 'stroke-dashoffset': (tail.len * (1 - ut)).toFixed(1) }); A.show(tail.hd, ut >= 1 ? 1 : 0);
    }

    // the baton
    A.show(baton, 0);
    if (st === 0) {                                               // waits at the top of the rail
      var y0 = D.head ? A.lerp(D.top, B[0].y - 14, A.ease(A.ramp(f.t, 0.15, 0.6))) : D.top;
      put(X, y0, D.head ? D.head.c : B[0].c, 1, 15 + 5 * Math.sin(2.6 * f.t));
    } else if (st < last) {                                       // the band of this click, again and again
      j = st - 1;
      var d = dur(B[j]), rep = B[j].cards.length * DT + (T0 - RAIL) + TAILT + 2.2, t = f.ts;
      if (t < d + 1.6) run(j, t, L);
      else { var q = A.loop(t - d - 1.6, rep); run(j, RAIL + q, L); }
    } else {                                                      // the finished slide: the last band first, then the whole relay
      t = f.ts;
      if (t < dl + 1.6) run(nb - 1, t, L);
      else {
        var T = 2.4, off = 0, done = false;
        for (j = 0; j < nb; j++) T += dur(B[j]) - 0.25;
        q = A.loop(t - dl - 1.6, T);
        for (j = 0; j < nb && !done; j++) {
          var dj = dur(B[j]) - 0.25;
          if (q < off + dj) { run(j, q - off, L); done = true; }
          off += dj;
        }
        if (!done) run(nb - 1, 1e3, L);                           // a breath on the last card
      }
    }
    for (j = 0; j < nb; j++) for (i = 0; i < L[j].length; i++) A.show(lights[j][i], L[j][i]);
  };
});
