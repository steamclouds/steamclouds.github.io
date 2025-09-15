(function () {
  'use strict';

  const AD_SCRIPT_SRC = 'https://fpyf8.com/88/tag.min.js';

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
      const questions = Array.from(document.querySelectorAll('.faq-question'));
      if (!questions.length) return;

      questions.forEach((btn) => {
        const answer = btn.nextElementSibling;
        if (!answer || !answer.classList.contains('faq-answer')) return;

        btn.setAttribute('aria-expanded', 'false');
        answer.setAttribute('aria-hidden', 'true');

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
    const full = answer.scrollHeight;
    answer.style.maxHeight = full + 'px';
  }

  function closeAnswer(btn, answer) {
    btn.setAttribute('aria-expanded', 'false');
    answer.setAttribute('aria-hidden', 'true');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    requestAnimationFrame(() => { answer.style.maxHeight = '0px'; });
    answer.addEventListener('transitionend', function _te() {
      answer.classList.remove('open');
      answer.removeEventListener('transitionend', _te);
      answer.style.maxHeight = '';
    });
  }

  function detectAdblock(timeout = 900) {
    return new Promise((resolve) => {
      try {
        let detected = false;

        const bait = document.createElement('div');
        bait.className = 'ad-banner adsbox adunit pub_300x250';
        bait.style.width = '1px';
        bait.style.height = '1px';
        bait.style.position = 'absolute';
        bait.style.left = '-9999px';
        document.body.appendChild(bait);

        const baitStyle = window.getComputedStyle(bait);
        if (!baitStyle || baitStyle.display === 'none' || bait.offsetParent === null || bait.offsetHeight === 0) detected = true;

        document.body.removeChild(bait);

        if (detected) return resolve(true);

        const s = document.createElement('script');
        s.async = true;
        s.src = AD_SCRIPT_SRC + '?r=' + Date.now();
        let resolved = false;

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
      } catch (err) {
        console.error('detectAdblock error:', err);
        resolve(false);
      }
    });
  }

  function initAdblockOverlay() {
    try {
      const overlay = document.querySelector('.adblock-overlay');
      const panel = overlay?.querySelector('.adblock-panel');
      const retryBtn = overlay?.querySelector('.adblock-show-fallback');

      if (!overlay) return;

      async function checkAndShow() {
        const isBlocked = await detectAdblock();
        if (isBlocked) showOverlay();
        else hideOverlay();
      }

      function showOverlay() {
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('adgate-active');
        (panel || overlay).focus?.();
      }

      function hideOverlay() {
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('adgate-active');
      }

      if (retryBtn) {
        retryBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          // disable button & show progress
          retryBtn.setAttribute('disabled', 'true');
          const original = retryBtn.textContent;
          retryBtn.textContent = 'Checking (1/3)...';

          // Run multiple attempts and require consecutive success
          const attempts = 3;
          let consecutiveSuccess = 0;
          let lastResult = null;

          for (let i = 1; i <= attempts; i++) {
            retryBtn.textContent = `Checking (${i}/${attempts})...`;
            try {
              // small delay between attempts to allow user to disable/whitelist
              if (i > 1) await new Promise(r => setTimeout(r, 450));
              const blocked = await detectAdblock(1200);
              lastResult = blocked;
              if (!blocked) {
                consecutiveSuccess++;
              } else {
                consecutiveSuccess = 0;
              }

              // require 2 consecutive non-blocked results to accept
              if (consecutiveSuccess >= 2) {
                break;
              }
            } catch (err) {
              console.error('retry detect error', err);
            }
          }

          // finalize
          if (lastResult === false && consecutiveSuccess >= 2) {
            retryBtn.textContent = 'AdBlock disabled — continuing...';
            setTimeout(() => hideOverlay(), 220);
          } else {
            retryBtn.textContent = 'AdBlock still enabled - Try again.';
            setTimeout(() => {
              retryBtn.removeAttribute('disabled');
              retryBtn.textContent = original || 'AdBlock disabled - Try again.';
            }, 900);
          }
        });
      }

      // Only allow closing overlay via Escape (not click outside)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
          hideOverlay();
        }
      });

      // disable click-outside-to-close by not listening for overlay clicks
      // initial check
      checkAndShow();
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
