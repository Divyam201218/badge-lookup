const { corsHeaders, initFirebase } = require("./_utils");

exports.handler = async (event) => {
  const origin = event.headers.origin;
  if (origin !== "https://badge-lookup.netlify.app") {
    return { statusCode: 403 };
  }

  const { email, series, link, name, issued } = JSON.parse(event.body);
  const db = initFirebase();

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
