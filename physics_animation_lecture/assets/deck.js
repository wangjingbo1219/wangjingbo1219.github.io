/* Tiny dependency-free slide engine (adapted from the GRAIL CoRL 2026 oral deck engine;
 * additions: speaker notes + timer, on-screen controls, lazy YouTube embeds).
 *
 * Markup:   <div class="deck"> <section class="slide" data-title="..."> ... </section> ... </div>
 * Builds:   any element with class "fx" is revealed step by step (data-step="n" groups/reorders; default = DOM order).
 * Counters: <span data-count-to="88.9" data-decimals="1" data-suffix="%"></span> counts up once visible.
 * Videos:   <video> in the active slide play from the start (muted, looped); inside an .fx they wait for the build.
 *
 * Keys:  → ↓ Space PgDn  next      ← ↑ PgUp  previous      Home/End  first/last
 *        F fullscreen   O overview   B blackout   N speaker notes   T reset timer   ? help   <num>+Enter jump
 * URL:   #7 opens slide 7 · ?print renders every slide (fully built) for PDF export.
 */
(function () {
  'use strict';
  var W = 1920, H = 1080;
  var params = new URLSearchParams(location.search);
  var MODE = params.has('print') ? 'print' : 'main';
  var deck = document.querySelector('.deck');
  // Typeset on first visit; print and overview initialize all slides.
  function typeset(scope) {
    if (!scope || scope._mathReady || !window.renderMathInElement) return;
    scope._mathReady = true;
    try { renderMathInElement(scope, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false, ignoredClasses: ['notes'] }); } catch (e) {}
  }
  var slides = Array.prototype.slice.call(deck.querySelectorAll(':scope > section.slide'));
  var N = slides.length;
  document.documentElement.classList.add('mode-' + MODE);
  // frozen views (screenshots, audit): no fades, entrance animations jump to their end state
  if (params.has('still') || params.has('animt') || params.has('audit')) document.documentElement.classList.add('deck-frozen');

  // ---------- per-slide build steps ----------
  var steps = slides.map(function (s) {
    var frags = Array.prototype.slice.call(s.querySelectorAll('.fx'));
    var auto = 0, keys = [];
    frags.forEach(function (f) {
      var k = f.hasAttribute('data-step') ? parseFloat(f.getAttribute('data-step')) : ++auto;
      if (!f.hasAttribute('data-step')) f.setAttribute('data-step', k);
      if (keys.indexOf(k) < 0) keys.push(k);
    });
    keys.sort(function (a, b) { return a - b; });
    return { frags: frags, keys: keys };
  });

  // default poster for videos: assets/poster/<name>.jpg
  Array.prototype.forEach.call(deck.querySelectorAll('video'), function (v) {
    v.muted = true; v.loop = !v.hasAttribute('data-once'); v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.setAttribute('preload', 'none');
    if (!v.hasAttribute('poster')) {
      var src = v.getAttribute('data-src') || v.getAttribute('src') || (v.querySelector('source') || {}).src || '';
      var m = src.match(/([^\/]+)\.mp4$/);
      if (m && !v.getAttribute('data-poster')) v.setAttribute('data-poster', src.replace(/video\/[^\/]+\.mp4$/, 'poster/' + m[1] + '.jpg'));
    }
  });

  var cur = 0, step = 0, warmTimer = 0, fontsReady = false;
  function poster(v) { if (!v.getAttribute('poster') && v.dataset.poster) v.setAttribute('poster', v.dataset.poster); }
  function hydrate(v, preload) {
    poster(v); v.preload = preload || 'metadata';
    if (!v.getAttribute('src') && v.dataset.src) v.setAttribute('src', v.dataset.src);
  }
  function prepareSlide(s, imagesOnly) {
    Array.prototype.forEach.call(s.querySelectorAll('img[data-src]'), function(im){ if (!im.getAttribute('src')) im.src=im.dataset.src; });
    Array.prototype.forEach.call(s.querySelectorAll('video'), function(v){ poster(v); });
  }
  function recycleMedia(keep, neighbour) {
    Array.prototype.forEach.call(deck.querySelectorAll('video[src]'), function(v){
      var s=v.closest('section.slide');
      if (s !== keep && s !== neighbour) { v.pause(); v.removeAttribute('src'); v.preload='none'; v.load(); v._started=false; }
    });
  }


  // ---------- counters ----------
  function fmt(x, d) { return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function setCounter(el, val) {
    var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
    el.textContent = (el.getAttribute('data-prefix') || '') + fmt(val, d) + (el.getAttribute('data-suffix') || '');
  }
  function runCounter(el) {
    if (el._ran) return; el._ran = true;
    var to = parseFloat(el.getAttribute('data-count-to'));
    var from = parseFloat(el.getAttribute('data-count-from') || '0');
    var dur = parseFloat(el.getAttribute('data-duration') || '1600');
    var delay = parseFloat(el.getAttribute('data-delay') || '0');
    var t0 = null;
    setCounter(el, from);
    function tick(t) {
      if (!el._ran) return;
      if (t0 === null) t0 = t + delay;
      var p = Math.max(0, Math.min(1, (t - t0) / dur));
      var e = 1 - Math.pow(1 - p, 4);
      setCounter(el, from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function resetCounter(el) { el._ran = false; setCounter(el, parseFloat(el.getAttribute('data-count-from') || '0')); }

  function revealed(el, slide) {
    var f = el.closest('.fx');
    return !f || !slide.contains(f) || f.classList.contains('on');
  }

  // ---------- render ----------
  function render(fromNav) {
    slides.forEach(function (s, i) {
      var was = s.classList.contains('active');
      s.classList.toggle('active', i === cur);
      s.classList.toggle('past', i < cur);
      s.classList.toggle('future', i > cur);
      if (i !== cur) {
        if (was) {
          Array.prototype.forEach.call(s.querySelectorAll('video'), function (v) { v.pause(); v._started = false; });
          Array.prototype.forEach.call(s.querySelectorAll('[data-count-to]'), resetCounter);
        }
      }
    });
    var S = slides[cur], st = steps[cur];
    typeset(S); prepareSlide(S);
    if (fontsReady && !S._fitReady) { fitText(S); S._fitReady=true; document.fonts.ready.then(function(){fitText(S);}); }
    var limit = step > 0 ? st.keys[step - 1] : -Infinity;
    st.frags.forEach(function (f) {
      var k = parseFloat(f.getAttribute('data-step'));
      f.classList.toggle('on', k <= limit);
      f.classList.toggle('current', k === limit);
    });
    S.setAttribute('data-at-step', step);
    if (step === st.keys.length) S.setAttribute('data-last-step', ''); else S.removeAttribute('data-last-step');
    Array.prototype.forEach.call(S.querySelectorAll('video'), function (v) {
      if (revealed(v, S)) {
        hydrate(v, 'auto');
        if (!v._started) { v._started = true; try { v.currentTime = 0; } catch (e) {} }
        else if (v.ended && v.hasAttribute('data-once')) return;   // play-once videos hold their last frame
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else { v.pause(); v._started = false; }
    });
    Array.prototype.forEach.call(S.querySelectorAll('[data-count-to]'), function (c) {
      if (revealed(c, S)) runCounter(c); else resetCounter(c);
    });
    if (window.DeckAnim) window.DeckAnim.sync(S, step, st.keys.length);     // animated figures follow the slide and its build step
    syncEmbeds(S);
    syncNotes(S);
    document.documentElement.style.setProperty('--deck-progress', N > 1 ? (cur / (N - 1)) : 1);
    var counter = document.querySelector('.deck-counter');
    if (counter) counter.textContent = (cur + 1) + ' / ' + N;
    var pos = document.querySelector('.deck-controls .pos');
    var dv = diveCount(cur);
    if (pos) pos.textContent = (cur + 1) + ' / ' + N + (isOpt[cur] ? '  · optional' : (dv ? '  · ↓ ' + dv : '')) + (allMode ? '  · all' : '');
    if (MODE === 'main') {
      try { if (history.replaceState) history.replaceState(null, '', '#' + (cur + 1) + (step ? '.' + step : '')); } catch (e) {}   // not allowed when a <base href> is set (private builds)
    }
    // Keep only the current page and one navigation neighbour in the decoder pool.
    clearTimeout(warmTimer);
    var nextIndex=mainFrom(cur,1), neighbour=nextIndex>=0?slides[nextIndex]:null;
    recycleMedia(S,neighbour);
    var at=cur;
    warmTimer=setTimeout(function(){
      if (cur!==at || document.hidden || !neighbour || (navigator.connection && navigator.connection.saveData)) return;
      Array.prototype.slice.call(neighbour.querySelectorAll('video'),0,2).forEach(function(v){ hydrate(v,'metadata'); });
    },1200);
  }

  // ---------- lazy YouTube embeds: <div class="yt" data-yt="ID" data-start="12"> only loads while its slide is active ----------
  function syncEmbeds(S) {
    Array.prototype.forEach.call(deck.querySelectorAll('.yt[data-yt]'), function (box) {
      var live = /^https?:$/.test(location.protocol) && S.contains(box) && revealed(box, S);
      var fr = box.querySelector('iframe');
      if (live && !fr) {
        fr = document.createElement('iframe');
        fr.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(box.getAttribute('data-yt')) +
          '?rel=0&mute=1&autoplay=1&start=' + (parseInt(box.getAttribute('data-start') || '0', 10) || 0);
        fr.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture'); fr.setAttribute('allowfullscreen', '');
        fr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        box.appendChild(fr);
      } else if (!live && fr) { box.removeChild(fr); }
    });
  }

  // ---------- speaker notes ----------
  var notesBody = null, notesHead = null, t0 = Date.now();
  function syncNotes(S) {
    if (!notesBody) return;
    var n = S.querySelector('aside.notes');
    var key = cur + '|' + (n ? n.innerHTML.length : 0);
    if (notesBody._key !== key) { notesBody.innerHTML = n ? n.innerHTML : '<i>(no notes)</i>'; notesBody._key = key; notesBody.parentNode.scrollTop = 0; }
    var dv = diveCount(cur);
    notesHead.textContent = (cur + 1) + ' / ' + N + '  ·  ' + (S.getAttribute('data-title') || '') +
      (isOpt[cur] ? '  ·  optional slide (→ returns to the main path, ↓ next optional)' : (dv ? '  ·  ↓ ' + dv + ' optional slide' + (dv > 1 ? 's' : '') : ''));
    // narration: the paragraph of the current click is highlighted and kept in view
    var ps = notesBody.querySelectorAll('p.nar'), box = notesBody.parentNode;
    Array.prototype.forEach.call(ps, function (p) {
      var k = parseInt(p.getAttribute('data-k'), 10), on = k === step;
      p.classList.toggle('cur', on); p.classList.toggle('done', k < step);
      if (on && box.scrollHeight > box.clientHeight) box.scrollTop = Math.max(0, p.offsetTop - 60);
    });
  }
  function tickTimer() {
    var el = document.querySelector('.deck-notes .tm'); if (!el) return;
    var s = Math.floor((Date.now() - t0) / 1000), m = Math.floor(s / 60); s = s % 60;
    el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function go(i, s) {
    i = Math.max(0, Math.min(N - 1, i));
    cur = i; step = Math.max(0, Math.min(steps[i].keys.length, s || 0));
    render(true);
  }
  // The lecture's main path: slides marked data-opt (deep dives, slides of papers told briefly) are skipped by next / prev.
  // Down / Up walk the deck in order, so Down on a main slide enters the optional slides that follow it. Key A: every slide in order.
  var isOpt = slides.map(function (s) { return s.hasAttribute('data-opt'); });
  var allMode = params.has('all');
  function mainFrom(i, d) { for (var j = i + d; j >= 0 && j < N; j += d) if (allMode || !isOpt[j]) return j; return -1; }
  function diveCount(i) { var n = 0; if (!isOpt[i]) while (i + 1 + n < N && isOpt[i + 1 + n]) n++; return n; }
  function next() {
    if (step < steps[cur].keys.length) { step++; render(true); }
    else { var j = mainFrom(cur, 1); if (j >= 0) go(j, 0); }
  }
  function prev() {
    if (step > 0) { step--; render(true); }
    else { var j = mainFrom(cur, -1); if (j >= 0) go(j, steps[j].keys.length); }
  }
  function down() { if (cur < N - 1) go(cur + 1, 0); }
  function up() { if (cur > 0) go(cur - 1, steps[cur - 1].keys.length); }

  // ---------- scaling ----------
  function fit() {
    if (MODE === 'print') return;
    var availableHeight = window.innerHeight - ((MODE === 'main' && !document.fullscreenElement) ? 64 : 0);
    var s = Math.min(window.innerWidth / W, availableHeight / H);
    deck.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  // ---------- chrome (progress, counter, help, overview) ----------
  function buildChrome() {
    var bar = document.createElement('div'); bar.className = 'deck-progress'; bar.innerHTML = '<i></i>';
    var ctr = document.createElement('div'); ctr.className = 'deck-counter';
    var help = document.createElement('div'); help.className = 'deck-help';
    help.innerHTML = '<h3>Keyboard</h3><table>' +
      '<tr><td>→ / Space / PgDn</td><td>next build / slide</td></tr>' +
      '<tr><td>← / PgUp</td><td>previous</td></tr>' +
      '<tr><td>↓ / ↑</td><td>into / back through optional slides</td></tr><tr><td>A</td><td>all slides in order (no skipping)</td></tr>' +
      '<tr><td>F</td><td>fullscreen</td></tr><tr><td>O</td><td>overview</td></tr>' +
      '<tr><td>N</td><td>speaker notes</td></tr><tr><td>T</td><td>reset timer</td></tr>' +
      '<tr><td>B</td><td>blackout</td></tr><tr><td>7 Enter</td><td>jump to slide 7</td></tr></table><p>Press ? to close</p>';
    var black = document.createElement('div'); black.className = 'deck-black';
    var notes = document.createElement('div'); notes.className = 'deck-notes';
    notes.innerHTML = '<div class="nh"><span class="tt"></span><span class="tm">00:00</span></div><div class="nb"></div>';
    var ctl = document.createElement('div'); ctl.className = 'deck-controls';
    ctl.innerHTML = '<button data-a="prev" title="Previous">&#8592;</button><span class="pos"></span><button data-a="next" title="Next">&#8594;</button>' +
      '<button data-a="notes" title="Speaker notes (N)">N</button><button data-a="over" title="Overview (O)">&#9638;</button><button data-a="full" title="Fullscreen (F)">&#x26F6;</button>';
    ctl.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
      if (a === 'prev') prev(); else if (a === 'next') next();
      else if (a === 'notes') document.documentElement.classList.toggle('deck-show-notes');
      else if (a === 'over') toggleOverview();
      else if (a === 'full') toggleFull();
      e.target.blur();
    });
    [bar, ctr, help, black, notes, ctl].forEach(function (el) { document.body.appendChild(el); });
    notesBody = notes.querySelector('.nb'); notesHead = notes.querySelector('.tt');
    setInterval(tickTimer, 1000);
    document.addEventListener('fullscreenchange', fit);
    if (params.has('notes')) document.documentElement.classList.add('deck-show-notes');   // index.html?notes opens with speaker notes visible
  }

  var overview = false;
  function toggleOverview(force) {
    overview = typeof force === 'boolean' ? force : !overview;
    document.documentElement.classList.toggle('deck-overview', overview);
    if (overview) { slides.forEach(function(s){ typeset(s); prepareSlide(s,true); }); if(window.DeckAnim) window.DeckAnim.stillAll(); fitText(); }
    var cols = Math.ceil(Math.sqrt(N * 1.0)) + 1, rows = Math.ceil(N / cols);
    var gap = 28, cw = (W - gap * (cols + 1)) / cols, sc = cw / W, ch = H * sc;
    var oy = (H - (rows * ch + (rows - 1) * gap)) / 2;
    slides.forEach(function (s, i) {
      if (overview) {
        var c = i % cols, r = Math.floor(i / cols);
        s.style.transform = 'translate(' + (gap + c * (cw + gap)) + 'px,' + (oy + r * (ch + gap)) + 'px) scale(' + sc + ')';
        s.style.transformOrigin = '0 0';
      } else { s.style.transform = ''; s.style.transformOrigin = ''; }
    });
  }

  function toggleFull() {
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen || !document.exitFullscreen) return;
    var action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    action.catch(function () {});
  }

  // ---------- keyboard ----------
  var typed = '';
  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key, act = null;
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].indexOf(k) >= 0 && !(k === 'Enter' && typed)) act = next;
    else if (['ArrowLeft', 'PageUp', 'Backspace'].indexOf(k) >= 0) act = prev;
    else if (k === 'ArrowDown') act = down;
    else if (k === 'ArrowUp') act = up;
    if (act) { e.preventDefault(); typed = ''; act(); return; }
    if (/^[0-9]$/.test(k)) { typed += k; return; }
    if (k === 'Enter' && typed) { var n = parseInt(typed, 10) - 1; typed = ''; go(n, 0); return; }
    typed = '';
    if (k === 'Home') go(0, 0);
    else if (k === 'End') go(N - 1, steps[N - 1].keys.length);
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'a' || k === 'A') { allMode = !allMode; document.documentElement.classList.toggle('deck-all', allMode); render(true); }
    else if (k === 'n' || k === 'N') document.documentElement.classList.toggle('deck-show-notes');
    else if (k === 't' || k === 'T') { t0 = Date.now(); tickTimer(); }
    else if (k === 'o' || k === 'O' || k === 'Escape') toggleOverview(k === 'Escape' ? false : undefined);
    else if (k === 'b' || k === 'B' || k === '.') document.documentElement.classList.toggle('deck-blackout');
    else if (k === '?' || k === 'h' || k === 'H') document.documentElement.classList.toggle('deck-show-help');
  }

  // ---------- print mode ----------
  function printBuild() {
    slides.forEach(function(s){ typeset(s); prepareSlide(s,true); });
    slides.forEach(function (s, i) {
      s.classList.add('active');
      steps[i].frags.forEach(function (f) { f.classList.add('on'); });
      Array.prototype.forEach.call(s.querySelectorAll('[data-count-to]'), function (c) { setCounter(c, parseFloat(c.getAttribute('data-count-to'))); });
      Array.prototype.forEach.call(s.querySelectorAll('video'), function (v) { v.removeAttribute('autoplay'); v.pause(); });
    });
    if (window.DeckAnim) window.DeckAnim.stillAll();
  }

  // ---------- auto-fit: shrink the font of .fit boxes until their content fits ----------
  function fitText(scope) {
    var fitRoot=scope || deck;
    Array.prototype.forEach.call(fitRoot.querySelectorAll('.fit'), function (el) {
      var fs = parseFloat(getComputedStyle(el).fontSize), n = 0;
      while (el.scrollHeight > el.clientHeight + 1 && fs > 13 && n++ < 40) { fs -= 0.5; el.style.fontSize = fs + 'px'; }
      el.setAttribute('data-fs', fs);
      if (el.scrollHeight > el.clientHeight + 1) el.setAttribute('data-overflow', '1');
    });
    // layout self-check (read with: chrome --headless --dump-dom): single-line boxes that are clipped
    Array.prototype.forEach.call(fitRoot.querySelectorAll('.s-uh .hd h2, .usc div, .src, .lab'), function (el) {
      if (el.scrollWidth > el.clientWidth + 2) el.setAttribute('data-clip', '1');
    });
    Array.prototype.forEach.call(fitRoot.querySelectorAll('.dn'), function (el) {      // diagram nodes: text must fit the box
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) el.setAttribute('data-overflow', '1');
    });
    Array.prototype.forEach.call(fitRoot.querySelectorAll('.dl'), function (el) {      // edge labels must stay inside the canvas
      var c = el.parentNode.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (r.left < c.left - 1 || r.right > c.right + 1 || r.top < c.top - 1 || r.bottom > c.bottom + 1) el.setAttribute('data-clip', '1');
    });
    Array.prototype.forEach.call(fitRoot.querySelectorAll('.dgc'), function (c) {     // diagram edge labels must not sit on a node or on each other
      var ls = Array.prototype.slice.call(c.querySelectorAll('.dl')), ns = Array.prototype.slice.call(c.querySelectorAll('.dn'));
      function hit(a, b, m) { return a.left < b.right - m && b.left < a.right - m && a.top < b.bottom - m && b.top < a.bottom - m; }
      ls.forEach(function (l, i) {
        var r = l.getBoundingClientRect();
        ns.forEach(function (n) { if (hit(r, n.getBoundingClientRect(), 3)) { l.setAttribute('data-clip', '1'); l.setAttribute('data-why', 'label overlaps node ' + n.getAttribute('data-id')); } });
        ls.slice(i + 1).forEach(function (m) { if (hit(r, m.getBoundingClientRect(), 2)) { l.setAttribute('data-clip', '1'); l.setAttribute('data-why', 'label overlaps label "' + m.textContent.slice(0, 20) + '"'); } });
      });
    });
    document.documentElement.setAttribute('data-fit-done', '1');
    if (params.has('audit')) audit();
  }
  // ---------- layout audit (index.html?audit): geometry of every block on every slide, read by tools/audit.py ----------
  function audit() {
    var dr = deck.getBoundingClientRect(), sc = dr.width / W, out = { slides: [] };
    function rr(r) { return { x: Math.round((r.left - dr.left) / sc), y: Math.round((r.top - dr.top) / sc), w: Math.round(r.width / sc), h: Math.round(r.height / sc) }; }
    function tight(el) { var g = document.createRange(); g.selectNodeContents(el); return g.getBoundingClientRect(); }
    function name(el) { return (el.getAttribute('class') || el.tagName.toLowerCase()).split(' ').slice(0, 2).join('.') + ' "' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 38) + '"'; }
    slides.forEach(function (s, i) {
      var blocks = [], issues = [], media = [];
      (function walk(parent) {
        Array.prototype.forEach.call(parent.children, function (el) {
          var cl = el.classList, tag = el.tagName.toLowerCase();
          if (tag === 'aside' || cl.contains('trk') || cl.contains('num') || cl.contains('bgv') || cl.contains('shade') || cl.contains('dim')) return;
          if (tag === 'svg' && getComputedStyle(el).pointerEvents === 'none') return;
          var r = el.getBoundingClientRect();
          if (cl.contains('hd') || (r.width * r.height < 16 && el.children.length)) { walk(el); return; }
          if (r.width * r.height < 16) return;
          var textish = /^(h2|h1)$/.test(tag) || cl.contains('kicker') || cl.contains('sub') || cl.contains('cap') || cl.contains('src');
          blocks.push({ el: el, r: rr(textish ? tight(el) : r) });
        });
      })(s);
      var full = function (b) { return b.r.w >= 1900 && b.r.h >= 1000; };
      blocks.forEach(function (b, k) {
        if (!full(b) && (b.r.x < -2 || b.r.y < -2 || b.r.x + b.r.w > W + 2 || b.r.y + b.r.h > H + 2)) issues.push({ kind: 'off-canvas', a: name(b.el), box: b.r });
        if (!full(b) && s.querySelector(':scope > .trk') && b.r.y + b.r.h > 1010 && b.r.y < 1050) issues.push({ kind: 'into-footer', a: name(b.el), box: b.r });
        if (!full(b) && s.querySelector(':scope > .trk') && b.r.w > 40 && (b.r.x < 84 || b.r.x + b.r.w > 1836)) issues.push({ kind: 'outside-margins', a: name(b.el), box: b.r });
        blocks.slice(k + 1).forEach(function (c) {
          if (full(b) || full(c)) return;
          var iw = Math.min(b.r.x + b.r.w, c.r.x + c.r.w) - Math.max(b.r.x, c.r.x), ih = Math.min(b.r.y + b.r.h, c.r.y + c.r.h) - Math.max(b.r.y, c.r.y);
          if (iw > 4 && ih > 4 && iw * ih / Math.min(b.r.w * b.r.h, c.r.w * c.r.h) > 0.02) issues.push({ kind: 'overlap', a: name(b.el), b: name(c.el), px: iw + 'x' + ih });
        });
      });
      Array.prototype.forEach.call(s.querySelectorAll('.src, .hand > div, .callout, .c3 > div, .stat, .fb, .uc, .dn, .chain > div, .rm > div, .lens .v, .lens .k, .gt > div, .hp > div, .ftl, .badge, .usc > div, .pn, .vcap'), function (el) {
        if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) issues.push({ kind: 'text-overflows-box', a: name(el), by: (el.scrollWidth - el.clientWidth) + 'x' + (el.scrollHeight - el.clientHeight) });
      });
      Array.prototype.forEach.call(s.querySelectorAll('.vc > .lab, .tile > .lab'), function (el) {
        var a = el.getBoundingClientRect(), p = el.parentNode.getBoundingClientRect();
        if (a.right > p.right - 4 * sc || a.left < p.left) issues.push({ kind: 'label-clipped-by-card', a: name(el) });
      });
      Array.prototype.forEach.call(s.querySelectorAll('[data-overflow], [data-clip]'), function (el) { issues.push({ kind: 'fit-check', a: name(el), why: el.getAttribute('data-why') || '' }); });
      Array.prototype.forEach.call(s.querySelectorAll('[data-anim-error]'), function (el) { issues.push({ kind: 'anim-error', a: el.getAttribute('data-anim'), why: el.getAttribute('data-anim-error') }); });
      Array.prototype.forEach.call(s.querySelectorAll('[data-anim]'), function (el) { if (!el._anim) issues.push({ kind: 'anim-error', a: el.getAttribute('data-anim'), why: 'never set up' }); });
      Array.prototype.forEach.call(s.querySelectorAll('video, .vc img, .tile img, img.bgv'), function (m) {
        var r = rr(m.getBoundingClientRect());
        media.push({ src: (m.getAttribute('src') || '').split('/').pop(), w: r.w, h: r.h, fit: getComputedStyle(m).objectFit, nw: m.naturalWidth || 0, nh: m.naturalHeight || 0, eq: !!m.closest('.eqsz') });
      });
      out.slides.push({ n: i + 1, title: s.getAttribute('data-title') || '', issues: issues, media: media });
    });
    var pre = document.createElement('pre'); pre.id = 'audit-json'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  function fontsLoaded(){
    fontsReady=true;
    if(MODE==='print' || params.has('audit')) { slides.forEach(typeset); fitText(); }
    else { fitText(slides[cur]); slides[cur]._fitReady=true; }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fontsLoaded); else window.addEventListener('load', fontsLoaded);

  document.addEventListener('visibilitychange',function(){
    if(document.hidden) Array.prototype.forEach.call(deck.querySelectorAll('video[src]'),function(v){v.pause();});
    else if(MODE==='main') render(false);
  });
  // ---------- boot ----------
  if (MODE === 'print') { printBuild(); return; }
  fit(); window.addEventListener('resize', fit);
  if (MODE === 'main') {
    buildChrome();
    document.addEventListener('keydown', function (e) { onKey(e); });
    slides.forEach(function (s, i) { s.addEventListener('click', function () { if (overview) { toggleOverview(false); go(i, 0); } }); });
    // fullscreen polish: hide the mouse cursor after 1.5 s without movement
    var hideT = null;
    document.addEventListener('mousemove', function () {
      document.documentElement.classList.remove('deck-hide-cursor');
      clearTimeout(hideT); hideT = setTimeout(function () { document.documentElement.classList.add('deck-hide-cursor'); }, 1500);
    });
    var tx = null;
    document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) (dx < 0 ? next : prev)(); tx = null; });
    var hm = (location.hash || '').match(/^#(\d+)(?:\.(\d+))?/);   // #7 or #7.2 (slide 7, build 2)
    go(hm ? parseInt(hm[1], 10) - 1 : 0, hm && hm[2] ? parseInt(hm[2], 10) : 0);
  } else {
    go(0, 0);
  }
  window.Deck = window.GrailDeck = { next: next, prev: prev, down: down, up: up, go: go, get index() { return cur; }, get step() { return step; }, count: N, steps: steps };
})();
