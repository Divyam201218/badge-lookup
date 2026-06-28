const { initFirebase } = require("./_utils");

function generateCredentialID() {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BG-2026-${randomStr}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };
  
  const db = initFirebase();
  const data = JSON.parse(event.body);
  const credID = generateCredentialID();
  const today = new Date().toISOString().split('T')[0];
  
  const credentialPayload = {
    credentialID: credID,
    templateID: data.templateID,
    templateVersion: data.templateSnapshot.version,
    templateSnapshot: data.templateSnapshot,
    badgeName: data.badgeName,
    recipientName: data.recipientName,
    recipientEmail: data.email,
    issueMonth: data.issueMonth,
    issueYear: data.issueYear,
    issueDate: today,
    issuingOrganizationID: "108710000",
    skill: data.skill,
    placeholderValues: data.placeholderValues
  };

  try {
    // 1. Create native BadgeCredential document
    await db.collection("BadgeCredentials").doc(credID).set(credentialPayload);

    // 2. Update existing Badges lookup structure EXACTLY as specified
    // email -> Event Name -> [verificationURL, recipientName, issueDate]
    const verificationURL = `https://badge-lookup.netlify.app/verify.html?id=${credID}`;
    const userRef = db.collection("Badges").doc(data.email);
    
    // Using merge: true prevents overwriting other badges the user holds
    await userRef.set({
      [data.badgeName]: [
        verificationURL,
        data.recipientName,
        today
      ]
    }, { merge: true });

    return { statusCode: 200, body: JSON.stringify({ credentialID: credID }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
