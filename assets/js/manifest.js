// manifest.js (improved)
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particles.js (sama seperti versi Anda)
    if (window.particlesJS) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#00ffe1" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": {
                    "enable": true,
                    "distance": 120,
                    "color": "#00ffe1",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": { "enable": true, "mode": "grab" },
                    "onclick": { "enable": true, "mode": "push" },
                    "resize": true
                },
                "modes": {
                    "grab": { "distance": 140, "line_linked": { "opacity": 0.7 } },
                    "push": { "particles_nb": 4 }
                }
            },
            "retina_detect": true
        });
    }

    // Custom cursor logic (sama)
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        let mouseX = 0, mouseY = 0;
        let posX = 0, posY = 0;
        const speed = 0.15;

        document.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animate() {
            posX += (mouseX - posX) * speed;
            posY += (mouseY - posY) * speed;
            cursor.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animate);
        }
        animate();

        document.addEventListener('mousedown', () => {
            cursor.style.width = '36px';
            cursor.style.height = '36px';
            cursor.style.background = 'rgba(0, 255, 225, 1)';
            setTimeout(() => {
                cursor.style.width = '24px';
                cursor.style.height = '24px';
                cursor.style.background = 'rgba(0, 255, 225, 0.7)';
            }, 150);
        });
    }
});

// --- Utility & config ---
const GAS_PROXY_URL = 'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';
const FETCH_TIMEOUT = 30000; // ms
const repos = [
    { name: "Server 1", repo: "SteamAutoCracks/ManifestHub" },
    { name: "Server 2", repo: "ikun0014/ManifestHub" },
    { name: "Server 3", repo: "Auiowu/ManifestAutoUpdate" },
    { name: "Server 4", repo: "tymolu233/ManifestAutoUpdate-fix" }
];

function setControlsEnabled(enabled) {
    const input = document.getElementById('appidInput');
    const btn = document.querySelector('button[onclick="generateManifest()"]');
    const discordBtn = document.querySelector('.discord-btn');
    if (input) input.disabled = !enabled;
    if (btn) btn.disabled = !enabled;
    if (discordBtn) discordBtn.style.pointerEvents = enabled ? 'auto' : 'none';
}

function timeoutFetch(resource, options = {}, timeout = FETCH_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const merged = Object.assign({}, options, { signal: controller.signal });
    return fetch(resource, merged).finally(() => clearTimeout(id));
}

async function safeFetchJson(url, opts = {}) {
    try {
        const resp = await timeoutFetch(url, opts, FETCH_TIMEOUT);
        if (!resp.ok) {
            const text = await resp.text().catch(()=>'');
            return { ok: false, status: resp.status, statusText: resp.statusText, text };
        }
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const j = await resp.json();
            return { ok: true, json: j };
        } else {
            const t = await resp.text();
            return { ok: true, text: t };
        }
    } catch (err) {
        return { ok: false, error: err.message || String(err) };
    }
}

