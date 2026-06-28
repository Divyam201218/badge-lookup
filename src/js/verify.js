let credentialData = null;
let renderer;

document.addEventListener('DOMContentLoaded', async () => {
  renderer = new BadgeRenderer(document.getElementById('verifyCanvas'));
  
  const urlParams = new URLSearchParams(window.location.search);
  const credID = urlParams.get('id'); // e.g. /verify.html?id=BG-2026-...
  
  if(credID) loadCredential(credID);
});

async function loadCredential(credID) {
  const res = await fetch(`/.netlify/functions/verify-badge?id=${credID}`);
  if (!res.ok) return alert("Invalid Credential ID");
  
  credentialData = await res.json();
  
  document.getElementById('vName').innerText = credentialData.recipientName;
  document.getElementById('vDetails').innerText = `${credentialData.badgeName} • Issued: ${credentialData.issueDate} • ID: ${credentialData.credentialID}`;
  
  // Render using stored snapshot to prevent historical changes affecting old badges
  renderer.render(
    credentialData.templateSnapshot.image, 
    credentialData.templateSnapshot.placeholders, 
    credentialData.placeholderValues
  );
}

function downloadPNG() {
  renderer.downloadPNG(`${credentialData.credentialID}.png`);
}

function downloadPDF() {
  // Populate PDF specific metadata
  document.getElementById('pdfBadgeName').innerText = credentialData.badgeName;
  document.getElementById('pdfRecipient').innerText = credentialData.recipientName;
  document.getElementById('pdfCredID').innerText = credentialData.credentialID;
  document.getElementById('pdfUrl').innerText = window.location.href;
  
  const element = document.getElementById('pdf-wrapper');
  document.getElementById('pdf-only-meta').classList.remove('hidden'); // Show meta for PDF
  
  html2pdf().from(element).save(`${credentialData.credentialID}.pdf`).then(() => {
    document.getElementById('pdf-only-meta').classList.add('hidden'); // Hide meta again for UI
  });
}

function addToLinkedIn() {
  const baseUrl = "https://www.linkedin.com/profile/add";
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: credentialData.badgeName,
    organizationId: credentialData.issuingOrganizationID,
    issueYear: credentialData.issueYear,
    issueMonth: credentialData.issueMonth,
    certUrl: window.location.href,
    certId: credentialData.credentialID
  });
  window.open(`${baseUrl}?${params.toString()}`, '_blank');
}
