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

  const { from, to } = JSON.parse(event.body || "{}");

  if (!from || !to || from === to || from === "Admins" || to === "Admins") {
    return { statusCode: 400, body: "Invalid request" };
  }

  const badgesRef = db.collection("Badges");
  const fromDoc = await badgesRef.doc(from).get();
  const toDoc = await badgesRef.doc(to).get();

  if (!fromDoc.exists) {
    return { statusCode: 404, body: "Source email not found" };
  }

  const fromData = fromDoc.data();
  const toData = toDoc.exists ? toDoc.data() : {};

  // Merge (from overwrites on conflict)
  const merged = { ...toData, ...fromData };

  await badgesRef.doc(to).set(merged, { merge: true });
  await badgesRef.doc(from).delete();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
