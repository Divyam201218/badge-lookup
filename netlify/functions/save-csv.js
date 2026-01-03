const { corsHeaders, initFirebase } = require("./_utils");
const csv = require("csvtojson");

exports.handler = async (event) => {
  const origin = event.headers.origin;
  if (origin !== "https://badge-lookup.netlify.app") {
    return { statusCode: 403 };
  }

  const db = initFirebase();
  const rows = await csv().fromString(event.body);

  const batch = db.batch();

  rows.forEach(r => {
    if (!r["Recipient email"]) return;

    const ref = db.collection("Badges").doc(r["Recipient email"]);
    batch.set(
      ref,
      {
        [r["Group name"]]: [
          r["Credential URL"],
          r["Recipient name"],
          r["Issued on"],
        ],
      },
      { merge: true } // 🔥 safe update
    );
  });

  await batch.commit();

  return {
    statusCode: 200,
    headers: corsHeaders(origin),
  };
};
