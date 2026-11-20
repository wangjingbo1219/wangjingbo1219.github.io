/* "Billions of samples" card (506 x 130): how many simulation samples a controller costs, on a log axis.
 * Three stops, each a sourced number:  5.9e5  the standing policy of this slide (first PPO iteration whose episodes last the full 10 s;
 * tools/fig/rl_stand_train.py)  ·  6e7  one DeepMimic skill ("about 60 million samples", supplementary)  ·  1e10  ASE ("over 10 billion samples,
 * approximately 10 years in simulated time").  The practice time is samples / 30 per second (all three act 30 times a second). */
DeckAnim.register('rl-card-samples', function (el, A) {
  var K = window.RLKit, D = window.RLDemo, C = A.C;
  var XA = 20, XB = 478, Y0 = 92, X = function (v) { return XA + (v - 5) / 5 * (XB - XA); };
  var STOPS = [{ v: Math.log(D.samples_to_stand) / Math.LN10, name: 'to stand', time: '5.5 hours' }, { v: Math.log(6e7) / Math.LN10, name: 'one DeepMimic skill', time: '23 days' },
               { v: 10, name: 'ASE', time: '10 years' }];
  var sup = function (b, e) { return b + '<tspan dy="-9" style="font-size:.72em">' + e + '</tspan><tspan dy="9">​</tspan>'; };
  var i, head = K.text(el, 0, 24, '', 23, '#fff', 700);
  A.el('line', { x1: XA, y1: Y0, x2: XB, y2: Y0, stroke: C.line, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  var prog = A.el('line', { x1: XA, y1: Y0, x2: XA, y2: Y0, stroke: C.g, 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
  for (i = 5; i <= 10; i++) {
    A.el('line', { x1: X(i), y1: Y0 + 2, x2: X(i), y2: Y0 + 9, stroke: C.line, 'stroke-width': 2 }, el);
    K.text(el, X(i), Y0 + 34, sup('10', i), 20, C.mid, 500, 'middle');
  }
  STOPS.forEach(function (s, k) {
    s.dot = A.el('circle', { cx: X(s.v), cy: Y0, r: 8, fill: '#000', stroke: C.mute, 'stroke-width': 3 }, el);
    s.lab = K.text(el, k === 2 ? XB + 12 : X(s.v), Y0 - 22, s.name, 20, C.mute, 700, k === 2 ? 'end' : 'middle');
  });
  var cur = A.el('circle', { cy: Y0, r: 6, fill: '#fff' }, el);
  // everything that the sweep changes sits in one group, so that the loop can fade out and start over instead of jumping back
  var live = A.el('g', {}, el);
  [head, prog].concat(STOPS.map(function (s) { return s.dot; }), STOPS.map(function (s) { return s.lab; }), [cur]).forEach(function (n) { live.appendChild(n); });
  function when(v) {            // simulated practice at 30 samples per second, one significant digit
    var s = Math.pow(10, v) / 30, u = [[31557600, 'year'], [86400, 'day'], [3600, 'hour'], [60, 'minute']], k, x;
    for (k = 0; k < u.length; k++) if (s >= u[k][0]) { x = Number((s / u[k][0]).toPrecision(1)); return x + ' ' + u[k][1] + (x === 1 ? '' : 's'); }
    return '1 minute';
  }
  // the sweep: [t0, t1, from, to] moves, pauses in between
  var S = STOPS, SEG = [[0, 1.0, 5, S[0].v], [2.6, 4.0, S[0].v, S[1].v], [5.6, 7.0, S[1].v, S[2].v]], PERIOD = 11;
  return function draw(f) {
    var t = A.loop(f.step === 4 ? f.ts : f.t, PERIOD), v = 5, at = -1, k;
    A.show(live, Math.min(A.ramp(t, 0, 0.3), 1 - A.ramp(t, PERIOD - 0.5, PERIOD)).toFixed(2));
    for (k = 0; k < SEG.length; k++) {
      if (t >= SEG[k][0]) { v = A.lerp(SEG[k][2], SEG[k][3], A.ease(A.ramp(t, SEG[k][0], SEG[k][1]))); at = t >= SEG[k][1] ? k : -1; }
    }
    var m = Math.pow(10, v - Math.floor(v + 1e-9)), e = Math.floor(v + 1e-9);
    head.innerHTML = (m < 1.05 ? '' : m.toFixed(1) + ' × ') + sup('10', e) + ' samples <tspan style="fill:' + C.gbr + '">' +
                     '≈ ' + (at >= 0 ? S[at].time : when(v)) + ' of practice</tspan>';
    prog.setAttribute('x2', X(v).toFixed(1)); cur.setAttribute('cx', X(v).toFixed(1));
    S.forEach(function (s) {
      var on = v >= s.v - 1e-6;
      A.set(s.dot, { fill: on ? C.g : '#000', stroke: on ? C.g : C.mute });
      s.lab.style.fill = on ? '#fff' : C.mute;
    });
  };
});
