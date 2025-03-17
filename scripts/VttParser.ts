import * as fs from "fs";

type SubtitleCue = {
  startTime: string;
  endTime: string;
  text: string;
};

export const VttParser = (() => {
  const extractMetadataFromFilename = (filePath: string) => {
    const [, videoId, language] =
      filePath.match(/\/([^/]+)\/(ko|en|zh-CN|zh-TW|ja)\.vtt$/) || [];
    return { videoId, language };
  };

  const parse = (content: string) => {
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
  };

  return (filePath: string) => {
    const { videoId, language } = extractMetadataFromFilename(filePath);
    if (!videoId || !language) return null;

    const content = fs.readFileSync(filePath, "utf-8");

    return {
      videoId,
      language,
      subtitles: parse(content),
    };
  };
})();
