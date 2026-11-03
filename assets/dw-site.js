(() => {
  'use strict';
  const track = (name, data) => window.SEOMeasurement?.track(name, data);
  const menu = document.querySelector('#dw-mobile-menu');
  menu?.addEventListener('keydown', e => {if(e.key === 'Escape' && menu.open){menu.open=false;menu.querySelector('summary').focus();}});
  menu?.addEventListener('click', e => {if(e.target.closest('a')) menu.open=false;});
  matchMedia('(min-width:1025px)').addEventListener('change', e => {if(e.matches && menu) menu.open=false;});
  document.querySelectorAll('[data-dw-cta]').forEach(link => link.addEventListener('click', () => track('dw_gift_open', {placement:link.dataset.dwCta})));
  const finder = document.querySelector('#gift-finder');
  if (!finder) return;
  const form = finder.querySelector('form');
  const results = finder.querySelector('#dw-gift-results');
  const status = finder.querySelector('[role="status"]');
  const completed = new Set();
  let viewed = false;
  let timer;
  const products = {
    print: {name:'A dachshund print', detail:'For the wall that needs a little more long dog.', query:'dachshund wall art print', icon:'print'},
    mug: {name:'A dachshund mug', detail:'A small ritual for their favourite dog person.', query:'dachshund ceramic mug', icon:'mug'},
    tote: {name:'A dachshund tote', detail:'For errands, books and conspicuous dog enthusiasm.', query:'dachshund tote bag', icon:'tote'}
  };
  const icons = {
    print:'<rect x="29" y="12" width="102" height="116" rx="2"/><path d="M40 23h80v94H40z"/><path d="M55 76h39l8-18 13 7-8 16h-8v18m-38-18-5 18M55 71l-10-9"/>',
    mug:'<path d="M33 40h77v66q0 15-16 15H49q-16 0-16-15z"/><path d="M110 51h12q22 0 22 22t-34 22M53 21v-8m22 8v-8m22 8v-8"/><path d="M52 81h32l8-13 11 5-8 14H59l-7-6m8 6v10m23-10v10"/>',
    tote:'<path d="M30 45h100l-7 83H37zM57 45V29q0-23 23-23t23 23v16"/><path d="M51 88h43l10-19 14 8-10 17H61l-10-6m12 6v17m29-17v17M51 82l-8-10"/>'
  };
  function view() {if (!viewed) {viewed = true; track('dw_gift_view');}}
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => entries.forEach(entry => {
      clearTimeout(timer);
      if (entry.isIntersecting && entry.intersectionRatio >= .5 && !viewed) timer = setTimeout(view, 800);
    }), {threshold:[.5]}).observe(form);
  }
  function destination(id, choice) {
    const configured = window.DW_CONFIG?.partners?.[id];
    if (configured) {
      try {
        const url = new URL(configured);
        if (url.protocol === 'https:' && !url.username && !url.password) return {url:url.href,type:'affiliate'};
      } catch (_) {}
    }
    const query = products[id].query + (choice.gift_style === 'personal' ? ' personalised' : choice.gift_style === 'minimal' ? ' minimalist' : ' colourful');
    const url = new URL('https://www.etsy.com/search');
    url.searchParams.set('q',query);
    if (choice.budget_band === 'under_25') url.searchParams.set('max', '25');
    if (choice.budget_band === '25_50') {url.searchParams.set('min','25');url.searchParams.set('max','50');}
    if (choice.budget_band === 'over_50') url.searchParams.set('min','50');
    return {url:url.href,type:'ordinary'};
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const choice = {occasion:values.get('occasion'),gift_style:values.get('gift_style'),budget_band:values.get('budget_band')};
    if (!['birthday','thank_you','just_because'].includes(choice.occasion) || !['minimal','playful','personal'].includes(choice.gift_style) || !['under_25','25_50','over_50'].includes(choice.budget_band)) return;
    view();
    const order = choice.budget_band === 'under_25' ? ['mug','tote','print'] : choice.gift_style === 'personal' || choice.budget_band === 'over_50' ? ['print','tote','mug'] : ['tote','print','mug'];
    results.replaceChildren();
    const intro = document.createElement('p');intro.className='dw-result-note';
    intro.textContent = 'A starting point for ' + {birthday:'a birthday',thank_you:'a thank-you gift',just_because:'a just-because surprise'}[choice.occasion] + '. These are search ideas, not verified listings. Check current price, personalisation and delivery at the shop.';
    results.append(intro);
    order.forEach((id, index) => {
      const product = products[id], dest = destination(id,choice);
      const card = document.createElement('section');card.className='dw-result-card';
      // Only our static vector paths are inserted as markup. No user/remote HTML.
      const art = document.createElement('div');art.className='dw-product-art';art.innerHTML='<svg viewBox="0 0 160 140" aria-hidden="true">'+icons[id]+'</svg>';
      const label=document.createElement('p');label.className='dw-eyebrow';label.textContent=index ? 'ANOTHER IDEA' : 'START HERE';
      const heading=document.createElement('h3');heading.textContent=product.name;
      const text=document.createElement('p');text.textContent=product.detail;
      const link=document.createElement('a');link.className='dw-text-link';link.href=dest.url;link.target='_blank';link.rel=dest.type === 'affiliate' ? 'sponsored noopener noreferrer' : 'noopener noreferrer';link.textContent='Explore '+id+' ideas ↗';
      link.addEventListener('click', () => track('dw_gift_outbound',{...choice,product_id:id,link_type:dest.type}));
      card.append(art,label,heading,text,link);results.append(card);
    });
    results.hidden=false;
    finder.querySelector('#dw-results-heading').hidden=false;
    const key=Object.values(choice).join(':');
    if (!completed.has(key)) {completed.add(key);track('dw_gift_complete',choice);}
    status.textContent='Three gift ideas are ready below.';
    finder.querySelector('#dw-results-heading').focus({preventScroll:true});
  });
  form.hidden=false;
})();
