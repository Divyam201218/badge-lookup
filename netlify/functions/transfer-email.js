const { initFirebase } = require("./_utils");
const db = initFirebase();

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
