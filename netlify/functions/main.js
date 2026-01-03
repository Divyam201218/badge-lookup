const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
        databaseURL: admin.credential.cert(JSON.parse(process.env.FIREBASE_URL)),
    });
}

const db = admin.firestore();
