import Groq from 'groq-sdk';

// Lazy initialization — Groq client is created on first use,
// after dotenv.config() has run in server.js
let groq = null;
let groqInitialized = false;

const getGroq = () => {
  if (!groqInitialized) {
    groqInitialized = true;
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '') {
      groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      console.log('Groq client initialized successfully');
    } else {
      console.log('GROQ_API_KEY not found, using rule-based scoring only');
    }
  }
  return groq;
};

// ─── MAIN ENTRY POINT ───────────────────────────────────────────────────────

export const calculateEligibilityScore = async (youthProfile, internshipRequirements, cvText = '') => {
  // No CV text extracted → candidate is ineligible
  if (!cvText || cvText.trim().length === 0) {
    return {
      total: 0,
      breakdown: { skillMatch: 0, educationMatch: 0, locationMatch: 0, priorityBoost: 0 },
      aiReasoning: 'No CV text could be extracted — score set to 0',
    };
  }

  try {
    // Try AI scoring first (smartest)
    return await calculateAIScore(youthProfile, internshipRequirements, cvText);
  } catch (error) {
    console.error('AI scoring failed, falling back to CV-text keyword matching:', error.message);
    try {
      // Fallback: keyword matching on the actual CV text
      return calculateCVTextScore(cvText, internshipRequirements);
    } catch (err2) {
      console.error('CV text scoring also failed, using profile-based fallback:', err2.message);
      // Last resort: profile-only scoring
      return calculateRuleBasedScore(youthProfile, internshipRequirements);
    }
  }
};

// ─── AI SCORING (Groq) ────────────────────────────────────────────────────────
// Weights: skillMatch 0–40, educationMatch 0–20, locationMatch 0–10, priorityBoost 0–30

const calculateAIScore = async (youthProfile, internshipRequirements, cvText) => {
  const groqClient = getGroq();
  if (!groqClient) {
    console.log('Groq unavailable, falling back to CV-text keyword matching');
    return calculateCVTextScore(cvText, internshipRequirements);
  }

  const prompt = `
You are an expert HR recruiter analyzing a candidate's CV for a TECHNICAL internship position.

IMPORTANT RULES:
- This is a technical role requiring programming/development skills.
- Soft skills alone (communication, teamwork, problem solving) are NOT sufficient.
- If the candidate has NO relevant technical skills, set skillMatch to 0.

CV TEXT (first 2000 chars):
${cvText.substring(0, 2000)}

INTERNSHIP REQUIREMENTS:
${JSON.stringify(internshipRequirements, null, 2)}

CANDIDATE PROFILE:
${JSON.stringify(youthProfile, null, 2)}

Score each category using these EXACT weight ranges and return ONLY a valid JSON object — no preamble, no markdown fences:

{
  "skillMatch": <0–40, based on technical skill overlap with requirements (40% weight)>,
  "educationMatch": <0–20, based on education level and field match (20% weight)>,
  "locationMatch": <0–10, based on candidate location vs internship location (10% weight)>,
  "priorityBoost": <0–30, based on priority keywords like internship/junior, rural background, income criteria (30% weight)>,
  "reasoning": "<one sentence explanation>"
}
`.trim();

  const completion = await groqClient.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 400,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Groq');

  let scores;
  try {
    // Strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
    scores = JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse Groq response:', raw);
    throw new Error('Invalid JSON from Groq');
  }

  // Clamp to new weight ranges
  const skillMatch = Math.max(0, Math.min(40, scores.skillMatch ?? 0));
  const educationMatch = Math.max(0, Math.min(20, scores.educationMatch ?? 0));
  const locationMatch = Math.max(0, Math.min(10, scores.locationMatch ?? 0));
  const priorityBoost = Math.max(0, Math.min(30, scores.priorityBoost ?? 0));

  // No meaningful technical skill match → immediately ineligible
  if (skillMatch < 5) {
    return {
      total: 0,
      breakdown: { skillMatch: 0, educationMatch: 0, locationMatch: 0, priorityBoost: 0 },
      aiReasoning: scores.reasoning ?? 'No relevant technical skills found — ineligible',
    };
  }

  return {
    total: Math.min(skillMatch + educationMatch + locationMatch + priorityBoost, 100),
    breakdown: { skillMatch, educationMatch, locationMatch, priorityBoost },
    aiReasoning: scores.reasoning ?? 'AI analysis complete',
  };
};

// ─── CV-TEXT KEYWORD MATCHING ────────────────────────────────────────────────
// "Does this text contain these words?" — simple but reads the actual CV
// Weights: skillMatch 0–40, educationMatch 0–20, locationMatch 0–10, priorityBoost 0–30

