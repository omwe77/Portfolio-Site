const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = document.querySelector('#motion-toggle');
const menuToggle = document.querySelector('#menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const header = document.querySelector('.site-header');
const progressFill = document.querySelector('#scroll-progress-fill');
const projectArtFrames = [...document.querySelectorAll('.project-art')];
const canAnimateProjectImages = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const yearNode = document.querySelector('#current-year');

if (yearNode) yearNode.textContent = String(new Date().getFullYear());

let userPausedMotion = false;
const motionIsReduced = () => motionPreference.matches || userPausedMotion;

function updateMotionControl() {
  const paused = motionIsReduced();
  document.body.classList.toggle('motion-paused', paused);
  if (motionToggle) {
    motionToggle.setAttribute('aria-pressed', String(userPausedMotion));
    motionToggle.setAttribute('aria-label', paused ? 'Resume decorative motion' : 'Pause decorative motion');
    motionToggle.innerHTML = `<span class="motion-toggle-icon" aria-hidden="true">${paused ? '▶' : 'Ⅱ'}</span><span>${paused ? 'Resume motion' : 'Pause motion'}</span>`;
  }
}

motionToggle?.addEventListener('click', () => {
  userPausedMotion = !userPausedMotion;
  updateMotionControl();
  setCanvasRunning();
  updateScrollState();
  if (userPausedMotion) drawOrbital(0, true);
});

motionPreference.addEventListener?.('change', () => {
  updateMotionControl();
  setCanvasRunning();
  updateScrollState();
  if (motionIsReduced()) drawOrbital(0, true);
});
updateMotionControl();

function closeMenu({ returnFocus = false } = {}) {
  if (!menuToggle || !primaryNav) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  primaryNav.classList.remove('is-open');
  if (returnFocus) menuToggle.focus();
}

menuToggle?.addEventListener('click', () => {
  const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
  primaryNav?.classList.toggle('is-open', opening);
  if (opening) primaryNav?.querySelector('a')?.focus();
});

primaryNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => closeMenu());
});

document.addEventListener('pointerdown', (event) => {
  if (menuToggle?.getAttribute('aria-expanded') !== 'true') return;
  if (!event.target.closest('#primary-nav') && !event.target.closest('#menu-toggle')) closeMenu();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 760) closeMenu();
}, { passive: true });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    closeMenu({ returnFocus: true });
  }
});

const sectionLinks = [...(primaryNav?.querySelectorAll('a[href^="#"]') ?? [])];
const navSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
if ('IntersectionObserver' in window && navSections.length) {
  const navigationObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting);
    if (!visible.length) return;
    visible.sort((a, b) =>
      Math.abs(a.boundingClientRect.top - window.innerHeight * 0.28) -
      Math.abs(b.boundingClientRect.top - window.innerHeight * 0.28)
    );
    const activeId = visible[0].target.id;
    sectionLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${activeId}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-18% 0px -65% 0px', threshold: 0 });
  navSections.forEach((section) => navigationObserver.observe(section));
}

const revealElements = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !motionPreference.matches) {
  document.documentElement.classList.add('motion-ready');
  const revealObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        entry.target.querySelector('.project-art')?.classList.add('is-revealed');
        observer.unobserve(entry.target);
    }
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

let scrollQueued = false;
function updateScrollState() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  const imageOffsets = projectArtFrames.map((frame) => {
    if (!canAnimateProjectImages() || window.innerWidth <= 760 || motionIsReduced()) return [frame, 0];
    const bounds = frame.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return [frame, 0];
    const travel = Math.max(1, (window.innerHeight + bounds.height) / 2);
    const relativeCenter = (bounds.top + bounds.height / 2 - window.innerHeight / 2) / travel;
    const offset = -Math.max(-1, Math.min(1, relativeCenter)) * 7;
    return [frame, offset];
  });
  if (progressFill) progressFill.style.transform = `scaleX(${progress})`;
  header?.classList.toggle('is-scrolled', window.scrollY > 12);
  if (!motionIsReduced()) {
    const art = document.querySelector('#hero-art');
    if (art && window.innerWidth > 760) {
      const shift = Math.min(26, Math.max(0, window.scrollY * 0.035));
      art.style.translate = `0 ${shift}px`;
    }
  }
  for (const [frame, offset] of imageOffsets) frame.style.setProperty('--image-drift', `${offset.toFixed(2)}px`);
  scrollQueued = false;
}

