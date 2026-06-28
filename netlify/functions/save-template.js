const { initFirebase } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  
  const db = initFirebase();
  const data = JSON.parse(event.body);
  
  try {
    const docRef = await db.collection("BadgeTemplates").add(data);
    return { statusCode: 200, body: JSON.stringify({ id: docRef.id }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
