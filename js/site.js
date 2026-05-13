/* LEAP HEI — site behaviors. Vanilla JS, no deps. */

(function () {
  'use strict';

  // ---------- Application URL ----------
  // Ashley's live application site, per 2026-05-11 walkthrough:
  // "would you rather when i hit apply now that they just go [to]
  //  the application site?" — "yeah, let's do that."
  // The actual URL was promised but not delivered (app was down).
  // Until Ashley sends the real URL, this stays at the local
  // pre-qual flow so nothing breaks. Update this constant — every
  // CTA tagged [data-app-href] picks it up automatically.
  const APPLICATION_URL = 'apply.html'; // TODO(2026-05-13): swap to live URL from Ashley.

  document.querySelectorAll('[data-app-href]').forEach(el => {
    el.setAttribute('href', APPLICATION_URL);
  });

  // ---------- Nav: sticky scroll state + mobile toggle ----------
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');

  if (nav) {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          nav.classList.toggle('is-scrolled', window.scrollY > 24);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  // ---------- Mark current nav link ----------
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('is-current');
  });

  // ---------- Reveal-on-scroll ----------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('.reveal, .explainer__steps').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
  }

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq__q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq__item');
      const open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // ---------- Language toggle (cosmetic for now) ----------
  document.querySelectorAll('.footer__lang button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('is-current'));
      btn.classList.add('is-current');
    });
  });

  // ---------- Pre-qual widget ----------
  const prequal = document.querySelector('[data-prequal]');
  if (prequal) initPrequal(prequal);

  function initPrequal(root) {
    const steps = Array.from(root.querySelectorAll('.prequal__step'));
    const bar = root.querySelector('.prequal__progress-bar');
    const answers = {};
    let i = 0;

    const render = () => {
      steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
      if (bar) bar.style.width = ((i + 1) / steps.length * 100) + '%';
    };
    render();

    root.addEventListener('click', (e) => {
      const choice = e.target.closest('.prequal__choice');
      const back = e.target.closest('.prequal__back');
      const next = e.target.closest('[data-next]');

      if (choice) {
        const step = choice.closest('.prequal__step');
        step.querySelectorAll('.prequal__choice').forEach(c => c.classList.remove('is-selected'));
        choice.classList.add('is-selected');
        answers[step.dataset.key] = choice.dataset.value;
        // Auto-advance after a brief beat for visual feedback
        setTimeout(() => advance(), 200);
      }
      if (back) {
        i = Math.max(0, i - 1);
        render();
      }
      if (next) {
        advance();
      }
    });

    root.addEventListener('input', (e) => {
      if (e.target.matches('.prequal__input')) {
        const step = e.target.closest('.prequal__step');
        answers[step.dataset.key] = e.target.value;
      }
    });

    function advance() {
      if (i < steps.length - 1) {
        i++;
        render();
      }
      if (i === steps.length - 1) {
        // Last step is the result — compute recommendation
        const rec = recommend(answers);
        const target = root.querySelector('[data-result-name]');
        const desc = root.querySelector('[data-result-desc]');
        const link = root.querySelector('[data-result-link]');
        if (target) target.textContent = rec.name;
        if (desc) desc.textContent = rec.desc;
        if (link) link.href = rec.href;
      }
    }
  }

  function recommend(a) {
    // a.use: debt | renovate | retirement | other
    // a.equity: <100 | 100-300 | 300+
    // a.credit: <620 | 620-720 | 720+
    if (a.use === 'debt')        return { name: 'Leap Restore', desc: 'Designed to help homeowners pay down high-interest debt and rebuild credit without a new monthly payment.', href: 'solutions-restore.html' };
    if (a.use === 'renovate')    return { name: 'Leap Revive',  desc: 'Built for the homeowner who wants to renovate the home they already love, with all funds available at close.', href: 'solutions-revive.html' };
    if (a.use === 'retirement')  return { name: 'Leap Relax',   desc: 'Engineered for homeowners approaching retirement who want to turn equity into a longer runway.', href: 'solutions-relax.html' };
    return { name: 'A Leap HEI', desc: 'A licensed Leap specialist will match you to the right product for your situation in a 15-minute conversation.', href: 'apply.html' };
  }

  // ---------- Current year in footer ----------
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // ---------- Custom cursor (bronze dot + ring) ----------
  // Activates only on devices that have a fine pointer (real mouse,
  // not touch) AND haven't opted out of motion. Sartori-style.
  (function initCursor() {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('has-custom-cursor');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    // Ring eases toward the dot for a soft trailing feel.
    function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Hover state on interactive elements
    const hoverSel = 'a, button, [role="button"], .prequal__choice, .solution, .quote, label, summary';
    document.body.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSel)) ring.classList.add('is-hover');
    });
    document.body.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSel)) ring.classList.remove('is-hover');
    });

    window.addEventListener('mousedown', () => ring.classList.add('is-down'));
    window.addEventListener('mouseup',   () => ring.classList.remove('is-down'));

    // Hide while the pointer is outside the window
    window.addEventListener('mouseleave', () => { dot.style.opacity = 0; ring.style.opacity = 0; });
    window.addEventListener('mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; });
  })();

})();
