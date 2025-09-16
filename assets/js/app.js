(function(){
  // ---------- util: DOM ready ----------
  function onReady(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ---------- fallback safe renderReleaseCard ----------
  // Pastikan fungsi ini selalu ada (menghindari ReferenceError).
  // Kalau kamu punya versi custom, biarkan — tapi fallback ini memastikan UI tetap bekerja.
  if(typeof window.renderReleaseCard !== 'function'){
    window.renderReleaseCard = function(rel){
      var wrap = document.createElement('div');
      wrap.className = 'release-card card';
      wrap.style.border = '1px solid var(--item-border-strong)';
      wrap.style.padding = '12px';
      wrap.style.marginBottom = '12px';
      wrap.style.borderRadius = '12px';
      wrap.style.background = 'var(--release-card-bg)';

      var head = document.createElement('div');
      head.style.display = 'flex';
      head.style.justifyContent = 'space-between';
      head.style.alignItems = 'baseline';

      var title = document.createElement('h2');
      title.innerText = rel.version || '(no version)';
      title.style.margin = '0';
      title.style.fontSize = '1.02rem';

      var date = document.createElement('div');
      date.className = 'meta';
      date.innerText = rel.date || '';
      date.style.fontSize = '0.85rem';

      head.appendChild(title);
      head.appendChild(date);

      var notes = document.createElement('div');
      notes.style.marginTop = '8px';
      notes.style.whiteSpace = 'pre-wrap';
      notes.style.maxHeight = '6.6em';
      notes.style.overflow = 'hidden';
      notes.style.textOverflow = 'ellipsis';
      notes.className = 'release-notes';
      notes.innerText = rel.notes || 'No release notes available';

      var actions = document.createElement('div');
      actions.className = 'card-actions';

      if(rel.url){
        var dl = document.createElement('a');
        dl.href = rel.url;
        dl.rel = 'noopener noreferrer';
        dl.target = '_blank';
        dl.innerText = 'Download';
        dl.className = 'btn small';
        actions.appendChild(dl);
      }

      var more = document.createElement('button');
      more.type = 'button';
      more.innerText = 'Notes';
      more.className = 'btn small';
      more.addEventListener('click', function(){
        if(notes.style.maxHeight && notes.style.maxHeight !== 'none'){
          notes.style.maxHeight = 'none';
          notes.style.overflow = 'auto';
          more.innerText = 'Collapse';
        } else {
          notes.style.maxHeight = '6.6em';
          notes.style.overflow = 'hidden';
          more.innerText = 'Notes';
        }
      });
      actions.appendChild(more);

      wrap.appendChild(head);
      wrap.appendChild(notes);
      wrap.appendChild(actions);

      return wrap;
    };
  }

  // ---------- Main menu ----------
  function initMainMenu(){
    var menuToggle = document.getElementById('menuToggle');
    var mainMenu = document.getElementById('main-menu');
    if(!menuToggle || !mainMenu) return;
    function openMenu(){ mainMenu.hidden = false; menuToggle.setAttribute('aria-expanded','true'); var f = mainMenu.querySelector('a,button'); if(f) f.focus(); }
    function closeMenu(){ mainMenu.hidden = true; menuToggle.setAttribute('aria-expanded','false'); }
    menuToggle.addEventListener('click', function(){ var expanded = menuToggle.getAttribute('aria-expanded') === 'true'; if(expanded) closeMenu(); else openMenu(); });
    document.addEventListener('click', function(e){ if(!mainMenu.contains(e.target) && !menuToggle.contains(e.target)) closeMenu(); });
  }

  // ---------- FAQ ----------
  function initFAQ(){
    var faqItems = document.querySelectorAll('.faq-item button, .faq-question');
    if(!faqItems || faqItems.length === 0) return;
    faqItems.forEach(function(btn){
      btn.addEventListener('click', function(){
        var controls = btn.getAttribute('aria-controls') || btn.dataset.controls;
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var all = document.querySelectorAll('.faq-item button, .faq-question');
        all.forEach(function(b){ b.setAttribute('aria-expanded','false'); var cId = b.getAttribute('aria-controls') || b.dataset.controls; if(cId){ var content = document.getElementById(cId); if(content) content.classList.remove('open'); } });
        if(!expanded && controls){ btn.setAttribute('aria-expanded','true'); var el = document.getElementById(controls); if(el) el.classList.add('open'); }
      });
    });
  }

  // ---------- Search ----------
  function initSearch(){
    var input = document.getElementById('searchInput');
    var cards = document.querySelectorAll('.card');
    if(!input || !cards.length) return;
    input.addEventListener('input', function(){
      var val = input.value.toLowerCase();
      cards.forEach(function(c){
        var txt = c.textContent.toLowerCase();
        c.style.display = txt.includes(val) ? '' : 'none';
      });
    });
  }

  // ---------- Fetch GitHub Releases (robust) ----------
  async function fetchGitHubReleases(){
    var releaseList = document.getElementById('release-list');
    if(!releaseList){
      releaseList = document.createElement('div');
      releaseList.id = 'release-list';
      var container = document.querySelector('.releases') || document.body;
      container.appendChild(releaseList);
    }
    releaseList.innerHTML = '<p>Loading releases...</p>';

    try {
      const url = 'https://api.github.com/repos/R3verseNinja/steamclouds/releases';
      const response = await fetch(url); // Jangan override User-Agent di browser
      console.log('[fetchGitHubReleases] status:', response.status, response.statusText);

      if(!response.ok){
        let txt = '(no body)';
        try { txt = await response.text(); } catch(e){ /* ignore */ }
        console.error('[fetchGitHubReleases] GitHub API error:', response.status, txt);
        releaseList.innerHTML = `<p>Error loading releases: ${response.status} ${response.statusText}</p>`;
        return;
      }

      const releasesData = await response.json();
      console.log('[fetchGitHubReleases] raw releasesData:', releasesData);

      if(!Array.isArray(releasesData) || releasesData.length === 0){
        releaseList.innerHTML = '<p>No releases found.</p>';
        return;
      }

      const validReleases = releasesData.map(rel => {
        const assets = Array.isArray(rel.assets) ? rel.assets : [];
        const exeAsset = assets.find(asset => {
          const name = asset && asset.name ? asset.name.toLowerCase() : '';
          return name.endsWith('.exe') || name.includes('steamclouds') || name.includes('steam_clouds');
        });
        const downloadUrl = exeAsset ? exeAsset.browser_download_url : (rel.zipball_url || rel.tarball_url || '');
        return {
          version: rel.tag_name || rel.name || '(no tag)',
          date: rel.published_at ? new Date(rel.published_at).toLocaleDateString('en-US') : 'Unknown',
          notes: rel.body || 'No release notes available',
          url: downloadUrl
        };
      }).filter(r => r.url);

      if(!validReleases.length){
        releaseList.innerHTML = '<p>No releases found.</p>';
        return;
      }

      releaseList.innerHTML = '';
      validReleases.forEach(function(rel){
        // PASTIKAN tidak ada ReferenceError: cek typeof terlebih dahulu
        var card;
        if(typeof window.renderReleaseCard === 'function'){
          try { card = window.renderReleaseCard(rel); }
          catch(e){
            console.error('[fetchGitHubReleases] renderReleaseCard threw:', e);
            card = document.createElement('div'); card.className='release-card card'; card.textContent = rel.version + ' — ' + (rel.date || '');
          }
        } else {
          card = document.createElement('div'); card.className='release-card card'; card.textContent = rel.version + ' — ' + (rel.date || '');
        }
        releaseList.appendChild(card);
      });

    } catch(error){
      console.error('[fetchGitHubReleases] Error:', error);
      releaseList.innerHTML = `<p>Error loading releases: ${error && error.message ? error.message : error}</p>`;
    }
  }

  // ---------- AdBlock detection & overlay ----------
  window.initAdblockOverlay = function(){
    var existingOverlay = document.querySelector('.full-lock-overlay') || document.querySelector('.adblock-overlay');
    var overlay = existingOverlay || document.createElement('div');

    if(!existingOverlay){
      overlay.className = 'full-lock-overlay adblock-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'none';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.color = '#fff';
      overlay.style.textAlign = 'center';
      overlay.style.padding = '24px';
      var panel = document.createElement('div');
      panel.className = 'adblock-panel';
      panel.innerHTML = '<h2>AdBlock Detected</h2><p>Please disable AdBlock to access this website.</p>';
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
    }

    function createBait(){
      var d = document.createElement('div');
      d.className = 'ads adsbox ad-banner ad-placement adunit';
      d.style.width = '1px';
      d.style.height = '1px';
      d.style.position = 'absolute';
      d.style.left = '0';
      d.style.top = '0';
      d.style.opacity = '0.01';
      d.style.pointerEvents = 'none';
      document.body.appendChild(d);
      return d;
    }

    function detectAdblock(){
      return new Promise(function(resolve){
        var bait = createBait();
        window.setTimeout(function(){
          try {
            var cs = getComputedStyle(bait);
            var blocked = !bait || bait.offsetParent === null || bait.clientHeight === 0 ||
                          cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0';
            if(bait && bait.parentNode) bait.parentNode.removeChild(bait);
            console.log('[adblock] detected =', blocked);
            resolve(blocked);
          } catch(e){
            if(bait && bait.parentNode) bait.parentNode.removeChild(bait);
            console.error('[adblock] detect error', e);
            resolve(false);
          }
        }, 300);
      });
    }

    function showLock(){
      overlay.setAttribute('aria-hidden','false');
      overlay.style.display = 'flex';
      document.documentElement.classList.add('adgate-active');
    }
    function hideLock(){
      overlay.setAttribute('aria-hidden','true');
      overlay.style.display = 'none';
      document.documentElement.classList.remove('adgate-active');
    }

    var adBlockedFlag = false;
    window.addEventListener('error', function(ev){
      var t = ev && ev.target;
      if(t && t.tagName === 'SCRIPT' && t.src && (t.src.indexOf('fpyf8.com') !== -1 || t.src.indexOf('tag.min.js') !== -1)){
        console.warn('[adblock] script blocked or failed to load:', t.src);
        adBlockedFlag = true;
        showLock();
      }
    }, true);

    function enforce(){
      if(adBlockedFlag){ showLock(); return; }
      detectAdblock().then(function(blocked){ if(blocked) showLock(); else hideLock(); });
    }
    enforce();
    setInterval(enforce, 4000);
  };

  // ---------- resource load error helper (logs) ----------
  window.addEventListener('error', function(ev){
    try {
      if(ev && ev.message){
        if(ev.target && ev.target.src){
          console.warn('[resource error]', ev.target.tagName, ev.target.src, ev);
        } else {
          console.error('Unhandled error:', ev.message, ev);
        }
      }
    } catch(e){}
  }, true);

  // ---------- startup ----------
  onReady(function(){
    try{
      initMainMenu();
      initFAQ();
      initSearch();
      // pastikan renderReleaseCard sudah didefinisikan di global (fallback sudah di-set di atas)
      fetchGitHubReleases();
      window.initAdblockOverlay();
    } catch(e){
      console.error('Init error:', e);
    }
  });

})();
