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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  
  const data = JSON.parse(event.body);
  
  try {
    const docRef = await db.collection("BadgeTemplates").add(data);
    return { statusCode: 200, body: JSON.stringify({ id: docRef.id }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
