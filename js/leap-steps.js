/**
 * Leap HEI — Horizontal Step Process Component
 * Version 1.0
 *
 * Usage:
 *   const stepper = new LeapSteps('#my-container', steps, options);
 *
 * Steps array format:
 *   [
 *     { timing: 'Day 0', title: 'Apply and qualify', body: 'Your copy here.' },
 *     ...
 *   ]
 *
 * Options:
 *   onComplete: function() {}   — fires when user clicks the final CTA
 *   ctaLabel: 'Learn more'      — label for the last-step button (default: 'Learn more')
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.LeapSteps = factory();
  }
}(typeof window !== 'undefined' ? window : this, function () {

  'use strict';

  function LeapSteps(selector, steps, options) {
    this.container = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!this.container) {
      console.warn('LeapSteps: container not found for selector', selector);
      return;
    }

    this.steps    = steps || [];
    this.options  = Object.assign({ onComplete: null, ctaLabel: 'Learn more' }, options || {});
    this.current  = 0;
    this._rippleFrame = null;

    this._build();
    this._render(undefined);
  }

  LeapSteps.prototype._build = function () {
    var self = this;
    var s    = this.steps;

    /* Nodes + connectors markup */
    var trackCells = '';
    s.forEach(function (step, i) {
      trackCells += [
        '<div class="leap-steps__node" id="leap-node-' + i + '" role="button" tabindex="0"',
        '  aria-label="Go to step ' + (i + 1) + ': ' + step.title + '">',
        '  <div class="leap-steps__circle">',
        '    <span class="leap-steps__num">' + (i + 1) + '</span>',
        '    <span class="leap-steps__check" aria-hidden="true">&#10003;</span>',
        '  </div>',
        '  <div class="leap-steps__label">' + (step.shortLabel || step.title) + '</div>',
        '</div>'
      ].join('');
      if (i < s.length - 1) {
        trackCells += [
          '<div class="leap-steps__connector" aria-hidden="true">',
          '  <div class="leap-steps__connector-fill" id="leap-conn-' + i + '"></div>',
          '</div>'
        ].join('');
      }
    });

    this.container.innerHTML = [
      '<div class="leap-steps" role="region" aria-label="Step-by-step process">',

      '  <div class="leap-steps__track" role="list" aria-label="Process steps">',
      trackCells,
      '  </div>',

      '  <div class="leap-steps__panel">',
      '    <div class="leap-steps__card" id="leap-card">',
      '      <canvas class="leap-steps__ripple-canvas" id="leap-ripple" aria-hidden="true"></canvas>',
      '      <p class="leap-steps__timing"  id="leap-timing"></p>',
      '      <h3 class="leap-steps__title"  id="leap-title"></h3>',
      '      <p class="leap-steps__body"    id="leap-body"  aria-live="polite"></p>',
      '    </div>',
      '  </div>',

      '  <nav class="leap-steps__nav" aria-label="Step navigation">',
      '    <button class="leap-btn leap-btn--back" id="leap-prev" aria-label="Previous step">',
      '      <div class="leap-btn__inner">',
      '        <div class="leap-btn__side-bar" aria-hidden="true"></div>',
      '        <div class="leap-btn__body">',
      '          <span class="leap-btn__arrow" aria-hidden="true">&#8592;</span>',
      '          <span class="leap-btn__label">Back</span>',
      '        </div>',
      '      </div>',
      '    </button>',
      '    <button class="leap-btn leap-btn--next" id="leap-next">',
      '      <div class="leap-btn__inner">',
      '        <div class="leap-btn__left">',
      '          <div class="leap-btn__sheen" aria-hidden="true"></div>',
      '          <span class="leap-btn__label" id="leap-next-label">Continue</span>',
      '        </div>',
      '        <div class="leap-btn__right">',
      '          <span class="leap-btn__arrow" aria-hidden="true">&#8594;</span>',
      '        </div>',
      '      </div>',
      '    </button>',
      '    <span class="leap-steps__counter" id="leap-counter" aria-live="polite">01 / 0' + s.length + '</span>',
      '  </nav>',

      '</div>'
    ].join('');

    /* Bind events */
    var self = this;

    this.container.querySelector('#leap-prev').addEventListener('click', function () { self.prev(); });
    this.container.querySelector('#leap-next').addEventListener('click', function () { self.next(); });

    s.forEach(function (_, i) {
      var node = self.container.querySelector('#leap-node-' + i);
      node.addEventListener('click',   function () { self.goTo(i); });
      node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') self.goTo(i); });
    });
  };

  LeapSteps.prototype._ripple = function (fromRight) {
    var canvas = this.container.querySelector('#leap-ripple');
    var card   = this.container.querySelector('#leap-card');
    if (!canvas || !card) return;

    canvas.width  = card.offsetWidth;
    canvas.height = card.offsetHeight;

    var ctx   = canvas.getContext('2d');
    var cx    = fromRight ? canvas.width * 0.82 : canvas.width * 0.18;
    var cy    = canvas.height * 0.5;
    var maxR  = Math.hypot(canvas.width, canvas.height) * 1.35;
    var rings = [
      { offset: 0,  alpha: 0.20, speed: 1.00 },
      { offset: 22, alpha: 0.11, speed: 1.18 },
      { offset: 48, alpha: 0.06, speed: 1.38 }
    ];
    var r    = 0;
    var self = this;

    cancelAnimationFrame(this._rippleFrame);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var allDone = true;
      rings.forEach(function (ring) {
        var rr = Math.max(0, r - ring.offset) * ring.speed;
        if (rr < maxR) {
          allDone = false;
          var a = Math.max(0, ring.alpha * (1 - rr / maxR));
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(201,169,110,' + a.toFixed(3) + ')';
          ctx.fill();
        }
      });
      r += maxR / 20;
      if (!allDone) {
        self._rippleFrame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    draw();
  };

  LeapSteps.prototype._revealWords = function (text) {
    var el    = this.container.querySelector('#leap-body');
    if (!el) return;
    var words = text.split(' ');
    el.innerHTML = words.map(function (w) {
      return '<span>' + w + '&nbsp;</span>';
    }).join('');
    el.querySelectorAll('span').forEach(function (s, i) {
      setTimeout(function () {
        s.classList.add('leap-revealed');
      }, 55 + i * 42);
    });
  };

  LeapSteps.prototype._render = function (fromRight) {
    var s   = this.steps[this.current];
    var len = this.steps.length;
    var c   = this.current;
    var con = this.container;

    var timingEl = con.querySelector('#leap-timing');
    var titleEl  = con.querySelector('#leap-title');
    if (timingEl) timingEl.textContent = s.timing || '';
    if (titleEl)  titleEl.textContent  = s.title  || '';

    if (fromRight !== undefined) this._ripple(fromRight);
    this._revealWords(s.body || '');

    /* Node states */
    for (var i = 0; i < len; i++) {
      var node = con.querySelector('#leap-node-' + i);
      if (!node) continue;
      node.classList.remove('leap-steps__node--active', 'leap-steps__node--done');
      if (i === c)      node.classList.add('leap-steps__node--active');
      else if (i < c)   node.classList.add('leap-steps__node--done');
    }

    /* Connector fills */
    for (var j = 0; j < len - 1; j++) {
      var fill = con.querySelector('#leap-conn-' + j);
      if (fill) fill.style.width = j < c ? '100%' : '0%';
    }

    /* Buttons */
    var prevBtn   = con.querySelector('#leap-prev');
    var nextLabel = con.querySelector('#leap-next-label');
    var counter   = con.querySelector('#leap-counter');

    if (prevBtn)   prevBtn.disabled = (c === 0);
    if (nextLabel) nextLabel.textContent = (c === len - 1) ? this.options.ctaLabel : 'Continue';
    if (counter)   counter.textContent = '0' + (c + 1) + ' / 0' + len;
  };

  /* Public API */
  LeapSteps.prototype.goTo = function (n) {
    if (n < 0 || n >= this.steps.length) return;
    var dir = n > this.current;
    this.current = n;
    this._render(dir);
  };

  LeapSteps.prototype.next = function () {
    if (this.current < this.steps.length - 1) {
      this.current++;
      this._render(true);
    } else if (typeof this.options.onComplete === 'function') {
      this.options.onComplete();
    }
  };

  LeapSteps.prototype.prev = function () {
    if (this.current > 0) {
      this.current--;
      this._render(false);
    }
  };

  return LeapSteps;

}));
