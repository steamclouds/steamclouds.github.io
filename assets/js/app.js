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

  const AD_SCRIPT_SRC = "https://fpyf8.com/88/tag.min.js";

function detectAdblock(timeout = 1200) {
  return new Promise((resolve) => {
    try {
      const bait = document.createElement("div");
      bait.className = "adsbox pub_300x250 ad-banner adunit adbox adsbygoogle";
      bait.style.cssText = "width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;";
      document.body.appendChild(bait);

      setTimeout(() => {
        let blocked = false;
        const style = window.getComputedStyle(bait);
        if (!style || style.display === "none" || bait.offsetParent === null || bait.offsetHeight === 0) {
          blocked = true;
        }
        if (bait.parentNode) bait.parentNode.removeChild(bait);

        if (blocked) return resolve(true);

        const tagUrl = AD_SCRIPT_SRC + "?r=" + Date.now() + Math.random().toString(36).slice(2, 8);
        let resolved = false;
        const s = document.createElement("script");
        s.async = true;
        s.src = tagUrl;

        s.onload = function () {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(false);
          }
        };

        s.onerror = function () {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(true);
          }
        };

        const to = setTimeout(function () {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(true);
          }
        }, timeout);

        function cleanup() {
          clearTimeout(to);
          if (s.parentNode) s.parentNode.removeChild(s);
        }

        (document.head || document.documentElement).appendChild(s);
      }, 60);
    } catch (err) {
      console.error("detectAdblock error:", err);
      resolve(true);
    }
  });
}

function initAdblockOverlay() {
  try {
    const overlay = document.querySelector(".adblock-overlay");
    const panel = overlay?.querySelector(".adblock-panel");
    const retryBtn = overlay?.querySelector(".adblock-show-fallback");

    if (!overlay) return;

    async function initialCheck() {
      const blocked = await detectAdblock();
      if (blocked) showOverlay();
      else hideOverlay();
    }

    function showOverlay() {
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("adgate-active");
      (panel || overlay).focus?.();
      overlay.style.pointerEvents = "auto";
    }

    function hideOverlay() {
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("adgate-active");
      overlay.style.pointerEvents = "";
    }

    if (retryBtn) {
      retryBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        retryBtn.setAttribute("disabled", "true");
        const originalText = retryBtn.textContent;
        retryBtn.textContent = "Checking...";

        try {
          const blocked = await detectAdblock(1400);
          if (!blocked) {
            retryBtn.textContent = "AdBlock disabled — continuing...";
            setTimeout(() => {
              hideOverlay();
              retryBtn.removeAttribute("disabled");
              retryBtn.textContent = originalText || "AdBlock disabled - Try again.";
            }, 240);
          } else {
            retryBtn.textContent = "AdBlock still enabled - Try again.";
            setTimeout(() => {
              retryBtn.removeAttribute("disabled");
              retryBtn.textContent = originalText || "AdBlock disabled - Try again.";
            }, 900);
          }
        } catch (err) {
          console.error("retry detect error", err);
          retryBtn.removeAttribute("disabled");
          retryBtn.textContent = originalText || "AdBlock disabled - Try again.";
        }
      });
    }

    document.addEventListener("keydown", async (e) => {
      if (e.key === "Escape" && overlay.getAttribute("aria-hidden") === "false") {
        const blocked = await detectAdblock(900);
        if (!blocked) hideOverlay();
      }
    });

    initialCheck();
  } catch (err) {
    console.error("initAdblockOverlay error:", err);
  }
}

initAdblockOverlay();

  onReady(function () {
    initMainMenu();
    initFAQ();
    initAdblockOverlay();

    window.addEventListener('error', function (ev) {
      console.warn('window.onerror', ev.message, ev.filename, ev.lineno);
    });
  });
})();

