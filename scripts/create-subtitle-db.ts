/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { glob } = require("glob");
const Database = require("better-sqlite3");

const SUBTITLES_DIR = path.join(__dirname, "../data/subtitles");
const DB_PATH = path.join(__dirname, "../lib/video/subtitles.db");

type SubtitleCue = {
  startTime: string;
  endTime: string;
  text: string;
};

function initializeDatabase() {
  console.log("데이터베이스 초기화 중...");

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE subtitles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      language TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      text TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE INDEX idx_subtitles_language ON subtitles(language);
  `);

  db.exec(`
    CREATE VIRTUAL TABLE subtitle_search USING fts5(
      text,
      content='subtitles',
      content_rowid='id'
    )
  `);

  return db;
}

function parseVttFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const cues: SubtitleCue[] = [];

  let currentCue: Partial<SubtitleCue> = {};
  let collectingText = false;
  let text = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "WEBVTT" || line === "" || /^[0-9]+$/.test(line)) continue;

    if (line.includes("-->")) {
      if (currentCue.startTime) {
        cues.push({
          startTime: currentCue.startTime,
          endTime: currentCue.endTime as string,
          text: text.trim(),
        });
        text = "";
      }

      const [startTime, endTime] = line
        .split("-->")
        .map((t: string) => t.trim());
      currentCue = {
        startTime,
        endTime,
      };
      collectingText = true;
    } else if (collectingText && line) {
      text += (text ? " " : "") + line;
    }
  }

  if (currentCue.startTime && text) {
    cues.push({
      startTime: currentCue.startTime,
      endTime: currentCue.endTime as string,
      text: text.trim(),
    });
  }

  return cues;
}

function extractMetadataFromFilename(filename: string) {
  const [videoId, rest] = filename.split("/");
  const language = path.basename(rest, ".vtt");

  return { videoId, language };
}

async function main() {
  try {
    const db = initializeDatabase();

    const insertSubtitleStmt = db.prepare(
      "INSERT INTO subtitles (video_id, language, start_time, end_time, text) VALUES (?, ?, ?, ?, ?)"
    );

    const vttFiles = await glob("**/*.vtt", { cwd: SUBTITLES_DIR });
    console.log(`${vttFiles.length}개의 VTT 파일을 발견했습니다.`);

    const transaction = db.transaction(() => {
      for (const relFilePath of vttFiles) {
        const fullPath = path.join(SUBTITLES_DIR, relFilePath);
        const { videoId, language } = extractMetadataFromFilename(relFilePath);

        console.log(
          `처리 중: ${relFilePath} (Video ID: ${videoId}, Language: ${language})`
        );

        const cues = parseVttFile(fullPath);
        for (const cue of cues) {
          insertSubtitleStmt.run(
            videoId,
            language,
            cue.startTime,
            cue.endTime,
            cue.text
          );
        }

        console.log(`- ${cues.length}개의 자막 항목이 추가되었습니다.`);
      }
    });

    transaction();

    console.log("전문 검색 인덱스 구축 중...");
    db.exec("INSERT INTO subtitle_search SELECT text FROM subtitles");

    const stats = {
      subtitles: db.prepare("SELECT COUNT(*) as count FROM subtitles").get(),
    };

    console.log("작업 완료!");
    console.log(`총 ${stats.subtitles.count}개 자막 항목이 처리되었습니다.`);
    console.log(`데이터베이스 저장 위치: ${DB_PATH}`);

    console.log("데이터베이스 최적화 중...");
    db.exec("VACUUM;");

    db.close();
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

main();
