/* Slide "ASE — how": the latent sphere, and the motions its points select.   <svg data-anim="ase-map" viewBox="0 0 1120 370">
 * A SCHEMATIC, not data: six latents on a sphere (64-d in the paper, drawn as a ball), one low-level policy, and where each
 * latent's motion lands among all the motions the body can make. Nothing here is measured; only the logic is the paper's.
 *   step 0  a latent is drawn at random, held (the ring fills), redrawn; a pulse runs latent -> policy -> panel and the motion of
 *           that latent lights up. No reward yet, so the motions lie anywhere
 *   step 1  discriminator: every motion is pulled into the region that looks like the clips, and they bunch together
 *           (Sec. 5.2: the adversarial objective alone is prone to mode collapse, a narrow range of behaviours; Sec. 10.4: without
 *           the skill-discovery and diversity objectives a large portion of the trajectories is one idle standing motion)
 *   step 2  encoder: the motion must give its z away, so the motions move apart; then an amber ring closes on the active motion
 *           and an amber pulse runs panel -> encoder -> latent: q reads z back.
 *           The six names are behaviours the paper reports from the low-level policy (Fig. 6, Sec. 10.2, 10.3)
 *   step 3  reuse: the policy is frozen (grey dashed box, as on the pipeline above) and a high-level policy moves z over the sphere;
 *           the Strike task as the paper describes it: run, sword swing, idle (Sec. 10.3)
 * draw() is a pure function of (t, step, ts). Still frame: all steps on, a moment at which the pulse has arrived.
 */
