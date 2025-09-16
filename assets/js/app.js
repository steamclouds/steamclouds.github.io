(function(){
  // util: DOM ready
  function onReady(fn){
    if(document.readyState !== 'loading'){ fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  /* ----------------------
     MAIN MENU
  ---------------------- */
  function initMainMenu(){
    var menuToggle = document.getElementById('menuToggle');
    var mainMenu = document.getElementById('main-menu');
    if(!menuToggle || !mainMenu) return;

    function openMenu(){
      mainMenu.hidden = false;
      menuToggle.setAttribute('aria-expanded','true');
      var firstLink = mainMenu.querySelector('a,button');
      if(firstLink) firstLink.focus();
    }
    function closeMenu(){
      mainMenu.hidden = true;
      menuToggle.setAttribute('aria-expanded','false');
    }
    menuToggle.addEventListener('click', function(){
      var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if(expanded){ closeMenu(); } else { openMenu(); }
    });
    document.addEventListener('click', function(e){
      if(!mainMenu.contains(e.target) && !menuToggle.contains(e.target)){
        closeMenu();
      }
    });
  }

  /* ----------------------
     FAQ ACCORDION
  ---------------------- */
  function initFAQ(){
    var faqItems = document.querySelectorAll('.faq-item button');
    faqItems.forEach(function(btn){
      btn.addEventListener('click', function(){
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        faqItems.forEach(function(b){
          b.setAttribute('aria-expanded','false');
          var content = document.getElementById(b.getAttribute('aria-controls'));
          if(content) content.hidden = true;
        });
        if(!expanded){
          btn.setAttribute('aria-expanded','true');
          var c = document.getElementById(btn.getAttribute('aria-controls'));
          if(c) c.hidden = false;
        }
      });
    });
  }

  /* ----------------------
     SIMPLE SEARCH (cards)
  ---------------------- */
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

  /* ----------------------
     RENDER RELEASE CARD
     (dibuat agar fetchGithub punya UI output yang bersih)
  ---------------------- */
  function renderReleaseCard(rel){
    var wrap = document.createElement('div');
    wrap.className = 'release-card card';
    wrap.style.border = '1px solid rgba(255,255,255,0.06)';
    wrap.style.padding = '12px';
    wrap.style.marginBottom = '12px';
    wrap.style.borderRadius = '8px';
    wrap.style.background = 'rgba(255,255,255,0.02)';

    var head = document.createElement('div');
    head.style.display = 'flex';
    head.style.justifyContent = 'space-between';
    head.style.alignItems = 'baseline';

    var title = document.createElement('div');
    title.innerText = rel.version || '(no version)';
    title.style.fontWeight = '600';
    title.style.fontSize = '1rem';

    var date = document.createElement('div');
    date.innerText = rel.date || '';
    date.style.fontSize = '0.9rem';
    date.style.opacity = '0.8';

    head.appendChild(title);
    head.appendChild(date);

    var notes = document.createElement('div');
    notes.style.marginTop = '8px';
    notes.style.whiteSpace = 'pre-wrap';
    notes.style.maxHeight = '6.6em';
    notes.style.overflow = 'hidden';
    notes.style.textOverflow = 'ellipsis';
    notes.style.opacity = '0.95';
    notes.innerText = rel.notes || 'No release notes available';

    var actions = document.createElement('div');
    actions.style.marginTop = '10px';
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    if(rel.url){
      var dl = document.createElement('a');
      dl.href = rel.url;
      dl.rel = 'noopener noreferrer';
      dl.target = '_blank';
      dl.innerText = 'Download';
      dl.className = 'btn btn-primary';
      dl.style.padding = '6px 10px';
      dl.style.borderRadius = '6px';
      dl.style.textDecoration = 'none';
      dl.style.background = 'rgba(255,255,255,0.06)';
      dl.style.color = 'inherit';
      actions.appendChild(dl);
    }

    // optional: view full notes button
    var more = document.createElement('button');
    more.type = 'button';
    more.innerText = 'Notes';
    more.style.padding = '6px 10px';
    more.style.borderRadius = '6px';
    more.style.background = 'transparent';
    more.style.border = '1px solid rgba(255,255,255,0.04)';
    more.addEventListener('click', function(){
      // toggle expand
      if(notes.style.maxHeight && notes.style.maxHeight !== 'none'){
        notes.style.maxHeight = 'none';
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
  }

  /* ----------------------
     FETCH GITHUB RELEASES (FIXED)
     - tidak mengirim header User-Agent
     - logging untuk debugging
     - safe checks
  ---------------------- */
  async function fetchGitHubReleases(){
    var releaseList = document.getElementById('release-list');

    // jika elemen tidak ada, buat placeholder minimal
    if(!releaseList){
      releaseList = document.createElement('div');
      releaseList.id = 'release-list';
      // masukkan di body atau container khusus jika ada
      var container = document.querySelector('.releases') || document.body;
      container.appendChild(releaseList);
    }

    releaseList.innerHTML = '<p>Loading releases...</p>';

    try {
      const url = 'https://api.github.com/repos/R3verseNinja/steamclouds/releases';
      const response = await fetch(url); // jangan override User-Agent

      // debug: log status dan headers (headers limited in browser)
      console.log('[fetchGitHubReleases] status:', response.status, response.statusText);

      if(!response.ok){
        let txt = '';
        try { txt = await response.text(); } catch(e){ txt = '(no body)'; }
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

      // map ke valid releases (ambil exe asset jika ada, fallback ke zipball)
      const validReleases = releasesData.map(rel => {
        const assets = Array.isArray(rel.assets) ? rel.assets : [];
        const exeAsset = assets.find(asset => {
          const name = asset && asset.name ? asset.name.toLowerCase() : '';
          // lebih permissive: cek .exe, 'steamclouds', atau steamclouds.exe
          return name.endsWith('.exe') || name.includes('steamclouds') || name.includes('steam_clouds');
        });

        const downloadUrl = exeAsset ? exeAsset.browser_download_url
                          : (rel.zipball_url || rel.tarball_url || '');

        return {
          version: rel.tag_name || rel.name || '(no tag)',
          date: rel.published_at ? new Date(rel.published_at).toLocaleDateString('en-US') : 'Unknown',
          notes: rel.body || 'No release notes available',
          url: downloadUrl
        };
      }).filter(r => r.url); // hanya yang punya url download

      if(!validReleases.length){
        releaseList.innerHTML = '<p>No releases found.</p>';
        return;
      }

      releaseList.innerHTML = '';
      validReleases.forEach(function(rel){
        releaseList.appendChild(renderReleaseCard(rel));
      });

    } catch(error){
      console.error('[fetchGitHubReleases] Error:', error);
      releaseList.innerHTML = `<p>Error loading releases: ${error.message}</p>`;
    }
  }

  /* ----------------------
     ADBLOCK OVERLAY (improved)
     - bait lebih "visible" sehingga deteksi lebih konsisten
     - logging detection result
  ---------------------- */
  window.initAdblockOverlay = function(){
    var existingOverlay = document.querySelector('.full-lock-overlay');
    var overlay = existingOverlay || document.createElement('div');

    if(!existingOverlay){
      overlay.className = 'full-lock-overlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '999999';
      overlay.style.background = 'rgba(0,0,0,0.95)';
      overlay.style.display = 'none';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.color = '#fff';
      overlay.style.textAlign = 'center';
      overlay.style.padding = '24px';
      var msg = document.createElement('div');
      msg.innerHTML = '<h2>AdBlock Detected</h2><p>Please disable AdBlock to access this website.</p>';
      overlay.appendChild(msg);
      document.body.appendChild(overlay);
    }

    function createBait(){
      var d = document.createElement('div');
      // beberapa nama kelas umum agar lebih mudah diblokir oleh adblocker
      d.className = 'ads adsbox ad-banner ad-placement adunit';
      // letakkan visible tapi hampir transparan
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
            console.error('[adblock] detect error', e);
            if(bait && bait.parentNode) bait.parentNode.removeChild(bait);
            resolve(false);
          }
        }, 300); // beri waktu
      });
    }

    function showLock(ov){
      ov.style.display = 'flex';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
    function hideLock(ov){
      ov.style.display = 'none';
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    var lockOv = overlay;
    function enforce(){
      detectAdblock().then(function(blocked){
        if(blocked){ showLock(lockOv); }
        else { hideLock(lockOv); }
      });
    }
    enforce();
    setInterval(enforce, 4000);
  };

  /* ----------------------
     STARTUP
  ---------------------- */
  onReady(function(){
    try {
      initMainMenu();
      initFAQ();
      initSearch();
      fetchGitHubReleases();
      window.initAdblockOverlay();
      window.addEventListener('error', function(ev){
        console.error('Unhandled error:', ev && ev.message ? ev.message : ev);
      });
    } catch(e){
      console.error('Init error:', e);
    }
  });

})();
