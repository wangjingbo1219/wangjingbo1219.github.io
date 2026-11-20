/* Slide "The tracking reward, term by term": a simulated character against its reference clip.
 * Data: window.RW_TRACK (tools/fig/rw_track_sim.py): a MuJoCo humanoid that follows a keyframed squat-and-hop clip with PD control.
 * Steps: 0 both bodies · 1 pose (a wedge per joint = its rotation error) · 2 velocity (a curved arrow per joint = its angular-velocity error)
 *        3 end-effectors (hand / foot offsets) · 4 centre of mass · 5 all four together
 * Every marker is drawn from the simulated 3D errors; nothing is exaggerated.
 */
DeckAnim.register('rw-track', function (el, A) {
  'use strict';
  var D = window.RW_TRACK, RW = window.RW, C = A.C;
  if (!D || !RW) throw new Error('rw-track: data not loaded');
  var X0 = 392, Y0 = 540, S = 0.094;                     // data: tenths of a pixel at 300 px per metre -> 282 px per metre here
  var NG = D.geoms.length, NJ = D.joints.length, T = RW.TERMS;
  var PX = function (v) { return X0 + S * v; }, PY = function (v) { return Y0 + S * v; };

  // floor
  A.el('ellipse', { cx: X0 + 6, cy: Y0 + 2, rx: 205, ry: 15, fill: '#191919' }, el);
  var gRef = A.el('g', {}, el), gSim = A.el('g', {}, el), gMk = A.el('g', {}, el), gLab = A.el('g', {}, el);
  var refO = [], refI = [], simE = [], simF = [], i;
  for (i = 0; i < NG; i++) refO.push(A.el('line', { stroke: C.g, 'stroke-linecap': 'round' }, gRef));
  for (i = 0; i < NG; i++) refI.push(A.el('line', { stroke: '#18250a', 'stroke-linecap': 'round' }, gRef));
  for (i = 0; i < NG; i++) {
    simE.push(A.el('line', { stroke: '#0c0c0c', 'stroke-linecap': 'round' }, gSim));
    simF.push(A.el('line', { 'stroke-linecap': 'round' }, gSim));
  }
  var shade = D.geoms.map(function (n) { return /_left$/.test(n) ? '#878c94' : (/_right$/.test(n) ? '#c9ccd2' : '#aeb2b9'); });   // far side darker

  // markers
  var gPose = A.el('g', {}, gMk), gVel = A.el('g', {}, gMk), gEE = A.el('g', {}, gMk), gCom = A.el('g', {}, gMk);
  var wedge = [], arc = [], arcH = [], eeL = [], eeS = [], eeR = [];
  for (i = 0; i < NJ; i++) {
    wedge.push(A.el('path', { fill: T[0].col, 'fill-opacity': 0.94, stroke: '#0c0c0c', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, gPose));
    arc.push(A.el('path', { fill: 'none', stroke: T[1].col, 'stroke-width': 5, 'stroke-linecap': 'round' }, gVel));
    arcH.push(A.el('path', { fill: 'none', stroke: T[1].col, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gVel));
  }
  for (i = 0; i < 4; i++) {
    eeL.push(A.el('line', { stroke: T[2].col, 'stroke-width': 4, 'stroke-linecap': 'round' }, gEE));
    eeR.push(A.el('circle', { r: 8, fill: '#101010', stroke: T[2].col, 'stroke-width': 3.5 }, gEE));
    eeS.push(A.el('circle', { r: 7.5, fill: T[2].col, stroke: '#101010', 'stroke-width': 2 }, gEE));
  }
  var comL = A.el('line', { stroke: T[3].col, 'stroke-width': 4, 'stroke-linecap': 'round' }, gCom);
  var comR = A.el('circle', { r: 11, fill: '#101010', stroke: T[3].col, 'stroke-width': 3.5 }, gCom);
  var comS = A.el('circle', { r: 10.5, fill: T[3].col, stroke: '#101010', 'stroke-width': 2 }, gCom);

  // call-outs: fixed label, moving leader
  function callout() {
    var g = A.el('g', {}, gLab);
    return { g: g, ln: A.el('path', { fill: 'none', 'stroke-width': 2, 'stroke-linejoin': 'round' }, g), ring: A.el('circle', { r: 12, fill: 'none', 'stroke-width': 2.5 }, g),
      nm: A.text(g, 0, 0, '', { size: 20, weight: 500, fill: C.mid }), val: A.text(g, 0, 0, '', { size: 28 }) };
  }
  var co = [callout(), callout()];
  var JI = function (n) { return D.joints.indexOf(n); }, EI = function (n) { return D.ees.indexOf(n); };
  var POS = { a: [22, 62], b: [22, 372], m: [22, 226] };
  function setCall(c, pos, name, value, col, tx, ty, op) {
    var x = pos[0], y = pos[1];
    A.set(c.nm, { x: x, y: y, text: name });
    A.set(c.val, { x: x, y: y + 31, text: value });
    c.val.style.fill = col;
    A.set(c.ln, { d: 'M' + x + ' ' + (y + 41) + 'H' + (x + 138) + 'L' + tx.toFixed(1) + ' ' + ty.toFixed(1), stroke: col, 'stroke-opacity': 0.75 });
    A.set(c.ring, { cx: tx, cy: ty, stroke: col });
    A.show(c.g, op);
  }

  // legend
  A.el('line', { x1: 30, y1: 580, x2: 50, y2: 580, stroke: '#c9ccd2', 'stroke-width': 13, 'stroke-linecap': 'round' }, el);
  A.text(el, 68, 587, 'character (simulated)', { size: 20, weight: 500, fill: '#d9d9d9', halo: false });
  A.el('line', { x1: 330, y1: 580, x2: 350, y2: 580, stroke: C.g, 'stroke-width': 13, 'stroke-linecap': 'round' }, el);
  A.el('line', { x1: 330, y1: 580, x2: 350, y2: 580, stroke: '#18250a', 'stroke-width': 8, 'stroke-linecap': 'round' }, el);
  A.text(el, 368, 587, 'reference clip', { size: 20, weight: 500, fill: C.g, halo: false });

  function wrap(a) { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; }

  return function draw(f) {
    var p = RW.at(f.t), u = p.u, i0 = p.i0, i1 = p.i1, k, g;
    function L(arr, j) { return arr[i0][j] + (arr[i1][j] - arr[i0][j]) * u; }
    // ---- the two bodies
    var ro = D.refo[i0], so = D.simo[i0];
    for (k = 0; k < NG; k++) {
      g = ro[k];
      var a = { x1: PX(L(D.ref, 4 * g)), y1: PY(L(D.ref, 4 * g + 1)), x2: PX(L(D.ref, 4 * g + 2)), y2: PY(L(D.ref, 4 * g + 3)) };
      a['stroke-width'] = 2 * S * D.rad[g] + 1; A.set(refO[k], a);
      a['stroke-width'] = Math.max(1, 2 * S * D.rad[g] - 5); A.set(refI[k], a);
      g = so[k];
      a = { x1: PX(L(D.sim, 4 * g)), y1: PY(L(D.sim, 4 * g + 1)), x2: PX(L(D.sim, 4 * g + 2)), y2: PY(L(D.sim, 4 * g + 3)) };
      a['stroke-width'] = 2 * S * D.rad[g] + 3; A.set(simE[k], a);
      a['stroke-width'] = 2 * S * D.rad[g]; a.stroke = shade[g]; A.set(simF[k], a);
    }
    // ---- which markers are on
    var last = f.step >= 5, on = function (s) { return f.step === s ? A.ramp(f.ts, 0, 0.45) : (last ? 1 : 0); };
    var oP = on(1), oV = on(2), oE = on(3), oC = on(4);
    A.show(gPose, last ? 0 : oP); A.show(gVel, last ? 0 : oV); A.show(gEE, oE); A.show(gCom, oC);
    var jx = [], jy = [];
    for (k = 0; k < NJ; k++) { jx.push(PX(L(D.ja, 2 * k))); jy.push(PY(L(D.ja, 2 * k + 1))); }
    if (oP > 0 && !last) {
      for (k = 0; k < NJ; k++) {                       // wedge: opening angle = the joint's rotation error (3D), opening towards the reference limb
        var as = D.jas[i0][k] / 1000, sg = wrap(D.jar[i0][k] / 1000 - as) >= 0 ? 1 : -1, th = L(D.pj, k) / 1000, R = 40;
        var a1 = as + sg * th;
        A.set(wedge[k], { d: 'M' + jx[k].toFixed(1) + ' ' + jy[k].toFixed(1) + 'L' + (jx[k] + R * Math.cos(as)).toFixed(1) + ' ' + (jy[k] + R * Math.sin(as)).toFixed(1) +
          'A' + R + ' ' + R + ' 0 ' + (th > Math.PI ? 1 : 0) + ' ' + (sg > 0 ? 1 : 0) + ' ' + (jx[k] + R * Math.cos(a1)).toFixed(1) + ' ' + (jy[k] + R * Math.sin(a1)).toFixed(1) + 'Z' });
      }
    }
    if (oV > 0 && !last) {
      for (k = 0; k < NJ; k++) {                       // curved arrow: length = the joint's angular-velocity error, 0.8 rad of arc per rad/s
        var w = L(D.vj, k) / 1000, sw = Math.min(5.6, 0.8 * w), mid = D.jas[i0][k] / 1000 + Math.PI, Rv = 34;
        var dir = wrap((D.jas[i1][k] - D.jar[i1][k]) / 1000 - (D.jas[i0][k] - D.jar[i0][k]) / 1000) >= 0 ? 1 : -1;
        var b0 = mid - dir * sw / 2, b1 = mid + dir * sw / 2;
        var ex = jx[k] + Rv * Math.cos(b1), ey = jy[k] + Rv * Math.sin(b1);
        A.set(arc[k], { d: 'M' + (jx[k] + Rv * Math.cos(b0)).toFixed(1) + ' ' + (jy[k] + Rv * Math.sin(b0)).toFixed(1) + 'A' + Rv + ' ' + Rv + ' 0 ' + (sw > Math.PI ? 1 : 0) + ' ' +
          (dir > 0 ? 1 : 0) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1) });
        A.set(arcH[k], { d: RW.head(ex, ey, b1 + dir * (Math.PI / 2 - 0.2), 11) });
        A.show(arcH[k], w > 0.25 ? 1 : 0);
      }
    }
    var sx = [], sy = [], rx = [], ry = [];
    for (k = 0; k < 4; k++) { sx.push(PX(L(D.es, 2 * k))); sy.push(PY(L(D.es, 2 * k + 1))); rx.push(PX(L(D.er, 2 * k))); ry.push(PY(L(D.er, 2 * k + 1))); }
    if (oE > 0) {
      for (k = 0; k < 4; k++) {
        A.set(eeL[k], { x1: sx[k], y1: sy[k], x2: rx[k], y2: ry[k] });
        A.set(eeS[k], { cx: sx[k], cy: sy[k] }); A.set(eeR[k], { cx: rx[k], cy: ry[k] });
      }
    }
    var cx = PX(L(D.cs, 0)), cy = PY(L(D.cs, 1)), qx = PX(L(D.cr, 0)), qy = PY(L(D.cr, 1));
    if (oC > 0) { A.set(comL, { x1: cx, y1: cy, x2: qx, y2: qy }); A.set(comS, { cx: cx, cy: cy }); A.set(comR, { cx: qx, cy: qy }); }
    // ---- call-outs for the step being explained
    var cm = function (mm) { return Math.round(mm / 10) + ' cm'; };
    if (f.step === 1) {
      k = JI('right shoulder'); setCall(co[0], POS.a, 'right shoulder is off by', Math.round(L(D.pj, k) * 0.0572958) + '°', T[0].col, jx[k], jy[k], oP);
      k = JI('right knee'); setCall(co[1], POS.b, 'right knee is off by', Math.round(L(D.pj, k) * 0.0572958) + '°', T[0].col, jx[k], jy[k], oP);
    } else if (f.step === 2) {
      k = JI('right shoulder'); setCall(co[0], POS.a, 'right shoulder turns', (L(D.vj, k) / 1000).toFixed(1) + ' rad/s off', T[1].col, jx[k], jy[k], oV);
      k = JI('right knee'); setCall(co[1], POS.b, 'right knee turns', (L(D.vj, k) / 1000).toFixed(1) + ' rad/s off', T[1].col, jx[k], jy[k], oV);
    } else if (f.step === 3) {
      k = EI('right hand'); setCall(co[0], POS.a, 'right hand is', cm(L(D.ej, k)) + ' away', T[2].col, sx[k], sy[k], oE);
      k = EI('right foot'); setCall(co[1], POS.b, 'right foot is', cm(L(D.ej, k)) + ' away', T[2].col, sx[k], sy[k], oE);
    } else if (f.step === 4) {
      setCall(co[0], POS.m, 'centre of mass is', cm(D.ce[i0] + (D.ce[i1] - D.ce[i0]) * u) + ' away', T[3].col, cx, cy, oC);
      A.show(co[1].g, 0);
    } else { A.show(co[0].g, 0); A.show(co[1].g, 0); }
  };
});
