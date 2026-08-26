import { ImageResponse } from 'next/og';
import { OgArtwork, OG_SIZE } from '@/lib/og-template';

export const alt = 'Install traco on your phone — no app store needed';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <OgArtwork
        eyebrow="INSTALL IN TWO TAPS"
        title="Get traco"
        subtitle="A daily spending tracker for your home screen. No app store, works offline."
        footnote={['iPhone · Android · Desktop', 'Free to install']}
      />
    ),
    { ...size },
  );
}
