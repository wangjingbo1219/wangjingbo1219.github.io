/* "One loop, three design choices"  (tools/slides/01_16_lens.py)
 *
 * The svg covers the whole stage (viewBox = slide coordinates) and lies above the three HTML rows.
 *   step 0   the control loop runs: goal g -> policy -> action a -> PD controller -> torque tau -> simulator -> next state, and back.
 *            One lap = one control step. A lap takes LAP seconds on screen: 100 x slower than a 30 Hz loop.
 *            Below the loop, the same loop runs on one SIMULATED body (window.LN_LOOP, made by tools/fig/ln_loop_sim.py: a MuJoCo
 *            humanoid, policy at 30 Hz, one exported frame per control step). Every lap the body advances by exactly one control step:
 *            the green outline is the goal pose, green arcs the target angles, amber arcs the motor torques (126 degrees of arc for
 *            20 N·m about the viewing axis), white arrows gravity and the contact forces (length = N), green dots the joints of the new state.
 *   step 1   (1) supervision: the outcome is scored, and the score trains the policy; row 1 appears, options left to right
 *   step 2   (2) interface: what the goal g is; row 2
 *   step 3   (3) scale: the motion data behind (1) and (2); row 3
 *   step 4   one paper = one choice per row: five papers take turns, HOLDLAPS laps each
 * draw(f) is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('ln-loop', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, AM = C.amber, sec = el.closest('section'), D = window.LN_LOOP;
  if (!D) throw new Error('ln-loop: simulated data (assets/anim/ln-loop-data.js) not loaded');
  var LAP = 10 / 3, P0 = 0.59;            // seconds per lap; the slide opens with the signal in the State box
  var HOLDLAPS = 2;                       // step 4: laps per paper
  var PAPERS = JSON.parse(el.getAttribute('data-papers') || '[]');

  function mi(s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em">' + s + '</tspan>'; }
  function T(parent, x, y, html, size, fill, weight, anchor, halo) {
    return A.el('text', { x: x, y: y, 'text-anchor': anchor || 'start', html: html,
      style: 'font:' + (weight || 700) + ' ' + size + 'px ' + A.FONT + ';fill:' + fill + (halo ? ';paint-order:stroke;stroke:#000;stroke-width:8px;stroke-linejoin:round' : '') }, parent);
  }
  function grp(parent) { return A.el('g', null, parent || el); }
  function win(p, a, b) {                 // 1 inside [a, b] (phase, wraps at 1), soft edges
    function w(q) { var e = 0.012; return A.ease(A.ramp(q, a - e, a + e)) * (1 - A.ease(A.ramp(q, b - e, b + e))); }
    return Math.max(w(p), w(p + 1), w(p - 1));
  }
  var LINE = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  function line(parent, d, col, w, extra) { var a = { d: d, stroke: col, 'stroke-width': w }, k; for (k in LINE) a[k] = LINE[k]; for (k in (extra || {})) a[k] = extra[k]; return A.el('path', a, parent); }
  var last = {};
  function setText(node, key, html) { if (last[key] !== html) { last[key] = html; A.set(node, { html: html }); } }        // touch the DOM only when the value changes
  function setFill(node, key, col) { if (last[key] !== col) { last[key] = col; node.style.fill = col; } }

  // ------------------------------------------------------------------ frames of the rows still to come (steps 1 and 2)
  var slots = grp();
  var slot = [1, 2].map(function (r) {
    var g = grp(slots);
    return { g: g, box: A.el('rect', { rx: 14, fill: '#070707', stroke: '#2a2a2a', 'stroke-width': 1.5, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, g),
             ring: A.el('circle', { r: 20, fill: 'none', stroke: '#3a3a3a', 'stroke-width': 2 }, g), num: T(g, 0, 0, String(r + 1), 23, '#4a4a4a', 700, 'middle') };
  });

  // ------------------------------------------------------------------ the loop
  var BY = 298, BH = 100, WY = BY + BH / 2;
  var BX = [
    { x: 90, w: 250, t: 'Goal ' + mi('g'), s: 'what should happen', kind: 'o' },
    { x: 420, w: 290, t: 'Policy ' + mi('π') + '(' + mi('a') + ' | ' + mi('s') + ', ' + mi('g') + ')', s: 'a neural network', kind: 'g' },
    { x: 790, w: 250, t: 'PD controller', s: 'targets to torques', kind: '' },
    { x: 1120, w: 340, t: 'Physics simulator', s: 'contacts, gravity, momentum', kind: '' },
    { x: 1540, w: 290, t: 'State ' + mi('s'), s: 'the body as it really is', kind: '' }
  ];
  var loop = grp(), glow = [];
  BX.forEach(function (b) {
    var g = b.kind === 'g';
    A.el('rect', { x: b.x, y: BY, width: b.w, height: BH, rx: 12, fill: g ? G : '#161616', stroke: g || b.kind === 'o' ? G : '#303030', 'stroke-width': 1.5 }, loop);
    T(loop, b.x + 24, BY + 44, b.t, 28, g ? '#000' : '#fff', 700);
    T(loop, b.x + 24, BY + 76, b.s, 21, g ? 'rgba(0,0,0,.78)' : (b.kind === 'o' ? G : C.mid), 400);
    glow.push(A.el('rect', { x: b.x - 4, y: BY - 4, width: b.w + 8, height: BH + 8, rx: 15, fill: 'none', stroke: g ? '#fff' : C.gbr, 'stroke-width': 5, opacity: 0 }, loop));
  });
  var WSYM = ['g', 'a', 'τ', 's′'], wires = [];
  for (var i = 0; i < 4; i++) {
    var x0 = BX[i].x + BX[i].w + 12, x1 = BX[i + 1].x - 12;
    line(loop, 'M' + x0 + ' ' + WY + ' H' + (x1 - 2) + ' M' + (x1 - 13) + ' ' + (WY - 10) + ' L' + x1 + ' ' + WY + ' L' + (x1 - 13) + ' ' + (WY + 10), G, 4);
    wires.push({ x0: x0, x1: x1, lab: T(loop, (x0 + x1) / 2, WY - 20, mi(WSYM[i]), 30, G, 700, 'middle') });
  }
  var SX = BX[4].x + BX[4].w / 2, PX = BX[1].x + BX[1].w / 2, FY = BY + BH + 52, FB = [[SX, BY + BH + 8], [SX, FY], [PX, FY], [PX, BY + BH + 12]];
  line(loop, A.path(FB), G, 4, { 'stroke-dasharray': '2 12' });
  line(loop, 'M' + (PX - 11) + ' ' + (BY + BH + 23) + ' L' + PX + ' ' + (BY + BH + 7) + ' L' + (PX + 11) + ' ' + (BY + BH + 23), G, 4);
  var fbLab = T(loop, (SX + PX) / 2, FY + 9, mi('s'), 30, G, 700, 'middle', true);
  T(loop, PX + 40, FY + 40, 'one lap = one control step: 30 – 60 laps every second', 22, C.mid, 500);
  var counter = T(loop, 1830, FY + 40, '', 22, '#fff', 700, 'end');
  function along(pts, u) {                // point at fraction u of a polyline
    var L = [], tot = 0, k;
    for (k = 1; k < pts.length; k++) { L.push(Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])); tot += L[k - 1]; }
    var d = A.clamp(u, 0, 1) * tot;
    for (k = 0; k < L.length; k++) { if (d <= L[k] || k === L.length - 1) { var r = L[k] ? d / L[k] : 0; return [A.lerp(pts[k][0], pts[k + 1][0], r), A.lerp(pts[k][1], pts[k + 1][1], r)]; } d -= L[k]; }
  }
  function dot(col) {
    var g = grp();
    A.el('circle', { r: 19, fill: col, opacity: 0.3 }, g); A.el('circle', { r: 9, fill: '#fff', stroke: col, 'stroke-width': 3 }, g);
    return g;
  }
  function place(d, p, o) { if (p) A.set(d, { transform: 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')' }); A.show(d, o); }

  // ------------------------------------------------------------------ the three design choices on the loop (amber)
  function pill(parent, x, y, w, num) {
    var g = grp(parent), h = 40;
    A.el('rect', { x: x, y: y, width: w, height: h, rx: h / 2, fill: '#1c1500', stroke: AM, 'stroke-width': 2.5 }, g);
    var fl = A.el('rect', { x: x, y: y, width: w, height: h, rx: h / 2, fill: AM, opacity: 0 }, g);
    A.el('circle', { cx: x + h / 2, cy: y + h / 2, r: h / 2 - 5, fill: AM }, g);
    T(g, x + h / 2, y + h / 2 + 7.5, num, 21, '#000', 700, 'middle');
    return { g: g, flash: fl, txt: T(g, x + h + 3, y + h / 2 + 7.5, '', 21, '#fff', 700) };
  }
  function head(x, y, dx, dy) {            // open arrow head with its tip at (x, y), pointing along (dx, dy)
    var px = -dy, py = dx, s = 9;
    return 'M' + (x - dx * s * 1.3 + px * s) + ' ' + (y - dy * s * 1.3 + py * s) + ' L' + x + ' ' + y + ' L' + (x - dx * s * 1.3 - px * s) + ' ' + (y - dy * s * 1.3 - py * s);
  }
  var LY = BY - 68, LM = LY + 20, GX = BX[0].x + BX[0].w / 2, P2Y = BY + BH + 24;
  var m1 = grp(), m2 = grp(), m3 = grp();
  var RW = [[SX, BY - 8], [SX, LM], [BX[1].x + BX[1].w + 8, LM]];                  // State -> (1): the outcome is scored
  line(m1, A.path(RW), AM, 3, { 'stroke-dasharray': '9 9' });
  line(m1, head(RW[2][0], LM, -1, 0), AM, 3);
  line(m1, 'M' + PX + ' ' + (LY + 43) + ' V' + (BY - 5) + ' ' + head(PX, BY - 4, 0, 1), AM, 3);    // (1) -> policy: it trains the policy
  var p1 = pill(m1, BX[1].x, LY, BX[1].w, '1');
  var rdot = dot(AM);
  line(m2, 'M' + GX + ' ' + (P2Y - 3) + ' V' + (BY + BH + 5) + ' ' + head(GX, BY + BH + 4, 0, -1), AM, 3);
  var p2 = pill(m2, BX[0].x, P2Y, 300, '2');
  line(m3, 'M' + GX + ' ' + (LY + 43) + ' V' + (BY - 5) + ' ' + head(GX, BY - 4, 0, 1), AM, 3);    // data -> goal
  line(m3, 'M' + (BX[0].x + BX[0].w + 6) + ' ' + LM + ' H' + (BX[1].x - 9) + ' ' + head(BX[1].x - 7, LM, 1, 0), AM, 3);   // data -> (1)
  var p3 = pill(m3, BX[0].x, LY, BX[0].w, '3');
  var PBASE = ['reward or loss', 'what ' + mi('g') + ' is', 'motion data'];

  // ------------------------------------------------------------------ step 0: the same loop on one simulated body
  var rc = grp(), PT = 518, PB = 986;
  A.el('rect', { x: 90, y: PT, width: 1740, height: PB - PT, rx: 18, fill: '#0c0c0c', stroke: '#242424', 'stroke-width': 1.5 }, rc);
  var CX = 352, FLY = 928, SC = 250 / (D.pxm * 10);          // data: tenths of a pixel at D.pxm px per metre -> 250 px per metre here
  var FPX = 28 / 200;                                        // force arrows: 28 px per 200 N
  var NG = D.geoms.length, N = D.n, NA = D.arcs.length, NJ = D.ja[0].length / 2, k;
  function fi(n) { return ((n % N) + N) % N; }
  A.el('line', { x1: 126, y1: FLY, x2: 578, y2: FLY, stroke: '#3a3a3a', 'stroke-width': 4, 'stroke-linecap': 'round' }, rc);
  var gGoal = grp(rc), gBody = grp(rc), gPhys = grp(rc), gAct = grp(rc), gTau = grp(rc), gState = grp(rc);
  var goalO = [], goalI = [], simE = [], simF = [];
  for (k = 0; k < NG; k++) goalO.push(A.el('line', { stroke: G, 'stroke-linecap': 'round' }, gGoal));
  for (k = 0; k < NG; k++) goalI.push(A.el('line', { stroke: '#15230a', 'stroke-linecap': 'round' }, gGoal));
  for (k = 0; k < NG; k++) {
    simE.push(A.el('line', { stroke: '#0c0c0c', 'stroke-linecap': 'round' }, gBody));
    simF.push(A.el('line', { stroke: '#aeb2b9', 'stroke-linecap': 'round' }, gBody));
  }
  var aArc = [], aHead = [], tArc = [], tHead = [];
  for (k = 0; k < NA; k++) {
    aArc.push(line(gAct, '', G, 4)); aHead.push(A.el('path', { fill: G }, gAct));
    tArc.push(line(gTau, '', AM, 5)); tHead.push(A.el('path', { fill: AM }, gTau));
  }
  function arcTo(arcEl, headEl, cx, cy, r, a0, dA, w) {      // arc of radius r from angle a0 over dA (rad, + = clockwise on screen), arrow head at its end
    var e = a0 + dA, sg = dA >= 0 ? 1 : -1, h = w * 1.7;
    var xa = cx + r * Math.cos(a0), ya = cy + r * Math.sin(a0), xb = cx + r * Math.cos(e), yb = cy + r * Math.sin(e);
    A.set(arcEl, { d: 'M' + xa.toFixed(1) + ' ' + ya.toFixed(1) + ' A' + r + ' ' + r + ' 0 0 ' + (sg > 0 ? 1 : 0) + ' ' + xb.toFixed(1) + ' ' + yb.toFixed(1) });
    var tx = -Math.sin(e) * sg, ty = Math.cos(e) * sg, nx = Math.cos(e), ny = Math.sin(e);
    A.set(headEl, { d: 'M' + (xb + tx * h).toFixed(1) + ' ' + (yb + ty * h).toFixed(1) + ' L' + (xb - tx * h * 0.5 + nx * h).toFixed(1) + ' ' + (yb - ty * h * 0.5 + ny * h).toFixed(1) +
      ' L' + (xb - tx * h * 0.5 - nx * h).toFixed(1) + ' ' + (yb - ty * h * 0.5 - ny * h).toFixed(1) + ' Z' });
  }
  function wrap(a) { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; }
  // physics: gravity at the centre of mass, one contact force under each foot (lengths in newtons)
  var gravU = line(gPhys, '', '#0c0c0c', 9), grav = line(gPhys, '', '#fff', 4), cfor = [line(gPhys, '', '#fff', 4), line(gPhys, '', '#fff', 4)];
  var gravLab = T(gPhys, 0, 0, 'gravity', 21, '#fff', 700, 'end', true);
  T(gPhys, CX + 76, FLY + 36, 'contact forces', 21, '#fff', 700);
  var sdots = [];
  for (k = 0; k < NJ; k++) sdots.push(A.el('circle', { r: 6.5, fill: G, stroke: '#000', 'stroke-width': 2.5 }, gState));
  var sring = [];
  for (k = 0; k < NJ; k++) sring.push(A.el('circle', { r: 6.5, fill: 'none', stroke: G, 'stroke-width': 2.5 }, gState));
  var labG = T(gGoal, 0, 0, mi('g'), 32, G, 700, 'start', true), labA = T(gAct, 0, 0, mi('a'), 32, G, 700, 'start', true);
  var labT = T(gTau, 0, 0, mi('τ'), 32, AM, 700, 'end', true), labS = T(gState, 0, 0, mi('s'), 32, G, 700, 'start', true);
  var LEG = [
    ['g', G, 'Goal', 'what should happen: here, the pose drawn in green'],
    ['a', G, 'Action', 'the policy’s answer: one target angle for every joint'],
    ['τ', AM, 'Torque', 'PD control pulls each joint toward its target, like a damped spring'],
    ['s′', '#fff', 'Physics', 'gravity, contact forces and momentum decide what really happens'],
    ['s', G, 'State', 'the new joint angles and velocities go back to the policy']
  ];
  var LX = 650, legend = LEG.map(function (r, n) {
    var y = 536 + n * 82, g = grp(rc);
    A.el('rect', { x: LX, y: y, width: 66, height: 66, rx: 13, fill: '#161616', stroke: r[1], 'stroke-width': 2 }, g);
    var fill = A.el('rect', { x: LX, y: y, width: 66, height: 66, rx: 13, fill: r[1], opacity: 0 }, g);
    var sym = T(g, LX + 33, y + 45, mi(r[0]), 34, r[1], 700, 'middle');
    T(g, LX + 94, y + 28, r[2], 28, '#fff', 700);
    T(g, LX + 94, y + 60, r[3], 24, C.mid, 400);
    return { g: g, fill: fill, sym: sym, col: r[1], val: T(g, 1796, y + 28, '', 24, r[1] === AM ? AM : (n === 3 ? '#fff' : G), 700, 'end') };
  });
  T(rc, LX, 966, 'Really simulated (MuJoCo, 30 Hz). The policy here is hand-written: copy the goal’s joint angles, keep the balance.', 20, C.mid, 500);

  // ------------------------------------------------------------------ step 4: one paper = one choice per row
  var links = grp(), link = [line(links, '', AM, 4), line(links, '', AM, 4)];
  var sdot = dot(G), gdot = dot(G), wdot = dot(G);
  var rows = Array.prototype.map.call(sec.querySelectorAll('.ln-row'), function (r) {
    return { row: r, items: Array.prototype.slice.call(r.querySelectorAll('.ln-o, .ln-ar')), chips: Array.prototype.slice.call(r.querySelectorAll('.ln-o')) };
  });
  var keys = Array.prototype.slice.call(sec.querySelectorAll('.ln-lens .k'));
  var tabs = Array.prototype.slice.call(sec.querySelectorAll('.ln-pp'));
  function chipText(r, n) { var b = rows[r] && rows[r].chips[n] && rows[r].chips[n].querySelector('b'); return b ? b.innerHTML.replace(/<i>(.*?)<\/i>/g, function (m, s) { return mi(s); }) : ''; }
  function boxOf(c) { var x = 0, y = 0, n = c; while (n && n !== sec) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x: x, y: y, w: c.offsetWidth, h: c.offsetHeight }; }
  function elbow(a, b) {                   // from the bottom of chip a to the top of chip b, through the gutter between the two rows
    var xa = a.x + a.w / 2, ya = a.y + a.h + 3, xb = b.x + b.w / 2, yb = b.y - 3, ym = (ya + yb) / 2, dx = xb - xa, r = Math.min(9, Math.abs(dx) / 2, (yb - ya) / 2), s = dx > 0 ? 1 : -1;
    if (Math.abs(dx) < 2) return 'M' + xa + ' ' + ya + ' L' + xb + ' ' + yb;
    return 'M' + xa + ' ' + ya + ' L' + xa + ' ' + (ym - r) + ' Q' + xa + ' ' + ym + ' ' + (xa + s * r) + ' ' + ym + ' L' + (xb - s * r) + ' ' + ym + ' Q' + xb + ' ' + ym + ' ' + xb + ' ' + (ym + r) + ' L' + xb + ' ' + yb;
  }

  return function draw(f) {
    var ph = P0 + f.t / LAP, p = ph - Math.floor(ph), lap = Math.floor(ph), st = f.step, ts = f.ts, n, j;
    // --- the signal
    var gl = [win(p, 0.84, 0.90), win(p, 0, 0.10), win(p, 0.19, 0.28), win(p, 0.37, 0.50), win(p, 0.59, 0.66)];
    for (n = 0; n < 5; n++) A.show(glow[n], gl[n]);
    var W = [[0.90, 1], [0.10, 0.19], [0.28, 0.37], [0.50, 0.59]], on = 0, wp = null;
    for (n = 0; n < 4; n++) {
      var a = win(p, W[n][0], W[n][1]);
      setFill(wires[n].lab, 'w' + n, a > 0.5 ? '#fff' : G);
      if (n > 0 && p >= W[n][0] && p < W[n][1]) { on = 1; wp = [A.lerp(wires[n].x0, wires[n].x1 - 4, A.ramp(p, W[n][0], W[n][1])), WY]; }
    }
    place(wdot, wp, on);
    place(gdot, [A.lerp(wires[0].x0, wires[0].x1 - 4, A.ramp(p, 0.90, 1)), WY], p >= 0.90 ? 1 : 0);
    var fb = win(p, 0.66, 0.88);
    place(sdot, along(FB, A.ramp(p, 0.66, 0.88)), p >= 0.66 && p < 0.88 ? 1 : 0);
    setFill(fbLab, 'fb', fb > 0.5 ? '#fff' : G);
    // control step being executed in this lap: ci (-1 before the first policy query); steps finished: the count goes up when the simulator hands out s'
    var ci = lap - 1, done = Math.max(0, p >= 0.5 ? ci + 1 : ci);
    setText(counter, 'cnt', 'step ' + done + '  ·  ' + (done / D.hz).toFixed(2) + ' s at ' + D.hz + ' Hz  ·  slowed 100×');

    // --- step 4: which paper is on
    var np = PAPERS.length, pi = -1, pv_ = 0, HOLD = HOLDLAPS * LAP;
    if (st >= 4 && np) { pi = Math.floor(ts / HOLD) % np; var tt = ts - Math.floor(ts / HOLD) * HOLD; pv_ = A.ramp(tt, 0, 0.25) * (1 - A.ramp(tt, HOLD - 0.2, HOLD)); }
    var cur = pi >= 0 ? PAPERS[pi] : null;

    // --- the three design choices on the loop
    var o1 = st > 1 ? 1 : (st === 1 ? A.ease(A.ramp(ts, 0.05, 0.7)) : 0), o2 = st > 2 ? 1 : (st === 2 ? A.ease(A.ramp(ts, 0.05, 0.7)) : 0), o3 = st > 3 ? 1 : (st === 3 ? A.ease(A.ramp(ts, 0.05, 0.7)) : 0);
    A.show(m1, o1); A.show(m2, o2); A.show(m3, o3);
    var blink = function (s_) { return st === s_ ? 0.55 * (1 - A.ramp(ts, 0.7, 2.0)) * (0.5 + 0.5 * Math.cos(ts * 7)) : 0; };     // the new marker blinks for two seconds after its click
    A.show(p1.flash, Math.max(blink(1), o1 * 0.5 * win(p, 0.90, 0.99)));                                                       // ... and (1) lights up every lap, when the score arrives
    A.show(p2.flash, blink(2)); A.show(p3.flash, blink(3));
    place(rdot, along(RW, A.ramp(p, 0.66, 0.90)), o1 && p >= 0.66 && p < 0.90 ? o1 : 0);
    for (n = 0; n < 3; n++) {
      var pl = [p1, p2, p3][n], html = cur ? chipText(n, cur.c[n]) : PBASE[n];
      setText(pl.txt, 'pill' + n, html);
      A.show(pl.txt, cur ? 0.25 + 0.75 * pv_ : 1);
    }

    // --- step 0: the loop on the simulated body
    rc.style.display = st === 0 ? '' : 'none';
    if (st === 0) {
      var act = [win(p, 0.86, 1), win(p, 0, 0.19), win(p, 0.19, 0.37), win(p, 0.37, 0.59), win(p, 0.59, 0.86)];
      var i0 = fi(ci), i1 = fi(ci + 1), u = ci < 0 ? 1 : A.ease(A.ramp(p, 0.38, 0.50));       // the simulator moves the body from frame i0 to i1
      var gs = A.ease(A.ramp(p, 0.86, 0.92));                                                // a new goal arrives when the Goal box lights up
      var S0 = D.sim[i0], S1 = D.sim[i1], G0 = D.goal[i0], G1 = D.gprev[i1], G2 = D.goal[i1], ord = D.ord[u < 0.5 ? i0 : i1];
      var gv = function (q) { var b = G0[q] + (G1[q] - G0[q]) * u; return b + (G2[q] - b) * gs; };
      for (n = 0; n < NG; n++) {
        var g = ord[n], w = 2 * SC * D.rad[g], q = 4 * g;
        var b = { x1: CX + SC * A.lerp(S0[q], S1[q], u), y1: FLY + SC * A.lerp(S0[q + 1], S1[q + 1], u), x2: CX + SC * A.lerp(S0[q + 2], S1[q + 2], u), y2: FLY + SC * A.lerp(S0[q + 3], S1[q + 3], u) };
        b['stroke-width'] = (w + 3).toFixed(1); A.set(simE[n], b);
        b['stroke-width'] = w.toFixed(1); A.set(simF[n], b);
        var c = { x1: CX + SC * gv(q), y1: FLY + SC * gv(q + 1), x2: CX + SC * gv(q + 2), y2: FLY + SC * gv(q + 3) };
        c['stroke-width'] = (w + 1).toFixed(1); A.set(goalO[n], c);
        c['stroke-width'] = Math.max(1, w - 5).toFixed(1); A.set(goalI[n], c);
      }
      A.show(gGoal, 0.6 + 0.4 * act[0]);
      var hq = 4 * D.geoms.indexOf('hand_left');
      A.set(labG, { x: CX + SC * gv(hq + 2) + 22, y: FLY + SC * gv(hq + 3) + 12 });
      // a (green): from where each limb is to where the goal wants it; tau (amber): the motor torque of this step
      var aOn = ci < 0 ? 0 : A.ramp(p, 0.02, 0.05) * (1 - A.ramp(p, 0.38, 0.46)), aGrow = A.ease(A.ramp(p, 0.03, 0.13));
      var tOn = ci < 0 ? 0 : A.ramp(p, 0.19, 0.22) * (1 - A.ramp(p, 0.40, 0.50)), tGrow = A.ease(A.ramp(p, 0.20, 0.30));
      var AR = D.arc[i0], TQ = D.tau[i0], la = null;
      for (n = 0; n < NA; n++) {
        var cx = CX + SC * AR[4 * n], cy = FLY + SC * AR[4 * n + 1], a0 = AR[4 * n + 2], dA = wrap(AR[4 * n + 3] - a0);
        var va = aOn && Math.abs(dA) > 0.12 ? 1 : 0;                                              // under 7 degrees the arrow head would be all there is
        if (va) arcTo(aArc[n], aHead[n], cx, cy, 54, a0, dA * aGrow, 4);
        A.show(aArc[n], va); A.show(aHead[n], va && aGrow > 0.25 ? 1 : 0);
        if (n === 2 && va && Math.abs(dA) > 0.6) la = [cx + 76 * Math.cos(a0 + dA * 0.5), cy + 76 * Math.sin(a0 + dA * 0.5)];
        var dT = A.clamp(TQ[n] / 20, -1.1, 1.1) * 2.2, vt = tOn && Math.abs(TQ[n]) > 1.5 ? 1 : 0;      // 126 degrees of arc for 20 N·m,
        if (vt) arcTo(tArc[n], tHead[n], cx, cy, 34, a0 + (dT > 0 ? 0.32 : -0.32), dT * tGrow, 5);    // starting at the edge of the limb
        A.show(tArc[n], vt); A.show(tHead[n], vt && tGrow > 0.25 ? 1 : 0);
      }
      A.show(gAct, aOn * (0.6 + 0.4 * act[1])); A.show(gTau, tOn * (0.6 + 0.4 * act[2]));
      if (la) A.set(labA, { x: la[0] - 6, y: la[1] + 12 });
      A.show(labA, la ? 1 : 0);
      A.set(labT, { x: CX + SC * AR[0] - 30, y: FLY + SC * AR[1] - 34 });
      A.show(labT, Math.abs(TQ[0]) > 1.5 ? 1 : 0);
      // physics (white): weight at the centre of mass, the floor pushing back under each foot
      var c0 = D.com[i0], c1 = D.com[i1], gx = CX + SC * A.lerp(c0[0], c1[0], u), gy = FLY + SC * A.lerp(c0[1], c1[1], u), gl_ = D.mg * FPX;
      var gd = 'M' + gx.toFixed(1) + ' ' + gy.toFixed(1) + ' V' + (gy + gl_ - 2).toFixed(1) + ' ' + head(gx, gy + gl_, 0, 1);
      A.set(gravU, { d: gd }); A.set(grav, { d: gd });
      A.set(gravLab, { x: gx - 50, y: gy + gl_ + 28 });
      var pi_ = ci < 0 ? -1 : (p >= 0.37 ? ci : ci - 1), F = pi_ < 0 ? [D.mg / 2, D.mg / 2] : D.cf[fi(pi_)];           // before the first step: standing still
      for (n = 0; n < 2; n++) {
        var fx = CX + SC * A.lerp(D.foot[i0][2 * n], D.foot[i1][2 * n], u), fl = F[n] * FPX;
        A.set(cfor[n], { d: 'M' + fx.toFixed(1) + ' ' + (FLY + 8 + fl).toFixed(1) + ' V' + (FLY + 10) + ' ' + head(fx, FLY + 8, 0, -1) });
      }
      A.show(gPhys, 0.45 + 0.55 * act[3]);
      // state (green dots): the joints of the new state, flashing when the State box lights up
      var J0 = D.ja[i0], J1 = D.ja[i1], fl_ = A.ramp(p, 0.59, 0.80);
      for (n = 0; n < NJ; n++) {
        var jx = CX + SC * A.lerp(J0[2 * n], J1[2 * n], u), jy = FLY + SC * A.lerp(J0[2 * n + 1], J1[2 * n + 1], u);
        A.set(sdots[n], { cx: jx.toFixed(1), cy: jy.toFixed(1) });
        A.set(sring[n], { cx: jx.toFixed(1), cy: jy.toFixed(1), r: (6.5 + 15 * A.ease(fl_)).toFixed(1) });
        A.show(sring[n], p >= 0.59 && p < 0.80 ? 1 - fl_ : 0);
      }
      A.set(labS, { x: CX + SC * A.lerp(J0[12], J1[12], u) + 26, y: FLY + SC * A.lerp(J0[13], J1[13], u) + 11 });       // next to the left knee
      A.show(gState, 0.55 + 0.45 * act[4]);
      // legend: the line of the signal that is travelling lights up; the numbers are those of the simulated step
      for (n = 0; n < 5; n++) {
        A.show(legend[n].g, 0.62 + 0.38 * act[n]); A.show(legend[n].fill, act[n]);
        setFill(legend[n].sym, 'lg' + n, act[n] > 0.5 ? '#000' : legend[n].col);
      }
      var ig = fi(p >= 0.89 ? ci + 1 : ci), ia = p >= 0.03 ? ci : ci - 1, it = p >= 0.20 ? ci : ci - 1;                  // each number changes when its arc is drawn
      setText(legend[0].val, 'v0', D.goals[Math.floor(ig / D.hold) % D.goals.length]);
      setText(legend[1].val, 'v1', ia < 0 ? '' : 'shoulder: ' + Math.round(D.togo[fi(ia)]) + '° to go');
      setText(legend[2].val, 'v2', it < 0 ? '' : 'shoulder: ' + D.tmag[fi(it)].toFixed(1) + ' N·m');
      setText(legend[3].val, 'v3', 'floor ' + Math.round(F[0] + F[1]) + ' N  ·  weight ' + Math.round(D.mg) + ' N');
    }

    // --- frames of the rows still to come
    for (n = 0; n < slot.length; n++) {
      var so = (st >= 1 && st < n + 2) ? (st === 1 ? A.ramp(ts, 0.1, 0.6) : 1) : 0;
      if (so > 0 && keys[n + 1] && rows[n + 1]) {
        var kb = boxOf(keys[n + 1]), vb = boxOf(rows[n + 1].row);
        A.set(slot[n].box, { x: kb.x + 1, y: kb.y + 1, width: vb.x + vb.w - kb.x - 2, height: kb.h - 2 });
        A.set(slot[n].ring, { cx: kb.x + 46, cy: kb.y + kb.h / 2 }); A.set(slot[n].num, { x: kb.x + 46, y: kb.y + kb.h / 2 + 8 });
      }
      A.show(slot[n].g, so);
    }

    // --- the rows: options appear left to right, then one choice per row is picked out
    for (n = 0; n < rows.length; n++) {
      var it_ = rows[n].items, sk = n + 1;
      for (j = 0; j < it_.length; j++) {
        var cc = Math.floor((j + 1) / 2), d0 = 0.3 + 0.34 * cc - (j % 2 ? 0.12 : 0);     // items alternate chip, arrow, chip, ...
        it_[j].style.opacity = st === sk ? A.ramp(ts, d0, d0 + 0.3) : 1;
      }
      for (j = 0; j < rows[n].chips.length; j++) rows[n].chips[j].classList.toggle('ln-h', !!cur && cur.c[n] === j);
    }
    for (n = 0; n < tabs.length; n++) tabs[n].classList.toggle('ln-h', n === pi);
    if (cur && rows.length === 3) {
      var bx = [0, 1, 2].map(function (r) { return boxOf(rows[r].chips[cur.c[r]]); });
      for (n = 0; n < 2; n++) A.set(link[n], { d: elbow(bx[n], bx[n + 1]) });
      A.show(links, pv_);
    } else A.show(links, 0);
  };
});
