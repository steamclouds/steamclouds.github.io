// DOM references
const releaseList = document.getElementById("release-list");
const searchInput = document.getElementById("search");

// Helper to escape text for HTML (basic)
function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'<', '>':'>', '"':'&quot;', "'":"&#39;"
  })[c]);
}

// Helper to safe-href (fallback to '#' if empty)
function safeHref(s){
  try {
    if(!s) return '#';
    // if it's already a hash or starts with http(s) keep it, else encode
    if (s.startsWith('#') || s.startsWith('http://') || s.startsWith('https://')) return s;
    return encodeURI(s);
  } catch(e){ return '#'; }
}

// Store the latest release data
let latestRelease = null;

// Fetch and render latest release from GitHub API
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch('https://api.github.com/repos/R3verseNinja/steamclouds/releases/latest', {
      headers: { 'User-Agent': 'SteamCloudsApp' }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const releaseData = await response.json();
    
    // Find the .exe asset
    const exeAsset = releaseData.assets.find(asset => 
      asset.name.toLowerCase().endsWith('.exe')
    );
    
    if (!exeAsset) {
      releaseList.innerHTML = "<p>No executable found in the latest release.</p>";
      return;
    }
    
    // Create a release object from the API data
    latestRelease = {
      version: releaseData.tag_name,
      date: new Date(releaseData.published_at).toISOString().split('T')[0],
      notes: releaseData.body || 'No release notes available',
      url: exeAsset.browser_download_url
    };
    
    // Render the single latest release
    renderRelease(latestRelease);
    
  } catch (error) {
    console.error("Error fetching release:", error);
    releaseList.innerHTML = `<p>Error loading latest release: ${error.message}</p>`;
  }
});

// Render release function
function renderRelease(release) {
  const card = document.createElement("div");
  card.className = "release-card";
  
  // build inner HTML using escaped content
  card.innerHTML = `
    <div class="card-main">
      <h2>Version ${escapeHtml(release.version)}</h2>
      <p>${escapeHtml(release.notes)}</p>
      <div class="meta">Released: ${escapeHtml(release.date)}</div>
    </div>
    <div class="card-actions">
      <a class="btn small" href="${safeHref(release.url)}" target="_blank" rel="noopener">Download</a>
    </div>
  `;
  
  releaseList.innerHTML = ''; // Clear any previous content
  releaseList.appendChild(card);
}

// Search functionality for single release
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
      // If search is cleared, show the full release
      if (latestRelease) {
        renderRelease(latestRelease);
      }
      return;
    }
    
    // Check if notes contain search term
    if (latestRelease && latestRelease.notes.toLowerCase().includes(searchTerm)) {
      renderRelease(latestRelease);
    } else {
      releaseList.innerHTML = "<p>No releases found.</p>";
    }
  });
}
