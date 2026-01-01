'use strict';

/* =====================================================
   Helpers
===================================================== */
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

const escapeHtml = s => String(s||'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');

/* =====================================================
   CONFIG
===================================================== */
const NEW_DAYS = 10;
const TIMEOUT_MS = 10000;

const PRIMARY_URL =
  'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';

const OTHER_URLS = [
  'https://script.google.com/macros/s/AKfycbz3AzDmxMJTCXTY4RAwfVDcgnl8l8QAhfeL_ROsAQDAun30eV40GQxuMuz_fKhQjrbKkA/exec',
  'https://script.google.com/macros/s/AKfycbxL8m4Wtf4PG1_bocjroOyUcq66rucKFKccZvex6aERBwLUZ3V5Y9RH_rlmAOhRZOgvhA/exec',
  'https://script.google.com/macros/s/AKfycbx8lTj5CHrnTPgTXY3tYKNAoRdC-FEsOaRtLwIbcpiISNPnPn7JBVOP-Col0gJrqogp/exec'
];

/* =====================================================
   TOOLS DATA
===================================================== */
const toolsData = [
  {
    title: 'SteamClouds Lite',
    desc: 'Auto-generate .lua & .manifest and add games to Steam.',
    img: 'assets/images/scloudslite.png',
    source: 'primary'
  },
  {
    title: 'Steam Clouds Ultimate',
    desc: 'All-in-one Steam unlocking toolkit.',
    img: 'assets/images/sc_ultimate.png',
    source: 'other1'
  },
  {
    title: 'SpotifyPlus',
    desc: 'Enjoy Spotify with no ads.',
    img: 'assets/images/splus_new_ver.png',
    source: 'other2'
  },
  {
    title: 'All In One Downloader',
    desc: 'Download media from popular platforms.',
    img: 'assets/images/downloader.png',
    source: 'other3'
  }
];



/* =====================================================
   CHANGELOGS (INLINE – KODE LAMA)
===================================================== */
const logsData = {
  /* =====================================================
     SteamClouds Lite (index 0)
  ===================================================== */
  0: [
    {
      title: 'v1.0',
      items: [
        'Initial public release',
        'Core functionality for import lua files',
        'Core functionality for manage library',
        'Core functionality for SteamClouds tools'
      ]
    },
    {
      title: 'v1.1',
      items: [
        'Improve Add Games button',
        'Removed Install SteamTools',
        'Always Unlock automatically enabled',
        'Dashboard tutorial updated',
        'Improved stability and bug fixes'
      ]
    },
    {
      title: 'v1.2',
      items: [
        'Resolving tools issues',
        'Added .manifest support',
        'Added Link Manifest to App',
        'Code optimized for better performance'
      ]
    },
    {
      title: 'v1.3',
      items: [
        'Improve the program',
        'Resolving tools issues',
        'Removed Install SteamClouds Plugins feature'
      ]
    },
    {
      title: 'v1.4',
      items: [
        'Improve the program',
        'Resolving tools issues'
      ]
    },
    {
      title: 'v1.5',
      items: [
        'Resolving tools issues'
      ]
    },
    {
      title: 'v1.6',
      items: [
        'Brand-new UI for a smoother experience',
        'Improved overall performance',
        'Bug fixes and stability enhancements',
        'Resolved false positive issues with VirusTotal',
        'Added "Add to Library" feature',
        'Renamed from SteamClouds to SteamClouds Lite'
      ]
    },
    {
      title: 'v1.7',
      items: [
        'One new database has been added',
        'Now App no longer locks during updates',
        'Patched minor bugs for smoother performance',
        'Enhanced Restart System for improved stability',
        'Improved File generation system for greater efficiency',
        'Fixed "Purchase" button issue for latest Steam Client'
      ]
    }
  ],

  /* =====================================================
     Steam Clouds Ultimate (index 1)
  ===================================================== */
  1: [
    {
      title: 'v1.0',
      items: [
        'Initial public release'
      ]
    },
    {
      title: 'v1.1',
      items: [
        'Rebranded as Steam Clouds Ultimate',
        'Introduced "Add to Library" toggle',
        'Added "Always Unlock" toggle',
        'Launched Library Manager',
        'Enabled Drag & Drop and File Browser',
        'Performance improvements'
      ]
    },
    {
      title: 'v1.2',
      items: [
        'Added Custom Steam Path support'
      ]
    },
    {
      title: 'v1.3',
      items: [
        'Fixed bug where Always Unlock could not be disabled'
      ]
    },
    {
      title: 'v1.4',
      items: [
        'New fresh UI',
        'Added new database',
        'Resolved false positive issues'
      ]
    },
    {
      title: 'v1.5',
      items: [
        'Added drop link feature',
        'Added Release Info section',
        'Added About button',
        'Fixed multiple bugs',
        'Fixed display issues'
      ]
    },
    {
      title: 'v1.6',
      items: [
        'Fixed 403 Forbidden error',
        'Multiple bug fixes'
      ]
    },
    {
      title: 'v1.7',
      items: [
        'Massive bug fixes for smoother performance',
        'UI Library updated (modern & responsive)',
        'UI Discover improved for faster navigation',
        'Added "Check Limits" button in Settings',
        'Token status display in Settings',
        'Auto database check removed (manual only)',
        'Stronger Denuvo & launcher detection',
        'Tools no longer locked during updates',
        'Optimized Add Games process'
      ]
    },
    {
      title: 'v1.8',
      items: [
        'Fixed various minor bugs',
        'Introduced new Home section',
        'Added integrated Guide',
        'Library now includes Update buttons',
        'Performance optimizations'
      ]
    },
    {
      title: 'v1.9',
      items: [
        'Added Quick Fix feature'
      ]
    },
    {
      title: 'v2.0',
      items: [
        'Fixed Purchase button issue completely'
      ]
    },
    {
      title: 'v2.1',
      items: [
        'Resolved missing entries in manifest database',
        'Patched HTTPS client error',
        'Enhanced logs with more detailed information'
      ]
    }
  ],

  /* =====================================================
     SpotifyPlus (index 2)
  ===================================================== */
  2: [
    {
      title: 'v1.1',
      items: [
        'Initial public release'
      ]
    },
    {
      title: 'v1.2',
      items: [
        'Added Auto Check Update',
        'Added Spotify Downloader',
        'Added YouTube Downloader',
        'Added TikTok Downloader',
        'Resolving tools issues'
      ]
    },
    {
      title: 'v1.3',
      items: [
        'Resolving tools issues'
      ]
    },
    {
      title: 'v1.4',
      items: [
        'Removed Spotify, YouTube & TikTok Downloader',
        'Improved UI and optimized program',
        'Optimized Spotify Premium features',
        'Added Multi-language support (ID, EN, DE, ES)'
      ]
    },
    {
      title: 'v1.5',
      items: [
        'Resolving tools issues'
      ]
    },
    {
      title: 'v1.6',
      items: [
        'New simple UI',
        'Optimized the program',
        'Resolved false positive VirusTotal issues'
      ]
    }
  ],

  /* =====================================================
     All In One Downloader (index 3)
  ===================================================== */
  3: [
    {
      title: 'v1.0',
      items: [
        'Initial public release'
      ]
    }
  ]
};

