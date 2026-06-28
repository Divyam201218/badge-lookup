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
