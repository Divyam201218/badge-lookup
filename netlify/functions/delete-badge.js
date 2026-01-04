const { initFirebase } = require("./_utils");
const db = initFirebase();

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

  // Remove only this badge (series)
  await ref.update({
    [series]: admin.firestore.FieldValue.delete()
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
