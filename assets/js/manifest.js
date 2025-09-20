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

// --- Main manifest generation ---
async function generateManifest() {
    const inputElement = document.getElementById('appidInput');
    const resultDiv = document.getElementById('result');
    setControlsEnabled(false);
    try {
        if (!inputElement) {
            resultDiv.innerHTML = `<p style="color:red;">❌ Error: Input field not found.</p>`;
            return;
        }

        const rawInput = inputElement.value.trim();
        if (!rawInput) {
            resultDiv.innerHTML = `<p style="color:red;">❌ Please enter an AppID or URL.</p>`;
            return;
        }

        // Extract numeric AppID from common Steam store URL or numeric input
        let appid = null;
        const storeMatch = rawInput.match(/\/app\/(\d+)/i);
        if (storeMatch && storeMatch[1]) {
            appid = storeMatch[1];
        } else {
            const digits = rawInput.match(/^(\d+)$/);
            if (digits) appid = digits[1];
        }
        if (!appid) {
            resultDiv.innerHTML = `<p style="color:red;">❌ Could not extract AppID. Enter a numeric AppID or full Steam store URL.</p>`;
            return;
        }

        resultDiv.innerHTML = `⏳ Fetching files from repositories...`;
        let foundFiles = [];
        let foundInRepo = "";
        let totalSize = 0;
        let fetchErrors = [];

        for (const { name, repo } of repos) {
            resultDiv.innerHTML = `🔍 Searching in ${name}...`;

            // try cache first (cache per repo+appid)
            const cacheKey = `tree:${repo}:${appid}`;
            const cached = cacheGet(cacheKey);
            let treeData;
            if (cached) {
                treeData = cached;
            } else {
                const treeResp = await safeFetchJson(GAS_PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'tree', repo: repo, branch: appid, recursive: 1 })
                });
                if (!treeResp.ok) {
                    const msg = treeResp.error ? treeResp.error : `Status ${treeResp.status} ${treeResp.statusText || ''} ${treeResp.text ? '- '+treeResp.text : ''}`;
                    console.warn(`Could not fetch branch in ${name}:`, msg);
                    fetchErrors.push(`[${name}] ${msg}`);
                    continue;
                }
                // assume treeResp.json in .json
                treeData = treeResp.json || (treeResp.text ? JSON.parse(treeResp.text || '{}') : null);
                if (!treeData) {
                    fetchErrors.push(`[${name}] Invalid response for tree`);
                    continue;
                }
                cacheSet(cacheKey, treeData);
            }

            if (treeData.error) {
                fetchErrors.push(`[${name}] GitHub error: ${treeData.error}`);
                continue;
            }
            if (!treeData.tree || !Array.isArray(treeData.tree)) {
                fetchErrors.push(`[${name}] Invalid structure from ${name}`);
                continue;
            }

            const files = treeData.tree.filter(f => f.type === 'blob');
            if (files.length === 0) {
                fetchErrors.push(`[${name}] No files in branch '${appid}'`);
                continue;
            }

            // cari key.vdf/config.vdf
            const keyVdfFile = files.find(f => /key\.vdf|config\.vdf/i.test(f.path));
            if (!keyVdfFile) {
                // tidak ada key => masih gunakan tetapi saring json/key
                foundFiles = files.filter(file =>
                    !file.path.toLowerCase().endsWith('.json') &&
                    !/key\.vdf|config\.vdf/i.test(file.path)
                );
                foundInRepo = name;
                break;
            }

            // download key via GAS proxy to verify
            const keyResp = await safeFetchJson(GAS_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'file', repo: repo, branch: appid, path: keyVdfFile.path })
            });

            if (!keyResp.ok) {
                const msg = keyResp.error ? keyResp.error : `Status ${keyResp.status} ${keyResp.statusText || ''}`;
                console.warn(`Failed to download ${keyVdfFile.path} from ${name}:`, msg);
                fetchErrors.push(`[${name}] ${msg}`);
                continue;
            }

            // keyResp.text expected (GAS returns raw text)
            const keyText = keyResp.text || (typeof keyResp.json === 'string' ? keyResp.json : JSON.stringify(keyResp.json));
            const appIdRegex = new RegExp(`"${appid}"\\s*\\{`);
            if (!appIdRegex.test(keyText)) {
                console.warn(`AppID ${appid} not found in ${keyVdfFile.path} from ${name}.`);
                fetchErrors.push(`[${name}] AppID verification failed`);
                continue;
            }

            // verified
            foundFiles = files.filter(file =>
                !file.path.toLowerCase().endsWith('.json') &&
                !/key\.vdf|config\.vdf/i.test(file.path)
            );
            foundInRepo = name;
            resultDiv.innerHTML = `✅ Files found and verified in ${name}. Downloading...`;
            break;
        }

        if (!foundFiles || foundFiles.length === 0) {
            const details = fetchErrors.length ? `<br><small>Details:<br>${fetchErrors.join('<br>')}</small>` : '';
            resultDiv.innerHTML = `<p style="color:red;">❌ Manifest not found for AppID ${appid} in any repository.${details}</p>`;
            return;
        }

        // download files and zip
        const startTime = performance.now();
        const zip = new JSZip();
        for (const file of foundFiles) {
            resultDiv.innerHTML = `🔄 Downloading ${file.path}...`;
            const fileResp = await timeoutFetch(GAS_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'file',
                    repo: repos.find(r => r.name === foundInRepo).repo,
                    branch: appid,
                    path: file.path
                })
            }, FETCH_TIMEOUT);

            if (!fileResp || !fileResp.ok) {
                const status = fileResp ? fileResp.status : 'no-response';
                resultDiv.innerHTML += `<br><small style="color:orange;">Warning: Could not download ${file.path} (Status: ${status}). Skipping...</small>`;
                continue;
            }

            const blob = await fileResp.blob();
            const arrayBuffer = await blob.arrayBuffer();
            zip.file(file.path, arrayBuffer);
            totalSize += blob.size || arrayBuffer.byteLength || 0;
        }

        // README
        const readmeContent = `
# Credits & Support

**Website:** https://steamclouds.online/      
**Discord:** https://discord.gg/Qsp6Sbq6wy      

SMART HUBS
`;
        zip.file("README.txt", readmeContent);

        const finalZipBlob = await zip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(finalZipBlob);
        const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2);

        resultDiv.innerHTML = `
            <h2>✅ Manifest Ready</h2>
            <p><strong>AppID:</strong> ${appid}</p>
            <p><strong>Server:</strong> ${foundInRepo}</p>
            <p><strong>Files Downloaded:</strong> ${foundFiles.length}</p>
            <p><strong>Total Size:</strong> ${(totalSize / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Time Taken:</strong> ${elapsedTime} sec</p>
            <a href="${downloadUrl}" download="${appid}.zip" class="download-link">📥 Download ZIP</a>
        `;
    } catch (err) {
        console.error("Error:", err);
        resultDiv.innerHTML = `<p style="color:red;">❌ An error occurred: ${err && err.message ? err.message : String(err)}</p>`;
    } finally {
        setControlsEnabled(true);
    }
}
