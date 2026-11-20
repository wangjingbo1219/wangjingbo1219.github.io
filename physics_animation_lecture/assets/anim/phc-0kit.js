/*! Shared helpers of the PHC figures (tools/slides/05a_10_phc.py: phc-grow, phc-recover, phc-blend). No figure is registered here.
 *  Loaded before the phc-*.js figures (file-name order); they read window.PHCKit at set-up time. */
window.PHCKit = (function () {
  'use strict';
  var MATH = "KaTeX_Math, 'Times New Roman', serif";
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  var K = {
    /** italic math symbol inside an SVG <text> */
    mi: function (s) { return '<tspan style="font-family:' + MATH + ';font-style:italic;font-weight:400;font-size:1.16em">' + s + '</tspan>'; },
    /** P with a superscript index: P(1), P(2), P(3), P(F) */
    prim: function (k) { return K.mi('P') + '<tspan dx="2.5" dy="-9" style="font-size:.7em">(' + k + ')</tspan><tspan dy="9">​</tspan>'; },
    /** symbol with a subscript: sub('d', 't') */
    sub: function (a, b) { return K.mi(a) + '<tspan dy="6" style="font-family:' + MATH + ';font-style:italic;font-weight:400;font-size:.86em">' + b + '</tspan><tspan dy="-6">​</tspan>'; },
    /** set a node's markup only when it changed (draw() runs every frame) */
    html: function (n, s) { if (n._s !== s) { n._s = s; n.innerHTML = s; } },
    /** set an attribute only when it changed */
    attr: function (n, k, v) { var c = n._a || (n._a = {}); if (c[k] !== v) { c[k] = v; n.setAttribute(k, v); } },
    /** deterministic pseudo-random number in [0, 1) from two integers */
    hash: function (i, e) { var x = Math.sin(i * 127.1 + e * 311.7 + 0.37) * 43758.5453; return x - Math.floor(x); },
    /** weighted mix of colours: mix([[w, '#rrggbb'], ...]) -> 'rgb(r,g,b)' (weights sum to 1) */
    mix: function (parts) {
      var r = 0, g = 0, b = 0;
      for (var i = 0; i < parts.length; i++) { var c = parts[i][1]._rgb || (parts[i][1]._rgb = rgb(parts[i][1].hex)), w = parts[i][0]; r += w * c[0]; g += w * c[1]; b += w * c[2]; }
      return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    },
    col: function (hex) { return { hex: hex }; },
    /** arrow head path at (x, y) pointing along angle a (rad), size s */
    head: function (x, y, a, s) {
      var c = Math.cos(a), n = Math.sin(a), bx = x - s * c, by = y - s * n;
      return 'M' + (bx - 0.6 * s * n).toFixed(1) + ' ' + (by + 0.6 * s * c).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) +
        'L' + (bx + 0.6 * s * n).toFixed(1) + ' ' + (by - 0.6 * s * c).toFixed(1);
    },
    /** <text> in the deck font whose content may contain tspans */
    text: function (A, parent, x, y, s, o) {
      o = o || {};
      var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
        style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.halo ? ';' + A.HALO : '') }, parent);
      n.innerHTML = s;
      return n;
    }
  };
  return K;
})();
