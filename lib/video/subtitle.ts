"use server";

import { Pool } from "pg";

import { PaginationParams, PaginationResult } from ".";
import { DEFAULT_VIDEO_LIMIT } from "./constants";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export type Subtitle = {
  videoId: string;
  language: string;
  startTime: string;
  endTime: string;
  text: string;
};

export type SubtitlePaginationParams = Omit<PaginationParams, "tag"> & {
  keyword: string;
  language: string;
};

export const getVideosWithSubtitles = async ({
  keyword,
  language = "ko",
  cursor = null,
  limit = DEFAULT_VIDEO_LIMIT,
}: SubtitlePaginationParams): Promise<PaginationResult> => {
  const client = await pool.connect();

  const isCJKLanguage = ["ko", "ja", "zh-CN", "zh-TW"].includes(language);

  const textCondition = isCJKLanguage
    ? "s.text ILIKE $1"
    : `s.text_vector @@ plainto_tsquery('simple', $1)`;

  try {
    let cursorCondition = "";
    const params: (string | Date)[] = [
      isCJKLanguage ? `%${keyword}%` : keyword,
      language,
    ];

    if (cursor) {
      cursorCondition = `AND v.aired_at < $3`;
      params.push(new Date(cursor));
    }

    const { rows } = await client.query(
      `WITH matched_videos AS (
        -- 검색어를 포함하는 비디오 중 페이징 적용된 최신 n+1개 선택
        SELECT DISTINCT v.id, v.aired_at
        FROM videos v
        JOIN subtitles s ON v.id = s.video_id
        WHERE 
          v.published = true AND
          s.language = $2 AND
          ${textCondition}
          ${cursorCondition}
        ORDER BY v.aired_at DESC
        LIMIT ${limit + 1}  -- 하나 더 가져와서 hasMore 확인
      )
      SELECT
        v.id, 
        v.url,
        v.title,
        v.image_url as "imageUrl",
        v.aired_at as "airedAt",
        v.is_voice_only as "isVoiceOnly",
        s.video_id as "videoId",
        s.language,
        s.start_time as "startTime", 
        s.end_time as "endTime", 
        s.text,
        ARRAY(
          SELECT t.name
          FROM video_tags vt
          JOIN tags t ON vt.tag_id = t.id
          WHERE vt.video_id = v.id
        ) as "tags"
      FROM 
        subtitles s
      JOIN matched_videos mv ON s.video_id = mv.id
      JOIN videos v ON s.video_id = v.id
      WHERE 
        s.language = $2 AND
        ${textCondition}
      ORDER BY 
        v.aired_at DESC,
        s.video_id, 
        s.start_time`,
      params
    );

    const videoIds = [...new Set(rows.map((row) => row.videoId))];
    const hasMore = videoIds.length > limit;

    const limitedVideoIds = videoIds.slice(0, limit);
    const filteredRows = rows.filter((row) =>
      limitedVideoIds.includes(row.videoId)
    );

    let nextCursor = null;

    if (filteredRows.length > 0) {
      const oldestVideo = filteredRows.reduce((oldest, current) => {
        return new Date(oldest.airedAt) <= new Date(current.airedAt)
          ? oldest
          : current;
      }, filteredRows[0]);

      nextCursor = oldestVideo.airedAt;
    }

    const videoMap = new Map<string, Video>();

    for (const row of filteredRows) {
      const { videoId, startTime, endTime, text, ...videoData } = row;

      if (!videoMap.has(videoId)) {
        videoMap.set(videoId, {
          ...videoData,
          subtitles: [],
        });
      }

      const video = videoMap.get(videoId)!;
      (video.subtitles as Subtitle[]).push({
        videoId,
        startTime,
        endTime,
        text,
        language,
      });
    }

    const videos = Array.from(videoMap.values());

    return {
      videos,
      nextCursor: hasMore ? nextCursor : null,
      hasMore,
    };
  } finally {
    client.release();
  }
};
