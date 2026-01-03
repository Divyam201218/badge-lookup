const { corsHeaders, initFirebase } = require("./_utils");

exports.handler = async (event) => {
  const origin = event.headers.origin;
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(origin) };
  }

  if (origin !== "https://badge-lookup.netlify.app") {
    return { statusCode: 403 };
  }

  const db = initFirebase();
  const body = JSON.parse(event.body || "{}");

  /* ---------- PUBLIC LOOKUP ---------- */
  if (body.email) {
    if (body.email === "Admins") return { statusCode: 404 };

    const doc = await db.collection("Badges").doc(body.email).get();
    if (!doc.exists) return { statusCode: 404 };

    const data = doc.data();
    const result = [];

    Object.entries(data).forEach(([series, arr]) => {
      result.push({
        series,
        link: arr[0],
        name: arr[1],
        issued: arr[2],
      });
    });

    if (!result.length) return { statusCode: 404 };

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ [body.email]: result }),
    };
  }

  /* ---------- ADMIN FETCH ---------- */
  if (body.password) {
    const adminDoc = await db.collection("Badges").doc("Admins").get();
    const allowed = Object.values(adminDoc.data() || {}).includes(body.password);
    if (!allowed) return { statusCode: 403 };

    const snap = await db.collection("Badges").get();
    const output = {};

    snap.forEach(d => {
      if (d.id === "Admins") return;

      output[d.id] = Object.entries(d.data()).map(([series, arr]) => ({
        series,
        link: arr[0],
        name: arr[1],
        issued: arr[2],
      }));
    });

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify(output),
    };
  }

  return { statusCode: 400 };
};
