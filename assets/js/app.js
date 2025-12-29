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
    if (!menu.contains(e.target) && !btn.contains(e.target) && !menu.hasAttribute('hidden')) {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* =====================================================
   RELEASES (GAS)
===================================================== */
const releaseLayout = $('.releases-layout');
const mainBox  = $('#release-main');
const altBox   = $('#release-alt');

const PRIMARY_URL = 'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';

const OTHER_URLS = [
  'https://script.google.com/macros/s/AKfycbz3AzDmxMJTCXTY4RAwfVDcgnl8l8QAhfeL_ROsAQDAun30eV40GQxuMuz_fKhQjrbKkA/exec',
  'https://script.google.com/macros/s/AKfycbxL8m4Wtf4PG1_bocjroOyUcq66rucKFKccZvex6aERBwLUZ3V5Y9RH_rlmAOhRZOgvhA/exec',
  'https://script.google.com/macros/s/AKfycbx8lTj5CHrnTPgTXY3tYKNAoRdC-FEsOaRtLwIbcpiISNPnPn7JBVOP-Col0gJrqogp/exec'
].filter(Boolean);

const OTHER_LIST = Array.isArray(OTHER_URLS)
  ? OTHER_URLS.filter(function (u){ return typeof u === 'string' && u.trim(); })
  : (typeof OTHER_URLS === 'string' && OTHER_URLS.trim() ? [OTHER_URLS.trim()] : []);

const TIMEOUT_MS = 10000;

/* Helpers rilis */
function isZip(a){ var n = (a && a.name || '').toLowerCase(); return /\.zip$/.test(n); }
function isExe(a){ var n = (a && a.name || '').toLowerCase(); return /\.exe$/.test(n); }

function bestMainAsset(assets) {
  if (!Array.isArray(assets) || !assets.length) return null;
  return assets.find(isExe) || assets.find(isZip) || assets[0];
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  var k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  var i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function toLocalDateStr(iso) {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function withTimeout(pf, ms) {
  var controller = new AbortController();
  var t = setTimeout(function(){ controller.abort(); }, ms);
  return pf(controller.signal).finally(function(){ clearTimeout(t); });
}

function fetchReleaseOnce(url) {
  return withTimeout(function(signal){
    return fetch(url, { signal: signal })
    .then(function(r){ return r.text().then(function(text){ if(!r.ok) throw new Error('HTTP '+r.status); try{ return JSON.parse(text);}catch(e){ throw new Error('Invalid JSON'); } }); })
    .catch(function(e){ console.error('[fetchReleaseOnce]', url, e && (e.message || e)); return null; });
  }, TIMEOUT_MS);
}

function normalizeRelease(raw, sourceName) {
  if (!raw) return null;
  if (Array.isArray(raw)) raw = raw[0];
  if (raw && typeof raw === 'object' && raw.release) raw = raw.release;
  if (raw && typeof raw === 'object' && raw.data)    raw = raw.data;
  if (!raw || typeof raw !== 'object') return null;

  var assets = Array.isArray(raw.assets) ? raw.assets
            : (raw.assets && typeof raw.assets === 'object' ? Object.values(raw.assets) : []);
  assets = (assets || []).map(function(a){
    return {
      name: (a && a.name) || '',
      size: (a && (a.size != null ? a.size : a.size_in_bytes)) || 0,
      browser_download_url: (a && (a.browser_download_url || a.download_url || a.url)) || '#'
    };
  });

  return {
    source: sourceName || 'other',
    name: raw.name || raw.tag_name || raw.title || '',
    tag: raw.tag_name || raw.version || '',
    published_at: raw.published_at || raw.created_at || raw.published || raw.date || new Date().toISOString(),
    assets: assets
  };
}

function pickLatest(list) {
  return (list || []).filter(Boolean)
    .sort(function(a,b){ return new Date(b.published_at || 0) - new Date(a.published_at || 0); })[0] || null;
}

function dedupeByAssetName(list) {
  var seen = new Map(), out = [];
  var sorted = [].concat(list || []).sort(function(a,b){ return new Date(b.published_at || 0) - new Date(a.published_at || 0); });
  for (var i=0;i<sorted.length;i++){
    var r = sorted[i];
    var assets = Array.isArray(r.assets) ? r.assets : [];
    var unique = true;
    for (var j=0;j<assets.length;j++){
      var a = assets[j];
      var key = (a && a.name ? a.name : '').toLowerCase();
      if (!key) continue;
      if (seen.has(key)) { unique = false; break; }
    }
    for (var k=0;k<assets.length;k++){
      var a2 = assets[k];
      var key2 = (a2 && a2.name ? a2.name : '').toLowerCase();
      if (key2 && !seen.has(key2)) seen.set(key2, r);
    }
    if (unique) out.push(r);
  }
  return out;
}

/* Cache kecil biar nggak fetch berulang-ulang */
var releaseCache = { latest: null, list: null, ts: 0 };

async function fetchAllReleases() {
  var now = Date.now();
  if (releaseCache.latest && (now - releaseCache.ts) < 60000) {
    return { latest: releaseCache.latest, list: releaseCache.list };
  }
  var tasks = [fetchReleaseOnce(PRIMARY_URL)].concat(OTHER_LIST.map(function(u){ return fetchReleaseOnce(u); }));
  var raws  = await Promise.all(tasks);
  var norm  = raws.map(function(r,i){ return normalizeRelease(r, i === 0 ? 'primary' : ('other-' + i)); }).filter(Boolean);
  var clean = dedupeByAssetName(norm);
  releaseCache.latest = pickLatest(clean);
  releaseCache.list   = clean;
  releaseCache.ts     = now;
  return { latest: releaseCache.latest, list: releaseCache.list };
}

/* Isi panel opsional jika ada */
async function populateReleasePanels() {
  if (!mainBox && !altBox) return;
  var data = await fetchAllReleases();
  var latest = data.latest, list = data.list;

  if (mainBox) {
    if (latest) {
      var a = bestMainAsset(latest.assets);
      mainBox.innerHTML =
        '<div class="card">'+
          '<h4 style="margin:0 0 .5rem">'+escapeHtml(latest.name || latest.tag || 'Latest Release')+'</h4>'+
          '<p class="muted" style="margin:.25rem 0">'+toLocalDateStr(latest.published_at)+'</p>'+
          (a
            ? '<a class="btn btn--primary" href="'+a.browser_download_url+'" target="_blank" rel="noopener">Download '+escapeHtml(a.name)+' ('+formatFileSize(a.size)+')</a>'
            : '<span class="muted">No assets found</span>'
          )+
        '</div>';
    } else {
      mainBox.innerHTML = '<div class="card"><p class="muted">No release found.</p></div>';
    }
  }

  if (altBox) {
    var others = (list || []).slice(0,5).map(function(r){
      var a = bestMainAsset(r.assets);
      return (
        '<li>'+
          '<div><strong>'+escapeHtml(r.name || r.tag || 'Release')+'</strong></div>'+
          '<small class="muted">'+toLocalDateStr(r.published_at)+'</small><br>'+
          (a ? '<a class="btn btn--ghost" href="'+a.browser_download_url+'" target="_blank" rel="noopener">Download</a>' : '')+
        '</li>'
      );
    }).join('');
    altBox.innerHTML = '<div class="card"><ul style="margin:0;padding-left:1rem;display:grid;gap:.5rem">'+(others || '<li class="muted">—</li>')+'</ul></div>';
  }
}
populateReleasePanels().catch(console.error);

/* =====================================================
   TOOLS + CHANGELOGS VIEW
===================================================== */
const toolsData = [
  {
    title: 'SteamClouds Lite',
    desc: 'SteamClouds Lite is a lightweight tool that auto-generates .lua and .manifest files and adds games to your Steam library, no manual setup needed. Simple, fast, and user friendly.',
    href: '#',
    img: 'assets/images/scloudslite.png',
    source: 'primary'
  },
  {
    title: 'Steam Clouds Ultimate',
    desc: 'Your all-in-one toolkit for effortless Steam game unlocking, Automatically generates .lua and .manifest files, Instantly adds games to your Steam library, Seamlessly manages your entire collection, Intuitive interface, no manual setup required.',
    href: '#',
    img: 'assets/images/sc_ultimate.png',
    source: 'other1'
  },
  {
    title: 'SpotifyPlus',
    desc: 'SpotifyPlus lets you enjoy Spotify the way it should be no ads, no limits, just music.',
    href: '#',
    img: 'assets/images/splus_new_ver.png',
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

/* --------- STATE (penting, dipakai di resize & back) --------- */
const state = { mode: 'tools', currentToolIndex: null };

const logsData = {
  0: [
    {
      title: 'v1.0',
      desc: [
        'Initial public release',
        'Core functionality for import lua files',
        'Core functionality for manage library',
        'Core functionality for steamclouds tools'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'
    },
    {
      title: 'v1.1',
      desc: [
        'Improve Add Games button',
        'Removed Install SteamTools',
        'Always Unlock Automatically',
        'The dashboard tutorial has been updated.',
        'Improving stability by fixing bugs and errors.'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'
    },
    {
      title: 'v1.2',
      desc: [
        'Resolving tools issues',
        'Added .manifest support',
        'Added Link Manifest to App',
        'Code optimized for better performance'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'
    },
    {
      title: 'v1.3',
      desc: [
        'Improve the program',
        'Resolving tools issues',
        'Removed Install Steamclouds Plugins Feature'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'
    },
    { title: 'v1.4', desc: '- Improve the program\n- Resolving tools issues', href: '#' },
    { title: 'v1.5', desc: '- Resolving tools issues', href: '#' },
    {
      title: 'v1.6',
      desc: [
        '- Brand-new UI for a smoother experience\n',
        '- Improved overall performance\n',
        '- Bug fixes and stability enhancements\n',
        '- Resolved false positive issues with VirusTotal\n',
        '- Added "Add to Library" feature\n',
        '- Renamed from SteamClouds to SteamClouds Lite'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#' },
   {title: 'v1.7',
      desc: [
        '- One new database has been added.\n',
        '- Now App no longer locks during updates.\n',
        '- Patched Minor bugs for smoother performance.\n',
        '- Enhanced Restart System for improved stability.\n',
        '- Improved File generation system for greater efficiency.\n',
        '- Fixed The "Purchase" button issue has been fully resolved for the latest Steam Client.\n'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'
    }
  ],
  1: [
    { title: 'v1.0', desc: '- Initial public release', href: '#' },
    {
      title: 'v1.1',
      desc: [
        'Rebranded as Steam Clouds Ultimate',
        'Introduced "Add to Library" toggle',
        'Added "Always Unlock" toggle for persistent access',
        'Launched Library Manager for streamlined organization',
        'Enabled Drag & Drop and File Browser for effortless game import',
        'Upgraded tool performance for a smoother experience'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
    { title: 'v1.2', desc: '- Added Custom Steam Path', href: '#' },
    { title: 'v1.3', desc: '- Fixed bug where Always Unlock could not be disabled.', href: '#' },
    { title: 'v1.4',
      desc: [
        'New Fresh UI',
        'Added New Database',
        'False positive issues resolved',
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
    { title: 'v1.5',
      desc: [
        'Added drop link feature',
        'Added Release Info',
        'Added About button',
        'Fixed several bugs',
        'Fixed several display issues',
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
   { title: 'v1.6',
      desc: [
        'Patch: Fixed 403 Forbidden error',
        'Fixed several bugs',
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
     { title: 'v1.7',
      desc: [
        'Massive bug fixes across the program for smoother performance',
        'UI Library updated, more modern visuals & better responsiveness',
        'UI Discover improved → easier, faster navigation',
        'New “Check Limits” button added in Settings',
        'Token status display now available in Settings',
        'Auto database check removed, now it only checks when you click Download button',
        'Stronger detection for Denuvo & 3rd party launchers',
        'Tools no longer locked when updates are released, now you’ll just get an update notification',
        'Optimized “Add Games” for stable performance with detailed process logs',
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
   { title: 'v1.8',
      desc: [
        'Fixed various minor bugs',
        'Introduced a new Home section',
        'Added integrated Guide within Home',
        'Library now includes Update buttons',
        'Optimized tools for better efficiency',
        'Enhanced code stability and performance',
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
   { title: 'v1.9',
      desc: [
        'Added Quick Fix Feature',
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
  { title: 'v2.0',
      desc: [
        'Fixed the "Purchase" button problem, everything should now work smoothly!',
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
 { title: 'v2.1',
      desc: [
       'Resolved issue with missing entries in the manifest database.',
       'Patched HTTPS client error.',
       'Enhanced logs with more detailed information.',
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
  ],
  2: [
    { title: 'v1.1', desc: '- Initial public release', href: '#' },
    {
      title: 'v1.2',
      desc: [
        'Added Auto Check Update',
        'Added Spotify Downloader',
        'Added Youtube Downloader',
        'Added Tiktok Downloader',
        'Resolving tools issues'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'
    },
    { title: 'v1.3', desc: '- Resolving tools issues', href: '#' },
    {title: 'v1.4',
      desc: [
        'Resolving tools issues',
        'Removed Spotify, Youtube & Tiktok Downloader',
        'Improving the UI and optimizing the program',
        'Optimizing Spotify Premium features and performance',
        'Added Multi Language feature (ID, EN, DE, ES)'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
    { title: 'v1.5', desc: '- Resolving tools issues', href: '#' },
    {title: 'v1.6',
      desc: [
        'New Simple UI',
        'Resolving tools issues',
        'Optimizing the program',
        'Resolving false positive issues with VirusTotal'
      ].map(function(s){ return '- ' + s; }).join('\n'),
      href: '#'},
  ],
  3: [
    { title: 'v1.0', desc: '- Initial public release', href: '#' }
  ]
};

function cardToolbar(sourceTag) {
  var srcAttr = Array.isArray(sourceTag) ? sourceTag.join(',') : (sourceTag || '');
  return (
    '<div class="tool__row">'+
      '<a class="btn btn--primary" href="#" data-action="download" data-src="'+srcAttr+'">Download</a>'+
      '<button class="btn btn--ghost" type="button" data-action="show-changelogs">View Changelogs</button>'+
    '</div>'
  );
}

/* gunakan SATU versi saja */
function getChangelogLimit() {
  return window.innerWidth < 768 ? 4 : 6;
}

window.addEventListener('resize', function(){
  if (state && state.mode === 'changelogs' && state.currentToolIndex != null) {
    renderChangelogs(state.currentToolIndex);
  }
});

function getLogsForTool(toolIndex) {
  var title = ((toolsData[toolIndex] && toolsData[toolIndex].title) || '').toLowerCase();

  if (logsData && !Array.isArray(logsData) && typeof logsData === 'object') {
    var byIndex = (logsData.hasOwnProperty(toolIndex) ? logsData[toolIndex] : logsData[String(toolIndex)]);
    var byTitle = (logsData[(toolsData[toolIndex] && toolsData[toolIndex].title) || '']) || logsData[title] || null;
    return Array.isArray(byIndex) ? byIndex : (Array.isArray(byTitle) ? byTitle : []);
  }

  if (Array.isArray(logsData)) {
    return logsData.filter(function(l){
      return l.tool === toolIndex || l.toolIndex === toolIndex || (typeof l.tool === 'string' && l.tool.toLowerCase() === title);
    });
  }

  return [];
}

function getLatestLog(toolIndex) {
  var logs = getLogsForTool(toolIndex);
  return (logs && logs.length) ? logs[logs.length - 1] : null;
}

function renderTools() {
  var grid = $('#toolsGrid');
  if (!grid) return;

  grid.innerHTML = toolsData.map(function(t, i){
    var latestLog = getLatestLog(i);
    var versionBadge = latestLog
      ? '<button class="tool__badge" data-action="show-changelogs" title="View changelogs">'+escapeHtml(latestLog.title)+'</button>'
      : '';

    return (
      '<article class="tool" data-tool-index="'+i+'" data-reveal>'+
        versionBadge+
        '<div class="tool__media">'+
          '<img class="tool__img" src="'+t.img+'" alt="'+escapeHtml(t.title)+'" loading="lazy"/>'+
        '</div>'+
        '<div class="tool__body">'+
          '<h3 class="tool__title">'+escapeHtml(t.title)+'</h3>'+
          '<p class="tool__desc">'+escapeHtml(t.desc)+'</p>'+
          cardToolbar(t.source)+
        '</div>'+
      '</article>'
    );
  }).join('');

  revealInView(grid);
  prepareImages(grid);
  state.mode = 'tools';

  markNewBadges().catch(console.error);
}

async function fetchReleasesFromSources(tags) {
  var urls = new Set();
  var arr = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? tags.split(',') : []);

  if (!arr.length) {
    urls.add(PRIMARY_URL);
    OTHER_LIST.forEach(function(u){ urls.add(u); });
  } else {
    for (var i=0;i<arr.length;i++){
      var raw = arr[i];
      var t = String(raw).trim().toLowerCase();

      if (t === 'primary') {
        urls.add(PRIMARY_URL);
      } else if (t === 'other') {
        OTHER_LIST.forEach(function(u){ urls.add(u); });
      } else if (/^other(\d+)$/.test(t)) {
        var idx = Number(t.match(/^other(\d+)$/)[1]) - 1;
        if (OTHER_LIST[idx]) urls.add(OTHER_LIST[idx]);
      } else if (/^url:/.test(t)) {
        var u = raw.slice(4).trim();
        if (/^https?:\/\//i.test(u)) urls.add(u);
      }
    }
    if (!urls.size) {
      urls.add(PRIMARY_URL);
      OTHER_LIST.forEach(function(u){ urls.add(u); });
    }
  }

  var raws = await Promise.all(Array.from(urls).map(function(u){ return fetchReleaseOnce(u); }));
  var norm  = raws.map(function(r,i){ return normalizeRelease(r, i === 0 ? 'src0' : 'src' + i); }).filter(Boolean);
  var clean = dedupeByAssetName(norm);
  return { latest: pickLatest(clean), list: clean };
}

/* Badge "New" (tanpa versi) */
const NEW_DAYS = 10;
const perSourceCache = new Map();

async function getLatestForSourceTag(tag) {
  if (typeof tag === 'string' && /^url:/i.test(tag)) return null;
  if (perSourceCache.has(tag)) return perSourceCache.get(tag);
  var res = await fetchReleasesFromSources(tag);
  perSourceCache.set(tag, res.latest);
  return res.latest;
}

async function markNewBadges() {
  var now = Date.now();

  await Promise.all(toolsData.map(async function(t, i){
    var latest = await getLatestForSourceTag(t.source || '');
    if (!latest) return;

    var ts = new Date(latest.published_at || latest.date || Date.now()).getTime();
    var ageDays = (now - ts) / 86400000;

    if (ageDays <= NEW_DAYS) {
      var card = document.querySelector('.tool[data-tool-index="'+i+'"]');
      if (!card) return;
      if (card.querySelector('.tool__badge--new')) return;

      var el = document.createElement('button');
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
async function renderChangelogs(toolIndex) {
  var grid = $('#toolsGrid');
  if (!grid) return;

  state.currentToolIndex = toolIndex;

  var toolTitle = (toolsData[toolIndex] && toolsData[toolIndex].title) || 'Changelogs';
  var latest    = getLatestLog(toolIndex);
  var ver       = latest ? ' — ' + escapeHtml(latest.title) : '';
  var rawItems  = getLogsForTool(toolIndex);
  var limit     = getChangelogLimit();
  var items     = (rawItems || []).slice(-limit).reverse();

  grid.innerHTML =
    '<div class="grid-span-all" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
      '<h3 class="section__title" style="margin:0">Changelogs — '+escapeHtml(toolTitle)+ver+'</h3>'+
      '<button class="btn btn--ghost" type="button" data-action="back-tools">Back</button>'+
    '</div>'+
    (
      items.length
        ? items.map(function(l){
            return (
              '<article class="tool" data-reveal>'+
                (l.img
                  ? '<div class="tool__media"><img class="tool__img" src="'+l.img+'" alt="'+escapeHtml(l.title || 'Changelog')+'" loading="lazy"></div>'
                  : ''
                )+
                '<div class="tool__body">'+
                  '<h3 class="tool__title">'+escapeHtml(l.title || 'Changelog')+'</h3>'+
                  '<p class="tool__desc">'+escapeHtml(l.desc || '')+'</p>'+
                '</div>'+
              '</article>'
            );
          }).join('')
        : (
          '<article class="tool" data-reveal>'+
            '<div class="tool__body">'+
              '<h3 class="tool__title">No changelog</h3>'+
              '<p class="tool__desc">Belum ada catatan rilis untuk '+escapeHtml(toolTitle)+'.</p>'+
            '</div>'+
          '</article>'
        )
    );

  revealInView(grid);
  prepareImages(grid);
  state.mode = 'changelogs';
}

/* =====================================================
   Search filter
===================================================== */
(function wireSearch() {
  var input = $('#searchInput');
  var grid  = $('#toolsGrid');
  if (!input || !grid) return;

  function filter() {
    var q = input.value.trim().toLowerCase();
    $$('.tool', grid).forEach(function(card){
      var titleEl = $('.tool__title', card);
      var descEl  = $('.tool__desc',  card);
      var title = titleEl ? titleEl.textContent.toLowerCase() : '';
      var desc  = descEl  ? descEl.textContent.toLowerCase()  : '';
      var hit   = title.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
      card.style.display = hit ? '' : 'none';
    });
  }

  input.addEventListener('input', filter);
})();

/* =====================================================
   Grid behaviors (reveal & images)
===================================================== */
function revealInView(root) {
  var revealEls = $$('[data-reveal]', root);
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var target = entry.target, isIntersecting = entry.isIntersecting;
      if (isIntersecting) {
        target.style.transform = 'translateY(0)';
        target.style.opacity   = '1';
        io.unobserve(target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  revealEls.forEach(function(el){
    el.style.transform  = 'translateY(8px)';
    el.style.opacity    = '0';
    el.style.transition = 'transform 420ms ease, opacity 420ms ease';
    io.observe(el);
  });
}

function prepareImages(root) {
  $$('.tool__img', root).forEach(function(img){
    var ok = function(){ img.classList.add('is-loaded'); };
    var ko = function(){
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
  gridRoot.addEventListener('click', async function(e){
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');

    if (action === 'download') {
      e.preventDefault();
      btn.blur();

      var prev    = btn.textContent;
      var srcTags = (btn.dataset.src || '').trim();

      var direct = srcTags.split(',').map(function(s){ return s.trim(); }).find(function(s){ return /^url:/i.test(s); });
      if (direct) {
        var href = direct.replace(/^url:\s*/i, '');
        if (href) window.open(href, '_blank', 'noopener');
        return;
      }

      btn.disabled   = true;
      btn.textContent = 'Downloading...';

      try {
        var rels = await fetchReleasesFromSources(srcTags);
        var latest = rels.latest;
        if (!latest) { alert('No release found'); return; }
        var a = bestMainAsset(latest.assets);
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
      var card = btn.closest('.tool');
      var idxAttr = card ? (card.getAttribute('data-tool-index') || card.dataset.toolIndex) : null;
      var idx = Number(idxAttr);
      await renderChangelogs(isFinite(idx) ? idx : 0);
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
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) {
    $$('[data-reveal]').forEach(function(el){
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





















