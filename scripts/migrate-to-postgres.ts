/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: "../.env.local" });

const SQLITE_PATH = path.join(__dirname, "../lib/video/subtitles.db");
const BATCH_SIZE = 1000;

interface SubtitleRow {
  video_id: string;
  language: string;
  start_time: string;
  end_time: string;
  text: string;
}

interface CountResult {
  count: number;
}

async function main() {
  console.log("마이그레이션 시작...");

  console.log("DATABASE_URL 존재 여부:", !!process.env.DATABASE_URL);

  const connectionString =
    process.env.DATABASE_URL ||
    "";

  console.log("SQLite DB 파일 존재 여부:", fs.existsSync(SQLITE_PATH));

  console.log("SQLite DB 연결 중...");
  try {
    const sqliteDb = new Database(SQLITE_PATH);
    console.log("SQLite DB 연결 성공!");

    console.log("PostgreSQL 연결 중...");
    const pgPool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
      query_timeout: 10000,
    });

    try {
      console.log("PostgreSQL 연결 테스트 중...");
      const client = await pgPool.connect();
      console.log("PostgreSQL 연결 성공!");
      client.release();
    } catch (err) {
      console.error("PostgreSQL 연결 테스트 실패:", err);
      process.exit(1);
    }

    try {
      console.log("PostgreSQL 스키마 생성 시작...");

      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS subtitles (
          id SERIAL PRIMARY KEY,
          video_id TEXT NOT NULL,
          language TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          text TEXT NOT NULL
        )
      `);
      console.log("테이블 생성 완료!");

      const existingResult = await pgPool.query(
        "SELECT COUNT(*) FROM subtitles"
      );
      console.log(`기존 데이터 ${existingResult.rows[0].count}개 존재`);

      if (parseInt(existingResult.rows[0].count) > 0) {
        console.log(
          "이미 데이터가 존재합니다. 마이그레이션을 계속하려면 기존 데이터를 삭제하세요."
        );
        process.exit(0);
      }

      console.log("SQLite 데이터 카운트 중...");
      const countRow = sqliteDb
        .prepare("SELECT COUNT(*) as count FROM subtitles")
        .get() as CountResult;
      const totalRows = countRow.count;
      console.log(`총 ${totalRows}개 레코드를 마이그레이션합니다.`);

      const batchCount = Math.ceil(totalRows / BATCH_SIZE);
      console.log(`${batchCount}개 배치로 처리 예정 (배치당 ${BATCH_SIZE}개)`);

      for (let i = 0; i < batchCount; i++) {
        const offset = i * BATCH_SIZE;
        console.log(
          `배치 ${i + 1}/${batchCount} 처리 중... (${offset}~${
            offset + BATCH_SIZE - 1
          })`
        );

        const rows = sqliteDb
          .prepare(
            `SELECT video_id, language, start_time, end_time, text 
           FROM subtitles LIMIT ? OFFSET ?`
          )
          .all(BATCH_SIZE, offset) as SubtitleRow[];

        console.log(`  - ${rows.length}개 레코드 로드됨`);

        if (rows.length === 0) {
          console.log("더 이상 처리할 레코드가 없습니다.");
          break;
        }

        console.log("  - PostgreSQL에 삽입 중...");
        const client = await pgPool.connect();

        try {
          await client.query("BEGIN");

          const valueStrings = [];
          const values = [];
          let paramCount = 1;

          for (const row of rows) {
            valueStrings.push(
              `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${
                paramCount + 3
              }, $${paramCount + 4})`
            );
            values.push(
              row.video_id,
              row.language,
              row.start_time,
              row.end_time,
              row.text
            );
            paramCount += 5;
          }

          const queryText = `
            INSERT INTO subtitles (video_id, language, start_time, end_time, text) 
            VALUES ${valueStrings.join(", ")}
          `;

          await client.query(queryText, values);
          await client.query("COMMIT");
          console.log(`  - ${rows.length}개 레코드 삽입 완료!`);
        } catch (err) {
          await client.query("ROLLBACK");
          console.error("  - 삽입 중 오류 발생:", err);
          throw err;
        } finally {
          client.release();
        }

        const progress = Math.min(
          100,
          Math.round(((i + 1) * 100) / batchCount)
        );
        console.log(`진행률: ${progress}% 완료`);
      }

      console.log("인덱스 생성 중...");
      await pgPool.query(`
        ALTER TABLE subtitles ADD COLUMN IF NOT EXISTS text_vector tsvector 
        GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED
      `);

      await pgPool.query(`
        CREATE INDEX IF NOT EXISTS idx_subtitles_text_vector ON subtitles USING GIN (text_vector)
      `);

      await pgPool.query(`
        CREATE INDEX IF NOT EXISTS idx_subtitles_language ON subtitles (language)
      `);

      console.log("인덱스 생성 완료!");

      const finalStats = await pgPool.query("SELECT COUNT(*) FROM subtitles");
      console.log(
        `마이그레이션 완료! 총 ${finalStats.rows[0].count}개 레코드 처리됨`
      );
    } catch (error) {
      console.error("마이그레이션 중 오류 발생:", error);
    } finally {
      console.log("연결 종료 중...");
      await pgPool.end();
      sqliteDb.close();
      console.log("연결 종료 완료");
    }
  } catch (error) {
    console.error("초기 설정 중 오류 발생:", error);
  }
}

console.log("프로그램 시작");
main()
  .then(() => console.log("프로그램 정상 종료"))
  .catch((err) => console.error("치명적 오류:", err))
  .finally(() => console.log("프로그램 종료"));
