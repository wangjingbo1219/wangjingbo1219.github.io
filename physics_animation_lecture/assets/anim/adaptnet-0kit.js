/* AdaptNet (tools/slides/03b_40_adaptnet.py): pieces shared by the figures adaptnet-latent and adaptnet-layer on the slide "how".
 *
 * Both figures show ONE number, the strength of the two new branches (0 = they add nothing, 1 = as trained), in three ways:
 *   AN.train(ts)   click "training": the branches are zero-initialized, so the strength is 0 at iteration 0 and grows as training goes on.
 *                  SCHEMATIC: a loop of AN.TRAIN_P seconds (hold at 0, grow, hold at 1, back). It claims no numbers and no curve shape.
 *   AN.alpha(t)    click "run-time scale": the scale alpha of Eq. 13, MEASURED on the slider of the authors' clip adaptnetx_alpha
 *                  (window.ADAPTNET_ALPHA, written by tools/fig/adaptnet_alpha.py), as a function of the clip's own time.
 *   AN.clock(..)   the clip's clock while it plays, so that figure and clip stay together; otherwise (screenshots, print) the time since the click.
 */
(function () {
  'use strict';
  var AN = window.ADAPTNET = {};
  AN.frozen = /[?&](animt|still|audit|print)\b/.test(location.search);
  AN.TRAIN_P = 9;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  /** -> {g: strength 0..1, p: progress of the training bar 0..1, zero: at iteration 0, rew: the loop is rewinding to iteration 0} */
  AN.train = function (ts) {
    var u = ((ts % AN.TRAIN_P) + AN.TRAIN_P) % AN.TRAIN_P, back = 1 - ease((u - 8.3) / 0.6), p = clamp((u - 1.2) / 4.2, 0, 1) * back;
    return { g: ease((u - 1.2) / 4.2) * back, p: p, zero: p <= 0, rew: p > 0 && u >= 8.3 };
  };
  /** alpha at time t (seconds) of the clip adaptnetx_alpha */
  AN.alpha = function (t) {
    var D = window.ADAPTNET_ALPHA, tab = D.t_alpha, n = tab.length, i;
    t = ((t % D.T) + D.T) % D.T;
    if (t >= D.fade[0]) return 1 - clamp((t - D.fade[0]) / (D.fade[1] - D.fade[0]), 0, 1);      // the authors' cross-fade back to the plain walk
    if (t <= tab[0][0]) return 0;
    if (t >= tab[n - 1][0]) return 1;
    for (i = 1; i < n; i++) if (t <= tab[i][0]) return tab[i - 1][1] + (tab[i][1] - tab[i - 1][1]) * (t - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]);
    return 1;
  };
  /** true during the cross-fade at the end of the clip (no slider reading there) */
  AN.inFade = function (t) { var D = window.ADAPTNET_ALPHA; t = ((t % D.T) + D.T) % D.T; return t >= D.fade[0]; };
  /** seconds on the clock of the clip adaptnetx_alpha: its own time while it plays, else the time since the build step */
  AN.clock = function (sec, f) {
    var v = sec && sec.querySelector('video[src*="adaptnetx_alpha"]');
    if (!AN.frozen && v && !v.paused && !v.seeking && v.readyState >= 2) return v.currentTime;
    return f.ts;
  };
  /** arclength parametrisation of a polyline [[x, y], ...] -> {len, at(s)} */
  AN.track = function (pts) {
    var L = [0], i;
    for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { len: L[L.length - 1], at: function (s) {
      s = clamp(s, 0, L[L.length - 1]);
      for (var j = 1; j < pts.length; j++) if (s <= L[j] || j === pts.length - 1) {
        var u = (s - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1]);
        return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u];
      }
    } };
  };
  /** SVG text helpers: math italic and calligraphic letters as tspans */
  AN.mi = function (A, s, size) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:' + (size || 1.16) + 'em">' + s + '</tspan>'; };
  AN.cal = function (s, size) { return '<tspan style="font-family:KaTeX_Caligraphic,KaTeX_Math,serif;font-style:normal;font-size:' + (size || 1.16) + 'em">' + s + '</tspan>'; };
  /** superscript raised by d px; the empty tspan after it brings the baseline back */
  AN.sup = function (s, d) { d = d || 9; return '<tspan dy="' + (-d) + '" style="font-size:.7em">' + s + '</tspan><tspan dy="' + d + '">​</tspan>'; };
  AN.txt = function (A, parent, x, y, html, o) {
    o = o || {};
    return A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', html: html,
      style: 'font:' + (o.weight || 700) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.ls ? ';letter-spacing:' + o.ls : '') + (o.halo ? ';' + A.HALO : '') }, parent);
  };
})();
