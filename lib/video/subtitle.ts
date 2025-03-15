"use server";

import * as path from "path";
import sql from "better-sqlite3";

const dbPath = path.join(process.cwd(), "lib/video/subtitles.db");
const db = sql(dbPath);

export type Subtitle = {
  videoId: string;
  language: string;
  startTime: string;
  endTime: string;
  text: string;
};

export const query = async (keyword: string, language: string = "ko") => {
  const stmt = db.prepare<[[string, string]], Subtitle>(
    `
      SELECT 
        s.video_id as videoId, 
        s.language,
        s.start_time as startTime, 
        s.end_time as endTime, 
        s.text
      FROM 
        subtitle_search fts
      JOIN 
        subtitles s ON fts.rowid = s.id
      WHERE 
        fts.text MATCH ? AND s.language = ?
      ORDER BY 
        s.video_id, s.start_time
    `
  );

  return stmt.all([keyword, language]);
};
