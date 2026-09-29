import { db, ref, get } from '../../shared/firebase-config.js';
import { detectVisitorGeo } from '../../shared/utilities/geo.js';
import { logAnalyticsEvent, initHeartbeat } from '../../shared/utilities/analytics.js';

let currentGeo = null;
let currentDictionary = {};

// Sanitize string helper
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// Preserve inbound URL tracking parameters
function appendURLParams(targetUrl) {
  try {
    const inboundParams = new URLSearchParams(window.location.search);
    const url = new URL(targetUrl);
    inboundParams.forEach((val, key) => {
      url.searchParams.set(key, val);
    });
    return url.toString();
  } catch (e) {
    return targetUrl;
  }
}

async function loadLocalization(langCode) {
  try {
    const res = await fetch(`../shared/localization/${langCode}.json`);
    if (!res.ok) throw new Error('Localization file missing');
    return await res.json();
  } catch (e) {
    const fallback = await fetch(`../shared/localization/en.json`);
    return await fallback.json();
  }
}

function applyLocalization(dict, geo) {
  currentDictionary = dict;
  const replaceTokens = (text) => {
    if (!text) return '';
    return text.replace(/{city}/g, escapeHTML(geo.city))
               .replace(/{country}/g, escapeHTML(geo.countryName));
  };

  document.getElementById('lang-age-title').textContent = dict.age_gate_title || 'Age Verification';
  document.getElementById('lang-age-desc').textContent = dict.age_gate_desc || '';
  document.getElementById('btn-age-confirm').textContent = dict.age_gate_confirm || 'Confirm';
  document.getElementById('btn-age-deny').textContent = dict.age_gate_deny || 'Exit';

  document.getElementById('hero-badge').textContent = dict.hero_badge || '';
  document.getElementById('hero-headline').textContent = replaceTokens(dict.hero_headline || '');
  document.getElementById('hero-subtext').textContent = replaceTokens(dict.hero_subtext || '');
  document.getElementById('hero-cta-text').textContent = dict.hero_cta || 'Continue';

  document.getElementById('offers-title').textContent = replaceTokens(dict.offers_title || '');
  document.getElementById('social-proof-title').textContent = replaceTokens(dict.social_proof_title || '');
  document.getElementById('cookie-text').textContent = dict.cookie_notice || '';
  document.getElementById('btn-cookie-accept').textContent = dict.cookie_accept || 'Accept';
}

async function loadRemoteSettings() {
  try {
    const snapshot = await get(ref(db, 'app/settings'));
    if (snapshot.exists()) {
      const settings = snapshot.val();
      if (settings.brandName) {
        document.getElementById('brand-name').textContent = settings.brandName;
        document.getElementById('footer-brand').textContent = settings.brandName;
      }
      if (settings.heroCtaUrl) {
        document.getElementById('hero-cta-btn').href = appendURLParams(settings.heroCtaUrl);
      }
    }
  } catch (err) {
    console.error("Firebase settings read failed:", err);
  }
}

