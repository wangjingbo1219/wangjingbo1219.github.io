/* Slide "InterMimic — how" (tools/slides/06b_40_intermimic.py):  <svg data-anim="intermimic-fix" viewBox="0 0 560 315">
 * SCHEMATIC, front view, not to scale, no values: a person standing behind a table lifts a box off it with both hands.
 *   green outline   the reference. Clicks 0-2: the mocap, whose hands hover beside the box ("contact floating"); click 3 on: the teacher's rollout.
 *   grey body       the simulated character.
 *     click 0  it copies the reference pose exactly: no hand touches, so the box stays on the table while the reference box rises
 *     click 1  the teacher (paid for body AND object): the hands close the gap, the box follows its reference
 *     click 2  the contact labels of the reference, shown on the body parts (Xu et al. 2025, Fig. 3(i), Supp. C.1 and D.2):
 *              amber = promote contact   (the object is airborne but does not fall, so somebody holds it: the parts closest to it)
 *              grey  = neutral           (closer than 10 cm in the reference, but not the closest: forearms, and the torso the box is held against)
 *              blue  = penalize contact  (farther than 10 cm in the reference)
 *     click 3  the green outline snaps onto the teacher's simulated hands: the teacher's rollout is the new reference
 *     click 4  the grey body is the student, which tracks that reference
 * The scene restarts at every click (clock = f.ts; from click 3 on it starts in the lifted pose, where the snap is visible). The reward formula and its term chips sit in the bottom strip and arrive with their click.
 */
