const ORG_MANDATORY_FIELDS = [
  "organizationName",
  "contactNumber",
  "industry",
  "organizationType",
  "location",
];

const getValue = (obj, path) => {
  return path.split(".").reduce((acc, key) => {
    if (acc && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
};

export const calculateOrgProfileCompleteness = (profileData) => {
  let filled = 0;

  ORG_MANDATORY_FIELDS.forEach((fieldPath) => {
    const value = getValue(profileData, fieldPath);
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      filled += 1;
    }
  });

  const percentage =
    ORG_MANDATORY_FIELDS.length === 0
      ? 0
      : Math.round((filled / ORG_MANDATORY_FIELDS.length) * 100);

  return percentage;
};

export const determineReadinessStatus = (completeness, verified) => {
  if (completeness >= 80 && verified) {
    return "READY";
  }
  return "DRAFT";
};

export const determineCanPostInternship = (readinessStatus, verified) => {
  return readinessStatus === "READY" && verified;
};

export const buildReadinessSuggestions = (profileData, completeness, verified) => {
  const suggestions = [];

  if (completeness < 100) {
    suggestions.push("Complete all mandatory organization profile fields.");
  }

  if (!profileData.description) {
    suggestions.push("Add a clear description of your organization and mission.");
  }

  if (!profileData.website) {
    suggestions.push("Add your organization website or social media page.");
  }

  if (!profileData.offersRemoteInternships) {
    suggestions.push(
      "Consider enabling remote internships to reach more rural youth candidates."
    );
  }

  if (!verified) {
    suggestions.push(
      "Upload verification documents so an admin can verify your organization."
    );
  }

  return suggestions;
};

export const validateOrgDocumentMetadata = ({ fileName, sizeInBytes }) => {
  if (!fileName) {
    return { valid: false, message: "fileName is required" };
  }

  const lower = fileName.toLowerCase();
  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
  const hasAllowedExtension = allowedExtensions.some((ext) => lower.endsWith(ext));

  if (!hasAllowedExtension) {
    return {
      valid: false,
      message: "Invalid file type. Only PDF and image files are allowed.",
    };
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (typeof sizeInBytes !== "number" || sizeInBytes <= 0) {
    return { valid: false, message: "sizeInBytes must be a positive number" };
  }

  if (sizeInBytes > MAX_SIZE) {
    return { valid: false, message: "File size exceeds 5MB limit." };
  }

  return { valid: true };
};

export const createOrgVersionSnapshot = (profileDoc) => {
  if (!profileDoc) return null;

  const snapshot = {
    organizationId: profileDoc.organizationId,
    organizationName: profileDoc.organizationName,
    contactNumber: profileDoc.contactNumber,
    industry: profileDoc.industry,
    organizationType: profileDoc.organizationType,
    location: profileDoc.location,
    description: profileDoc.description,
    website: profileDoc.website,
    offersRemoteInternships: profileDoc.offersRemoteInternships,
    internshipLocationType: profileDoc.internshipLocationType,
    profileCompletenessPercentage: profileDoc.profileCompletenessPercentage,
    readinessStatus: profileDoc.readinessStatus,
    canPostInternship: profileDoc.canPostInternship,
    verified: profileDoc.verified,
    documents: profileDoc.documents,
    readinessSuggestions: profileDoc.readinessSuggestions,
  };

  return snapshot;
};
