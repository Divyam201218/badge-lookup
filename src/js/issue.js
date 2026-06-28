let templates = [];
let currentTemplate = null;
let renderer;

document.addEventListener('DOMContentLoaded', async () => {
  renderer = new BadgeRenderer(document.getElementById('issueCanvas'));
  await fetchTemplates();
});

async function fetchTemplates() {
  const res = await fetch("/.netlify/functions/get-templates");
  templates = await res.json();
  
  const select = document.getElementById('templateSelect');
  select.innerHTML = '<option value="">Select a template...</option>';
  templates.forEach(t => {
    select.innerHTML += `<option value="${t.id}">${t.name}</option>`;
  });
}

function loadSelectedTemplate() {
  const tId = document.getElementById('templateSelect').value;
  currentTemplate = templates.find(t => t.id === tId);
  updatePreview();
}

function updatePreview() {
  if (!currentTemplate) return;
  
  const values = {
    recipientName: document.getElementById('recipientName').value,
    badgeName: document.getElementById('badgeName').value,
    skill: document.getElementById('skill').value,
  };
  
  renderer.render(currentTemplate.image, currentTemplate.placeholders, values);
}

async function issueBadge() {
  if (!currentTemplate) return alert("Select a template first.");

  const email = document.getElementById('recipientEmail').value;
  const name = document.getElementById('recipientName').value;
  const badgeName = document.getElementById('badgeName').value;

  // Generate dynamic values mapping based on inputs
  const placeholderValues = {
    recipientName: name,
    badgeName: badgeName,
    skill: document.getElementById('skill').value
  };

  const payload = {
    email,
    recipientName: name,
    badgeName,
    skill: document.getElementById('skill').value,
    issueMonth: document.getElementById('issueMonth').value,
    issueYear: document.getElementById('issueYear').value,
    templateID: currentTemplate.id,
    templateSnapshot: currentTemplate, // Stored to freeze the design
    placeholderValues
  };

  const res = await fetch("/.netlify/functions/issue-badge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if(res.ok) {
    const data = await res.json();
    alert(`Badge Issued! Credential ID: ${data.credentialID}`);
  } else {
    alert("Error issuing badge");
  }
}
