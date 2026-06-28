const admin = require("firebase-admin");
const { initFirebase } = require("./_utils");
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

const ALLOWED_ORIGIN = "https://badge-lookup.netlify.app";

exports.handler = async (event) => {
  if (event.headers.origin !== ALLOWED_ORIGIN) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const { email, series } = JSON.parse(event.body || "{}");

  if (!email || !series || email === "Admins") {
    return { statusCode: 400, body: "Invalid request" };
  }

  const ref = db.collection("Badges").doc(email);

  // 🔴 1. Delete only the badge (series)
  await ref.update({
    [series]: admin.firestore.FieldValue.delete()
  });

  // 🟡 2. OPTIONAL CLEANUP (THIS is the code you asked about)
  const snap = await ref.get();
  if (!snap.exists || Object.keys(snap.data()).length === 0) {
    await ref.delete();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
