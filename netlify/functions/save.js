const { corsHeaders, initFirebase } = require("./_utils");
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
  const origin = event.headers.origin;
  if (origin !== "https://badge-lookup.netlify.app") {
    return { statusCode: 403 };
  }

  const { email, series, link, name, issued } = JSON.parse(event.body);

  await db.collection("Badges").doc(email).set(
    {
      [series]: [link, name, issued],
    },
    { merge: true }   // 🔥 no overwrite
  );

  return {
    statusCode: 200,
    headers: corsHeaders(origin),
  };
};
