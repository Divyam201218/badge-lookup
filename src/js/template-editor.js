// --- Add this Auth Logic to the top of your file ---

document.addEventListener('DOMContentLoaded', () => {
  // Check if the user already logged in during this browser session
  if (sessionStorage.getItem('adminAuthed') === 'true') {
    showApp();
  }

  // Your existing setup
  renderer = new BadgeRenderer(document.getElementById('badgeCanvas'));
  setupCanvasDrag();
});

async function handleLogin() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('loginError');
  const btn = document.querySelector('#loginContainer button');

  if (!user || !pass) return;

  errorMsg.style.display = 'none';
  btn.innerText = 'Authenticating...';
  btn.disabled = true;

  try {
    const res = await fetch("/.netlify/functions/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass })
    });

    if (res.ok) {
      // Save a temporary session flag so they don't have to log in on every refresh
      sessionStorage.setItem('adminAuthed', 'true');
      showApp();
    } else {
      // 403 Forbidden - Invalid credentials
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    console.error("Login failed:", err);
    errorMsg.innerText = "Connection error. Try again.";
    errorMsg.style.display = 'block';
  } finally {
    btn.innerText = 'Login';
    btn.disabled = false;
  }
}

function showApp() {
  document.getElementById('loginContainer').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
}

// --- Keep your existing placeholders, QR, and drag logic below this line ---

let placeholders = [];
let qrConfig = { x: 400, y: 400, size: 0 };
let renderer;
let activeElement = null; // Can be an index (number) or 'qr' (string)

document.addEventListener('DOMContentLoaded', () => {
  renderer = new BadgeRenderer(document.getElementById('badgeCanvas'));
  setupCanvasDrag();
});

function previewTemplate() {
  const url = document.getElementById('tplImage').value;
  if (url) renderer.render(url, placeholders, {}, qrConfig, "https://example.com/verify-preview");
}

function updateQR() {
  qrConfig.size = parseInt(document.getElementById('qrSize').value) || 0;
  previewTemplate();
}

function addPlaceholder() {
  placeholders.push({
    key: `field_${placeholders.length + 1}`,
    label: 'New Field',
    x: 250, y: 250,
    font: 'Arial', size: 24, color: '#000000', alignment: 'center', weight: 'bold'
  });
  renderPlaceholderUI();
  previewTemplate();
}

function renderPlaceholderUI() {
  const list = document.getElementById('placeholdersList');
  list.innerHTML = '';
  
  placeholders.forEach((ph, index) => {
    const div = document.createElement('div');
    div.className = 'placeholder-row';
    div.innerHTML = `
      <input value="${ph.key}" onchange="updatePh(${index}, 'key', this.value)" placeholder="Key">
      <input type="number" value="${ph.size}" onchange="updatePh(${index}, 'size', this.value)" title="Font Size">
      <input type="color" value="${ph.color}" onchange="updatePh(${index}, 'color', this.value)">
      <button class="secondary" onclick="setActiveElement(${index})">Move</button>
    `;
    list.appendChild(div);
  });
}

function updatePh(index, field, value) {
  placeholders[index][field] = field === 'size' ? parseInt(value) : value;
  previewTemplate();
}

function setActiveElement(element) {
  activeElement = element;
  const name = element === 'qr' ? 'QR Code' : placeholders[element].key;
  alert(`Active: ${name}. Click and drag on canvas to move.`);
}

function setupCanvasDrag() {
  const canvas = document.getElementById('badgeCanvas');
  let isDragging = false;

  canvas.addEventListener('mousedown', () => isDragging = true);
  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mousemove', (e) => {
    if (isDragging && activeElement !== null) {
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      if (activeElement === 'qr') {
        qrConfig.x = newX;
        qrConfig.y = newY;
      } else {
        placeholders[activeElement].x = newX;
        placeholders[activeElement].y = newY;
      }
      previewTemplate();
    }
  });
}

async function saveTemplate() {
  const name = document.getElementById('tplName').value;
  const image = document.getElementById('tplImage').value;

  const payload = {
    name, image, width: 500, height: 500, version: 1, placeholders, qrConfig
  };

  await fetch("/.netlify/functions/save-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  alert("Template Saved!");
}
