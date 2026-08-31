import { THEME_STORAGE_KEY } from '@/lib/themes';

/**
 * Applies the saved theme to <html> before the page paints.
 *
 * This runs as the first thing in the body, synchronously: the stylesheet is
 * already parsed by then, so setting the attributes here means the first paint
 * is already the right theme. Doing it in an effect instead would show the
 * default palette for a frame and then swap — the flash every themed app has to
 * solve exactly this way.
 *
 * The database is the source of truth; this copy exists only to be readable
 * without a round trip. ThemeSync keeps it current.
 */
const SCRIPT = `
try {
  var raw = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  if (raw) {
    var saved = JSON.parse(raw);
    var root = document.documentElement;
    if (saved.theme) root.setAttribute('data-theme', saved.theme);
    if (saved.mode && saved.mode !== 'system') root.setAttribute('data-mode', saved.mode);
  }
} catch (e) {
  /* A blocked or corrupt store just means the default theme. */
}
`.trim();

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
