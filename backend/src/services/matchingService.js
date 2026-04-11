import Groq from 'groq-sdk';

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

export const calculateEligibilityScore = async (youthProfile, internshipRequirements, cvText = '') => {
  if (!cvText || cvText.trim().length === 0) {
    return {
      total: 0,
      breakdown: { skillMatch: 0, educationMatch: 0, locationMatch: 0, priorityBoost: 0 },
      aiReasoning: 'No CV text could be extracted — score set to 0',
    };
  }

  let result;
  try {
    result = await calculateAIScore(youthProfile, internshipRequirements, cvText);
  } catch (error) {
    console.error('AI scoring failed, falling back to CV-text keyword matching:', error.message);
    try {
      result = calculateCVTextScore(cvText, internshipRequirements);
    } catch (err2) {
      console.error('CV text scoring also failed, using profile-based fallback:', err2.message);
      result = calculateRuleBasedScore(youthProfile, internshipRequirements);
    }
  }

  let randomPriorityBoost = 0;
  if (
    result.breakdown.skillMatch === 0 &&
    result.breakdown.educationMatch === 0 &&
    result.breakdown.locationMatch === 0
  ) {
    randomPriorityBoost = 0;
  } else {
    randomPriorityBoost = Math.floor(Math.random() * 6) + 5;
  }

  result.breakdown.priorityBoost = randomPriorityBoost;

  result.total = Math.min(
    result.breakdown.skillMatch +
    result.breakdown.educationMatch +
    result.breakdown.locationMatch +
    randomPriorityBoost,
    100
  );

  return result;
};

const calculateAIScore = async (youthProfile, internshipRequirements, cvText) => {
  const groqClient = getGroq();
  if (!groqClient) {
    console.log('Groq unavailable, falling back to CV-text keyword matching');
    return calculateCVTextScore(cvText, internshipRequirements);
  }

  const requiredSkills = internshipRequirements.skills ?? [];
  const requiredEducation = internshipRequirements.education?.level ?? 'Not specified';
  const requiredLocation = internshipRequirements.location?.district ?? 'Not specified';

  const prompt = `
You are an expert HR recruiter. Analyze the candidate CV below for this internship and return ONLY a valid JSON object with no extra text.

CV TEXT (first 2000 chars):
${cvText.substring(0, 2000)}

INTERNSHIP REQUIREMENTS:
- Required Skills: ${requiredSkills.length > 0 ? requiredSkills.join(', ') : 'Any'}
- Required Education Level: ${requiredEducation}
- Location: ${requiredLocation}

Score each category and return ONLY this JSON (no markdown, no explanation outside JSON):

{
  "skillMatch": <integer 0-40, how well CV skills match the required skills>,
  "educationMatch": <integer 0-20, whether CV shows the required education level>,
  "locationMatch": <integer 0-10, whether CV mentions the required location or nearby area>,
  "reasoning": "<one concise sentence explaining the overall match>"
}

Rules:
- skillMatch must be 0 if the CV has NO relevant skills at all
- educationMatch is 0 if education level is completely absent from CV
- locationMatch is 5 if location is nearby/flexible, 10 if exact match, 0 if no match
`.trim();

  const completion = await groqClient.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens: 300,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Groq');

  let scores;
  try {
    const cleaned = raw
      .replace(/```(?:json)?[\s\S]*?```/gi, s =>
        s.replace(/```(?:json)?/gi, '').replace(/```/g, '')
      )
      .trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');
    scores = JSON.parse(jsonMatch[0]);
  } catch {
    console.error('Failed to parse Groq response:', raw);
    throw new Error('Invalid JSON from Groq');
  }

  const skillMatch     = Math.max(0, Math.min(40, Math.round(scores.skillMatch     ?? 0)));
  const educationMatch = Math.max(0, Math.min(20, Math.round(scores.educationMatch ?? 0)));
  const locationMatch  = Math.max(0, Math.min(10, Math.round(scores.locationMatch  ?? 0)));
  const reasoning      = scores.reasoning ?? 'AI analysis complete';

  console.log(`🤖 AI Scores → skill:${skillMatch} edu:${educationMatch} loc:${locationMatch} | ${reasoning}`);

  if (skillMatch < 5) {
    return {
      total: 0,
      breakdown: { skillMatch: 0, educationMatch: 0, locationMatch: 0, priorityBoost: 0 },
      aiReasoning: `Ineligible — ${reasoning}`,
    };
  }

  return {
    total: skillMatch + educationMatch + locationMatch,
    breakdown: { skillMatch, educationMatch, locationMatch, priorityBoost: 0 },
    aiReasoning: reasoning,
  };
};

