const { initFirebase } = require("./_utils");

exports.handler = async (event) => {
  const db = initFirebase();
  const credID = event.queryStringParameters.id;
  
  if (!credID) return { statusCode: 400, body: "Missing Credential ID" };

  try {
    const doc = await db.collection("BadgeCredentials").doc(credID).get();
    
    if (!doc.exists) {
      return { statusCode: 404, body: "Credential not found" };
    }

    return { statusCode: 200, body: JSON.stringify(doc.data()) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