DeckAnim.register('ase-map', function (el, A) {
  'use strict';
  var C = A.C, AMBER = C.amber, GREEN = C.g, DARK = '#101010';
  var MI = function (s) { return '<tspan style="font-family:' + A.MATH + ';font-style:italic;font-size:1.2em">' + s + '</tspan>'; };
  function txt(p, x, y, s, o) {
    o = o || {};
    var n = A.el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start',
      style: 'font:' + (o.weight || 500) + ' ' + (o.size || 20) + 'px ' + A.FONT + ';fill:' + (o.fill || C.mid) + ';' + (o.halo ? A.HALO : '') }, p);
    n.innerHTML = s;
    return n;
  }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function mix(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
  function head(x, y, a, s) {                               // open arrow head at (x, y) pointing along angle a
    return 'M' + (x - s * Math.cos(a - 0.5)).toFixed(1) + ' ' + (y - s * Math.sin(a - 0.5)).toFixed(1) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) +
           'L' + (x - s * Math.cos(a + 0.5)).toFixed(1) + ' ' + (y - s * Math.sin(a + 0.5)).toFixed(1);
  }
  function via(p, bx0, bx1, by, m, u) {                     // p -> box (bx0..bx1 at height by) -> m, u in 0..1
    if (u < 0.4) return mix(p, [bx0, by], u / 0.4);
    if (u < 0.55) return mix([bx0, by], [bx1, by], (u - 0.4) / 0.15);
    return mix([bx1, by], m, (u - 0.55) / 0.45);
  }

  // ------------------------------------------------------------------ geometry
  var CX = 166, CY = 192, R = 124;                          // the sphere
  var BX0 = 336, BX1 = 396, BY = 150, QY = 262;             // policy box (way forward) and encoder box (way back)
  var PX0 = 440, PX1 = 1118, PY0 = 8, PY1 = 362;            // the motion panel
  var BCX = 795, BCY = 190, BRX = 262, BRY = 114;           // region "looks like the clips"
  var SK = [   // name, colour, latent (unit vector: x right, y up, z toward the viewer), mark at step 0 / when distinct, label offset
    { n: 'run',           col: '#4fc3f7', z: [-0.62, 0.42, 0.66],  p0: [505, 100],  p2: [662, 158], lab: [0, -20, 'middle'] },
    { n: 'kick',          col: '#c58cff', z: [0.10, 0.76, 0.64],   p0: [925, 84],   p2: [795, 108], lab: [18, 7, 'start'] },
    { n: 'sword swing',   col: '#ff8a65', z: [0.72, 0.22, 0.66],   p0: [1070, 150], p2: [916, 158], lab: [0, -20, 'middle'] },
    { n: 'shield bash',   col: '#f06292', z: [0.50, -0.58, 0.64],  p0: [1076, 296], p2: [935, 252], lab: [0, -20, 'middle'] },
    { n: 'crouched walk', col: '#4dd0c0', z: [-0.46, -0.56, 0.69], p0: [512, 300],  p2: [655, 252], lab: [0, -20, 'middle'] },
    { n: 'idle',          col: '#d5dde0', z: [0.03, -0.05, 1.0],   p0: [905, 318],  p2: [795, 196], lab: [0, 34, 'middle'] }
  ];
  var CLUMP = [[-17, -8], [13, -13], [21, 7], [-3, 17], [-21, 11], [0, 0]];     // step 1: all of them near "idle"
  var ORD = [0, 3, 1, 4, 2, 5], HOLD0 = 1.3;                // steps 0-2: latents are drawn in this order, each held for a while
  var PICK = [0, 2, 5], HOLD3 = 1.7;                        // step 3: run -> sword swing -> idle
  SK.forEach(function (k, i) { k.z = norm(k.z); k.s = [CX + R * k.z[0], CY - R * k.z[1]]; k.p1 = [SK[5].p2[0] + CLUMP[i][0], SK[5].p2[1] + CLUMP[i][1]]; k.k = ORD.indexOf(i); });

  // ------------------------------------------------------------------ static parts: sphere
  var defs = A.el('defs', null, el), gr = A.el('radialGradient', { id: 'ase-map-sph', cx: '38%', cy: '32%', r: '75%' }, defs);
  A.el('stop', { offset: '0', 'stop-color': '#2b2b2b' }, gr); A.el('stop', { offset: '1', 'stop-color': '#0b0b0b' }, gr);
  A.el('circle', { cx: CX, cy: CY, r: R, fill: 'url(#ase-map-sph)', stroke: '#e8e8e8', 'stroke-width': 2.5 }, el);
  A.el('path', { d: 'M' + (CX - R) + ' ' + CY + 'A' + R + ' ' + (R * 0.3) + ' 0 0 0 ' + (CX + R) + ' ' + CY, fill: 'none', stroke: '#4a4a4a', 'stroke-width': 2 }, el);
  A.el('path', { d: 'M' + (CX - R) + ' ' + CY + 'A' + R + ' ' + (R * 0.3) + ' 0 0 1 ' + (CX + R) + ' ' + CY, fill: 'none', stroke: '#343434', 'stroke-width': 2, 'stroke-dasharray': '4 7' }, el);
  A.el('path', { d: 'M' + CX + ' ' + (CY - R) + 'A' + (R * 0.36) + ' ' + R + ' 0 0 1 ' + CX + ' ' + (CY + R), fill: 'none', stroke: '#4a4a4a', 'stroke-width': 2 }, el);
  var rnd = A.rand(11), n = 0;
  while (n < 44) {                                           // any point of the sphere is a latent: a uniform sprinkle
    var v = norm([A.gauss(rnd), A.gauss(rnd), A.gauss(rnd)]);
    if (v[2] < 0.12) continue;
    A.el('circle', { cx: (CX + R * v[0]).toFixed(1), cy: (CY - R * v[1]).toFixed(1), r: 2.2, fill: '#6b6b6b' }, el); n++;
  }
  txt(el, 2, 30, 'latent sphere <tspan style="font-weight:500;fill:' + C.mid + '">(64-d in the paper)</tspan>', { weight: 700, fill: '#fff', size: 21 });
  var capA = txt(el, CX, 356, 'drawn at random · held · redrawn', { anchor: 'middle' });
  var capB = txt(el, CX, 356, 'moved by the high-level policy', { anchor: 'middle', fill: '#fff' });

  // ------------------------------------------------------------------ static parts: panel, legend, status line
  A.el('rect', { x: PX0 + 1, y: PY0 + 1, width: PX1 - PX0 - 2, height: PY1 - PY0 - 2, rx: 16, fill: DARK, stroke: '#2a2a2a', 'stroke-width': 2 }, el);
  txt(el, PX0 + 22, 40, 'the motion that comes out', { weight: 700, fill: '#fff', size: 21 });
  var STAT = ['no reward yet: ' + MI('z') + ' means nothing', 'natural, but prone to mode collapse: a narrow range', 'natural and distinct: each ' + MI('z') + ' has its own skill',
              'Strike task: run, then sword swing, then idle'].map(function (s, i) {
    return txt(el, PX0 + 22, 346, s, { fill: i ? '#fff' : C.mid });
  });
  var blobPts = [], th;
  for (var b = 0; b < 72; b++) { th = b / 72 * 2 * Math.PI; var q = 1 + 0.035 * Math.sin(3 * th + 0.7) + 0.025 * Math.cos(2 * th); blobPts.push([BCX + BRX * q * Math.cos(th), BCY + BRY * q * Math.sin(th)]); }
  var gBlob = A.el('g', {}, el);
  A.el('path', { d: A.path(blobPts) + 'Z', fill: GREEN, 'fill-opacity': 0.09, stroke: GREEN, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, gBlob);
  A.el('ellipse', { cx: PX1 - 232, cy: 33, rx: 15, ry: 9, fill: GREEN, 'fill-opacity': 0.14, stroke: GREEN, 'stroke-width': 2.5 }, gBlob);
  txt(gBlob, PX1 - 208, 40, 'looks like the clips', { weight: 700, fill: GREEN });
  // step 3: the path of the task through the skills (under the marks)
  var gPick = A.el('g', { fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-opacity': 0.75 }, el);
  PICK.forEach(function (i, k) {
    if (k === PICK.length - 1) return;
    var a = SK[i].p2, c = SK[PICK[k + 1]].p2, an = Math.atan2(c[1] - a[1], c[0] - a[0]), L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    var x0 = a[0] + 20 * Math.cos(an), y0 = a[1] + 20 * Math.sin(an), x1 = a[0] + (L - 22) * Math.cos(an), y1 = a[1] + (L - 22) * Math.sin(an);
    A.el('path', { d: 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + head(x1, y1, an, 11) }, gPick);
  });
  // the way back (step 2): motion -> encoder -> latent
  var gEnc = A.el('g', {}, el);
  A.el('path', { d: 'M' + (PX0 - 2) + ' ' + QY + 'H' + (BX1 + 5) + head(BX1 + 5, QY, Math.PI, 10), fill: 'none', stroke: AMBER, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gEnc);
  var encB = A.el('line', { stroke: AMBER, 'stroke-width': 2.5, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, gEnc);
  A.el('rect', { x: BX0 + 1.5, y: QY - 22.5, width: BX1 - BX0 - 3, height: 45, rx: 10, fill: '#1b1503', stroke: AMBER, 'stroke-width': 3 }, gEnc);
  txt(gEnc, (BX0 + BX1) / 2, QY + 8, MI('q'), { anchor: 'middle', fill: AMBER, weight: 700, size: 24 });
  txt(gEnc, (BX0 + BX1) / 2, QY + 50, 'encoder', { anchor: 'middle', fill: AMBER });
  // the way forward: latent -> policy -> motion
  var fwdA = A.el('line', { 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-opacity': 0.8 }, el);
  var fwdB = A.el('path', { d: 'M' + BX1 + ' ' + BY + 'H' + (PX0 - 5) + head(PX0 - 5, BY, 0, 10), fill: 'none', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  var gPolA = A.el('g', {}, el), gPolB = A.el('g', {}, el);          // the policy while it is trained / once it is frozen (step 3)
  A.el('rect', { x: BX0, y: BY - 24, width: BX1 - BX0, height: 48, rx: 10, fill: GREEN }, gPolA);
  txt(gPolA, (BX0 + BX1) / 2, BY + 9, MI('π'), { anchor: 'middle', fill: '#000', weight: 700, size: 24 });
  txt(el, (BX0 + BX1) / 2, BY + 50, 'policy', { anchor: 'middle' });
  A.el('rect', { x: BX0 + 1, y: BY - 23, width: BX1 - BX0 - 2, height: 46, rx: 10, fill: '#1c1c1c', stroke: '#8a8a8a', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, gPolB);
  txt(gPolB, (BX0 + BX1) / 2, BY + 9, MI('π'), { anchor: 'middle', fill: '#fff', weight: 700, size: 24 });
  txt(gPolB, (BX0 + BX1) / 2, BY + 75, 'frozen', { anchor: 'middle', fill: '#fff' });

  // ------------------------------------------------------------------ moving parts
  var markRing = A.el('circle', { fill: 'none', 'stroke-width': 3 }, el);        // the motion of the active latent lights up
  var marks = SK.map(function (k) {
    var g = A.el('g', {}, el);
    return { g: g, c: A.el('circle', { r: 10, fill: k.col, stroke: DARK, 'stroke-width': 2.5 }, g),
             t: txt(g, k.lab[0], k.lab[1], k.n, { anchor: k.lab[2], halo: true, fill: '#fff' }) };
  });
  var zd = SK.map(function (k) { return A.el('circle', { cx: k.s[0].toFixed(1), cy: k.s[1].toFixed(1), r: 7.5, fill: k.col, stroke: DARK, 'stroke-width': 2.5 }, el); });
  var ringBg = A.el('circle', { r: 15, fill: 'none', stroke: '#5a5a5a', 'stroke-width': 3.5 }, el);
  var ring = A.el('circle', { r: 15, fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, el);
  var encRing = A.el('circle', { r: 23, fill: 'none', stroke: AMBER, 'stroke-width': 3 }, el);
  var hlRing = A.el('circle', { r: 16, fill: 'none', stroke: '#fff', 'stroke-width': 4 }, el);
  var hlDot = A.el('circle', { r: 7.5, stroke: DARK, 'stroke-width': 2.5 }, el);
  var pulse = A.el('circle', { r: 6, fill: '#fff', stroke: DARK, 'stroke-width': 1.5 }, el);
  var encPulse = A.el('circle', { r: 6, fill: AMBER, stroke: DARK, 'stroke-width': 1.5 }, el);
  var CIRC = 2 * Math.PI * 15;

  return function draw(f) {
    var s = f.step, ts = f.ts, t = f.t, i;
    var p1 = s > 1 ? 1 : (s === 1 ? A.ease(A.ramp(ts, 0.5, 2.3)) : 0);        // pulled into the region of the clips
    var p2 = s > 2 ? 1 : (s === 2 ? A.ease(A.ramp(ts, 0.4, 2.2)) : 0);        // pushed apart by the encoder
    var reuse = s >= 3, tc = s === 0 ? t : ts, HOLD = s === 2 ? 2.0 : HOLD0;   // step 2 holds longer: there is a way back to show
    A.show(gBlob, s > 1 ? 1 : (s === 1 ? A.ramp(ts, 0, 0.7) : 0));
    var sn = Math.min(3, s), SIN = [0, 2.2, 2.1, 0.4];                          // a status line arrives once its motion has settled
    for (i = 0; i < STAT.length; i++) A.show(STAT[i], sn === i ? (i === 0 ? 1 : A.ramp(ts, SIN[i], SIN[i] + 0.5)) : (sn === i + 1 ? 1 - A.ramp(ts, 0, 0.4) : 0));
    A.show(capA, reuse ? 0 : 1); A.show(capB, reuse ? A.ramp(ts, 0, 0.5) : 0);
    A.show(gPick, reuse ? A.ramp(ts, 0.2, 0.9) : 0);
    var frz = reuse ? A.ramp(ts, 0, 0.5) : 0;
    A.show(gPolA, 1 - frz); A.show(gPolB, frz);

    // which latent is active, and how far into its hold
    var cur, u, zp;
    if (!reuse) {
      var k = Math.floor(tc / HOLD) % ORD.length;
      cur = ORD[k]; u = (tc % HOLD) / HOLD; zp = SK[cur].s;
    } else {
      var kk = Math.floor(ts / HOLD3) % PICK.length, prev = PICK[(kk + PICK.length - 1) % PICK.length], e = A.ease(A.ramp((ts % HOLD3), 0, 0.5));
      cur = PICK[kk]; u = (ts % HOLD3) / HOLD3;
      var za = SK[prev].z, zb = SK[cur].z, zm = norm([za[0] + (zb[0] - za[0]) * e, za[1] + (zb[1] - za[1]) * e, za[2] + (zb[2] - za[2]) * e]);
      zp = [CX + R * zm[0], CY - R * zm[1]];
    }

    // marks: where each latent's motion lands
    var pos = [];
    for (i = 0; i < SK.length; i++) {
      var K = SK[i], m = mix(mix(K.p0, K.p1, p1), K.p2, p2), seen = s > 0 ? 1 : A.ramp(t, K.k * HOLD0 + 0.45, K.k * HOLD0 + 0.75);
      pos.push(m);
      marks[i].g.setAttribute('transform', 'translate(' + m[0].toFixed(1) + ' ' + m[1].toFixed(1) + ')');
      var on = i === cur, dim = reuse ? (PICK.indexOf(i) >= 0 ? (on ? 1 : 0.7) : 0.36) : (on ? 1 : 0.62);
      A.show(marks[i].g, seen * dim);
      A.set(marks[i].c, { r: on ? 13 : 10 });
      A.show(marks[i].t, s > 2 ? 1 : (s === 2 ? A.ramp(ts, 1.9, 2.6) : 0));
      A.show(zd[i], reuse ? 0.75 : (s > 0 ? (on ? 1 : 0.7) : A.ramp(t, K.k * HOLD0, K.k * HOLD0 + 0.15) * (on ? 1 : 0.7)));
    }

    // the active latent: a ring that fills while the latent is held (steps 0-2), or the high-level policy's point (step 3)
    var zx = zp[0].toFixed(1), zy = zp[1].toFixed(1);
    A.set(ringBg, { cx: zx, cy: zy });
    A.set(ring, { cx: zx, cy: zy, 'stroke-dasharray': (CIRC * u).toFixed(1) + ' ' + CIRC.toFixed(1), transform: 'rotate(-90 ' + zx + ' ' + zy + ')' });
    A.show(ringBg, reuse ? 0 : 1); A.show(ring, reuse ? 0 : 1);
    A.set(hlRing, { cx: zx, cy: zy }); A.set(hlDot, { cx: zx, cy: zy, fill: SK[cur].col });
    A.show(hlRing, reuse ? 1 : 0); A.show(hlDot, reuse ? 1 : 0);

    // forward: latent -> policy -> into the panel, where the motion of this latent lights up
    var M = pos[cur], th_ = reuse ? u * HOLD3 : u * HOLD, t0 = reuse ? 0.35 : 0.05, t1 = reuse ? 0.9 : 0.55;
    var fu = A.ramp(th_, t0, t1), pp = via(zp, BX0, BX1, BY, [PX0 - 5, BY], fu), pop = A.ramp(th_, t1, t1 + 0.5);
    A.set(fwdA, { x1: zx, y1: zy, x2: BX0, y2: BY, stroke: SK[cur].col });
    A.set(fwdB, { stroke: SK[cur].col });
    A.set(pulse, { cx: pp[0].toFixed(1), cy: pp[1].toFixed(1) });
    A.show(pulse, fu > 0 && fu < 1 ? 1 : 0);

    // back: the encoder looks at the motion and recovers its latent (step 2, once the motions are apart)
    var enc = s === 2 ? A.ramp(ts, 2.2, 2.8) : 0, look = A.ramp(th_, 0.75, 1.1), bu = A.ramp(th_, 1.1, 1.65), bp = via([PX0 - 2, QY], BX1, BX0, QY, zp, bu);
    A.show(gEnc, enc);
    A.set(encB, { x1: BX0, y1: QY, x2: zx, y2: zy });
    A.set(encPulse, { cx: bp[0].toFixed(1), cy: bp[1].toFixed(1) });
    A.show(encPulse, enc * (bu > 0 && bu < 1 ? 1 : 0));
    A.set(encRing, { cx: zx, cy: zy });
    A.show(encRing, enc * A.ramp(bu, 0.93, 1));

    // ring around the active motion: white, growing, when the policy's pulse arrives; amber, closing in, when the encoder looks at it
    var amber = enc > 0 && look > 0 && bu < 1;
    A.set(markRing, { cx: M[0].toFixed(1), cy: M[1].toFixed(1), stroke: amber ? AMBER : '#fff', r: (amber ? 30 - 14 * look : 14 + 16 * pop).toFixed(1) });
    A.show(markRing, amber ? enc * Math.min(1, 3 * look) * (1 - A.ramp(bu, 0.2, 0.6)) : (pop > 0 && pop < 1 ? 1 - pop : 0));
  };
});
