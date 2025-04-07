"use client";

import dayjs from "dayjs";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocale } from "next-intl";

import { Link } from "@/i18n/navigation";
import { getKeywords, Keyword } from "@/lib/keyword";
import { useFirebaseContext } from "@/lib/auth/FirebaseProvider";

import { MIN_CONTAINER_HEIGHT, WordCloud } from "./WordCloud";
import { Loader } from "./Loader";

export const VoiceOnlyCard: React.FC<PropsWithChildren<Video>> = (props) => {
  const locale = useLocale();
  const { user } = useFirebaseContext();
  const [words, _setWords] = useState<string[]>([]);
  const [, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const loadedRef = useRef(false); // 키워드가 이미 로드되었는지 추적

  const { children, ...video } = props;

  const setWords = useCallback(
    (keywords: Keyword | null) => {
      if (keywords) {
        let updated = keywords.keywords;
        if (keywords.translated) {
          updated = Object.values(keywords.translated).map(
            (item, idx) => item[locale] || updated[idx]
          );
        }
        _setWords(updated);
      }
      setIsLoading(false);
    },
    [locale]
  );

  const loadKeywords = useCallback(() => {
    if (user && !loadedRef.current) {
      setIsLoading(true);
      loadedRef.current = true; // 로드 플래그 설정
      getKeywords(video.id).then(setWords);
    }
  }, [user, video.id, setWords]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadKeywords();
          if (cardRef.current) {
            observer.unobserve(cardRef.current);
          }
        }
      },
      {
        root: null,
        threshold: 0.6,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [loadKeywords]);

  return (
    <article
      ref={cardRef}
      className="relative w-full border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
    >
      <Link href={video.url} target="_blank" passHref>
        <div
          className="flex justify-center items-center"
          style={{
            minHeight: MIN_CONTAINER_HEIGHT,
            background: "linear-gradient(112deg, #01D5DF 0%, #E7A2FF 107.32%)",
          }}
        >
          {words.length === 0 ? (
            <Loader color="#fff" />
          ) : (
            <WordCloud words={words} />
          )}
        </div>

        <div className="flex flex-col gap-1 p-4">
          <strong>{video.title}</strong>
          <span className="text-sm text-gray-500">
            {dayjs(video.airedAt).format("YYYY-MM-DD HH:mm")}
          </span>
        </div>
      </Link>

      {children}
    </article>
  );
};