window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  window.requestAnimationFrame(updateScrollState);
}, { passive: true });
window.addEventListener('resize', updateScrollState, { passive: true });
updateScrollState();

const steps = [...document.querySelectorAll('[data-step]')];
if ('IntersectionObserver' in window && steps.length) {
  const stepObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting);
    if (!visible.length) return;
    visible.sort((a, b) =>
      Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - window.innerHeight / 2) -
      Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - window.innerHeight / 2)
    );
    const activeIndex = steps.indexOf(visible[0].target);
    steps.forEach((step, index) => {
      step.classList.toggle('is-current', index === activeIndex);
      step.classList.toggle('is-passed', index < activeIndex);
    });
  }, { threshold: 0.62 });
  steps.forEach((step) => stepObserver.observe(step));
}

const canTilt = canAnimateProjectImages();
const tiltCards = [...document.querySelectorAll('[data-tilt]')];
tiltCards.forEach((card, index) => card.style.setProperty('--reveal-order', String(index)));
if (canTilt) {
  tiltCards.forEach((card) => {
    const art = card.querySelector('.project-art');
    card.addEventListener('pointermove', (event) => {
      if (motionIsReduced() || event.pointerType !== 'mouse') return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty('--rotate-x', `${(-y * 3.2).toFixed(2)}deg`);
      card.style.setProperty('--rotate-y', `${(x * 3.8).toFixed(2)}deg`);
      if (art) {
        const artBounds = art.getBoundingClientRect();
        art.style.setProperty('--spot-x', `${((event.clientX - artBounds.left) / artBounds.width * 100).toFixed(1)}%`);
        art.style.setProperty('--spot-y', `${((event.clientY - artBounds.top) / artBounds.height * 100).toFixed(1)}%`);
      }
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rotate-x', '0deg');
      card.style.setProperty('--rotate-y', '0deg');
      art?.style.setProperty('--spot-x', '50%');
      art?.style.setProperty('--spot-y', '50%');
    });
  });
}

const portraitFrame = document.querySelector('#portrait-frame');
const portraitImage = document.querySelector('#portrait-image');
const portraitPlaceholder = document.querySelector('#portrait-placeholder');
const portraitInput = document.querySelector('#portrait-file');
const portraitChoose = document.querySelector('#portrait-choose');
const portraitRemove = document.querySelector('#portrait-remove');
const portraitStatus = document.querySelector('#portrait-status');
const portraitStorageKey = 'oms-portfolio-portrait-v1';
const defaultPortrait = portraitFrame?.dataset.defaultPhoto?.trim() ?? '';

function showPortrait(source, { custom = false } = {}) {
  if (!portraitFrame || !portraitImage || !portraitPlaceholder || !source) return;
  portraitImage.src = source;
  portraitImage.hidden = false;
  portraitPlaceholder.hidden = true;
  portraitFrame.classList.add('has-portrait');
  portraitFrame.setAttribute('aria-label', 'Change Om’s portrait photo');
  if (portraitRemove) portraitRemove.hidden = !custom;
}

function setPortraitStatus(message) {
  if (portraitStatus) portraitStatus.textContent = message;
}

try {
  const savedPortrait = window.localStorage.getItem(portraitStorageKey);
  if (savedPortrait?.startsWith('data:image/jpeg;base64,')) {
    showPortrait(savedPortrait, { custom: true });
    setPortraitStatus('Photo restored from this browser. Add it to the site files to share it with visitors.');
  } else if (defaultPortrait) {
    showPortrait(defaultPortrait);
  }
} catch {
  if (defaultPortrait) showPortrait(defaultPortrait);
  setPortraitStatus('Browser photo storage is unavailable; you can still preview a photo for this visit.');
}

function openPortraitPicker() {
  portraitInput?.click();
}

portraitFrame?.addEventListener('click', openPortraitPicker);
portraitChoose?.addEventListener('click', openPortraitPicker);

function resizePortrait(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const sourceImage = new Image();
    sourceImage.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, 1200 / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight));
      const width = Math.max(1, Math.round(sourceImage.naturalWidth * scale));
      const height = Math.max(1, Math.round(sourceImage.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Image preview could not be prepared.'));
        return;
      }
      context.drawImage(sourceImage, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    sourceImage.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('This image could not be opened. Try a JPEG, PNG, or WebP photo.'));
    };
    sourceImage.src = objectUrl;
  });
}