DeckAnim.register('intermimic-fix', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, AM = C.amber, BODY = '#9aa0a8', OFF = '#4d9fcb', BG = '#0c0c0c', L = 6;
  var CX = 280, PT = 252, BW = 118, BH = 76, GAP = 16, OPEN = 46, PW = 18, PH = 50, LIFT = 54, UA = 62, FA = 62;       // PT = table top
  var SH_Y = 100, SH_X = 58, HEAD_Y = 62, HAND_Y = PT - BH / 2, LX = 146, RX = 420;                                   // LX / RX = margin labels
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-weight:400;font-size:1.16em">' + s + '</tspan>'; };
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') }, p);
    n.innerHTML = s;
    return n;
  }
  function html(n, s) { if (n._s !== s) { n._s = s; n.innerHTML = s; } }
  function fill(n, c) { if (n._f !== c) { n._f = c; n.setAttribute('fill', c); } }
  function stroke(n, c) { if (n._k !== c) { n._k = c; n.setAttribute('stroke', c); } }
  function elbow(sx, sy, hx, hy, side) {                      // two-link arm, elbow bent outward (side = -1 left, +1 right)
    var dx = hx - sx, dy = hy - sy, d = Math.min(UA + FA - 1, Math.max(8, Math.hypot(dx, dy)));
    var a = (UA * UA - FA * FA + d * d) / (2 * d), h = Math.sqrt(Math.max(0, UA * UA - a * a)), ux = dx / d, uy = dy / d;
    var px = -uy, py = ux;
    if (px * side < 0) { px = -px; py = -py; }
    return [sx + a * ux + h * px, sy + a * uy + h * py];
  }

  // ---------------------------------------------------------------- a body = torso, shoulders, head (the table hides the rest) and two arms with palms
  function makeBody(parent, ring) {
    var g = A.el('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, parent), o = { g: g, parts: {} };
    function limb(name, w) {
      var p = {};
      if (ring) { p.a = A.el('path', { stroke: G, 'stroke-width': w + 5 }, g); p.b = A.el('path', { stroke: BG, 'stroke-width': w - 1 }, g); }
      else p.a = A.el('path', { stroke: BODY, 'stroke-width': w - 3 }, g);
      o.parts[name] = p;
      return p;
    }
    limb('torso', 40); limb('sh', 18);
    o.head = ring ? [A.el('circle', { r: 18.5, fill: G, stroke: 'none' }, g), A.el('circle', { r: 15.5, fill: BG, stroke: 'none' }, g)]
                  : [A.el('circle', { r: 14.5, fill: BODY, stroke: 'none' }, g)];
    return o;
  }
  function makeArms(parent, ring) {
    var g = A.el('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, parent), o = { g: g, parts: {} };
    ['uaL', 'uaR', 'faL', 'faR'].forEach(function (name) {
      var p = {};
      if (ring) { p.a = A.el('path', { stroke: G, 'stroke-width': 20 }, g); p.b = A.el('path', { stroke: BG, 'stroke-width': 14 }, g); }
      else p.a = A.el('path', { stroke: BODY, 'stroke-width': 12 }, g);
      o.parts[name] = p;
    });
    ['palmL', 'palmR'].forEach(function (name) {
      o.parts[name] = ring ? { a: A.el('rect', { width: PW + 4, height: PH + 4, rx: 8, fill: BG, stroke: G, 'stroke-width': 3 }, g) }
                           : { a: A.el('rect', { width: PW - 2, height: PH - 2, rx: 6, fill: BODY, stroke: 'none' }, g) };
    });
    return o;
  }
  function d2(n, d) { A.set(n.a, { d: d }); if (n.b) A.set(n.b, { d: d }); }
  function poseBody(b) {
    d2(b.parts.torso, 'M' + CX + ' ' + (SH_Y + 12) + 'L' + CX + ' ' + (PT - 13));
    d2(b.parts.sh, 'M' + (CX - SH_X + 8) + ' ' + SH_Y + 'L' + (CX + SH_X - 8) + ' ' + SH_Y);
    b.head.forEach(function (h) { A.set(h, { cx: CX, cy: HEAD_Y }); });
  }
  /** arms for a hand gap (distance palm surface to box side) and a hand height */
  function poseArms(b, gap, hy, ring) {
    [-1, 1].forEach(function (s) {
      var sx = CX + s * SH_X, hx = CX + s * (BW / 2 + PW / 2 + gap), e = elbow(sx, SH_Y, hx, hy - 6, s), k = s < 0 ? 'L' : 'R';
      d2(b.parts['ua' + k], 'M' + sx + ' ' + SH_Y + 'L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1));
      d2(b.parts['fa' + k], 'M' + e[0].toFixed(1) + ' ' + e[1].toFixed(1) + 'L' + hx.toFixed(1) + ' ' + (hy - 8).toFixed(1));
      var w = ring ? PW + 4 : PW - 2, h = ring ? PH + 4 : PH - 2;
      A.set(b.parts['palm' + k].a, { x: (hx - w / 2).toFixed(1), y: (hy - h / 2).toFixed(1) });
    });
  }

  // draw order: reference body, simulated body, table, boxes, reference arms, simulated arms, marks, text
  var refB = makeBody(el, true), simB = makeBody(el, false);
  poseBody(refB); poseBody(simB);
  A.el('rect', { x: CX - 150, y: PT, width: 300, height: 12, rx: 4, fill: '#2b2b2b', stroke: '#565656', 'stroke-width': 2 }, el);
  var refBox = A.el('rect', { x: CX - BW / 2, width: BW, height: BH, rx: 6, fill: G, 'fill-opacity': 0.1, stroke: G, 'stroke-width': 3, 'stroke-dasharray': '7 6' }, el);
  var simBox = A.el('rect', { x: CX - BW / 2 + 5, width: BW - 10, height: BH - 5, rx: 4, fill: '#d9d9d9', stroke: 'none' }, el);      // 5 px inside the reference box, bottom flush: it rests on the table
  var gapL = A.el('rect', { width: GAP, height: PH - 6, fill: AM, 'fill-opacity': 0.85 }, el), gapR = A.el('rect', { width: GAP, height: PH - 6, fill: AM, 'fill-opacity': 0.85 }, el);
  var refA = makeArms(el, true), simA = makeArms(el, false);
  var touchL = A.el('line', { stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round' }, el), touchR = A.el('line', { stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round' }, el);

  // ---------------------------------------------------------------- legend (top), labels (margins), reward strip (bottom)
  A.el('rect', { x: 14, y: 11, width: 26, height: 15, rx: 7.5, fill: 'none', stroke: G, 'stroke-width': 3 }, el);
  var refT = txt(el, 50, 26, '', { fill: G, weight: 700 });
  A.el('rect', { x: 318, y: 11, width: 26, height: 15, rx: 7.5, fill: BODY }, el);
  var simT = txt(el, 354, 26, '', { fill: '#e6e6e6', weight: 700 });
  var labL = A.el('g', {}, el), labL1 = txt(labL, LX, 0, '', { anchor: 'end', weight: 700 }), labL2 = txt(labL, LX, 0, '', { anchor: 'end', weight: 700 });
  var leadL = A.el('path', { fill: 'none', 'stroke-width': 2, 'stroke-linecap': 'round' }, labL);
  var labR = A.el('g', {}, el), labR1 = txt(labR, RX, 0, '', { weight: 700 }), labR2 = txt(labR, RX, 0, '', { weight: 700 });
  var leadR = A.el('path', { fill: 'none', 'stroke-width': 2, 'stroke-linecap': 'round' }, labR);
  var leg = A.el('g', {}, el);
  [['touch', AM], ['neutral', BODY], ['keep off', OFF]].forEach(function (it, i) {
    A.el('circle', { cx: RX + 10, cy: 113 + 30 * i, r: 8, fill: it[1] }, leg);
    txt(leg, RX + 26, 120 + 30 * i, it[0], { fill: '#e6e6e6' });
  });
  var strip = A.el('g', {}, el);
  txt(strip, 14, 302, MI('R') + ' = exp(−Σ ' + MI('λE') + ')', { size: 21, fill: '#e6e6e6' });
  function chip(x, w, label) {
    var g = A.el('g', {}, strip);
    var r = A.el('rect', { x: x, y: 281, width: w, height: 28, rx: 14, fill: '#1b1503', stroke: AM, 'stroke-width': 2 }, g);
    txt(g, x + w / 2, 302, label, { anchor: 'middle', fill: AM, weight: 700 });
    return { g: g, r: r };
  }
  var chips = [chip(206, 78, 'body'), chip(296, 92, 'object'), chip(400, 104, 'contact')];
  var ZC = { touch: AM, free: BODY, off: OFF };

  return function draw(f) {
    var st = f.step, ts = f.ts, u = A.loop(st >= 3 ? ts + 2.6 : ts, L);        // from click 3 on the scene starts with the box held up
    var grip = A.ease(A.ramp(u, 0, 0.8)) - A.ease(A.ramp(u, 5.4, 6));
    var lift = LIFT * (A.ease(A.ramp(u, 1.1, 2.5)) - A.ease(A.ramp(u, 3.9, 5.1)));
    var hy = HAND_Y - lift;
    // reference: mocap (hands float by GAP) until click 3, then the outline snaps onto the teacher's rollout (gap 0)
    var snap = st > 3 ? 1 : (st === 3 ? A.ease(A.ramp(ts, 0.4, 1.4)) : 0);
    var refGap = A.lerp(OPEN, GAP * (1 - snap), grip);
    var simGap = A.lerp(OPEN, st >= 1 ? 0 : GAP, grip);
    var simLift = st >= 1 ? lift : 0;
    poseArms(refA, refGap, hy, true); poseArms(simA, simGap, hy, false);
    A.set(refBox, { y: (PT - BH - lift).toFixed(1) });
    A.set(simBox, { y: (PT - BH + 5 - simLift).toFixed(1) });

    // the floating gap of the reference (amber strips between its palms and its box), while it grips
    var gv = (st <= 2 ? 1 : 1 - snap) * A.ramp(grip, 0.9, 1);
    A.set(gapL, { x: CX - BW / 2 - GAP, y: (hy - PH / 2 + 3).toFixed(1) }); A.set(gapR, { x: CX + BW / 2, y: (hy - PH / 2 + 3).toFixed(1) });
    A.show(gapL, st === 0 ? gv : 0.45 * gv); A.show(gapR, st === 0 ? gv : 0.45 * gv);
    // where the simulated palms really touch the simulated box
    var tv = st >= 1 ? A.ramp(grip, 0.97, 1) : 0, ty = hy;
    A.set(touchL, { x1: CX - BW / 2 + 1, x2: CX - BW / 2 + 1, y1: (ty - 17).toFixed(1), y2: (ty + 17).toFixed(1) });
    A.set(touchR, { x1: CX + BW / 2 - 1, x2: CX + BW / 2 - 1, y1: (ty - 17).toFixed(1), y2: (ty + 17).toFixed(1) });
    A.show(touchL, tv); A.show(touchR, tv);

    // click 2: contact labels of the reference, shown on the simulated body parts
    var air = lift > 1.5, near = refGap < 34, zone = st === 2;
    var zp = !zone ? 'free' : (air ? 'touch' : (near ? 'free' : 'off')), zf = !zone ? 'free' : (near ? 'free' : 'off'), zo = zone ? 'off' : 'free';
    ['palmL', 'palmR'].forEach(function (k) { fill(simA.parts[k].a, ZC[zp]); });
    ['faL', 'faR'].forEach(function (k) { stroke(simA.parts[k].a, ZC[zf]); });
    ['uaL', 'uaR'].forEach(function (k) { stroke(simA.parts[k].a, ZC[zo]); });
    stroke(simB.parts.sh.a, ZC[zo]);                                  // the torso stays neutral: the box is held close to it
    fill(simB.head[0], ZC[zo]);
    A.show(leg, zone ? A.ramp(ts, 0.1, 0.6) : 0);

    // legend
    html(refT, st >= 3 ? 'reference: teacher rollout' : 'reference: mocap');
    html(simT, st === 0 ? 'simulated copy' : (st <= 3 ? 'simulated: teacher' : 'simulated: student'));      // the student arrives with click 4

    // margin labels: left = what the hands do, right = what the box does
    var l1 = '', l2 = '', lc = '#fff', r1 = '', r2 = '', rc = '#fff', lv = 0, rv = 0, ly = 150, ry = 200, lead = '', leadr = '';
    var up = A.ramp(lift, 6, 20), gr = A.ramp(grip, 0.9, 1), top = (hy - PH / 2 - 4).toFixed(1);
    if (st === 0) {
      l1 = 'the hands'; l2 = 'float'; lc = AM; lv = gr; lead = 'M' + (LX + 4) + ' ' + (ly + 4) + 'L' + (CX - BW / 2 - GAP / 2) + ' ' + top;
      r1 = 'the box'; r2 = 'stays'; rc = AM; rv = up; leadr = 'M' + (RX - 6) + ' ' + (ry + 6) + 'L' + (CX + BW / 2 - 2) + ' ' + (PT - 30);
    } else if (st === 1) {
      l1 = 'the hands'; l2 = 'close the gap'; lv = gr; lead = 'M' + (LX + 4) + ' ' + (ly + 4) + 'L' + (CX - BW / 2 - PW / 2) + ' ' + top;
      r1 = 'the box'; r2 = 'follows'; rv = up; leadr = 'M' + (RX - 6) + ' ' + (ry + 6) + 'L' + (CX + BW / 2 - 14) + ' ' + (PT - BH / 2 - lift + 14).toFixed(1);
    } else if (st === 2) {
      l1 = 'in the air, not'; l2 = 'falling: held'; lc = AM; lv = up; lead = 'M' + (LX + 4) + ' ' + (ly + 4) + 'L' + (CX - BW / 2 + 8) + ' ' + (PT - BH - lift + 10).toFixed(1);
    } else {
      l1 = 'the reference'; l2 = 'is repaired'; lc = G; lv = (st === 3 ? snap : 1) * gr; lead = 'M' + (LX + 4) + ' ' + (ly + 4) + 'L' + (CX - BW / 2 - PW / 2) + ' ' + top;
    }
    html(labL1, l1); html(labL2, l2); A.set(labL1, { y: ly }); A.set(labL2, { y: ly + 26 });
    labL1.style.fill = lc; labL2.style.fill = lc;
    A.set(leadL, { d: lead || 'M0 0', stroke: lc }); A.show(labL, lv);
    html(labR1, r1); html(labR2, r2); A.set(labR1, { y: ry }); A.set(labR2, { y: ry + 26 });
    labR1.style.fill = rc; labR2.style.fill = rc;
    A.set(leadR, { d: leadr || 'M0 0', stroke: rc }); A.show(labR, r1 ? rv : 0);

    // reward strip: body and object arrive with click 1, contact with click 2; a chip pulses while its click is being explained
    A.show(strip, st >= 1 ? (st === 1 ? A.ramp(ts, 0, 0.5) : 1) : 0);
    chips.forEach(function (c, i) {
      var k = i < 2 ? 1 : 2, on = st > k ? 1 : (st === k ? A.ramp(ts, 0.1 + 0.5 * (i % 2), 0.6 + 0.5 * (i % 2)) : 0);
      var pulse = st === k && st < f.steps ? 0.5 + 0.5 * Math.sin(5 * ts - 1.2 * i) : 0;
      A.show(c.g, on); A.set(c.r, { 'stroke-width': (2 + 1.6 * pulse).toFixed(2) });
    });
  };
});
