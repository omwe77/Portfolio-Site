(() => {
  const cases = {
    hamigenz: 'hamigenz', arena: 'arena', subscription: 'subscription',
    ecomart: 'ecomart', medstore: 'medstore', spam: 'spam'
  };
  const style = document.createElement('style');
  style.textContent = `:focus-visible{outline:3px solid var(--lime);outline-offset:4px}`;
  document.head.append(style);
  document.querySelectorAll('[data-open]').forEach((button) => {
    const slug = cases[button.dataset.open];
    if (!slug) return;
    button.addEventListener('click', () => {
      const dialog = document.querySelector('#dialog .actions');
      if (dialog && !dialog.querySelector('.case-route')) {
        const link = document.createElement('a');
        link.className = 'button case-route';
        link.textContent = 'Read full case study';
        dialog.append(link);
      }
      const link = dialog?.querySelector('.case-route');
      if (link) link.href = `/projects/${slug}/`;
    }, { capture: true });
  });
  const menuButton = document.querySelector('#menu');
  menuButton?.setAttribute('aria-label', 'Open navigation menu');
  menuButton?.addEventListener('click', () => {
    const open = document.querySelector('#nav')?.classList.contains('open');
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    menuButton.setAttribute('aria-expanded', String(Boolean(open)));
  });
  document.querySelectorAll('#nav a').forEach((link) => link.addEventListener('click', () => {
    document.querySelector('#nav')?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation menu');
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.querySelector('#nav')?.classList.contains('open')) {
      document.querySelector('#nav').classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.setAttribute('aria-label', 'Open navigation menu');
    }
  });
  document.querySelectorAll('input[name="name"], textarea[name="message"]').forEach((field) => {
    field.setAttribute('autocomplete', field.name === 'name' ? 'name' : 'off');
  });
  document.querySelectorAll('img').forEach((image) => {
    if (!image.hasAttribute('width')) image.setAttribute('width', image.classList.contains('portrait') ? '640' : '1000');
    if (!image.hasAttribute('height')) image.setAttribute('height', image.classList.contains('portrait') ? '760' : '640');
    if (image.closest('.project')) image.loading = 'lazy';
  });
  window.buildContactMailto = (name, message) => `mailto:omdangol68@gmail.com?subject=${encodeURIComponent(`Portfolio enquiry from ${name}`)}&body=${encodeURIComponent(message)}`;
  document.querySelector('#form')?.addEventListener('submit', (event) => {
    const form = event.currentTarget;
    const fields = new FormData(form);
    const href = window.buildContactMailto(fields.get('name'), fields.get('message'));
    let status = form.querySelector('#form-status');
    if (!status) {
      status = document.createElement('p');
      status.id = 'form-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      form.append(status);
    }
    status.replaceChildren(document.createTextNode('Your email app should open. If it does not, use this link: '));
    const link = document.createElement('a');
    link.href = href;
    link.textContent = 'Open email draft';
    status.append(link);
  }, { capture: true });
})();
