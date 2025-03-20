"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";

type Props = {
  words: string[];
};

const FONT_SIZE_MIN = 16;
const FONT_SIZE_VARIANCE = 24;
const BOLD_THRESHOLD = 0.5;
const WORD_PADDING = "5px";
const GRAYSCALE_SATURATION = "0%";
const GRAYSCALE_LIGHTNESS_MIN = 85;
const GRAYSCALE_LIGHTNESS_MAX = 100;
const TRANSITION_DURATION = "0.3s";
const HOVER_SCALE = "scale(1.1)";
const DEFAULT_SCALE = "scale(1)";
export const MIN_CONTAINER_HEIGHT = "240px";
const MAX_PLACEMENT_ATTEMPTS = 100;

const ANIMATION_DURATION_MIN = 3;
const ANIMATION_DURATION_MAX = 7;
const ANIMATION_DELAY_MAX = 2;
const MOVEMENT_RANGE = 20;

const SAFETY_MARGIN = 15;
const SPIRAL_ANGLE_STEP = 0.3;
const SPIRAL_RADIUS_STEP = 5;

export function WordCloud({ words }: Props) {
  const locale = useLocale();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const occupiedAreas: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];

    const isColliding = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      if (
        x < 0 ||
        y < 0 ||
        x + width > containerWidth ||
        y + height > containerHeight
      ) {
        return true;
      }

      for (const area of occupiedAreas) {
        if (
          x < area.x + area.width &&
          x + width > area.x &&
          y < area.y + area.height &&
          y + height > area.y
        ) {
          return true;
        }
      }
      return false;
    };

    const wordsWithSize = words.map((word) => {
      const fontSize =
        Math.floor(Math.random() * FONT_SIZE_VARIANCE) + FONT_SIZE_MIN;
      return { word, fontSize: fontSize * (locale === "en" ? 0.9 : 1) };
    });

    wordsWithSize.sort((a, b) => b.fontSize - a.fontSize);

    wordsWithSize.forEach(({ word, fontSize }) => {
      const lightness =
        GRAYSCALE_LIGHTNESS_MIN +
        Math.random() * (GRAYSCALE_LIGHTNESS_MAX - GRAYSCALE_LIGHTNESS_MIN);

      const span = document.createElement("span");
      span.textContent = word;
      span.style.fontSize = `${fontSize}px`;
      span.style.position = "absolute";
      span.style.fontWeight =
        Math.random() > BOLD_THRESHOLD ? "bold" : "normal";
      span.style.color = `hsl(0, ${GRAYSCALE_SATURATION}, ${lightness}%)`;
      span.style.padding = WORD_PADDING;
      span.style.cursor = "pointer";
      span.style.userSelect = "none";
      span.style.transition = `transform ${TRANSITION_DURATION}`;

      const duration =
        ANIMATION_DURATION_MIN +
        Math.random() * (ANIMATION_DURATION_MAX - ANIMATION_DURATION_MIN);
      const delay = Math.random() * ANIMATION_DELAY_MAX;
      const moveX1 = Math.random() * MOVEMENT_RANGE - MOVEMENT_RANGE / 2;
      const moveY1 = Math.random() * MOVEMENT_RANGE - MOVEMENT_RANGE / 2;
      const moveX2 = Math.random() * MOVEMENT_RANGE - MOVEMENT_RANGE / 2;
      const moveY2 = Math.random() * MOVEMENT_RANGE - MOVEMENT_RANGE / 2;
      const rotate1 = (Math.random() * 2 - 1) * 2;
      const rotate2 = (Math.random() * 2 - 1) * 2;

      span.style.setProperty("--move-x1", `${moveX1}px`);
      span.style.setProperty("--move-y1", `${moveY1}px`);
      span.style.setProperty("--move-x2", `${moveX2}px`);
      span.style.setProperty("--move-y2", `${moveY2}px`);
      span.style.setProperty("--rotate1", `${rotate1}deg`);
      span.style.setProperty("--rotate2", `${rotate2}deg`);
      span.style.setProperty("--duration", `${duration}s`);
      span.style.setProperty("--delay", `${delay}s`);

      span.className = "word-floating";

      span.addEventListener("mouseenter", () => {
        span.classList.remove("word-floating");
        span.style.transform = HOVER_SCALE;
      });

      span.addEventListener("mouseleave", () => {
        span.style.transform = DEFAULT_SCALE;
        setTimeout(() => {
          span.className = "word-floating";
        }, parseFloat(TRANSITION_DURATION) * 1000);
      });

      container.appendChild(span);

      const width = span.offsetWidth;
      const height = span.offsetHeight;

      let placed = false;

      const centerX = containerWidth / 2 - width / 2;
      const centerY = containerHeight / 2 - height / 2;

      if (!isColliding(centerX, centerY, width, height)) {
        span.style.left = `${centerX}px`;
        span.style.top = `${centerY}px`;
        placed = true;
      } else {
        let angle = 0;
        let radius = SPIRAL_RADIUS_STEP;
        let attempts = 0;

        while (!placed && attempts < MAX_PLACEMENT_ATTEMPTS) {
          angle += SPIRAL_ANGLE_STEP;
          radius += SPIRAL_RADIUS_STEP / (2 * Math.PI);

          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          if (!isColliding(x, y, width, height)) {
            span.style.left = `${x}px`;
            span.style.top = `${y}px`;
            placed = true;
          }

          attempts++;
        }

        if (!placed) {
          attempts = 0;
          do {
            const x = Math.random() * (containerWidth - width);
            const y = Math.random() * (containerHeight - height);

            if (!isColliding(x, y, width, height)) {
              span.style.left = `${x}px`;
              span.style.top = `${y}px`;
              placed = true;
              break;
            }
            attempts++;
          } while (attempts < 20);

          if (!placed) {
            const x = Math.random() * (containerWidth - width - 10);
            const y = Math.random() * (containerHeight - height - 10);
            span.style.left = `${x}px`;
            span.style.top = `${y}px`;
          }
        }
      }

      const margin = Math.max(SAFETY_MARGIN, MOVEMENT_RANGE);
      occupiedAreas.push({
        x: parseFloat(span.style.left) - margin,
        y: parseFloat(span.style.top) - margin,
        width: width + margin * 2,
        height: height + margin * 2,
      });
    });
  }, [locale, words]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ minHeight: MIN_CONTAINER_HEIGHT }}
    />
  );
}
