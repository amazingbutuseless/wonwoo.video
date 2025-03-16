"use server";

import { Pool } from "pg";

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

export const query = async (keyword: string, language: string = "ko") => {
  const client = await pool.connect();

  try {
    const { rows } = await client.query<Subtitle>(
      `SELECT 
        video_id as "videoId",
        language,
        start_time as "startTime", 
        end_time as "endTime", 
        text
      FROM 
        subtitles
      WHERE 
        text_vector @@ plainto_tsquery('simple', $1) AND language = $2
      ORDER BY 
        video_id, start_time`,
      [keyword, language]
    );

    return rows;
  } finally {
    client.release();
  }
};
