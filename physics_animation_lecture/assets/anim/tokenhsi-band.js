/* Slide "TokenHSI — how": the band of examples under the pipeline.
 *   <svg data-anim="tokenhsi-band" viewBox="0 0 1740 392" style="pointer-events:none">  laid OVER a row of five clips (HTML).
 * Clip k sits at x = k * 352.8, y = 8, 328.8 x 185; its caption (HTML) is under it. The SVG adds, under the captions, one token chip
 * per task (what that task's tokenizer reads) and the rail of the shared body token, and, on the clips, the mask.
 * SCHEMATIC. The only numbers are 222, 64 and 10: the sizes of the body state and of a token, and the path points the follow task
 * reads (TokenHSI, Sec. 3.3, App. A and B.2.1).
 *   step 0  the body state (222 numbers) goes through its own tokenizer and becomes one token (64 numbers), which lives in the rail
 *   step 1  the four task clips arrive (HTML); each gets a token chip
 *   step 2  the task label hops from task to task: the other task tokens are masked (clip veiled, chip struck out); the rail stays lit
 *   step 3  training: under every task its reward in words (the main term of the task reward, App. B.2, and the mocap subsets behind
 *           the style reward, Table A); the reward of the task the label is on is lit, because only that task's reward is applied
 *   step 4  the rewards leave; the success rates take their place (HTML). The label keeps hopping
 *   step 5  a new task: the sit and carry tokens and the body token are reused, frozen (dashed grey, as in the pipeline above);
 *           a new token is trained; follow and climb are masked
 * draw() is a pure function of (t, step, ts).
 */
