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

  function detectAdblock(timeout = 1200) {
    return new Promise((resolve) => {
      try {
        let resolved = false;

        function finish(val) {
          if (!resolved) {
            resolved = true;
            resolve(val);
          }
        }

        // Cek localStorage terlebih dahulu
        try {
          if (localStorage.getItem('adblock_overlay_dismissed') === '1') {
            finish(false);
            return;
          }
        } catch (e) {}

        // Metode 1: Deteksi dengan bait
        const bait = document.createElement('div');
        bait.className = 'ad-bait adsbox ad-unit';
        bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;';
        document.body.appendChild(bait);

        setTimeout(() => {
          const style = window.getComputedStyle(bait);
          const baitBlocked = !style || style.display === 'none' || 
                             bait.offsetParent === null || 
                             bait.offsetHeight === 0;
          
          if (bait.parentNode) bait.parentNode.removeChild(bait);
          
          // Jika bait menunjukkan iklan diblokir, langsung kembalikan true
          if (baitBlocked) {
            finish(true);
            return;
          }
          
          // Metode 2: Deteksi dengan script iklan
          const testScript = document.createElement('script');
          testScript.src = 'https://fpyf8.com/88/tag.min.js?_=' + Date.now();
          testScript.async = true;
          
          let scriptTimeout = setTimeout(() => {
            if (testScript.parentNode) testScript.parentNode.removeChild(testScript);
            finish(true); // Anggap diblokir jika tidak ada respons dalam waktu yang ditentukan
          }, timeout);
          
          testScript.onload = () => {
            clearTimeout(scriptTimeout);
            if (testScript.parentNode) testScript.parentNode.removeChild(testScript);
            finish(false); // Iklan berhasil dimuat, berarti tidak ada adblock
          };
          
          testScript.onerror = () => {
            clearTimeout(scriptTimeout);
            if (testScript.parentNode) testScript.parentNode.removeChild(testScript);
            finish(true); // Gagal memuat script, berarti adblock aktif
          };
          
          document.head.appendChild(testScript);
        }, 50);
      } catch (err) {
        console.error('detectAdblock error', err);
        resolve(false); // Jika terjadi error, anggap tidak ada adblock
      }
    });
  }

  function initAdblockOverlay() {
    try {
      const overlay = document.querySelector('.adblock-overlay');
      const panel = overlay ? overlay.querySelector('.adblock-panel') : null;
      const retryBtn = overlay ? overlay.querySelector('.adblock-show-fallback') : null;

      if (!overlay) return;

      function showOverlay() {
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('adgate-active');
        document.body.style.overflow = 'hidden';
        if (panel) panel.focus();
      }

      function hideOverlay(persist = false) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('adgate-active');
        document.body.style.overflow = '';
        
        try {
          if (persist) localStorage.setItem('adblock_overlay_dismissed', '1');
        } catch (e) {}
      }

      async function checkAdblock() {
        try {
          const isBlocked = await detectAdblock();
          if (isBlocked) {
            showOverlay();
          } else {
            hideOverlay(true);
          }
        } catch (err) {
          console.error('Adblock check error:', err);
          hideOverlay(true); // Asumsikan tidak ada adblock jika terjadi error
        }
      }

      if (retryBtn) {
        retryBtn.addEventListener('click', async () => {
          retryBtn.disabled = true;
          const originalText = retryBtn.textContent;
          retryBtn.textContent = 'Checking...';
          
          try {
            const isBlocked = await detectAdblock(1500);
            if (!isBlocked) {
              retryBtn.textContent = 'AdBlock disabled - Continuing...';
              setTimeout(() => hideOverlay(true), 500);
            } else {
              retryBtn.textContent = 'AdBlock still enabled - Try again.';
              setTimeout(() => {
                retryBtn.disabled = false;
                retryBtn.textContent = originalText;
              }, 1000);
            }
          } catch (err) {
            console.error('Retry check error:', err);
            retryBtn.textContent = 'Error checking - Try again.';
            setTimeout(() => {
              retryBtn.disabled = false;
              retryBtn.textContent = originalText;
            }, 1000);
          }
        });
      }

      // Cek localStorage terlebih dahulu
      try {
        if (localStorage.getItem('adblock_overlay_dismissed') === '1') {
          hideOverlay();
          return;
        }
      } catch (e) {}

      // Lakukan deteksi awal
      checkAdblock();
      
      // Tambahkan tombol escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.style.display !== 'none') {
          hideOverlay();
        }
      });
    } catch (err) {
      console.error('initAdblockOverlay error:', err);
    }
  }

  onReady(function () {
    initMainMenu();
    initFAQ();
    initAdblockOverlay();

    window.addEventListener('error', function (ev) {
      console.warn('window.onerror', ev.message, ev.filename, ev.lineno);
    });
  });
})();
