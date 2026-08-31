import { writeFileSync, mkdirSync } from 'node:fs';

/**
 * Generates the Today-screen artboards, one per theme per mode.
 *
 * A theme here is NOT a hue swap. Each one moves the ground colour, the
 * contrast, the corner radius, whether cards are outlined at all, and whether
 * anything casts a shadow — which is why the app's token set has to grow past
 * the twelve colour variables it has today.
 *
 * Structure is lifted from the real app: app/globals.css and the anatomy in
 * app/components/{goal-meter,challenge-card,expense-list,bottom-nav}.js.
 */

const THEMES = {
  Default: {
    // What traco looks like today. Here as the baseline to beat.
    radius: 16, cardBorder: true, shadow: { light: 'none', dark: 'none' },
    light: {
      bg: '#f6f7f9', surface: '#ffffff', surface2: '#f1f3f6', border: '#e2e5ea',
      text: '#12161c', muted: '#646d7a', brand: '#4f46e5', brandText: '#ffffff',
      good: '#059669', warn: '#b45309', over: '#dc2626', track: '#e6e9ee',
    },
    dark: {
      bg: '#0b0e13', surface: '#141922', surface2: '#1b212c', border: '#262e3b',
      text: '#e8ecf2', muted: '#8d97a6', brand: '#6366f1', brandText: '#ffffff',
      good: '#34d399', warn: '#fbbf24', over: '#f87171', track: '#232b38',
    },
  },

  Ink: {
    // Editorial. Warm paper ground, ink-blue accent, tight corners, hairline
    // rules instead of floating cards. Reads like a ledger, which is the point.
    radius: 8, cardBorder: true, shadow: { light: 'none', dark: 'none' },
    light: {
      bg: '#f4efe4', surface: '#fbf7ee', surface2: '#ece5d6', border: '#d9cdb6',
      text: '#2a2118', muted: '#7a6a55', brand: '#1f3a5f', brandText: '#fbf7ee',
      good: '#3f6212', warn: '#92400e', over: '#9f1239', track: '#e3dac8',
    },
    dark: {
      bg: '#16120c', surface: '#1e1913', surface2: '#26201a', border: '#3a3126',
      text: '#f0e7d8', muted: '#a2917a', brand: '#9ab8dd', brandText: '#16120c',
      good: '#a3d14b', warn: '#f0b429', over: '#f2777a', track: '#2e2820',
    },
  },

  Void: {
    // Maximum quiet. No outlines at all — depth comes from the surface step and,
    // in light, one soft shadow. Dark is true #000 for OLED.
    radius: 20, cardBorder: false,
    shadow: { light: '0 1px 3px rgba(15, 15, 20, 0.07)', dark: 'none' },
    light: {
      bg: '#ffffff', surface: '#f7f7f8', surface2: '#efeff1', border: 'transparent',
      text: '#000000', muted: '#6e6e73', brand: '#6d28d9', brandText: '#ffffff',
      good: '#047857', warn: '#b45309', over: '#dc2626', track: '#e6e6e9',
    },
    dark: {
      bg: '#000000', surface: '#0c0c10', surface2: '#16161c', border: 'transparent',
      text: '#ffffff', muted: '#8a8a96', brand: '#a78bfa', brandText: '#14001f',
      good: '#3ddc84', warn: '#ffd166', over: '#ff5d5d', track: '#1c1c24',
    },
  },

  Neon: {
    // Loud and sharp. 4px corners, saturated cyan, the highest contrast of the
    // set. Status colours go up in chroma to keep pace with the brand.
    radius: 4, cardBorder: true, shadow: { light: 'none', dark: 'none' },
    light: {
      bg: '#f2f4f5', surface: '#ffffff', surface2: '#e8ecee', border: '#cbd5d8',
      text: '#06131a', muted: '#5a6b73', brand: '#0891b2', brandText: '#ffffff',
      good: '#047857', warn: '#a16207', over: '#be123c', track: '#dbe3e6',
    },
    dark: {
      bg: '#08080c', surface: '#101018', surface2: '#16161f', border: '#2b2b3a',
      text: '#f0f0ff', muted: '#7d7d96', brand: '#22d3ee', brandText: '#04141a',
      good: '#22e06a', warn: '#ffcc00', over: '#ff2e63', track: '#1c1c28',
    },
  },

  Bloom: {
    // Soft. Big 24px radii, no outlines, tinted surfaces, the lowest contrast
    // here — deliberately the gentlest way to be told you overspent.
    radius: 24, cardBorder: false,
    shadow: { light: '0 2px 14px rgba(88, 68, 160, 0.09)', dark: 'none' },
    light: {
      bg: '#f3f0f9', surface: '#ffffff', surface2: '#eeeaf7', border: 'transparent',
      text: '#2e2a3d', muted: '#7a7490', brand: '#7c5cff', brandText: '#ffffff',
      good: '#2f9e6e', warn: '#c4881f', over: '#e0576b', track: '#e6e0f4',
    },
    dark: {
      bg: '#171426', surface: '#211d33', surface2: '#2a2540', border: 'transparent',
      text: '#ece9f7', muted: '#9c95b8', brand: '#b39dff', brandText: '#1a1030',
      good: '#5fd9a3', warn: '#ffd166', over: '#ff8fa3', track: '#322c4a',
    },
  },
};

