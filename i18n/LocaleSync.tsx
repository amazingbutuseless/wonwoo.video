"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

async function saveLocaleToIndexedDB(locale: string) {
  try {
    const request: IDBOpenDBRequest = indexedDB.open("wonwoo-video", 1);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };

    request.onsuccess = (event: Event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const transaction: IDBTransaction = db.transaction(
        ["settings"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("settings");

      const localeItem = { key: "locale", value: locale };
      store.put(localeItem);

      transaction.oncomplete = () => {
        db.close();
      };
    };

    request.onerror = (event: Event) => {
      console.error("IndexedDB Error:", event);
    };
  } catch (error) {
    console.error("Error while locale storing:", error);
  }
}

export function LocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    saveLocaleToIndexedDB(locale);
  }, [locale]);

  return null;
}
