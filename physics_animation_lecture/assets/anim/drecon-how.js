/* DReCon — how it works (tools/slides/02_30_drecon.py).   <svg data-anim="drecon-how" viewBox="0 0 1152 353">
 * ONE figure, three SCHEMATIC scenes that follow the clicks of the pipeline drawn above it:
 *   step 0  the command: the stick sets direction, heading, speed and style; top view of the animated character following it
 *   step 1  motion matching (Sec. 5.2): the mocap database as a strip of frames. Every 10 frames a query (feet, hip, path 20 / 40 / 60
 *           frames ahead) is compared with every frame; when a frame somewhere else fits better, playback jumps there
 *   step 2  open loop (Sec. 6.4): at a joint, the PD target is the animation's joint angle; the simulated link chases it
 *           (a second-order PD response, integrated here)
 *   step 3  feedback (Fig. 5): the policy adds an offset to that target. Body map: the six bodies the policy observes (rings, Sec. 6.3)
 *           and the joints that get offsets (green; Sec. 6.4 and Fig. 4)
 *   step 4  reward (Sec. 6.5): r = e_fall (r_p + r_v + r_local + r_vCM). e_fall = clamp(1.3 - 1.4 gap, 0, 1) is drawn exactly; the head gap
 *           comes from a body that tips over (a rigid rod falling about its foot, integrated here). At 1 m the episode ends.
 * The only numbers from the paper are the ones named above; the motions are illustrations, not data.
 */