DeckAnim.register('tokenhsi-band', function (el, A) {
  'use strict';
  var C = A.C, W = 1740, CW = 328.8, P = 352.8, CY = 8, CH = 185, KY = 234, KH = 42, RY = 286, RH = 40, WY = 357, HOP = 2.4;
  var FRZ = '#cfcfcf';
  var MATH = 'font-family:' + A.MATH + ';font-style:italic';
  function T(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 600) + ' ' + (o.size || 21) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + (o.halo ? ';paint-order:stroke;stroke:' + o.halo + ';stroke-width:8px;stroke-linejoin:round' : '') }, p);
    n.innerHTML = s;
    return n;
  }
  // s_t: the subscript is lowered by dy; the text after it must carry the opposite dy itself (an empty tspan does not move the baseline back)
  var ST = '<tspan style="' + MATH + ';font-size:1.18em">s</tspan><tspan dy="5" style="' + MATH + ';font-size:.82em">t</tspan>';
  var i, k;

  // ------------------------------------------------------------------ the rail of the shared body token (there from the start)
  var gR = A.el('g', {}, el);
  A.el('rect', { x: 1, y: RY + 1, width: W - 2, height: RH - 2, rx: 10, fill: '#0f1a06', stroke: C.g, 'stroke-width': 2 }, gR);
  var railF = A.el('rect', { x: 1, y: RY + 1, width: W - 2, height: RH - 2, rx: 10, fill: '#1c1c1c', stroke: '#8a8a8a', 'stroke-width': 2, 'stroke-dasharray': '7 6' }, gR);
  var railG = A.el('rect', { x: 14, y: RY + 9, width: 16, height: 22, rx: 4, fill: C.g }, gR);
  T(gR, 42, RY + 27, 'body token', { weight: 700 });
  var TX = 619, TWD = 502, rtok = [], rnd = A.rand(5), tph = [];
  for (i = 0; i < 64; i++) {
    rtok.push(A.el('rect', { x: (TX + i * TWD / 64 + 0.8).toFixed(2), y: RY + 9, width: 6.2, height: 22, rx: 1.5, fill: C.g }, gR));
    tph.push([rnd() * 6.283, 0.7 + 1.5 * rnd()]);
  }
  var rtx = T(gR, 1150, RY + 27, '', { weight: 500, fill: '#d2d2d2' });
  rtx.innerHTML = '<tspan>shared by every task</tspan><tspan> · never masked</tspan><tspan> · frozen</tspan>';
  var rts = rtx.querySelectorAll('tspan');

  // ------------------------------------------------------------------ step 0: body state -> tokenizer -> one token
  var gS = A.el('g', {}, el), Y0 = 62;                       // top of the row of 222 cells
  T(gS, 0, Y0 - 16, 'Body state ' + ST + '<tspan dy="-5"> · 222 numbers: position, rotation and velocity of every body part, in the character’s own frame</tspan>',
    { size: 22, weight: 500, fill: '#d2d2d2' });
  var cells = [], cph = [], r2 = A.rand(11);
  for (i = 0; i < 222; i++) {
    cells.push(A.el('rect', { x: (i * W / 222 + 0.8).toFixed(2), y: Y0, width: 6.2, height: 30, rx: 1.5, fill: '#e8e8e8' }, gS));
    cph.push([r2() * 6.283, 0.6 + 1.6 * r2()]);
  }
  A.el('path', { d: 'M1 ' + (Y0 + 39) + 'H' + (W - 1) + 'L' + (TX + TWD) + ' ' + (Y0 + 105) + 'H' + TX + 'Z', fill: '#0f1a06', stroke: C.g, 'stroke-width': 2, 'stroke-linejoin': 'round' }, gS);
  var fdots = [], adots = [];
  for (i = 0; i < 9; i++) fdots.push(A.el('circle', { r: 4, fill: '#d9ff7a' }, gS));
  T(gS, W / 2, Y0 + 80, 'its own tokenizer: a small MLP', { anchor: 'middle', size: 22, weight: 700, halo: '#0f1a06' });
  var stok = [];
  for (i = 0; i < 64; i++) stok.push(A.el('rect', { x: (TX + i * TWD / 64 + 0.8).toFixed(2), y: Y0 + 114, width: 6.2, height: 30, rx: 1.5, fill: C.g }, gS));
  T(gS, TX - 16, Y0 + 137, 'one token', { anchor: 'end', size: 22, weight: 700 });
  T(gS, TX + TWD + 16, Y0 + 137, '64 numbers', { size: 22, weight: 500, fill: '#d2d2d2' });
  var AY0 = Y0 + 152, AY1 = RY - 5;                           // the arrow from the token into the rail
  A.el('path', { d: 'M' + W / 2 + ' ' + AY0 + 'V' + AY1, stroke: C.g, 'stroke-width': 3, fill: 'none' }, gS);
  A.el('path', { d: 'M' + (W / 2 - 9) + ' ' + (AY1 - 10) + 'L' + W / 2 + ' ' + (AY1 + 1) + 'L' + (W / 2 + 9) + ' ' + (AY1 - 10), stroke: C.g, 'stroke-width': 3, fill: 'none',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gS);
  for (i = 0; i < 2; i++) adots.push(A.el('circle', { r: 5, fill: '#d9ff7a' }, gS));

  // ------------------------------------------------------------------ the slot of the task that is still to come (steps 1 to 3)
  var gN = A.el('g', {}, el);
  A.el('rect', { x: 4 * P + 1.5, y: CY + 1.5, width: CW - 3, height: CH - 3, rx: 16, fill: 'none', stroke: '#47680a', 'stroke-width': 2, 'stroke-dasharray': '9 8' }, gN);
  T(gN, 4 * P + CW / 2, CY + CH / 2 + 8, 'a new task?', { anchor: 'middle', size: 22, weight: 500, fill: '#8fb04a' });

  // ------------------------------------------------------------------ one token chip per task: attended (green), masked (struck out) or reused frozen (dashed grey)
  var NAMES = ['next 10 path points', 'seat target + chair pose', 'target spot + object box', 'box state + drop-off spot', 'chair and box states'];
  var chips = [];
  for (k = 0; k < 5; k++) {
    var x = k * P, g = A.el('g', {}, el), gon = A.el('g', {}, g), goff = A.el('g', {}, g), gfr = A.el('g', {}, g);
    A.el('rect', { x: x + 1, y: KY + 1, width: CW - 2, height: KH - 2, rx: 10, fill: '#0f1a06', stroke: C.g, 'stroke-width': 2 }, gon);
    A.el('rect', { x: x + 14, y: KY + 10, width: 16, height: 22, rx: 4, fill: C.g }, gon);
    T(gon, x + 42, KY + 28, NAMES[k], {});
    A.el('rect', { x: x + 1, y: KY + 1, width: CW - 2, height: KH - 2, rx: 10, fill: '#0c0c0c', stroke: '#4a4a4a', 'stroke-width': 2, 'stroke-dasharray': '7 6' }, goff);
    A.el('rect', { x: x + 15, y: KY + 11, width: 14, height: 20, rx: 4, fill: 'none', stroke: '#6a6a6a', 'stroke-width': 2 }, goff);
    T(goff, x + 42, KY + 28, NAMES[k], { fill: '#7d7d7d', weight: 500 });
    A.el('path', { d: 'M' + (x + 38) + ' ' + (KY + 21) + 'H' + (x + 46 + NAMES[k].length * 10.3), stroke: '#8a8a8a', 'stroke-width': 2 }, goff);
    A.el('rect', { x: x + 1, y: KY + 1, width: CW - 2, height: KH - 2, rx: 10, fill: '#1c1c1c', stroke: '#8a8a8a', 'stroke-width': 2, 'stroke-dasharray': '7 6' }, gfr);
    A.el('rect', { x: x + 14, y: KY + 10, width: 16, height: 22, rx: 4, fill: FRZ }, gfr);
    T(gfr, x + 42, KY + 28, NAMES[k], {});
    chips.push({ g: g, on: gon, off: goff, frz: gfr });
  }

  // ------------------------------------------------------------------ step 3: what each task is rewarded for (two lines under the rail)
  // task: the main term of that task's reward (Eq. 1, 4, 7, 12). style: the reference-motion subsets used for that task (Table A).
  var REW = [['root at path point', 'walking mocap'], ['root at seat target', 'walk + sit mocap'],
             ['root at target spot', 'walk + climb mocap'], ['box at drop-off spot', 'walk + carry mocap']];
  var gW = A.el('g', {}, el), rews = [];
  for (k = 0; k < 4; k++) {
    var gw = A.el('g', {}, gW);
    T(gw, k * P, WY, '<tspan style="font-weight:700;fill:' + C.g + '">task reward:</tspan> ' + REW[k][0], { size: 20, weight: 500, fill: '#f2f2f2' });
    T(gw, k * P, WY + 26, '<tspan style="font-weight:700;fill:' + C.g + '">style reward:</tspan> ' + REW[k][1], { size: 20, weight: 500, fill: '#f2f2f2' });
    rews.push(gw);
  }

  // ------------------------------------------------------------------ on the clips: veil of a masked task, frame of an attended one
  var veils = [], frames = [], frz = [];
  for (k = 0; k < 4; k++) {
    var gv = A.el('g', {}, el);
    A.el('rect', { x: k * P, y: CY, width: CW, height: CH, rx: 16, fill: '#000', 'fill-opacity': 0.66 }, gv);
    T(gv, k * P + CW / 2, CY + CH / 2 + 8, 'masked', { anchor: 'middle', size: 22, weight: 700, fill: '#e8e8e8' });
    veils.push(gv);
  }
  for (k = 0; k < 5; k++) {
    frames.push(A.el('rect', { x: k * P + 2.5, y: CY + 2.5, width: CW - 5, height: CH - 5, rx: 14, fill: 'none', stroke: C.g, 'stroke-width': 5 }, el));
    frz.push(A.el('rect', { x: k * P + 2, y: CY + 2, width: CW - 4, height: CH - 4, rx: 14, fill: 'none', stroke: '#e8e8e8', 'stroke-width': 4, 'stroke-dasharray': '11 8' }, el));
  }
  function pill(text, w, dark) {
    var gp = A.el('g', {}, el);
    A.el('rect', { x: 0, y: 0, width: w, height: 34, rx: 9, fill: dark ? '#1c1c1c' : C.g, stroke: dark ? '#cfcfcf' : C.g, 'stroke-width': 2, 'stroke-dasharray': dark ? '6 5' : 'none' }, gp);
    T(gp, w / 2, 24, text, { anchor: 'middle', size: 20, weight: 700, fill: dark ? '#fff' : '#000' });
    return gp;
  }
  var pLab = pill('task label', 126, false);
  var pSit = pill('reused · frozen', 168, true), pCar = pill('reused · frozen', 168, true), pNew = pill('new · trained', 150, false);
  A.set(pSit, { transform: 'translate(' + (1 * P + 12) + ' ' + (CY + 12) + ')' });
  A.set(pCar, { transform: 'translate(' + (3 * P + 12) + ' ' + (CY + 12) + ')' });
  A.set(pNew, { transform: 'translate(' + (4 * P + 12) + ' ' + (CY + 12) + ')' });

  return function draw(f) {
    var s = f.step, ts = f.ts, t = f.t, a, u;
    // ---- which task tokens are attended (on), which are reused frozen (fz), where the label is (lab)
    var on = [1, 1, 1, 1, 1], lab = [0, 0, 0, 0, 0], m = 0, px = 0, pf = 1, fz = 0;
    if (s >= 2 && s <= 4) {
      m = s === 2 ? A.ease(A.ramp(ts, 0.25, 0.85)) : 1;
      var p = t / HOP, i0 = Math.floor(p) % 4, pv = (i0 + 3) % 4, w = A.ease(A.ramp(p - Math.floor(p), 0, 0.15));
      for (k = 0; k < 4; k++) { a = k === i0 ? w : (k === pv ? 1 - w : 0); lab[k] = m * a; on[k] = 1 - m * (1 - a); }
      if (i0 === 0) { px = P * (w < 0.5 ? pv : i0); pf = Math.abs(1 - 2 * w); }     // last task -> first: the pill does not fly back over the row, it fades out there and in here
      else px = P * (pv + (i0 - pv) * w);
    } else if (s >= 5) {
      m = fz = A.ease(A.ramp(ts, 0, 0.5));
      on = [1 - m, 1, 1 - m, 1, 1];
    }
    // ---- rail
    var col = fz > 0.5 ? FRZ : C.g;
    A.show(railF, fz);
    railG.setAttribute('fill', col);
    for (i = 0; i < 64; i++) { rtok[i].setAttribute('fill-opacity', (0.5 + 0.45 * Math.sin(tph[i][0] + tph[i][1] * t)).toFixed(2)); rtok[i].setAttribute('fill', col); }
    rts[0].style.fillOpacity = s >= 2 ? 1 : (s === 1 ? A.ramp(ts, 0.3, 0.8) : 0);
    rts[1].style.fillOpacity = s >= 3 ? 1 : (s === 2 ? A.ramp(ts, 0.3, 0.8) : 0);
    rts[2].style.fillOpacity = s >= 5 ? A.ramp(ts, 0.3, 0.8) : 0;
    // ---- step 0: the tokenizer
    var oS = s === 0 ? 1 : (s === 1 ? 1 - A.ramp(ts, 0, 0.3) : 0);
    A.show(gS, oS);
    gS.style.display = oS > 0 ? '' : 'none';
    if (oS > 0) {
      for (i = 0; i < 222; i++) cells[i].setAttribute('fill-opacity', (0.42 + 0.4 * Math.sin(cph[i][0] + cph[i][1] * t)).toFixed(2));
      for (i = 0; i < 64; i++) stok[i].setAttribute('fill-opacity', (0.5 + 0.45 * Math.sin(tph[i][0] + tph[i][1] * t)).toFixed(2));
      for (i = 0; i < 9; i++) {
        u = A.loop(t * 0.5 + i / 9, 1);
        var x0 = (i + 0.5) / 9 * W, x1 = TX + (i + 0.5) / 9 * TWD;
        A.set(fdots[i], { cx: A.lerp(x0, x1, u).toFixed(1), cy: (Y0 + 34 + 76 * u).toFixed(1) });
        A.show(fdots[i], Math.min(1, u / 0.12, (1 - u) / 0.12));
      }
      for (i = 0; i < 2; i++) {
        u = A.loop(t * 0.7 + i / 2, 1);
        A.set(adots[i], { cx: W / 2, cy: (AY0 + 2 + (AY1 - AY0 - 14) * u).toFixed(1) });
        A.show(adots[i], Math.min(1, u / 0.12, (1 - u) / 0.12));
      }
    }
    // ---- chips, veils, frames
    for (k = 0; k < 5; k++) {
      var vis = k < 4 ? (s >= 2 ? 1 : (s === 1 ? A.ramp(ts, 0.25 + 0.12 * k, 0.65 + 0.12 * k) : 0)) : (s >= 5 ? A.ramp(ts, 0.3, 0.8) : 0);
      var kf = (k === 1 || k === 3) ? fz : 0;                  // sit and carry: reused, frozen
      A.show(chips[k].g, vis);
      A.show(chips[k].on, on[k] * (1 - kf));
      A.show(chips[k].frz, on[k] * kf);
      A.show(chips[k].off, 1 - on[k]);
      A.show(frames[k], k < 4 ? lab[k] : (s >= 5 ? m : 0));
      A.show(frz[k], kf);
      if (k < 4) A.show(veils[k], 1 - on[k]);
    }
    A.show(gN, s >= 5 ? 1 - A.ramp(ts, 0, 0.25) : (s >= 2 ? 1 : (s === 1 ? A.ramp(ts, 0.5, 1.0) : 0)));
    A.set(pLab, { transform: 'translate(' + (px + 12).toFixed(1) + ' ' + (CY + 12) + ')' });
    A.show(pLab, (s >= 2 && s <= 4) ? m * pf : 0);
    A.show(pSit, fz); A.show(pCar, fz); A.show(pNew, s >= 5 ? A.ramp(ts, 0.3, 0.8) : 0);
    // ---- step 3: the rewards; the one of the task the label is on is lit
    var oW = s === 3 ? A.ramp(ts, 0.5, 1.0) : (s === 4 ? 1 - A.ramp(ts, 0, 0.25) : 0);     // the success rates (HTML) fade in after 0.25 s and out within 0.5 s
    A.show(gW, oW);
    gW.style.display = oW > 0 ? '' : 'none';
    if (oW > 0) for (k = 0; k < 4; k++) A.show(rews[k], 0.36 + 0.64 * lab[k]);
  };
});
