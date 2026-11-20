/* MoConVQ, slide "tokens in use": who writes the tokens.   <svg data-anim="moconvq-tape" viewBox="0 0 1700 76">
 * One row of tokens, written in a different way at every click (one token = 0.2 s of motion):
 *   step 0   latent motion matching (Sec. 5.2): the tokens of ONE clip are played in order, with jumps to a similar token. SCHEMATIC:
 *            coloured chips, "similar" drawn as "same colour", the jumps are scripted. The arc of a jump stays for a few tokens.
 *   step 1   MoConGPT (Sec. 4.3): one token after another, and inside a token one residual layer after another. SCHEMATIC chips, no numbers;
 *            three of the residual layers are drawn.
 *   step 2   an LLM in context (Sec. 5.5, Appendix B.1): Claude-2's answer to 'a person walks forward for a long time and kicks, then he
 *            begins to dance'. THE PAPER'S INTEGERS: the walk group written 4 times, the 10 kick tokens, the first 6 of 41 dance tokens.
 *   step 3+  an abstract task (Sec. 5.5, Appendix B.2): the eight moves Claude-2 plans for "a key on the ground, a door, sit on the chair",
 *            with THE PAPER'S INTEGERS for every move.
 * Integers of the 'walk forward' example (297, 471, 246, 463) are green wherever they come back.
 */
