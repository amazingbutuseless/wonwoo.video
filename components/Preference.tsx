"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { PreferencePanel } from "./PreferencePanel";

export const Preference: React.FC = () => {
  const t = useTranslations();

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Settings"
        >
          <Image
            src="/settings.svg"
            width={24}
            height={24}
            alt={t("settings.title")}
            className="dark:invert"
          />
        </button>
      </div>

      <PreferencePanel
        open={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      />
    </>
  );
};
