/* =====================================================
   Tiny helpers
===================================================== */
'use strict';
const $  = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

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
    if (!menu.contains(e.target) && !btn.contains(e.target) && !menu.hasAttribute('hidden')) {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* =====================================================
   RELEASES (GAS)
===================================================== */
// Layout opsional
const releaseLayout = $('.releases-layout');
const mainBox  = $('#release-main'); // kiri
const altBox   = $('#release-alt');  // kanan

const PRIMARY_URL = 'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';

const OTHER_URLS = [
  'https://script.google.com/macros/s/AKfycbz3AzDmxMJTCXTY4RAwfVDcgnl8l8QAhfeL_ROsAQDAun30eV40GQxuMuz_fKhQjrbKkA/exec', // other1
  'https://script.google.com/macros/s/AKfycbxL8m4Wtf4PG1_bocjroOyUcq66rucKFKccZvex6aERBwLUZ3V5Y9RH_rlmAOhRZOgvhA/exec',
  'https://script.google.com/macros/s/AKfycbx8lTj5CHrnTPgTXY3tYKNAoRdC-FEsOaRtLwIbcpiISNPnPn7JBVOP-Col0gJrqogp/exec'
].filter(Boolean);


const OTHER_LIST = Array.isArray(OTHER_URLS)
  ? OTHER_URLS.filter(u => typeof u === 'string' && u.trim())
  : (typeof OTHER_URLS === 'string' && OTHER_URLS.trim() ? [OTHER_URLS.trim()] : []);

const TIMEOUT_MS = 10000;

/* Helpers rilis */
function isZip(a) { const n = (a && a.name || '').toLowerCase(); return /\.zip$/.test(n); }
function isExe(a) { const n = (a && a.name || '').toLowerCase(); return /\.exe$/.test(n); }

function bestMainAsset(assets) {
  if (!Array.isArray(assets) || !assets.length) return null;
  return assets.find(isExe) || assets.find(isZip) || assets[0];
}

function escapeHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function toLocalDateStr(iso) {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function withTimeout(pf, ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return pf(controller.signal).finally(() => clearTimeout(t));
}

function fetchReleaseOnce(url) {
  return withTimeout((signal) =>
    fetch(url, { signal })
      .then(async r => {
        const text = await r.text();
        if (!r.ok) throw new Error('HTTP ' + r.status);
        try { return JSON.parse(text); } catch { throw new Error('Invalid JSON'); }
      })
      .catch(e => { console.error('[fetchReleaseOnce]', url, e.message || e); return null; })
  , TIMEOUT_MS);
}

function normalizeRelease(raw, sourceName) {
  if (!raw) return null;
  if (Array.isArray(raw)) raw = raw[0];
  if (raw && typeof raw === 'object' && raw.release) raw = raw.release;
  if (raw && typeof raw === 'object' && raw.data)    raw = raw.data;
  if (!raw || typeof raw !== 'object') return null;

  let assets = Array.isArray(raw.assets) ? raw.assets
            : (raw.assets && typeof raw.assets === 'object' ? Object.values(raw.assets) : []);
  assets = (assets || []).map(a => ({
    name: a?.name || '',
    size: a?.size ?? a?.size_in_bytes ?? 0,
    browser_download_url: a?.browser_download_url || a?.download_url || a?.url || '#'
  }));

  return {
    source: sourceName || 'other',
    name: raw.name || raw.tag_name || raw.title || '',
    tag: raw.tag_name || raw.version || '',
    published_at: raw.published_at || raw.created_at || raw.published || raw.date || new Date().toISOString(),
    assets
  };
}

function pickLatest(list) {
  return (list || []).filter(Boolean)
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))[0] || null;
}

function dedupeByAssetName(list) {
  const seen = new Map(), out = [];
  const sorted = [...(list || [])].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  for (const r of sorted) {
    const assets = Array.isArray(r.assets) ? r.assets : [];
    let unique = true;
    for (const a of assets) {
      const key = (a?.name || '').toLowerCase(); if (!key) continue;
      if (seen.has(key)) { unique = false; break; }
    }
    for (const a of assets) {
      const key = (a?.name || '').toLowerCase(); if (key && !seen.has(key)) seen.set(key, r);
    }
    if (unique) out.push(r);
  }
  return out;
}

