/* Ray2Volt 3D landing page. No dependencies.
   1. Menu (the ray2voltsolar.com phone menu)          5. Back to top, and floating buttons that step aside
   2. Theme toggle (key r2v-theme, light by default)   6. Hero loop (performance guards) and the motion pause
   3. In-page links and direct #links                  7. Enquiry form: one form, two send actions
   4. Scroll reveal
   When everything is set up, window.R2V_READY is set; the head script in index.html shows the page without the
   reveal and the form (email note instead) if that never happens. */
(function () {
  'use strict';

  var WA_NUMBER = '919666068140';
  var EMAIL = '3d@ray2voltsolar.com';
  var DEFAULT_ENDPOINT = 'https://api.web3forms.com/submit';
  // The access key in index.html counts as "not set" while it is empty or still starts with "YOUR_". The full
  // placeholder token is deliberately not written in this file, so it appears exactly once in site/ (index.html).
  var KEY_NOT_SET = /^YOUR_/i;
  var THEME_COLORS = { light: '#FFFFFF', dark: '#0A0F1D' };

  var root = document.documentElement;
  var reduceMotion = function () {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  var isMobile = /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent || '') ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent || ''));

  function waUrl(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  // Opens WhatsApp: in the same tab on phones (the app takes over), in a new tab on computers. If a popup blocker
  // stops the new tab, the same tab is used instead.
  function openWhatsApp(text) {
    var url = waUrl(text);
    if (isMobile) {
      window.location.assign(url);
      return;
    }
    var w = null;
    try { w = window.open(url, '_blank'); } catch (e) { w = null; }
    if (w) {
      try { w.opener = null; } catch (e) { /* cross-origin already */ }
    } else {
      window.location.assign(url);
    }
  }

  // Opens the visitor's own email app with the message filled in (no request leaves the page)
  function openMail(subject, body) {
    var a = document.createElement('a');
    a.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + (body ? '&body=' + encodeURIComponent(body) : '');
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ---------- 1. Menu ---------- */
  var header = document.querySelector('.header');
  var menuToggle = document.querySelector('.menu-toggle');
  var navMenu = document.querySelector('.nav-menu');
  if (menuToggle && navMenu) {
    var setMenu = function (open) {
      menuToggle.classList.toggle('active', open);
      navMenu.classList.toggle('active', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    setMenu(false);
    menuToggle.addEventListener('click', function () {
      setMenu(!navMenu.classList.contains('active'));
    });
    navMenu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (!navMenu.classList.contains('active')) return;
      if (header && header.contains(e.target)) return;
      setMenu(false);
    });
    // The button comes before the list in the page, so Tab moves from the open button into the menu. Tabbing out of
    // the header closes the panel, so focus never moves on behind it.
    if (header) {
      header.addEventListener('focusout', function (e) {
        if (navMenu.classList.contains('active') && e.relatedTarget && !header.contains(e.relatedTarget)) setMenu(false);
      });
    }
    // Wider than the menu breakpoint (set in site.css), the menu button is gone: close the panel
    window.addEventListener('resize', function () {
      if (navMenu.classList.contains('active') && getComputedStyle(menuToggle).display === 'none') setMenu(false);
    });
  }

  /* ---------- 2. Theme toggle (round, bottom left, as on ray2voltsolar.com) ----------
     The same switch also sits in the phone menu panel, because the floating one steps aside whenever it would
     cover text (section 5). */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var syncThemeColor = function () {
    if (themeMeta) themeMeta.setAttribute('content', THEME_COLORS[root.getAttribute('data-theme')] || THEME_COLORS.light);
  };
  var themeStack = null;
  if (root.hasAttribute('data-theme')) {
    var THEME_ICONS =
      '<svg class="theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' +
      '<svg class="theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    themeStack = document.createElement('div');
    // Starts stepped aside; the first check (section 5) shows it if nothing is under it
    themeStack.className = 'sticky-contact is-covering';
    var themeButton = document.createElement('button');
    themeButton.type = 'button';
    themeButton.className = 'sticky-contact-btn theme-toggle';
    themeButton.setAttribute('data-theme-toggle', '');
    themeButton.innerHTML = THEME_ICONS;
    themeStack.appendChild(themeButton);
    document.body.appendChild(themeStack);

    var menuTheme = null, menuThemeLabel = null;
    if (navMenu) {
      var themeItem = document.createElement('li');
      themeItem.className = 'nav-menu__theme';
      menuTheme = document.createElement('button');
      menuTheme.type = 'button';
      menuTheme.className = 'nav-theme theme-toggle';
      menuTheme.innerHTML = THEME_ICONS + '<span></span>';
      menuThemeLabel = menuTheme.lastChild;
      themeItem.appendChild(menuTheme);
      navMenu.insertBefore(themeItem, navMenu.querySelector('.nav-menu__parent'));
    }

    var syncThemeLabel = function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      themeButton.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      themeButton.setAttribute('title', 'Switch to ' + next + ' theme');
      if (menuThemeLabel) menuThemeLabel.textContent = 'Switch to ' + next + ' theme';
    };
    var switchTheme = function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('r2v-theme', next); } catch (e) { /* the theme still switches for this view */ }
      syncThemeLabel();
      syncThemeColor();
    };
    themeButton.addEventListener('click', switchTheme);
    if (menuTheme) menuTheme.addEventListener('click', switchTheme);
    syncThemeLabel();
    syncThemeColor();
  }

  /* ---------- 3. In-page links and direct #links ----------
     Smooth scroll with the fixed header's height taken off, as on ray2voltsolar.com. Links marked data-wa-pref
     (the "WhatsApp" links elsewhere on the page) lead to the same form, with "Send on WhatsApp" preselected:
     visitors who only want WhatsApp still fill in the form, and their details travel in the message. */
  var waHint = document.getElementById('wa-hint');
  var waLead = document.getElementById('wa-lead');
  var formActions = document.getElementById('form-actions');
  // fromLink: the visitor used a WhatsApp link or /#whatsapp, and lands at the top of the form, far above the send
  // buttons, so a one-line note under the form title says what to do
  function preferWhatsApp(fromLink) {
    if (formActions) formActions.classList.add('prefers-wa');
    if (waHint) waHint.hidden = false;
    if (fromLink && waLead) {
      waLead.hidden = false;
      // The note under the form title says it; the same line in the section intro would repeat it
      var section = document.getElementById('proposal');
      if (section) section.classList.add('is-wa-lead');
    }
  }

  function headerOffset() {
    return (header ? header.getBoundingClientRect().bottom : 0) + 12;
  }

  // behavior: 'smooth' for clicks, 'instant' for the corrections after a direct #link has loaded
  function scrollToTarget(target, focusEl, behavior) {
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: behavior || (reduceMotion() ? 'instant' : 'smooth') });
    var el = focusEl || target;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function formFocusTarget() {
    return document.getElementById('form-title') || document.getElementById('enquire');
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var id = link.getAttribute('href');
    if (id === '#' || id === '#main') return;
    var target = null;
    try { target = document.querySelector(id); } catch (err) { target = null; }
    if (!target) return;
    e.preventDefault();
    if (link.hasAttribute('data-wa-pref')) preferWhatsApp(true);
    scrollToTarget(target, id === '#enquire' ? formFocusTarget() : null);
  });

  // Direct links (ads, messages, the 404 page): /#enquire, /#whatsapp (the form with WhatsApp preselected) and
  // any section id. The page is placed at once, then placed again after the web fonts and the load event, because
  // both change the height of everything above the target; never once the visitor has started scrolling.
  var visitorMoved = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (type) {
    window.addEventListener(type, function () { visitorMoved = true; }, { capture: true, passive: true });
  });
  function landOnHash(initial) {
    var hash = (window.location.hash || '').toLowerCase();
    if (!hash || hash === '#' || hash === '#main') return;
    var wa = hash === '#whatsapp' || hash === '#enquire-whatsapp';
    var id = wa ? '#enquire' : hash;
    var target = null;
    try { target = document.querySelector(id); } catch (e) { target = null; }
    if (!target) return;
    if (wa) preferWhatsApp(true);
    var focusEl = id === '#enquire' ? formFocusTarget() : null;
    if (!initial) {
      scrollToTarget(target, focusEl);
      return;
    }
    var place = function () { if (!visitorMoved) scrollToTarget(target, focusEl, 'instant'); };
    place();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(place, 0); });
    if (document.readyState === 'complete') setTimeout(place, 50);
    else window.addEventListener('load', function () { setTimeout(place, 50); });
  }
  landOnHash(true);
  window.addEventListener('hashchange', function () { landOnHash(false); });

  /* ---------- 4. Scroll reveal (ray2voltsolar.com settings) ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window && !reduceMotion()) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
            scheduleFloatsLate(900); // once more when the block has finished sliding in
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
      Array.prototype.forEach.call(revealEls, function (el) { revealObserver.observe(el); });
    } else {
      Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('revealed'); });
    }
  }

  /* ---------- 5. Back to top, and floating buttons that step aside ----------
     The round theme toggle (bottom left) and the gold back-to-top button (bottom right) float over the page, as on
     ray2voltsolar.com. When the page comes to rest with one of them on or within 10px of any text, icon or control
     (a heading, a line of copy, a label, a field, a button, an FAQ question...), that one fades out until the page
     moves on, so a floating button never hides a word or a tap target. The theme switch is also in the phone menu. */
  var toTop = document.querySelector('.scroll-to-top');
  if (toTop) {
    var syncToTop = function () { toTop.classList.toggle('visible', window.scrollY > 400); };
    window.addEventListener('scroll', syncToTop, { passive: true });
    syncToTop();
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion() ? 'instant' : 'smooth' });
      var logo = document.querySelector('.logo');
      if (logo) { try { logo.focus({ preventScroll: true }); } catch (e) { logo.focus(); } }
    });
  }

  var FLOAT_GAP = 10; // the clear space a floating button keeps around text and controls
  // Boxes that count as a whole: form fields (their value is not a text node), icons, and the hero's stats strip
  // (a narrow bordered bar right where the toggle sits in the first view on laptops)
  var FLOAT_BOXES = 'input:not([type="hidden"]), select, textarea, button, summary, .btn, svg.home-icon, .home-stats';
  // Never counted: the floating buttons themselves, the fixed header and its menu panel, and hidden helpers
  var FLOAT_SKIP = '.sticky-contact, .scroll-to-top, .header, .sr-only, .hp, .skip-link, .home-sprite, script, style, noscript, template';
  var floatTimer = 0;
  function checkFloats() {
    floatTimer = 0;
    var boxes = [];
    [themeStack, toTop].forEach(function (f) {
      if (!f) return;
      var r = f.getBoundingClientRect();
      if (!r.width) return;
      // A button still sliding into view (back to top: 20px over 0.4s) is measured where it will come to rest
      var fm = /matrix\(([^)]+)\)/.exec(getComputedStyle(f).transform || '');
      var fy = fm ? parseFloat(fm[1].split(',')[5]) || 0 : 0;
      boxes.push({ f: f, l: r.left - FLOAT_GAP, t: r.top - fy - FLOAT_GAP, r: r.right + FLOAT_GAP, b: r.bottom - fy + FLOAT_GAP, hit: false });
    });
    if (!boxes.length) return;
    var bandTop = Math.min.apply(null, boxes.map(function (b) { return b.t; }));
    var bandBottom = Math.max.apply(null, boxes.map(function (b) { return b.b; }));
    var left = boxes.length;
    var meet = function (x) {
      if (x.width < 1 || x.height < 1) return;
      for (var k = 0; k < boxes.length; k++) {
        var b = boxes[k];
        if (!b.hit && x.left < b.r && x.right > b.l && x.top < b.b && x.bottom > b.t) { b.hit = true; left--; }
      }
    };
    var inBand = function (x, dy) { return x.width > 0 && x.bottom - dy >= bandTop && x.top - dy <= bandBottom; };
    // A block that is still sliding in (scroll reveal, 40px) is measured where it will come to rest
    var shifts = new Map();
    var shiftOf = function (el) {
      var rv = el.closest('.reveal');
      if (!rv) return 0;
      if (!shifts.has(rv)) {
        var m = /matrix\(([^)]+)\)/.exec(getComputedStyle(rv).transform || '');
        shifts.set(rv, m ? parseFloat(m[1].split(',')[5]) || 0 : 0);
      }
      return shifts.get(rv);
    };
    var meetAt = function (x, dy) {
      meet(dy ? { left: x.left, right: x.right, top: x.top - dy, bottom: x.bottom - dy, width: x.width, height: x.height } : x);
    };

    var els = document.querySelectorAll(FLOAT_BOXES);
    for (var i = 0; i < els.length && left; i++) {
      var g = els[i].getBoundingClientRect();
      if (!g.width || els[i].closest(FLOAT_SKIP)) continue;
      var dy0 = shiftOf(els[i]);
      if (inBand(g, dy0)) meetAt(g, dy0);
    }
    // Text, line by line (a short centred line leaves the corners free; a full-width paragraph box would not)
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var range = document.createRange();
    var lastParent = null, parentIn = false, dy = 0;
    for (var t = walker.nextNode(); t && left; t = walker.nextNode()) {
      if (!/\S/.test(t.nodeValue)) continue;
      var p = t.parentElement;
      if (!p) continue;
      if (p !== lastParent) {
        lastParent = p;
        var pr = p.getBoundingClientRect();
        parentIn = !!pr.width && !p.closest(FLOAT_SKIP);
        dy = parentIn ? shiftOf(p) : 0;
        parentIn = parentIn && inBand(pr, dy);
      }
      if (!parentIn) continue;
      range.selectNodeContents(t);
      var lines = range.getClientRects();
      for (var j = 0; j < lines.length; j++) meetAt(lines[j], dy);
    }
    boxes.forEach(function (b) { b.f.classList.toggle('is-covering', b.hit); });
  }
  var lateTimer = 0;
  function scheduleFloatsLate(ms) {
    if (lateTimer) clearTimeout(lateTimer);
    lateTimer = setTimeout(function () { lateTimer = 0; checkFloats(); }, ms);
  }
  function scheduleFloats(ms) {
    if (floatTimer) clearTimeout(floatTimer);
    floatTimer = setTimeout(checkFloats, ms || 120);
  }
  window.addEventListener('scroll', function () { scheduleFloats(120); }, { passive: true });
  window.addEventListener('resize', function () { scheduleFloats(120); });
  window.addEventListener('load', function () { scheduleFloats(100); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { scheduleFloats(60); });
  scheduleFloats(100);

  /* ---------- 6. Hero loop and the motion pause ----------
     The poster image always shows first. The video only gets its src after the page's load event (so it never
     competes with the first paint), only once at least 30% of the frame is on screen (phones show it below the
     stats, so most phone visits never download it), and only without prefers-reduced-motion, Save-Data or a 2G/3G
     connection. It plays while on screen, pauses off screen, and fades in once frames are actually playing.
     The small round button on the frame pauses the loop and every other repeating animation on the page. */
  var heroVideo = document.querySelector('.home-hero__video[data-src]');
  var motionButton = document.querySelector('.hero-motion');
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var motionPaused = false;
  var tryPlay = function () {};

  if (heroVideo) {
    var conn = navigator.connection;
    var lowData = !!(conn && (conn.saveData || /(^|-)[23]g$/.test(conn.effectiveType || '')));
    var heroRatio = 'IntersectionObserver' in window ? 0 : 1;
    var heroOnScreen = !('IntersectionObserver' in window);

    tryPlay = function () {
      if (!heroVideo.src || !heroOnScreen || motionPaused || (motionQuery && motionQuery.matches)) return;
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stays */ });
    };
    var stop = function () {
      heroVideo.pause();
      heroVideo.classList.remove('is-playing');
    };
    // LCP guard: the loop's first frame must never become a new, later Largest Contentful Paint. Start it only when
    // its visible area is smaller than the largest paint so far (normally the poster), or after the first real
    // input, when browsers stop measuring LCP. Browsers without LCP have nothing to guard.
    var lcpSize = 0, lcpOn = false, interacted = false;
    try {
      if (PerformanceObserver.supportedEntryTypes.indexOf('largest-contentful-paint') >= 0) {
        new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (e) { if (e.size > lcpSize) lcpSize = e.size; });
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        lcpOn = true;
      }
    } catch (e) { lcpOn = false; }
    var visibleArea = function () {
      var r = heroVideo.getBoundingClientRect();
      var w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
      var h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      return w > 0 && h > 0 ? w * h : 0;
    };
    var start = function () {
      if (heroVideo.src || lowData || (motionQuery && motionQuery.matches)) return;
      if (document.readyState !== 'complete' || heroRatio < 0.3) return; // after load, and only once in view
      if (lcpOn && !interacted && visibleArea() >= lcpSize) return; // waits for the first input
      heroVideo.muted = true;
      heroVideo.src = heroVideo.getAttribute('data-src');
      tryPlay();
    };
    var onInput = function () {
      if (interacted) return;
      interacted = true;
      start();
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (type) {
      window.addEventListener(type, onInput, { capture: true, passive: true });
    });
    // After load, give the poster's paint (and its LCP entry) a moment to land before deciding
    var afterLoad = function () { setTimeout(start, 400); };

    heroVideo.addEventListener('playing', function () { heroVideo.classList.add('is-playing'); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var entry = entries[entries.length - 1];
        heroRatio = entry.intersectionRatio;
        heroOnScreen = entry.isIntersecting;
        if (heroRatio >= 0.3) start();
        if (heroOnScreen) tryPlay(); else if (heroVideo.src) heroVideo.pause();
      }, { threshold: [0, 0.3, 0.6, 1] }).observe(heroVideo);
    }
    if (motionQuery) {
      var onMotion = function () { if (motionQuery.matches) stop(); else if (heroVideo.src) tryPlay(); else start(); };
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotion);
      else if (motionQuery.addListener) motionQuery.addListener(onMotion);
    }
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad);
  }

  if (motionButton) {
    var syncMotionButton = function () {
      motionButton.hidden = !!(motionQuery && motionQuery.matches); // nothing moves with reduced motion
    };
    motionButton.addEventListener('click', function () {
      motionPaused = !motionPaused;
      root.classList.toggle('motion-paused', motionPaused);
      motionButton.setAttribute('aria-pressed', String(motionPaused));
      if (heroVideo) { if (motionPaused) heroVideo.pause(); else tryPlay(); }
    });
    syncMotionButton();
    if (motionQuery) {
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', syncMotionButton);
      else if (motionQuery.addListener) motionQuery.addListener(syncMotionButton);
    }
  }

  /* ---------- 7. Enquiry form ----------
     One form, two send actions, the same checks for both. The layout is decided once, when the page opens:
     - With a real Web3Forms key: "Send enquiry" (gold) posts the lead to Web3Forms, which emails
       3d@ray2voltsolar.com. "Send on WhatsApp" first posts the same lead (subject marked WhatsApp, fetch keepalive
       so it survives the page handing over to WhatsApp), then opens WhatsApp with every field in the message.
     - While the key is still the placeholder: "Send on WhatsApp" is the gold first button and posts nothing; the
       other button becomes "Send by email" and opens the visitor's own email app with the same details. No request
       goes to Web3Forms, and the page never says that anything is broken. */
  var form = document.getElementById('enquiry-form');
  var statusBox = document.getElementById('form-status');
  var successBox = document.getElementById('form-success');
  var proposal = document.getElementById('proposal');
  if (!form || !statusBox || !formActions) {
    window.R2V_READY = true;
    return;
  }
  form.setAttribute('novalidate', '');

  var ENDPOINT = form.getAttribute('data-endpoint') || DEFAULT_ENDPOINT;
  var MIN_FILL_MS = 2500; // from the first touch of the form, not from page load
  var emailButton = form.querySelector('[data-action="email"]');
  var waButton = form.querySelector('[data-action="whatsapp"]');
  var layoutSelect = form.elements.layout;
  var layoutHint = document.getElementById('h-layout');

  // Campaign tags from the landing URL travel with the lead (never shown on the page)
  var campaign = {};
  try {
    var params = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) {
      var v = params.get(k);
      if (v) campaign[k] = v.slice(0, 200);
    });
  } catch (e) { campaign = {}; }

  function field(name) { return form.elements[name]; }
  function value(name) { var f = field(name); return f && typeof f.value === 'string' ? f.value.trim() : ''; }
  function checkedValue(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }
  function keyIsSet() {
    var k = value('access_key');
    return !!k && !KEY_NOT_SET.test(k);
  }

  // Placeholder key: WhatsApp first and gold, email as the quiet second choice
  var waFirst = !keyIsSet();
  if (waFirst && emailButton && waButton) {
    formActions.insertBefore(waButton, emailButton);
    waButton.classList.remove('home-btn-ghost');
    waButton.classList.add('btn-primary');
    emailButton.classList.remove('btn-primary');
    emailButton.classList.add('home-btn-ghost');
    emailButton.innerHTML = '<svg class="home-icon home-icon--sm" aria-hidden="true"><use href="#i-mail"/></svg>Send by email';
    formActions.classList.add('wa-first');
    if (proposal) proposal.classList.add('is-wa-first');
    if (waHint) waHint.hidden = false;
  }

  // Pasted text: full-width digits become plain ones (NFKC), and the invisible direction and zero-width marks that
  // phone contacts and WhatsApp profiles add around numbers are dropped
  function plain(v) {
    var s = String(v || '');
    if (s.normalize) s = s.normalize('NFKC');
    return s.replace(/[​-‏‪-‮⁠-⁤﻿]/g, '');
  }

  // Indian mobile numbers: 10 digits starting 6-9, with or without +91 (also "+91 0…"), 91 or a leading 0.
  // Returns "+91 98765 43210".
  function normalisePhone(v) {
    var s = plain(v).replace(/[\s\-‐-―().]/g, '');
    if (/^\+/.test(s)) {
      if (!/^\+91/.test(s)) return '';
      s = s.slice(3);
      if (/^0\d{10}$/.test(s)) s = s.slice(1);
    } else if (/^0091/.test(s)) {
      s = s.slice(4);
    } else if (/^91\d{10}$/.test(s)) {
      s = s.slice(2);
    } else if (/^0\d{10}$/.test(s)) {
      s = s.slice(1);
    }
    if (!/^[6-9]\d{9}$/.test(s)) return '';
    return '+91 ' + s.slice(0, 5) + ' ' + s.slice(5);
  }

  // kWp as a number. Commas only as thousands separators (1,500 or the Indian 1,50,000); a decimal comma such as
  // "150,5" is refused rather than read as 1505.
  function parseKwp(v) {
    var s = plain(v).replace(/\s*kwp?\s*$/i, '').trim();
    if (/,/.test(s)) {
      if (!/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s) && !/^\d{1,2}(,\d{2})*,\d{3}(\.\d+)?$/.test(s)) return 0;
      s = s.replace(/,/g, '');
    }
    if (!/^\d+(\.\d+)?$/.test(s)) return 0;
    var n = parseFloat(s);
    return n > 0 && n <= 1000000 ? n : 0;
  }

  var rules = {
    name: function (v) { return v.length >= 2 ? '' : 'Please enter your name.'; },
    whatsapp: function (v) {
      if (!v) return 'Please enter your WhatsApp number.';
      return normalisePhone(v) ? '' : 'Please enter a 10-digit Indian mobile number, with or without +91.';
    },
    company: function (v) { return v.length >= 2 ? '' : 'Please enter your company or EPC name.'; },
    project_city: function (v) { return v.length >= 2 ? '' : 'Please enter the city of the project site.'; },
    project_size_kwp: function (v) {
      if (!v) return 'Please enter the project size in kWp.';
      return parseKwp(v) ? '' : 'Please enter the size in kWp as a number, for example 150.';
    }
  };
  var ORDER = ['name', 'whatsapp', 'company', 'project_city', 'project_size_kwp'];

  function setError(name, msg) {
    var f = field(name);
    if (!f) return;
    var err = document.getElementById(f.getAttribute('aria-describedby'));
    if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    if (err) {
      err.textContent = msg;
      err.hidden = !msg;
    }
  }

  function validate() {
    var first = null;
    ORDER.forEach(function (name) {
      var msg = rules[name](value(name));
      setError(name, msg);
      if (msg && !first) first = field(name);
    });
    return first;
  }

  // The first field with an error gets the focus, with its label in view: the browser alone does not scroll a field
  // that sits just under the fixed header, or one whose label is under it
  function focusField(f) {
    var group = (f.closest && f.closest('.form-group, fieldset')) || f;
    var g = group.getBoundingClientRect();
    var r = f.getBoundingClientRect();
    var top = headerOffset();
    if (g.top < top || r.bottom > window.innerHeight - 96) {
      window.scrollTo({ top: Math.max(0, g.top + window.pageYOffset - top), behavior: reduceMotion() ? 'instant' : 'smooth' });
    }
    try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
  }

  ORDER.forEach(function (name) {
    var f = field(name);
    if (!f) return;
    f.addEventListener('blur', function () { if (f.value.trim()) setError(name, rules[name](value(name))); });
    f.addEventListener('input', function () {
      if (f.getAttribute('aria-invalid') === 'true' && !rules[name](value(name))) setError(name, '');
    });
  });

  if (layoutSelect && layoutHint) {
    layoutSelect.addEventListener('change', function () {
      layoutHint.hidden = layoutSelect.value !== 'No layout yet';
    });
  }

  // The lead, in the order a person reads it
  function lead() {
    var kwp = parseKwp(value('project_size_kwp'));
    return [
      ['Name', value('name')],
      ['WhatsApp', normalisePhone(value('whatsapp')) || value('whatsapp')],
      ['Company', value('company')],
      ['Project city', value('project_city')],
      ['Project size', kwp ? kwp + ' kWp' : value('project_size_kwp')],
      ['Project type', checkedValue('project_type')],
      ['Layout I have', value('layout')],
      ['Message', value('message')]
    ];
  }

  var SIGN_OFF = '(Sent from the Ray2Volt 3D enquiry form)';
  function detailsText() {
    var lines = [];
    lead().forEach(function (row) { if (row[1]) lines.push(row[0] + ': ' + row[1]); });
    return lines.join('\n');
  }
  function whatsappText() {
    return 'Hi Ray2Volt 3D, I would like a quote for a 3D plant viewer.\n\n' + detailsText() + '\n\n' + SIGN_OFF;
  }
  function emailBody() {
    return 'Hi Ray2Volt 3D,\n\nI would like a quote for a 3D plant viewer.\n\n' + detailsText() + '\n';
  }

  function followUpText() {
    var who = [value('company'), parseKwp(value('project_size_kwp')) ? parseKwp(value('project_size_kwp')) + ' kWp' : '']
      .filter(Boolean).join(', ');
    return 'Hi Ray2Volt 3D, I just sent an enquiry on your website' + (who ? ' (' + who + ')' : '') +
      '. Here are my layout and site photos.';
  }

  function payload(via) {
    var data = new URLSearchParams();
    data.append('access_key', value('access_key'));
    data.append('subject', via === 'whatsapp'
      ? 'New Ray2Volt 3D enquiry (WhatsApp): ' + value('company')
      : 'New Ray2Volt 3D enquiry: ' + value('company'));
    data.append('from_name', value('from_name') || 'Ray2Volt 3D website');
    data.append('sent_via', via === 'whatsapp' ? 'WhatsApp (the visitor was sent to WhatsApp with these details)' : 'Website form');
    data.append('name', value('name'));
    data.append('whatsapp', normalisePhone(value('whatsapp')) || value('whatsapp'));
    data.append('company', value('company'));
    data.append('project_city', value('project_city'));
    data.append('project_size_kwp', String(parseKwp(value('project_size_kwp')) || value('project_size_kwp')));
    data.append('project_type', checkedValue('project_type'));
    data.append('layout', value('layout'));
    data.append('message', value('message'));
    data.append('page', window.location.origin + window.location.pathname);
    Object.keys(campaign).forEach(function (k) { data.append(k, campaign[k]); });
    return data;
  }

  // Spam guards: a ticked honeypot never sends. A send faster than MIN_FILL_MS after the first touch of the form
  // (or with no touch at all) is held once with a neutral "check your details" note; the next press goes through.
  var firstTouch = 0;
  var markTouch = function () { if (!firstTouch) firstTouch = Date.now(); };
  form.addEventListener('focusin', markTouch);
  form.addEventListener('input', markTouch);
  form.addEventListener('change', markTouch);
  var heldOnce = false;
  function honeypotTicked() {
    var bot = field('botcheck');
    return !!(bot && bot.checked);
  }
  function tooFast() {
    return !firstTouch || Date.now() - firstTouch < MIN_FILL_MS;
  }

  /* Status messages (role=status, aria-live=polite: read out without moving focus) */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) { node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return node;
  }
  function mailLink() {
    var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('3D viewer enquiry: ' + value('company')) +
      '&body=' + encodeURIComponent(emailBody());
    return el('a', { href: href }, [EMAIL]);
  }
  // The WhatsApp hint above the buttons ("Fill in the form, then tap Send on WhatsApp…") is for before a send: it
  // hides while a status note says what happened, and comes back when the note is cleared
  function hintWanted() {
    return waFirst || formActions.classList.contains('prefers-wa');
  }
  function clearStatus() {
    statusBox.className = 'form-status';
    statusBox.textContent = '';
    if (waHint) waHint.hidden = !hintWanted();
    scheduleFloats(60);
  }
  function showStatus(kind, nodes) {
    statusBox.className = 'form-status form-status--' + kind;
    statusBox.textContent = '';
    nodes.forEach(function (n) { statusBox.appendChild(n); });
    if (statusBox.scrollIntoView) statusBox.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'instant' : 'smooth' });
    scheduleFloats(700);
  }

  function emailLabel() { return waFirst ? 'Send by email' : 'Send enquiry'; }

  function showCheckAgain() {
    showStatus('note', [
      el('strong', {}, ['Please check your details']),
      document.createTextNode('Then press ' + emailLabel() + ' again.')
    ]);
  }

  function showMailOpened() {
    if (waHint) waHint.hidden = true;
    showStatus('note', [
      el('strong', {}, ['Your email app should open with your details']),
      document.createTextNode('Press send there to reach us. If it did not open, write to '),
      mailLink(),
      document.createTextNode(', or tap Send on WhatsApp: your details go into the message.')
    ]);
  }

  // One next step only: the note, then the Send on WhatsApp button right below it for a second try
  function showWhatsAppOpened() {
    if (waHint) waHint.hidden = true;
    showStatus('ok', [
      el('strong', {}, ['WhatsApp is opening with your details']),
      document.createTextNode('Press send in WhatsApp to reach us, then add your layout and photos in the same chat. ' +
        (waFirst ? 'You don\'t need to send it by email as well.' : 'You don\'t need to press Send enquiry as well.') +
        ' If WhatsApp did not open, tap Send on WhatsApp again.')
    ]);
  }

  // kind 'network': no answer (offline, timeout). kind 'refused': Web3Forms answered but did not take the enquiry
  // (most likely a wrong or expired access key), so asking the visitor to check their connection would mislead.
  function showError(kind) {
    preferWhatsApp();
    if (waHint) waHint.hidden = true; // the note says the same thing
    var refused = kind === 'refused';
    showStatus('error', [
      el('strong', {}, [refused ? 'Sorry, we could not send this right now' : 'Sorry, your enquiry did not go through']),
      document.createTextNode((refused ? 'Tap Send on WhatsApp: your details are already in the message. ' :
        'Please check your connection and try again, or tap Send on WhatsApp: your details are already in the message. ') +
        'You can also email '),
      mailLink(),
      document.createTextNode('.')
    ]);
  }

  function showSuccess() {
    clearStatus();
    form.hidden = true;
    if (proposal) proposal.classList.add('is-sent');
    if (!successBox) return;
    successBox.hidden = false;
    try { successBox.focus({ preventScroll: true }); } catch (e) { successBox.focus(); }
    var card = document.getElementById('form-card') || successBox;
    if (card.scrollIntoView) card.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'instant' : 'smooth' });
    scheduleFloats(700);
  }

  if (successBox) {
    var followUp = successBox.querySelector('[data-wa-followup]');
    if (followUp) followUp.addEventListener('click', function () { openWhatsApp(followUpText()); });
  }

  /* Sending */
  var sending = false;
  var emailInner = emailButton ? emailButton.innerHTML : '';
  function setSending(on) {
    sending = on;
    form.setAttribute('aria-busy', on ? 'true' : 'false');
    [emailButton, waButton].forEach(function (b) { if (b) b.disabled = on; });
    if (emailButton) {
      if (on) emailButton.textContent = 'Sending…';
      else emailButton.innerHTML = emailInner;
    }
  }

  function postLead(via, keepalive) {
    var controller = !keepalive && 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : 0;
    var init = {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload(via)
    };
    if (controller) init.signal = controller.signal;
    if (keepalive) init.keepalive = true;
    // Resolves true when Web3Forms took the lead, false when it answered but refused it (logged for whoever
    // checks the page in DevTools: usually the access key); rejects when there was no answer at all
    return fetch(ENDPOINT, init)
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          var ok = !!(res.ok && data && data.success);
          if (!ok && window.console && console.warn) {
            console.warn('Ray2Volt 3D form: Web3Forms refused the enquiry (HTTP ' + res.status + '): ' +
              ((data && data.message) || 'no message') + '. Check the access_key in index.html.');
          }
          return ok;
        });
      })
      .then(function (ok) { clearTimeout(timer); return ok; }, function (err) { clearTimeout(timer); throw err; });
  }

  // Which button sent the form. A press (pointer, or Enter/Space on the button itself) is remembered for a moment;
  // a submit from the first button without such a press is the browser's implicit submission (Enter or the phone
  // keyboard's Go key in a field), which follows the preselected action instead of always sending by email.
  var pressed = { action: '', at: 0 };
  [emailButton, waButton].forEach(function (b) {
    if (!b) return;
    var mark = function () { pressed = { action: b.getAttribute('data-action'), at: Date.now() }; };
    b.addEventListener('pointerdown', mark);
    b.addEventListener('mousedown', mark);
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') mark(); });
  });
  function preferredAction() {
    return waFirst || formActions.classList.contains('prefers-wa') ? 'whatsapp' : 'email';
  }
  function chooseAction(ev) {
    var submitter = ev.submitter && ev.submitter.getAttribute ? ev.submitter : null;
    var recent = Date.now() - pressed.at < 2000 ? pressed.action : '';
    if (!submitter) return recent || preferredAction();
    var action = submitter.getAttribute('data-action') || 'email';
    var isDefault = submitter === form.querySelector('button[type="submit"]');
    var explicit = recent === action || document.activeElement === submitter;
    return isDefault && !explicit ? preferredAction() : action;
  }

  // WhatsApp: a double press opens it once, and the same lead is emailed only once
  var lastWaOpen = 0;
  var lastWaPost = { text: '', at: 0 };
  function demoteEmail() {
    if (!emailButton || waFirst) return;
    emailButton.classList.remove('btn-primary');
    emailButton.classList.add('home-btn-ghost');
    preferWhatsApp();
    if (waHint) waHint.hidden = true;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;
    var action = chooseAction(ev);

    var firstBad = validate();
    if (firstBad) {
      clearStatus();
      focusField(firstBad);
      return;
    }

    if (action === 'whatsapp') {
      var now = Date.now();
      if (now - lastWaOpen < 2000) return;
      lastWaOpen = now;
      var text = whatsappText();
      if (keyIsSet() && !honeypotTicked() && !(lastWaPost.text === text && now - lastWaPost.at < 10 * 60 * 1000)) {
        lastWaPost = { text: text, at: now };
        try { postLead('whatsapp', true).catch(function () { /* WhatsApp still carries the lead */ }); } catch (e) { /* ditto */ }
      }
      demoteEmail();
      showWhatsAppOpened();
      openWhatsApp(text);
      return;
    }

    // Email, placeholder key: the visitor's own email app, nothing sent from the page
    if (waFirst) {
      openMail('3D viewer enquiry: ' + value('company'), emailBody());
      showMailOpened();
      return;
    }

    // "Send enquiry"
    if (honeypotTicked()) {
      showCheckAgain();
      return;
    }
    if (tooFast() && !heldOnce) {
      heldOnce = true;
      showCheckAgain();
      return;
    }
    clearStatus();
    setSending(true);
    postLead('email', false)
      .then(function (ok) {
        setSending(false);
        if (ok) showSuccess(); else showError('refused');
      }, function () {
        setSending(false);
        showError('network');
      });
  });

  // Coming back from WhatsApp through the back button: the page may be restored as it was, so make sure the
  // buttons work again
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && sending) setSending(false);
  });

  window.R2V_READY = true;
})();
