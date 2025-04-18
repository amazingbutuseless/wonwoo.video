"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import dayjs from "dayjs";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

export const VideoCard: React.FC<PropsWithChildren<Video>> = (props) => {
  const cardRef = useRef<HTMLElement>(null);
  const animationRef = useRef<number | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [spriteLoaded, setSpriteLoaded] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const { children, ...video } = props;

  const spriteConfig = {
    columns: 10,
    rows: 10,
    frameWidth: 160,
    frameHeight: 90,
    totalFrames: 100,
  };

  const spriteImagePath = `/video_sprites/${video.id}_1.jpg`;
  const frameRate = 6;

  const col = currentFrame % spriteConfig.columns;
  const row = Math.floor(currentFrame / spriteConfig.columns);

  const spriteStyle = {
    backgroundImage: `url(${spriteImagePath})`,
    backgroundPosition: `-${col * spriteConfig.frameWidth}px -${
      row * spriteConfig.frameHeight
    }px`,
    backgroundSize: `${spriteConfig.columns * spriteConfig.frameWidth}px auto`,
    width: "160px",
    height: `${spriteConfig.frameHeight}px`,
  };

  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - 일부 브라우저에서는 msMaxTouchPoints가 있음
        navigator.msMaxTouchPoints > 0
    );
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.9 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if ((isTouchDevice && isVisible) || (!isTouchDevice && isHovered)) {
      const preloadImage = new Image();
      preloadImage.onload = () => setSpriteLoaded(true);
      preloadImage.onerror = () => console.error("Failed to load sprite image");
      preloadImage.src = spriteImagePath;
    }
  }, [isHovered, isTouchDevice, isVisible, spriteImagePath]);

  useEffect(() => {
    let lastTime = 0;
    const interval = 1000 / frameRate;

    const animate = (time: number) => {
      if (time - lastTime > interval) {
        setCurrentFrame((prev) => (prev + 1) % spriteConfig.totalFrames);
        lastTime = time;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isVisible && spriteLoaded) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      setCurrentFrame(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, spriteLoaded, frameRate, spriteConfig.totalFrames]);

  return (
    <article
      className="relative border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={cardRef}
    >
      <Link href={video.url} target="_blank" passHref>
        <img
          src={video.imageUrl || ""}
          alt={video.title}
          className="object-cover w-full"
        />
        {spriteLoaded &&
        ((isTouchDevice && isVisible) || (!isTouchDevice && isHovered)) ? (
          <div
            style={spriteStyle}
            className="absolute right-[10px] -mt-[100px]"
            aria-label={video.title}
          />
        ) : null}

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