DeckAnim.register('moconvq-tape', function (el, A) {
  'use strict';
  var C = A.C, CY = 14, CH = 32, PW = 46, PITCH = 49, LY = 71;
  var PAL = ['#4fc3f7', '#c58cff', '#f5b301', '#76B900', '#ffffff', '#d6e86b'];
  var WALK = { 297: 1, 471: 1, 246: 1, 463: 1 };
  function txt(p, x, y, s, o) {
    o = o || {};
    return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', text: s,
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || C.mid) }, p);
  }
  var ramp = A.ramp, i, j;

  // ------------------------------------------------------------------ step 0: one clip's tokens, replayed with jumps
  var g0 = A.el('g', {}, el), N0 = 34, r0 = A.rand(5), col0 = [], chip0 = [];
  for (i = 0; i < N0; i++) { var c0 = Math.floor(r0() * PAL.length); if (i && c0 === col0[i - 1]) c0 = (c0 + 1 + Math.floor(r0() * (PAL.length - 1))) % PAL.length; col0.push(c0); }
  var SEGS = [[0, 12], [21, 30], [6, 16], [25, 33]], order = [], jumpAt = {};        // played in this order; a jump joins two tokens of one colour
  col0[21] = col0[12]; col0[6] = col0[30]; col0[25] = col0[16]; col0[0] = col0[33];
  SEGS.forEach(function (s) { for (var n = s[0]; n <= s[1]; n++) order.push(n); jumpAt[order.length - 1] = 1; });
  for (i = 0; i < N0; i++) chip0.push(A.el('rect', { x: i * PITCH, y: CY, width: PW, height: CH, rx: 7, fill: PAL[col0[i]] }, g0));
  var arc = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, g0);
  var arcHead = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g0);
  var headBox = A.el('rect', { y: CY - 3, width: PW + 6, height: CH + 6, rx: 9, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, g0);
  txt(g0, 0, LY, 'the tokens of one dance clip · white frame: the token being decoded · arc: a jump to a similar token');

  // ------------------------------------------------------------------ step 1: MoConGPT writes token after token, layer by layer
  var g1 = A.el('g', {}, el), N1 = 34, r1 = A.rand(23), lay1 = [];
  for (i = 0; i < N1; i++) {
    var c = PAL[Math.floor(r1() * PAL.length)], ls = [];
    for (j = 0; j < 3; j++) ls.push(A.el('rect', { x: i * PITCH, y: CY + j * 11.5, width: PW, height: 9, rx: 3.5, fill: j ? PAL[Math.floor(r1() * PAL.length)] : c, 'fill-opacity': j ? 0.62 : 1 }, g1));
    lay1.push(ls);
  }
  var caret = A.el('rect', { y: CY - 3, width: 3, height: CH + 6, rx: 1.5, fill: '#fff' }, g1);
  txt(g1, 0, LY, 'one column = one token (0.2 s of motion) · its rows = residual layers, three of them drawn · colours stand for indices');

  // ------------------------------------------------------------------ steps 2 and 3: the integers an LLM wrote (paper, Appendix B)
  function numbers(groups, gap) {
    var g = A.el('g', {}, el), x = 0, items = [], n = 0;
    groups.forEach(function (gr, gi) {
      var x0 = x, part = { t0: 0, nodes: [] };
      gr.ids.forEach(function (id) {
        var cg = A.el('g', {}, g), wk = WALK[id];
        A.el('rect', { x: x, y: CY, width: PW, height: CH, rx: 7, fill: wk ? '#12200a' : '#161616', stroke: wk ? C.g : '#4a4a4a', 'stroke-width': 2 }, cg);
        A.el('text', { x: x + PW / 2, y: CY + 23, 'text-anchor': 'middle', text: String(id), style: 'font:700 20px ' + A.FONT + ';fill:' + (wk ? '#a8dc2f' : '#fff') }, cg);
        items.push({ node: cg, n: n++, g: gi }); x += PITCH;
      });
      if (gr.tail) { items.push({ node: txt(g, x + 4, CY + 24, gr.tail, { weight: 700, size: 22, fill: gr.tailFill || '#fff' }), n: n - 0.5, g: gi }); x += gr.tailW; }
      items.push({ node: txt(g, x0, LY, gr.label), n: n - 0.5, g: gi, label: true });
      x += gap;
    });
    return { g: g, items: items };
  }
  var g2 = numbers([
    { ids: [297, 471, 246, 463, 463], label: 'walk forward, written 4 times', tail: '× 4', tailW: 62, tailFill: C.amber },
    { ids: [145, 160, 223, 117, 424, 299, 178, 166, 330, 391], label: 'kick' },
    { ids: [472, 133, 132, 357, 492, 435], label: 'dance: 41 tokens, the first six shown', tail: '…', tailW: 30 }
  ], 34);
  var g3 = numbers([
    { ids: [297, 471, 246, 463, 463], label: 'walk to the key' },
    { ids: [246, 192, 408, 205, 205], label: 'pick it up' },
    { ids: [205, 198, 408], label: 'stand up' },
    { ids: [463, 297, 471, 246], label: 'walk to the door' },
    { ids: [129, 129, 433], label: 'turn the key' },
    { ids: [179, 179, 179], label: 'push the door' },
    { ids: [297, 471, 246, 463], label: 'walk through' },
    { ids: [241, 241, 241], label: 'sit down' }
  ], 20);
  /** integers appear one by one (dt apart, a pause between groups); settled when done */
  function typeOut(o, tt, dt, pause) {
    o.items.forEach(function (it) { A.show(it.node, ramp(tt, 0.3 + it.n * dt + it.g * pause, 0.42 + it.n * dt + it.g * pause)); });
  }

  return function draw(f) {
    var s = Math.min(f.step, 3), ts = f.step > 3 ? 1e3 : f.ts, fade = ramp(ts, 0, 0.35);
    A.show(g0, s === 0 ? 1 : 0); A.show(g1, s === 1 ? fade : 0); A.show(g2.g, s === 2 ? fade : 0); A.show(g3.g, s === 3 ? fade : 0);
    if (s === 0) {
      var TICK = 0.3, HOLD = 4, L = order.length, tt = Math.max(0, f.ts - 0.4), nt = Math.floor(tt / TICK), n = nt % L, u = tt / TICK - nt, cur = order[n];
      for (i = 0; i < N0; i++) A.show(chip0[i], i === cur ? 1 : 0.42);
      A.set(headBox, { x: cur * PITCH - 3 });
      // the last jump stays drawn for HOLD tokens, so that the eye can follow it: from the token that was left to the similar one playback went on from
      var back = -1;
      for (j = 0; j < HOLD && j < nt; j++) if (jumpAt[(n - j - 1 + 2 * L) % L]) { back = j; break; }
      if (back >= 0) {
        var from = order[(n - back - 1 + 2 * L) % L], to = order[(n - back + L) % L], age = back + u, o = 1 - ramp(age, HOLD - 1, HOLD);
        var a = from * PITCH + PW / 2, b = to * PITCH + PW / 2;
        A.set(arc, { d: 'M' + a + ' ' + (CY - 4) + 'C' + a + ' ' + (CY - 17) + ' ' + b + ' ' + (CY - 17) + ' ' + b + ' ' + (CY - 6) });
        A.set(arcHead, { d: 'M' + (b - 5) + ' ' + (CY - 11) + 'L' + b + ' ' + (CY - 5) + 'L' + (b + 5) + ' ' + (CY - 11) });
        A.show(arc, o); A.show(arcHead, o);
        if (from !== cur) A.show(chip0[from], 0.42 + 0.58 * (1 - ramp(age, 0.3, 1.5)));
      } else { A.show(arc, 0); A.show(arcHead, 0); }
    } else if (s === 1) {
      var DT = 0.26, last = -1;
      for (i = 0; i < N1; i++) for (j = 0; j < 3; j++) {
        var t0 = 0.4 + i * DT + j * 0.07, on = ramp(ts, t0, t0 + 0.06);
        A.show(lay1[i][j], on); if (on > 0) last = i;
      }
      A.set(caret, { x: Math.min(N1, last + 1) * PITCH - 1 });
      A.show(caret, last >= N1 - 1 && ts > 0.4 + N1 * DT + 0.4 ? 0 : (A.loop(ts, 0.7) < 0.42 ? 1 : 0.25));
    } else if (s === 2) typeOut(g2, ts, 0.15, 0.3);
    else typeOut(g3, ts, 0.1, 0.28);
  };
});
