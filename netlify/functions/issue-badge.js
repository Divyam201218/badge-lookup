const { initFirebase, corsHeaders } = require("./_utils");

// Helper functions can safely live outside the handler
function generateCredentialID() {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BG-2026-${randomStr}`;
}

exports.handler = async (event) => {
  // 1. Grab origin for CORS headers
  const origin = event.headers.origin || "*";

  // 2. Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(origin) };
  }

  // 3. Enforce POST method
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(origin), body: "Method Not Allowed" };
  }

  const db = initFirebase();

  // ==========================================
  // SECURITY CHECK: VERIFY TOKEN
  // ==========================================
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { 
      statusCode: 401, 
      headers: corsHeaders(origin), 
      body: JSON.stringify({ error: "Missing or invalid Authorization header" }) 
    };
  }

  const token = authHeader.split(" ")[1];
  const tokenDoc = await db.collection("AdminTokens").doc(token).get();

  if (!tokenDoc.exists || tokenDoc.data().expiresAt < Date.now()) {
    return { 
      statusCode: 403, 
      headers: corsHeaders(origin), 
      body: JSON.stringify({ error: "Token is invalid or expired" }) 
    };
  }
  // ==========================================
  // TOKEN VALID: PROCEED WITH FUNCTION LOGIC
  // ==========================================

  try {
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

    return { 
      statusCode: 200, 
      headers: corsHeaders(origin), // Added CORS headers!
      body: JSON.stringify({ credentialID: credID }) 
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      headers: corsHeaders(origin), // Added CORS headers!
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
