/* Think & Make — pinned scroll story (GSAP ScrollTrigger).
   Rules this file exists to honour (see CLAUDE.md / brief §7):
     - No direct scrollY-driven animation: ScrollTrigger's own `scrub`
       supplies the smoothed progress value, we never read scrollY ourselves.
     - transform/opacity/filter only, never layout properties, inside the
       per-frame update.
     - Only the currently-active beat does per-frame work; inactive beats
       are visibility:hidden and untouched until their boundary is crossed.
     - Off-screen video (any beat that isn't active) is paused, not just
       invisible, so nothing keeps decoding in the background.
     - Full prefers-reduced-motion fallback: skip all of this, CSS already
       shows the static stacked beats instead. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  var stage = document.querySelector('.story__stage');
  var spacer = document.querySelector('.story__spacer');
  if (!stage || !spacer) return;

  var beats = Array.prototype.slice.call(stage.querySelectorAll('.beat'));
  var hudTc = document.getElementById('hudTc');

  // Beat boundaries as fractions of total pinned scroll (matches STORY-CONCEPT.md).
  var bounds = [0, 0.15, 0.30, 0.50, 0.75, 1.0];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function videosIn(beatEl) {
    return Array.prototype.slice.call(beatEl.querySelectorAll('video'));
  }

  function activate(beatEl) {
    beatEl.style.visibility = 'visible';
    videosIn(beatEl).forEach(function (v) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!v.paused) return;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  function deactivate(beatEl) {
    beatEl.style.visibility = 'hidden';
    beatEl.style.opacity = 0;
    videosIn(beatEl).forEach(function (v) { if (!v.paused) v.pause(); });
  }

  var currentIndex = -1;

  // Hysteresis around each boundary: once a beat is active, its effective
  // range is padded a little so scroll position hovering right at a
  // boundary (very common mid-reversal, since scrub easing overshoots
  // before settling) doesn't flip activate()/deactivate() back and forth
  // on the same videos every frame -- that thrashing was the source of
  // the "glitchy on scroll-up" reports.
  var BOUNDARY_MARGIN = 0.006;

  function resolveBeatIndex(progress) {
    if (currentIndex >= 0) {
      var lo = bounds[currentIndex] - (currentIndex > 0 ? BOUNDARY_MARGIN : 0);
      var hi = bounds[currentIndex + 1] + (currentIndex < bounds.length - 2 ? BOUNDARY_MARGIN : 0);
      if (progress >= lo && progress < hi) return currentIndex;
    }
    for (var i = 0; i < bounds.length - 1; i++) {
      if (progress >= bounds[i] && progress < bounds[i + 1]) return i;
    }
    return bounds.length - 2;
  }

  function renderBeat1(el, t) {
    var layers = el.querySelectorAll('.story-layer');
    var fade = t < 0.15 ? t / 0.15 : 1;
    el.style.opacity = fade;
    layers.forEach(function (layer, i) {
      var drift = lerp(24, 0, fade) - i * 2;
      layer.style.opacity = fade;
      layer.style.transform = 'translate3d(0,' + drift + 'px,0) scale(' + lerp(0.9, 1, fade) + ')';
    });
  }

  function renderBeat2(el, t) {
    var tex = el.querySelectorAll('.story-texture');
    tex.forEach(function (layer, i) {
      var rot = i === 0 ? lerp(0, 6, t) : lerp(-4, -10, t);
      var y = lerp(0, i === 0 ? -14 : 14, t);
      layer.style.transform = 'translate3d(-50%,-50%,0) translate3d(0,' + y + 'px,0) rotate(' + rot + 'deg)';
      layer.style.opacity = lerp(i === 0 ? 0.18 : 0.12, i === 0 ? 0.28 : 0.18, t);
    });
    el.style.opacity = t < 0.1 ? t / 0.1 : 1;
  }

  function renderBloomClip(el, t, className) {
    var clip = el.querySelector('.' + className);
    if (!clip) return;
    var fade = t < 0.08 ? t / 0.08 : 1;
    el.style.opacity = fade;
    var scale = lerp(0.94, 1, clamp01(t / 0.35));
    var sat = lerp(0.35, 1, clamp01(t / 0.45));
    var bri = lerp(0.6, 1, clamp01(t / 0.45));
    clip.style.transform = 'translate3d(0,0,0) scale(' + scale + ')';
    clip.style.filter = 'saturate(' + sat + ') brightness(' + bri + ')';
  }

  function renderBeat4(el, t) {
    var clip = el.querySelector('.story-hero-clip');
    var fade = t < 0.03 ? t / 0.03 : 1; // hard cut, near-instant
    el.style.opacity = fade;
    if (clip) {
      clip.style.filter = 'saturate(1) brightness(1)';
      clip.style.transform = 'translate3d(0,0,0) scale(1)';
    }
  }

  function renderBeat5(el, t) {
    var fade = t < 0.12 ? t / 0.12 : 1;
    el.style.opacity = fade;
    var layers = el.querySelectorAll('.story-layer');
    layers.forEach(function (layer, i) {
      var y = lerp(30, 0, fade) + i;
      layer.style.opacity = fade;
      layer.style.transform = 'translate3d(0,' + y + 'px,0) scale(' + lerp(0.92, 1, fade) + ')';
    });
    var mark = el.querySelector('.story-mark');
    if (mark) {
      var markT = clamp01((t - 0.3) / 0.4);
      mark.style.opacity = markT;
      mark.style.transform = 'translate3d(-50%,0,0) scale(' + lerp(0.7, 1, markT) + ')';
    }
  }

  var renderers = [renderBeat1, renderBeat2, function (el, t) { renderBloomClip(el, t, 'story-hero-clip'); }, renderBeat4, renderBeat5];

  function render(progress) {
    var idx = resolveBeatIndex(progress);

    if (idx !== currentIndex) {
      if (currentIndex >= 0) deactivate(beats[currentIndex]);
      activate(beats[idx]);
      currentIndex = idx;
    }

    var localT = clamp01((progress - bounds[idx]) / (bounds[idx + 1] - bounds[idx]));
    renderers[idx](beats[idx], localT);

    if (hudTc) {
      var totalFrames = Math.floor(progress * 5400); // cosmetic only
      var ff = totalFrames % 60;
      var ss = Math.floor(totalFrames / 60) % 60;
      var mm = Math.floor(totalFrames / 3600) % 60;
      hudTc.textContent =
        String(mm).padStart(2, '0') + ':' +
        String(ss).padStart(2, '0') + ':' +
        String(ff).padStart(2, '0');
    }
  }

  ScrollTrigger.create({
    trigger: spacer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    onUpdate: function (self) { render(self.progress); },
    onRefresh: function (self) { render(self.progress); }
  });

  // First beat should be visible/playing at rest, before any scroll.
  render(0);
})();
