/* Basic, opt-in GA4 integration; no analytics requests before consent. */
(() => {
  'use strict';
  if (window.SEOMeasurement) return;
  const cfg = window.SEO_MEASUREMENT_CONFIG || {};
  const id = /^G-[A-Z0-9]{5,20}$/.test(cfg.measurementId || '') ? cfg.measurementId : null;
  let granted = false;
  let initialized = false;
  let stopped = false;
  const status = () => ({configured: !!id, consent: granted, initialized, reloadRequired: stopped});
  const safeEvents = new Set(Object.keys(cfg.events || {}));
  const allowed = new Set(cfg.parameterKeys || []);
  function track(name, parameters = {}) {
    if (!safeEvents.has(name)) return;
    const data = {site_key:cfg.siteKey, component:cfg.component, experiment_id:cfg.experimentId, funnel_stage:cfg.events[name]};
    Object.entries(parameters).forEach(([key,value]) => {
      if (allowed.has(key) && /^[a-z0-9_]{1,40}$/.test(String(value))) data[key] = String(value);
    });
    window.dispatchEvent(new CustomEvent('seo:measurement', {detail: {name, parameters: data, sent: !!(id && granted && initialized && !stopped)}}));
    if (id && granted && initialized && !stopped && typeof window.gtag === 'function') {
      window.gtag('event', name, {...data, send_to: id});
    }
  }
  function storage(value) {
    const key = 'seo_analytics_choice_v1:' + cfg.siteKey;
    try { if (value !== undefined) localStorage.setItem(key, value); return localStorage.getItem(key); }
    catch (_) { return null; }
  }
  function initialize() {
    if (!id || cfg.mode !== 'standalone' || initialized || stopped) return;
    // An unknown existing Google installation must be reconciled, never duplicated.
    if (typeof window.gtag === 'function' || document.querySelector('script[src*="googletagmanager.com/"]')) {
      document.documentElement.dataset.seoAnalyticsConflict = 'true';
      return;
    }
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    window.gtag('consent', 'update', {analytics_storage:'granted'});
    window.gtag('js', new Date());
    // Never include query strings, fragments or referrer query strings in GA payloads.
    const location = window.location.origin + window.location.pathname;
    let referrer = '';
    try { const ref = new URL(document.referrer); referrer = ref.origin + ref.pathname; } catch (_) {}
    window.gtag('config', id, {page_location:location, page_referrer:referrer, allow_google_signals:false, allow_ad_personalization_signals:false});
    const tag = document.createElement('script');
    tag.async = true; tag.id = 'seo-google-tag';
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.append(tag);
  }
  function choose(value) {
    granted = value === 'granted'; storage(granted ? 'granted' : 'denied');
    if (granted) initialize();
    else if (initialized) {
      window['ga-disable-' + id] = true;
      window.gtag('consent','update',{analytics_storage:'denied'});
      stopped = true;
    }
    document.querySelector('#seo-analytics-panel')?.setAttribute('hidden','');
    document.querySelector('#seo-analytics-status').textContent = granted && !stopped ? 'Optional analytics enabled.' : 'Optional analytics disabled. Reload after changing a previous choice.';
  }
  // A host-owned CMP may explicitly bridge consent on sites with an existing tag.
  // Never infer consent from the presence of gtag, cookies, or a configured ID.
  function setExternalConsent(value) {
    if (cfg.mode !== 'external') return;
    granted = value === true;
    initialized = granted && typeof window.gtag === 'function';
  }
  window.SEOMeasurement = Object.freeze({track, status, setExternalConsent});
  document.addEventListener('DOMContentLoaded', () => {
    const settings = document.querySelector('#seo-analytics-settings');
    const panel = document.querySelector('#seo-analytics-panel');
    if (!id || cfg.mode !== 'standalone' || !settings || !panel) return;
    settings.hidden = false;
    settings.addEventListener('click', () => {panel.hidden = false; panel.querySelector('button').focus();});
    panel.querySelectorAll('[data-analytics-choice]').forEach(button => button.addEventListener('click', () => {choose(button.dataset.analyticsChoice); settings.focus();}));
    panel.addEventListener('keydown', e => {if(e.key === 'Escape'){panel.hidden=true;settings.focus();}});
    if (storage() === 'granted') {granted = true; initialize();}
    else if (storage() !== 'denied') panel.hidden = false;
  }, {once:true});
})();