// simple caching helper (session)
function cacheGet(key) {
    try { return JSON.parse(sessionStorage.getItem(key)); } catch (e) { return null; }
}
function cacheSet(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// Replace your generateManifest() with this improved function
async function generateManifest() {
    const inputElement = document.getElementById('appidInput');
    const resultDiv = document.getElementById('result');
    if (!inputElement) { resultDiv.innerHTML = `<p style="color:red;">❌ Error: Input field not found.</p>`; return; }

    const raw = inputElement.value.trim();
    if (!raw) { resultDiv.innerHTML = `<p style="color:red;">❌ Please enter an AppID or URL.</p>`; return; }

    // extract numeric AppID
    const storeMatch = raw.match(/\/app\/(\d+)/i);
    const appid = storeMatch ? storeMatch[1] : (raw.match(/^\d+$/) || [])[0];
    if (!appid) { resultDiv.innerHTML = `<p style="color:red;">❌ Could not extract AppID.</p>`; return; }

    const repos = [
        { name: "Server 1", repo: "SteamAutoCracks/ManifestHub" },
        { name: "Server 2", repo: "ikun0014/ManifestHub" },
        { name: "Server 3", repo: "Auiowu/ManifestAutoUpdate" },
        { name: "Server 4", repo: "tymolu233/ManifestAutoUpdate-fix" }
    ];

    const GAS_PROXY_URL = 'https://script.google.com/macros/s/AKfycbwMrZyPoDtn768Emld6tfsoldJQjd8aj40vMi7l7dcFb01Y41mk1zlUR_jpw8cnbCiS/exec';
    const timeout = ms => new Promise((_, r) => setTimeout(r, ms));
    const doFetchWithTimeout = (url, opts = {}) => {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), 30000);
        return fetch(url, {...opts, signal: ctrl.signal}).finally(() => clearTimeout(id));
    };

    resultDiv.innerHTML = `⏳ Looking up AppID ${appid} (GitHub direct first)...`;

    let foundFiles = null;
    let foundRepoName = null;
    let errors = [];

    // 1) Try direct GitHub (best-case: public repos, no GAS needed)
    for (const r of repos) {
        resultDiv.innerHTML = `🔍 Checking ${r.name} via GitHub API...`;
        try {
            const treeUrl = `https://api.github.com/repos/${r.repo}/git/trees/${encodeURIComponent(appid)}?recursive=1`;
            const resp = await doFetchWithTimeout(treeUrl, { headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'SteamClouds/1.0' } });
            if (!resp.ok) {
                errors.push(`[${r.name}] GitHub API returned ${resp.status} ${resp.statusText}`);
                continue;
            }
            const tree = await resp.json();
            if (!tree.tree || !Array.isArray(tree.tree)) {
                errors.push(`[${r.name}] Unexpected tree response`);
                continue;
            }
            const blobs = tree.tree.filter(t => t.type === 'blob');
            if (blobs.length === 0) { errors.push(`[${r.name}] No files in branch ${appid}`); continue; }

            // verify key.vdf if present
            const keyFile = blobs.find(b => /key\.vdf|config\.vdf/i.test(b.path));
            if (keyFile) {
                const rawKeyUrl = `https://raw.githubusercontent.com/${r.repo}/${appid}/${keyFile.path}`;
                const keyResp = await doFetchWithTimeout(rawKeyUrl);
                if (!keyResp.ok) { errors.push(`[${r.name}] raw key fetch ${keyResp.status}`); continue; }
                const keyText = await keyResp.text();
                if (!new RegExp(`"${appid}"\\s*\\{`).test(keyText)) { errors.push(`[${r.name}] AppID verification failed in key.vdf`); continue; }
            }

            // success
            foundFiles = blobs.filter(f => !f.path.toLowerCase().endsWith('.json') && !/key\.vdf|config\.vdf/i.test(f.path));
            foundRepoName = r.name;
            break;
        } catch (err) {
            errors.push(`[${r.name}] GitHub direct error: ${err && err.message ? err.message : String(err)}`);
        }
    }

    // 2) If not found by GitHub direct, fallback to GAS proxy (useful if repos are private or GitHub blocked)
    if (!foundFiles) {
        resultDiv.innerHTML = `⏳ GitHub direct failed — falling back to GAS proxy (this may hit CORS if GAS not deployed correctly)...`;
        for (const r of repos) {
            resultDiv.innerHTML = `🔍 Checking ${r.name} via GAS proxy...`;
            try {
                const treeResp = await doFetchWithTimeout(GAS_PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'tree', repo: r.repo, branch: appid, recursive: 1 })
                });
                if (!treeResp.ok) {
                    errors.push(`[${r.name}] GAS proxy returned ${treeResp.status}`);
                    continue;
                }
                const treeData = await treeResp.json();
                if (treeData.error) { errors.push(`[${r.name}] GAS/GitHub error: ${treeData.error}`); continue; }
                if (!treeData.tree || !Array.isArray(treeData.tree)) { errors.push(`[${r.name}] Invalid tree from GAS`); continue; }
                const blobs = treeData.tree.filter(t => t.type === 'blob');
                if (blobs.length === 0) { errors.push(`[${r.name}] No files in branch`); continue; }

                // try to fetch & verify key.vdf via GAS
                const keyFile = blobs.find(b => /key\.vdf|config\.vdf/i.test(b.path));
                if (keyFile) {
                    const keyResp = await doFetchWithTimeout(GAS_PROXY_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'file', repo: r.repo, branch: appid, path: keyFile.path })
                    });
                    if (!keyResp.ok) { errors.push(`[${r.name}] Failed to download key via GAS: ${keyResp.status}`); continue; }
                    const keyText = await keyResp.text();
                    if (!new RegExp(`"${appid}"\\s*\\{`).test(keyText)) { errors.push(`[${r.name}] AppID verification failed in key from GAS`); continue; }
                }

                foundFiles = blobs.filter(f => !f.path.toLowerCase().endsWith('.json') && !/key\.vdf|config\.vdf/i.test(f.path));
                foundRepoName = r.name;
                break;
            } catch (err) {
                // often this is fetch aborted due to CORS in browser -> err.name === 'AbortError' or TypeError
                errors.push(`[${r.name}] GAS proxy error: ${err && err.message ? err.message : String(err)}`);
            }
        }
    }

    // If still nothing — give full error details
    if (!foundFiles || foundFiles.length === 0) {
        const details = errors.length ? `<br><small>Details:<br>${errors.join('<br>')}</small>` : '';
        resultDiv.innerHTML = `<p style="color:red;">❌ Manifest not found for AppID ${appid} in any repository.${details}</p>`;
        return;
    }

    // Build ZIP (download files, using GitHub direct first, then GAS if needed)
    resultDiv.innerHTML = `✅ Found in ${foundRepoName}. Downloading files...`;
    const zip = new JSZip();
    let totalSize = 0;
    const start = performance.now();

    for (const file of foundFiles) {
        resultDiv.innerHTML = `🔄 Downloading ${file.path}...`;
        let gotBlob = null;

        // try raw.githubusercontent first
        try {
            const repoObj = repos.find(x => x.name === foundRepoName);
            const rawUrl = `https://raw.githubusercontent.com/${repoObj.repo}/${appid}/${encodeURIComponent(file.path)}`;
            const r = await doFetchWithTimeout(rawUrl);
            if (r && r.ok) {
                gotBlob = await r.blob();
            }
        } catch (e) { /* ignore and fallback to GAS */ }

        // fallback to GAS proxy
        if (!gotBlob) {
            try {
                const fresp = await doFetchWithTimeout(GAS_PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'file', repo: repos.find(rr=>rr.name===foundRepoName).repo, branch: appid, path: file.path })
                });
                if (fresp && fresp.ok) gotBlob = await fresp.blob();
                else errors.push(`[download] could not fetch ${file.path} via GAS, status ${fresp ? fresp.status : 'no response'}`);
            } catch (e) {
                errors.push(`[download] error fetching ${file.path}: ${e && e.message ? e.message : String(e)}`);
            }
        }

        if (!gotBlob) {
            resultDiv.innerHTML += `<br><small style="color:orange;">Warning: failed to download ${file.path} — skipped.</small>`;
            continue;
        }

        const arr = await gotBlob.arrayBuffer();
        zip.file(file.path, arr);
        totalSize += gotBlob.size || arr.byteLength || 0;
    }

    // Add README and generate
    zip.file("README.txt", "Credits & Support\n");
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const elapsed = ((performance.now() - start)/1000).toFixed(2);

    resultDiv.innerHTML = `
      <h2>✅ Manifest Ready</h2>
      <p><strong>AppID:</strong> ${appid}</p>
      <p><strong>Server:</strong> ${foundRepoName}</p>
      <p><strong>Files:</strong> ${foundFiles.length}</p>
      <p><strong>Size:</strong> ${(totalSize/1024/1024).toFixed(2)} MB</p>
      <p><strong>Time:</strong> ${elapsed} sec</p>
      <a href="${url}" download="${appid}.zip" class="download-link">📥 Download ZIP</a>
    `;
    } catch (err) {
        console.error("Error:", err);
        resultDiv.innerHTML = `<p style="color:red;">❌ An error occurred: ${err && err.message ? err.message : String(err)}</p>`;
    } finally {
        setControlsEnabled(true);
    }
}

