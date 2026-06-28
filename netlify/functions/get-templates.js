const { initFirebase, corsHeaders } = require("./_utils"); // Make sure corsHeaders is imported

exports.handler = async (event) => {
  // 1. Grab origin for CORS headers
  const origin = event.headers.origin || "*";

  // 2. Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(origin) };
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
    const snapshot = await db.collection("BadgeTemplates").get();
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { 
      statusCode: 200, 
      headers: corsHeaders(origin), // Added CORS headers here
      body: JSON.stringify(templates) 
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      headers: corsHeaders(origin), // Added CORS headers here
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
