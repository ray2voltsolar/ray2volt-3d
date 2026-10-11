/* Ray2Volt 3D landing page: floating WhatsApp button, optional hero loop, enquiry form. No dependencies. */
(function () {
  'use strict';

  var WA_NUMBER = '919666068140';
  var EMAIL = '3d@ray2voltsolar.com';
  var DEFAULT_ENDPOINT = 'https://api.web3forms.com/submit';
  // The access key in index.html counts as "not set" while it is empty or still starts with "YOUR_". The full
  // placeholder token is deliberately not written anywhere in this file: a find-and-replace of it across site/ must
  // change only index.html, or the real key would match a copy here and the form would never use Web3Forms.
  var KEY_NOT_SET = /^YOUR_/i;
  var reduceMotion = function () {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  /* ---------- Floating WhatsApp button (phones only; CSS hides it from 768 px, except on short sideways phones) ----------
     Hidden while any other call to action is on screen: the header's WhatsApp button, the hero buttons, the demo
     buttons, the pricing buttons, the FAQ (its full-width rows have their open/close chevron right where the button
     sits), the enquiry section and the footer. So it never doubles up with, or covers, another control. */
  var fab = document.querySelector('.wa-fab');
  if (fab) {
    var watched = [document.querySelector('.nav-wa'), document.querySelector('.hero__actions')]
      .concat(Array.prototype.slice.call(document.querySelectorAll('.demo .btn, .price-card__actions, .faq')))
      .concat([document.getElementById('enquire'), document.querySelector('.footer')])
      .filter(Boolean);
    if ('IntersectionObserver' in window && watched.length) {
      var onScreen = [];
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var i = onScreen.indexOf(e.target);
          if (e.isIntersecting && i < 0) onScreen.push(e.target);
          if (!e.isIntersecting && i >= 0) onScreen.splice(i, 1);
        });
        fab.classList.toggle('is-shown', onScreen.length === 0);
      });
      watched.forEach(function (el) { io.observe(el); });
    } else {
      fab.classList.add('is-shown');
    }
  }

  /* ---------- Hero loop (see the comment in index.html) ----------
     The poster image always shows first. The video only gets its src after the page's load event (so it never
     competes with the first paint), and only without prefers-reduced-motion, Save-Data or a 2G/3G connection.
     It plays while on screen, pauses off screen, and fades in once frames are actually playing. */
  var heroVideo = document.querySelector('.hero__video[data-src]');
  if (heroVideo) {
    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var conn = navigator.connection;
    var lowData = !!(conn && (conn.saveData || /(^|-)[23]g$/.test(conn.effectiveType || '')));
    var heroLabel = document.querySelector('.chip--label[data-label-a]');
    var switchAt = (heroVideo.getAttribute('data-switch') || '').split(',').map(Number);
    var heroOnScreen = true;

    var tryPlay = function () {
      if (!heroVideo.src || !heroOnScreen || (motionQuery && motionQuery.matches)) return;
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stays */ });
    };
    var stop = function () {
      heroVideo.pause();
      heroVideo.classList.remove('is-playing');
      if (heroLabel) heroLabel.textContent = heroLabel.getAttribute('data-label-a');
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
      if (lcpOn && !interacted && visibleArea() >= lcpSize) return; // waits for the first input
      heroVideo.muted = true;
      heroVideo.src = heroVideo.getAttribute('data-src');
      tryPlay();
    };
    var onInput = function () {
      if (interacted) return;
      interacted = true;
      if (document.readyState === 'complete') start();
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (type) {
      window.addEventListener(type, onInput, { capture: true, passive: true });
    });
    // After load, give the poster's paint (and its LCP entry) a moment to land before deciding
    var afterLoad = function () { setTimeout(start, 400); };

    heroVideo.addEventListener('playing', function () { heroVideo.classList.add('is-playing'); });
    if (heroLabel && switchAt.length === 2) {
      heroVideo.addEventListener('timeupdate', function () {
        var t = heroVideo.currentTime;
        var key = t >= switchAt[0] && t < switchAt[1] ? 'data-label-b' : 'data-label-a';
        var text = heroLabel.getAttribute(key);
        if (heroLabel.textContent !== text) heroLabel.textContent = text;
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroOnScreen = entries[entries.length - 1].isIntersecting;
        if (heroOnScreen) tryPlay(); else if (heroVideo.src) heroVideo.pause();
      }, { rootMargin: '100px 0px' }).observe(heroVideo);
    }
    if (motionQuery) {
      var onMotion = function () { if (motionQuery.matches) stop(); else if (heroVideo.src) tryPlay(); else if (document.readyState === 'complete') start(); };
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotion);
      else if (motionQuery.addListener) motionQuery.addListener(onMotion);
    }
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad);
  }

  /* ---------- Enquiry form ----------
     The mode is decided once, at page load, from the access key:
     - "whatsapp" while the key is not set (see KEY_NOT_SET). Nothing is sent to Web3Forms. Only name, company
       and project size are required, the button reads "Send on WhatsApp", and a valid submit opens WhatsApp with the
       details filled in (with an email option alongside). Visitors know this before they type, from the section
       intro and the card's note (both use data-form-mode).
     - "web3forms" once the owner has pasted a real key. All five fields are required, the form is sent with fetch()
       to data-endpoint, and a success shows "Send your layout/photos to 3d@ray2voltsolar.com or on WhatsApp." */
  var form = document.getElementById('enquiry-form');
  var statusBox = document.getElementById('form-status');
  if (!form || !statusBox) return;
  form.setAttribute('novalidate', '');

  var WA_ICON = '<svg class="icon icon--fill" aria-hidden="true"><use href="#i-wa"/></svg>';
  function field(name) { return form.elements[name]; }
  function value(name) { var f = field(name); return f ? String(f.value || '').trim() : ''; }

  var ENDPOINT = form.getAttribute('data-endpoint') || DEFAULT_ENDPOINT;
  var accessKey = value('access_key');
  var waMode = !accessKey || KEY_NOT_SET.test(accessKey);
  var OPTIONAL_IN_WA_MODE = ['phone', 'email'];
  var submitButton = form.querySelector('button[type="submit"]');
  var modeNotes = document.querySelectorAll('[data-form-mode]');
  form.setAttribute('data-mode', waMode ? 'whatsapp' : 'web3forms');

  if (waMode) {
    Array.prototype.forEach.call(modeNotes, function (p) { p.hidden = p.getAttribute('data-form-mode') !== 'whatsapp'; });
    OPTIONAL_IN_WA_MODE.forEach(function (name) {
      var input = field(name);
      if (!input) return;
      input.removeAttribute('required');
      var label = form.querySelector('label[for="' + input.id + '"]');
      var req = label && label.querySelector('.req'), opt = label && label.querySelector('.opt');
      if (req) req.hidden = true;
      if (opt) opt.hidden = false;
    });
    if (submitButton) {
      submitButton.classList.remove('btn-primary');
      submitButton.classList.add('btn-wa');
      submitButton.innerHTML = WA_ICON + 'Send on WhatsApp';
    }
  }

  function isRequired(name) { return !(waMode && OPTIONAL_IN_WA_MODE.indexOf(name) >= 0); }

  var rules = {
    name: function (v) { return v.length >= 2 ? '' : 'Please enter your name.'; },
    company: function (v) { return v.length >= 2 ? '' : 'Please enter your company name.'; },
    phone: function (v) {
      if (!v) return isRequired('phone') ? 'Please enter a phone or WhatsApp number.' : '';
      var digits = v.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 13 && /^[+\d\s\-()]+$/.test(v) ? '' : 'Please enter a 10-digit mobile number, with or without +91.';
    },
    email: function (v) {
      if (!v) return isRequired('email') ? 'Please enter your email address.' : '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address.';
    },
    project_size_kwp: function (v) {
      if (!v) return 'Please enter the project size in kWp.';
      var n = parseFloat(v.replace(/,/g, ''));
      return /^\d[\d,]*(\.\d+)?$/.test(v) && n > 0 ? '' : 'Please enter the size in kWp as a number, for example 150.';
    }
  };

  function setError(name, msg) {
    var f = field(name);
    if (!f) return;
    var err = document.getElementById(f.getAttribute('aria-describedby'));
    if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    if (err) err.textContent = msg;
  }

  function validate() {
    var first = null;
    Object.keys(rules).forEach(function (name) {
      var msg = rules[name](value(name));
      setError(name, msg);
      if (msg && !first) first = field(name);
    });
    return first;
  }

  // Re-check a field once the visitor has left it, and clear its error as they fix it
  Object.keys(rules).forEach(function (name) {
    var f = field(name);
    if (!f) return;
    f.addEventListener('blur', function () { if (f.value) setError(name, rules[name](value(name))); });
    f.addEventListener('input', function () {
      if (f.getAttribute('aria-invalid') === 'true' && !rules[name](value(name))) setError(name, '');
    });
  });

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) { node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return node;
  }

  function clearStatus() {
    statusBox.className = 'form-status';
    statusBox.textContent = '';
  }

  function showStatus(kind, nodes) {
    statusBox.className = 'form-status form-status--' + kind;
    statusBox.textContent = '';
    nodes.forEach(function (n) { statusBox.appendChild(n); });
    statusBox.focus({ preventScroll: true });
    if (statusBox.scrollIntoView) statusBox.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  // The visitor's details as a WhatsApp or email message; the first line follows the site's standard WhatsApp text
  function enquiryText() {
    var kwp = value('project_size_kwp') || '___';
    var loc = value('site_location');
    var lines = ['Hi, I want a 3D viewer for a ' + kwp + ' kW C&I project' + (loc ? ' in ' + loc : '') + '.'];
    var who = [value('name'), value('company')].filter(Boolean).join(', ');
    if (who) lines.push(who);
    if (value('phone')) lines.push('Phone: ' + value('phone'));
    if (value('email')) lines.push('Email: ' + value('email'));
    if (value('message')) lines.push(value('message'));
    return lines.join('\n');
  }

  function waButton(text, label) {
    var a = el('a', { 'class': 'btn btn-wa', href: waLink(text), target: '_blank', rel: 'noopener' });
    a.innerHTML = WA_ICON;
    a.appendChild(document.createTextNode(label));
    return a;
  }

  function mailButton(text, label) {
    return el('a', {
      'class': 'btn btn-ghost',
      href: 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('3D viewer enquiry') + '&body=' + encodeURIComponent(text)
    }, [label || 'Email us']);
  }

  function mailLink() { return el('a', { href: 'mailto:' + EMAIL }, [EMAIL]); }

  // WhatsApp mode: shown after a valid submit has asked the browser to open WhatsApp
  function showWhatsAppNote() {
    showStatus('note', [
      el('span', { 'class': 'form-status__title' }, ['WhatsApp is opening with your details']),
      el('p', {}, ['If it did not open, tap Send on WhatsApp below. Prefer email? Send the same details to ', mailLink(), '. You can add your layout and photos in the same chat or email.']),
      el('div', { 'class': 'form-status__actions' }, [waButton(enquiryText(), 'Send on WhatsApp'), mailButton(enquiryText())])
    ]);
  }

  // The hidden anti-spam box was ticked (by a bot, or by an autofill extension): send nothing, but leave a way through
  function showContactNote() {
    showStatus('note', [
      el('span', { 'class': 'form-status__title' }, ['Please message us directly']),
      el('p', {}, ['This form could not be sent. Please message us on WhatsApp at +91 96660 68140, or email ', mailLink(), '. Your project details are ready in the message.']),
      el('div', { 'class': 'form-status__actions' }, [waButton(enquiryText(), 'Send on WhatsApp'), mailButton(enquiryText())])
    ]);
  }

  // After a real send: the required sentence, then the next step (sending the inputs) as full-size buttons
  function showSuccess() {
    form.hidden = true;
    // The card's own note goes with the form; the section intro stays
    Array.prototype.forEach.call(form.parentNode.querySelectorAll('.form-card__head [data-form-mode]'), function (p) { p.hidden = true; });
    var next = 'Hi, I sent an enquiry on the Ray2Volt 3D website. Here are my layout and site photos.';
    var wa = el('a', { href: waLink(next), target: '_blank', rel: 'noopener' }, ['WhatsApp']);
    showStatus('ok', [
      el('span', { 'class': 'form-status__title' }, ['Thank you. We have your enquiry.']),
      el('p', {}, ['Send your layout/photos to ', mailLink(), ' or on ', wa, '.']),
      el('div', { 'class': 'form-status__actions' }, [waButton(next, 'Send on WhatsApp'), mailButton(next, 'Send by email')])
    ]);
  }

  function showError() {
    showStatus('error', [
      el('span', { 'class': 'form-status__title' }, ['Sorry, your enquiry did not go through']),
      el('p', {}, ['Please try again, or message us on WhatsApp at +91 96660 68140, or email ', mailLink(), '.']),
      el('div', { 'class': 'form-status__actions' }, [waButton(enquiryText(), 'Send on WhatsApp')])
    ]);
  }

  var sending = false;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;

    var firstBad = validate();
    if (firstBad) {
      clearStatus();
      firstBad.focus();
      return;
    }
    if (form.elements.botcheck && form.elements.botcheck.checked) { showContactNote(); return; }

    if (waMode) {
      // The access key is still the placeholder: nothing goes to Web3Forms. Open WhatsApp with the details instead.
      try { window.open(waLink(enquiryText()), '_blank', 'noopener'); } catch (e) { /* the note below has the link */ }
      showWhatsAppNote();
      return;
    }

    clearStatus(); // an earlier error must not stay up next to "Sending…"
    var label = submitButton.innerHTML;
    sending = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';

    var payload = {};
    Array.prototype.forEach.call(form.elements, function (f) {
      if (!f.name || f.type === 'submit' || f.name === 'botcheck') return;
      payload[f.name] = String(f.value || '').trim();
    });

    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 20000) : 0;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (r) {
        if (r.ok && r.data && r.data.success) showSuccess(); else showError();
      })
      .catch(showError)
      .then(function () {
        clearTimeout(timer);
        sending = false;
        submitButton.disabled = false;
        submitButton.innerHTML = label;
      });
  });
})();
