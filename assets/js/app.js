
const releaseList = document.getElementById("release-list");
const searchInput = document.getElementById("search");
const menuToggle = document.getElementById("menuToggle");
const mainMenu = document.getElementById("main-menu");
const faqQuestions = document.querySelectorAll(".faq-question");
const adblockOverlay = document.querySelector(".adblock-overlay");
const adblockFallbackBtn = document.querySelector(".adblock-show-fallback");


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
    const response = await fetch('https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec');
    
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
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Urutkan dari terbaru
    
    releaseList.innerHTML = '';
    validReleases.forEach(rel => {
      releaseList.appendChild(renderReleaseCard(rel));
    });
  } catch (error) {
    console.error("Error:", error);
    releaseList.innerHTML = `<p>Error loading releases: ${error.message}</p>`;
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

function initMenu() {
  if (!menuToggle || !mainMenu) return;
  
  function openMenu() {
    mainMenu.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    const firstItem = mainMenu.querySelector('[role="menuitem"], a, button');
    if (firstItem) firstItem.focus();
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleMenuKeydown);
  }
  
  function closeMenu() {
    mainMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleMenuKeydown);
  }
  
  function handleOutsideClick(e) {
    if (!menuToggle.contains(e.target) && !mainMenu.contains(e.target)) {
      closeMenu();
    }
  }
  
  function handleMenuKeydown(e) {
    if (e.key === 'Escape') {
      closeMenu();
      menuToggle.focus();
    }
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = Array.from(mainMenu.querySelectorAll('[role="menuitem"], a, button'));
      if (!items.length) return;
      
      const currentIndex = items.indexOf(document.activeElement);
      let nextIndex;
      
      if (e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % items.length;
      } else {
        nextIndex = (currentIndex - 1 + items.length) % items.length;
      }
      
      items[nextIndex].focus();
      e.preventDefault();
    }
  }
  
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    isExpanded ? closeMenu() : openMenu();
  });
  
  mainMenu.addEventListener('click', (e) => {
    const target = e.target.closest('a, button');
    if (target) closeMenu();
  });
}

function initFAQ() {
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const isExpanded = question.getAttribute('aria-expanded') === 'true';
      
      document.querySelectorAll('.faq-answer').forEach(item => {
        item.classList.remove('open');
        item.style.maxHeight = null;
        item.setAttribute('aria-hidden', 'true');
      });
      
      document.querySelectorAll('.faq-question').forEach(item => {
        item.setAttribute('aria-expanded', 'false');
      });
      
      if (!isExpanded) {
        answer.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        answer.setAttribute('aria-hidden', 'false');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

function initAdblockDetection() {
  if (!adblockOverlay || !adblockFallbackBtn) return;
  
  function hideAdblockOverlay(persist = false) {
    adblockOverlay.style.display = 'none';
    adblockOverlay.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('adgate-active');
    document.body.style.overflow = '';
    
    try {
      if (persist) localStorage.setItem('adblock_overlay_dismissed', '1');
    } catch (e) {}
  }
  
  function showAdblockOverlay() {
    adblockOverlay.style.display = 'flex';
    adblockOverlay.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('adgate-active');
    document.body.style.overflow = 'hidden';
  }
  
  function detectAdblock() {
    try {
      if (localStorage.getItem('adblock_overlay_dismissed') === '1') {
        hideAdblockOverlay();
        return;
      }
      
      const testScript = document.createElement('script');
      testScript.src = 'https://fpyf8.com/88/tag.min.js?_=' + Date.now();
      testScript.async = true;
      
      let fired = false;
      const timeout = setTimeout(() => {
        if (!fired) {
          fired = true;
          detectBait();
        }
      }, 1200);
      
      testScript.onload = () => {
        fired = true;
        clearTimeout(timeout);
        hideAdblockOverlay();
      };
      
      testScript.onerror = () => {
        fired = true;
        clearTimeout(timeout);
        detectBait();
      };
      
      function detectBait() {
        const bait = document.createElement('div');
        bait.className = 'ad-bait adsbox ad-unit';
        bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;';
        document.body.appendChild(bait);
        
        const isBlocked = getComputedStyle(bait).display === 'none' || 
                          bait.offsetParent === null || 
                          bait.clientHeight === 0;
        
        document.body.removeChild(bait);
        
        if (isBlocked) {
          showAdblockOverlay();
        } else {
          hideAdblockOverlay();
        }
      }
      
      document.head.appendChild(testScript);
    } catch (e) {
      hideAdblockOverlay();
    }
  }
  
  adblockFallbackBtn.addEventListener('click', () => {
    hideAdblockOverlay(true);
  });
  
  detectAdblock();
}

document.addEventListener("DOMContentLoaded", () => {
  fetchGitHubReleases();
  initMenu();
  initFAQ();
  initAdblockDetection();
});
