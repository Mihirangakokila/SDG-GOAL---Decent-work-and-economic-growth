/**
 * Validates http(s) URLs for course links (shared by course controller tests & runtime).
 */
export function isValidHttpUrl(url) {
  try {
    const u = new URL(String(url).trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
