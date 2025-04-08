export enum LocaleStorageKey {
  FCM_SUBSCRIBED_LOCALE = "fcm_subscribed_locale",
}

function onUpgradeNeeded(event: IDBVersionChangeEvent) {
  const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
  if (!db.objectStoreNames.contains("settings")) {
    db.createObjectStore("settings", { keyPath: "key" });
  }
}

export async function save(key: LocaleStorageKey, value: unknown) {
  try {
    const request: IDBOpenDBRequest = indexedDB.open("wonwoo-video", 1);

    request.onupgradeneeded = onUpgradeNeeded;

    request.onsuccess = (event: Event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const transaction: IDBTransaction = db.transaction(
        ["settings"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("settings");

      const item = { key, value };
      store.put(item);

      transaction.oncomplete = () => {
        db.close();
      };
    };

    request.onerror = (event: Event) => {
      console.error("IndexedDB Error:", event);
    };
  } catch (error) {
    console.error("Error while storing:", error);
  }
}

export function read<T>(key: LocaleStorageKey): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("wonwoo-video", 1);

    request.onupgradeneeded = onUpgradeNeeded;

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      const transaction = db.transaction(["settings"], "readonly");
      const store = transaction.objectStore("settings");
      const item = store.get(key);

      item.onsuccess = () => {
        if (item.result && item.result.value) {
          resolve(item.result.value as T);
        } else {
          resolve(null);
        }
        db.close();
      };

      item.onerror = () => {
        reject(new Error("Error retrieving item from IndexedDB"));
        db.close();
      };
    };

    request.onerror = () => {
      reject(new Error("Error opening IndexedDB"));
    };
  });
}

export async function remove(key: LocaleStorageKey) {
  try {
    const request: IDBOpenDBRequest = indexedDB.open("wonwoo-video", 1);

    request.onupgradeneeded = onUpgradeNeeded;

    request.onsuccess = (event: Event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      const transaction: IDBTransaction = db.transaction(
        ["settings"],
        "readwrite"
      );
      const store: IDBObjectStore = transaction.objectStore("settings");

      store.delete(key);

      transaction.oncomplete = () => {
        db.close();
      };
    };

    request.onerror = (event: Event) => {
      console.error("IndexedDB Error:", event);
    };
  } catch (error) {
    console.error("Error while removing:", error);
  }
}