const getLogsForTool = i => logsData[i] || [];
const getLatestLog   = i => {
  const l = getLogsForTool(i);
  return l.length ? l[l.length-1] : null;
};

/* =====================================================
   FETCH HELPERS
===================================================== */
const withTimeout = (fn,ms)=>{
  const c=new AbortController();
  const t=setTimeout(()=>c.abort(),ms);
  return fn(c.signal).finally(()=>clearTimeout(t));
};

async function fetchRelease(url){
  return withTimeout(
    s=>fetch(url,{signal:s}).then(r=>r.json()).catch(()=>null),
    TIMEOUT_MS
  );
}

const isExe = a => /\.exe$/i.test(a?.name||'');
const isZip = a => /\.zip$/i.test(a?.name||'');

const bestMainAsset = assets =>
  assets.find(isExe) || assets.find(isZip) || assets[0] || null;

/* =====================================================
   NEW BADGE (LOGIKA LAMA – OTOMATIS)
===================================================== */
const releaseCache = new Map();

async function isNewRelease(source){
  if(releaseCache.has(source)) return releaseCache.get(source);

  let urls=[];
  if(source==='primary') urls=[PRIMARY_URL];
  else if(/^other\d+$/.test(source)){
    const i=parseInt(source.replace('other',''),10)-1;
    if(OTHER_URLS[i]) urls=[OTHER_URLS[i]];
  }

  const raws=await Promise.all(urls.map(fetchRelease));
  const dates = raws
    .map(r=>r?.release?.published_at || r?.data?.published_at)
    .filter(Boolean);

  if(!dates.length){
    releaseCache.set(source,false);
    return false;
  }

  dates.sort((a,b)=>new Date(b)-new Date(a));
  const age=(Date.now()-new Date(dates[0]))/86400000;
  const isNew=age<=NEW_DAYS;

  releaseCache.set(source,isNew);
  return isNew;
}