portraitInput?.addEventListener('change', async () => {
  const file = portraitInput.files?.[0];
  portraitInput.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    setPortraitStatus('Choose a raster image such as a JPEG, PNG, or WebP.');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    setPortraitStatus('Choose an image smaller than 20 MB.');
    return;
  }

  portraitChoose?.setAttribute('aria-busy', 'true');
  setPortraitStatus('Preparing your portrait…');
  try {
    const optimizedPortrait = await resizePortrait(file);
    showPortrait(optimizedPortrait, { custom: true });
    try {
      window.localStorage.setItem(portraitStorageKey, optimizedPortrait);
      setPortraitStatus('Photo saved in this browser. Add the image to the site files to show it to visitors.');
    } catch {
      setPortraitStatus('Photo previewed for this visit, but browser storage is full. Add the image to the site files to share it.');
    }
  } catch (error) {
    setPortraitStatus(error instanceof Error ? error.message : 'The photo could not be prepared. Try another image.');
  } finally {
    portraitChoose?.removeAttribute('aria-busy');
  }
});

portraitRemove?.addEventListener('click', () => {
  try {
    window.localStorage.removeItem(portraitStorageKey);
  } catch {
    setPortraitStatus('This browser did not allow the saved photo to be removed.');
    return;
  }
  if (defaultPortrait) {
    showPortrait(defaultPortrait);
    setPortraitStatus('Your photo preview was removed. The site portrait is still shown.');
  } else {
    portraitImage?.removeAttribute('src');
    if (portraitImage) portraitImage.hidden = true;
    if (portraitPlaceholder) portraitPlaceholder.hidden = false;
    portraitFrame?.classList.remove('has-portrait');
    portraitFrame?.setAttribute('aria-label', 'Choose a portrait photo for Om');
    if (portraitRemove) portraitRemove.hidden = true;
    setPortraitStatus('Photo removed from this browser.');
  }
});

if (portraitFrame && canTilt) {
  portraitFrame.addEventListener('pointermove', (event) => {
    if (motionIsReduced() || event.pointerType !== 'mouse') return;
    const bounds = portraitFrame.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    portraitFrame.style.setProperty('--portrait-x', `${(-y * 3.2).toFixed(2)}deg`);
    portraitFrame.style.setProperty('--portrait-y', `${(x * 4).toFixed(2)}deg`);
  });
  portraitFrame.addEventListener('pointerleave', () => {
    portraitFrame.style.setProperty('--portrait-x', '0deg');
    portraitFrame.style.setProperty('--portrait-y', '0deg');
  });
}

const canvas = document.querySelector('#orbital-canvas');
const heroArt = document.querySelector('#hero-art');
let context = null;
let canvasWidth = 1;
let canvasHeight = 1;
let canvasRatio = 1;
let canvasVisible = true;
let animationFrame = 0;
let pointerTarget = { x: 0, y: 0 };
let pointerCurrent = { x: 0, y: 0 };
let currentScroll = 0;

const spherePointCount = 174;
const spherePoints = Array.from({ length: spherePointCount }, (_, index) => {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - 2 * (index + 0.5) / spherePointCount;
  const radius = Math.sqrt(1 - y * y);
  const angle = goldenAngle * index;
  return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
});

