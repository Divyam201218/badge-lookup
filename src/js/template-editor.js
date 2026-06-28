let placeholders = [];
let renderer;
let activePlaceholderIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
  renderer = new BadgeRenderer(document.getElementById('badgeCanvas'));
  setupCanvasDrag();
});

function previewTemplate() {
  const url = document.getElementById('tplImage').value;
  if (url) renderer.render(url, placeholders);
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
      <input value="${ph.key}" onchange="updatePh(${index}, 'key', this.value)" placeholder="Key (e.g., recipientName)">
      <input type="color" value="${ph.color}" onchange="updatePh(${index}, 'color', this.value)">
      <button class="secondary" onclick="setActive(${index})">Edit Pos</button>
    `;
    list.appendChild(div);
  });
}

function updatePh(index, field, value) {
  placeholders[index][field] = value;
  previewTemplate();
}

function setActive(index) {
  activePlaceholderIndex = index;
  alert(`Active: ${placeholders[index].key}. Click and drag on canvas to move.`);
}

function setupCanvasDrag() {
  const canvas = document.getElementById('badgeCanvas');
  let isDragging = false;

  canvas.addEventListener('mousedown', () => isDragging = true);
  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mousemove', (e) => {
    if (isDragging && activePlaceholderIndex > -1) {
      const rect = canvas.getBoundingClientRect();
      placeholders[activePlaceholderIndex].x = e.clientX - rect.left;
      placeholders[activePlaceholderIndex].y = e.clientY - rect.top;
      previewTemplate();
    }
  });
}

async function saveTemplate() {
  const name = document.getElementById('tplName').value;
  const image = document.getElementById('tplImage').value;

  const payload = {
    name, image, width: 500, height: 500, version: 1, placeholders
  };

  await fetch("/.netlify/functions/save-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  alert("Template Saved!");
}
