const { corsHeaders, initFirebase } = require("./_utils");

exports.handler = async (event) => {
  const origin = event.headers.origin;
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(origin) };
  }

  if (origin !== "https://badge-lookup.netlify.app") {
    return { statusCode: 403 };
  }

  const { username, password } = JSON.parse(event.body);
  const db = initFirebase();

  const adminDoc = await db.collection("Badges").doc("Admins").get();
  const valid = adminDoc.exists && adminDoc.data()[username] === password;

  return {
    statusCode: valid ? 200 : 403,
    headers: corsHeaders(origin),
  };
};
