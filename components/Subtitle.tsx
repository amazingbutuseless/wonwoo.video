"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Subtitle as SubtitleType } from "@/lib/video/subtitle";

export const MAX_SUBTITLES = 5;

export const Subtitle: React.FC<{ subtitles: SubtitleType[] }> = ({
  subtitles,
}) => {
  const t = useTranslations();

  const [isExpanded, setIsExpanded] = useState(false);

  const hasMoreSubtitles = (subtitles || []).length > MAX_SUBTITLES;

  return (
    <div className="p-4">
      <hr className="border-0 mb-4 w-[40px] h-[1px] bg-gray-200" />

      {(isExpanded ? subtitles : subtitles.slice(0, MAX_SUBTITLES)).map(
        (subtitle) => (
          <blockquote key={subtitle.startTime} className="mb-2">
            <p className="text-gray-900 dark:text-gray-200 text-sm">
              {subtitle.text}
            </p>
            <cite className="not-italic text-xs text-gray-500">
              {subtitle.startTime}
            </cite>
          </blockquote>
        )
      )}

      {hasMoreSubtitles && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className="text-sm text-gray-600 mt-2 hover:underline focus:outline-none"
        >
          {isExpanded
            ? t("misc.collapse")
            : t("misc.moreWithCount", {
                count: subtitles.length - MAX_SUBTITLES,
              })}
        </button>
      )}
    </div>
  );
};