/* Cache kecil biar nggak fetch berulang-ulang */
const releaseCache = { latest: null, list: null, ts: 0 };

async function fetchAllReleases() {
  const now = Date.now();
  if (releaseCache.latest && (now - releaseCache.ts) < 60_000) {
    return { latest: releaseCache.latest, list: releaseCache.list };
  }
  const tasks = [fetchReleaseOnce(PRIMARY_URL), ...OTHER_LIST.map(u => fetchReleaseOnce(u))];
  const raws  = await Promise.all(tasks);
  const norm  = raws.map((r, i) => normalizeRelease(r, i === 0 ? 'primary' : ('other-' + i))).filter(Boolean);
  const clean = dedupeByAssetName(norm);
  releaseCache.latest = pickLatest(clean);
  releaseCache.list   = clean;
  releaseCache.ts     = now;
  return { latest: releaseCache.latest, list: releaseCache.list };
}

/* Isi panel opsional jika ada */
async function populateReleasePanels() {
  if (!mainBox && !altBox) return;
  const { latest, list } = await fetchAllReleases();

  if (mainBox) {
    if (latest) {
      const a = bestMainAsset(latest.assets);
      mainBox.innerHTML = `
        <div class="card">
          <h4 style="margin:0 0 .5rem">${escapeHtml(latest.name || latest.tag || 'Latest Release')}</h4>
          <p class="muted" style="margin:.25rem 0">${toLocalDateStr(latest.published_at)}</p>
          ${
            a
              ? `<a class="btn btn--primary" href="${a.browser_download_url}" target="_blank" rel="noopener">
                   Download ${escapeHtml(a.name)} (${formatFileSize(a.size)})
                 </a>`
              : `<span class="muted">No assets found</span>`
          }
        </div>`;
    } else {
      mainBox.innerHTML = `<div class="card"><p class="muted">No release found.</p></div>`;
    }
  }

  if (altBox) {
    const others = (list || []).slice(0, 5).map(r => {
      const a = bestMainAsset(r.assets);
      return `
        <li>
          <div><strong>${escapeHtml(r.name || r.tag || 'Release')}</strong></div>
          <small class="muted">${toLocalDateStr(r.published_at)}</small><br>
          ${ a ? `<a class="btn btn--ghost" href="${a.browser_download_url}" target="_blank" rel="noopener">Download</a>` : '' }
        </li>`;
    }).join('');
    altBox.innerHTML = `<div class="card"><ul style="margin:0;padding-left:1rem;display:grid;gap:.5rem">${others || '<li class="muted">—</li>'}</ul></div>`;
  }
}
populateReleasePanels().catch(console.error);

/* =====================================================
   TOOLS + CHANGELOGS VIEW
===================================================== */
// Data Tools (judul, href, img tetap; deskripsi sudah disesuaikan)
const toolsData = [
  {
    title: 'SteamClouds',
    desc: 'SteamClouds is a utility designed to manage libraries for Steam Manifest Gen.',
    href: '#',
    img: 'assets/images/Steamclouds.png',
    source: 'primary'
  },
  {
    title: 'Steam Clouds Ultimate',
    desc: 'Steam Clouds Ultimate is your all-in-one toolkit for unlocking Steam games with ease. It auto generates .lua and .manifest files, adds games directly to your library, and manages everything with a sleek, intuitive interface, no manual setup required.',
    href: '#',
    img: 'assets/images/Steammanifestgen.png',
    source: 'other1'
  },
  {
    title: 'SpotifyPlus',
    desc: 'SpotifyPlus lets you enjoy Spotify the way it should be no ads, no limits, just music.',
    href: '#',
    img: 'assets/images/Spotifyplus.png',
    source: 'other2'
  },
  {
    title: 'All In One Downloader',
    desc: 'Download videos and audio from top platforms like YouTube, TikTok, X, and Spotify.',
    href: '#',
    img: 'assets/images/downloader.png',
    source: 'other3'
  }
];

const state = { mode: 'tools', currentToolIndex: null };

