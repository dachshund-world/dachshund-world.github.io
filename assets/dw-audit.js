(() => {
  'use strict';
  const track = (name, data={}) => {
    const payload = {event:name, site:'dachshund-world', ...data};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') window.gtag('event', name, data);
    if (window.SEOMeasurement?.track) window.SEOMeasurement.track(name, data);
  };
  track('dw_back_view');
  let used = false;
  const form = document.getElementById('dw-audit-form');
  const out = document.getElementById('dw-audit-result');
  const list = document.getElementById('dw-audit-list');
  const scoreEl = document.getElementById('dw-audit-score');
  if (!form || !out || !list) return;

  const rules = [
    {id:'stairs_open', zone:'stairs', pri:1, title:'Gate the staircase', detail:'Add a gate at the top and bottom so the dog cannot race the stairs alone — matching the VCA home-setup advice against running up and down stairs.'},
    {id:'stairs_slip', zone:'stairs', pri:2, title:'Add stair traction', detail:'Put a runner or grip strips on smooth stairs and a rug at the landing so short legs do not skid.'},
    {id:'sofa_jump', zone:'sofa', pri:1, title:'Stop sofa leaps', detail:'Place a ramp or dog stairs at the sofa and block the leap route for a week so the new path becomes the habit (AKC furniture-access guidance).'},
    {id:'bed_jump', zone:'bed', pri:1, title:'Give the bed a ramp', detail:'Match ramp length to bed height; teach it with treats one step at a time — see the ramp-length calculator and ramp-training guide.'},
    {id:'no_ramp', zone:'ramp', pri:1, title:'Choose ramp or dog stairs', detail:'If the gear must travel or serve a car, prefer a folding ramp; if it stays by one sofa, dog stairs often take less floor space (AKC comparison).'},
    {id:'ramp_unused', zone:'ramp', pri:2, title:'Train the ramp you already own', detail:'Lower the angle, lure each step, add a side barrier, and never push — follow the five-stage plan on this site.'},
    {id:'floor_slip', zone:'floors', pri:2, title:'Cover slippery landings', detail:'Runners on polished floors near furniture reduce skids before a jump attempt.'},
    {id:'carry', zone:'handling', pri:3, title:'Support both ends when carrying', detail:'When you carry a Dachshund on remaining stairs, support chest and rear together so the long back stays level.'},
  ];

  function markUse(){
    if (!used) { used = true; track('dw_back_use', {action:'first_change'}); }
  }

  function compute(){
    markUse();
    const on = {};
    form.querySelectorAll('input[type=checkbox]').forEach(c => { on[c.name] = c.checked; });
    const hits = [];
    if (on.stairs_present && !on.stairs_gated) hits.push(rules.find(r=>r.id==='stairs_open'));
    if (on.stairs_present && on.stairs_slippery) hits.push(rules.find(r=>r.id==='stairs_slip'));
    if (on.sofa_access && on.sofa_jumps) hits.push(rules.find(r=>r.id==='sofa_jump'));
    if (on.bed_access && on.bed_jumps) hits.push(rules.find(r=>r.id==='bed_jump'));
    if ((on.sofa_access || on.bed_access) && !on.has_ramp) hits.push(rules.find(r=>r.id==='no_ramp'));
    if (on.has_ramp && !on.ramp_trained) hits.push(rules.find(r=>r.id==='ramp_unused'));
    if (on.floors_slippery) hits.push(rules.find(r=>r.id==='floor_slip'));
    if (on.stairs_present) hits.push(rules.find(r=>r.id==='carry'));
    const uniq = [];
    const seen = new Set();
    hits.filter(Boolean).sort((a,b)=>a.pri-b.pri).forEach(h => { if (!seen.has(h.id)) { seen.add(h.id); uniq.push(h); } });
    list.replaceChildren();
    if (!uniq.length) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="dw-tag low">Steady</span><div><strong>No high-priority gaps from these answers.</strong><p>Re-check after furniture moves. Keep practising the ramp so jumping does not return.</p></div>';
      list.append(li);
      scoreEl.textContent = 'Home looks steady on this checklist';
    } else {
      uniq.forEach(h => {
        const li = document.createElement('li');
        const tag = h.pri===1?'High':h.pri===2?'Next':'Later';
        const cls = h.pri===1?'':h.pri===2?' mid':' low';
        li.innerHTML = `<span class="dw-tag${cls}">${tag}</span><div><strong>${h.title}</strong><p>${h.detail}</p></div>`;
        list.append(li);
      });
      const highs = uniq.filter(h=>h.pri===1).length;
      scoreEl.textContent = highs ? `${highs} high-priority fix${highs>1?'es':''} first, then the rest.` : 'Start with the next-priority fixes below.';
    }
    out.hidden = false;
    track('dw_back_convert', {action:'priorities', count: uniq.length});
  }

  form.addEventListener('change', compute);
  document.getElementById('dw-audit-run')?.addEventListener('click', e => { e.preventDefault(); compute(); });
  document.getElementById('dw-audit-print')?.addEventListener('click', e => {
    e.preventDefault();
    if (out.hidden) compute();
    track('dw_back_print');
    track('dw_back_convert', {action:'print'});
    window.print();
  });
  document.getElementById('dw-audit-reset')?.addEventListener('click', e => {
    e.preventDefault();
    form.reset();
    out.hidden = true;
    list.replaceChildren();
  });
})();
