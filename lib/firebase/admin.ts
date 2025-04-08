import admin from "firebase-admin";

const serviceAccountString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || "";
const serviceAccount = JSON.parse(serviceAccountString);

const adminApp =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL:
          "https://wonwoo-video-default-rtdb.asia-southeast1.firebasedatabase.app",
      });

export default adminApp;
