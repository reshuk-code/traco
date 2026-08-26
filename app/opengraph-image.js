import { ImageResponse } from 'next/og';
import { OgArtwork, OG_SIZE } from '@/lib/og-template';

export const alt =
  'traco — set a daily spending goal, log what you spend, and carry what you save into tomorrow';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <OgArtwork
        eyebrow="DAILY SPENDING TRACKER"
        title="traco"
        subtitle="Set a goal for the day. Whatever you don't spend rolls into tomorrow."
        footnote={['Works offline', 'Install on any device']}
      />
    ),
    { ...size },
  );
}
