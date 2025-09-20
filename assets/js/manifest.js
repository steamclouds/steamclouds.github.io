document.addEventListener('DOMContentLoaded', () => {
    // Initialize particles.js
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

    // Custom cursor logic
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

const REPOS = [
  { name: "Server 1", repo: "SteamAutoCracks/ManifestHub" },
  { name: "Server 2", repo: "ikun0014/ManifestHub" },
  { name: "Server 3", repo: "Auiowu/ManifestAutoUpdate" },
  { name: "Server 4", repo: "tymolu233/ManifestAutoUpdate-fix" }
];
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwbpNydmN18Iw5K5rRgiM8t2InELIs1qla4vAovESftAgO6DnBFY4D_KWeH662eadzfPw/exec'; // <-- ganti dengan deploy URL GAS-mu
const CACHE_TTL_SEC = 600; // 10 menit

// --- Helpers: cache ---
function cacheKey(repo, appid) { return `tree|${repo}|${appid}`; }
function cacheSet(key, val, ttlSec = CACHE_TTL_SEC) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ v: val, exp: Date.now() + ttlSec*1000 }));
  } catch(e){}
}
function cacheGet(key) {
  try {
    const raw = JSON.parse(sessionStorage.getItem(key));
    if (!raw) return null;
    if (Date.now() > raw.exp) { sessionStorage.removeItem(key); return null; }
    return raw.v;
  } catch(e) { return null; }
}

// timeout fetch helper
function fetchWithTimeout(url, opts={}, timeout=30000) {
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  return fetch(url, {...opts, signal: controller.signal}).finally(()=>clearTimeout(id));
}

// JSONP helper (for GAS)
function jsonpRequest(url, params = {}, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    params.callback = cb;
    const qs = Object.entries(params).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const src = url + (url.includes('?') ? '&' : '?') + qs;
    const s = document.createElement('script');
    let timer = setTimeout(()=> {
      delete window[cb];
      s.remove();
      reject(new Error('JSONP timeout'));
    }, timeout);
    window[cb] = (data) => {
      clearTimeout(timer);
      delete window[cb];
      s.remove();
      resolve(data);
    };
    s.onerror = (e) => {
      clearTimeout(timer);
      delete window[cb];
      s.remove();
      reject(new Error('JSONP load error'));
    };
    s.src = src;
    document.body.appendChild(s);
  });
}

