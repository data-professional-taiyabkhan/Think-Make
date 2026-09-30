/* Think & Make — site motion system.
   Everything here is progressive enhancement: the HTML/CSS is fully readable
   with no JavaScript at all. This file only *adds* motion once GSAP is
   confirmed present, and sets initial "hidden" states immediately before
   animating them, so a failed CDN never leaves a blank page.

   Rules honoured (CLAUDE.md / brief §7):
     - Scroll is smoothed by Lenis (a rAF lerp toward the scroll target);
       nothing in here reads scrollY per frame itself.
     - Every per-frame animation is transform/opacity only.
     - Off-screen video is paused via IntersectionObserver.
     - prefers-reduced-motion switches all of this off. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var TM = window.TM = { reduceMotion: reduceMotion, hasGsap: hasGsap, lenis: null };

  var body = document.body;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------------
     Things that must work with or without GSAP
     --------------------------------------------------------------------- */
  // Placeholder links (booking URL etc.) never jump the page.
  $$('a[data-todo]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  // Mobile menu
  var navToggle = $('#navToggle'), menu = $('#navMenu');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    body.classList.toggle('is-locked', open);
    if (TM.lenis) { open ? TM.lenis.stop() : TM.lenis.start(); }
  }
  if (navToggle && menu) {
    navToggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
  }

  // In-page anchors: Lenis when available, native smooth scroll otherwise.
  $$('a[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var target = $(id);
      if (!target) return;
      e.preventDefault();
      if (TM.lenis) TM.lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  // Lightbox (work gallery). Native controls, so it works on every input.
  var lightbox = $('#lightbox'), lbVideo = $('#lightboxVideo'), lbTitle = $('#lightboxTitle'),
      lbFormat = $('#lightboxFormat'), lbClose = $('#lightboxClose'), lbStage = $('.lightbox__stage');
  var lbReturnFocus = null;
  function openLightbox(src, title, format, returnTo) {
    if (!lightbox || !lbVideo) return;
    lbReturnFocus = returnTo || null;
    lbTitle.textContent = title || '';
    lbFormat.textContent = format || '';
    lightbox.classList.toggle('lightbox--portrait', /9:16/.test(format || ''));
    lbVideo.src = src;
    lightbox.hidden = false;
    body.classList.add('is-locked');
    if (TM.lenis) TM.lenis.stop();
    var p = lbVideo.play(); if (p && p.catch) p.catch(function () {});
    if (hasGsap && !reduceMotion) {
      gsap.fromTo(lightbox, { autoAlpha: 0 }, { autoAlpha: 1, duration: .35, ease: 'power2.out' });
      gsap.fromTo(lbStage, { scale: .94, y: 20 }, { scale: 1, y: 0, duration: .7, ease: 'power4.out' });
    }
    lbClose.focus();
  }
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    var finish = function () {
      lbVideo.pause();
      lbVideo.removeAttribute('src');
      lbVideo.load();
      lightbox.hidden = true;
      body.classList.remove('is-locked');
      if (TM.lenis) TM.lenis.start();
      if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    };
    if (hasGsap && !reduceMotion) gsap.to(lightbox, { autoAlpha: 0, duration: .3, ease: 'power2.in', onComplete: finish });
    else finish();
  }
  if (lightbox) {
    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }
  $$('.tile[data-video]').forEach(function (tile) {
    var btn = $('.tile__btn', tile);
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openLightbox(tile.getAttribute('data-video'), tile.getAttribute('data-title'), tile.getAttribute('data-format'), btn);
    });
  });

  // Global safety net: nothing keeps decoding off-screen.
  if ('IntersectionObserver' in window) {
    var vidObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
      });
    }, { threshold: 0 });
    $$('main video').forEach(function (v) { vidObserver.observe(v); });
  }

  /* ---------------------------------------------------------------------
     No GSAP (CDN blocked)? Static, fully readable site. Done.
     --------------------------------------------------------------------- */
  var preloader = $('#preloader');
  if (!hasGsap) {
    body.classList.add('no-motion');
    if (preloader) preloader.classList.add('is-done');
    startHeroMontage(false);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) { try { gsap.registerPlugin(SplitText); } catch (e) { /* optional */ } }
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------------------------------------------------------------------
     Smooth scroll (Lenis) synced to ScrollTrigger
     --------------------------------------------------------------------- */
  if (window.Lenis && !reduceMotion) {
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    TM.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------------------------------------------------------------
     Nav: solid after the hero, hides on scroll down, returns on scroll up.
     --------------------------------------------------------------------- */
  var nav = $('#nav');
  if (nav) {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 40);
        var menuOpen = menu && menu.classList.contains('is-open');
        nav.classList.toggle('is-hidden', !menuOpen && self.direction === 1 && y > 260);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Custom cursor + magnetic buttons (desktop, pointer: fine)
     --------------------------------------------------------------------- */
  var cursor = $('#cursor');
  if (cursor && finePointer && !reduceMotion) {
    body.classList.add('has-cursor');
    var dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__label', cursor);
    var dotX = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3.out' });
    var dotY = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3.out' });
    var ringX = gsap.quickTo(ring, 'x', { duration: .42, ease: 'power3.out' });
    var ringY = gsap.quickTo(ring, 'y', { duration: .42, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) {
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
      cursor.classList.remove('is-hidden');
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      var play = t.closest && t.closest('.tile__btn');
      var hot = t.closest && t.closest('a, button, [data-magnetic], .index__row');
      cursor.classList.toggle('is-play', !!play);
      cursor.classList.toggle('is-hover', !!hot && !play);
      if (play) label.textContent = 'Play';
    });

    $$('[data-magnetic]').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
      var my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * .28);
        my((e.clientY - (r.top + r.height / 2)) * .28);
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1, .45)' });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Text splitting helpers (SplitText is optional; plain reveal otherwise)
     --------------------------------------------------------------------- */
  function splitLines(el, onLines) {
    if (window.SplitText) {
      try {
        return SplitText.create(el, {
          type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'split-line',
          onSplit: function (self) { return onLines(self.lines); }
        });
      } catch (e) { /* fall through */ }
    }
    return onLines([el]);
  }

  /* ---------------------------------------------------------------------
     Preloader -> hero intro
     --------------------------------------------------------------------- */
  var hero = $('.hero');
  var heroTitle = $('.hero__title');
  var heroBits = [$('.hero__eyebrow'), $('.hero__sub'), $('.hero__actions'), $('.hero__hud'), $('.hero__frame')].filter(Boolean);
  var introDone = false;
  var heroLines = null;

  gsap.set(heroBits, { autoAlpha: 0, y: 18 });
  splitLines(heroTitle, function (lines) {
    heroLines = lines;
    if (introDone) { gsap.set(lines, { yPercent: 0 }); return null; }
    gsap.set(lines, { yPercent: 110 });
    return null;
  });

  function playHeroIntro() {
    if (introDone) return;
    introDone = true;
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (heroLines) tl.to(heroLines, { yPercent: 0, duration: 1.2, stagger: .1 }, 0);
    tl.to(heroBits, { autoAlpha: 1, y: 0, duration: 1, stagger: .08 }, .25);
    startHeroMontage(true);
  }

  function runPreloader() {
    if (!preloader) { playHeroIntro(); return; }
    var seen = false;
    try { seen = sessionStorage.getItem('tm-seen') === '1'; sessionStorage.setItem('tm-seen', '1'); } catch (e) { /* private mode */ }
    if (reduceMotion || seen) {
      preloader.classList.add('is-done');
      playHeroIntro();
      return;
    }
    if (TM.lenis) TM.lenis.stop();
    var tc = $('#preloaderTc'), bar = $('#preloaderBar'), letters = $$('.preloader__mask > span', preloader);
    var counter = { f: 0 };
    var tl = gsap.timeline({
      onComplete: function () {
        preloader.classList.add('is-done');
        if (TM.lenis) TM.lenis.start();
        ScrollTrigger.refresh();
      }
    });
    tl.to(letters, { y: 0, duration: 1, ease: 'power4.out', stagger: .09 }, .1)
      .to(bar, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(counter, { f: 36, duration: 1.5, ease: 'none', onUpdate: function () {
        var f = Math.round(counter.f);
        tc.textContent = '00:00:' + String(Math.floor(f / 24)).padStart(2, '0') + ':' + String(f % 24).padStart(2, '0');
      } }, 0)
      .to(preloader, { yPercent: -100, duration: 1, ease: 'power4.inOut' }, 1.65)
      .add(playHeroIntro, 1.85);
  }

  /* ---------------------------------------------------------------------
     Hero showreel montage: hard cuts between pre-graded loops of real work
     --------------------------------------------------------------------- */
  var montageStarted = false;
  function startHeroMontage(withMotion) {
    if (montageStarted) return;
    montageStarted = true;
    var reel = $('#heroReel');
    if (!reel) return;
    var portrait = window.matchMedia('(orientation: portrait)').matches;
    var set = portrait ? 'p' : 'l';
    var clips = $$('.hero__clip', reel).filter(function (v) {
      var keep = v.getAttribute('data-set') === set;
      if (!keep) v.parentNode.removeChild(v);
      return keep;
    });
    if (!clips.length) return;
    var segs = $$('#heroSegments i'), idxEl = $('#heroReelIndex'), tcEl = $('#heroTc');
    var CUT = 4000, i = -1, timer = null, running = false, tcTick = null, t0 = 0, lastF = -1;

    clips[0].classList.add('is-active');
    if (reduceMotion || saveData || !withMotion) return; // poster only

    function load(v) { if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); v.load(); } }
    function cutTo(n) {
      var prev = clips[i], next = clips[n];
      load(next);
      var p = next.play(); if (p && p.catch) p.catch(function () {});
      next.classList.add('is-active');
      gsap.fromTo(next, { scale: 1.07 }, { scale: 1, duration: 1.4, ease: 'power3.out', overwrite: true });
      if (prev && prev !== next) {
        prev.classList.remove('is-active');
        setTimeout(function () { if (!prev.classList.contains('is-active')) prev.pause(); }, 250);
      }
      segs.forEach(function (s, k) {
        s.classList.remove('is-active', 'is-done');
        if (k < n) s.classList.add('is-done');
      });
      // Restart the fill transition from zero.
      void segs[n].offsetWidth;
      segs[n].classList.add('is-active');
      idxEl.textContent = String(n + 1).padStart(2, '0');
      i = n;
      load(clips[(n + 1) % clips.length]);
    }
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(function () { if (running) { cutTo((i + 1) % clips.length); schedule(); } }, CUT);
    }
    function start() {
      if (running) return;
      running = true;
      if (i < 0) cutTo(0); else { var p = clips[i].play(); if (p && p.catch) p.catch(function () {}); }
      schedule();
      if (!tcTick) {
        t0 = gsap.ticker.time;
        tcTick = function (time) {
          var f = Math.floor((time - t0) * 24);
          if (f === lastF) return;
          lastF = f;
          tcEl.textContent = '00:' + String(Math.floor(f / 1440) % 60).padStart(2, '0') + ':' +
            String(Math.floor(f / 24) % 60).padStart(2, '0') + ':' + String(f % 24).padStart(2, '0');
        };
        gsap.ticker.add(tcTick);
      }
    }
    function stop() {
      running = false;
      clearTimeout(timer);
      if (i >= 0) clips[i].pause();
      if (tcTick) { gsap.ticker.remove(tcTick); tcTick = null; }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
      }, { threshold: .05 }).observe(reel);
    } else start();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (reel.getBoundingClientRect().bottom > 0) start();
    });
  }

  /* ---------------------------------------------------------------------
     Manifesto: words brighten as you scroll through the sentence
     --------------------------------------------------------------------- */
  var manifesto = $('#manifesto');
  if (manifesto) {
    var text = manifesto.textContent.trim().split(/\s+/);
    manifesto.innerHTML = text.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var words = $$('.w', manifesto);
    if (!reduceMotion) {
      gsap.fromTo(words, { opacity: .14 }, {
        opacity: 1, ease: 'none', stagger: { each: .6 / words.length },
        scrollTrigger: { trigger: manifesto, start: 'top 82%', end: 'bottom 42%', scrub: .5 }
      });
    }
  }

  /* ---------------------------------------------------------------------
     Section reveals
     --------------------------------------------------------------------- */
  if (!reduceMotion) {
    $$('[data-split="lines"]').forEach(function (el) {
      if (el === heroTitle) return;
      splitLines(el, function (lines) {
        return gsap.from(lines, {
          yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: .09,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
    });

    var staggerGroups = [['#serviceIndex', '.index__row'], ['#proof', '.proof__item'], ['#steps', '.step'], ['.credits', '.member']];
    staggerGroups.forEach(function (g) {
      var root = $(g[0]); if (!root) return;
      var items = $$(g[1], root); if (!items.length) return;
      items.forEach(function (it) { it.removeAttribute('data-reveal'); });
      gsap.from(items, { y: 34, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: .08,
        scrollTrigger: { trigger: root, start: 'top 85%', once: true } });
    });

    $$('[data-reveal]').forEach(function (el) {
      if (el.closest('.hero')) return;
      gsap.from(el, { y: 26, autoAlpha: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  /* ---------------------------------------------------------------------
     Services: ambient preview (stock texture) follows the cursor
     --------------------------------------------------------------------- */
  var preview = $('#servicePreview'), serviceList = $('#serviceIndex');
  if (preview && serviceList && finePointer && !reduceMotion) {
    var pv = $('video', preview), wrap = preview.parentNode;
    var pX = gsap.quickTo(preview, 'x', { duration: .5, ease: 'power3.out' });
    var pY = gsap.quickTo(preview, 'y', { duration: .5, ease: 'power3.out' });
    var pvSrc = '';
    function movePreview(e) {
      var r = wrap.getBoundingClientRect();
      pX(e.clientX - r.left + 28);
      pY(e.clientY - r.top - preview.offsetHeight / 2);
    }
    $$('.index__row', serviceList).forEach(function (row) {
      row.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        var src = row.getAttribute('data-preview');
        if (src && src !== pvSrc) { pvSrc = src; pv.src = src; pv.load(); }
        var p = pv.play(); if (p && p.catch) p.catch(function () {});
        movePreview(e);
        // overwrite:'auto' only replaces the alpha/scale tweens, never the x/y quickTo.
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: .45, ease: 'power3.out', overwrite: 'auto' });
      });
    });
    serviceList.addEventListener('pointermove', movePreview, { passive: true });
    serviceList.addEventListener('pointerleave', function () {
      gsap.to(preview, { autoAlpha: 0, scale: .92, duration: .35, ease: 'power2.in', overwrite: 'auto', onComplete: function () { pv.pause(); } });
    });
    gsap.set(preview, { scale: .92 });
  }

  /* ---------------------------------------------------------------------
     Work: long form | short form split. Hover-to-play on every tile, a
     per-tile reveal, a divider that draws as you pass, and a gentle
     counter-scroll on the short-form column so the two streams feel alive.
     --------------------------------------------------------------------- */
  var tiles = $$('.tile[data-video]');
  tiles.forEach(function (tile) {
    var btn = $('.tile__btn', tile), video = $('.tile__video', tile);
    var src = tile.getAttribute('data-video');
    function play() {
      if (!video.getAttribute('src')) { video.src = src; video.load(); }
      var p = video.play(); if (p && p.catch) p.catch(function () {});
      tile.classList.add('is-playing');
    }
    function pause() { video.pause(); tile.classList.remove('is-playing'); }
    btn.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !saveData) play(); });
    btn.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') pause(); });
    btn.addEventListener('focus', function () { if (!saveData) play(); });
    btn.addEventListener('blur', pause);
  });

  var split = $('#workSplit');
  if (split && !reduceMotion) {
    tiles.forEach(function (tile) {
      gsap.from(tile, { y: 44, autoAlpha: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: tile, start: 'top 92%', once: true } });
    });
    var rule = $('#splitRule');
    if (rule) {
      gsap.to(rule, { scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: split, start: 'top 75%', end: 'bottom 70%', scrub: .6 } });
    }
    var mmSplit = gsap.matchMedia();
    mmSplit.add('(min-width: 900px)', function () {
      var list = $('#shortList'), colLong = $('#colLong');
      if (!list) return;
      var tw = gsap.fromTo(list, { y: 70 }, { y: -70, ease: 'none',
        scrollTrigger: { trigger: split, start: 'top bottom', end: 'bottom top', scrub: true } });
      // Sticky-bottom for the shorter column (see .split__col--long in CSS).
      var ro = null;
      function setLongTop() {
        if (!colLong) return;
        var top = Math.min(window.innerHeight - colLong.offsetHeight - 32, 80);
        colLong.style.top = top + 'px';
      }
      if (colLong) {
        setLongTop();
        if ('ResizeObserver' in window) { ro = new ResizeObserver(setLongTop); ro.observe(colLong); }
        window.addEventListener('resize', setLongTop);
      }
      return function () {
        tw.kill(); gsap.set(list, { clearProps: 'transform' });
        if (ro) ro.disconnect();
        window.removeEventListener('resize', setLongTop);
        if (colLong) colLong.style.top = '';
      };
    });
  }

  /* ---------------------------------------------------------------------
     Marquee: infinite, speeds up and leans with scroll velocity
     --------------------------------------------------------------------- */
  var track = $('#marqueeTrack');
  if (track && !reduceMotion) {
    var loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 30, repeat: -1 });
    // One smoothed value drives both speed and lean; no tween churn per scroll event.
    var skewTo = gsap.quickTo(track, 'skewX', { duration: .4, ease: 'power3.out' });
    var targetTs = 1, ts = 1, dir = 1, visible = true;
    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity();
        if (Math.abs(v) > 40) dir = v < 0 ? -1 : 1;
        targetTs = dir * gsap.utils.clamp(1, 6, 1 + Math.abs(v) / 500);
        skewTo(gsap.utils.clamp(-8, 8, v / 250));
      }
    });
    gsap.ticker.add(function () {
      if (!visible) return;
      targetTs += (dir - targetTs) * .04;          // decay back to cruising speed
      ts += (targetTs - ts) * .12;                 // ease toward the target
      if (Math.abs(ts - loop.timeScale()) > .002) loop.timeScale(ts);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible = en.isIntersecting; visible ? loop.play() : loop.pause(); });
      }, { threshold: 0 }).observe(track);
    }
  }

  /* ---------------------------------------------------------------------
     Process: line draws across the steps as they scroll into view
     --------------------------------------------------------------------- */
  var steps = $('#steps'), stepsLine = $('#stepsLine');
  if (steps && stepsLine && !reduceMotion) {
    var stepEls = $$('.step', steps);
    var mmSteps = gsap.matchMedia();
    var drawLine = function (prop) {
      var vars = { ease: 'none', scrollTrigger: { trigger: steps, start: 'top 78%', end: 'bottom 40%', scrub: .6,
        onUpdate: function (self) {
          stepEls.forEach(function (s, k) { s.classList.toggle('is-on', self.progress >= k / (stepEls.length - 1) - .02); });
        } } };
      vars[prop] = 1;
      var tw = gsap.to(stepsLine, vars);
      return function () { tw.kill(); gsap.set(stepsLine, { clearProps: 'transform' }); };
    };
    mmSteps.add('(min-width: 861px)', function () { return drawLine('scaleX'); });
    mmSteps.add('(max-width: 860px)', function () { return drawLine('scaleY'); });
  }

  /* ---------------------------------------------------------------------
     Book: slow push-in on the plate (transform only)
     --------------------------------------------------------------------- */
  var bookBg = $('#bookBg');
  if (bookBg && !reduceMotion) {
    gsap.fromTo(bookBg, { scale: 1 }, { scale: 1.14, ease: 'none',
      scrollTrigger: { trigger: '.book', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------------------------------------------------------------------
     Kick-off: wait for fonts so line splitting measures real metrics.
     --------------------------------------------------------------------- */
  var kicked = false;
  function kick() {
    if (kicked) return; kicked = true;
    runPreloader();
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(kick);
    setTimeout(kick, 1800); // never wait on a slow font CDN
  } else kick();
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