const sphereEdges = (() => {
  const edges = [];
  for (let i = 0; i < spherePoints.length; i += 1) {
    const distances = [];
    for (let j = i + 1; j < spherePoints.length; j += 1) {
      const a = spherePoints[i];
      const b = spherePoints[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      distances.push({ index: j, distance: dx * dx + dy * dy + dz * dz });
    }
    distances.sort((a, b) => a.distance - b.distance);
    for (const neighbor of distances.slice(0, 3)) edges.push([i, neighbor.index]);
  }
  return edges;
})();

function resizeCanvas() {
  if (!canvas) return;
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  canvasRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = bounds.width;
  canvasHeight = bounds.height;
  canvas.width = Math.round(canvasWidth * canvasRatio);
  canvas.height = Math.round(canvasHeight * canvasRatio);
  context = canvas.getContext('2d', { alpha: true });
  context?.setTransform(canvasRatio, 0, 0, canvasRatio, 0, 0);
  drawOrbital(0, true);
}

function drawOrbital(time = 0, staticFrame = false) {
  if (!context || !canvas) return;
  const ctx = context;
  const width = canvasWidth;
  const height = canvasHeight;
  const cx = width / 2;
  const cy = height / 2;
  const size = Math.min(width, height) * 0.39;
  const seconds = staticFrame || motionIsReduced() ? 0 : time * 0.00011;
  const scrollTurn = motionIsReduced() ? 0 : currentScroll * 0.00045;
  const yaw = seconds + pointerCurrent.x * 0.42 + scrollTurn;
  const pitch = 0.42 + pointerCurrent.y * 0.34 - scrollTurn * 0.42;
  const sinY = Math.sin(yaw);
  const cosY = Math.cos(yaw);
  const sinX = Math.sin(pitch);
  const cosX = Math.cos(pitch);
  const projected = spherePoints.map((point) => {
    const x = point.x * cosY + point.z * sinY;
    const z0 = -point.x * sinY + point.z * cosY;
    const y = point.y * cosX - z0 * sinX;
    const z = point.y * sinX + z0 * cosX;
    const perspective = 3.5 / (3.2 - z * 0.75);
    return { x: cx + x * size * perspective, y: cy + y * size * perspective, z };
  });

  ctx.clearRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(cx - size * 0.2, cy - size * 0.26, 2, cx, cy, size * 1.28);
  glow.addColorStop(0, 'rgba(184, 234, 219, 0.22)');
  glow.addColorStop(0.34, 'rgba(69, 70, 245, 0.11)');
  glow.addColorStop(1, 'rgba(244, 241, 233, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 1.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.32 + yaw * 0.2);
  ctx.scale(1, 0.32 + Math.abs(Math.sin(pitch)) * 0.1);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.3, size * 1.3, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(69, 70, 245, 0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  for (const [aIndex, bIndex] of sphereEdges) {
    const a = projected[aIndex];
    const b = projected[bIndex];
    const depth = Math.max(0.05, (a.z + b.z + 2) / 4);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = depth > 0.56
      ? `rgba(69, 70, 245, ${0.17 + depth * 0.4})`
      : `rgba(23, 26, 31, ${0.055 + depth * 0.15})`;
    ctx.lineWidth = depth > 0.65 ? 1.05 : 0.72;
    ctx.stroke();
  }

  for (let index = 0; index < projected.length; index += 1) {
    const point = projected[index];
    if (point.z < -0.08 && index % 2 === 0) continue;
    const front = Math.max(0, (point.z + 1) / 2);
    const radius = index % 17 === 0 ? 2.5 : 0.8 + front * 0.85;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = index % 17 === 0 && point.z > 0
      ? 'rgba(250, 101, 75, 0.92)'
      : `rgba(69, 70, 245, ${0.14 + front * 0.65})`;
    ctx.fill();
  }

  const core = ctx.createRadialGradient(cx - size * 0.18, cy - size * 0.2, 1, cx, cy, size * 0.55);
  core.addColorStop(0, 'rgba(255, 255, 255, 0.54)');
  core.addColorStop(0.28, 'rgba(184, 234, 219, 0.12)');
  core.addColorStop(1, 'rgba(69, 70, 245, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

function animateOrbital(time) {
  if (!canvasVisible || document.visibilityState === 'hidden' || motionIsReduced()) {
    animationFrame = 0;
    return;
  }
  pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.08;
  pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.08;
  drawOrbital(time);
  animationFrame = window.requestAnimationFrame(animateOrbital);
}

function setCanvasRunning() {
  if (!canvas || !context) return;
  const shouldRun = canvasVisible && document.visibilityState !== 'hidden' && !motionIsReduced();
  if (shouldRun && !animationFrame) animationFrame = window.requestAnimationFrame(animateOrbital);
  if (!shouldRun && animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

if (canvas && heroArt) {
  resizeCanvas();
  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(heroArt);
  else window.addEventListener('resize', resizeCanvas, { passive: true });

  heroArt.addEventListener('pointermove', (event) => {
    if (motionIsReduced()) return;
    const bounds = heroArt.getBoundingClientRect();
    pointerTarget = {
      x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)),
      y: Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1))
    };
  }, { passive: true });
  heroArt.addEventListener('pointerleave', () => { pointerTarget = { x: 0, y: 0 }; }, { passive: true });
  window.addEventListener('scroll', () => {
    currentScroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      canvasVisible = entry.isIntersecting;
      setCanvasRunning();
      if (!canvasVisible) drawOrbital(0, true);
    }, { threshold: 0.04 }).observe(heroArt);
  }
  document.addEventListener('visibilitychange', setCanvasRunning);
  setCanvasRunning();
}
