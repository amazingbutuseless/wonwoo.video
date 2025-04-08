"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import * as Auth from "firebase/auth";
import { User } from "firebase/auth";
import * as FCM from "firebase/messaging";
import { useLocale } from "next-intl";

import { authApp, app } from "@/lib/firebase";
import { useToast } from "@/components/Toast";

import { subscribe, unsubscribe } from "../push";
import { LocaleStorageKey, read, remove, save } from "../storage";

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

  const unsubscribePushMessage = useCallback(
    async (targetLocale = locale) => {
      if (!messagingApp.current) return false;

      const previousSubscribedLocale = await read<string>(
        LocaleStorageKey.FCM_SUBSCRIBED_LOCALE
      );

      const shouldBeRemoved =
        previousSubscribedLocale && previousSubscribedLocale === targetLocale;

      const result = await unsubscribe(messagingApp.current, targetLocale);

      if (result && shouldBeRemoved) {
        await remove(LocaleStorageKey.FCM_SUBSCRIBED_LOCALE);
      }

      return result;
    },
    [locale]
  );

  const subscribePushMessage = useCallback(async () => {
    if (!messagingApp.current) return false;

    const previousSubscribedLocale = await read<string>(
      LocaleStorageKey.FCM_SUBSCRIBED_LOCALE
    );

    if (previousSubscribedLocale && previousSubscribedLocale === locale) {
      return true;
    }

    if (previousSubscribedLocale && locale !== previousSubscribedLocale) {
      await unsubscribePushMessage(previousSubscribedLocale);
    }

    const result = await subscribe(messagingApp.current, locale);
    if (result) {
      await save(LocaleStorageKey.FCM_SUBSCRIBED_LOCALE, locale);
    }
    return result;
  }, [locale, unsubscribePushMessage]);

  useEffect(() => {
    return Auth.onAuthStateChanged(authApp, (currentUser) => {
      setUser(currentUser);

      if (!currentUser && !loginAttemptedRef.current) {
        loginAttemptedRef.current = true;
        Auth.signInAnonymously(authApp).catch((err) => {
          console.error("로그인 오류:", err);
        });
      }
    });
  }, []);

  useEffect(() => {
    const updateSubscription = async () => {
      if (typeof window === "undefined") return;

      const notificationsEnabled =
        localStorage.getItem("notifications-enabled") === "true";
      if (!notificationsEnabled) return;

      try {
        await subscribePushMessage();
      } catch {
        console.error("FCM 구독 실패");
      }
    };

    updateSubscription();
  }, [locale]);

  useEffect(() => {
    const messaging = messagingApp.current || FCM.getMessaging(app);

    if (!messagingApp.current) {
      messagingApp.current = messaging;
    }

    return FCM.onMessage(messaging, (payload) => {
      const { title = "", body = "", icon } = payload.data || {};
      showToast(title, body, icon || "/default-icon.png");
    });
  }, [showToast]);

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
