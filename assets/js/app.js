// DOM references
const releaseList = document.getElementById("release-list");
const searchInput = document.getElementById("search");

// Helper untuk menghindari XSS
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '<',
    '>': '>',
    '"': '&quot;',
    "'": '&#39;'
  })[c] || '');
}

// Helper untuk dekode HTML entities
function decodeHTMLEntities(str) {
  if (!str) return '';
  return str.replace(/&amp;/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"');
}

// Helper untuk mengamankan URL
function safeHref(s) {
  try {
    if (!s) return '#';
    if (s.startsWith('#') || s.startsWith('http://') || s.startsWith('https://')) return s;
    return encodeURI(s);
  } catch (e) { return '#'; }
}

// Fungsi untuk merender satu kartu release
function renderReleaseCard(release) {
  const card = document.createElement("div");
  card.className = "release-card";
  
  // Hapus karakter tidak penting dan garis kosong
  const cleanedNotes = release.notes
    .replace(/```\n?/g, '')          // Hapus ``` jika ada
    .replace(/• /g, '-')             // Ganti • dengan -
    .replace(/^- /, "")              // Hapus bullet point pertama (jika ada)
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => line.replace(/^[-•] /, '')) // Hapus bullet point dari setiap baris
    .join('\n');

  // Format sebagai daftar poin
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

// Fungsi untuk mengambil semua release dari GitHub
async function fetchGitHubReleases() {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec');
    
    if (!response.ok) {
      throw new Error(`Error fetching releases: ${response.statusText}`);
    }
    
    const releasesData = await response.json();
    
    // Filter hanya release resmi (bukan draft)
    const validReleases = releasesData
      .filter(rel => !rel.draft && !rel.prerelease)
      .map(rel => {
        // Cari asset .exe
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
    
    // Render semua release
    releaseList.innerHTML = '';
    validReleases.forEach(rel => {
      releaseList.appendChild(renderReleaseCard(rel));
    });
  } catch (error) {
    console.error("Error:", error);
    releaseList.innerHTML = `<p>Error loading releases: ${error.message}</p>`;
  }
}

// Event listener untuk pencarian
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