const calculateCVTextScore = (cvText, internshipRequirements) => {
  const textLower = cvText.toLowerCase();

  // ── 1. Skill match (0–40) ─────────────────────────────────────────────────
  let skillMatch = 0;
  const requiredSkills = (internshipRequirements.skills ?? []).map(s => s.toLowerCase());

  if (requiredSkills.length === 0) {
    skillMatch = 40; // no skills required → full marks
  } else {
    const matchedSkills = requiredSkills.filter(skill => {
      // Check for the skill or common aliases
      const aliases = SKILL_ALIASES[skill] || [skill];
      return aliases.some(alias => textLower.includes(alias));
    });

    const hasTechMatch = matchedSkills.some(s =>
      TECHNICAL_SKILLS.has(s) || [...TECHNICAL_SKILLS].some(t => s.includes(t) || t.includes(s))
    );

    if (matchedSkills.length === 0 || !hasTechMatch) {
      // No technical skills → completely ineligible
      return {
        total: 0,
        breakdown: { skillMatch: 0, educationMatch: 0, locationMatch: 0, priorityBoost: 0 },
        aiReasoning: 'No relevant technical skills found in CV text',
      };
    }

    skillMatch = Math.round((matchedSkills.length / requiredSkills.length) * 40);
  }

  // ── 2. Education match (0–20) ─────────────────────────────────────────────
  let educationMatch = 0;
  const EDUCATION_KEYWORDS = [
    'phd', 'doctorate', 'master', 'bachelor', 'diploma', 'associate', 'degree',
    'bsc', 'msc', 'b.sc', 'm.sc', 'b.tech', 'm.tech', 'bca', 'mca',
    'computer science', 'software engineering', 'information technology',
    'data science', 'electronics', 'engineering',
  ];

  const reqEduLevel = internshipRequirements.education?.level?.toLowerCase() || '';
  const reqEduField = internshipRequirements.education?.field?.toLowerCase() || '';

  if (!reqEduLevel && !reqEduField) {
    educationMatch = 20; // no education required
  } else {
    // Check if any education keywords appear in CV text
    const foundEdu = EDUCATION_KEYWORDS.filter(kw => textLower.includes(kw));

    if (foundEdu.length > 0) {
      educationMatch += 10; // base points for having education mentions

      // Bonus if the required level is mentioned
      if (reqEduLevel && textLower.includes(reqEduLevel)) {
        educationMatch += 5;
      }
      // Bonus if the required field is mentioned
      if (reqEduField && textLower.includes(reqEduField)) {
        educationMatch += 5;
      }
    }
  }

  educationMatch = Math.min(educationMatch, 20);

  // ── 3. Location match (0–10) ──────────────────────────────────────────────
  let locationMatch = 0;
  const reqLocation = internshipRequirements.location;

  if (!reqLocation) {
    locationMatch = 10; // no location required
  } else {
    if (reqLocation.district && textLower.includes(reqLocation.district.toLowerCase())) {
      locationMatch += 5;
    }
    if (reqLocation.state && textLower.includes(reqLocation.state.toLowerCase())) {
      locationMatch += 5;
    }
    // Base points if location section exists
    if (locationMatch === 0) {
      const locationTerms = ['address', 'location', 'city', 'district', 'state', 'country'];
      if (locationTerms.some(term => textLower.includes(term))) {
        locationMatch = 2;
      }
    }
  }

  // ── 4. Priority boost (0–30) ──────────────────────────────────────────────
  let priorityBoost = 0;
  const PRIORITY_KEYWORDS = [
    'internship', 'intern', 'junior developer', 'junior', 'entry level',
    'entry-level', 'fresher', 'fresh graduate', 'trainee', 'apprentice',
    'rural', 'village', 'scholarship', 'first generation',
  ];

  const matchedPriority = PRIORITY_KEYWORDS.filter(kw => textLower.includes(kw));
  priorityBoost = Math.min(Math.round((matchedPriority.length / 4) * 30), 30);

  return {
    total: Math.min(Math.round(skillMatch + educationMatch + locationMatch + priorityBoost), 100),
    breakdown: {
      skillMatch: Math.round(skillMatch),
      educationMatch: Math.round(educationMatch),
      locationMatch: Math.round(locationMatch),
      priorityBoost: Math.round(priorityBoost),
    },
    aiReasoning: `CV text keyword matching — found ${matchedPriority.length} priority keywords`,
  };
};

// ─── RULE-BASED SCORING (last resort — profile only) ────────────────────────
// Weights: skillMatch 0–40, educationMatch 0–20, locationMatch 0–10, priorityBoost 0–30

