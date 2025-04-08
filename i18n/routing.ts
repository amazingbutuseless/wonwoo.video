import { defineRouting } from "next-intl/routing";

export const SUPPORTED_LANGUAGES = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文(简体)",
  "zh-TW": "中文(繁體)",
  ja: "日本語",
};

export const routing = defineRouting({
  locales: Object.keys(SUPPORTED_LANGUAGES),
  defaultLocale: "ko",
});