const logsData = {
  0: [
    { title: 'v1.0', desc: '- Initial public release\n- Core functionality for import lua files\n- Core fungtionality for manage library\n - Core functionality for steamclouds tools', href: '#' },
    { title: 'v1.1', desc: '- Improve Add Games button\n- Removed Install SteamTools\n- Always Unlock Automatically\n- The dashboard tutorial has been updated.\n- Improving stability by fixing bugs and errors.', href: '#' },
    { title: 'v1.2', desc: '- Resolving tools issues\n- Added .manifest support\n- Added Link Manifest to App\n- Code optimized for better performance', href: '#' },
    { title: 'v1.3', desc: '- Improve the program\n- Resolving tools issues\n- Removed Install Steamclouds Plugins Feature', href: '#' },
    { title: 'v1.4', desc: '- Improve the program\n- Resolving tools issues', href: '#' },
    { title: 'v1.5', desc: '- Resolving tools issues', href: '#' }
  ],
  1: [
    { title: 'v1.0', desc: '- Initial public release', href: '#' },
    { title: 'v1.1', desc: '- Rebranded as Steam Clouds Ultimate\n- Introduced “Add to Library” toggle\n- Added “Always Unlock” toggle for persistent access\n- Launched Library Manager for streamlined organization\n- Enabled Drag & Drop and File Browser for effortless game import\n- Upgraded tool performance for a smoother experience', href: '#'},
    { title: 'v1.2', desc: '- Added Custom Steam Path', href: '#' }
  ],
  2: [
    { title: 'v1.1', desc: '- Initial public release', href: '#' },
    { title: 'v1.2', desc: '- Added Auto Check Update\n- Added Spotify Downloader\n- Added Youtube Downloader\n- Added Tiktok Downloader\n- Resolving tools issues', href: '#' },
    { title: 'v1.3', desc: '- Resolving tools issues', href: '#' },
    { title: 'v1.4', desc: '- Resolving tools issues\n- Removed Spotify, Youtube & Tiktok Downloader\n- Improving the UI and optimizing the program\n- Optimizing Spotify Premium features and performance\n- Added Multi Language feature (ID, EN, DE, ES)', href: '#' },
    { title: 'v1.5', desc: '- Resolving tools issues', href: '#' }
  ],
  3: [
    { title: 'v1.0', desc: '- Initial public release', href: '#' }
  ]
};

function cardToolbar(sourceTag) {
  const srcAttr = Array.isArray(sourceTag) ? sourceTag.join(',') : (sourceTag || '');
  return `
    <div class="tool__row">
      <a class="btn btn--primary" href="#" data-action="download" data-src="${srcAttr}">Download</a>
      <button class="btn btn--ghost" type="button" data-action="show-changelogs">View Changelogs</button>
    </div>`;
}

function getChangelogLimit() {
  return window.innerWidth < 768 ? 4 : 6;
}

window.addEventListener('resize', () => {
  if (state.mode === 'changelogs' && state.currentToolIndex != null) {
    renderChangelogs(state.currentToolIndex);
  }
});

function getLogsForTool(toolIndex) {
  const title = (toolsData[toolIndex]?.title || '').toLowerCase();

  if (logsData && !Array.isArray(logsData) && typeof logsData === 'object') {
    const byIndex = logsData[toolIndex] ?? logsData[String(toolIndex)];
    const byTitle = logsData[toolsData[toolIndex]?.title] ?? logsData[title] ?? null;
    return Array.isArray(byIndex) ? byIndex
         : Array.isArray(byTitle) ? byTitle
         : [];
  }

  if (Array.isArray(logsData)) {
    return logsData.filter(l => (
      l.tool === toolIndex || l.toolIndex === toolIndex ||
      (typeof l.tool === 'string' && l.tool.toLowerCase() === title)
    ));
  }

  return [];
}

function getLatestLog(toolIndex) {
  const logs = getLogsForTool(toolIndex);
  return (logs && logs.length) ? logs[logs.length - 1] : null;
}

function renderTools() {
  const grid = $('#toolsGrid');
  if (!grid) return;

  grid.innerHTML = toolsData.map((t, i) => {
    const latestLog = getLatestLog(i);
    const versionBadge = latestLog
      ? `<button class="tool__badge" data-action="show-changelogs" title="View changelogs">
           ${escapeHtml(latestLog.title)}
         </button>`
      : '';

    return `
      <article class="tool" data-tool-index="${i}" data-reveal>
        ${versionBadge}
        <div class="tool__media">
          <img class="tool__img" src="${t.img}" alt="${escapeHtml(t.title)}" loading="lazy"/>
        </div>
        <div class="tool__body">
          <h3 class="tool__title">${escapeHtml(t.title)}</h3>
          <p class="tool__desc">${escapeHtml(t.desc)}</p>
          ${cardToolbar(t.source)}
        </div>
      </article>
    `;
  }).join('');

  revealInView(grid);
  prepareImages(grid);
  state.mode = 'tools';

  markNewBadges().catch(console.error);
}


