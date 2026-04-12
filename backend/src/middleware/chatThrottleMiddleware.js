/**
 * Limits how often the same client can hit chat endpoints (reduces accidental OpenAI 429 bursts).
 * Env: OPENAI_CHAT_MIN_INTERVAL_MS (default 2500)
 */
const lastByKey = new Map();

function clientKey(req) {
  const raw = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  return String(raw).split(",")[0].trim();
}

export function chatCompletionMinInterval(req, res, next) {
  const windowMs = Math.min(
    60_000,
    Math.max(500, Number.parseInt(process.env.OPENAI_CHAT_MIN_INTERVAL_MS ?? "2500", 10) || 2500)
  );
  const key = clientKey(req);
  const now = Date.now();
  const prev = lastByKey.get(key) || 0;
  const delta = now - prev;

  if (delta < windowMs) {
    const waitSec = Math.max(1, Math.ceil((windowMs - delta) / 1000));
    return res.status(429).json({
      message: `Please wait ${waitSec}s between messages — this keeps the advisor within OpenAI limits.`,
      code: "CHAT_COOLDOWN",
    });
  }

  lastByKey.set(key, now);
  if (lastByKey.size > 30_000) {
    lastByKey.clear();
  }
  next();
}
