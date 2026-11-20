/*! The advantage along one rollout (slide 01_12_pg.py, row 2).
 *  Illustrative numbers, real arithmetic: rewards r_t in [0, 1], critic values V(s_t), discount 0.95 (DeepMimic's).
 *  Dashed: what the critic predicted, V(s_t).  Dot: what happened, r_t + 0.95 V(s_{t+1}).  Bar between them: the advantage.
 *  The character stumbles at step 9 (A = -4.75) and catches itself at step 12 (A = +3.675). */
DeckAnim.register('pg-adv', function (el, A) {
  'use strict';
  var K = window.PGKit, GAMMA = 0.95, T = 24;
  var V = [16.0, 16.2, 15.9, 16.1, 16.3, 16.0, 15.8, 16.1, 15.9, 16.0, 11.0, 10.6, 10.5, 14.5, 15.4, 16.0, 16.2, 15.9, 16.1, 16.0, 15.8, 16.0, 16.2, 16.0, 16.0];
  var R = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.35, 0.30, 0.40, 0.65, 0.75, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8];
  var got = [], adv = [], t;
  for (t = 0; t < T; t++) { got.push(R[t] + GAMMA * V[t + 1]); adv.push(got[t] - V[t]); }
  var THIN = String.fromCharCode(0x2009);      // hair space: the italic V leans into the bracket
  var BAD = 9, GOOD = 12, STEP = 0.24, PAUSE = 1.5, LOOP = 12.4;
  function X(i) { return 80 + i * 33.5; }
  function Y(v) { return 152 - (v - 9.5) * 14; }
  function when(i) { return 0.5 + STEP * i + (i > BAD ? PAUSE : 0) + (i > GOOD ? PAUSE : 0); }

  // legend (top) and axis (bottom)
  A.el('line', { x1: 80, y1: 18, x2: 122, y2: 18, stroke: A.C.white, 'stroke-width': 3, 'stroke-dasharray': '5 7', 'stroke-linecap': 'round' }, el);
  A.set(A.text(el, 132, 25, '', { size: 20, halo: false }), { html: 'critic predicted: ' + K.mi('V') + THIN + '(' + K.mi('s') + K.sub('t') + ')' });
  A.el('circle', { cx: 452, cy: 18, r: 6, fill: A.C.mid }, el);
  A.set(A.text(el, 468, 25, '', { size: 20, halo: false }), { html: 'what happened: ' + K.mi('r') + K.sub('t') + ' + ' + K.mi('γ') + K.mi('V') + THIN + '(' + K.mi('s') + K.sub('t+1') + ')' });
  A.el('path', { d: 'M62 162 H868 ' + K.head(868, 162, 1, 0, 10), fill: 'none', stroke: A.C.line, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  A.el('text', { x: 62, y: 196, style: 'font:500 20px ' + A.FONT + ';fill:' + A.C.mid, text: 'one rollout, step by step' }, el);
  A.set(A.el('text', { x: 868, y: 196, 'text-anchor': 'end', style: 'font:500 20px ' + A.FONT + ';fill:' + A.C.mid }, el),
        { html: 'the gap is the advantage ' + K.mi('Â') + K.sub('t') });

  // prediction curve, revealed with the cursor through a clip rectangle
  var uid = 'pg-adv-clip';
  var defs = A.el('defs', null, el), cp = A.el('clipPath', { id: uid }, defs), cr = A.el('rect', { x: 0, y: 0, width: 0, height: 204 }, cp);
  var pts = []; for (t = 0; t < T; t++) pts.push([X(t), Y(V[t])]);
  var pred = A.el('path', { d: A.path(pts), fill: 'none', stroke: A.C.white, 'stroke-width': 3, 'stroke-dasharray': '5 7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'clip-path': 'url(#' + uid + ')' }, el);
  var cursor = A.el('line', { y1: 40, y2: 162, stroke: A.C.mute, 'stroke-width': 2 }, el);
  var bars = [], dots = [];
  for (t = 0; t < T; t++) {
    var c = adv[t] > 0 ? A.C.g : A.C.amber;
    bars.push(A.el('line', { x1: X(t), x2: X(t), y1: Y(V[t]), stroke: c, 'stroke-width': 9 }, el));
    dots.push(A.el('circle', { cx: X(t), r: 6, fill: c, stroke: '#101010', 'stroke-width': 2 }, el));
  }
  var lBad = A.text(el, X(BAD) - 13, 124, '', { size: 21, anchor: 'end', fill: A.C.amber });
  A.set(lBad, { html: 'stumbles: ' + K.mi('Â') + ' = ' + K.fmt(adv[BAD], 1) });
  var lGood = A.text(el, X(GOOD) + 15, 142, '', { size: 21, fill: A.C.g });
  A.set(lGood, { html: 'catches itself: ' + K.mi('Â') + ' = +' + K.fmt(adv[GOOD], 1) });

  function frame(ts) {
    var u = A.loop(ts, LOOP), fade = 1 - A.ramp(u, LOOP - 0.5, LOOP - 0.1), cx = X(0);
    for (var i = 0; i < T; i++) {
      var p = A.ease(A.ramp(u, when(i), when(i) + 0.22)), y = A.lerp(Y(V[i]), Y(got[i]), p);
      A.set(bars[i], { y2: y }); A.set(dots[i], { cy: y });
      A.show(bars[i], p > 0 ? fade : 0); A.show(dots[i], p > 0 ? fade : 0);
      if (u >= when(i)) cx = X(i) + (i < T - 1 ? 33.5 * A.ramp(u, when(i + 1) - STEP, when(i + 1)) : 0);
    }
    if (u < when(0)) cx = X(0);
    A.set(cr, { width: cx + 2 }); A.show(pred, fade);
    A.set(cursor, { x1: cx, x2: cx }); A.show(cursor, u > when(T - 1) + 0.6 ? 0 : fade);
    A.show(lBad, A.ramp(u, when(BAD) + 0.15, when(BAD) + 0.5) * fade);
    A.show(lGood, A.ramp(u, when(GOOD) + 0.15, when(GOOD) + 0.5) * fade);
  }
  var STILL = 10.5;                        // the whole rollout scored
  return function draw(f) {
    frame((f.step === 2 || f.step >= f.steps) ? f.ts : STILL);
  };
});
