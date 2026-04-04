// Helper functions for youth profile business logic

const MANDATORY_FIELDS = [
  "fullName",
  "contactNumber",
  "DOB",
  "district",
  "provinceOrState",
  "education.highestQualification",
];

// Safely get nested value using a path like "education.highestQualification"
// Works with both plain objects and Mongoose documents
const getValue = (obj, path) => {
  return path.split(".").reduce((acc, key) => {
    if (acc && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
};

export const calculateProfileCompleteness = (profileData) => {
  let filled = 0;

  MANDATORY_FIELDS.forEach((fieldPath) => {
    const value = getValue(profileData, fieldPath);
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      filled += 1;
    }
  });

  const percentage =
    MANDATORY_FIELDS.length === 0
      ? 0
      : Math.round((filled / MANDATORY_FIELDS.length) * 100);

  return percentage;
};

export const calculateProfileStrength = (profileData) => {
  const techCount = Array.isArray(profileData.technicalSkills)
    ? profileData.technicalSkills.length
    : 0;
  const softCount = Array.isArray(profileData.softSkills)
    ? profileData.softSkills.length
    : 0;

  const experienceYears = Number(profileData.experienceYears || 0);

  // Weighted score: technical (50%), soft (30%), experience (20%)
  const techScore = Math.min(techCount, 10) * 5; // max 50
  const softScore = Math.min(softCount, 10) * 3; // max 30
  const expScore = Math.min(experienceYears, 10) * 2; // max 20

  const total = techScore + softScore + expScore; // 0 - 100

  if (total >= 70) return { level: "high", score: total };
  if (total >= 40) return { level: "medium", score: total };
  return { level: "low", score: total };
};

export const calculateEligibility = (completeness, strengthScore) => {
  const baseScore = completeness * 0.6 + strengthScore * 0.4; // combined 0-100
  const participationEligibility = baseScore >= 60;
  return { eligibilityScore: Math.round(baseScore), participationEligibility };
};

export const calculateRuralSupportPriority = (profileData) => {
  return Boolean(profileData.ruralAreaFlag);
};

export const buildSuggestions = (profileData, completeness) => {
  const suggestions = [];

  if (completeness < 100) {
    suggestions.push("Complete all mandatory profile fields to reach 100%.");
  }

  if (!profileData.technicalSkills || profileData.technicalSkills.length === 0) {
    suggestions.push("Add at least 3 technical skills relevant to your interests.");
  }

  if (!profileData.softSkills || profileData.softSkills.length === 0) {
    suggestions.push("Add key soft skills such as teamwork, communication, or leadership.");
  }

  if (!profileData.experienceYears || profileData.experienceYears === 0) {
    suggestions.push("Consider volunteering or short internships to gain experience.");
  }

  if (profileData.digitalLiteracyLevel === "low") {
    suggestions.push(
      "Improve your digital literacy by taking basic computer or online skills courses."
    );
  }

  if (!profileData.internetAccess) {
    suggestions.push(
      "Ensure you have reliable internet access to participate in remote opportunities."
    );
  }

  return suggestions;
};

export const validateDocumentMetadata = ({ fileName, sizeInBytes }) => {
  if (!fileName) {
    return { valid: false, message: "fileName is required" };
  }

  const lower = fileName.toLowerCase();
  const allowedExtensions = [".pdf", ".doc", ".docx"];
  const hasAllowedExtension = allowedExtensions.some((ext) => lower.endsWith(ext));

  if (!hasAllowedExtension) {
    return {
      valid: false,
      message: "Invalid file type. Only PDF, DOC, and DOCX are allowed.",
    };
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (typeof sizeInBytes !== "number" || sizeInBytes <= 0) {
    return { valid: false, message: "sizeInBytes must be a positive number" };
  }

  if (sizeInBytes > MAX_SIZE) {
    return { valid: false, message: "File size exceeds 5MB limit." };
  }

  return { valid: true };
};

export const createVersionSnapshot = (profileDoc) => {
  if (!profileDoc) return null;

  const snapshot = {
    fullName: profileDoc.fullName,
    contactNumber: profileDoc.contactNumber,
    DOB: profileDoc.DOB,
    gender: profileDoc.gender,
    district: profileDoc.district,
    provinceOrState: profileDoc.provinceOrState,
    ruralAreaFlag: profileDoc.ruralAreaFlag,
    education: profileDoc.education,
    technicalSkills: profileDoc.technicalSkills,
    softSkills: profileDoc.softSkills,
    digitalLiteracyLevel: profileDoc.digitalLiteracyLevel,
    experienceYears: profileDoc.experienceYears,
    previousInternships: profileDoc.previousInternships,
    volunteeringExperience: profileDoc.volunteeringExperience,
    preferredInternshipType: profileDoc.preferredInternshipType,
    transportationAvailability: profileDoc.transportationAvailability,
    internetAccess: profileDoc.internetAccess,
    profileVisibility: profileDoc.profileVisibility,
    profileCompleteness: profileDoc.profileCompleteness,
    profileStrengthLevel: profileDoc.profileStrengthLevel,
    participationEligibility: profileDoc.participationEligibility,
    eligibilityScore: profileDoc.eligibilityScore,
    ruralSupportPriority: profileDoc.ruralSupportPriority,
    documents: profileDoc.documents,
    suggestions: profileDoc.suggestions,
  };

  return snapshot;
};

