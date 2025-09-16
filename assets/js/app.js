(function () {
  'use strict';

  const releaseList = document.getElementById("release-list");
  const searchInput = document.getElementById("search");

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '<',
      '>': '>',
      '"': '&quot;',
      "'": '&#39;'
    })[c] || '');
  }

  function decodeHTMLEntities(str) {
    if (!str) return '';
    return str.replace(/&amp;/g, '&')
              .replace(/</g, '<')
              .replace(/>/g, '>')
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"');
  }

  function safeHref(s) {
    try {
      if (!s) return '#';
      if (s.startsWith('#') || s.startsWith('http://') || s.startsWith('https://')) return s;
      return encodeURI(s);
    } catch (e) { return '#'; }
  }

  function renderReleaseCard(release) {
    const card = document.createElement("div");
    card.className = "release-card";

    const cleanedNotes = release.notes
      .replace(/```\n?/g, '')
      .replace(/• /g, '-')
      .replace(/^- /, "")
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.replace(/^[-•] /, ''))
      .join('\n');

    const notesList = cleanedNotes.split('\n').map(note =>
      `<li>${escapeHtml(note.trim())}</li>`
    ).join('');

    card.innerHTML = `
      <div class="card-main">
        <h2>Version ${escapeHtml(release.version)}</h2>
        <ul class="release-notes-list">
          ${notesList}
        </ul>
        <div class="meta">Released: ${escapeHtml(release.date)}</div>
      </div>
      <div class="card-actions">
        <a class="btn small" href="${safeHref(release.url)}" target="_blank" rel="noopener">Download</a>
      </div>
    `;

    return card;
  }

  async function fetchGitHubReleases() {
    try {
      const response = await fetch('https://api.github.com/repos/R3verseNinja/steamclouds/releases', {
        headers: { 'User-Agent': 'SteamCloudsApp' }
      });

      if (!response.ok) {
        throw new Error(`Error fetching releases: ${response.statusText}`);
      }

      const releasesData = await response.json();

      const validReleases = releasesData
        .filter(rel => !rel.draft && !rel.prerelease)
        .map(rel => {
          const exeAsset = rel.assets.find(asset =>
            asset.name.toLowerCase().endsWith('.exe') ||
            asset.name.toLowerCase().includes('steamclouds')
          );

          return {
            version: rel.tag_name,
            date: new Date(rel.published_at).toLocaleDateString('en-US'),
            notes: rel.body || 'No release notes available',
            url: exeAsset ? exeAsset.browser_download_url : '#'
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      releaseList.innerHTML = '';
      validReleases.forEach(rel => {
        releaseList.appendChild(renderReleaseCard(rel));
      });
    } catch (error) {
      console.error("Error:", error);
      releaseList.innerHTML = `<p>Error loading releases: ${escapeHtml(error.message)}</p>`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      const cards = Array.from(releaseList.children);

      cards.forEach(card => {
        const version = card.querySelector('h2').textContent.toLowerCase();
        const notes = card.querySelector('.release-notes-list').textContent.toLowerCase();

        if (version.includes(term) || notes.includes(term)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetchGitHubReleases();
  });

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function initMainMenu() {
    try {
      const menuToggle = document.getElementById('menuToggle');
      const mainMenu = document.getElementById('main-menu');

      if (!menuToggle || !mainMenu) return;

      function openMenu() {
        mainMenu.hidden = false;
        menuToggle.setAttribute('aria-expanded', 'true');
        mainMenu.querySelectorAll('a[role="menuitem"]')[0]?.focus();
      }

      function closeMenu() {
        mainMenu.hidden = true;
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }

      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mainMenu.hidden) openMenu();
        else closeMenu();
      });

      document.addEventListener('click', (e) => {
        if (!mainMenu.hidden && !mainMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMenu();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mainMenu.hidden) closeMenu();
      });

      mainMenu.addEventListener('click', (e) => {
        const a = e.target.closest('a[role="menuitem"]');
        if (a) closeMenu();
      });
    } catch (err) {
      console.error('initMainMenu error:', err);
    }
  }

  function initFAQ() {
    try {
      const items = Array.from(document.querySelectorAll('.faq-item'));
      if (!items.length) return;

      items.forEach(item => {
        const btn = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!btn || !answer) return;

        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        answer.setAttribute('aria-hidden', 'true');
        answer.style.maxHeight = '0px';

        btn.addEventListener('click', () => {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          if (!expanded) openAnswer(btn, answer);
          else closeAnswer(btn, answer);
        });

        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
          }
        });
      });
    } catch (err) {
      console.error('initFAQ error:', err);
    }
  }

  function openAnswer(btn, answer) {
    btn.setAttribute('aria-expanded', 'true');
    answer.setAttribute('aria-hidden', 'false');
    answer.classList.add('open');
    answer.style.display = '';
    const full = answer.scrollHeight;
    answer.style.maxHeight = full + 'px';
  }

  function closeAnswer(btn, answer) {
    btn.setAttribute('aria-expanded', 'false');
    answer.setAttribute('aria-hidden', 'true');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    requestAnimationFrame(() => { answer.style.maxHeight = '0px'; });
    const onEnd = function () {
      answer.classList.remove('open');
      answer.style.display = '';
      answer.removeEventListener('transitionend', onEnd);
    };
    answer.addEventListener('transitionend', onEnd);
  }

  document.addEventListener('DOMContentLoaded', function(){
  function renderReleases(releases){
    var container = document.getElementById('release-list');
    if (!container){
      var sec = document.getElementById('releases');
      if (sec){
        container = document.createElement('div');
        container.id = 'release-list';
        container.className = 'release-grid';
        sec.appendChild(container);
      }
    }
    if (!container) return;
    container.innerHTML = '';
    releases.forEach(function(r){
      var card = document.createElement('article');
      card.className = 'release-card';
      var t = '<div class="release-meta"><h3 class="release-title">'+(r.title||'Unknown')+'</h3><p class="release-sub">'+(r.subtitle||'')+'</p></div>';
      t += '<div class="release-actions"><a href="'+(r.link||'#')+'" class="btn">Download</a></div>';
      card.innerHTML = t;
      container.appendChild(card);
    });
    container.style.display = '';
  }

  renderReleases([
    { title: 'Example Release — Test', subtitle: 'Sample latest download card', link: '#' }
  ]);

  var adContainer = document.querySelector('.ad-container');
  var insEl = document.querySelector('ins.adsbygoogle');
  function createBaits(){
    var classes = ['adsbox','ad-banner','adunit','adsbygoogle','doubleclick','googad'];
    var nodes = [];
    classes.forEach(function(c){
      var d = document.createElement('div');
      d.className = c;
      d.style.width = '1px';
      d.style.height = '1px';
      d.style.position = 'absolute';
      d.style.left = '-9999px';
      document.body.appendChild(d);
      nodes.push(d);
    });
    return nodes;
  }
  function removeBaits(nodes){
    nodes.forEach(function(n){ try{ n.parentNode && n.parentNode.removeChild(n); }catch(e){} });
  }
  function checkBaits(){
    var nodes = createBaits();
    var blocked = false;
    nodes.forEach(function(n){
      var rect = n.getBoundingClientRect();
      var style = window.getComputedStyle(n);
      if (rect.width === 0 && rect.height === 0) blocked = true;
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) blocked = true;
    });
    removeBaits(nodes);
    return blocked;
  }
  function checkIns(){
    var ins = document.querySelector('ins.adsbygoogle');
    if (!ins) return true;
    var rect = ins.getBoundingClientRect();
    var style = window.getComputedStyle(ins);
    if (rect.width < 8 || rect.height < 8) return true;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return true;
    return false;
  }
  function checkScriptLoad(timeout){
    return new Promise(function(resolve){
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?cb=' + Date.now();
      var done = false;
      s.onload = function(){ if (!done){ done = true; try{ s.parentNode && s.parentNode.removeChild(s); }catch(e){}; resolve(false); } };
      s.onerror = function(){ if (!done){ done = true; try{ s.parentNode && s.parentNode.removeChild(s); }catch(e){}; resolve(true); } };
      document.head.appendChild(s);
      setTimeout(function(){ if (!done){ done = true; try{ s.parentNode && s.parentNode.removeChild(s); }catch(e){}; resolve(true); } }, timeout || 1500);
    });
  }
  function detectAdblock(){
    return new Promise(function(resolve){
      try{
        var bait = checkBaits();
        var ins = checkIns();
        checkScriptLoad(1200).then(function(scrBlocked){
          resolve(bait || ins || scrBlocked);
        }).catch(function(){ resolve(true); });
      }catch(e){
        resolve(true);
      }
    });
  }
  function createLockOverlay(){
    var ov = document.querySelector('.full-lock-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.className = 'full-lock-overlay';
    ov.setAttribute('role','dialog');
    ov.setAttribute('aria-modal','true');
    ov.setAttribute('aria-hidden','true');
    ov.style.position = 'fixed';
    ov.style.inset = '0';
    ov.style.zIndex = '999999';
    ov.style.background = 'rgba(0,0,0,0.92)';
    ov.style.display = 'none';
    ov.style.alignItems = 'center';
    ov.style.justifyContent = 'center';
    ov.style.textAlign = 'center';
    ov.style.color = '#fff';
    ov.style.padding = '24px';
    var panel = document.createElement('div');
    panel.style.maxWidth = '720px';
    panel.style.width = '100%';
    panel.style.margin = '0 16px';
    var h = document.createElement('h2');
    h.textContent = 'Ads blocked — site locked';
    h.style.margin = '0 0 12px';
    var p = document.createElement('p');
    p.textContent = 'You are using an ad blocker. Please whitelist this site to continue using it. You can also view our sponsor banner.';
    p.style.margin = '0 0 18px';
    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.style.justifyContent = 'center';
    var btnWhitelist = document.createElement('button');
    btnWhitelist.textContent = 'I whitelisted';
    btnWhitelist.style.padding = '10px 14px';
    var btnSponsor = document.createElement('button');
    btnSponsor.textContent = 'Show sponsor';
    btnSponsor.style.padding = '10px 14px';
    var btnVisit = document.createElement('a');
    btnVisit.textContent = 'Learn why';
    btnVisit.href = '#';
    btnVisit.style.padding = '10px 14px';
    btnVisit.style.border = '1px solid rgba(255,255,255,0.12)';
    btnVisit.style.color = '#fff';
    btnWhitelist.addEventListener('click', function(){
      try{ localStorage.setItem('adblockIgnore_v4','1'); }catch(e){}
      hideLock(ov);
      tryEnableAds();
      setTimeout(function(){ detectAdblock().then(function(blocked){ if (blocked) showLock(ov); }); }, 1000);
    });
    btnSponsor.addEventListener('click', function(){
      if (adContainer) adContainer.classList.add('show-fallback');
      hideLock(ov);
      try{ localStorage.setItem('adblockFallback_v4','1'); }catch(e){}
    });
    btnVisit.addEventListener('click', function(e){ try{ window.open('https://example.com/why-ads','_blank'); }catch(err){} });
    controls.appendChild(btnWhitelist);
    controls.appendChild(btnSponsor);
    controls.appendChild(btnVisit);
    panel.appendChild(h);
    panel.appendChild(p);
    panel.appendChild(controls);
    ov.appendChild(panel);
    document.body.appendChild(ov);
    ov.addEventListener('keydown', function(e){ e.stopPropagation(); e.preventDefault(); });
    document.addEventListener('keydown', function(e){
      if (ov.style.display !== 'none') e.preventDefault();
    }, true);
    document.addEventListener('contextmenu', function(e){
      if (ov.style.display !== 'none') e.preventDefault();
    }, true);
    return ov;
  }
  function showLock(ov){
    ov.setAttribute('aria-hidden','false');
    ov.style.display = 'flex';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    var main = document.querySelector('main') || document.querySelector('body');
    if (main) main.setAttribute('aria-hidden','true');
  }
  function hideLock(ov){
    ov.setAttribute('aria-hidden','true');
    ov.style.display = 'none';
    document.documentElement.style.overflow = '';
    document.body.style.touchAction = '';
    var main = document.querySelector('main') || document.querySelector('body');
    if (main) main.removeAttribute('aria-hidden');
  }
  function tryEnableAds(){
    try{ (adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){}
  }

  var lockOv = createLockOverlay();
  function enforce(){
    if (localStorage.getItem('adblockFallback_v4') === '1') return;
    if (localStorage.getItem('adblockIgnore_v4') === '1') return;
    detectAdblock().then(function(blocked){
      if (blocked){
        showLock(lockOv);
      } else {
        hideLock(lockOv);
      }
    });
  }
  enforce();
  setInterval(enforce, 4000);
});

  onReady(function () {
    initMainMenu();
    initFAQ();
    initAdblockOverlay();

    window.addEventListener('error', function (ev) {
      console.warn('window.onerror', ev.message, ev.filename, ev.lineno);
    });
  });
})();



