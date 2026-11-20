/* "Three roads out of 2019"  (tools/slides/02_40_roads.py)
 *
 * The svg covers the whole stage (viewBox = slide coordinates) and lies under the HTML titles and clips.
 * SCHEMATIC of the story, not a chart: one column per year, one road per chapter, one station per paper (in the column of its year).
 * All geometry and all names come from the slide file through data-fig (names and years are read from PAPERS there).
 *   step 0   the thread leaves DReCon and stops at the fork; the three roads are grey tracks; a signal runs up to the fork and fades
 *   step 1-3 one road per click: it grows out of the fork, its letter (A, B, C) and its stations pop as it passes them, then signals run along it
 *   step 4   the crossings: a link from PULSE (road C) up to road A (it hops over road B: no stop there), and a new station on road B in 2026
 * Roads drawn by an earlier click dim while a later road is explained; everything is at full strength on the finished slide.
 * draw(f) is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('connect-roads', function (el, A) {
  'use strict';
  var D = JSON.parse(el.getAttribute('data-fig'));
  var GREY = '#2a2a2a', V = 560, GROW = 1.3;
  var F = function (size, wt) { return 'font:' + (wt || 700) + ' ' + size + 'px ' + A.FONT; };
  var HALO = ';paint-order:stroke;stroke:#000;stroke-width:7px;stroke-linejoin:round';        // labels stay clear of the column borders they cross

  // ---- frame: year columns, grey tracks, the slots of the three clips
  var ghost = A.el('g', null, el);
  D.cols.forEach(function (c, i) {
    A.el('text', { x: (c.a + c.b) / 2, y: D.yax, 'text-anchor': 'middle', text: c.t, style: F(20) + ';fill:#8c8c8c;letter-spacing:.08em' }, ghost);
    if (i) D.roads.forEach(function (r) {                       // column borders only where the stations are: they never run through a title
      A.el('line', { x1: c.a, y1: r.y - 36, x2: c.a, y2: r.y + 46, stroke: '#2c2c2c', 'stroke-width': 2, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }, ghost);
    });
  });
  function roadD(y) { return 'M' + D.xf + ' ' + D.yo + ' C' + (D.xf + 58) + ' ' + D.yo + ' ' + (D.xl - 58) + ' ' + y + ' ' + D.xl + ' ' + y + ' H' + D.xe; }
  function tipD(y) { return 'M' + (D.xe - 9) + ' ' + (y - 10) + ' L' + (D.xe + 3) + ' ' + y + ' L' + (D.xe - 9) + ' ' + (y + 10); }
  D.roads.forEach(function (r, j) {
    A.el('path', { d: roadD(r.y), fill: 'none', stroke: GREY, 'stroke-width': 5, 'stroke-linecap': 'round' }, ghost);
    A.el('path', { d: tipD(r.y), fill: 'none', stroke: GREY, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ghost);
  });
  var slots = D.roads.map(function (r, j) {                      // the place of each road's clip, until the clip arrives
    var s = D.slots[j], g = A.el('g', null, el);
    A.el('rect', { x: s[0] + 1, y: s[1] + 1, width: s[2] - 2, height: s[3] - 2, rx: 16, fill: '#070707', stroke: '#242424', 'stroke-width': 1.5, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, g);
    A.el('text', { x: s[0] + s[2] / 2, y: s[1] + s[3] / 2 + 30, 'text-anchor': 'middle', text: r.n, style: F(86) + ';fill:#181818' }, g);
    return g;
  });

  // ---- the stub from DReCon to the fork (step 0)
  var stub = A.el('path', { d: 'M' + D.xo + ' ' + D.yo + ' H' + D.xf, fill: 'none', stroke: D.c0, 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
  var stubLen = D.xf - D.xo;
  A.set(stub, { 'stroke-dasharray': stubLen + ' ' + (stubLen + 20) });

  // ---- the roads
  var R = D.roads.map(function (r) {
    var g = A.el('g', null, el);
    A.el('path', { d: roadD(r.y), fill: 'none', stroke: '#000', 'stroke-width': 11 }, g);
    var p = A.el('path', { d: roadD(r.y), fill: 'none', stroke: r.c, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    var len = p.getTotalLength(), curve = len - (D.xe - D.xl);
    A.set(p, { 'stroke-dasharray': len + ' ' + (len + 20) });
    var tip = A.el('path', { d: tipD(r.y), fill: 'none', stroke: r.c, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    var st = r.st.map(function (s) {
      return { x: s.x, at: 0.1 + GROW * (curve + s.x - D.xl) / len,
               ring: A.el('circle', { cx: s.x, cy: r.y, r: 9, fill: 'none', stroke: r.c, 'stroke-width': 3, opacity: 0 }, g),
               dot: A.el('circle', { cx: s.x, cy: r.y, r: 9, fill: r.c, stroke: '#000', 'stroke-width': 4 }, g),
               lab: A.el('text', { x: s.x, y: s.up ? r.y - 20 : r.y + 34, 'text-anchor': 'middle', text: s.n, style: F(22) + ';fill:#fff' + HALO }, g) };
    });
    // the road's letter (the sentence under the figure says "Road A"): a bullet on the bend where the road leaves the fork
    var lo = 0, hi = curve, bl = 0, XB = D.xl - 34;
    for (var it = 0; it < 24; it++) { bl = (lo + hi) / 2; if (p.getPointAtLength(bl).x < XB) lo = bl; else hi = bl; }
    var bp = p.getPointAtLength(bl), badge = A.el('g', null, g);
    A.el('circle', { r: 17, fill: r.c, stroke: '#000', 'stroke-width': 4 }, badge);
    A.el('text', { y: 7, 'text-anchor': 'middle', text: r.tag, style: F(20) + ';fill:#000' }, badge);
    return { g: g, p: p, len: len, tip: tip, st: st, y: r.y, c: r.c, badge: badge, bx: bp.x, by: bp.y, bat: 0.1 + GROW * bl / len };
  });
  var fork = A.el('circle', { cx: D.xf, cy: D.yo, r: 10, fill: '#000', stroke: D.c0, 'stroke-width': 5 }, el);

  // ---- the crossings (step 4)
  var X = D.cross, ya = D.roads[X.to].y, yc = D.roads[X.frm].y, cc = D.roads[X.frm].c;
  var gx = A.el('g', null, el);
  var linkD = 'M' + X.x + ' ' + (yc - 13), HOP = 13;
  D.roads.slice().sort(function (p, q) { return q.y - p.y; }).forEach(function (r) {      // a road in between is not a stop: the link hops over it
    if (r.y > ya && r.y < yc) linkD += ' V' + (r.y + HOP) + ' A' + HOP + ' ' + HOP + ' 0 0 0 ' + X.x + ' ' + (r.y - HOP);
  });
  linkD += ' V' + (ya + 17);
  var linkBack = A.el('path', { d: linkD, fill: 'none', stroke: '#000', 'stroke-width': 12 }, gx);      // clears the road under the hop; grows with the link
  var link = A.el('path', { d: linkD, fill: 'none', stroke: cc, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gx);
  var linkLen = link.getTotalLength();
  A.set(link, { 'stroke-dasharray': linkLen + ' ' + (linkLen + 20) }); A.set(linkBack, { 'stroke-dasharray': linkLen + ' ' + (linkLen + 20) });
  var xHalo = A.el('circle', { cx: X.x, cy: yc, r: 9, fill: 'none', stroke: cc, 'stroke-width': 3, opacity: 0 }, gx);
  var xRing = A.el('circle', { cx: X.x, cy: ya, r: 11, fill: '#000', stroke: cc, 'stroke-width': 4 }, gx);
  var xHead = A.el('path', { d: 'M' + (X.x - 9) + ' ' + (ya + 30) + ' L' + X.x + ' ' + (ya + 18) + ' L' + (X.x + 9) + ' ' + (ya + 30), fill: 'none', stroke: cc, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gx);
  var xLab = A.el('text', { x: X.x + 20, y: ya - 20, text: X.lab, style: F(22) + ';fill:' + cc + HALO }, gx);
  var B = D.back, yb = D.roads[B.road].y;
  var bRing = A.el('circle', { cx: B.x, cy: yb, r: 9, fill: 'none', stroke: B.c, 'stroke-width': 3, opacity: 0 }, gx);
  var bDot = A.el('circle', { cx: B.x, cy: yb, r: 10, fill: B.c, stroke: '#000', 'stroke-width': 4 }, gx);
  var bName = A.el('text', { x: B.x, y: yb + 34, 'text-anchor': 'middle', text: B.n, style: F(22) + ';fill:#fff' + HALO }, gx);
  var bLab = A.el('text', { x: D.xe - 4, y: yb - 20, 'text-anchor': 'end', text: B.lab, style: F(22) + ';fill:' + B.c + HALO }, gx);

  // ---- signals
  function pulse(col) {
    var g = A.el('g', { opacity: 0 }, el);
    A.el('circle', { r: 15, fill: col, opacity: 0.35 }, g); A.el('circle', { r: 6.5, fill: '#fff' }, g);
    return g;
  }
  var P0 = pulse(D.c0), PR = R.map(function (r) { return pulse(r.c); }), PX = pulse(cc);
  function put(g, x, y, o) { A.set(g, { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' }); A.show(g, o); }

  return function draw(f) {
    var st = f.step, last = f.steps, j, k;
    function tm(step) { return st > step ? 1e3 : (st === step ? (step === 0 ? f.t : f.ts) : -1); }      // seconds since `step` began (-1: not yet)

    // the stub and the fork
    var u0 = A.ramp(tm(0), 0.2, 0.7);
    A.set(stub, { 'stroke-dashoffset': (stubLen * (1 - u0)).toFixed(1) });
    var tf = tm(0) - 0.7;
    A.show(fork, tf >= 0 ? 1 : 0); A.set(fork, { r: tf >= 0 ? 10 + 5 * (1 - A.ramp(tf, 0, 0.35)) : 10 });

    // the roads
    for (j = 0; j < R.length; j++) {
      var r = R[j], t = tm(j + 1), u = t < 0 ? 0 : A.ramp(t, 0.1, 0.1 + GROW);
      A.show(r.g, t < 0 ? 0 : ((st > j + 1 && st < last) ? 0.38 : 1));
      A.show(slots[j], t < 0 ? 1 : 0);
      A.set(r.p, { 'stroke-dashoffset': (r.len * (1 - u)).toFixed(1) });
      A.show(r.tip, u >= 1 ? 1 : 0);
      var tg = t - r.bat;
      A.show(r.badge, t >= 0 && tg >= 0 ? 1 : 0);
      A.set(r.badge, { transform: 'translate(' + r.bx.toFixed(1) + ' ' + r.by.toFixed(1) + ') scale(' + (1 + 0.35 * (1 - A.ramp(tg, 0, 0.3))).toFixed(3) + ')' });
      for (k = 0; k < r.st.length; k++) {
        var s = r.st[k], ts = t - s.at, on = t >= 0 && ts >= 0;
        A.show(s.dot, on ? 1 : 0); A.set(s.dot, { r: on ? 9 + 5 * (1 - A.ramp(ts, 0, 0.35)) : 9 });
        A.show(s.ring, on ? 1 - A.ramp(ts, 0, 0.6) : 0); A.set(s.ring, { r: 9 + 22 * A.ease(A.ramp(ts, 0, 0.6)) });
        A.show(s.lab, on ? A.ramp(ts, 0, 0.3) : 0);
      }
    }

    // the crossings
    var tx = tm(4), ux = tx < 0 ? 0 : A.ramp(tx, 0.3, 1.1);
    A.show(gx, tx < 0 ? 0 : 1);
    A.set(link, { 'stroke-dashoffset': (linkLen * (1 - ux)).toFixed(1) }); A.set(linkBack, { 'stroke-dashoffset': (linkLen * (1 - ux)).toFixed(1) });
    var th = tx < 0 ? -1 : A.loop(tx, 2.4);
    A.show(xHalo, tx >= 0 ? 0.9 * (1 - A.ramp(th, 0, 1.1)) : 0); A.set(xHalo, { r: 9 + 24 * A.ease(A.ramp(th, 0, 1.1)) });
    var ta = tx - 1.1;
    A.show(xRing, ta >= 0 ? 1 : 0); A.set(xRing, { r: ta >= 0 ? 11 + 5 * (1 - A.ramp(ta, 0, 0.35)) : 11 });
    A.show(xHead, ta >= 0 ? 1 : 0); A.show(xLab, A.ramp(ta, 0, 0.4));
    var tb = tx - 1.6;
    A.show(bDot, tb >= 0 ? 1 : 0); A.set(bDot, { r: tb >= 0 ? 10 + 6 * (1 - A.ramp(tb, 0, 0.35)) : 10 });
    A.show(bRing, tb >= 0 ? 1 - A.ramp(tb, 0, 0.7) : 0); A.set(bRing, { r: 9 + 26 * A.ease(A.ramp(tb, 0, 0.7)) });
    A.show(bName, A.ramp(tb, 0, 0.3)); A.show(bLab, A.ramp(tb, 0.1, 0.5));

    // signals: at step 0 one runs up to the fork and fades; then along the road being explained; on the finished slide along all three
    var tau, d, T, pt;
    put(P0, 0, 0, 0); for (j = 0; j < PR.length; j++) put(PR[j], 0, 0, 0); put(PX, 0, 0, 0);
    if (st === 0) {
      tau = A.loop(f.t - 1.2, 2.4);
      if (f.t >= 1.2 && tau < 1) put(P0, D.xo + stubLen * A.ease(tau / 0.8), D.yo, 1 - A.ramp(tau, 0.7, 1));
    } else {
      var live = [];
      for (j = 0; j < R.length; j++) if (st === j + 1 || st >= last) live.push(j);
      var t0 = st >= last ? 2.4 : 0.3 + GROW;
      for (k = 0; k < live.length; k++) {
        r = R[live[k]]; T = (stubLen + r.len) / V + 1.0;
        tau = f.ts - t0 - 0.45 * k;
        if (tau < 0) continue;
        d = V * A.loop(tau, T);
        if (d < stubLen) put(P0, D.xo + d, D.yo, live.length > 1 && k ? 0 : 1);
        else if (d < stubLen + r.len - 12) { pt = r.p.getPointAtLength(d - stubLen); put(PR[live[k]], pt.x, pt.y, 1); }
      }
      if (st >= 4 && ux >= 1) {                                   // and one up the link, from PULSE to road A
        tau = A.loop(f.ts - 1.3, 2.4);
        if (tau < 0.9) { pt = link.getPointAtLength(linkLen * A.ease(tau / 0.9)); put(PX, pt.x, pt.y, 1 - A.ramp(tau, 0.75, 0.9)); }
      }
    }
  };
});
