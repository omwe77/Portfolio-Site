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
  let reducedMotion = false;

  // ---- Animation control state (idempotent scheduler) ----
  // Invariants:
  // - No more than one active animation frame chain.
  // - Repeated calls to start must not create additional chains.
  // - Stop must cancel the pending frame.
  // - Pause must stop scheduling frames (loop notices and stops rescheduling).
  // - Resume must start exactly one frame chain.
  // - Reduced-motion preference must be respected on initialisation and when changed.
  // - Resizing must not create additional frame loops.
  // - No orphaned requestAnimationFrame callbacks.
  let animFrame = null;
  let lastTime = 0;
  let animationRunning = false; // is the rAF loop active?
  let animationPaused = false;   // is the animation logically paused?

  function checkReducedMotion() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionSupports = true;
    reducedMotion = mq.matches;
    if (reducedMotion) {
      motionPaused = true;
      animationPaused = true;
      animationRunning = false;
      setBodyMotionPaused(true);
      if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
      }
    }
    syncMotionToggle();
    // Listen for changes while the page is open
    mq.addEventListener('change', (e) => {
      reducedMotion = e.matches;
      if (reducedMotion) {
        motionPaused = true;
        animationPaused = true;
        animationRunning = false;
        setBodyMotionPaused(true);
        if (animFrame) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        }
        syncMotionToggle();
      } else {
        // Reduced motion preference restored — resume animation if not paused
        motionPaused = false;
        setBodyMotionPaused(false);
        animationPaused = false;
        if (animationRunning) {
          // Loop is already running and will notice animationPaused=false on next tick
        } else {
          // Start a fresh chain
          animationRunning = true;
          animFrame = requestAnimationFrame(animationLoop);
        }
        syncMotionToggle();
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

  function syncMotionToggle() {
    if (!motionToggle) return;
    const label = reducedMotion ? 'Motion reduced by system preference' : (animationPaused ? 'Resume motion' : 'Pause motion');
    motionToggle.disabled = reducedMotion;
    motionToggle.setAttribute('aria-label', label);
    const visibleLabel = motionToggle.querySelector('span');
    if (visibleLabel) visibleLabel.textContent = reducedMotion ? 'Motion reduced' : (animationPaused ? 'Resume motion' : 'Pause motion');
  }

  // ---- The single animation loop ----
  // Reschedules itself only if animationRunning && !animationPaused.
  // Guarantee: at most one chain exists because the loop only ever calls
  // requestAnimationFrame(animationLoop) itself.
  function animationLoop(t) {
    const dt = t - lastTime;
    lastTime = t;

    if (dt > 30) {
      drawOrbital(t);
    }

    // Only reschedule if running and not paused — this is the idempotent guard.
    if (animationRunning && !animationPaused) {
      animFrame = requestAnimationFrame(animationLoop);
    } else if (!animationRunning) {
      // Cleanup if stop() cleared the flag while a frame was pending.
      animFrame = null;
    }
  }

  // ---- startAnimation / stopAnimation ----

  function startAnimation() {
    if (reducedMotion) return;
    animationRunning = true;
    animationPaused = false;
    // Idempotent: start a chain only if one doesn't already exist.
    if (!animFrame) {
      animFrame = requestAnimationFrame(animationLoop);
    }
    setBodyMotionPaused(false);
    syncMotionToggle();
  }

  function stopAnimation() {
    animationRunning = false;
    animationPaused = true;
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    setBodyMotionPaused(true);
    syncMotionToggle();
  }

  // ---- toggleMotion ----
  // Toggles between running and paused. No-op when reduced-motion is preferred.
  function toggleMotion() {
    if (reducedMotion) return;
    if (animationPaused) startAnimation();
    else stopAnimation();
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

    // Orbit markers (blue + coral dots) - rotate slowly based on time
    const rotation = time * 0.001; // slow rotation driven by time
    const markers = [
      { x: cx + baseR * 0.92 * Math.cos(rotation), y: cy + baseR * 0.92 * Math.sin(rotation), color: '#3b82f6' },
      { x: cx + baseR * 0.92 * Math.cos(Math.PI * 0.5 + rotation), y: cy + baseR * 0.92 * Math.sin(Math.PI * 0.5 + rotation), color: '#f59e0b' },
      { x: cx + baseR * 0.92 * Math.cos(Math.PI + rotation), y: cy + baseR * 0.92 * Math.sin(Math.PI + rotation), color: '#3b82f6' },
      { x: cx + baseR * 0.92 * Math.cos(Math.PI * 1.5 + rotation), y: cy + baseR * 0.92 * Math.sin(Math.PI * 1.5 + rotation), color: '#f59e0b' },
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
      { a: rotation, b: Math.PI * 0.5 + rotation, color: 'rgba(59, 130, 246, 0.15)' },
      { a: Math.PI * 0.5 + rotation, b: Math.PI + rotation, color: 'rgba(245, 158, 11, 0.15)' },
      { a: Math.PI + rotation, b: Math.PI * 1.5 + rotation, color: 'rgba(59, 130, 246, 0.15)' },
      { a: Math.PI * 1.5 + rotation, b: Math.PI * 2 + rotation, color: 'rgba(245, 158, 11, 0.15)' },
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
      const angle = (i / 12) * Math.PI * 2 + rotation;
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

  // ---- Scroll progress ----
  function updateScrollProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY;
    const doc = document.documentElement;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    progressBar.style.transform = 'scaleX(' + Math.min(progress, 1) + ')';
  }

  function initScrollProgress() {
    if (!progressBar) return;
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    window.addEventListener('load', updateScrollProgress, { once: true });
  }

  // ---- Mobile menu ----
  function initMobileMenu() {
    const toggle = menuToggle;
    if (!toggle || !siteNav) return;

    function closeMenu() {
      siteNav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    }

    toggle.addEventListener('click', function () {
      const isOpen = siteNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });
    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.classList.contains('is-open')) closeMenu();
    });
    document.addEventListener('click', function (e) {
      if (siteNav.classList.contains('is-open') && !siteNav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
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

  // ---- Reveal init ----
  function initReveal() {
    const revealElements = document.querySelectorAll('.project-card');
    if (revealElements.length === 0 || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
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
    document.documentElement.classList.add('motion-ready');
    initScrollProgress();
    if (ctx) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      // Start animation if not in reduced motion
      if (!reducedMotion) {
        startAnimation();
      }
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
