/* Slide "CALM — directing": which way a request takes, in step with the authors' clip.   <svg data-anim="calm-route" viewBox="0 0 1848 190">
 * A layer UNDER the pipeline figure of that slide (same box as its dia(): see CALM_PIPE2 / CALM_DX / CALM_DW in
 * tools/slides/03a_30_calm.py), so that the figure's own arrows and labels stay on top. It appears with the state machine (click 2):
 *   - above the state machine, the command that is printed in the clip at this moment (the three texts are the clip's own);
 *   - a glow under the arrows this command travels along: through the high-level policy while the character is told to move
 *     in a direction, straight to the low-level policy for an isolated motion (Sec. 6.2 and 8.2.2 of the paper).
 * Clock: the clip's own time, so the command changes when the text in the clip changes (at 2.35 s and 4.40 s of the 7.8 s clip);
 * when the clip is not playing (screenshots, print) the clock is the time since the click. No numbers, nothing simulated.
 */
DeckAnim.register('calm-route', function (el, A) {
  'use strict';
  var frozen = /[?&](animt|still|audit|print)\b/.test(location.search), shot = /[?&](animt|still)\b/.test(location.search);
  var sec = el.closest('section'), vid = sec ? sec.querySelector('video[src*="calmx_fsm"]') : null;
  var CLIP = 7.8, T1 = 2.35, T2 = 4.40, FADE = 0.25;                           // read off the clip's frames: the text changes between 2.33 / 2.36 s and 4.39 / 4.42 s
  var CMD = ['“Move right, towards the target”', '“Sword-slash, left”', '“Celebrate”'];
  // geometry of the pipeline figure above this layer: 5 columns, boxes 262 x 100, in a 1848 x 190 box (the same numbers as in the slide file)
  var W = 1848, H = 190, COLS = 5, BW = 262, BH = 100, cw = W / COLS;
  function L(i) { return i * cw + (cw - BW) / 2; }                               // left edge of the box in column i
  function R(i) { return L(i) + BW; }
  function Cx(i) { return L(i) + BW / 2; }
  var ym = H / 2, yb = (H + BH) / 2, yu = yb + 30;                               // arrow row, bottom of the boxes, the arc under the row
  var OUT = 'M' + R(2) + ' ' + ym + ' H' + L(3);                                 // low level -> simulator: common to both routes
  var VIA = 'M' + R(0) + ' ' + ym + ' H' + L(1) + ' M' + R(1) + ' ' + ym + ' H' + L(2) + ' ' + OUT;     // state machine -> high level -> low level
  var DIRECT = 'M' + Cx(0) + ' ' + yb + ' V' + yu + ' H' + Cx(2) + ' V' + yb + ' ' + OUT;               // state machine -> low level
  function glow(d) { return A.el('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el); }
  var gV = glow(VIA), gD = glow(DIRECT);
  var say = A.text(el, L(0), 30, '', { size: 21, weight: 700, fill: '#fff' });   // starts at the left edge of the state machine

  return function draw(f) {
    var on = f.step < 2 ? 0 : (f.step === 2 ? A.ramp(f.ts, 0.3, 0.8) : 1);
    var live = !frozen && vid && !vid.paused && !vid.seeking && vid.readyState >= 2;
    var ct = live ? A.loop(vid.currentTime, CLIP) : A.loop(f.ts, CLIP);
    if (shot && on && vid && Math.abs(vid.currentTime - ct) > 0.05) { try { vid.pause(); vid.currentTime = ct; } catch (e) {} }     // review screenshots (?animt, ?still): hold the clip at the figure's moment
    var c = ct < T1 ? 0 : (ct < T2 ? 1 : 2);
    // 1 while the request goes through the high-level policy, 0 while it goes straight to the low level (short cross-fades)
    var via = ct < T1 ? A.ramp(ct, 0, FADE) : 1 - A.ramp(ct, T1, T1 + FADE);
    var breathe = 0.44 + 0.08 * Math.sin(5 * f.t);
    say.textContent = CMD[c];
    A.show(say, on);
    A.show(gV, on * breathe * via);
    A.show(gD, on * breathe * (1 - via));
  };
});
