import axios from "axios";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Milliseconds to wait after a 429. Uses Retry-After header when present, else exponential backoff + jitter.
 */
function backoffMsFor429(headers, attempt) {
  const h = headers || {};
  const ra = parseFloat(String(h["retry-after"] || h["Retry-After"] || ""));
  if (!Number.isNaN(ra) && ra > 0) {
    return Math.min(90_000, Math.max(800, Math.ceil(ra * 1000)));
  }
  const exp = Math.min(20_000, 1500 * 2 ** attempt);
  return exp + Math.floor(Math.random() * 400);
}

/**
 * POST /v1/chat/completions with automatic retries on HTTP 429 (rate limit / TPM).
 * Env: OPENAI_429_MAX_RETRIES (default 5) = number of *retries* after the first 429.
 */
export async function postOpenAIChatCompletion({
  baseURL,
  apiKey,
  body,
  timeoutMs = 120_000,
  logTag = "[openai]",
}) {
  const url = `${String(baseURL).replace(/\/$/, "")}/chat/completions`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const max429Retries = Math.min(
    12,
    Math.max(0, Number.parseInt(process.env.OPENAI_429_MAX_RETRIES ?? "5", 10) || 5)
  );

  let lastHttp = null;
  for (let attempt429 = 0; ; attempt429++) {
    const httpRes = await axios.post(url, body, {
      headers,
      timeout: timeoutMs,
      validateStatus: () => true,
    });
    lastHttp = httpRes;

    if (httpRes.status !== 429) {
      return httpRes;
    }

    if (attempt429 >= max429Retries) {
      console.warn(
        `${logTag} still rate-limited (429) after ${max429Retries + 1} attempts — returning last response`
      );
      return lastHttp;
    }

    const waitMs = backoffMsFor429(httpRes.headers, attempt429);
    console.warn(
      `${logTag} 429 from OpenAI — waiting ${waitMs}ms then retry ${attempt429 + 2}/${max429Retries + 1}`
    );
    await sleep(waitMs);
  }
}
