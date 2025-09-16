// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const mainMenu = document.getElementById('main-menu');

    // Fungsi untuk menyesuaikan tampilan menu berdasarkan ukuran layar
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

    // Panggil fungsi saat halaman dimuat dan saat window di-resize
    adjustMenu();
    window.addEventListener('resize', adjustMenu);

    // Event listener untuk tombol menu
    menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        mainMenu.hidden = !isExpanded;
    });

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const expanded = button.getAttribute('aria-expanded') === 'true' || false;

            // Close all
            document.querySelectorAll('.faq-question').forEach(btn => {
                btn.setAttribute('aria-expanded', 'false');
                const answer = btn.nextElementSibling;
                if (answer) {
                    answer.setAttribute('aria-hidden', 'true');
                }
            });

            // Toggle current
            if (!expanded) {
                button.setAttribute('aria-expanded', 'true');
                const answer = button.nextElementSibling;
                if (answer) {
                    answer.setAttribute('aria-hidden', 'false');
                }
            }
        });
    });

// pastikan elemen ada
    const releaseList = document.getElementById('release-list');
    if (!releaseList) {
        console.error('release-list element not found!');
    } else {
        const url = 'https://api.github.com/repos/R3verseNinja/steamclouds/releases/latest';
        const controller = new AbortController();
        const timeoutMs = 10000; // 10 detik timeout
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutMs);

        console.log('Fetching latest release (with 10s timeout)...');

        fetch(url, {signal: controller.signal})
            .then(response => {
                clearTimeout(timeoutId);
                console.log('Fetch response status:', response.status);
                if (!response.ok) {
                    // Jika GitHub blok atau rate-limited, kita tangani di sini
                    return response.json().then(body => {
                        console.error('GitHub API returned error:', body);
                        throw new Error(`GitHub API ${response.status}`);
                    }).catch(() => {
                        throw new Error(`GitHub API ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(release => {
                // safety: pastikan assets array
                const assets = Array.isArray(release.assets) ? release.assets : [];

                // cari exe utama
                let mainExe = null;
                for (let i = 0; i < assets.length; i++) {
                    const a = assets[i];
                    const n = (a.name || '').toLowerCase();
                    if (n === 'steamclouds.exe' || (n.indexOf('steamclouds') !== -1 && n.endsWith('.exe'))) {
                        mainExe = a;
                        break;
                    }
                }

                // urutkan sehingga exe utama di atas
                let sortedAssets = mainExe ? [mainExe].concat(assets.filter(a => a.id !== mainExe.id)) : assets.slice();

                // build HTML seperti sebelumnya
                let assetsHTML = '';
                if (sortedAssets.length === 0) {
                    assetsHTML = `
          <div class="asset-row">
            <div class="asset-card">
              <div>
                <div class="asset-name">No assets found</div>
                <div class="asset-size">Check releases on GitHub</div>
              </div>
            </div>
            <div class="asset-actions">
              <a href="https://github.com/R3verseNinja/steamclouds/releases" class="btn">View</a>
            </div>
          </div>
        `;
                } else {
                    sortedAssets.forEach(asset => {
                        const safeName = (asset.name || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
                        const dl = asset.browser_download_url || '#';
                        const isMain = mainExe && asset.id === mainExe.id;
                        assetsHTML += `
            <div class="asset-row ${isMain ? 'asset-main' : ''}">
              <div class="asset-card" role="group" aria-label="${safeName}">
                <div style="display:flex;flex-direction:column;gap:0.2rem;">
                  <div class="asset-name" title="${safeName}">${safeName}</div>
                  <div class="asset-size">${formatFileSize(asset.size || 0)}</div>
                </div>
              </div>
              <div class="asset-actions">
                <a href="${dl}" class="btn" download>Download</a>
              </div>
            </div>
          `;
                    });
                }

                const published = release.published_at ? new Date(release.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'Unknown date';

                releaseList.innerHTML = `
        <div class="release-card">
          <div class="release-header">
            <h3 class="release-title">${(release.name || release.tag_name || '')}</h3>
            <div class="release-meta">
              <span>Released on ${published}</span>
              <span>Version ${release.tag_name || ''}</span>
            </div>
          </div>

          <div class="release-body">
            <div class="release-assets">
              ${assetsHTML}
            </div>
          </div>
        </div>
      `;

                console.log('Release rendered successfully.');
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.error('Fetch error / aborted:', err && err.name ? err.name : err);
                // tampilkan fallback agar spinner berhenti dan user tahu ada masalah
                releaseList.innerHTML = `
        <div class="release-card">
          <div class="release-body">
            <div class="release-description">
              <p>Unable to load the latest release information. Possible reasons: network blocked, CORS, or GitHub rate-limit. Try open console (F12) for details.</p>
            </div>
            <div style="display:flex;gap:0.6rem;justify-content:center;margin-top:1rem;">
              <a href="https://github.com/R3verseNinja/steamclouds/releases" class="btn">View Releases</a>
              <button class="btn btn-outline" id="retryReleaseBtn">Retry</button>
            </div>
          </div>
        </div>
      `;

                // optional: retry button handler
                const retryBtn = document.getElementById('retryReleaseBtn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        // reload the page or re-run fetch — here kita reload agar semua state bersih
                        location.reload();
                    });
                }
            });
    }


// helper
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatFileSize(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
})
