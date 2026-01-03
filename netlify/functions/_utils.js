const admin = require("firebase-admin");

const ALLOWED_ORIGIN = "https://badge-lookup.netlify.app";

function corsHeaders(origin) {
  if (origin === ALLOWED_ORIGIN) {
    return {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
  }
  return {};
}

function initFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      ),
      databaseURL: JSON.parse(process.env.FIREBASE_URL),

    });
  }
  return admin.firestore();
}

module.exports = { corsHeaders, initFirebase };
