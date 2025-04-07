"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

import { useRouter } from "@/i18n/navigation";
import { useFirebaseContext } from "@/lib/auth/FirebaseProvider";

const SUPPORTED_LANGUAGES = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文(简体)",
  "zh-TW": "中文(繁體)",
  ja: "日本語",
};

export const PreferencePanel = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: VoidFunction;
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { subscribePushMessage, unsubscribePushMessage } = useFirebaseContext();

  const scrollPositionRef = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const isIOSBrowser = isIOS && !isStandalone;

  const detectEnvironment = () => {
    const isAppleDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & typeof globalThis & { MSStream: unknown }).MSStream;

    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone: unknown }).standalone ===
        true;

    setIsIOS(isAppleDevice);
    setIsStandalone(isInStandaloneMode);
  };

  const handleLanguageChange: React.ChangeEventHandler<HTMLSelectElement> = (
    e
  ) => {
    const newLocale = e.target.value;
    router.replace("/", { locale: newLocale });
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    const currentPermission = Notification.permission;

    let subscribed = notificationsEnabled;

    setPushLoading(true);

    try {
      if (newValue) {
        const updatedPersmission =
          currentPermission === "granted"
            ? await Promise.resolve("granted")
            : await Notification.requestPermission();
        if (updatedPersmission === "granted") {
          subscribed = await subscribePushMessage();
        } else {
          alert(t("settings.requiredPermissionForNotifications"));
          subscribed = false;
        }
      } else if (!newValue && currentPermission === "granted") {
        subscribed = !(await unsubscribePushMessage());
      }

      setPushLoading(false);
      setNotificationsEnabled(subscribed);
      localStorage.setItem("notifications-enabled", String(subscribed));
    } catch {
      setPushLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      detectEnvironment();
      const savedPref = localStorage.getItem("notifications-enabled");
      setNotificationsEnabled(savedPref === "true");
    }

    if (open) {
      scrollPositionRef.current = window.scrollY;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";

      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/50 dark:bg-black/80 z-20 transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-xl p-4 shadow-lg transition-transform duration-300 transform ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-white">
            {t("settings.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Image
              src="/close.svg"
              width={24}
              height={24}
              alt="Close"
              className="dark:invert"
            />
          </button>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-center gap-2 py-2 px-1 border-b border-gray-200 dark:border-gray-700">
            <label htmlFor="language" className="text-sm">
              {t("settings.language")}
            </label>
            <select
              id="language"
              value={locale}
              onChange={handleLanguageChange}
              className="py-2 px-3 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center gap-4 py-2 px-1 ">
            <label htmlFor="notifications" className="flex items-center gap-2">
              <span className="shrink-0 text-sm">
                {t("settings.notifications")}
              </span>
              {isIOSBrowser ? (
                <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 dark:bg-amber-900/30 dark:text-amber-400 border border-red-200 dark:border-amber-700/50">
                  {t("settings.requiredAddingHomeForNotifications")}
                </span>
              ) : (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {t(
                    pushLoading
                      ? "misc.isProcessing"
                      : notificationsEnabled
                      ? "settings.notificationsEnabled"
                      : "settings.notificationsDisabled"
                  )}
                </span>
              )}
            </label>

            {pushLoading ? (
              <div className="relative inline-flex items-center justify-center h-6 w-11">
                <div className="absolute w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <button
                id="notifications"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={toggleNotifications}
                disabled={isIOSBrowser}
                className={`relative inline-flex shrink-0 items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  ${
                    notificationsEnabled
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }
                  ${isIOSBrowser ? "opacity-50 cursor-not-allowed" : ""}
                `}
                title={isIOSBrowser ? t("settings.iosInstallRequired") : ""}
              >
                <span className="sr-only">{t("settings.notifications")}</span>
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
                    ${
                      notificationsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