const FONT = "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif";

const navIcon = (kind, c, active) => {
  const sw = active ? 2.2 : 1.8;
  const inner = {
    today: '<path d="M6 19v-5M12 19V8M18 19v-8" />',
    challenge: '<circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.2" />',
    history: '<path d="M5 7h14M5 12h14M5 17h9" />',
    settings:
      '<path d="M4 8h10M18 8h2M4 16h4M12 16h8" /><circle cx="16" cy="8" r="2.2" /><circle cx="10" cy="16" r="2.2" />',
  }[kind];
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round">${inner}</svg>`;
};

function tab(kind, label, p, active) {
  const c = active ? p.brand : p.muted;
  return `      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px 0; flex: 1 1 0;">
        ${navIcon(kind, c, active)}
        <span style="font-size: 11px; font-weight: ${active ? 600 : 500}; color: ${c};">${label}</span>
      </div>`;
}

function today(p, s) {
  // Card chrome is per-theme, not a constant — that is the whole difference.
  const card = `background: ${p.surface}; border: ${s.cardBorder ? `1px solid ${p.border}` : 'none'}; border-radius: ${s.radius}px; box-shadow: ${s.shadow}; padding: 18px;`;
  const inner = `border-radius: ${Math.max(6, s.radius - 5)}px;`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap">
  <style>
    body { margin: 0; font-family: ${FONT}; }
    a { color: ${p.brand}; } a:hover { color: ${p.brand}; }
    .num { font-variant-numeric: tabular-nums; }
  </style>
</helmet>

<div style="width: 390px; height: 844px; background: ${p.bg}; color: ${p.text}; display: flex; flex-direction: column; overflow: hidden;">

  <div style="border-bottom: 1px solid ${s.cardBorder ? p.border : 'transparent'}; display: flex; align-items: center; gap: 12px; padding: 16px 20px;">
    <div style="flex: 1 1 0; min-width: 0;">
      <div style="font-size: 19px; font-weight: 700; letter-spacing: -0.02em;">Today</div>
      <div style="margin-top: 2px; font-size: 12px; color: ${p.muted};">Monday, 31 August</div>
    </div>
    <div style="width: 34px; height: 34px; border-radius: 999px; background: ${p.surface2}; color: ${p.muted}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;">R</div>
  </div>

  <div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 14px; padding: 16px 20px; overflow: hidden;">

    <div style="${card}">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;">
        <div>
          <div style="font-size: 12px; color: ${p.muted};">Spent today</div>
          <div class="num" style="margin-top: 4px; font-size: 36px; font-weight: 700; line-height: 1; letter-spacing: -0.03em;">NPR&nbsp;275</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: ${p.muted};">Available</div>
          <div class="num" style="margin-top: 4px; font-size: 18px; font-weight: 700;">NPR&nbsp;200</div>
        </div>
      </div>

      <div style="margin-top: 14px; height: 8px; width: 100%; border-radius: 999px; background: ${p.track}; overflow: hidden;">
        <div style="height: 100%; width: 100%; border-radius: 999px; background: ${p.over};"></div>
      </div>

      <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <span style="font-size: 13px; font-weight: 500; color: ${p.over};">Over today</span>
        <span class="num" style="font-size: 13px; color: ${p.muted};">NPR 75 over</span>
      </div>

      <div style="margin-top: 14px; ${inner} padding: 12px 14px; font-size: 13px; line-height: 1.5; background: color-mix(in srgb, ${p.over} 12%, transparent); color: ${p.over};">
        You spent <strong>NPR 75</strong> more than today&rsquo;s budget. No debt carries over &mdash; tomorrow starts fresh at NPR 200.
      </div>
    </div>

    <div style="${card}">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
        <div style="min-width: 0;">
          <div style="font-size: 12px; color: ${p.muted};">Your challenge</div>
          <div style="margin-top: 4px; font-size: 17px; font-weight: 700; letter-spacing: -0.02em;">Spend nothing</div>
        </div>
        <span style="flex: 0 0 auto; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 600; background: color-mix(in srgb, ${p.warn} 15%, transparent); color: ${p.warn};">Over today</span>
      </div>

      <div style="margin-top: 14px; display: flex; align-items: baseline; justify-content: space-between; font-size: 13px; color: ${p.muted};">
        <span>Day 1 of 13</span>
        <span class="num">12 days left</span>
      </div>
      <div style="margin-top: 8px; height: 8px; width: 100%; border-radius: 999px; background: ${p.track}; overflow: hidden;">
        <div style="height: 100%; width: 8%; border-radius: 999px; background: ${p.warn};"></div>
      </div>

      <div style="margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; ${inner} background: ${p.surface2}; padding: 12px 14px;">
        <span class="num" style="font-size: 13px; color: ${p.muted};">Today NPR 275 of NPR 0</span>
        <span class="num" style="font-size: 13px; font-weight: 600; color: ${p.over};">NPR 275 over</span>
      </div>

      <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
        <span style="color: ${p.muted};">1 of 2 slip days used</span>
        <span class="num" style="font-weight: 600; color: ${p.good};">1 left</span>
      </div>
    </div>

    <div style="${card}">
      <div style="display: flex; align-items: baseline; justify-content: space-between;">
        <div style="font-size: 13px; font-weight: 600;">Today&rsquo;s entries</div>
        <span style="font-size: 12px; color: ${p.muted};">3</span>
      </div>
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${p.border === 'transparent' ? p.surface2 : p.border};">
          <div style="flex: 1 1 0; min-width: 0;">
            <div style="font-weight: 500;">food<span style="font-weight: 400; color: ${p.muted};"> &middot; nasta</span></div>
            <div style="margin-top: 2px; font-size: 12px; color: ${p.muted};">4:12 PM</div>
          </div>
          <span class="num" style="font-weight: 600;">NPR 145</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0;">
          <div style="flex: 1 1 0; min-width: 0;">
            <div style="font-weight: 500;">transport<span style="font-weight: 400; color: ${p.muted};"> &middot; indrive</span></div>
            <div style="margin-top: 2px; font-size: 12px; color: ${p.muted};">1:38 PM</div>
          </div>
          <span class="num" style="font-weight: 600;">NPR 130</span>
        </div>
      </div>
    </div>

  </div>

  <div style="border-top: 1px solid ${s.cardBorder ? p.border : 'transparent'}; background: ${p.surface}; padding: 8px 0 10px;">
    <div style="display: flex; max-width: 448px; margin: 0 auto;">
${tab('today', 'Today', p, true)}
${tab('challenge', 'Challenge', p, false)}
${tab('history', 'History', p, false)}
${tab('settings', 'Settings', p, false)}
    </div>
  </div>

</div>
</x-dc>
</body>
</html>
`;
}

mkdirSync('.design', { recursive: true });

const written = [];
for (const [key, theme] of Object.entries(THEMES)) {
  for (const mode of ['Light', 'Dark']) {
    const lower = mode.toLowerCase();
    const structure = {
      radius: theme.radius,
      cardBorder: theme.cardBorder,
      shadow: theme.shadow[lower],
    };
    const name = `Today${key}${mode}.dc.html`;
    writeFileSync(`.design/${name}`, today(theme[lower], structure));
    written.push(name);
  }
}
console.log('wrote ' + written.length + ' Today artboards');
for (const w of written) console.log('  ' + w);
