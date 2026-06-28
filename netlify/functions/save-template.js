const { initFirebase, corsHeaders } = require("./_utils");

exports.handler = async (event) => {
  const origin = event.headers.origin || "*";

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(origin) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(origin), body: JSON.stringify({ error: "Method Not Allowed" }) };
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
    const docRef = await db.collection("BadgeTemplates").add(data);
    
    return { 
      statusCode: 200, 
      headers: corsHeaders(origin),
      body: JSON.stringify({ id: docRef.id }) 
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
