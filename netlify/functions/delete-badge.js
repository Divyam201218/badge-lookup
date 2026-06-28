const admin = require("firebase-admin");
const { initFirebase, corsHeaders } = require("./_utils");

// Global constants can safely live outside
const ALLOWED_ORIGIN = "https://badge-lookup.netlify.app";

exports.handler = async (event) => {
  // 1. Grab origin for CORS headers
  const origin = event.headers.origin || "*";

  // 2. Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(origin) };
  }

  // 3. Optional Strict Origin Check (Useful for deletion functions!)
  if (origin !== ALLOWED_ORIGIN && origin !== "http://localhost:3000") {
    return { 
      statusCode: 403, 
      headers: corsHeaders(origin), 
      body: JSON.stringify({ error: "Forbidden Origin" }) 
    };
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
    const { email, series } = JSON.parse(event.body || "{}");

    if (!email || !series || email === "Admins") {
      return { 
        statusCode: 400, 
        headers: corsHeaders(origin), 
        body: JSON.stringify({ error: "Invalid request" }) 
      };
    }

    const ref = db.collection("Badges").doc(email);

    // 1. Delete only the badge (series)
    await ref.update({
      [series]: admin.firestore.FieldValue.delete()
    });

    // 2. OPTIONAL CLEANUP
    const snap = await ref.get();
    if (!snap.exists || Object.keys(snap.data()).length === 0) {
      await ref.delete();
    }

    return {
      statusCode: 200,
      headers: corsHeaders(origin), // Added CORS headers!
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error("Deletion error:", error);
    return { 
      statusCode: 500, 
      headers: corsHeaders(origin), // Added CORS headers!
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
