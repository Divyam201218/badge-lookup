const { corsHeaders, initFirebase } = require("./_utils");
const crypto = require("crypto");

exports.handler = async (event) => {
  const origin = event.headers.origin;
  
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(origin) };
  }

  // Optional: Restrict to your allowed domains, or remove if testing locally
  if (origin !== "https://badge-lookup.netlify.app") {
    return { statusCode: 403, headers: corsHeaders(origin) };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    const db = initFirebase();

    // 1. Verify Credentials
    const adminDoc = await db.collection("Badges").doc("Admins").get();
    const valid = adminDoc.exists && adminDoc.data()[username] === password;

    if (!valid) {
      return { statusCode: 403, headers: corsHeaders(origin), body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    // 2. Generate a Secure Token (64 characters long)
    const token = crypto.randomBytes(32).toString('hex');
    
    // 3. Set expiration for 24 hours from now
    const expiresAt = Date.now() + (1000 * 60 * 60 * 24); 

    // 4. Save to Firestore
    await db.collection("AdminTokens").doc(token).set({
      username,
      expiresAt
    });

    // 5. Send token to the frontend
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ token }) // Sending the token!
    };
  } catch (err) {
    console.error("Login Error:", err);
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: "Server error" }) };
  }
};