DeckAnim.register('drecon-how', function (el, A) {
  'use strict';
  var C = A.C, G = C.g, AMB = C.amber, BLUE = '#6170ff', GREY = '#8d8d8d', DEG = Math.PI / 180;
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || '#fff') + ';' + (o.halo ? A.HALO : '') }, p);
    n.innerHTML = s;
    return n;
  }
  function grp(p) { return A.el('g', {}, p || el); }
  function head(x, y, a, s) {                                   // open arrow head at (x, y) pointing along angle a (screen radians)
    var w = 0.5;
    return 'M' + (x - s * Math.cos(a - w)).toFixed(1) + ' ' + (y - s * Math.sin(a - w)).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) +
           'L' + (x - s * Math.cos(a + w)).toFixed(1) + ' ' + (y - s * Math.sin(a + w)).toFixed(1);
  }
  var ease = A.ease, ramp = A.ramp, lerp = A.lerp;
  var defs = A.el('defs', {}, el);

  // =========================================================================================== scene 1: command + motion matching
  var gMM = grp();
  var T = 12, TICK = [0, 3, 6, 9];                              // loop; the search ticks (every 1 s = 10 slowed frames) at which playback jumps
  var CMD = [{ dir: 0, head: 0, sp: 0.55, st: 'walk' }, { dir: 58, head: 58, sp: 1, st: 'run' },
             { dir: -38, head: 12, sp: 0.55, st: 'walk' }, { dir: 0, head: 0, sp: 0.36, st: 'crouch' }];
  var LEAD = 0.4, JUMP = 0.45;                                  // the stick moves 0.4 s before a tick; playback jumps 0.45 s after it
  function piece(u, off, key, d) {                              // value of CMD[.][key] at loop time u, for pieces starting at TICK[i] + off, eased over d
    var best = 0, age = 1e9, i, a;
    for (i = 0; i < 4; i++) { a = A.loop(u - (TICK[i] + off), T); if (a < age) { age = a; best = i; } }
    return lerp(CMD[(best + 3) % 4][key], CMD[best][key], ease(ramp(age, 0, d)));
  }
  function seg(u, off) { var best = 0, age = 1e9, i, a; for (i = 0; i < 4; i++) { a = A.loop(u - (TICK[i] + off), T); if (a < age) { age = a; best = i; } } return [best, age]; }
  // the ground under the character: integral of its velocity over one loop (so the grid never jumps when the loop restarts)
  var NS = 720, GX = [0], GY = [0], k_;
  for (k_ = 1; k_ <= NS; k_++) {
    var uu = (k_ - 0.5) * T / NS, sp_ = piece(uu, JUMP, 'sp', 0.35), dr_ = piece(uu, JUMP, 'dir', 0.35) * DEG;
    GX.push(GX[k_ - 1] + 62 * sp_ * Math.cos(dr_) * T / NS); GY.push(GY[k_ - 1] - 62 * sp_ * Math.sin(dr_) * T / NS);
  }
  function ground(t) {
    var n = Math.floor(t / T), u = t - n * T, x = u / T * NS, i = Math.min(NS - 1, Math.floor(x)), r = x - i;
    return [n * GX[NS] + lerp(GX[i], GX[i + 1], r), n * GY[NS] + lerp(GY[i], GY[i + 1], r)];
  }
  // ---- top view
  var PX = 20, PY = 20, PW = 372, PH = 313, MX = 176, MY = 208;
  var pat = A.el('pattern', { id: 'drk-grid', width: 48, height: 48, patternUnits: 'userSpaceOnUse' }, defs);
  A.el('rect', { width: 48, height: 48, fill: '#0b0b0b' }, pat);
  A.el('rect', { width: 24, height: 24, fill: '#141414' }, pat); A.el('rect', { x: 24, y: 24, width: 24, height: 24, fill: '#141414' }, pat);
  A.el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 14, fill: 'url(#drk-grid)', stroke: '#2a2a2a', 'stroke-width': 1.5 }, gMM);
  var tvLab = txt(gMM, PX + 16, PY + 30, 'top view', { fill: GREY });
  var clipPath = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 6, 'stroke-opacity': 0.55, 'stroke-dasharray': '2 11', 'stroke-linecap': 'round' }, gMM);
  var wantPath = A.el('path', { fill: 'none', stroke: G, 'stroke-width': 4, 'stroke-linecap': 'round' }, gMM);
  var wantHead = A.el('path', { fill: 'none', stroke: G, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gMM);
  var cDots = [], wDots = [], wLab = [], i_;
  for (i_ = 0; i_ < 3; i_++) cDots.push(A.el('circle', { r: 7, fill: '#0b0b0b', stroke: '#fff', 'stroke-width': 2.5 }, gMM));
  for (i_ = 0; i_ < 3; i_++) wDots.push(A.el('circle', { r: 6, fill: G }, gMM));
  wLab.push(txt(gMM, PX + PW - 16, PY + 30, 'dots: 20, 40, 60 frames ahead', { fill: GREY, anchor: 'end', halo: true }));
  var marker = grp(gMM);
  A.el('path', { d: 'M13 0L-2 -11L-2 11Z', fill: '#fff', transform: 'translate(13 0)' }, marker);
  A.el('circle', { r: 14, fill: '#fff', stroke: '#0b0b0b', 'stroke-width': 2 }, marker);
  var SX = 74, SY = 112;                                        // the stick
  A.el('circle', { cx: SX, cy: SY, r: 30, fill: '#0b0b0b', stroke: '#6a6a6a', 'stroke-width': 3 }, gMM);
  var stick = A.el('circle', { r: 12, fill: '#fff' }, gMM);
  txt(gMM, SX, SY + 54, 'stick', { fill: GREY, anchor: 'middle', halo: true });
  var legA = grp(gMM), legB = grp(gMM);
  A.el('path', { d: 'M' + (PX + 16) + ' ' + (PY + PH - 20) + 'h30', stroke: G, 'stroke-width': 4, 'stroke-linecap': 'round' }, legA);
  txt(legA, PX + 56, PY + PH - 13, 'where the user wants to go', { fill: G, weight: 700, halo: true });
  A.el('path', { d: 'M' + (PX + 16) + ' ' + (PY + PH - 20) + 'h30', stroke: G, 'stroke-width': 4, 'stroke-linecap': 'round' }, legB);
  txt(legB, PX + 56, PY + PH - 13, 'wanted', { fill: G, weight: 700, halo: true });
  A.el('path', { d: 'M' + (PX + 150) + ' ' + (PY + PH - 20) + 'h30', stroke: '#fff', 'stroke-width': 6, 'stroke-opacity': 0.55, 'stroke-dasharray': '2 11', 'stroke-linecap': 'round' }, legB);
  txt(legB, PX + 190, PY + PH - 13, 'the clip playing', { fill: '#fff', weight: 700, halo: true });
  // ---- the command, read out
  var RX = 420, RW_ = 712, CW = 178;
  ['direction', 'heading', 'speed', 'style'].forEach(function (s, i) { txt(gMM, RX + i * CW, 40, s, { fill: GREY }); });
  function dial(i, col) {
    var g = grp(gMM), cx = RX + i * CW + 24, cy = 76;
    A.el('circle', { cx: cx, cy: cy, r: 21, fill: 'none', stroke: '#3a3a3a', 'stroke-width': 2.5 }, g);
    return { cx: cx, cy: cy, ln: A.el('path', { fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g) };
  }
  var dDir = dial(0, G), dHead = dial(1, '#fff');
  A.el('rect', { x: RX + 2 * CW, y: 69, width: 130, height: 14, rx: 7, fill: '#262626' }, gMM);
  var spBar = A.el('rect', { x: RX + 2 * CW, y: 69, height: 14, rx: 7, fill: G }, gMM);
  var stTxt = {};
  ['walk', 'run', 'crouch'].forEach(function (s) { stTxt[s] = txt(gMM, RX + 3 * CW, 85, s, { weight: 700, size: 26 }); });
  // ---- step 0: the question the next click answers
  var gAsk = grp(gMM);
  A.el('rect', { x: RX + 1.5, y: 121.5, width: RW_ - 3, height: 184, rx: 14, fill: 'none', stroke: '#3a3a3a', 'stroke-width': 2, 'stroke-dasharray': '7 7' }, gAsk);
  txt(gAsk, RX + RW_ / 2, 222, 'which motion does the character play?', { fill: C.mute, anchor: 'middle', size: 23 });
  // ---- step 1: the database
  var gDB = grp(gMM), BY = 160, BH = 42, VPX = 20;            // strip top, strip height, playback speed px/s
  var SEGX = [70, 500, 270, 620];
  txt(gDB, RX, 134, 'mocap database <tspan fill="' + GREY + '" font-weight="500">≈ 10 min</tspan>', { weight: 700, size: 22 });
  txt(gDB, 992, 134, 'search every 10 frames', { fill: GREY, anchor: 'end' });
  var cnt = [];
  for (i_ = 0; i_ < 10; i_++) cnt.push(A.el('rect', { x: 1003 + i_ * 13, y: 120, width: 10, height: 14, rx: 2.5, fill: '#2a2a2a' }, gDB));
  A.el('rect', { x: RX, y: BY, width: RW_, height: BH, rx: 8, fill: '#191919', stroke: '#333', 'stroke-width': 1.5 }, gDB);
  var tk = '';
  for (i_ = 1; i_ < 89; i_++) tk += 'M' + (RX + i_ * 8) + ' ' + (BY + 9) + 'v' + (BH - 18);
  A.el('path', { d: tk, stroke: '#343434', 'stroke-width': 2 }, gDB);
  var trail = A.el('rect', { y: BY + 9, height: BH - 18, fill: '#fff', 'fill-opacity': 0.28 }, gDB);
  var sweep = A.el('rect', { y: BY + 2, width: 30, height: BH - 4, rx: 5, fill: AMB, 'fill-opacity': 0.5 }, gDB);
  var match = A.el('rect', { y: BY - 4, width: 14, height: BH + 8, rx: 5, fill: 'none', stroke: G, 'stroke-width': 3.5 }, gDB);
  var phead = A.el('path', { fill: '#fff', stroke: '#101010', 'stroke-width': 1.5 }, gDB);
  var arc = A.el('path', { fill: 'none', stroke: G, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, gDB);
  var arcH = A.el('path', { fill: 'none', stroke: G, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gDB);
  txt(gDB, RX, 289, 'query', { fill: GREY });
  var chips = [], cx_ = RX + 64;
  [['feet: position, velocity', 226], ['hip velocity', 126], ['path: +20, +40, +60 frames', 272]].forEach(function (c) {
    chips.push(A.el('rect', { x: cx_, y: 265, width: c[1], height: 35, rx: 9, fill: '#161616', stroke: '#4a4a4a', 'stroke-width': 2 }, gDB));
    txt(gDB, cx_ + c[1] / 2, 289, c[0], { anchor: 'middle' });
    cx_ += c[1] + 10;
  });
  var stKeep = txt(gDB, RX, 332, 'the clip being played is still the best match: keep playing', { fill: C.mid });
  var stJump = txt(gDB, RX, 332, 'a frame somewhere else fits better: jump there and blend', { fill: G, weight: 700 });

  function drawMM(f, oDB, oOld) {                              // oDB: the database part (click 1); oOld: what it replaces
    var t = f.t, u = A.loop(t, T);
    var dDes = piece(u, -LEAD, 'dir', 0.3) * DEG, sDes = piece(u, -LEAD, 'sp', 0.3), hDes = piece(u, -LEAD, 'head', 0.3) * DEG;
    var dCur = piece(u, JUMP, 'dir', 0.35) * DEG, sCur = piece(u, JUMP, 'sp', 0.35), hCur = piece(u, JUMP, 'head', 0.35) * DEG;
    var g = ground(t);
    A.set(pat, { patternTransform: 'translate(' + (-(g[0] % 48)).toFixed(2) + ' ' + (-(g[1] % 48)).toFixed(2) + ')' });
    A.set(marker, { transform: 'translate(' + MX + ' ' + MY + ') rotate(' + (-hCur / DEG).toFixed(1) + ')' });
    A.set(stick, { cx: (SX + 17 * sDes * Math.cos(dDes)).toFixed(1), cy: (SY - 17 * sDes * Math.sin(dDes)).toFixed(1) });
    // the wanted path leaves along the current motion and bends toward the stick; the playing clip continues straight
    var Lc = 50 + 85 * sCur, Ld = 50 + 85 * sDes, c1 = [Math.cos(dCur), -Math.sin(dCur)], c2 = [Math.cos(dDes), -Math.sin(dDes)];
    var P1 = [MX + 0.5 * Lc * c1[0], MY + 0.5 * Lc * c1[1]], P2 = [P1[0] + 0.5 * Ld * c2[0], P1[1] + 0.5 * Ld * c2[1]];
    A.set(wantPath, { d: 'M' + MX + ' ' + MY + 'Q' + P1[0].toFixed(1) + ' ' + P1[1].toFixed(1) + ' ' + P2[0].toFixed(1) + ' ' + P2[1].toFixed(1) });
    A.set(wantHead, { d: head(P2[0] + 9 * c2[0], P2[1] + 9 * c2[1], Math.atan2(c2[1], c2[0]), 13) });
    A.set(clipPath, { d: 'M' + MX + ' ' + MY + 'L' + (MX + Lc * c1[0]).toFixed(1) + ' ' + (MY + Lc * c1[1]).toFixed(1) });
    for (var i = 0; i < 3; i++) {
      var s = (i + 1) / 3, bx = 2 * s * (1 - s) * (P1[0] - MX) + s * s * (P2[0] - MX) + MX, by = 2 * s * (1 - s) * (P1[1] - MY) + s * s * (P2[1] - MY) + MY;
      A.set(wDots[i], { cx: bx.toFixed(1), cy: by.toFixed(1) });
      A.set(cDots[i], { cx: (MX + s * Lc * c1[0]).toFixed(1), cy: (MY + s * Lc * c1[1]).toFixed(1) });
      A.show(wDots[i], oDB); A.show(cDots[i], oDB);
    }
    A.show(wLab[0], oDB);
    A.show(tvLab, oOld); A.show(clipPath, oDB); A.show(wantHead, oOld); A.show(legA, oOld); A.show(legB, oDB);
    // read-outs
    A.set(dDir.ln, { d: 'M' + dDir.cx + ' ' + dDir.cy + 'L' + (dDir.cx + 19 * Math.cos(dDes)).toFixed(1) + ' ' + (dDir.cy - 19 * Math.sin(dDes)).toFixed(1) +
      head(dDir.cx + 19 * Math.cos(dDes), dDir.cy - 19 * Math.sin(dDes), -dDes, 9) });
    A.set(dHead.ln, { d: 'M' + dHead.cx + ' ' + dHead.cy + 'L' + (dHead.cx + 19 * Math.cos(hDes)).toFixed(1) + ' ' + (dHead.cy - 19 * Math.sin(hDes)).toFixed(1) +
      head(dHead.cx + 19 * Math.cos(hDes), dHead.cy - 19 * Math.sin(hDes), -hDes, 9) });
    A.set(spBar, { width: (130 * sDes).toFixed(1) });
    var ci = seg(u, -LEAD)[0];
    for (var k in stTxt) A.show(stTxt[k], CMD[ci].st === k ? 1 : 0);
    A.show(gAsk, oOld); A.show(gDB, oDB);
    if (oDB <= 0) return;
    // the database: playback, the search every second, the jump
    var tick = Math.floor(u), ft = u - tick, sj = seg(u, JUMP), cur = sj[0], x = RX + SEGX[cur] + VPX * sj[1];
    var isJump = TICK.indexOf(tick) >= 0, nxt = TICK.indexOf(tick);
    A.set(phead, { d: 'M' + (x - 3).toFixed(1) + ' ' + (BY - 3) + 'h6v' + (BH + 6) + 'h-6ZM' + (x - 9).toFixed(1) + ' ' + (BY - 13) + 'h18l-9 10Z' });
    A.set(trail, { x: RX + SEGX[cur], width: Math.max(0, x - RX - SEGX[cur]).toFixed(1) });
    for (i = 0; i < 10; i++) A.set(cnt[i], { fill: i <= Math.floor(ft * 10) ? '#e8e8e8' : '#2a2a2a' });
    var sw = ramp(ft, 0, 0.35);
    A.set(sweep, { x: (RX + (RW_ - 30) * sw).toFixed(1) }); A.show(sweep, ft < 0.35 ? 1 : 0);
    chips.forEach(function (c) { A.set(c, { stroke: ft < 0.35 ? AMB : '#4a4a4a' }); });
    // where the best match is: the frame after the one being played, or (at a jump tick) the start of the next clip
    var mx = isJump ? RX + SEGX[nxt] : x;
    A.set(match, { x: (mx - 7).toFixed(1) }); A.show(match, ramp(ft, 0.3, 0.4) * (1 - ramp(ft, 0.85, 1)));
    var oa = isJump ? ramp(ft, 0.34, 0.45) * (1 - ramp(ft, 0.9, 1)) : 0;
    if (isJump) {
      var jx = RX + SEGX[(nxt + 3) % 4] + VPX * 3, my = BY + BH + 52;
      A.set(arc, { d: 'M' + jx.toFixed(1) + ' ' + (BY + BH + 8) + 'Q' + ((jx + mx) / 2).toFixed(1) + ' ' + my + ' ' + mx.toFixed(1) + ' ' + (BY + BH + 10) });
      A.set(arcH, { d: head(mx, BY + BH + 9, Math.atan2(BY + BH + 10 - my, (mx - jx) / 2), 12) });
    }
    A.show(arc, oa); A.show(arcH, oa);
    // the verdict of the last search stays until the next one
    var last = ft >= 0.35 ? tick : (tick + 11) % 12, lj = TICK.indexOf(last) >= 0;
    A.show(stJump, lj ? 1 : 0); A.show(stKeep, lj ? 0 : 1);
  }

  // =========================================================================================== scene 2: one joint, open loop, then with the offset
  var gJ = grp(), TJ = 9.6, NJ = 576, JX = 236, JY = 146, LEN = 160;
  function aKin(t) { return (40 + 21 * Math.sin(2 * Math.PI * t / 3.2)) * DEG; }                       // the animation's joint angle
  function aOff(t) { return (13 * Math.sin(2 * Math.PI * t / 4.8 + 0.6) + 4 * Math.sin(2 * Math.PI * t / 1.6)) * DEG; }   // the policy's offset (illustration)
  function pdTrack(tgt) {                                       // angle of a link driven by a PD motor toward tgt(t): a'' = w^2 (tgt - a) - 2 z w a'
    var w = 13, z = 0.7, h = TJ / NJ / 8, a = tgt(0), v = 0, out = [], n, k;
    for (n = 0; n < 2 * NJ; n++) {                              // two loops: the second one is periodic
      if (n >= NJ) out.push(a);
      for (k = 0; k < 8; k++) { var tt = (n * 8 + k) * h; v += h * (w * w * (tgt(tt) - a) - 2 * z * w * v); a += h * v; }
    }
    out.push(out[0]);
    return out;
  }
  var SIM2 = pdTrack(aKin), SIM3 = pdTrack(function (t) { return aKin(t) + aOff(t); });
  function samp(arr, t) { var x = A.loop(t, TJ) / TJ * NJ, i = Math.min(NJ - 1, Math.floor(x)); return lerp(arr[i], arr[i + 1], x - i); }
  function limb(a, len) { return [JX + len * Math.cos(a), JY + len * Math.sin(a)]; }
  A.el('path', { d: 'M78 88L' + JX + ' ' + JY, stroke: '#3b4048', 'stroke-width': 36, 'stroke-linecap': 'round' }, gJ);
  txt(gJ, 40, 50, 'parent body', { fill: GREY });
  var simL = A.el('path', { stroke: BLUE, 'stroke-width': 30, 'stroke-linecap': 'round' }, gJ);
  var wedge = A.el('path', { fill: G, 'fill-opacity': 0.42, stroke: G, 'stroke-width': 2, 'stroke-linejoin': 'round' }, gJ);
  var kinL = A.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '9 7', 'stroke-linejoin': 'round' }, gJ);
  var tgtL = A.el('path', { stroke: G, 'stroke-width': 5, 'stroke-linecap': 'round' }, gJ);
  A.el('circle', { cx: JX, cy: JY, r: 19, fill: '#101010', stroke: '#e8e8e8', 'stroke-width': 3.5 }, gJ);
  A.el('circle', { cx: JX, cy: JY, r: 5, fill: '#e8e8e8' }, gJ);
  A.el('path', { d: 'M' + (JX - 16) + ' ' + (JY + 14) + 'L' + (JX - 54) + ' ' + (JY + 62), stroke: '#6a6a6a', 'stroke-width': 2 }, gJ);
  txt(gJ, JX - 58, JY + 86, 'PD motor', { fill: GREY, anchor: 'end' });
  txt(gJ, JX - 58, JY + 112, 'at the joint', { fill: GREY, anchor: 'end' });
  function outline(a, len, r) {                                 // capsule outline of half-width r from the joint along angle a
    var c = Math.cos(a), s = Math.sin(a), ex = JX + len * c, ey = JY + len * s, px = -s * r, py = c * r;
    return 'M' + (JX + px).toFixed(1) + ' ' + (JY + py).toFixed(1) + 'L' + (ex + px).toFixed(1) + ' ' + (ey + py).toFixed(1) +
           'A' + r + ' ' + r + ' 0 0 0 ' + (ex - px).toFixed(1) + ' ' + (ey - py).toFixed(1) + 'L' + (JX - px).toFixed(1) + ' ' + (JY - py).toFixed(1);
  }
  // legend of the joint (right of it)
  var LX = 330, lg3 = grp(gJ);
  A.el('path', { d: 'M' + LX + ' 40h34', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '9 7' }, gJ);
  txt(gJ, LX + 46, 47, 'the animation’s joint angle', { weight: 700 });
  A.el('path', { d: 'M' + LX + ' 74h34', stroke: BLUE, 'stroke-width': 12, 'stroke-linecap': 'round' }, gJ);
  txt(gJ, LX + 46, 81, 'the simulated limb', { weight: 700, fill: '#aab2ff' });
  A.el('path', { d: 'M' + LX + ' 108h34', stroke: G, 'stroke-width': 5, 'stroke-linecap': 'round' }, lg3);
  txt(lg3, LX + 46, 115, 'PD target = angle + offset', { weight: 700, fill: G });
  // ---- body map: which joints
  var BX = 742, gB = grp(gJ);
  var JT = {   // name: [x, y, corrected by the policy?]   front view; corrected = UpLeg, Leg, Foot, Toe, Spine, Arm (Sec. 6.4, Fig. 4)
    neck: [0, 62, 0], shL: [-44, 78, 1], shR: [44, 78, 1], elL: [-60, 138, 0], elR: [60, 138, 0], wrL: [-66, 194, 0], wrR: [66, 194, 0],
    chest: [0, 112, 0], spine: [0, 150, 1], hipL: [-24, 186, 1], hipR: [24, 186, 1], knL: [-29, 248, 1], knR: [29, 248, 1],
    anL: [-32, 306, 1], anR: [32, 306, 1], toL: [-50, 322, 1], toR: [50, 322, 1] };
  var bones = [['neck', 'chest'], ['chest', 'spine'], ['shL', 'shR'], ['shL', 'elL'], ['elL', 'wrL'], ['shR', 'elR'], ['elR', 'wrR'],
               ['hipL', 'hipR'], ['hipL', 'knL'], ['knL', 'anL'], ['anL', 'toL'], ['hipR', 'knR'], ['knR', 'anR'], ['anR', 'toR']], bd = '';
  bones.forEach(function (b) { bd += 'M' + (BX + JT[b[0]][0]) + ' ' + JT[b[0]][1] + 'L' + (BX + JT[b[1]][0]) + ' ' + JT[b[1]][1]; });
  bd += 'M' + BX + ' 150L' + BX + ' 186M' + BX + ' 62L' + BX + ' 78';
  A.el('path', { d: bd, fill: 'none', stroke: '#4b5058', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gB);
  A.el('circle', { cx: BX, cy: 38, r: 19, fill: '#4b5058' }, gB);
  var jd = [];
  for (var nm in JT) jd.push([A.el('circle', { cx: BX + JT[nm][0], cy: JT[nm][1], r: 8, fill: '#f0f0f0', stroke: '#101010', 'stroke-width': 2 }, gB), JT[nm][2]]);
  var TX = 860, tA = grp(gJ), tB = grp(gJ);
  txt(tA, TX, 96, 'Open loop', { weight: 700, size: 26 });
  txt(tA, TX, 132, 'every joint’s PD target is', { fill: C.mid, size: 21 });
  txt(tA, TX, 160, 'the animation’s angle', { fill: C.mid, size: 21 });
  txt(tA, TX, 204, 'nothing reacts when', { fill: AMB, size: 21, weight: 700 });
  txt(tA, TX, 232, 'the body starts to tip', { fill: AMB, size: 21, weight: 700 });
  txt(tB, TX, 84, 'Feedback', { weight: 700, size: 26 });
  txt(tB, TX, 122, 'sees 6 bodies of both', { fill: AMB, size: 21, weight: 700 });
  txt(tB, TX, 149, 'characters: head, spine,', { fill: C.mid, size: 21 });
  txt(tB, TX, 176, 'forearms, toes', { fill: C.mid, size: 21 });
  txt(tB, TX, 218, 'offsets the green joints:', { fill: G, size: 21, weight: 700 });
  txt(tB, TX, 245, 'legs, spine, upper arms', { fill: C.mid, size: 21 });
  txt(tB, TX, 272, '(25 numbers, 30 Hz)', { fill: C.mid, size: 21 });
  // what the policy sees (Sec. 6.3): LeftToe, RightToe, Spine, Head, LeftForeArm, RightForeArm, of both characters
  var rings = grp(gB);
  [[0, 38, 25], [0, 150, 15], [-63, 166, 14], [63, 166, 14], [-50, 322, 15], [50, 322, 15]].forEach(function (r) {
    A.el('circle', { cx: BX + r[0], cy: r[1], r: r[2], fill: 'none', stroke: AMB, 'stroke-width': 3.5 }, rings);
  });

  function drawJ(f, on, oA, oB) {                               // on: 0 open loop .. 1 with the offset; oA / oB: the two captions
    var t = f.t, ak = aKin(t), off = aOff(t) * on, at = ak + off, as = lerp(samp(SIM2, t), samp(SIM3, t), on);
    var e = limb(as, LEN), g = limb(at, LEN + 30);
    A.set(simL, { d: 'M' + JX + ' ' + JY + 'L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1) });
    A.set(kinL, { d: outline(ak, LEN, 19) });
    A.set(tgtL, { d: 'M' + JX + ' ' + JY + 'L' + g[0].toFixed(1) + ' ' + g[1].toFixed(1) });
    var R = LEN + 30, p1 = [JX + R * Math.cos(ak), JY + R * Math.sin(ak)], p2 = [JX + R * Math.cos(at), JY + R * Math.sin(at)];
    A.set(wedge, { d: 'M' + JX + ' ' + JY + 'L' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'A' + R + ' ' + R + ' 0 0 ' + (off > 0 ? 1 : 0) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) + 'Z' });
    A.show(wedge, on); A.show(tgtL, on); A.show(lg3, on); A.show(tA, oA); A.show(tB, oB); A.show(rings, oB);
    jd.forEach(function (j) { A.set(j[0], { fill: (j[1] && on > 0.5) ? G : '#f0f0f0', r: (j[1] && on > 0.5) ? 9.5 : 8 }); });
  }

  // =========================================================================================== scene 3: the reward and its fall factor
  var gR = grp(), FLOOR = 292, FX0 = 140, HPX = 228, PPM = HPX / 1.8;     // floor, stance point, body height in px (1.8 m in the authors' video)
  // a rigid rod of the body's height tipping about its foot: phi'' = (3 g / 2 L) sin(phi), played 2.2 times slower
  var PHI = [], ph_ = 0.02, pv_ = 0, hstep = 1 / 600, SLOW = 2.2, HEADH = 0.925 * HPX;
  while (2 * HEADH * Math.sin(ph_ / 2) / PPM < 1.0 && PHI.length < 6000) { PHI.push(ph_); pv_ += hstep * (3 * 9.81 / (2 * 1.8)) * Math.sin(ph_); ph_ += hstep * pv_; }
  PHI.push(ph_);
  var TFALL = (PHI.length - 1) * hstep * SLOW, R0 = 0.9, HOLD = 1.3, BACK = 0.7, TR = R0 + TFALL + HOLD + BACK;
  A.el('path', { d: 'M24 ' + FLOOR + 'H450', stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, gR);
  function body(col, w, hr) {
    var g = A.el('g', { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gR);
    return { g: g, p: A.el('path', {}, g), h: A.el('circle', { r: hr, fill: col, stroke: 'none' }, g) };
  }
  var kinB = body('#f4f4f4', 16, 18), simB = body(BLUE, 9, 14);
  var gapL = A.el('path', { stroke: AMB, 'stroke-width': 4, 'stroke-dasharray': '3 8', 'stroke-linecap': 'round' }, gR);
  var gapT = txt(gR, 0, 0, 'head gap', { fill: AMB, weight: 700, halo: true });
  var endT = grp(gR), backT = grp(gR);
  txt(endT, 356, 44, 'heads 1 m apart:', { fill: AMB, weight: 700, anchor: 'middle', size: 21 });
  txt(endT, 356, 71, 'the episode ends', { fill: AMB, weight: 700, anchor: 'middle', size: 21 });
  txt(backT, 356, 44, 'restart on the', { fill: '#fff', weight: 700, anchor: 'middle', size: 21 });
  txt(backT, 356, 71, 'kinematic pose', { fill: '#fff', weight: 700, anchor: 'middle', size: 21 });
  A.el('path', { d: 'M28 ' + (FLOOR + 30) + 'h30', stroke: '#f4f4f4', 'stroke-width': 10, 'stroke-linecap': 'round' }, gR);
  txt(gR, 70, FLOOR + 37, 'kinematic', { weight: 700 });
  A.el('path', { d: 'M196 ' + (FLOOR + 30) + 'h30', stroke: BLUE, 'stroke-width': 10, 'stroke-linecap': 'round' }, gR);
  txt(gR, 238, FLOOR + 37, 'simulated', { weight: 700, fill: '#aab2ff' });
  function pose(ph) {                                           // side view, walking on the spot: points relative to the stance point, y up, in units of body height
    var hip = [0, 0.50 + 0.012 * Math.abs(Math.cos(ph))], pts = [], k;
    for (k = 0; k < 2; k++) {
      var p = ph + k * Math.PI, th = 0.42 * Math.sin(p), kn = 0.12 + 0.7 * Math.max(0, Math.cos(p));
      var kx = hip[0] + 0.25 * Math.sin(th), ky = hip[1] - 0.25 * Math.cos(th);
      pts.push([hip, [kx, ky], [kx + 0.25 * Math.sin(th - kn), Math.max(0.02, ky - 0.25 * Math.cos(th - kn))]]);
      var sh = [0.015, 0.80], up = -0.4 * Math.sin(p), ex = sh[0] + 0.16 * Math.sin(up), ey = sh[1] - 0.16 * Math.cos(up);
      pts.push([sh, [ex, ey], [ex + 0.15 * Math.sin(up + 0.45), ey - 0.15 * Math.cos(up + 0.45)]]);
    }
    pts.push([hip, [0.015, 0.82]]);
    return { lines: pts, head: [0.025, 0.925] };
  }
  function place(b, ps, phi) {                                  // draw pose ps rotated by phi about the stance point
    var c = Math.cos(phi), s = Math.sin(phi), d = '';
    function P(q) { var x = q[0] * HPX, y = q[1] * HPX; return [FX0 + x * c + y * s, FLOOR - (y * c - x * s)]; }
    ps.lines.forEach(function (ln) { ln.forEach(function (q, i) { var p = P(q); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }); });
    var h = P(ps.head);
    A.set(b.p, { d: d }); A.set(b.h, { cx: h[0].toFixed(1), cy: h[1].toFixed(1) });
    return h;
  }
  // ---- the fall factor, drawn from its formula (the two formulas above it are HTML, set by the slide)
  var QX = 560, QW = 440, QY = 296, QH = 92, GMAX = 1.12;
  function qx(gm) { return QX + gm / GMAX * QW; }
  function qy(e) { return QY - e * QH; }
  function efall(gm) { return A.clamp(1.3 - 1.4 * gm, 0, 1); }
  txt(gR, 500, 100, 'body positions · body velocities · local pose · CM velocity', { weight: 700 });
  txt(gR, 500, 127, 'each of the four terms is 1 when blue is exactly on white', { fill: C.mid });
  A.el('path', { d: 'M' + QX + ' ' + (QY - QH - 8) + 'V' + QY + 'H' + (QX + QW + 8), fill: 'none', stroke: C.line, 'stroke-width': 2.5 }, gR);
  A.el('path', { d: 'M' + qx(1) + ' ' + (QY - QH - 6) + 'V' + QY, stroke: AMB, 'stroke-width': 2.5, 'stroke-dasharray': '6 6' }, gR);
  A.el('path', { d: A.path([[qx(0), qy(1)], [qx(0.3 / 1.4), qy(1)], [qx(1.3 / 1.4), qy(0)], [qx(GMAX), qy(0)]]), fill: 'none', stroke: '#fff', 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gR);
  txt(gR, QX - 12, qy(1) + 7, '1', { fill: GREY, anchor: 'end' });
  txt(gR, QX - 12, qy(0) + 7, '0', { fill: GREY, anchor: 'end' });
  txt(gR, qx(0), QY + 27, '0', { fill: GREY, anchor: 'middle' });
  txt(gR, qx(1), QY + 27, '1 m', { fill: AMB, anchor: 'middle', weight: 700 });
  txt(gR, qx(0.5), QY + 27, 'distance between the two heads', { fill: GREY, anchor: 'middle' });
  txt(gR, qx(1) + 12, qy(0.62), 'episode', { fill: AMB, weight: 700 });
  txt(gR, qx(1) + 12, qy(0.62) + 25, 'ends', { fill: AMB, weight: 700 });
  var dot = A.el('circle', { r: 10, fill: AMB, stroke: '#101010', 'stroke-width': 2.5 }, gR);

  function drawR(f) {
    var t = f.step === 4 ? f.ts : f.t, u = A.loop(t, TR), ps = pose(2 * Math.PI * t / 1.1), phi, vis = 1;
    if (u < R0) phi = 0;
    else if (u < R0 + TFALL) { var x = (u - R0) / SLOW / hstep, i = Math.min(PHI.length - 2, Math.floor(x)); phi = lerp(PHI[i], PHI[i + 1], x - i); }
    else if (u < R0 + TFALL + HOLD) { phi = PHI[PHI.length - 1]; vis = 1 - 0.7 * ramp(u, R0 + TFALL + 0.5, R0 + TFALL + HOLD); }
    else { phi = 0; vis = ramp(u, R0 + TFALL + HOLD, R0 + TFALL + HOLD + 0.4); }
    var hk = place(kinB, ps, 0), hs = place(simB, ps, phi), gm = Math.hypot(hs[0] - hk[0], hs[1] - hk[1]) / PPM;
    A.show(simB.g, vis);
    A.set(gapL, { d: 'M' + hk[0].toFixed(1) + ' ' + hk[1].toFixed(1) + 'L' + hs[0].toFixed(1) + ' ' + hs[1].toFixed(1) });
    var og = ramp(gm, 0.12, 0.3);
    A.show(gapL, og); A.show(gapT, og);
    A.set(gapT, { x: (hk[0] - 6).toFixed(1), y: (hk[1] - 34).toFixed(1) });
    var ended = u >= R0 + TFALL && u < R0 + TFALL + HOLD, back = u >= R0 + TFALL + HOLD;
    A.show(endT, ended ? 1 : 0); A.show(backT, back ? 1 : 0);
    A.set(dot, { cx: qx(gm).toFixed(1), cy: qy(efall(gm)).toFixed(1) });
  }

  txt(el, 1132, 340, 'schematic', { fill: '#6a6a6a', anchor: 'end', size: 20 });

  return function draw(f) {
    var s = f.step, out = 1 - ramp(f.ts, 0, 0.25), inn = ease(ramp(f.ts, 0.2, 0.6));
    var oMM = s <= 1 ? 1 : (s === 2 ? out : 0);
    var oJ = s === 2 ? inn : (s === 3 ? 1 : (s === 4 ? out : 0));
    var oR = s >= 4 ? (s === 4 ? inn : 1) : 0;
    A.show(gMM, oMM); A.show(gJ, oJ); A.show(gR, oR);
    gMM.style.display = oMM > 0 ? '' : 'none'; gJ.style.display = oJ > 0 ? '' : 'none'; gR.style.display = oR > 0 ? '' : 'none';
    if (oMM > 0) drawMM(f, s < 1 ? 0 : (s === 1 ? inn : 1), s < 1 ? 1 : (s === 1 ? out : 0));
    if (oJ > 0) drawJ(f, s < 3 ? 0 : (s === 3 ? ease(ramp(f.ts, 0, 0.8)) : 1), s < 3 ? 1 : (s === 3 ? out : 0), s < 3 ? 0 : (s === 3 ? inn : 1));
    if (oR > 0) drawR(f);
  };
});
