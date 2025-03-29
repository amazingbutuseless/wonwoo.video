type Video = {
  id: string;
  url: string;
  title: string;
  imageUrl?: string;
  airedAt: string;
  isVoiceOnly?: boolean;
  tags: string[];
  published?: boolean;
  subtitles?: Subtitle[];
};
