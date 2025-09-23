document.addEventListener('DOMContentLoaded', function () {
  // --------- NAV ----------
  const menuToggle = document.getElementById('menuToggle');
  const mainMenu = document.getElementById('main-menu');

  function adjustMenu() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      if (menuToggle) menuToggle.style.display = 'block';
      if (mainMenu) mainMenu.hidden = true;
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    } else {
      if (menuToggle) menuToggle.style.display = 'none';
      if (mainMenu) mainMenu.hidden = false;
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    }
  }
  adjustMenu();
  window.addEventListener('resize', adjustMenu);

  if (menuToggle && mainMenu) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isExpanded));
      mainMenu.hidden = isExpanded;
    });
  }

  // --------- FAQ ----------
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true' || false;
      document.querySelectorAll('.faq-question').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        const answer = btn.nextElementSibling;
        if (answer) answer.setAttribute('aria-hidden', 'true');
      });
      if (!expanded) {
        button.setAttribute('aria-expanded', 'true');
        const answer = button.nextElementSibling;
        if (answer) answer.setAttribute('aria-hidden', 'false');
      }
    });
  });

  // ---------- RELEASES ----------
  const layout     = document.querySelector('.releases-layout');
  const mainBox    = document.getElementById('release-main'); // kiri
  const altBox     = document.getElementById('release-alt');  // kanan

  // Endpoint utama (sudah OK)
  const PRIMARY_URL = 'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';
  // Endpoint repo lain (boleh string atau array; kosong juga boleh)
  const OTHER_URLS  = 'https://script.google.com/macros/s/AKfycbz3AzDmxMJTCXTY4RAwfVDcgnl8l8QAhfeL_ROsAQDAun30eV40GQxuMuz_fKhQjrbKkA/exec';
  const OTHER_LIST  = Array.isArray(OTHER_URLS) ? OTHER_URLS
                     : (typeof OTHER_URLS === 'string' && OTHER_URLS.trim() ? [OTHER_URLS.trim()] : []);

  const TIMEOUT_MS = 10000;

  // ---------- Helpers ----------
  function isZip(a){ const n=(a&&a.name||'').toLowerCase(); return /\.zip$/.test(n); }
  function isExe(a){ const n=(a&&a.name||'').toLowerCase(); return /\.exe$/.test(n); }
  function bestMainAsset(assets){
    if(!Array.isArray(assets)||!assets.length) return null;
    return assets.find(isExe) || assets.find(isZip) || assets[0];
  }
  function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function formatFileSize(bytes){
    if(!bytes) return '0 Bytes';
    const k=1024, sizes=['Bytes','KB','MB','GB','TB'];
    const i=Math.min(sizes.length-1, Math.floor(Math.log(bytes)/Math.log(k)));
    return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+' '+sizes[i];
  }
  function toLocalDateStr(iso){
    if(!iso) return 'Unknown date';
    return new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  }
  function withTimeout(pf,ms){
    const controller=new AbortController();
    const t=setTimeout(()=>controller.abort(),ms);
    return pf(controller.signal).finally(()=>clearTimeout(t));
  }
  function fetchReleaseOnce(url){
    return withTimeout((signal)=>
      fetch(url,{signal})
        .then(async r=>{
          const text=await r.text();
          if(!r.ok) throw new Error('HTTP '+r.status);
          try{ return JSON.parse(text); } catch{ throw new Error('Invalid JSON'); }
        })
        .catch(e=>{ console.error('[fetchReleaseOnce]', url, e.message||e); return null; })
    ,TIMEOUT_MS);
  }
  function normalizeRelease(raw, sourceName){
    if(!raw) return null;
    if(Array.isArray(raw)) raw=raw[0];
    if(raw && typeof raw==='object' && raw.release) raw=raw.release;
    if(raw && typeof raw==='object' && raw.data)    raw=raw.data;
    if(!raw || typeof raw!=='object') return null;

    let assets = Array.isArray(raw.assets) ? raw.assets
               : (raw.assets && typeof raw.assets==='object' ? Object.values(raw.assets) : []);
    assets = (assets||[]).map(a=>({
      name: a?.name || '',
      size: a?.size ?? a?.size_in_bytes ?? 0,
      browser_download_url: a?.browser_download_url || a?.download_url || a?.url || '#'
    }));

    return {
      source: sourceName || 'other',
      name:   raw.name || raw.tag_name || raw.title || '',
      tag:    raw.tag_name || raw.version || '',
      published_at: raw.published_at || raw.created_at || raw.published || raw.date || new Date().toISOString(),
      assets
    };
  }
  function pickLatest(list){
    return (list||[]).filter(Boolean)
      .sort((a,b)=>new Date(b.published_at||0)-new Date(a.published_at||0))[0] || null;
  }
  function dedupeByAssetName(list){
    const seen=new Map(), out=[], sorted=[...(list||[])].sort((a,b)=>new Date(b.published_at||0)-new Date(a.published_at||0));
    for(const r of sorted){
      const assets=Array.isArray(r.assets)?r.assets:[];
      let unique=true;
      for(const a of assets){
        const key=(a?.name||'').toLowerCase(); if(!key) continue;
        if(seen.has(key)){ unique=false; break; }
      }
      for(const a of assets){
        const key=(a?.name||'').toLowerCase(); if(key && !seen.has(key)) seen.set(key,r);
      }
      if(unique) out.push(r);
    }
    return out;
  }

  // ---------- Kartu rilis (dipakai kiri & kanan) ----------
  function renderReleaseCardHTML(release){
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const mainAsset = bestMainAsset(assets);

    let assetsHTML='';
    if(!mainAsset){
      assetsHTML = `
        <div class="asset-row">
          <div class="asset-card">
            <div>
              <div class="asset-name">No assets found</div>
              <div class="asset-size">Contact admin on Discord</div>
            </div>
          </div>
          <div class="asset-actions">
            <a href="https://discord.gg/Qsp6Sbq6wy" class="btn">Discord</a>
          </div>
        </div>`;
    } else {
      const safeName = escapeHtml(mainAsset.name||'');
      const dl  = mainAsset.browser_download_url || '#';
      const badge = isExe(mainAsset) ? 'EXE' : (isZip(mainAsset) ? 'ZIP' : 'FILE');

      assetsHTML += `
        <div class="asset-row asset-main">
          <div class="asset-card" role="group" aria-label="${safeName}">
            <div style="display:flex;flex-direction:column;gap:.25rem;">
              <div class="asset-name" title="${safeName}">
                <span class="badge" style="border:1px solid rgba(255,255,255,.12);padding:.1rem .4rem;border-radius:.4rem;font-size:.75rem;margin-right:.4rem;">${badge}</span>
                ${safeName}
              </div>
              <div class="asset-size">${formatFileSize(mainAsset.size||0)}</div>
            </div>
          </div>
          <div class="asset-actions">
            <a href="${dl}" class="btn" download>Download</a>
          </div>
        </div>`;

      const remaining = assets.filter(a=>a!==mainAsset);
      if(remaining.length){
        assetsHTML += `
          <details class="asset-more" style="margin-top:.5rem;">
            <summary>Show ${remaining.length} other file(s)</summary>
            <div class="asset-list" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem;">
              ${remaining.map(a=>{
                const nn = escapeHtml(a.name||'');
                const badge2 = isExe(a)?'EXE':(isZip(a)?'ZIP':'FILE');
                const url = a.browser_download_url || '#';
                return `
                  <div class="asset-row">
                    <div class="asset-card">
                      <div class="asset-name">
                        <span class="badge" style="border:1px solid rgba(255,255,255,.12);padding:.1rem .4rem;border-radius:.4rem;font-size:.75rem;margin-right:.4rem;">${badge2}</span>
                        ${nn}
                      </div>
                      <div class="asset-size">${formatFileSize(a.size||0)}</div>
                    </div>
                    <div class="asset-actions">
                      <a href="${url}" class="btn" download>Download</a>
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </details>`;
      }
    }

    const published = toLocalDateStr(release.published_at);
    const title = escapeHtml(release.name || release.tag || '');
    const ver   = escapeHtml(release.tag || '');

    return `
      <div class="release-card">
        <div class="release-header">
          <h3 class="release-title">${title}</h3>
          <div class="release-meta">
            <span>Released on ${published}</span>
            <span>Version ${ver}</span>
          </div>
        </div>
        <div class="release-body">
          <div class="release-assets">${assetsHTML}</div>
        </div>
      </div>`;
  }

  function renderInto(el, release){
    if(!el) return;
    if(!release){
      el.innerHTML = `
        <div class="release-card">
          <div class="release-body">
            <div class="release-description"><p>Unable to load the release information.</p></div>
          </div>
        </div>`;
      return;
    }
    el.innerHTML = renderReleaseCardHTML(release);
  }

  // ---------- Load & Orchestrate ----------
  (async function loadAll(){
    if(!mainBox){ console.error('#release-main not found'); return; }

    const primaryRaw = await fetchReleaseOnce(PRIMARY_URL);
    const primary    = normalizeRelease(primaryRaw, 'primary');

    const othersRaw  = await Promise.all(OTHER_LIST.map(u=>fetchReleaseOnce(u)));
    const others     = othersRaw.map((r,i)=>normalizeRelease(r, `repo-${i+1}`)).filter(Boolean);

    let all = [];
    if (primary) all.push(primary);
    if (others.length) all = all.concat(others);

    if (!all.length){
      renderInto(mainBox, null);
      if (altBox){ altBox.style.display='none'; }
      if (layout){ layout.style.gridTemplateColumns='1fr'; }
      return;
    }

    const deduped = dedupeByAssetName(all);
    const latest  = pickLatest(deduped); // untuk kiri
    renderInto(mainBox, latest);

    const rest = deduped.filter(r=>r!==latest)
      .sort((a,b)=>new Date(b.published_at||0)-new Date(a.published_at||0));

    if (!altBox) return;
    if (!rest.length){
      altBox.style.display = 'none';
      if (layout){ layout.style.gridTemplateColumns='1fr'; }
    } else {
      altBox.style.display = '';
      if (layout){ layout.style.gridTemplateColumns='1fr 1fr'; }
      renderInto(altBox, rest[0]);
    }
  })();
});