async function loadOffers(geo) {
  const container = document.getElementById('offers-grid');
  try {
    const snapshot = await get(ref(db, 'offers'));
    container.innerHTML = '';

    if (!snapshot.exists()) {
      container.innerHTML = `<p class="col-span-full text-center text-slate-500">No active offers available for your location.</p>`;
      return;
    }

    const offersData = snapshot.val();
    const activeOffers = Object.keys(offersData)
      .map(id => ({ id, ...offersData[id] }))
      .filter(o => o.active !== false)
      .filter(o => !o.targetCountry || o.targetCountry === 'GLOBAL' || o.targetCountry === geo.countryCode);

    if (activeOffers.length === 0) {
      container.innerHTML = `<p class="col-span-full text-center text-slate-500">No targeted offers available.</p>`;
      return;
    }

    activeOffers.forEach(offer => {
      const destination = appendURLParams(offer.destinationUrl || '#');
      const card = document.createElement('div');
      card.className = "bg-twilight-800 border border-twilight-700/60 rounded-2xl overflow-hidden hover:border-twilight-accent/50 transition flex flex-col justify-between shadow-lg";
      card.innerHTML = `
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs bg-twilight-accent/20 text-twilight-accent px-2.5 py-1 rounded-full font-semibold uppercase">${escapeHTML(offer.badge || 'Featured')}</span>
            <span class="text-xs text-slate-400"><i class="fa-solid fa-star text-yellow-400 mr-1"></i>${escapeHTML(offer.rating || '4.9')}</span>
          </div>
          <h3 class="text-xl font-bold">${escapeHTML(offer.title)}</h3>
          <p class="text-slate-400 text-sm">${escapeHTML(offer.description)}</p>
        </div>
        <div class="p-6 pt-0">
          <a href="${destination}" data-offer-id="${offer.id}" class="offer-click-btn w-full block text-center py-3 bg-twilight-700 hover:bg-twilight-accent text-white font-semibold rounded-xl transition">
            ${escapeHTML(offer.ctaText || 'Claim Offer')}
          </a>
        </div>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll('.offer-click-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const offerId = e.currentTarget.getAttribute('data-offer-id');
        logAnalyticsEvent('offer_click', { offerId, country: geo.countryCode });
      });
    });

  } catch (err) {
    console.error("Failed loading offers:", err);
    container.innerHTML = `<p class="col-span-full text-center text-red-400">Failed to load content.</p>`;
  }
}

async function loadSocialMetrics(geo) {
  try {
    const realtimeSnap = await get(ref(db, 'analytics/realtime'));
    let activeCount = 1;
    if (realtimeSnap.exists()) {
      const now = Date.now();
      const sessions = realtimeSnap.val();
      activeCount = Object.values(sessions).filter(s => (now - s.lastSeen) < 60000).length || 1;
    }
    document.getElementById('stat-active').textContent = activeCount.toString();
    document.getElementById('stat-daily').textContent = (activeCount * 14 + 102).toString();
    document.getElementById('stat-region').textContent = geo.countryCode + " - 98.4%";
  } catch (e) {
    document.getElementById('stat-active').textContent = "12";
    document.getElementById('stat-daily').textContent = "410";
    document.getElementById('stat-region').textContent = "99.1%";
  }
}

function initAgeGate() {
  const ageVerified = localStorage.getItem('ep_age_verified');
  const modal = document.getElementById('age-modal');
  if (ageVerified === 'true') {
    modal.classList.add('hidden');
  } else {
    modal.classList.remove('hidden');
  }

  document.getElementById('btn-age-confirm').addEventListener('click', () => {
    localStorage.setItem('ep_age_verified', 'true');
    modal.classList.add('hidden');
    logAnalyticsEvent('age_gate_passed');
  });

  document.getElementById('btn-age-deny').addEventListener('click', () => {
    window.location.href = "https://www.google.com";
  });
}

function initCookieConsent() {
  const consent = localStorage.getItem('ep_cookie_consent');
  const banner = document.getElementById('cookie-banner');
  if (!consent) {
    banner.classList.remove('hidden');
    banner.classList.add('flex');
  }
  document.getElementById('btn-cookie-accept').addEventListener('click', () => {
    localStorage.setItem('ep_cookie_consent', 'true');
    banner.classList.add('hidden');
  });
}

// Main Initialization Sequence
document.addEventListener('DOMContentLoaded', async () => {
  initAgeGate();
  initCookieConsent();

  currentGeo = await detectVisitorGeo();
  document.getElementById('detected-location-badge').textContent = `${currentGeo.city}, ${currentGeo.countryCode}`;

  const dictionary = await loadLocalization(currentGeo.language);
  applyLocalization(dictionary, currentGeo);

  await loadRemoteSettings();
  await loadOffers(currentGeo);
  await loadSocialMetrics(currentGeo);

  initHeartbeat(currentGeo);
  logAnalyticsEvent('page_view', {
    country: currentGeo.countryCode,
    city: currentGeo.city,
    language: currentGeo.language
  });

  document.getElementById('hero-cta-btn').addEventListener('click', () => {
    logAnalyticsEvent('cta_click', { country: currentGeo.countryCode });
  });
});
