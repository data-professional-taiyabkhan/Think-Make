/* Think & Make — site interactions (nav, marquee, work grid, off-screen video pausing).
   The pinned scroll story lives entirely in story.js. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     Nav toggle (mobile)
     --------------------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------------------
     TODO placeholder links: don't let them jump the page around.
     --------------------------------------------------------------------- */
  document.querySelectorAll('a[data-todo]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------------------------------------------------------------------
     Marquee: pause the CSS animation entirely when off-screen.
     --------------------------------------------------------------------- */
  var marqueeTrack = document.querySelector('.marquee__track');
  if (marqueeTrack && 'IntersectionObserver' in window) {
    var marqueeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        marqueeTrack.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0 });
    marqueeObserver.observe(marqueeTrack);
  }

  /* ---------------------------------------------------------------------
     Work grid: lazy-load on first interaction, play on hover/focus/tap,
     pause (not reset) on leave so the frame holds and the desaturated
     filter eases back in via CSS.
     --------------------------------------------------------------------- */
  document.querySelectorAll('.work-tile').forEach(function (tile) {
    var trigger = tile.querySelector('.work-tile__trigger');
    var video = tile.querySelector('.work-tile__video');
    if (!trigger || !video) return;
    var src = trigger.getAttribute('data-video');
    var loaded = false;

    function ensureLoaded() {
      if (!loaded) { video.src = src; loaded = true; }
    }
    function play() {
      ensureLoaded();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      tile.classList.add('is-playing');
    }
    function pause() {
      video.pause();
      tile.classList.remove('is-playing');
    }

    trigger.addEventListener('mouseenter', play);
    trigger.addEventListener('mouseleave', pause);
    trigger.addEventListener('focus', play);
    trigger.addEventListener('blur', pause);
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (tile.classList.contains('is-playing')) pause(); else play();
    });
  });

  /* ---------------------------------------------------------------------
     Global safety net: pause ANY playing video once it's fully off-screen
     (brief performance rule 7). Story layers are primarily managed by
     story.js; this just guarantees nothing keeps decoding off-screen.
     --------------------------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && !entry.target.paused) {
          entry.target.pause();
        }
      });
    }, { threshold: 0 });

    document.querySelectorAll('video').forEach(function (v) { videoObserver.observe(v); });
  }
})();
