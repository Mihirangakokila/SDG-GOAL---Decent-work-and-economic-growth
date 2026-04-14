/**
 * Resolves the OpenAI API key for advisor + career-guidance features.
 * Supports OPENAI_API_KEY (preferred) or OPENAI_KEY as an alias.
 */
export function getOpenAIApiKey() {
  const raw = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;
  if (raw == null) return "";
  const s = String(raw).trim();
  // Strip optional surrounding quotes from .env
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

export function isOpenAIConfigured() {
  return getOpenAIApiKey().length > 0;
}
