'use strict';

/* =======================
   Helpers
======================= */
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

const escapeHtml = s => String(s||'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');

/* =======================
   CONFIG
======================= */
const NEW_DAYS = 10;
const TIMEOUT_MS = 10000;

const PRIMARY_URL = 'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';

const OTHER_URLS = [
  'https://script.google.com/macros/s/AKfycbz3AzDmxMJTCXTY4RAwfVDcgnl8l8QAhfeL_ROsAQDAun30eV40GQxuMuz_fKhQjrbKkA/exec',
  'https://script.google.com/macros/s/AKfycbxL8m4Wtf4PG1_bocjroOyUcq66rucKFKccZvex6aERBwLUZ3V5Y9RH_rlmAOhRZOgvhA/exec',
  'https://script.google.com/macros/s/AKfycbx8lTj5CHrnTPgTXY3tYKNAoRdC-FEsOaRtLwIbcpiISNPnPn7JBVOP-Col0gJrqogp/exec'
];

/* =======================
   TOOLS
======================= */
const toolsData = [
  {
    title:'SteamClouds Lite',
    desc:'Auto-generate .lua & .manifest and add games to Steam.',
    img:'assets/images/scloudslite.png',
    source:'primary'
  },
  {
    title:'Steam Clouds Ultimate',
    desc:'All-in-one Steam unlocking toolkit.',
    img:'assets/images/sc_ultimate.png',
    source:'other1'
  },
  {
    title:'SpotifyPlus',
    desc:'Enjoy Spotify with no ads.',
    img:'assets/images/splus_new_ver.png',
    source:'other2'
  },
  {
    title:'All In One Downloader',
    desc:'Download media from popular platforms.',
    img:'assets/images/downloader.png',
    source:'other3'
  }
];

/* =======================
   FETCH HELPERS
======================= */
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

function normalizeRelease(raw){
  if(!raw) return null;
  raw=raw.release||raw.data||raw;
  return {
    published_at: raw.published_at||raw.created_at||null
  };
}

/* =======================
   NEW BADGE LOGIC (🔥)
======================= */
const releaseCache = new Map();

async function isNewRelease(source){
  if(releaseCache.has(source)) return releaseCache.get(source);

  let urls=[];
  if(source==='primary') urls=[PRIMARY_URL];
  else if(/^other\d+$/.test(source)){
    const i=parseInt(source.replace('other',''),10)-1;
    if(OTHER_URLS[i]) urls=[OTHER_URLS[i]];
  } else urls=[PRIMARY_URL,...OTHER_URLS];

  const raws=await Promise.all(urls.map(fetchRelease));
  const releases=raws.map(normalizeRelease).filter(r=>r?.published_at);

  if(!releases.length){
    releaseCache.set(source,false);
    return false;
  }

  releases.sort((a,b)=>new Date(b.published_at)-new Date(a.published_at));
  const age=(Date.now()-new Date(releases[0].published_at))/86400000;
  const isNew=age<=NEW_DAYS;

  releaseCache.set(source,isNew);
  return isNew;
}

/* =======================
   CHANGELOG
======================= */
let logsData={};

async function loadChangelogs(){
  try{
    const r=await fetch('assets/data/changelog.json');
    logsData=await r.json();
  }catch{
    logsData={};
  }
}

const getLatestLog=i=>{
  const l=logsData[String(i)];
  return l&&l.length?l[l.length-1]:null;
};

/* =======================
   IMAGE FALLBACK (🔥)
======================= */
function prepareImages(root){
  $$('img',root).forEach(img=>{
    img.onerror=()=>{
      img.src='https://via.placeholder.com/800x450?text=Image+Missing';
    };
  });
}

/* =======================
   RENDER TOOLS
======================= */
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
          <button class="btn btn--primary">Download</button>
          <button class="btn btn--ghost" data-action="show-changelogs">View Changelogs</button>
        </div>
      </div>
    </article>
  `).join('');

  prepareImages(grid);

  /* Version badge */
  toolsData.forEach((_,i)=>{
    const log=getLatestLog(i);
    if(!log) return;
    const card=$(`.tool[data-tool-index="${i}"]`);
    const b=document.createElement('span');
    b.className='tool__badge';
    b.textContent=log.title;
    card.appendChild(b);
  });

  /* NEW badge (🔥 auto dari GitHub) */
  await Promise.all(toolsData.map(async (t,i)=>{
    if(await isNewRelease(t.source)){
      const card=$(`.tool[data-tool-index="${i}"]`);
      if(!card) return;
      const b=document.createElement('span');
      b.className='tool__badge tool__badge--new';
      b.textContent='NEW';
      card.appendChild(b);
    }
  }));
}

/* =======================
   BOOT
======================= */
document.addEventListener('DOMContentLoaded',async()=>{
  await loadChangelogs();
  await renderTools();
});
