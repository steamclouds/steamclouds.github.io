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

  const onScroll = () => header.setAttribute('data-elevated', window.scrollY > 4);
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
    if (!menu.hasAttribute('data-open')) menu.setAttribute('hidden', '');
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth > 640) return;
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* =====================================================
   RELEASES (Google Apps Script)
===================================================== */
const mainBox = $('#release-main');

const PRIMARY_URL = 'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';

const OTHER_URLS = [
  'https://script.google.com/macros/s/AKfycbz3AzDmxMJTCXTY4RAwfVDcgnl8l8QAhfeL_ROsAQDAun30eV40GQxuMuz_fKhQjrbKkA/exec',
  'https://script.google.com/macros/s/AKfycbxL8m4Wtf4PG1_bocjroOyUcq66rucKFKccZvex6aERBwLUZ3V5Y9RH_rlmAOhRZOgvhA/exec',
  'https://script.google.com/macros/s/AKfycbx8lTj5CHrnTPgTXY3tYKNAoRdC-FEsOaRtLwIbcpiISNPnPn7JBVOP-Col0gJrqogp/exec'
];

const TIMEOUT_MS = 10000;

/* =====================================================
   Helpers
===================================================== */
const isExe = a => /\.exe$/i.test(a?.name || '');
const isZip = a => /\.zip$/i.test(a?.name || '');

const bestMainAsset = assets =>
  assets?.find(isExe) || assets?.find(isZip) || assets?.[0] || null;

const escapeHtml = s =>
  String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

const withTimeout = (fn, ms) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fn(c.signal).finally(() => clearTimeout(t));
};

async function fetchReleaseOnce(url) {
  return withTimeout(
    s => fetch(url,{signal:s}).then(r=>r.json()).catch(()=>null),
    TIMEOUT_MS
  );
}

function normalizeRelease(raw) {
  if (!raw) return null;
  raw = raw.release || raw.data || raw;
  const assets = Object.values(raw.assets || {});
  return {
    name: raw.name || raw.tag_name || '',
    published_at: raw.published_at || '',
    assets
  };
}

(async function populateRelease() {
  if (!mainBox) return;

  const raws = await Promise.all([PRIMARY_URL, ...OTHER_URLS].map(fetchReleaseOnce));
  const releases = raws.map(normalizeRelease).filter(Boolean);
  if (!releases.length) return;

  releases.sort((a,b)=>new Date(b.published_at)-new Date(a.published_at));
  const latest = releases[0];
  const asset = bestMainAsset(latest.assets);
  if (!asset) return;

  mainBox.innerHTML = `
    <div class="card">
      <h4>${escapeHtml(latest.name)}</h4>
      <a class="btn btn--primary" href="${asset.browser_download_url}" target="_blank" rel="noopener">
        Download ${escapeHtml(asset.name)}
      </a>
    </div>
  `;
})();

/* =====================================================
   TOOLS DATA
===================================================== */
const toolsData = [
  { title:'SteamClouds Lite', desc:'Auto-generate .lua & .manifest and add games to Steam.', img:'assets/images/scloudslite.png' },
  { title:'Steam Clouds Ultimate', desc:'All-in-one Steam unlocking toolkit.', img:'assets/images/sc_ultimate.png' },
  { title:'SpotifyPlus', desc:'Enjoy Spotify with no ads.', img:'assets/images/splus_new_ver.png' },
  { title:'All In One Downloader', desc:'Download media from popular platforms.', img:'assets/images/downloader.png' }
];

/* =====================================================
   CHANGELOG (JSON)
===================================================== */
let logsData = {};

async function loadChangelogs() {
  try {
    const res = await fetch('assets/data/changelog.json');
    logsData = await res.json();
  } catch (e) {
    console.error('[changelog]', e);
    logsData = {};
  }
}

function getLogsForTool(toolIndex) {
  return logsData[String(toolIndex)] || [];
}

function getLatestLog(toolIndex) {
  const logs = getLogsForTool(toolIndex);
  return logs.length ? logs[logs.length - 1] : null;
}


/* =====================================================
   Render tools
===================================================== */
function renderTools() {
  const grid = $('#toolsGrid');
  if (!grid) return;

  grid.innerHTML = toolsData.map((t, i) => {
    const latest = getLatestLog(i);

    return `
      <article class="tool" data-tool-index="${i}">
        
        ${latest ? `
          <button class="tool__badge" data-action="show-changelogs">
            ${escapeHtml(latest.title)}
          </button>
        ` : ''}

        <div class="tool__media">
          <img class="tool__img" src="${t.img}" alt="${escapeHtml(t.title)}">
        </div>

        <div class="tool__body">
          <h3 class="tool__title">${escapeHtml(t.title)}</h3>
          <p class="tool__desc">${escapeHtml(t.desc)}</p>

          <div class="tool__row">
            <button class="btn btn--primary" data-action="download">
              Download
            </button>

            <button class="btn btn--ghost" data-action="show-changelogs">
              View Changelogs
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}


document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="show-changelogs"]');
  if (!btn) return;

  const card = btn.closest('.tool');
  if (!card) return;

  const index = card.dataset.toolIndex;
  const logs = getLogsForTool(index);

  if (!logs.length) {
    alert('No changelog available.');
    return;
  }

  alert(
    logs.map(l =>
      `${l.title}\n${(l.items || []).map(i => '• ' + i).join('\n')}`
    ).join('\n\n')
  );
});


/* =====================================================
   BOOT
===================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  await loadChangelogs();
  renderTools();
});

