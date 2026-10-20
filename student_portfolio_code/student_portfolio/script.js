/* =========================================================
   script.js  –  Kaira Allere portfolio
   1. Core behaviour (menu, active nav, project details, year)
   2. Motion & interaction effects
   3. Boot screen, typing line, counters, timeline fill,
      magnetic buttons, card tilt, click sparks, copy buttons
   4. Heading "decode" effect + floating code symbols parallax
   5. Swipeable projects carousel (at the very bottom)
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  /* =======================================================
     1. CORE BEHAVIOUR
     ======================================================= */

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  var menuToggle = document.getElementById('menu-toggle');
  var navLinks = document.getElementById('nav-links');

  function setMenu(open) {
    if (!menuToggle || !navLinks) return;
    navLinks.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      setMenu(!navLinks.classList.contains('open'));
    });
    $$('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- Project details (only one open at a time) ---------- */
  var detailButtons = $$('.project-details');

  function setDetails(btn, open) {
    var panel = document.getElementById('details-' + btn.getAttribute('data-project'));
    btn.setAttribute('aria-expanded', String(open));
    btn.innerHTML = open ? 'Hide details <span>✓</span>' : 'Project details <span>↗</span>';
    if (panel) panel.hidden = !open;
    var card = btn.closest('.project-card');
    if (card && open) card.style.transform = ''; /* stop any tilt while open */
  }

  detailButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      detailButtons.forEach(function (other) { if (other !== btn) setDetails(other, false); });
      setDetails(btn, willOpen);
    });
  });

  /* ---------- Nav highlight + header shadow + scroll progress ---------- */
  var navAnchors = $$('.nav-link');
  var sections = navAnchors.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  var header = $('.site-header');

  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '&uarr;';
  toTop.addEventListener('click', function (e) {
    burst(e.clientX, e.clientY);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  document.body.appendChild(toTop);

  var eduList = $('.education-list');
  var eduCards = $$('.education-card');

  function updateTimeline() {
    if (!eduList) return;
    var r = eduList.getBoundingClientRect();
    var mid = window.innerHeight * 0.6;
    var fill = (mid - r.top - 46) / Math.max(1, r.height - 73);
    fill = Math.min(1, Math.max(0, fill));
    eduList.style.setProperty('--fill', fill.toFixed(3));
    eduCards.forEach(function (card) {
      var c = card.getBoundingClientRect();
      card.classList.toggle('reached', c.top + 40 < mid);
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
      toTop.classList.toggle('is-visible', window.scrollY > 700);
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);

      /* active nav link */
      var current = 0;
      sections.forEach(function (sec, i) {
        if (sec && sec.getBoundingClientRect().top <= 140) current = i;
      });
      navAnchors.forEach(function (a, i) { a.classList.toggle('active', i === current); });

      updateTimeline();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* =======================================================
     2. BOOT SCREEN (preloader) + page-ready flag
     ======================================================= */
  var typedStarted = false;

  function pageReady() {
    root.classList.add('ready');
    startTyping();
    animateCounters();
  }

  var pre = document.getElementById('preloader');
  if (pre) {
    if (reduceMotion) {
      pre.remove();
      pageReady();
    } else {
      var pct = $('.preloader-pct', pre);
      var fillBar = $('.preloader-bar span', pre);
      var t0 = performance.now();
      var DURATION = 1700;
      (function tick(now) {
        var t = Math.min(1, ((now || performance.now()) - t0) / DURATION);
        var e = 1 - Math.pow(1 - t, 3);
        if (pct) pct.textContent = Math.round(e * 100) + '%';
        if (fillBar) fillBar.style.transform = 'scaleX(' + e + ')';
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          pre.classList.add('is-done');
          pageReady();
          setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 800);
        }
      })(t0);
    }
  } else {
    pageReady();
  }

  /* =======================================================
     3. TYPING LINE IN THE HERO
     ======================================================= */
  function startTyping() {
    if (typedStarted) return;
    typedStarted = true;
    var el = $('.typed-text');
    if (!el || reduceMotion) return;
    var words = (el.getAttribute('data-words') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!words.length) return;

    var wi = 0, ci = 0, deleting = false;
    el.textContent = '';
    (function loop() {
      var word = words[wi];
      if (!deleting) {
        ci++;
        el.textContent = word.slice(0, ci);
        if (ci === word.length) { deleting = true; return setTimeout(loop, 1600); }
        return setTimeout(loop, 85);
      }
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; return setTimeout(loop, 350); }
      setTimeout(loop, 45);
    })();
  }

  /* =======================================================
     4. COUNT-UP NUMBERS
     ======================================================= */
  function animateCounters() {
    var nums = $$('.stat-num');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var start = performance.now(), dur = 1400;
      (function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * e) + suffix;
        if (t < 1) requestAnimationFrame(step);
      })(start);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* =======================================================
     5. SCROLL REVEAL (fade + slide up, staggered)
     ======================================================= */
  var revealSelector = [
    '.section-heading', '.about-side', '.about-content', '.skill-group',
    '.experience-card', '.project-card', '.education-card',
    '.learning-note', '.contact-card', '.marquee', '.stat'
  ].join(',');

  var revealEls = $$(revealSelector);

  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealEls.forEach(function (el) {
      var siblings = el.parentElement ? Array.prototype.filter.call(
        el.parentElement.children,
        function (c) { return c.classList.contains(el.classList[0]); }
      ) : [el];
      var index = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--d', Math.min(index, 5) * 90 + 'ms');
      el.classList.add('reveal');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        /* after the animation, remove the helper classes so the element's own
           hover effects and transitions work normally again */
        setTimeout(function () {
          el.classList.remove('reveal', 'is-visible');
          el.style.removeProperty('--d');
        }, 1300);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* =======================================================
     6. SPOTLIGHT GLOW INSIDE CARDS
     ======================================================= */
  $$('.project-card, .skill-group, .experience-card, .education-card').forEach(function (card) {
    card.classList.add('glow-card');
    var layer = document.createElement('span');
    layer.className = 'glow-layer';
    layer.setAttribute('aria-hidden', 'true');
    card.insertBefore(layer, card.firstChild);

    if (!finePointer) return;
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* =======================================================
     7. CLICK SPARKS
     ======================================================= */
  function burst(x, y) {
    if (reduceMotion || !document.body.animate) return;
    var n = 10;
    for (var i = 0; i < n; i++) {
      var dot = document.createElement('span');
      dot.className = 'burst-dot';
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      if (i % 3 === 1) dot.style.background = '#62a5ff';
      if (i % 3 === 2) dot.style.background = '#9c8cff';
      document.body.appendChild(dot);

      var angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      var dist = 34 + Math.random() * 34;
      var anim = dot.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + Math.cos(angle) * dist + 'px,' + Math.sin(angle) * dist + 'px) scale(0)', opacity: 0 }
      ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.7,.2,1)' });
      anim.onfinish = (function (d) { return function () { d.remove(); }; })(dot);
    }
  }

  $$('.skill-item, .project-details, .button, .tech-chip').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (e.clientX || e.clientY) burst(e.clientX, e.clientY);
    });
  });

  /* =======================================================
     8. COPY BUTTONS + TOAST
        Each .copy-btn uses data-copy (the text to copy) and
        data-label (the name shown in the message, e.g. "Email"
        or "Phone number").
     ======================================================= */
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  var toastTimer;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2200);
  }

  $$('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var text = btn.getAttribute('data-copy') || '';
      var label = btn.getAttribute('data-label') || 'Text';
      function done() { showToast(label + ' copied to clipboard'); burst(e.clientX, e.clientY); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { showToast('Press Ctrl+C to copy: ' + text); }
        document.body.removeChild(ta);
      }
    });
  });

  /* =======================================================
     9. MOUSE-ONLY EFFECTS (skipped on touch / reduced motion)
     ======================================================= */
  function pointerEffects() {

    /* ---------- cursor spotlight ---------- */
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    var gx = 0, gy = 0, tx = 0, ty = 0, glowRaf = null;
    function glowLoop() {
      gx += (tx - gx) * 0.14;
      gy += (ty - gy) * 0.14;
      glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
      glowRaf = (Math.abs(tx - gx) > 0.3 || Math.abs(ty - gy) > 0.3)
        ? requestAnimationFrame(glowLoop) : null;
    }
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      glow.classList.add('is-active');
      if (!glowRaf) glowRaf = requestAnimationFrame(glowLoop);
    }, { passive: true });
    document.addEventListener('mouseleave', function () {
      glow.classList.remove('is-active');
    });

    /* ---------- 3D tilt on the profile card + parallax tags ---------- */
    var visual = $('.hero-visual');
    var card = $('.profile-card');
    var tags = $$('.floating-tag');

    if (visual && card) {
      visual.addEventListener('mousemove', function (e) {
        var r = visual.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(900px) rotateY(' + (px * 16).toFixed(2) + 'deg) rotateX(' + (-py * 16).toFixed(2) + 'deg) scale(1.02)';
        tags.forEach(function (t, i) {
          var dir = i % 2 === 0 ? 1 : -1;
          t.style.translate = (px * 26 * dir).toFixed(1) + 'px ' + (py * 26 * dir).toFixed(1) + 'px';
        });
      });
      visual.addEventListener('mouseleave', function () {
        card.style.transform = '';
        tags.forEach(function (t) { t.style.translate = ''; });
      });
    }

    /* ---------- hero glows drift with the mouse ---------- */
    var heroEl = $('.hero');
    var glows = $$('.hero-glow');
    if (heroEl && glows.length) {
      heroEl.addEventListener('mousemove', function (e) {
        var r = heroEl.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        glows.forEach(function (g, i) {
          var dir = i % 2 === 0 ? -1 : 1;
          g.style.translate = (px * 70 * dir).toFixed(1) + 'px ' + (py * 50 * dir).toFixed(1) + 'px';
        });
      });
    }

    /* ---------- project cards tilt toward the cursor ---------- */
    $$('.project-card').forEach(function (pc) {
      pc.addEventListener('mousemove', function (e) {
        if ($('.project-details[aria-expanded="true"]', pc)) return;
        var r = pc.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        pc.style.transform =
          'perspective(1000px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) translateY(-8px)';
      });
      pc.addEventListener('mouseleave', function () { pc.style.transform = ''; });
    });

    /* ---------- magnetic buttons ---------- */
    $$('.button').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.translate = (dx * 0.22).toFixed(1) + 'px ' + (dy * 0.3).toFixed(1) + 'px';
      });
      btn.addEventListener('mouseleave', function () { btn.style.translate = ''; });
    });
  }

  if (finePointer && !reduceMotion) pointerEffects();

  /* =======================================================
     10. HERO BACKGROUND: connected-dots network
     ======================================================= */
  var hero = $('.hero');
  if (hero && !reduceMotion) {
    var canvas = document.createElement('canvas');
    canvas.className = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, nodes = [], mouse = { x: -9999, y: -9999 };
    var running = false, raf = null;
    var LINK = 135;

    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(75, Math.max(26, (w * h) / 15000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.5 + 0.8
        });
      }
    };

    var frame = function () {
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        /* nodes gently shy away from the cursor */
        dx = a.x - mouse.x;
        dy = a.y - mouse.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0 && d < 110) {
          a.x += (dx / d) * 0.7;
          a.y += (dy / d) * 0.7;
        }
      }

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x;
          dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = 'rgba(98,165,255,' + ((1 - d / LINK) * 0.32).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        /* lines from the cursor to nearby nodes */
        dx = a.x - mouse.x;
        dy = a.y - mouse.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < 170) {
          ctx.strokeStyle = 'rgba(101,226,242,' + ((1 - d / 170) * 0.5).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(101,226,242,.75)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = running ? requestAnimationFrame(frame) : null;
    };

    var start = function () { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
    var stop = function () { running = false; if (raf) cancelAnimationFrame(raf); raf = null; };

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    resize();

    /* only animate while the hero is on screen (saves battery) */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { start(); } else { stop(); }
      }).observe(hero);
    } else {
      start();
    }
  }

  /* =======================================================
     11. HEADING "DECODE" EFFECT
         Section headings unscramble from random code
         characters when they scroll into view.
     ======================================================= */
  var DECODE_CHARS = '01<>/{}[]#$%&*+=?';

  function decodeText(node) {
    var textNodes = [], walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    var originals = textNodes.map(function (n) { return n.nodeValue; });
    var total = originals.join('').length, frame = 0, FRAMES = 24;

    var timer = setInterval(function () {
      frame++;
      var reveal = Math.floor(total * frame / FRAMES), seen = 0;
      textNodes.forEach(function (n, i) {
        var s = originals[i], out = '';
        for (var k = 0; k < s.length; k++) {
          var c = s.charAt(k);
          out += (/\s/.test(c) || seen < reveal)
            ? c : DECODE_CHARS.charAt((Math.random() * DECODE_CHARS.length) | 0);
          seen++;
        }
        n.nodeValue = out;
      });
      if (frame >= FRAMES) {
        clearInterval(timer);
        textNodes.forEach(function (n, i) { n.nodeValue = originals[i]; });
      }
    }, 38);
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var decodeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { decodeText(en.target); decodeIO.unobserve(en.target); }
      });
    }, { threshold: 0.7 });
    $$('.section-heading h2').forEach(function (h) { decodeIO.observe(h); });
  }

  /* =======================================================
     12. FLOATING CODE SYMBOLS PARALLAX
         The symbols behind each section drift slowly as you scroll.
     ======================================================= */
  var decoLayers = $$('.section-deco');
  var decoTick = false;

  function updateDeco() {
    decoLayers.forEach(function (layer) {
      var r = layer.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var offset = (r.top + r.height / 2 - window.innerHeight / 2) * -0.09;
      Array.prototype.forEach.call(layer.children, function (s, i) {
        s.style.translate = '0 ' + (offset * (0.6 + (i % 3) * 0.4)).toFixed(1) + 'px';
      });
    });
    decoTick = false;
  }

  if (!reduceMotion && decoLayers.length) {
    window.addEventListener('scroll', function () {
      if (decoTick) return;
      decoTick = true;
      requestAnimationFrame(updateDeco);
    }, { passive: true });
    updateDeco();
  }

  /* =======================================================
     13. MORE STUNNING EXTRAS
     ======================================================= */

  /* ---------- 13a. Second tech ticker running the other way ---------- */
  var firstMarquee = $('.marquee');
  if (firstMarquee) {
    var mqClone = firstMarquee.cloneNode(true);
    mqClone.classList.remove('reveal', 'is-visible');
    mqClone.style.removeProperty('--d');
    mqClone.classList.add('marquee-reverse');
    mqClone.setAttribute('aria-hidden', 'true');
    $$('.marquee-group', mqClone).forEach(function (g) {
      Array.prototype.slice.call(g.children).reverse().forEach(function (chip) { g.appendChild(chip); });
    });
    firstMarquee.parentNode.insertBefore(mqClone, firstMarquee.nextSibling);
  }

  /* ---------- 13b. Hero: floating code editor window ---------- */
  var heroVisual = $('.hero-visual');
  if (heroVisual) {
    var cw = document.createElement('div');
    cw.className = 'code-window';
    cw.setAttribute('aria-hidden', 'true');
    cw.innerHTML = '<div class="cw-bar"><i></i><i></i><i></i><b>kaira.js</b></div><pre class="cw-body"></pre>';
    heroVisual.appendChild(cw);

    var cwBody = $('.cw-body', cw);
    var CW_LINES = [
      '<em class="k">const</em> dev = {',
      '  name: <em class="s">"Kaira"</em>,',
      '  role: <em class="s">"IT Student"</em>,',
      '  learning: <em class="k">true</em>,',
      '};',
      'dev.<em class="f">build</em>(<em class="s">"something cool"</em>);'
    ];

    var playCode = function () {
      cwBody.innerHTML = CW_LINES.map(function (l, i) {
        return '<span class="cw-line" style="--i:' + i + '">' + l + '</span>';
      }).join('') + '<span class="cw-caret"></span>';
    };

    if (reduceMotion) {
      playCode();
    } else {
      setTimeout(function () { playCode(); setInterval(playCode, 9000); }, 2200);
    }
  }

  /* ---------- 13c. Side dot navigator ---------- */
  var DOTS = [
    ['home', 'index.html'], ['about', 'about.md'], ['skills', 'skills.json'],
    ['experience', 'experience.log'], ['projects', 'projects/'],
    ['education', 'education.db'], ['contact', 'contact.sh']
  ];
  var dotNav = document.createElement('nav');
  dotNav.className = 'side-dots';
  dotNav.setAttribute('aria-label', 'Section navigator');
  DOTS.forEach(function (d) {
    var a = document.createElement('a');
    a.href = '#' + d[0];
    a.setAttribute('data-label', d[1]);
    a.setAttribute('aria-label', 'Go to ' + d[0]);
    dotNav.appendChild(a);
  });
  document.body.appendChild(dotNav);

  var dotLinks = $$('a', dotNav);
  function syncDots() {
    var cur = 0;
    navAnchors.forEach(function (a, i) { if (a.classList.contains('active')) cur = i; });
    dotLinks.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }
  window.addEventListener('scroll', function () {
    requestAnimationFrame(function () { requestAnimationFrame(syncDots); });
  }, { passive: true });
  syncDots();

  /* ---------- 13d. Code characters trail behind the cursor ---------- */
  if (finePointer && !reduceMotion) {
    var TRAIL = '01{}</>;#=';
    var lastGlyph = 0;
    window.addEventListener('mousemove', function (e) {
      var now = performance.now();
      if (now - lastGlyph < 70) return;
      lastGlyph = now;
      var g = document.createElement('span');
      g.className = 'trail-glyph';
      g.textContent = TRAIL.charAt((Math.random() * TRAIL.length) | 0);
      g.style.left = (e.clientX + Math.random() * 16 - 8) + 'px';
      g.style.top = (e.clientY + Math.random() * 16 - 8) + 'px';
      document.body.appendChild(g);
      setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 900);
    }, { passive: true });
  }
})();

