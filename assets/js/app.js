document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const mainMenu = document.getElementById('main-menu');
  
 
  function adjustMenu() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    if (isMobile) {
      menuToggle.style.display = 'block';
      mainMenu.hidden = true;
      menuToggle.setAttribute('aria-expanded', 'false');
    } else {
      menuToggle.style.display = 'none';
      mainMenu.hidden = false;
      menuToggle.setAttribute('aria-expanded', 'true');
    }
  }

  
  adjustMenu();
  window.addEventListener('resize', adjustMenu);

  
  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    mainMenu.hidden = !isExpanded;
  });
  
  
  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true' || false;
      
      document.querySelectorAll('.faq-question').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        const answer = btn.nextElementSibling;
        if (answer) {
          answer.setAttribute('aria-hidden', 'true');
        }
      });
      
      if (!expanded) {
        button.setAttribute('aria-expanded', 'true');
        const answer = button.nextElementSibling;
        if (answer) {
          answer.setAttribute('aria-hidden', 'false');
        }
      }
    });
  });
  
  const releaseList = document.getElementById('release-list');
  
  fetch('https://api.github.com/repos/R3verseNinja/steamclouds/releases/latest')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(release => {
      let steamCloudsAsset = null;
      for (let i = 0; i < release.assets.length; i++) {
        const asset = release.assets[i];
        const name = asset.name.toLowerCase();
        if (name === 'steamclouds.exe' || 
            (name.indexOf('steamclouds') !== -1 && name.substring(name.length - 4) === '.exe')) {
          steamCloudsAsset = asset;
          break;
        }
      }
      
      let assetsHTML = '';
      
      if (steamCloudsAsset) {
        assetsHTML += `
          <div class="asset-card">
            <div>
              <div class="asset-name" title="${steamCloudsAsset.name}">${steamCloudsAsset.name}</div>
              <div class="asset-size">${formatFileSize(steamCloudsAsset.size)}</div>
            </div>
            <a href="${steamCloudsAsset.browser_download_url}" class="btn">Download</a>
          </div>
        `;
      }
      
      // Add other assets if needed
      const otherAssets = release.assets.filter(asset => 
        !steamCloudsAsset || asset.id !== steamCloudsAsset.id
      );
      
      if (otherAssets.length > 0) {
        otherAssets.forEach(asset => {
          assetsHTML += `
            <div class="asset-card">
              <div>
                <div class="asset-name" title="${asset.name}">${asset.name}</div>
                <div class="asset-size">${formatFileSize(asset.size)}</div>
              </div>
              <a href="${asset.browser_download_url}" class="btn btn-outline">Download</a>
            </div>
          `;
        });
      } else if (!steamCloudsAsset) {
        assetsHTML = `
          <div class="asset-card">
            <div>
              <div class="asset-name">No executable file found</div>
              <div class="asset-size">Please contact admin on discord</div>
            </div>
            <a href="https://discord.com/invite/G89gC8wJg4" class="btn">Join Discord</a>
          </div>
        `;
      }
      
      releaseList.innerHTML = `
        <div class="release-card">
          <div class="release-header">
            <h3 class="release-title">${release.name || release.tag_name}</h3>
            <div class="release-meta">
              <span>Released on ${new Date(release.published_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              <span>Version ${release.tag_name}</span>
            </div>
          </div>
          <div class="release-body">
            <div class="release-description">${markdownToHtml(cleanedBody)}</div>
            <div class="release-assets">
              ${assetsHTML}
            </div>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error('Error fetching GitHub releases:', error);
      releaseList.innerHTML = `
        <div class="release-card">
          <div class="release-body">
            <div class="release-description">
              <p>Unable to load the latest release information. Please try again later" target="_blank">GitHub releases page</a> directly.</p>
            </div>
            <a href="https://steamclouds.online" class="btn">Steam Clouds</a>
          </div>
        </div>
      `;
    });
});

function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown.replace(/### (.*?)(\n|$)/g, '<h4>$1</h4>');
  html = html.replace(/## (.*?)(\n|$)/g, '<h3>$1</h3>');
  html = html.replace(/# (.*?)(\n|$)/g, '<h2>$1</h2>');
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
 
  html = html.replace(/^\* (.*?)(\n|$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
  
  html = html.replace(/(^|\n\n)([^\n]+)/g, '$1<p>$2</p>');
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}



