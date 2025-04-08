"use client";

import { useState, useEffect } from "react";
import * as Auth from "firebase/auth";
import * as Firestore from "firebase/firestore/lite";

import { authApp, db } from "@/lib/firebase";

const provider = new Auth.TwitterAuthProvider();

async function checkIfAuthorizedUser(uid: string) {
  const docRef = Firestore.doc(db, "users", uid);
  const docSnap = await Firestore.getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data?.isAdmin === true;
  }
  return false;
}

function addUser(user: Auth.User) {
  const userData = {
    displayName: user.displayName,
    email: user.email,
    lastLogin: Firestore.serverTimestamp(),
  };
  const docRef = Firestore.doc(db, "users", user.uid);
  return Firestore.setDoc(docRef, userData, { merge: true });
}

const CMSAuth = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const signInWithTwitter = async () => {
    setLoading(true);
    try {
      await Auth.signInWithPopup(authApp, provider);
    } catch (error) {
      console.error("로그인 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return Auth.onAuthStateChanged(authApp, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          await addUser(currentUser);
        } catch (error) {
          console.error("사용자 정보 저장 실패:", error);
        }

        const isAdmin = await checkIfAuthorizedUser(currentUser.uid);
        setIsAuthorized(isAdmin);
      }

      setLoading(false);
    });
  }, []);

  if (!user || !isAuthorized) {
    if (loading) {
      return <p>Loading...</p>;
    }

    return (
      <button
        type="button"
        onClick={signInWithTwitter}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Sign in with Twitter
      </button>
    );
  }

  return <>{children}</>;
};

export default CMSAuth;