/* =========================================================
   14. SWIPEABLE PROJECTS CAROUSEL
   - Touch / trackpad: native swipe with snap
   - Mouse: click-and-drag
   - Arrow buttons, dots, and keyboard arrows
   - Controls hide automatically if all cards already fit
   To add a project: copy one <article class="project-card"> in
   index.html and paste it after the last one. Nothing else to do.
   ========================================================= */
(function () {
  'use strict';

  var track = document.querySelector('.projects-grid');
  if (!track) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = Array.prototype.slice.call(track.querySelectorAll('.project-card'));
  if (!cards.length) return;

  /* ---------- Wrap the track and build the controls ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'projects-carousel';
  track.parentNode.insertBefore(wrap, track);
  wrap.appendChild(track);

  track.setAttribute('tabindex', '0');
  track.setAttribute('role', 'region');
  track.setAttribute('aria-label', 'Projects. Swipe or use the arrow keys to browse.');

  var controls = document.createElement('div');
  controls.className = 'carousel-controls';
  controls.innerHTML =
    '<button class="carousel-btn" type="button" data-dir="-1" aria-label="Previous project">&larr;</button>' +
    '<div class="carousel-dots" role="tablist" aria-label="Project pages"></div>' +
    '<button class="carousel-btn" type="button" data-dir="1" aria-label="Next project">&rarr;</button>';
  wrap.appendChild(controls);

  var hint = document.createElement('p');
  hint.className = 'carousel-hint';
  hint.textContent = 'Swipe or drag to explore more projects';
  wrap.appendChild(hint);

  var prevBtn = controls.querySelector('[data-dir="-1"]');
  var nextBtn = controls.querySelector('[data-dir="1"]');
  var dotsBox = controls.querySelector('.carousel-dots');
  var dots = [];
  var positions = 1;

  /* ---------- Helpers ---------- */
  function gap() {
    return parseFloat(getComputedStyle(track).columnGap) || 20;
  }

  function padLeft() {
    return parseFloat(getComputedStyle(track).paddingLeft) || 0;
  }

  function maxScroll() {
    return Math.max(0, track.scrollWidth - track.clientWidth);
  }

  function cardLeft(i) {
    return cards[i].offsetLeft - padLeft();
  }

  function goTo(i, instant) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({
      left: Math.min(cardLeft(i), maxScroll()),
      behavior: (instant || reduceMotion) ? 'auto' : 'smooth'
    });
  }

  function currentIndex() {
    var x = track.scrollLeft, best = 0, bestDist = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var d = Math.abs(cardLeft(i) - x);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  /* ---------- Dots (one per possible scroll position) ---------- */
  function buildDots() {
    var step = cards[0].offsetWidth + gap();
    var visible = Math.max(1, Math.floor((track.clientWidth + gap()) / step + 0.01));
    positions = Math.max(1, cards.length - visible + 1);

    dotsBox.innerHTML = '';
    dots = [];
    for (var i = 0; i < positions; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-dot';
      b.setAttribute('aria-label', 'Go to project ' + (i + 1));
      b.addEventListener('click', (function (idx) { return function () { goTo(idx); }; })(i));
      dotsBox.appendChild(b);
      dots.push(b);
    }

    var scrollable = maxScroll() > 4;
    controls.hidden = !scrollable;
    hint.hidden = !scrollable;
    track.style.cursor = scrollable ? '' : 'default';
  }

  function update() {
    var max = maxScroll();
    var atStart = track.scrollLeft <= 2;
    var atEnd = track.scrollLeft >= max - 2;
    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;

    var idx = atEnd ? positions - 1 : Math.min(positions - 1, currentIndex());
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === idx);
      d.setAttribute('aria-current', i === idx ? 'true' : 'false');
    });
  }

  /* ---------- Arrow buttons ---------- */
  function step(dir) {
    var i = currentIndex();
    /* if we are mid-way between two cards, move to the next snap point in that direction */
    if (dir > 0 && cardLeft(i) <= track.scrollLeft + 2) i += 1;
    else if (dir < 0 && cardLeft(i) >= track.scrollLeft - 2) i -= 1;
    goTo(i);
  }

  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  /* ---------- Keyboard: arrow keys when the track is focused ---------- */
  track.addEventListener('keydown', function (e) {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(cards.length - 1); }
  });

  /* ---------- Mouse drag (touch & trackpad already scroll natively) ---------- */
  var down = false, dragging = false, startX = 0, startScroll = 0, suppressClick = false;

  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (e.target.closest('.project-extra, .project-details')) return;
    down = true;
    dragging = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
  });

  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (!dragging && Math.abs(dx) > 6) {
      dragging = true;
      track.classList.add('is-dragging');
    }
    if (dragging) track.scrollLeft = startScroll - dx;
  });

  function endDrag() {
    if (!down) return;
    down = false;
    if (dragging) {
      dragging = false;
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 0);
      var landed = track.scrollLeft;
      track.classList.remove('is-dragging');
      /* snap to the closest card, nudged by the drag direction */
      var i = currentIndex();
      if (landed - startScroll > 40 && cardLeft(i) < landed) i += 1;
      else if (startScroll - landed > 40 && cardLeft(i) > landed) i -= 1;
      goTo(i);
    }
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  /* a drag should never count as a click on the project link */
  track.addEventListener('click', function (e) {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* stop native image / link dragging from fighting the carousel */
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* ---------- Keep everything in sync ---------- */
  var scrollTick = false;
  track.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () { update(); scrollTick = false; });
  }, { passive: true });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { buildDots(); update(); }, 120);
  });

  /* when "Project details" is opened, keep that card fully in view */
  track.addEventListener('click', function (e) {
    var btn = e.target.closest('.project-details');
    if (!btn) return;
    var card = btn.closest('.project-card');
    var i = cards.indexOf(card);
    if (i > -1) setTimeout(function () { goTo(i); }, 0);
  });

  buildDots();
  update();
  window.addEventListener('load', function () { buildDots(); update(); });
})();