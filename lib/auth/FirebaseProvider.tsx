"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Auth from "firebase/auth";
import { User } from "firebase/auth";
import * as FCM from "firebase/messaging";
import { useLocale } from "next-intl";

import { authApp, app } from "@/lib/firebase";
import { useToast } from "@/components/Toast";

import { internationalize, subscribe, unsubscribe } from "../push";

const FirebaseContext = createContext<{
  user: User | null;
  subscribePushMessage: () => Promise<boolean>;
  unsubscribePushMessage: () => Promise<boolean>;
}>({
  user: null,
  subscribePushMessage: () => Promise.resolve(false),
  unsubscribePushMessage: () => Promise.resolve(true),
});

export const FirebaseProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const locale = useLocale();

  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const loginAttemptedRef = useRef(false);

  const messagingApp = useRef<FCM.Messaging | null>(null);

  const subscribePushMessage = () => {
    if (!messagingApp.current) return Promise.resolve(false);
    return subscribe(messagingApp.current);
  };

  const unsubscribePushMessage = () => {
    if (!messagingApp.current) return Promise.resolve(true);
    return unsubscribe(messagingApp.current);
  };

  useEffect(() => {
    const unsubscribe = Auth.onAuthStateChanged(authApp, (currentUser) => {
      setUser(currentUser);

      if (!currentUser && !loginAttemptedRef.current) {
        loginAttemptedRef.current = true;

        Auth.signInAnonymously(authApp).catch((err) => {
          console.error("로그인 오류:", err);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const messaging = messagingApp.current || FCM.getMessaging(app);

    if (!messagingApp.current) {
      messagingApp.current = messaging;
    }

    return FCM.onMessage(messaging, (payload) => {
      if (!payload.data) return;

      if (payload.data?.type === "update") {
        const { title, body } = internationalize(locale, payload.data);
        showToast(
          title,
          body,
          payload.notification?.icon || "/default-icon.png"
        );
      }
    });
  }, [locale, showToast]);

  return (
    <FirebaseContext.Provider
      value={{ user, subscribePushMessage, unsubscribePushMessage }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebaseContext() {
  return useContext(FirebaseContext);
}
