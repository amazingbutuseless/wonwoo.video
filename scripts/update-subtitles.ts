import dotenv from "dotenv";

import { SubtitleUploader } from "./SubtitleUploader";

dotenv.config({ path: "../.env.local" });

SubtitleUploader.upload().then(() => {});
