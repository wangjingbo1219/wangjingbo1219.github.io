/* "A black box is enough": state and action go in, the next state comes out and is fed back.
 * One cycle is one simulation step; the name of the engine inside the box changes every cycle, the loop around it does not.
 * Markup: <svg data-anim="bd-blackbox" viewBox="0 0 562 316">   (drawn 1:1, so the text sizes are slide pixels) */
DeckAnim.register('bd-blackbox', function (el, A) {
  var MI = function (s, col) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.16em' + (col ? ';fill:' + col : '') + '">' + s + '</tspan>'; };
  var ENG = ['Bullet', 'MuJoCo', 'PhysX'];
  var BX = 206, BY = 104, BW = 150, BH = 112, YS = 134, YA = 186, YO = 160, XL = 34, XR = 528, YL = 276;
  var st = function (c, w) { return { fill: 'none', stroke: c, 'stroke-width': w || 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }; };
  // equation
  var eq = A.el('text', { x: 281, y: 52, 'text-anchor': 'middle', style: 'font:400 34px KaTeX_Main, serif;fill:#fff' }, el);
  eq.innerHTML = MI('s′') + ' = ' + MI('f') + '(' + MI('s') + ', ' + MI('a', A.C.g) + ')';
  // wires
  A.el('path', Object.assign({ d: 'M' + XL + ' ' + YS + ' H' + (BX - 6) + ' m-10 -8 l10 8 l-10 8' }, st(A.C.mid)), el);
  A.el('path', Object.assign({ d: 'M' + (XL + 60) + ' ' + YA + ' H' + (BX - 6) + ' m-10 -8 l10 8 l-10 8' }, st(A.C.g)), el);
  A.el('path', Object.assign({ d: 'M' + (BX + BW + 6) + ' ' + YO + ' H' + XR + ' M' + (BX + BW + 40) + ' ' + (YO - 8) + ' l10 8 l-10 8' }, st(A.C.mid)), el);
  A.el('path', Object.assign({ d: 'M' + XR + ' ' + YO + ' V' + (YL - 14) + ' Q' + XR + ' ' + YL + ' ' + (XR - 14) + ' ' + YL + ' H' + (XL + 14) + ' Q' + XL + ' ' + YL + ' ' + XL + ' ' + (YL - 14) + ' V' + YS }, st(A.C.line)), el);
  // the box
  var box = A.el('rect', { x: BX, y: BY, width: BW, height: BH, rx: 12, fill: '#000', stroke: '#fff', 'stroke-width': 3 }, el);
  var fl = A.el('text', { x: BX + BW / 2, y: BY + 56, 'text-anchor': 'middle', style: 'font:italic 400 54px ' + A.MATH + ';fill:#fff' }, el);
  fl.textContent = 'f';
  var eng = A.el('text', { x: BX + BW / 2, y: BY + 94, 'text-anchor': 'middle', style: 'font:700 22px ' + A.FONT + ';fill:' + A.C.amber }, el);
  // labels
  var ls = A.el('text', { x: XL + 12, y: YS - 12, style: 'font:500 21px ' + A.FONT + ';fill:' + A.C.mid }, el); ls.innerHTML = 'state ' + MI('s', '#fff');
  var la = A.el('text', { x: XL + 60, y: YA + 30, style: 'font:500 21px ' + A.FONT + ';fill:' + A.C.g }, el); la.innerHTML = 'action ' + MI('a');
  var lo = A.el('text', { x: XR - 8, y: YO - 12, 'text-anchor': 'end', style: 'font:500 21px ' + A.FONT + ';fill:' + A.C.mid }, el); lo.innerHTML = 'next state ' + MI('s′', '#fff');
  var lb = A.el('text', { x: 281, y: YL - 12, 'text-anchor': 'middle', style: 'font:500 21px ' + A.FONT + ';fill:' + A.C.mute }, el); lb.innerHTML = MI('s′') + ' becomes ' + MI('s') + ' of the next step';
  // tokens
  var ts = A.el('circle', { r: 10, fill: '#fff' }, el), ta = A.el('circle', { r: 10, fill: A.C.g }, el);
  var PER = 3.0;
  function loopPos(u) {                // from the box's exit around the loop back to the start of the state wire, u in 0..1
    var seg = [[BX + BW + 6, YO], [XR, YO], [XR, YL], [XL, YL], [XL, YS]], len = [], tot = 0, i;
    for (i = 0; i < seg.length - 1; i++) { len.push(Math.abs(seg[i + 1][0] - seg[i][0]) + Math.abs(seg[i + 1][1] - seg[i][1])); tot += len[i]; }
    var d = u * tot;
    for (i = 0; i < len.length; i++) { if (d <= len[i]) return [A.lerp(seg[i][0], seg[i + 1][0], d / len[i]), A.lerp(seg[i][1], seg[i + 1][1], d / len[i])]; d -= len[i]; }
    return seg[seg.length - 1];
  }
  return function draw(f) {
    var c = Math.floor(f.ts / PER), u = A.loop(f.ts, PER) / PER;
    eng.textContent = ENG[((c % 3) + 3) % 3];
    // 0 .. 0.3: s and a run into the box; 0.3 .. 0.45: the box works; 0.45 .. 1: s' runs out and around the loop
    var inn = A.ease(A.ramp(u, 0.0, 0.3));
    if (u < 0.3) {
      A.set(ts, { cx: A.lerp(XL, BX - 6, inn), cy: YS, opacity: 1 });
      A.set(ta, { cx: A.lerp(XL + 60, BX - 6, inn), cy: YA, opacity: 1 });
    } else if (u < 0.45) {
      A.set(ts, { opacity: 0 }); A.set(ta, { opacity: 0 });
    } else {
      var p = loopPos(A.ease(A.ramp(u, 0.45, 1.0)));
      A.set(ts, { cx: p[0], cy: p[1], opacity: 1 });
      A.set(ta, { opacity: 0 });
    }
    var busy = u >= 0.3 && u < 0.45;
    A.set(box, { stroke: busy ? A.C.amber : '#fff', 'stroke-width': busy ? 5 : 3 });
  };
});
