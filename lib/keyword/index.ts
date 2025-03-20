"use client";

import * as Firestore from "firebase/firestore/lite";

import { db } from "./firebase";

export type Keyword = {
  keywords: string[];
  translated: { [k: string]: string }[];
};

export const getKeywords = async (videoId: string) => {
  const docRef = Firestore.doc(db, `vo_keywords/${videoId}`);
  const doc = await Firestore.getDoc(docRef);
  return doc.exists() ? (doc.data() as Keyword) : null;
};
