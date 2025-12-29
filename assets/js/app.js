/* =====================================================
   Tiny helpers
===================================================== */
'use strict';

const $  = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.prototype.slice.call(root.querySelectorAll(s));

/* =====================================================
   Header elevate
===================================================== */
(function elevateHeader() {
  const header = $('[data-elevate]');
  if (!header) return;

  const onScroll = () => {
    header.setAttribute('data-elevated', window.scrollY > 4);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* =====================================================
   Collapsible mobile menu
===================================================== */
(function mobileMenu() {
  const btn  = $('#menuToggle');
  const menu = $('#menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));

    if (menu.hasAttribute('hidden')) menu.removeAttribute('hidden');
    menu.toggleAttribute('data-open');

    if (!menu.hasAttribute('data-open')) {
      menu.setAttribute('hidden', '');
    }
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth > 640) return;

    if (
      !menu.contains(e.target) &&
      !btn.contains(e.target) &&
      !menu.hasAttribute('hidden')
    ) {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* =====================================================
   RELEASES (Google Apps Script)
===================================================== */
const releaseLayout = $('.releases-layout');
const mainBox = $('#release-main');
const altBox  = $('#release-alt');

const PRIMARY_URL = 'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';

const OTHER_URLS = [
  'https://script.google.com/macros/s/AKfycbz3AzDmxMJTCXTY4RAwfVDcgnl8l8QAhfeL_ROsAQDAun30eV40GQxuMuz_fKhQjrbKkA/exec',
  'https://script.google.com/macros/s/AKfycbxL8m4Wtf4PG1_bocjroOyUcq66rucKFKccZvex6aERBwLUZ3V5Y9RH_rlmAOhRZOgvhA/exec',
  'https://script.google.com/macros/s/AKfycbx8lTj5CHrnTPgTXY3tYKNAoRdC-FEsOaRtLwIbcpiISNPnPn7JBVOP-Col0gJrqogp/exec'
];

const OTHER_LIST = OTHER_URLS.filter(Boolean);
const TIMEOUT_MS = 10000;

/* =====================================================
   Release helpers
===================================================== */
function isZip(a) {
  return /\.zip$/i.test(a?.name || '');
}

function isExe(a) {
  return /\.exe$/i.test(a?.name || '');
}

function bestMainAsset(assets) {
  if (!Array.isArray(assets) || !assets.length) return null;
  return assets.find(isExe) || assets.find(isZip) || assets[0];
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function toLocalDateStr(iso) {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/* =====================================================
   Fetch helpers
===================================================== */
function withTimeout(fn, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return fn(controller.signal).finally(() => clearTimeout(timer));
}

function fetchReleaseOnce(url) {
  return withTimeout(signal =>
    fetch(url, { signal })
      .then(r => r.text())
      .then(text => JSON.parse(text))
      .catch(err => {
        console.error('[fetchReleaseOnce]', url, err);
        return null;
      }),
    TIMEOUT_MS
  );
}

/* =====================================================
   Normalize release
===================================================== */
function normalizeRelease(raw) {
  if (!raw) return null;

  if (Array.isArray(raw)) raw = raw[0];
  if (raw.release) raw = raw.release;
  if (raw.data) raw = raw.data;

  if (!raw || typeof raw !== 'object') return null;

  const assets = Object.values(raw.assets || {}).map(a => ({
    name: a.name || '',
    size: a.size || 0,
    browser_download_url: a.browser_download_url || a.url || '#'
  }));

  return {
    name: raw.name || raw.tag_name || '',
    tag: raw.tag_name || '',
    published_at: raw.published_at || new Date().toISOString(),
    assets
  };
}

/* =====================================================
   Cache & fetch all
===================================================== */
const releaseCache = { latest: null, ts: 0 };

async function fetchAllReleases() {
  if (Date.now() - releaseCache.ts < 60000) {
    return releaseCache.latest;
  }

  const raws = await Promise.all(
    [PRIMARY_URL, ...OTHER_LIST].map(fetchReleaseOnce)
  );

  const releases = raws
    .map(normalizeRelease)
    .filter(Boolean)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  releaseCache.latest = releases[0] || null;
  releaseCache.ts = Date.now();
  return releaseCache.latest;
}

/* =====================================================
   Populate release panel
===================================================== */
(async function populateReleasePanels() {
  if (!mainBox) return;

  const latest = await fetchAllReleases();
  if (!latest) return;

  const asset = bestMainAsset(latest.assets);
  if (!asset) return;

  mainBox.innerHTML = `
    <div class="card">
      <h4>${escapeHtml(latest.name)}</h4>
      <p class="muted">${toLocalDateStr(latest.published_at)}</p>
      <a class="btn btn--primary"
         href="${asset.browser_download_url}"
         target="_blank"
         rel="noopener">
        Download ${escapeHtml(asset.name)} (${formatFileSize(asset.size)})
      </a>
    </div>
  `;
})();

/* =====================================================
   TOOLS DATA
===================================================== */
const toolsData = [
  {
    title: 'SteamClouds Lite',
    desc: 'SteamClouds Lite is a lightweight tool that auto-generates .lua and .manifest files and adds games to your Steam library.',
    img: 'assets/images/scloudslite.png',
    source: 'primary'
  },
  {
    title: 'Steam Clouds Ultimate',
    desc: 'All-in-one toolkit for effortless Steam game unlocking.',
    img: 'assets/images/sc_ultimate.png',
    source: 'other1'
  },
  {
    title: 'SpotifyPlus',
    desc: 'Enjoy Spotify with no ads, no limits.',
    img: 'assets/images/splus_new_ver.png',
    source: 'other2'
  },
  {
    title: 'All In One Downloader',
    desc: 'Download videos and audio from top platforms.',
    img: 'assets/images/downloader.png',
    source: 'other3'
  }
];

/* =====================================================
   Render tools
===================================================== */
function renderTools() {
  const grid = $('#toolsGrid');
  if (!grid) return;

  grid.innerHTML = toolsData.map((t, i) => `
    <article class="tool" data-tool-index="${i}">
      <div class="tool__media">
        <img class="tool__img" src="${t.img}" alt="${escapeHtml(t.title)}">
      </div>
      <div class="tool__body">
        <h3 class="tool__title">${escapeHtml(t.title)}</h3>
        <p class="tool__desc">${escapeHtml(t.desc)}</p>
        <div class="tool__row">
          <button class="btn btn--primary" data-action="download">Download</button>
        </div>
      </div>
    </article>
  `).join('');
}

/* =====================================================
   Boot
===================================================== */
document.addEventListener('DOMContentLoaded', renderTools);
