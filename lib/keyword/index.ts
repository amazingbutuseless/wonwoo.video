"use client";

import * as Firestore from "firebase/firestore/lite";

import { db } from "../firebase";

export type Keyword = {
  keywords: string[];
  translated: {[k: number]: { [locale: string]: string }};
};

export const getKeywords = async (videoId: string) => {
  const docRef = Firestore.doc(db, `vo_keywords/${videoId}`);
  const doc = await Firestore.getDoc(docRef);
  return doc.exists() ? (doc.data() as Keyword) : null;
};

export const updateKeywords = async (videoId: string, keywords: string[], translated: { [k: string]: string }[]) => {
  const docRef = Firestore.doc(db, `vo_keywords/${videoId}`);
  await Firestore.setDoc(docRef, { keywords, translated }, { merge: true });
};

export const deleteKeywords = async (videoId: string) => {
  const docRef = Firestore.doc(db, `vo_keywords/${videoId}`);
  await Firestore.deleteDoc(docRef);
};
