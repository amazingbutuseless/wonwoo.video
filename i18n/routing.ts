import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en", "zh-CN", "zh-TW", "ja"],
  defaultLocale: "ko",
});
