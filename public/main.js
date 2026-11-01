/**
 * Om Dangol portfolio — interactive features.
 * - Orbital canvas animation (play/pause via reduced-motion + toggle)
 * - Scroll progress indicator
 * - Mobile menu
 * - IntersectionObserver reveal animations
 * - Approach step tracking
 */

(function () {
  'use strict';

  // ---- Element references ----
  const orbitalStage = document.getElementById('orbital-stage');
  const canvas = document.getElementById('orbital-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const motionToggle = document.getElementById('motion-toggle');
  const menuToggle = document.getElementById('menu-toggle');
  const siteNav = document.getElementById('site-nav');
  const progressBar = document.querySelector('.scroll-progress span');
  const steps = document.querySelectorAll('.approach-step');

  // ---- Reduced-motion state ----
  let motionPaused = false;
  let motionSupports = false;

  function checkReducedMotion() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionSupports = true;
    if (mq.matches) {
      motionPaused = true;
      setBodyMotionPaused(true);
    }
    mq.addEventListener('change', () => {
      if (mq.matches) {
        motionPaused = true;
        setBodyMotionPaused(true);
      } else {
        motionPaused = false;
        setBodyMotionPaused(false);
      }
    });
  }

  function setBodyMotionPaused(paused) {
    if (paused) {
      document.body.classList.add('motion-paused');
    } else {
      document.body.classList.remove('motion-paused');
    }
  }

  // ---- Orbital canvas ----
  function resizeCanvas() {
    if (!canvas) return;
    const rect = orbitalStage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawOrbital(time) {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.36;

    // Subtle background glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.6);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.06)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.02)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Orbital paths (two rings)
    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Orbit markers (blue + coral dots)
    const markers = [
      { x: cx + baseR * 0.92 * Math.cos(0), y: cy + baseR * 0.92 * Math.sin(0), color: '#3b82f6' },
      { x: cx + baseR * 0.92 * Math.cos(Math.PI * 0.5), y: cy + baseR * 0.92 * Math.sin(Math.PI * 0.5), color: '#f59e0b' },
      { x: cx + baseR * 0.92 * Math.cos(Math.PI), y: cy + baseR * 0.92 * Math.sin(Math.PI), color: '#3b82f6' },
      { x: cx + baseR * 0.92 * Math.cos(Math.PI * 1.5), y: cy + baseR * 0.92 * Math.sin(Math.PI * 1.5), color: '#f59e0b' },
    ];
    markers.forEach((m) => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Connecting lines
    const lines = [
      { a: 0, b: Math.PI * 0.5, color: 'rgba(59, 130, 246, 0.15)' },
      { a: Math.PI * 0.5, b: Math.PI, color: 'rgba(245, 158, 11, 0.15)' },
      { a: Math.PI, b: Math.PI * 1.5, color: 'rgba(59, 130, 246, 0.15)' },
      { a: Math.PI * 1.5, b: Math.PI * 2, color: 'rgba(245, 158, 11, 0.15)' },
    ];
    lines.forEach((l) => {
      const x1 = cx + baseR * 0.92 * Math.cos(l.a);
      const y1 = cy + baseR * 0.92 * Math.sin(l.a);
      const x2 = cx + baseR * 0.92 * Math.cos(l.b);
      const y2 = cy + baseR * 0.92 * Math.sin(l.b);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = l.color;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Central glowing sphere
    const sphereGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.28);
    sphereGrad.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    sphereGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.15)');
    sphereGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Orbit lines from sphere to edge
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = cx + baseR * 0.92 * Math.cos(angle);
      const y = cy + baseR * 0.92 * Math.sin(angle);
      const grad2 = ctx.createRadialGradient(x, y, 0, x, y, 4);
      grad2.addColorStop(0, 'rgba(255,255,255,0.5)');
      grad2.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = grad2;
      ctx.fill();
    }
  }

  let animFrame = null;
  let lastTime = 0;

  function animate(time) {
    if (!animFrame) {
      animFrame = requestAnimationFrame(function loop(t) {
        animate(t);
      });
    }
    const dt = time - lastTime;
    lastTime = time;
    if (dt > 30) {
      drawOrbital(time);
    }
    animFrame = requestAnimationFrame(function loop(t) {
      animate(t);
    });
  }

  function startAnimation() {
    if (!animFrame) {
      lastTime = 0;
      animate(0);
    }
  }

  function stopAnimation() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  function toggleMotion() {
    if (motionSupports) {
      motionPaused = !motionPaused;
      setBodyMotionPaused(motionPaused);
      motionToggle.setAttribute('aria-label', motionPaused ? 'Resume motion' : 'Pause motion');
      const icon = motionToggle.querySelector('svg');
      if (motionPaused) {
        const c = icon.querySelector('circle');
        c.setAttribute('stroke-dasharray', '20 10');
        const p = icon.querySelector('path');
        p.setAttribute('opacity', '1');
      } else {
        const c = icon.querySelector('circle');
        c.setAttribute('stroke-dasharray', '24 10');
        const p = icon.querySelector('path');
        p.setAttribute('opacity', '0');
      }
    }
  }

  // ---- Scroll progress ----
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const doc = document.documentElement;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    progressBar.style.transform = 'scaleX(' + Math.min(progress, 1) + ')';
  }

  // ---- Mobile menu ----
  function initMobileMenu() {
    const toggle = menuToggle;
    toggle.addEventListener('click', function () {
      const isOpen = siteNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.classList.contains('is-open')) {
        siteNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- Approach steps tracking ----
  function initApproachTracking() {
    const section = document.querySelector('.approach-section');
    if (!section) return;
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          steps.forEach(function (step, i) {
            step.classList.remove('is-current', 'is-passed');
            step.classList.add('is-passed');
            if (i === 0) step.classList.add('is-current');
          });
        }
      });
    }, { threshold: 0.5 });
    observer.observe(section);
  }

  // ---- Scroll reveal ----
  function initReveal() {
    const revealElements = document.querySelectorAll('.project-card, .education-card, .skill-category, .approach-step');
    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal', 'is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  // ---- Init ----
  function init() {
    checkReducedMotion();
    if (ctx) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      startAnimation();
    }
    if (motionToggle) {
      motionToggle.addEventListener('click', toggleMotion);
    }
    initMobileMenu();
    initApproachTracking();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
