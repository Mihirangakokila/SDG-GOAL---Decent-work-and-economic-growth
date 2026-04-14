import Course from "../models/courseModel.js";
import { getOpenAIApiKey } from "../utils/openaiConfig.js";
import { resolveOpenAIRequestError } from "../utils/openaiChatError.js";
import { postOpenAIChatCompletion } from "../utils/openaiChatClient.js";

const MAX_MESSAGES = 24;
const MAX_CONTENT = 3500;

const buildSystemPrompt = (catalog) => `InternHub course advisor. User shares skills/education/goals.
Rules: Recommend only courses from CATALOG (exact titles). Short, friendly explanations. Ask follow-ups if vague. Note skill gaps for internships. No invented titles. Empty catalog → suggest broad paths.

CATALOG (JSON):
${JSON.stringify(catalog)}`;

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = m.role;
    if (role !== "user" && role !== "assistant") continue;
    let content = m.content;
    if (typeof content !== "string") content = String(content ?? "");
    content = content.trim().slice(0, MAX_CONTENT);
    if (!content) continue;
    out.push({ role, content });
    if (out.length >= MAX_MESSAGES) break;
  }
  return out.length ? out : null;
}

export const advisorChat = async (req, res) => {
  const key = getOpenAIApiKey();
  if (!key) {
    return res.status(503).json({
      message:
        "Course advisor needs an API key. Set OPENAI_API_KEY in backend/.env (see .env.example) and restart the server.",
      code: "ADVISOR_DISABLED",
    });
  }

  const sanitized = sanitizeMessages(req.body?.messages);
  if (!sanitized) {
    return res.status(400).json({
      message: "Send a non-empty messages array with user/assistant roles.",
    });
  }

  const lastUser = [...sanitized].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return res.status(400).json({ message: "Include at least one user message." });
  }

  let catalog;
  try {
    const courses = await Course.find({})
      .select("title type location description")
      .sort({ createdAt: -1 })
      .limit(45)
      .lean();

    catalog = courses.map((c) => ({
      title: c.title,
      type: c.type,
      location: c.location || "",
      description: (c.description || "").slice(0, 220),
    }));
  } catch (dbErr) {
    console.error("[advisor] course catalog DB error:", dbErr?.message || dbErr);
    return res.status(500).json({
      message: "Could not load the course catalog from the database.",
      code: "ADVISOR_DB",
    });
  }

  const systemPrompt = buildSystemPrompt(catalog);
  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
  const baseURL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );

  try {
    const httpRes = await postOpenAIChatCompletion({
      baseURL,
      apiKey: key,
      body: {
        model,
        messages: [{ role: "system", content: systemPrompt }, ...sanitized],
        temperature: 0.65,
        max_tokens: 1400,
      },
      timeoutMs: 120_000,
      logTag: "[advisor]",
    });

    const { status: httpStatus, data } = httpRes;
    if (httpStatus < 200 || httpStatus >= 300) {
      const { message, code } = resolveOpenAIRequestError({
        response: { status: httpStatus, data },
      });
      console.error("[advisor] OpenAI HTTP", httpStatus, data);
      return res.status(502).json({ message, code });
    }

    if (data?.error) {
      const { message, code } = resolveOpenAIRequestError({
        response: { status: 502, data },
      });
      console.error("[advisor] OpenAI error in body:", data.error);
      return res.status(502).json({ message, code });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    const finish = data?.choices?.[0]?.finish_reason;
    if (!reply) {
      console.error("[advisor] empty reply, finish_reason:", finish, "raw:", JSON.stringify(data).slice(0, 500));
      return res.status(502).json({
        message:
          finish === "length"
            ? "The reply was cut off. Try a shorter question or ask again."
            : "The model returned an empty reply. Try again or check OPENAI_MODEL in backend/.env.",
        code: "OPENAI_EMPTY",
      });
    }

    res.json({ reply });
  } catch (e) {
    const { message, code } = resolveOpenAIRequestError(e);
    console.error("[advisor]", e.response?.data || e.message);
    res.status(502).json({ message, code });
  }
};