/* =====================================================
   IMAGE FALLBACK
===================================================== */
function prepareImages(root){
  $$('img',root).forEach(img=>{
    img.onerror=()=>img.src='https://via.placeholder.com/800x450?text=Image+Missing';
  });
}

/* =====================================================
   RENDER TOOLS
===================================================== */
async function renderTools(){
  const grid=$('#toolsGrid');
  if(!grid) return;

  grid.innerHTML=toolsData.map((t,i)=>`
    <article class="tool" data-tool-index="${i}">
      <div class="tool__media">
        <img class="tool__img" src="${t.img}" alt="${escapeHtml(t.title)}">
      </div>
      <div class="tool__body">
        <h3 class="tool__title">${escapeHtml(t.title)}</h3>
        <p class="tool__desc">${escapeHtml(t.desc)}</p>
        <div class="tool__row">
          <button class="btn btn--primary" data-action="download" data-src="${t.source}">Download</button>
          <button class="btn btn--ghost" data-action="show-changelogs">View Changelogs</button>
        </div>
      </div>
    </article>
  `).join('');

  prepareImages(grid);

  /* VERSION BADGE */
  toolsData.forEach((_,i)=>{
    const log=getLatestLog(i);
    if(!log) return;
    const card=$(`.tool[data-tool-index="${i}"]`);
    const b=document.createElement('span');
    b.className='tool__badge';
    b.textContent=log.title;
    card.appendChild(b);
  });

  /* NEW BADGE */
  await Promise.all(toolsData.map(async (t,i)=>{
    if(await isNewRelease(t.source)){
      const card=$(`.tool[data-tool-index="${i}"]`);
      const b=document.createElement('span');
      b.className='tool__badge tool__badge--new';
      b.textContent='NEW';
      card.appendChild(b);
    }
  }));
}

/* =====================================================
   CHANGELOG VIEW + PAGINATION (KODE LAMA)
===================================================== */
const changelogState={ tool:null,page:1,perPage:6 };

function renderChangelogs(index){
  const grid=$('#toolsGrid');
  if(!grid) return;

  changelogState.tool=index;
  const logs=getLogsForTool(index);
  const total=Math.ceil(logs.length/changelogState.perPage);

  const start=(changelogState.page-1)*changelogState.perPage;
  const items=[...logs].reverse().slice(start,start+changelogState.perPage);

  grid.innerHTML=`
    <div class="grid-span-all">
      <h3>Changelogs — ${escapeHtml(toolsData[index].title)}</h3>
      <button class="btn btn--ghost" data-action="back-tools">Back</button>
    </div>

    ${items.map(l=>`
      <article class="tool">
        <div class="tool__body">
          <h3>${l.title}</h3>
          <ul>${l.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>
        </div>
      </article>
    `).join('')}

    <div class="grid-span-all">
      <button class="btn btn--ghost" data-page="prev" ${changelogState.page<=1?'disabled':''}>Prev</button>
      <span>${changelogState.page}/${total}</span>
      <button class="btn btn--ghost" data-page="next" ${changelogState.page>=total?'disabled':''}>Next</button>
    </div>
  `;
}

/* =====================================================
   CLICK HANDLER (DOWNLOAD & CHANGELOG)
===================================================== */
document.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-action]');
  if(btn){
    const card=btn.closest('.tool');
    const index=Number(card?.dataset.toolIndex);

    if(btn.dataset.action==='download'){
      btn.disabled=true;
      try{
        let urls=[];
        const src=btn.dataset.src;
        if(src==='primary') urls=[PRIMARY_URL];
        else if(/^other\d+$/.test(src)){
          const i=parseInt(src.replace('other',''),10)-1;
          if(OTHER_URLS[i]) urls=[OTHER_URLS[i]];
        }

        const raws=await Promise.all(urls.map(fetchRelease));
        const releases=raws.map(r=>r?.release||r?.data||r).filter(Boolean);
        const assets=releases.flatMap(r=>Object.values(r.assets||{}));
        const asset=bestMainAsset(assets);

        if(asset?.browser_download_url){
          window.location.href=asset.browser_download_url;
        }else alert('No downloadable file found.');
      }finally{
        btn.disabled=false;
      }
      return;
    }

    if(btn.dataset.action==='show-changelogs'){
      changelogState.page=1;
      renderChangelogs(index);
      return;
    }

    if(btn.dataset.action==='back-tools'){
      renderTools();
      return;
    }
  }

  const p=e.target.closest('[data-page]');
  if(p){
    if(p.dataset.page==='prev') changelogState.page--;
    if(p.dataset.page==='next') changelogState.page++;
    renderChangelogs(changelogState.tool);
  }
});

/* =====================================================
   BOOT
===================================================== */
document.addEventListener('DOMContentLoaded',renderTools);


