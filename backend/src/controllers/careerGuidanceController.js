import Course from "../models/courseModel.js";
import { getOpenAIApiKey, isOpenAIConfigured } from "../utils/openaiConfig.js";
import { resolveOpenAIRequestError } from "../utils/openaiChatError.js";
import { postOpenAIChatCompletion } from "../utils/openaiChatClient.js";

const MAX_MESSAGES = 24;
const MAX_CONTENT = 3500;
const MAX_INTERNSHIPS = 45;

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

function sanitizeInternships(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, MAX_INTERNSHIPS)
    .map((i) => {
      if (!i || typeof i !== "object") return null;
      const title = String(i.tittle ?? i.title ?? "").trim().slice(0, 220);
      if (!title) return null;
      const skills = Array.isArray(i.requiredSkills)
        ? i.requiredSkills.slice(0, 25).map((s) => String(s).trim().slice(0, 80)).filter(Boolean)
        : [];
      return {
        title,
        requiredSkills: skills,
        requiredEducation: String(i.requiredEducation ?? "").slice(0, 120),
        description: String(i.description ?? "").slice(0, 450),
        location: String(i.location ?? "").slice(0, 120),
        duration: String(i.duration ?? "").slice(0, 80),
      };
    })
    .filter(Boolean);
}

function buildSystemPrompt(internships, catalog) {
  return `You are a career guidance assistant on InternHub (internships + skill courses).

The user shares their skills and knowledge level (e.g. beginner / intermediate / advanced in specific areas).

Data you must use:
- INTERNSHIPS_JSON: internships currently visible on the user's browse page (titles, required skills, short descriptions). Prefer these for matching. Estimate a honest match percentage (0–100) from skill overlap and level.
- COURSES_JSON: real courses on the platform. For section 3, recommend only courses whose titles appear in this list when they fit. Never invent course titles not in COURSES_JSON.

You MUST answer using exactly these three sections, in order, with these headings:

## 1. Suitable Internships (with match percentage)
- Bullet or numbered items: role/internship title, match %, one short line why.
- Draw from INTERNSHIPS_JSON when it is non-empty. If it is empty, suggest 2–4 generic internship role types (no fake company names) with indicative match %.

## 2. Skills Gap (what they need to learn)
- Clear bullet list of missing or weak skills for the roles you discussed.

## 3. Recommended Courses
- Map gaps to specific courses from COURSES_JSON (exact titles). If nothing fits, name skill areas and say they can search Skill Development when courses appear.

Be concise, encouraging, and accurate. Do not claim the user applied or was accepted anywhere.

INTERNSHIPS_JSON:
${JSON.stringify(internships)}

COURSES_JSON:
${JSON.stringify(catalog)}`;
}

export const careerGuidanceStatus = (req, res) => {
  res.json({
    chatPostPath: "/api/career-guidance/chat",
    enabled: isOpenAIConfigured(),
  });
};

export const careerGuidanceChat = async (req, res) => {
  const key = getOpenAIApiKey();
  if (!key) {
    return res.status(503).json({
      message:
        "Career guidance needs an API key. Set OPENAI_API_KEY in backend/.env (see .env.example) and restart the server.",
      code: "CAREER_GUIDANCE_DISABLED",
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

  const internships = sanitizeInternships(req.body?.internships);

  let catalog;
  try {
    const courses = await Course.find({})
      .select("title type location description")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    catalog = courses.map((c) => ({
      title: c.title,
      type: c.type,
      location: c.location || "",
      description: (c.description || "").slice(0, 260),
    }));
  } catch (dbErr) {
    console.error("[career-guidance] course catalog DB error:", dbErr?.message || dbErr);
    return res.status(500).json({
      message: "Could not load the course catalog from the database.",
      code: "CAREER_DB",
    });
  }

  const systemPrompt = buildSystemPrompt(internships, catalog);

  try {
    const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
    const baseURL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

    const httpRes = await postOpenAIChatCompletion({
      baseURL,
      apiKey: key,
      body: {
        model,
        messages: [{ role: "system", content: systemPrompt }, ...sanitized],
        temperature: 0.55,
        max_tokens: 1800,
      },
      timeoutMs: 120_000,
      logTag: "[career-guidance]",
    });

    const { status: httpStatus, data } = httpRes;
    if (httpStatus < 200 || httpStatus >= 300) {
      const { message, code } = resolveOpenAIRequestError({
        response: { status: httpStatus, data },
      });
      console.error("[career-guidance] OpenAI HTTP", httpStatus, data);
      return res.status(502).json({ message, code });
    }

    if (data?.error) {
      const { message, code } = resolveOpenAIRequestError({
        response: { status: 502, data },
      });
      return res.status(502).json({ message, code });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({
        message: "Career guidance returned an empty reply.",
        code: "OPENAI_EMPTY",
      });
    }

    res.json({ reply });
  } catch (e) {
    const { message, code } = resolveOpenAIRequestError(e);
    console.error("[career-guidance]", e.response?.data || e.message);
    res.status(502).json({ message, code });
  }
};
