// assets/js/app.js
(function () {
  'use strict';

  const AD_SCRIPT_SRC = 'https://fpyf8.com/88/tag.min.js'; // dari index.html (digunakan untuk deteksi)

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // -------------------------
  // Menu toggle (accessible)
  // -------------------------
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

      // close when clicking outside
      document.addEventListener('click', (e) => {
        if (!mainMenu.hidden && !mainMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMenu();
        }
      });

      // close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mainMenu.hidden) closeMenu();
      });

      // Manage focus trapping lightly (close when a menu item clicked)
      mainMenu.addEventListener('click', (e) => {
        const a = e.target.closest('a[role="menuitem"]');
        if (a) {
          closeMenu(); // navigate normally
        }
      });
    } catch (err) {
      console.error('initMainMenu error:', err);
    }
  }

  // -------------------------
  // FAQ toggles
  // -------------------------
  function initFAQ() {
    try {
      const questions = Array.from(document.querySelectorAll('.faq-question'));
      if (!questions.length) return;

      questions.forEach((btn) => {
        // locate answer element (immediately following .faq-answer)
        const answer = btn.nextElementSibling;
        if (!answer || !answer.classList.contains('faq-answer')) return;

        // initial accessibility
        btn.setAttribute('aria-expanded', 'false');
        answer.setAttribute('aria-hidden', 'true');

        btn.addEventListener('click', () => {
          const expanded = btn.getAttribute('aria-expanded') === 'true';

          if (!expanded) {
            openAnswer(btn, answer);
          } else {
            closeAnswer(btn, answer);
          }
        });

        // support keyboard Enter / Space
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

    // smooth expand using scrollHeight
    const full = answer.scrollHeight;
    answer.style.maxHeight = full + 'px';
  }

  function closeAnswer(btn, answer) {
    btn.setAttribute('aria-expanded', 'false');
    answer.setAttribute('aria-hidden', 'true');

    // animate collapse
    answer.style.maxHeight = answer.scrollHeight + 'px';
    // force repaint then set to 0
    requestAnimationFrame(() => {
      answer.style.maxHeight = '0px';
    });

    // remove open class after transition
    answer.addEventListener('transitionend', function _te() {
      answer.classList.remove('open');
      answer.removeEventListener('transitionend', _te);
      answer.style.maxHeight = '';
    });
  }

  // -------------------------
  // AdBlock detection + overlay
  // -------------------------
  function detectAdblock(timeout = 900) {
    // returns Promise<boolean> true = blocked
    return new Promise((resolve) => {
      try {
        let detected = false;

        // 1) bait element technique
        const bait = document.createElement('div');
        bait.className = 'ad-banner adsbox adunit pub_300x250';
        // visually hide but still in layout
        bait.style.width = '1px';
        bait.style.height = '1px';
        bait.style.position = 'absolute';
        bait.style.left = '-9999px';
        document.body.appendChild(bait);

        // if adblock removes or hides it via display:none
        const baitStyle = window.getComputedStyle(bait);
        if (!baitStyle || baitStyle.display === 'none' || bait.offsetParent === null || bait.offsetHeight === 0) {
          detected = true;
        }

        // remove bait
        document.body.removeChild(bait);

        if (detected) {
          // immediate resolve
          return resolve(true);
        }

        // 2) try to load an ad script (duplicate load) and see if onerror fires
        // add cache buster param to avoid cached results
        const s = document.createElement('script');
        s.async = true;
        s.src = AD_SCRIPT_SRC + '?r=' + Date.now();
        let resolved = false;

        s.onload = function () {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(false); // loaded => not blocked
          }
        };

        s.onerror = function () {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(true); // blocked
          }
        };

        // fallback timeout: if neither onload nor onerror fired in time, assume blocked
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

        // append to head
        (document.head || document.documentElement).appendChild(s);
      } catch (err) {
        console.error('detectAdblock error:', err);
        // be safe: if detection fails, assume not blocked
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
        if (isBlocked) {
          showOverlay();
        } else {
          hideOverlay();
        }
      }

      function showOverlay() {
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('adgate-active');
        // move focus to panel for accessibility
        const focusable = panel?.querySelector('button, [tabindex], a');
        (focusable || panel).focus?.();
      }

      function hideOverlay() {
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('adgate-active');
      }

      // retry button: re-run detection
      if (retryBtn) {
        retryBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          retryBtn.setAttribute('disabled', 'true');
          retryBtn.textContent = 'Checking...';
          try {
            const blocked = await detectAdblock();
            if (!blocked) {
              hideOverlay();
            } else {
              // remain visible, maybe show message briefly
              retryBtn.textContent = 'AdBlock still enabled - Try again.';
              setTimeout(() => {
                retryBtn.removeAttribute('disabled');
                retryBtn.textContent = 'AdBlock disabled - Try again.';
              }, 800);
            }
          } catch (err) {
            console.error(err);
            retryBtn.removeAttribute('disabled');
            retryBtn.textContent = 'AdBlock disabled - Try again.';
          }
        });
      }

      // close overlay if user presses Escape (but don't allow accidental bypass)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
          // let them close overlay with ESC
          hideOverlay();
        }
      });

      // click outside panel to close (optional)
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          hideOverlay();
        }
      });

      // initial check
      checkAndShow();
    } catch (err) {
      console.error('initAdblockOverlay error:', err);
    }
  }

  // -------------------------
  // Run initialization
  // -------------------------
  onReady(function () {
    initMainMenu();
    initFAQ();
    initAdblockOverlay();

    // small defensive guard: log uncaught errors so dev can see console problems
    window.addEventListener('error', function (ev) {
      console.warn('window.onerror', ev.message, ev.filename, ev.lineno);
    });
  });
})();