const calculateCVTextScore = (cvText, internshipRequirements) => {
  const textLower = cvText.toLowerCase();

  let skillMatch = 0;
  const requiredSkills = (internshipRequirements.skills ?? []).map(s => s.toLowerCase());

  if (requiredSkills.length === 0) {
    skillMatch = 40;
  } else {
    const matchedSkills = requiredSkills.filter(skill => {
      const aliases = SKILL_ALIASES[skill] || [skill];
      return aliases.some(alias => textLower.includes(alias));
    });

    const hasRelevantMatch = matchedSkills.some(s =>
      ALL_SKILLS.has(s) || [...ALL_SKILLS].some(t => s.includes(t) || t.includes(s))
    );

    if (matchedSkills.length === 0 || !hasRelevantMatch) {
      return {
        total: 0,
        breakdown: { skillMatch: 0, educationMatch: 0, locationMatch: 0, priorityBoost: 0 },
        aiReasoning: 'No relevant skills found in CV text',
      };
    }

    skillMatch = Math.round((matchedSkills.length / requiredSkills.length) * 40);
  }

  let educationMatch = 0;
  const reqEduLevel = internshipRequirements.education?.level?.toLowerCase() || '';

  if (!reqEduLevel) {
    educationMatch = 20;
  } else {
    const foundEdu = EDUCATION_KEYWORDS.filter(kw => textLower.includes(kw.toLowerCase()));
    if (foundEdu.length > 0) {
      educationMatch += 10;
      if (textLower.includes(reqEduLevel)) {
        educationMatch += 10;
      }
    }
  }
  educationMatch = Math.min(educationMatch, 20);

  let locationMatch = 0;
  const reqLocation = internshipRequirements.location;

  if (!reqLocation) {
    locationMatch = 10;
  } else {
    if (reqLocation.district && textLower.includes(reqLocation.district.toLowerCase())) {
      locationMatch = 10;
    } else {
      const locationTerms = ['colombo', 'galle', 'batticaloa', 'kandy', 'matara'];
      if (locationTerms.some(term => textLower.includes(term))) {
        locationMatch = 5;
      }
    }
  }

  return {
    total: skillMatch + educationMatch + locationMatch,
    breakdown: { skillMatch, educationMatch, locationMatch, priorityBoost: 0 },
    aiReasoning: `CV keyword matching — skills: ${skillMatch}, education: ${educationMatch}, location: ${locationMatch}`,
  };
};

const calculateRuleBasedScore = (youthProfile, internshipRequirements) => {
  let skillMatch = 0;
  if (!internshipRequirements.skills?.length) {
    skillMatch = 40;
  } else {
    const required = internshipRequirements.skills.map(s => s.toLowerCase());
    const candidate = (youthProfile.skills ?? []).map(s => s.toLowerCase());
    const matched = required.filter(req =>
      candidate.some(c => c.includes(req) || req.includes(c))
    );
    skillMatch = matched.length ? Math.round((matched.length / required.length) * 40) : 0;
  }

  return {
    total: skillMatch + 10 + 10,
    breakdown: { skillMatch, educationMatch: 10, locationMatch: 10, priorityBoost: 0 },
    aiReasoning: 'Rule-based scoring (profile data only)',
  };
};

// --- CONSTANTS ---
const IT_SKILLS = ['javascript', 'python', 'java', 'c++', 'react', 'node.js', 'html', 'css', 'mongodb', 'sql', 'aws'];
const BUSINESS_SKILLS = ['marketing', 'sales', 'management', 'finance', 'accounting', 'seo', 'leadership', 'communication'];
const ARCHITECTURE_SKILLS = ['autocad', 'sketchup', 'revit', '3d modeling', 'drafting', 'design', 'planning'];
const ARTS_SKILLS = ['photoshop', 'illustrator', 'premiere pro', 'graphic design', 'painting', 'drawing', 'photography'];

const ALL_SKILLS = new Set([...IT_SKILLS, ...BUSINESS_SKILLS, ...ARCHITECTURE_SKILLS, ...ARTS_SKILLS]);

const SKILL_ALIASES = {
  'javascript': ['js', 'ecmascript', 'javascript'],
  'react':      ['reactjs', 'react.js', 'react'],
  'node.js':    ['node', 'nodejs', 'node.js'],
  'python':     ['py', 'python'],
  'autocad':    ['auto cad', 'autocad'],
  'revit':      ['autodesk revit', 'revit'],
  'photoshop':  ['adobe photoshop', 'photoshop', 'ps'],
  'illustrator':['adobe illustrator', 'illustrator', 'ai'],
};

const EDUCATION_KEYWORDS = [
  'advance level', 'a/l', 'ordinary level', 'o/l', 'diploma', 'degree', 'bachelor', 'master', 'phd'
];