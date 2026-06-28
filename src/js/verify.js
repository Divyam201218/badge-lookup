// 1. These MUST be at the very top of the file (Global Scope)
let credentialData = null;
let renderer;

document.addEventListener('DOMContentLoaded', async () => {
  renderer = new BadgeRenderer(document.getElementById('verifyCanvas'));
  
  const urlParams = new URLSearchParams(window.location.search);
  const credID = urlParams.get('id');
  
  if(credID) loadCredential(credID);
});

async function loadCredential(credID) {
  try {
    const res = await fetch(`/.netlify/functions/verify-badge?id=${credID}`);
    if (!res.ok) return alert("Invalid Credential ID");
    
    credentialData = await res.json();
    
    document.getElementById('vName').innerText = credentialData.recipientName;
    document.getElementById('vDetails').innerText = `${credentialData.badgeName} • Issued: ${credentialData.issueDate} • ID: ${credentialData.credentialID}`;
    
    // Pass the stored QR config and the actual current URL to the renderer
    renderer.render(
      credentialData.templateSnapshot.image, 
      credentialData.templateSnapshot.placeholders, 
      credentialData.placeholderValues,
      credentialData.templateSnapshot.qrConfig, 
      window.location.href 
    );
  } catch (err) {
    console.error("Error loading credential:", err);
    alert("Failed to load badge data.");
  }
}

function downloadPNG() {
  // Safety check: Prevent downloading before data loads
  if (!credentialData) return alert("Please wait for the badge to finish loading.");
  
  renderer.downloadPNG(`${credentialData.credentialID}.png`);
}

function downloadPDF() {
  // Safety check: Prevent downloading before data loads
  if (!credentialData) return alert("Please wait for the badge to finish loading.");

  document.getElementById('pdfBadgeName').innerText = credentialData.badgeName;
  document.getElementById('pdfRecipient').innerText = credentialData.recipientName;
  document.getElementById('pdfCredID').innerText = credentialData.credentialID;
  
  const urlEl = document.getElementById('pdfUrl');
  urlEl.innerText = window.location.href;
  urlEl.href = window.location.href;
  
  const element = document.getElementById('pdf-wrapper');
  
  document.getElementById('pdf-only-meta').classList.remove('hidden'); 
  
  const opt = {
    margin:       0.5,
    filename:     `${credentialData.credentialID}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    document.getElementById('pdf-only-meta').classList.add('hidden'); 
  });
}

function addToLinkedIn() {
  // Safety check: Prevent clicking before data loads
  if (!credentialData) return alert("Please wait for the badge to finish loading.");

  const baseUrl = "https://www.linkedin.com/profile/add";
  
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: credentialData.badgeName,
    organizationId: credentialData.issuingOrganizationID, 
    issueMonth: credentialData.issueMonth,
    issueYear: credentialData.issueYear,
    certId: credentialData.credentialID,
    certUrl: window.location.href 
  });

  window.open(`${baseUrl}?${params.toString()}`, '_blank');
}
