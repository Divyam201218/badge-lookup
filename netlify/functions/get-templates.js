const { initFirebase } = require("./_utils");

exports.handler = async (event) => {
  const db = initFirebase();
  try {
    const snapshot = await db.collection("BadgeTemplates").get();
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { statusCode: 200, body: JSON.stringify(templates) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
