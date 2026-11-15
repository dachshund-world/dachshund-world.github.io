(() => {
  'use strict';
  const track = (name, data={}) => {
    const payload = {event:name, site:'dachshund-world', ...data};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') window.gtag('event', name, data);
    if (window.SEOMeasurement?.track) window.SEOMeasurement.track(name, data);
  };
  const menu = document.querySelector('#dw-mobile-menu');
  menu?.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary')?.focus(); }
  });
  menu?.addEventListener('click', e => { if (e.target.closest('a')) menu.open = false; });
  matchMedia('(min-width:981px)').addEventListener('change', e => { if (e.matches && menu) menu.open = false; });
  document.querySelectorAll('[data-dw-from]').forEach(el => {
    el.addEventListener('click', () => track('dw_back_cta_click', {from: el.getAttribute('data-dw-from')}));
  });
})();
