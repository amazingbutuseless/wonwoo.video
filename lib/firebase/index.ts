"use client";

import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import * as Firestore from "firebase/firestore/lite";
import * as Auth from "firebase/auth";

const firebaseConfig = {
  apiKey: "process.env.NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "wonwoo-video.firebaseapp.com",
  databaseURL:
    "https://wonwoo-video-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wonwoo-video",
  storageBucket: "wonwoo-video.firebasestorage.app",
  messagingSenderId: "585284382032",
  appId: "1:585284382032:web:975eb116af47607eb99055",
  measurementId: "G-NC0JQM512T",
};

const isFirebaseAppInitialized = getApps().length > 0;

const firebaseApp = isFirebaseAppInitialized ? getApp(): initializeApp(firebaseConfig);

export const authApp = Auth.getAuth(firebaseApp);
export const db = Firestore.getFirestore(firebaseApp);

export { firebaseApp as app };
