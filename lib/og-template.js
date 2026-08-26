/**
 * Shared artwork for the generated Open Graph images.
 *
 * Satori supports flexbox only, so every container here is an explicit flex
 * box. Heights are deliberately conservative: the canvas is a fixed 1200x630
 * and anything that overflows is silently clipped rather than scaled.
 */
export const OG_SIZE = { width: 1200, height: 630 };

const PADDING = 64;

// Max bar height is 150 so the whole column fits inside the bottom band.
const BARS = [
  { day: 'mon', h: 64, over: false },
  { day: 'tue', h: 100, over: false },
  { day: 'wed', h: 150, over: true },
  { day: 'thu', h: 86, over: false },
  { day: 'fri', h: 118, over: false },
  { day: 'sat', h: 54, over: false },
  { day: 'sun', h: 140, over: false },
];

export function OgArtwork({ eyebrow, title, subtitle, footnote }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0b0e13',
        padding: PADDING,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              width: 20,
              height: 20,
              borderRadius: 6,
              background: '#6366f1',
              marginRight: 14,
            }}
          />
          <div style={{ display: 'flex', fontSize: 26, color: '#8d97a6', letterSpacing: 5 }}>
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 8 ? 96 : 120,
            fontWeight: 700,
            color: '#e8ecf2',
            marginTop: 22,
            letterSpacing: -3,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 34,
            color: '#8d97a6',
            marginTop: 18,
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: 150,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 150 }}>
          {BARS.map((b) => (
            <div
              key={b.day}
              style={{
                display: 'flex',
                width: 52,
                height: b.h,
                borderRadius: 9,
                marginRight: 16,
                background: b.over ? '#f87171' : '#6366f1',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {footnote.map((line, i) => (
            <div
              key={line}
              style={{
                display: 'flex',
                fontSize: 25,
                color: i === footnote.length - 1 ? '#34d399' : '#8d97a6',
                marginTop: i === 0 ? 0 : 10,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
