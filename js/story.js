/* Think & Make — pinned scroll story.
   One GSAP timeline, scrubbed by ScrollTrigger over a sticky stage.

   Five beats, one gesture each:
     01 DISCOVERY  raw, muted client clips scattered like untouched dailies
     02 STRATEGY   they converge into one aligned stack over timeline textures
     03 EDIT       the stack becomes a single finished reel; colour lands
     04 RETENTION  hard cut to the opposite format, captions driving the beat
     05 DELIVERY   the reel shrinks into a row of finished tiles; mark signs off

   Rules honoured (CLAUDE.md / brief §7):
     - progress comes from ScrollTrigger's smoothed scrub, never raw scrollY
     - transform / opacity only (autoAlpha => visibility:hidden at 0)
     - only the active beat's videos play; everything else is paused
     - prefers-reduced-motion and a missing CDN both fall back to the
       static stacked beats already in the HTML/CSS */
(function () {
  'use strict';

  var TM = window.TM || {};
  if (TM.reduceMotion) return;                       // CSS shows the static beats
  if (!window.gsap || !window.ScrollTrigger) return; // site.js already set body.no-motion

  var stage = document.getElementById('storyStage');
  var spacer = document.getElementById('storySpacer');
  if (!stage || !spacer) return;

  var $ = function (sel) { return stage.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(stage.querySelectorAll(sel)); };

  var cards = { a: $('[data-card="a"]'), b: $('[data-card="b"]'), c: $('[data-card="c"]'), d: $('[data-card="d"]') };
  var words = $$('.story__word');
  var tex1 = $('[data-tex="1"]'), tex2 = $('[data-tex="2"]');
  var edit = document.getElementById('storyEdit');
  var retention = document.getElementById('storyRetention');
  var editVeil = edit.querySelector('.sl__veil');
  var mark = $('.story__mark');
  var tcEl = document.getElementById('storyTc');
  var idxEl = document.getElementById('storyIndex');

  var W = function () { return stage.clientWidth; };
  var H = function () { return stage.clientHeight; };
  var mobile = function () { return W() < 700; };

  // Scatter layout (fractions of stage size, from centre) — beat 01.
  var scatter = {
    a: { x: -.30, y: -.13, r: -8 },
    b: { x:  .26, y: -.24, r:  5 },
    c: { x: -.19, y:  .25, r: -4 },
    d: { x:  .30, y:  .17, r:  7 }
  };
  // Aligned stack — beat 02.
  var stack = {
    a: { x: -10, y:   8, r: -1.5 },
    b: { x:   8, y: -10, r:  1 },
    c: { x:  -4, y:  12, r:  .5 },
    d: { x:  12, y:   4, r: -1 }
  };
  var sx = function (k) { return function () { return scatter[k].x * W() * (mobile() ? .9 : 1); }; };
  var sy = function (k) { return function () { return scatter[k].y * H() * (mobile() ? .85 : 1); }; };

  // Delivery row — beat 05: retention shrinks to a tile, a + d flank it.
  var settleW = function () { return mobile() ? W() * .42 : Math.min(W() * .44, 640); };
  var settleScale = function () { return settleW() / retention.offsetWidth; };
  var cardScale = function () { return mobile() ? .8 : 1; };
  var gap = function () { return mobile() ? 10 : 22; };
  var flankX = function (dir) {
    return function () { return dir * (settleW() / 2 + gap() + cards.a.offsetWidth * cardScale() / 2); };
  };

  var allCards = [cards.a, cards.b, cards.c, cards.d];
  gsap.set(allCards, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' });
  gsap.set([edit, retention, tex1, tex2], { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' });
  gsap.set(mark, { xPercent: -50 });
  gsap.set(words, { xPercent: -50, yPercent: -50 });
  gsap.set(cards.a, { zIndex: 4 }); gsap.set(cards.b, { zIndex: 3 }); gsap.set(cards.c, { zIndex: 2 }); gsap.set(cards.d, { zIndex: 5 });

  function wordIn(i, at) {
    tl.fromTo(words[i], { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: .5, ease: 'power3.out' }, at);
  }
  function wordOut(i, at) {
    tl.to(words[i], { autoAlpha: 0, y: -60, duration: .4, ease: 'power3.in' }, at);
  }

  /* ---------------------------------------------------------------------
     The timeline. 10 "seconds" of scrub == the whole pinned distance.
     Beat bounds: 0–1.5 · 1.5–3.2 · 3.2–5.4 · 5.4–7.6 · 7.6–10
     --------------------------------------------------------------------- */
  var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

  // 01 DISCOVERY
  wordIn(0, 0);
  ['a', 'b', 'c', 'd'].forEach(function (k, i) {
    tl.fromTo(cards[k],
      { autoAlpha: 0, scale: .82, rotation: scatter[k].r * 1.6, x: function () { return sx(k)() * 1.25; }, y: function () { return sy(k)() * 1.25; } },
      { autoAlpha: 1, scale: 1, rotation: scatter[k].r, x: sx(k), y: sy(k), duration: .8, ease: 'power3.out' },
      .1 + i * .12);
  });
  wordOut(0, 1.15);

  // 02 STRATEGY — converge
  wordIn(1, 1.5);
  tl.fromTo(tex1, { autoAlpha: 0, rotation: 0, scale: 1.05 }, { autoAlpha: .22, rotation: 4, scale: 1, duration: .9, ease: 'power2.out' }, 1.5)
    .fromTo(tex2,
      { autoAlpha: 0, rotation: -4, x: function () { return -W() * .16; }, y: function () { return -H() * .08; } },
      { autoAlpha: .14, rotation: -9, x: function () { return -W() * .22; }, y: function () { return -H() * .03; }, duration: .9, ease: 'power2.out' }, 1.55);
  ['a', 'b', 'c', 'd'].forEach(function (k, i) {
    tl.to(cards[k], { x: stack[k].x, y: stack[k].y, rotation: stack[k].r, scale: .92, duration: 1.2, ease: 'power3.inOut' }, 1.7 + i * .06);
  });
  wordOut(1, 2.85);

  // 03 EDIT — the stack becomes one graded reel
  tl.to(allCards, { autoAlpha: 0, scale: .78, duration: .32, ease: 'power2.in' }, 3.2)
    .to([tex1, tex2], { autoAlpha: 0, duration: .3 }, 3.2)
    .fromTo(edit, { autoAlpha: 0, scale: .84 }, { autoAlpha: 1, scale: 1, duration: .6, ease: 'power3.out' }, 3.25)
    .fromTo(editVeil, { opacity: 1 }, { opacity: 0, duration: .8, ease: 'power2.inOut' }, 3.55);
  wordIn(2, 3.3);
  wordOut(2, 5.1);

  // 04 RETENTION — hard cut to the opposite format
  gsap.set(retention, { autoAlpha: 0, scale: 1.06 });
  tl.set(edit, { autoAlpha: 0 }, 5.4)
    .set(retention, { autoAlpha: 1 }, 5.4)
    .to(retention, { scale: 1, duration: .6, ease: 'power3.out' }, 5.45);
  wordIn(3, 5.5);
  wordOut(3, 7.3);

  // 05 DELIVERY — settle into a row of finished tiles
  // (a + d get their `is-color` class from setBeat(), so it reverses cleanly)
  tl.to(retention, { scale: settleScale, duration: .9, ease: 'power3.inOut' }, 7.6)
    .fromTo(cards.a,
      { autoAlpha: 0, rotation: 0, scale: cardScale, y: 0, x: function () { return flankX(-1)() - 120; } },
      { autoAlpha: 1, x: flankX(-1), duration: .8, ease: 'power3.out', immediateRender: false }, 7.9)
    .fromTo(cards.d,
      { autoAlpha: 0, rotation: 0, scale: cardScale, y: 0, x: function () { return flankX(1)() + 120; } },
      { autoAlpha: 1, x: flankX(1), duration: .8, ease: 'power3.out', immediateRender: false }, 7.95)
    .to([cards.a.querySelector('.sl__veil'), cards.d.querySelector('.sl__veil')], { opacity: 0, duration: .5 }, 8.1)
    .fromTo(mark, { autoAlpha: 0, scale: .6, y: 24 }, { autoAlpha: 1, scale: 1, y: 0, duration: .6, ease: 'back.out(1.6)' }, 8.9);
  wordIn(4, 7.75);
  tl.to({}, { duration: .1 }, 9.9); // hold to the end

  /* ---------------------------------------------------------------------
     Video activation per beat (pause everything that is not on screen)
     --------------------------------------------------------------------- */
  var bounds = [0, .15, .32, .54, .76, 1.0001];
  var beatVideos = [
    allCards, allCards.concat([tex1, tex2]), [edit], [retention], [retention, cards.a, cards.d]
  ].map(function (els) {
    return els.map(function (el) { return el.tagName === 'VIDEO' ? el : el.querySelector('video'); });
  });
  var currentBeat = -1;
  var MARGIN = .006;

  function vidPlay(v) {
    if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); v.load(); }
    if (!v.paused) return;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  function beatFor(p) {
    if (currentBeat >= 0) {
      var lo = bounds[currentBeat] - (currentBeat > 0 ? MARGIN : 0);
      var hi = bounds[currentBeat + 1] + (currentBeat < 4 ? MARGIN : 0);
      if (p >= lo && p < hi) return currentBeat;
    }
    for (var i = 0; i < 5; i++) if (p >= bounds[i] && p < bounds[i + 1]) return i;
    return 4;
  }
  function setBeat(b) {
    if (b === currentBeat) return;
    var keep = beatVideos[b];
    if (currentBeat >= 0) beatVideos[currentBeat].forEach(function (v) { if (keep.indexOf(v) < 0 && !v.paused) v.pause(); });
    keep.forEach(vidPlay);
    currentBeat = b;
    cards.a.classList.toggle('is-color', b === 4);
    cards.d.classList.toggle('is-color', b === 4);
    if (idxEl) idxEl.textContent = '0' + (b + 1);
  }

  var lastFrame = -1;
  function hud(p) {
    var frames = Math.floor(p * 24 * 40); // 40s of "timeline" across the pin, cosmetic
    if (frames === lastFrame) return;
    lastFrame = frames;
    if (tcEl) tcEl.textContent = '00:00:' + String(Math.floor(frames / 24)).padStart(2, '0') + ':' + String(frames % 24).padStart(2, '0');
  }

  var st = ScrollTrigger.create({
    trigger: spacer, start: 'top top', end: 'bottom bottom',
    scrub: .8, animation: tl, invalidateOnRefresh: true,
    onUpdate: function (self) { setBeat(beatFor(self.progress)); hud(self.progress); },
    onRefresh: function (self) { setBeat(beatFor(self.progress)); hud(self.progress); },
    onLeave: function () { beatVideos[4].forEach(function (v) { v.pause(); }); currentBeat = -1; },
    onLeaveBack: function () { beatVideos[0].forEach(function (v) { v.pause(); }); currentBeat = -1; }
  });

  // Beat 01 should be visible at rest (before any scroll) once the pin is in view.
  setBeat(beatFor(st.progress));
  hud(st.progress);
})();
