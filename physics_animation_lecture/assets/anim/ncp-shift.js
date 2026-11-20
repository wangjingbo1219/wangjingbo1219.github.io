/* NCP, slide "NCP — how", example panel of click 3 (tools/slides/03b_20_ncp.py).   <svg data-anim="ncp-shift" viewBox="0 0 332 249">
 *
 * SCHEMATIC of prior shifting (Zhu et al. 2023, Sec. 6.2, Eq. 9; the picture follows Fig. 8 / 9). No data and no axis values.
 *   upper bars   how often each frame of the motion clips is visited when codes are sampled from the prior; frames sorted by their
 *                frequency under the distilled prior (common on the left, rare on the right). Shifting only MOVES visits: the counts are
 *                taken over a fixed number of generated states (the latest T_k, Sec. 6.2), so the bars keep their sum and the common
 *                frames lose what the rare frames gain.
 *   lower bars   the count reward of a state that matches that frame: r = sqrt(N_k / N^(s)), i.e. proportional to 1 / sqrt(visits).
 *                Their label, with the formula, is HTML laid over the figure by the slide (KaTeX).
 *   motion       the distilled prior copies the data: steep profile, and the reward is highest where the visits are fewest. Fine-tuning the prior
 *                with PPO on that reward moves visits to the rare frames until the profile is nearly even ("a nearly even distribution over all
 *                the motion frames", Sec. 8.3.3); then the reward is nearly even too. The dashed line keeps the profile before shifting.
 * While click 3 is the current one the change replays in a loop; afterwards the figure rests in the shifted state.
 * draw(f) is a pure function of (f.t, f.step, f.ts).
 */
DeckAnim.register('ncp-shift', function (el, A) {
  'use strict';
  var C = A.C, N = 14, X0 = 20, PITCH = 21, BW = 16, YV = 122, HV = 82, YR = 212, HR = 44, STEP = 3, LOOP = 9.6;
  var rnd = A.rand(11), before = [], after = [], i, sb = 0, sa = 0;
  for (i = 0; i < N; i++) {
    before.push(0.12 + 0.88 * Math.exp(-i / 4.0));            // distilled prior: follows the data
    after.push(1 + 0.16 * (rnd() - 0.5));                      // shifted prior: nearly even ...
    sb += before[i]; sa += after[i];
  }
  for (i = 0; i < N; i++) after[i] *= sb / sa;                 // ... with the same total number of visits: shifting moves visits, it does not add any
  var vmin = before[N - 1];
  A.text(el, X0, 24, 'visits', { size: 20, halo: false });
  var lg = A.el('g', {}, el);
  A.el('line', { x1: 206, y1: 17, x2: 238, y2: 17, stroke: '#b8b8b8', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }, lg);
  A.text(lg, 312, 24, 'before', { size: 20, fill: C.mid, weight: 500, anchor: 'end', halo: false });
  A.text(el, X0, 240, 'common frames', { size: 20, fill: C.mid, weight: 500, halo: false });
  A.text(el, 312, 240, 'rare frames', { size: 20, fill: C.mid, weight: 500, anchor: 'end', halo: false });
  A.el('line', { x1: X0 - 4, y1: YV + 1, x2: 316, y2: YV + 1, stroke: '#3a3a3a', 'stroke-width': 2 }, el);
  A.el('line', { x1: X0 - 4, y1: YR + 1, x2: 316, y2: YR + 1, stroke: '#3a3a3a', 'stroke-width': 2 }, el);
  var vb = [], rb = [];
  for (i = 0; i < N; i++) {
    vb.push(A.el('rect', { x: X0 + i * PITCH, width: BW, rx: 3, fill: '#d9d9d9' }, el));
    rb.push(A.el('rect', { x: X0 + i * PITCH, width: BW, rx: 3, fill: C.amber }, el));
  }
  var gp = [];
  for (i = 0; i < N; i++) { gp.push([X0 + i * PITCH - 2, YV - HV * before[i]]); gp.push([X0 + i * PITCH + BW + 2, YV - HV * before[i]]); }
  var ghost = A.el('g', {}, el);
  A.el('path', { d: A.path(gp), fill: 'none', stroke: '#101010', 'stroke-width': 6.5, 'stroke-linejoin': 'round', 'stroke-opacity': 0.85 }, ghost);
  A.el('path', { d: A.path(gp), fill: 'none', stroke: '#b8b8b8', 'stroke-width': 2.5, 'stroke-dasharray': '5 4', 'stroke-linejoin': 'round' }, ghost);

  return function draw(f) {
    var u = 0;                                                  // 0 = distilled prior, 1 = shifted prior
    if (f.step > STEP) u = 1;
    else if (f.step === STEP) {
      var t = A.loop(f.ts, LOOP);
      u = A.ease(A.ramp(t, 1.4, 4.6)) - A.ease(A.ramp(t, LOOP - 0.9, LOOP));
    }
    for (var k = 0; k < N; k++) {
      var v = A.lerp(before[k], after[k], u), r = Math.sqrt(vmin / v);
      A.set(vb[k], { y: (YV - HV * v).toFixed(1), height: (HV * v).toFixed(1) });
      A.set(rb[k], { y: (YR - HR * r).toFixed(1), height: (HR * r).toFixed(1) });
    }
    var g = A.ramp(u, 0.02, 0.3);
    A.show(ghost, g); A.show(lg, g);
  };
});