const calculateRuleBasedScore = (youthProfile, internshipRequirements) => {
  // ── 1. Skill match (0–40) ─────────────────────────────────────────────────
  let skillMatch = 0;

  if (!internshipRequirements.skills?.length) {
    skillMatch = 40;
  } else {
    const required = internshipRequirements.skills.map(s => s.toLowerCase());
    const candidate = (youthProfile.skills ?? []).map(s => s.toLowerCase());

    const matched = required.filter(req =>
      candidate.some(c => c.includes(req) || req.includes(c) || similarity(req, c) > 0.7)
    );

    const hasTechMatch = matched.some(s =>
      TECHNICAL_SKILLS.has(s) || [...TECHNICAL_SKILLS].some(t => s.includes(t) || t.includes(s))
    );

    if (!matched.length || !hasTechMatch) {
      return {
        total: 0,
        breakdown: { skillMatch: 0, educationMatch: 0, locationMatch: 0, priorityBoost: 0 },
        aiReasoning: 'No relevant technical skills in profile',
      };
    }

    skillMatch = Math.round((matched.length / required.length) * 40);
  }

  // ── 2. Education match (0–20) ─────────────────────────────────────────────
  let educationMatch = 0;
  const LEVELS = ['high school', 'diploma', 'associate', 'bachelor', 'master', 'phd', 'doctorate'];

  if (!internshipRequirements.education?.level) {
    educationMatch = 20;
  } else {
    const reqLevel = internshipRequirements.education.level.toLowerCase();
    const candidateLevel = (youthProfile.education?.level ?? '').toLowerCase();
    const rIdx = LEVELS.findIndex(l => reqLevel.includes(l));
    const cIdx = LEVELS.findIndex(l => candidateLevel.includes(l));

    if (rIdx >= 0 && cIdx >= 0) {
      const diff = cIdx - rIdx;
      if (diff >= 0) educationMatch = 20;
      else if (diff === -1) educationMatch = 13;
      else if (diff === -2) educationMatch = 7;
    } else {
      educationMatch = candidateLevel ? 10 : 0;
    }
  }

  // ── 3. Location match (0–10) ──────────────────────────────────────────────
  let locationMatch = 0;

  if (!internshipRequirements.location) {
    locationMatch = 10;
  } else {
    const reqLoc = internshipRequirements.location;
    const canLoc = youthProfile.location ?? {};

    if (reqLoc.district && canLoc.district?.toLowerCase() === reqLoc.district.toLowerCase()) {
      locationMatch += 5;
    }
    if (reqLoc.state && canLoc.state?.toLowerCase() === reqLoc.state.toLowerCase()) {
      locationMatch += 5;
    }
    if (locationMatch === 0) locationMatch = 2; // base points
  }

  // ── 4. Priority boost (0–30) ──────────────────────────────────────────────
  let priorityBoost = 0;
  if (youthProfile.location?.isRural) priorityBoost += 15;
  if (youthProfile.incomeCriteria?.meetsCriteria) priorityBoost += 15;

  return {
    total: Math.min(Math.round(skillMatch + educationMatch + locationMatch + priorityBoost), 100),
    breakdown: {
      skillMatch: Math.round(skillMatch),
      educationMatch: Math.round(educationMatch),
      locationMatch: Math.round(locationMatch),
      priorityBoost: Math.round(priorityBoost),
    },
    aiReasoning: 'Rule-based scoring (profile data only)',
  };
};

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────

const TECHNICAL_SKILLS = new Set([
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php',
  'ruby', 'go', 'rust', 'html', 'css', 'react', 'angular', 'vue',
  'node.js', 'express', 'django', 'flask', 'mysql', 'postgresql',
  'mongodb', 'redis', 'sqlite', 'git', 'docker', 'kubernetes',
  'aws', 'azure', 'linux', 'next.js', 'spring boot', 'rest apis',
]);

// Common aliases so "JS" matches "javascript", etc.
const SKILL_ALIASES = {
  'javascript': ['javascript', 'js', 'ecmascript'],
  'typescript': ['typescript', 'ts'],
  'node.js':    ['node.js', 'nodejs', 'node'],
  'react':      ['react', 'reactjs', 'react.js'],
  'angular':    ['angular', 'angularjs', 'angular.js'],
  'vue':        ['vue', 'vuejs', 'vue.js'],
  'mongodb':    ['mongodb', 'mongo'],
  'postgresql': ['postgresql', 'postgres'],
  'c++':        ['c++', 'cpp'],
  'c#':         ['c#', 'csharp', 'c sharp'],
  'next.js':    ['next.js', 'nextjs', 'next'],
  'express':    ['express', 'expressjs', 'express.js'],
  'mysql':      ['mysql', 'my sql'],
  'rest apis':  ['rest apis', 'rest api', 'restful', 'rest'],
  'spring boot':['spring boot', 'springboot', 'spring'],
  'html':       ['html', 'html5'],
  'css':        ['css', 'css3'],
};

const similarity = (a, b) => {
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;
  if (!longer.length) return 1;
  return (longer.length - levenshtein(longer, shorter)) / longer.length;
};

const levenshtein = (s1, s2) => {
  const m = s2.length, n = s1.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = s2[i - 1] === s1[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[m][n];
};