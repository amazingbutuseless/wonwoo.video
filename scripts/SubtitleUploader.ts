import * as path from "path";
import { glob } from "glob";
import { Pool, PoolClient } from "pg";

import { VttParser } from "./VttParser";

const SUBTITLES_DIR = path.join(__dirname, "../data/subtitles");

export const SubtitleUploader = (() => {
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
  });

  const getAllVideoAndLanguageWhichSubtitlesExists = async () => {
    const query = `SELECT DISTINCT video_id, language FROM subtitles`;
    const result = await pgPool.query(query);
    return result.rows.map(
      (row: { video_id: string; language: string }) =>
        `${row.video_id}/${row.language}`
    );
  };

  const findVttFilesWhichNotUploaded = async () => {
    const uploaded = await getAllVideoAndLanguageWhichSubtitlesExists();
    const vttFiles = await glob("**/*.vtt", { cwd: SUBTITLES_DIR });
    return vttFiles.filter(
      (vttFile: string) => !uploaded.includes(vttFile.replace(".vtt", ""))
    );
  };

  const _upload = async (client: PoolClient) => {
    const filesToUpload = await findVttFilesWhichNotUploaded();
    console.log(`업로드할 파일 ${filesToUpload.length}개 발견`);

    if (filesToUpload.length === 0) return;

    for (const file of filesToUpload) {
      const parsed = VttParser(path.join(SUBTITLES_DIR, file));
      if (!parsed) continue;

      await client.query("BEGIN");

      const { videoId, language, subtitles } = parsed;

      try {
        const BATCH_SIZE = 1000;

        for (let i = 0; i < subtitles.length; i += BATCH_SIZE) {
          const batch = subtitles.slice(i, i + BATCH_SIZE);

          const values: unknown[] = [];
          const placeholders: string[] = [];
          let paramCounter = 1;

          batch.forEach((subtitle) => {
            values.push(
              videoId,
              language,
              subtitle.startTime,
              subtitle.endTime,
              subtitle.text
            );

            const start = paramCounter;
            paramCounter += 5;
            placeholders.push(
              `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${
                start + 4
              })`
            );
          });

          const query = `
            INSERT INTO subtitles (video_id, language, start_time, end_time, text)
            VALUES ${placeholders.join(", ")}`;
          await client.query(query, values);
        }

        await client.query("COMMIT");
        console.log(`${videoId}/${language} 업로드 완료`);
      } catch {
        await client.query("ROLLBACK");
        console.log(`${videoId}/${language} 업로드 실패`);
      }
    }
  };

  return {
    async upload() {
      const client = await pgPool.connect();
      try {
        await _upload(client);
      } finally {
        client.release();
      }
    },
  };
})();
