// One muted <video> for <background-video>: theme/snippets/background-video-file.liquid — the HLS stream
// first, then the best MP4 not taller than maxHeight (or the smallest one)
import { sizedUrl } from './ThemeImage.js';
import { themeVideo } from '@/lib/theme.js';

export default async function BackgroundVideo({ video: value, maxHeight, className, posterWidth = 1600 }) {
  const video = await themeVideo(value);
  if (!video) return null;
  const mp4 = video.sources.filter((source) => source.format === 'mp4').sort((a, b) => a.height - b.height);
  const best = mp4.filter((source) => source.height <= maxHeight).at(-1) ?? mp4[0];
  const hls = video.sources.find((source) => source.format === 'm3u8');
  if (!best) return null;
  return (
    <video
      className={className}
      muted
      loop
      playsInline
      preload="none"
      poster={video.poster ? sizedUrl(video.poster, posterWidth) : undefined}
      width={best.width}
      height={best.height}
    >
      {hls && <source src={hls.url} type={hls.mimeType} />}
      <source src={best.url} type="video/mp4" />
    </video>
  );
}