// decode base64 to Uint8Array
function base64ToUint8Array(b64) {
  const binary = atob(b64.replace(/\n/g,''));
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i=0;i<len;i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// --- Main generateManifest ---
async function generateManifest() {
  const input = document.getElementById('appidInput');
  const resultDiv = document.getElementById('result');
  if (!input || !resultDiv) return;
  const raw = input.value.trim();
  if (!raw) { resultDiv.innerHTML = `<p style="color:red;">❌ Please enter AppID or URL.</p>`; return; }

  // extract appid
  const storeMatch = raw.match(/\/app\/(\d+)/i);
  const appid = storeMatch ? storeMatch[1] : (raw.match(/^\d+$/) || [])[0];
  if (!appid) { resultDiv.innerHTML = `<p style="color:red;">❌ Could not extract AppID.</p>`; return; }

  resultDiv.innerHTML = `⏳ Looking up ${appid} (GitHub direct first)...`;

  let foundFiles = null;
  let foundRepo = null;
  let errors = [];

  // try GitHub direct
  for (const r of REPOS) {
    resultDiv.innerHTML = `🔍 Checking ${r.name} via GitHub API...`;
    const ck = cacheKey(r.repo, appid);
    const cached = cacheGet(ck);
    let treeData = cached;

    try {
      if (!treeData) {
        const treeUrl = `https://api.github.com/repos/${r.repo}/git/trees/${encodeURIComponent(appid)}?recursive=1`;
        const resp = await fetchWithTimeout(treeUrl, { headers: { 'Accept': 'application/vnd.github.v3+json' } }, 20000)
          .catch(e => { throw e; });

        // check headers for rate-limit
        const remaining = resp.headers.get('x-ratelimit-remaining');
        const reset = resp.headers.get('x-ratelimit-reset');
        if (resp.status === 403 || (remaining !== null && Number(remaining) <= 0)) {
          errors.push(`[${r.name}] rate-limited (${remaining})`);
          // fallback to GAS below
          continue;
        }
        if (!resp.ok) {
          errors.push(`[${r.name}] github api ${resp.status}`);
          continue;
        }
        let json = await resp.json();

        // sometimes GitHub returns only sha + url => follow url
        if (!json.tree && json.url) {
          const resp2 = await fetchWithTimeout(json.url + '?recursive=1', { headers: { 'Accept': 'application/vnd.github.v3+json' } }, 20000).catch(e=>{ throw e; });
          if (!resp2.ok) { errors.push(`[${r.name}] second fetch ${resp2.status}`); continue; }
          json = await resp2.json();
        }

        if (!json.tree || !Array.isArray(json.tree)) { errors.push(`[${r.name}] no tree`); continue; }
        treeData = json;
        cacheSet(ck, treeData, 600); // cache 10 min
      }

      const blobs = treeData.tree.filter(f => f.type === 'blob');
      if (!blobs.length) { errors.push(`[${r.name}] empty`); continue; }

      // verify key.vdf if present
      const key = blobs.find(b=>/key\.vdf|config\.vdf/i.test(b.path));
      if (key) {
        const rawKeyUrl = `https://raw.githubusercontent.com/${r.repo}/${appid}/${key.path}`;
        const kresp = await fetchWithTimeout(rawKeyUrl, {}, 15000).catch(e=>{ throw e; });
        if (!kresp.ok) { errors.push(`[${r.name}] key fetch ${kresp.status}`); continue; }
        const ktext = await kresp.text();
        if (!new RegExp(`"${appid}"\\s*\\{`).test(ktext)) { errors.push(`[${r.name}] key verification failed`); continue; }
      }

      foundFiles = blobs.filter(f=>!f.path.toLowerCase().endsWith('.json') && !/key\.vdf|config\.vdf/i.test(f.path));
      foundRepo = r;
      break;

    } catch (err) {
      errors.push(`[${r.name}] ${err.message || String(err)}`);
      continue;
    }
  }

  // If not found via GitHub direct -> fallback to GAS JSONP
  if (!foundFiles || foundFiles.length === 0) {
    resultDiv.innerHTML = `⏳ Falling back to server (GAS) due to rate-limit / CORS / errors...`;
    for (const r of REPOS) {
      resultDiv.innerHTML = `🔍 Checking ${r.name} via GAS...`;
      try {
        const data = await jsonpRequest(GAS_URL, { type: 'tree', repo: r.repo, branch: appid }, 20000);
        if (!data || data.error) { errors.push(`[${r.name}] GAS error: ${data && data.error ? data.error : 'no data'}`); continue; }
        const blobs = data.tree ? data.tree.filter(f=>f.type==='blob') : [];
        if (!blobs.length) { errors.push(`[${r.name}] GAS no tree`); continue; }
        // verify
        const key = blobs.find(b=>/key\.vdf|config\.vdf/i.test(b.path));
        if (key) {
          // fetch file via GAS (JSONP) to verify appid inside file
          const keyObj = await jsonpRequest(GAS_URL, { type: 'file', repo: r.repo, branch: appid, path: key.path }, 20000);
          if (!keyObj || keyObj.error) { errors.push(`[${r.name}] GAS key fetch error`); continue; }
          const contentB64 = keyObj.content || keyObj.body || '';
          const decoded = atob(contentB64.replace(/\n/g,'')); // quick check
          if (!new RegExp(`"${appid}"\\s*\\{`).test(decoded)) { errors.push(`[${r.name}] appid not found in key`); continue; }
        }
        foundFiles = blobs.filter(f=>!f.path.toLowerCase().endsWith('.json') && !/key\.vdf|config\.vdf/i.test(f.path));
        foundRepo = r;
        break;
      } catch (err) {
        errors.push(`[${r.name}] GAS jsonp error: ${err.message || String(err)}`);
        continue;
      }
    }
  }

  if (!foundFiles || foundFiles.length === 0) {
    resultDiv.innerHTML = `<p style="color:red;">❌ Manifest not found for AppID ${appid}.<br><small>${errors.join('<br>')}</small></p>`;
    return;
  }

  // Download files (prefer raw.githubusercontent, fallback to GAS file (base64) if needed)
  resultDiv.innerHTML = `✅ Found in ${foundRepo.name}. Downloading files...`;
  const zip = new JSZip();
  let totalSize = 0;
  for (const f of foundFiles) {
    resultDiv.innerHTML = `🔄 Downloading ${f.path}...`;
    let blob = null;
    // try raw.githubusercontent
    try {
      const rawUrl = `https://raw.githubusercontent.com/${foundRepo.repo}/${appid}/${f.path}`;
      const r = await fetchWithTimeout(rawUrl, {}, 20000);
      if (r && r.ok) {
        blob = await r.blob();
      }
    } catch(e){}
    // fallback: get file via GAS (returns GitHub's content object with base64)
    if (!blob) {
      try {
        const fileObj = await jsonpRequest(GAS_URL, { type: 'file', repo: foundRepo.repo, branch: appid, path: f.path }, 20000);
        if (!fileObj || fileObj.error || !fileObj.content) {
          resultDiv.innerHTML += `<br><small style="color:orange;">Warning: couldn't get ${f.path} from GAS</small>`;
          continue;
        }
        const bytes = base64ToUint8Array(fileObj.content);
        const a = new Blob([bytes]);
        blob = a;
      } catch (e) {
        resultDiv.innerHTML += `<br><small style="color:orange;">Warning: failed ${f.path}</small>`;
        continue;
      }
    }
    const ab = await blob.arrayBuffer();
    zip.file(f.path, ab);
    totalSize += blob.size || ab.byteLength || 0;
  }

  zip.file("README.txt", "Credits & Support\n");
  const finalBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(finalBlob);
  const elapsed = ((performance.now())/1000).toFixed(2);
  resultDiv.innerHTML = `
    <h2>✅ Manifest Ready</h2>
    <p><strong>AppID:</strong> ${appid}</p>
    <p><strong>Server:</strong> ${foundRepo.name}</p>
    <p><strong>Files Downloaded:</strong> ${foundFiles.length}</p>
    <p><strong>Total Size:</strong> ${(totalSize/1024/1024).toFixed(2)} MB</p>
    <a href="${url}" download="${appid}.zip" class="download-link">📥 Download ZIP</a>
  `;
}

// make global for onclick in HTML if you use onclick attribute
window.generateManifest = generateManifest;


