/* MaskedMimic: the "goal board" shared by the two figures of this paper (maskedmimic-mask.js, maskedmimic-board.js).
 *
 * A board is a grid. One row per body part the student can be conditioned on (the six of Sec. 7: head, hands, pelvis, ankles),
 * one column per future frame (the near frames slide to the left as time passes) plus one column for a single pose further ahead
 * (App. B.2: ten near-term poses and one long-term pose), and one bar each for the text and the object.
 * Green = this target is given, dark = hidden. SCHEMATIC: a cell is a slot of the goal, not a measured quantity.
 *
 *   var B = MMK.board(el, A, { x, y, cw, ch, gap, n, lx, gx, rows, bars, size, barh, bary });
 *   B.draw({ scroll, lit(n, row), late(row), lateShow, bars: [{ v, show, label }], rowOn(row) });
 */
(function () {
  'use strict';
  var uid = 0;
  window.MMK = {
    PARTS: ['head', 'left hand', 'right hand', 'pelvis', 'left ankle', 'right ankle'],
    board: function (el, A, o) {
      var C = A.C, g = A.el('g', {}, el), n = o.n, i, j;
      var W = o.cw - o.gap, H = o.ch - o.gap, xl = o.x + n * o.cw + o.gx, id = 'mmk-clip-' + (++uid);
      var DARK = { rx: 5, fill: '#1a1a1a', stroke: '#333', 'stroke-width': 1.5 };
      function rect(p, a, extra) { var k, q = {}; for (k in a) q[k] = a[k]; for (k in extra) q[k] = extra[k]; return A.el('rect', q, p); }
      function tx(p, x, y, s, fill, weight, anchor) {
        return A.el('text', { x: x, y: y, 'text-anchor': anchor || 'start', text: s, style: 'font:' + (weight || 500) + ' ' + o.size + 'px ' + A.FONT + ';fill:' + fill }, p);
      }
      var cp = A.el('clipPath', { id: id }, A.el('defs', {}, g));
      A.el('rect', { x: o.x - 1, y: o.y - 2, width: n * o.cw - o.gap + 2, height: o.rows.length * o.ch + 4 }, cp);
      var near = A.el('g', { 'clip-path': 'url(#' + id + ')' }, g), lateG = A.el('g', {}, g);
      var lab = [], cell = [], late = [], bars = [], tags = [];
      for (i = 0; i < o.rows.length; i++) {
        var y = o.y + i * o.ch;
        lab.push(tx(g, o.lx, y + H / 2 + o.size * 0.34, o.rows[i], '#fff'));
        cell.push([]);
        for (j = 0; j <= n; j++) cell[i].push([rect(near, DARK, { y: y, width: W, height: H }), rect(near, { rx: 5, fill: C.g }, { y: y, width: W, height: H })]);
        rect(lateG, DARK, { x: xl, y: y, width: W, height: H });
        late.push(rect(lateG, { rx: 5, fill: C.g }, { x: xl, y: y, width: W, height: H }));
      }
      for (j = 0; j < 3; j++) {                                                                // "gap" captions that ride on hidden columns
        var tg = tx(near, 0, o.y + o.rows.length * o.ch / 2 - o.gap / 2 + o.size * 0.34, '', C.mid, 700, 'middle');
        tg.style.paintOrder = 'stroke'; tg.style.stroke = '#0c0c0c'; tg.style.strokeWidth = '7px'; tg.style.strokeLinejoin = 'round';   // a dark plate: the cell borders do not run through the letters
        tags.push(tg);
      }
      var by = o.bary !== undefined ? o.bary : o.y + o.rows.length * o.ch + 6, bh = o.barh || H, bw = xl + W - o.x;
      (o.bars || []).forEach(function (name, k) {
        var yy = by + k * (bh + o.gap), bg = A.el('g', {}, g);
        var l = tx(bg, o.lx, yy + bh / 2 + o.size * 0.34, name, '#fff');
        rect(bg, DARK, { x: o.x, y: yy, width: bw, height: bh });
        var on = rect(bg, { rx: 5, fill: C.g }, { x: o.x, y: yy, width: bw, height: bh });
        var t0 = tx(bg, o.x + bw / 2, yy + bh / 2 + o.size * 0.34, '', '#6f6f6f', 500, 'middle'), t1 = tx(bg, o.x + bw / 2, yy + bh / 2 + o.size * 0.34, '', '#000', 700, 'middle');
        bars.push({ g: bg, lab: l, on: on, t0: t0, t1: t1 });
      });
      return {
        g: g, xl: xl, W: W, H: H, o: o, lateG: lateG,
        /** x of the centre of near column j (0 = the next frame), y of the centre of row i */
        cx: function (j) { return o.x + j * o.cw + W / 2; },
        cy: function (i) { return o.y + i * o.ch + H / 2; },
        draw: function (s) {
          var n0 = Math.floor(s.scroll), fr = s.scroll - n0, i, j, k;
          for (i = 0; i < o.rows.length; i++) {
            for (j = 0; j <= n; j++) {
              var x = (o.x + (j - fr) * o.cw).toFixed(1), v = s.lit(n0 + j, i, j - fr);
              cell[i][j][0].setAttribute('x', x); cell[i][j][1].setAttribute('x', x); cell[i][j][1].style.opacity = v;
            }
            late[i].style.opacity = s.late ? s.late(i) : 0;
            lab[i].style.opacity = 0.42 + 0.58 * (s.rowOn ? s.rowOn(i) : 1);
          }
          lateG.style.opacity = s.lateShow === undefined ? 1 : s.lateShow;
          for (k = 0; k < bars.length; k++) {
            var b = (s.bars || [])[k] || { v: 0, show: 0 };
            bars[k].g.style.opacity = b.show === undefined ? 1 : b.show;
            bars[k].on.style.opacity = b.v; bars[k].t1.style.opacity = b.v; bars[k].t0.style.opacity = 1 - b.v;
            bars[k].lab.style.opacity = 0.42 + 0.58 * b.v;
            if (bars[k].t1.textContent !== (b.label || '')) bars[k].t1.textContent = b.label || '';
            if (bars[k].t0.textContent !== (b.off || '')) bars[k].t0.textContent = b.off || '';
          }
          // captions on runs of hidden columns: s.gaps = [[first absolute column, length, text, opacity], ...]
          for (k = 0; k < tags.length; k++) {
            var gp = (s.gaps || [])[k];
            if (!gp) { tags[k].style.opacity = 0; continue; }
            tags[k].setAttribute('x', (o.x + (gp[0] - s.scroll + gp[1] / 2) * o.cw - o.gap / 2).toFixed(1));
            if (tags[k].textContent !== gp[2]) tags[k].textContent = gp[2];
            tags[k].style.opacity = gp[3] === undefined ? 1 : gp[3];
          }
        }
      };
    }
  };
})();
