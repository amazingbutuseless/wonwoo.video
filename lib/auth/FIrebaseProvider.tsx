"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import * as Auth from "firebase/auth";
import { User } from "firebase/auth";

import { authApp } from "@/lib/keyword/firebase";

const FirebaseContext = createContext<{ user: User | null }>({ user: null });

export const FirebaseProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    Auth.onAuthStateChanged(authApp, setUser);

    if (!user) {
      Auth.signInAnonymously(authApp).catch((err) => {
        console.error(err);
      });
    }
  }, [user]);

  return (
    <FirebaseContext.Provider value={{ user }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebaseContext() {
  return useContext(FirebaseContext);
}