async function fetchReleasesFromSources(tags) {
  const urls = new Set();
  const arr = Array.isArray(tags) ? tags
            : (typeof tags === 'string' && tags ? tags.split(',') : []);

  if (!arr.length) {
    urls.add(PRIMARY_URL);
    OTHER_LIST.forEach(u => urls.add(u));
  } else {
    for (const raw of arr) {
      const t = String(raw).trim().toLowerCase();

      if (t === 'primary') {
        urls.add(PRIMARY_URL);
      } else if (t === 'other') {
        OTHER_LIST.forEach(u => urls.add(u));
      } else if (/^other(\d+)$/.test(t)) {
        const idx = Number(t.match(/^other(\d+)$/)[1]) - 1;
        if (OTHER_LIST[idx]) urls.add(OTHER_LIST[idx]);
      } else if (/^url:/.test(t)) {
        const u = raw.slice(4).trim();
        if (/^https?:\/\//i.test(u)) urls.add(u);
      }
    }

    if (!urls.size) {
      urls.add(PRIMARY_URL);
      OTHER_LIST.forEach(u => urls.add(u));
    }
  }

  const raws = await Promise.all([...urls].map(u => fetchReleaseOnce(u)));
  const norm  = raws.map((r, i) => normalizeRelease(r, i === 0 ? 'src0' : 'src' + i)).filter(Boolean);
  const clean = dedupeByAssetName(norm);
  return { latest: pickLatest(clean), list: clean };
}

/* Badge "New" (tanpa versi) */
const NEW_DAYS = 10;
const perSourceCache = new Map();

async function getLatestForSourceTag(tag) {
  if (typeof tag === 'string' && /^url:/i.test(tag)) return null;
  if (perSourceCache.has(tag)) return perSourceCache.get(tag);
  const { latest } = await fetchReleasesFromSources(tag);
  perSourceCache.set(tag, latest);
  return latest;
}

async function markNewBadges() {
  const now = Date.now();

  await Promise.all(toolsData.map(async (t, i) => {
    const latest = await getLatestForSourceTag(t.source || '');
    if (!latest) return;

    const ts = new Date(latest.published_at || latest.date || Date.now()).getTime();
    const ageDays = (now - ts) / 86400000;

    if (ageDays <= NEW_DAYS) {
      const card = document.querySelector(`.tool[data-tool-index="${i}"]`);
      if (!card) return;
      if (card.querySelector('.tool__badge--new')) return;

      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'tool__badge tool__badge--new';
      el.dataset.action = 'show-changelogs';
      el.title = 'View changelogs';
      el.textContent = 'New';
      card.appendChild(el);
    }
  }));
}

/* =====================================================
   Changelogs view
===================================================== */
function getChangelogLimit() {
  return window.innerWidth < 768 ? 4 : 6;
}

async function renderChangelogs(toolIndex) {
  const grid = $('#toolsGrid');
  if (!grid) return;

  state.currentToolIndex = toolIndex;

  const toolTitle = toolsData[toolIndex]?.title || 'Changelogs';
  const latest    = getLatestLog(toolIndex);
  const ver       = latest ? ` — ${escapeHtml(latest.title)}` : '';
  const rawItems  = getLogsForTool(toolIndex);
  const limit     = getChangelogLimit();

  const items = (rawItems || []).slice(-limit).reverse();

  grid.innerHTML = `
    <div class="grid-span-all" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3 class="section__title" style="margin:0">Changelogs — ${escapeHtml(toolTitle)}${ver}</h3>
      <button class="btn btn--ghost" type="button" data-action="back-tools">Back</button>
    </div>
    ${
      items.length
        ? items.map(l => `
            <article class="tool" data-reveal>
              ${l.img ? `
                <div class="tool__media">
                  <img class="tool__img" src="${l.img}" alt="${escapeHtml(l.title || 'Changelog')}" loading="lazy">
                </div>` : ''
              }
              <div class="tool__body">
                <h3 class="tool__title">${escapeHtml(l.title || 'Changelog')}</h3>
                <p class="tool__desc">${escapeHtml(l.desc || '')}</p>
              </div>
            </article>
          `).join('')
        : `
          <article class="tool" data-reveal>
            <div class="tool__body">
              <h3 class="tool__title">No changelog</h3>
              <p class="tool__desc">Belum ada catatan rilis untuk ${escapeHtml(toolTitle)}.</p>
            </div>
          </article>
        `
    }
  `;

  revealInView(grid);
  prepareImages(grid);
  state.mode = 'changelogs';
}

/* =====================================================
   Search filter
===================================================== */
(function wireSearch() {
  const input = $('#searchInput');
  const grid  = $('#toolsGrid');
  if (!input || !grid) return;

  function filter() {
    const q = input.value.trim().toLowerCase();
    $$('.tool', grid).forEach(card => {
      const title = $('.tool__title', card)?.textContent.toLowerCase() || '';
      const desc  = $('.tool__desc',  card)?.textContent.toLowerCase()  || '';
      const hit   = title.includes(q) || desc.includes(q);
      card.style.display = hit ? '' : 'none';
    });
  }

  input.addEventListener('input', filter);
})();

/* =====================================================
   Grid behaviors (reveal & images)
===================================================== */
function revealInView(root) {
  const revealEls = $$('[data-reveal]', root);
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        target.style.transform = 'translateY(0)';
        target.style.opacity   = '1';
        io.unobserve(target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  revealEls.forEach(el => {
    el.style.transform  = 'translateY(8px)';
    el.style.opacity    = '0';
    el.style.transition = 'transform 420ms ease, opacity 420ms ease';
    io.observe(el);
  });
}

function prepareImages(root) {
  $$('.tool__img', root).forEach(img => {
    const ok = () => img.classList.add('is-loaded');
    const ko = () => {
      img.classList.add('is-error', 'is-loaded');
      if (!img.dataset.fallbackUsed) {
        img.dataset.fallbackUsed = '1';
        img.src = img.dataset.fallback || 'https://via.placeholder.com/800x450?text=Image+unavailable';
      }
    };
    if (img.complete) {
      (img.naturalWidth > 0 ? ok : ko)();
    } else {
      img.addEventListener('load', ok, { once: true });
      img.addEventListener('error', ko, { once: true });
    }
  });
}

/* =====================================================
   Delegated grid actions
===================================================== */
const gridRoot = $('#toolsGrid');
if (gridRoot) {
  gridRoot.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');

    if (action === 'download') {
      e.preventDefault();
      btn.blur();

      const prev    = btn.textContent;
      const srcTags = (btn.dataset.src || '').trim();

      const direct = srcTags
        .split(',')
        .map(s => s.trim())
        .find(s => /^url:/i.test(s));

      if (direct) {
        const href = direct.replace(/^url:\s*/i, '');
        if (href) window.open(href, '_blank', 'noopener');
        return;
      }

      btn.disabled   = true;
      btn.textContent = 'Downloading...';

      try {
        const { latest } = await fetchReleasesFromSources(srcTags);
        if (!latest) { alert('No release found'); return; }
        const a = bestMainAsset(latest.assets);
        if (!a)     { alert('No downloadable asset found'); return; }
        window.location.href = a.browser_download_url;
      } catch (err) {
        console.error(err);
        alert('Failed to fetch release.');
      } finally {
        btn.textContent = prev;
        btn.disabled = false;
      }
      return;
    }

    if (action === 'show-changelogs') {
      e.preventDefault();
      const card = btn.closest('.tool');
      const idx  = Number(card?.dataset.toolIndex ?? card?.getAttribute('data-tool-index'));
      await renderChangelogs(Number.isFinite(idx) ? idx : 0);
      return;
    }

    if (action === 'back-tools') {
      e.preventDefault();
      renderTools();
      markNewBadges().catch(console.error);
      return;
    }
  });
}

/* =====================================================
   Reduced motion
===================================================== */
(function respectMotion() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) {
    $$('[data-reveal]').forEach(el => {
      el.style.transition = 'none';
      el.style.transform  = 'none';
      el.style.opacity    = '1';
    });
  }
})();

/* =====================================================
   Boot
===================================================== */
renderTools();



