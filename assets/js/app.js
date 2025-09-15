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

  function detectAdblock(timeout = 1200) {
  return new Promise((resolve) => {
    try {
      const baitClasses = [
        'adsbox pub_300x250 ad-banner',
        'adunit adbox adsbygoogle',
        'ad-slot ad-placeholder advertisement'
      ];

      let baitBlocked = false;
      const baits = [];

      for (const cls of baitClasses) {
        const bait = document.createElement('div');
        bait.className = cls;
        bait.style.cssText = 'width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;';
        document.body.appendChild(bait);
        baits.push(bait);
      }

      setTimeout(() => {
        for (const bait of baits) {
          const style = window.getComputedStyle(bait);
          if (!style || style.display === 'none' || bait.offsetParent === null || bait.offsetHeight === 0) {
            baitBlocked = true;
            break;
          }
        }

        for (const b of baits) if (b.parentNode) b.parentNode.removeChild(b);

        if (baitBlocked) {
          return resolve(true);
        }

        const tagUrl = AD_SCRIPT_SRC + '?r=' + Date.now() + Math.random().toString(36).slice(2,8);
        let resolved = false;
        const s = document.createElement('script');
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
      }, 80);
    } catch (err) {
      console.error('detectAdblock error:', err);
      resolve(true);
    }
  });
}

function initAdblockOverlay() {
  try {
    const overlay = document.querySelector('.adblock-overlay');
    const panel = overlay?.querySelector('.adblock-panel');
    const retryBtn = overlay?.querySelector('.adblock-show-fallback');

    if (!overlay) return;

    async function initialCheck() {
      const blocked = await detectAdblock();
      if (blocked) showOverlay();
      else hideOverlay();
    }

    function showOverlay() {
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('adgate-active');
      (panel || overlay).focus?.();
      overlay.style.pointerEvents = 'auto';
    }

    function hideOverlay() {
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('adgate-active');
      overlay.style.pointerEvents = '';
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        retryBtn.setAttribute('disabled', 'true');
        const originalText = retryBtn.textContent || 'Try again';

        let consecutiveNotBlocked = 0;
        let lastWasNotBlocked = false;

        for (let i = 1; i <= 3; i++) {
          retryBtn.textContent = `Checking (${i}/3)...`;
          if (i > 1) await new Promise(r => setTimeout(r, 450));
          try {
            const blocked = await detectAdblock(1400);
            if (!blocked) {
              if (lastWasNotBlocked) consecutiveNotBlocked++;
              else consecutiveNotBlocked = 1;
              lastWasNotBlocked = true;
            } else {
              lastWasNotBlocked = false;
              consecutiveNotBlocked = 0;
            }
            if (consecutiveNotBlocked >= 2) break;
          } catch (err) {
            console.error('retry detect error', err);
            lastWasNotBlocked = false;
            consecutiveNotBlocked = 0;
          }
        }

        if (consecutiveNotBlocked >= 2) {
          retryBtn.textContent = 'AdBlock disabled — continuing...';
          setTimeout(() => {
            hideOverlay();
            retryBtn.removeAttribute('disabled');
            retryBtn.textContent = originalText;
          }, 240);
        } else {
          retryBtn.textContent = 'AdBlock still enabled - Try again.';
          setTimeout(() => {
            retryBtn.removeAttribute('disabled');
            retryBtn.textContent = originalText;
          }, 900);
        }
      });
    }

    document.addEventListener('keydown', async (e) => {
      if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
        const blocked = await detectAdblock(900);
        if (!blocked) hideOverlay();
      }
    });

    initialCheck();
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


