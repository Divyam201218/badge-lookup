async function loadCredential(credID) {
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
    credentialData.templateSnapshot.qrConfig, // New!
    window.location.href // New!
  );
}

function downloadPDF() {
  document.getElementById('pdfBadgeName').innerText = credentialData.badgeName;
  document.getElementById('pdfRecipient').innerText = credentialData.recipientName;
  document.getElementById('pdfCredID').innerText = credentialData.credentialID;
  
  // Set href and text for the URL
  const urlEl = document.getElementById('pdfUrl');
  urlEl.innerText = window.location.href;
  urlEl.href = window.location.href;
  
  const element = document.getElementById('pdf-wrapper');
  
  // Temporarily reveal meta for PDF capture
  document.getElementById('pdf-only-meta').classList.remove('hidden'); 
  
  // Added options to ensure the PDF looks clean and scales well
  const opt = {
    margin:       0.5,
    filename:     `${credentialData.credentialID}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    document.getElementById('pdf-only-meta').classList.add('hidden'); // Hide meta again
  });
}
