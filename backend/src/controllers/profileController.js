import YouthProfile from "../models/YouthProfile.js";
import {
  calculateProfileCompleteness,
  calculateProfileStrength,
  calculateEligibility,
  calculateRuralSupportPriority,
  buildSuggestions,
  validateDocumentMetadata,
  createVersionSnapshot,
} from "../services/profileService.js";

// Create a new youth profile
// POST /profile
export const createProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await YouthProfile.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({ message: "Profile already exists for this user" });
    }

    const payload = {
      user: userId,
      fullName: req.body.fullName,
      contactNumber: req.body.contactNumber,
      DOB: req.body.DOB,
      gender: req.body.gender,
      district: req.body.district,
      provinceOrState: req.body.provinceOrState,
      ruralAreaFlag: req.body.ruralAreaFlag,
      education: {
        highestQualification: req.body.highestQualification,
        institutionName: req.body.institutionName,
        fieldOfStudy: req.body.fieldOfStudy,
        graduationYear: req.body.graduationYear,
      },
      technicalSkills: req.body.technicalSkills || [],
      softSkills: req.body.softSkills || [],
      digitalLiteracyLevel: req.body.digitalLiteracyLevel || "medium",
      experienceYears: req.body.experienceYears || 0,
      previousInternships: req.body.previousInternships || [],
      volunteeringExperience: req.body.volunteeringExperience || [],
      preferredInternshipType: req.body.preferredInternshipType || "any",
      transportationAvailability: req.body.transportationAvailability || false,
      internetAccess: req.body.internetAccess || false,
      profileVisibility: req.body.profileVisibility || "public",
      documents: [],
    };

    const completeness = calculateProfileCompleteness(payload);
    const { level, score: strengthScore } = calculateProfileStrength(payload);
    const { eligibilityScore, participationEligibility } = calculateEligibility(
      completeness,
      strengthScore
    );
    const ruralSupportPriority = calculateRuralSupportPriority(payload);
    const suggestions = buildSuggestions(payload, completeness);

    payload.profileCompleteness = completeness;
    payload.profileStrengthLevel = level;
    payload.eligibilityScore = eligibilityScore;
    payload.participationEligibility = participationEligibility;
    payload.ruralSupportPriority = ruralSupportPriority;
    payload.suggestions = suggestions;

    const profile = await YouthProfile.create(payload);

    return res.status(201).json({
      message: "Youth profile created successfully",
      profile,
    });
  } catch (error) {
    console.error("Error in createProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get a profile by userId
// GET /profile/:userId
export const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const requester = req.user;

    const profile = await YouthProfile.findOne({ user: userId }).populate(
      "user",
      "name email role"
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const isOwner = String(requester._id) === String(userId);
    const isAdmin = requester.role === "admin";
    const isOrg = requester.role === "organization";

    if (!isOwner && !isAdmin && !isOrg) {
      return res.status(403).json({ message: "Not authorized to view this profile" });
    }

    // Organizations see a summary; admins and owners see full profile
    if (isOrg && !isOwner && !isAdmin) {
      const summary = {
        id: profile._id,
        user: profile.user,
        fullName: profile.fullName,
        district: profile.district,
        provinceOrState: profile.provinceOrState,
        technicalSkills: profile.technicalSkills,
        softSkills: profile.softSkills,
        experienceYears: profile.experienceYears,
        profileStrengthLevel: profile.profileStrengthLevel,
        participationEligibility: profile.participationEligibility,
        ruralSupportPriority: profile.ruralSupportPriority,
      };
      return res.status(200).json({ profile: summary });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("Error in getProfileByUserId:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get profiles list
// GET /profiles
export const getProfiles = async (req, res) => {
  try {
    const requester = req.user;

    let query = {};
    let projection = null;

    if (requester.role === "admin") {
      // Admin sees all profiles
      query = {};
      projection = null;
    } else if (requester.role === "organization") {
      // Organizations see summaries of all youth profiles
      projection = {
        fullName: 1,
        district: 1,
        provinceOrState: 1,
        technicalSkills: 1,
        softSkills: 1,
        experienceYears: 1,
        profileStrengthLevel: 1,
        participationEligibility: 1,
        ruralSupportPriority: 1,
        user: 1,
      };
    } else if (requester.role === "youth") {
      // Youth sees only own profile via this endpoint
      query = { user: requester._id };
    } else {
      return res.status(403).json({ message: "Not authorized to view profiles" });
    }

    const profiles = await YouthProfile.find(query, projection).populate(
      "user",
      "name email role"
    );

    return res.status(200).json({ profiles });
  } catch (error) {
    console.error("Error in getProfiles:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update profile
// PUT /profile/:userId
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requester = req.user;

    const isOwner = String(requester._id) === String(userId);
    const isAdmin = requester.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this profile" });
    }

    const profile = await YouthProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const versionSnapshot = createVersionSnapshot(profile);
    if (versionSnapshot) {
      profile.versions.push({
        snapshot: versionSnapshot,
        changedBy: requester._id,
      });
    }

    // Update fields if provided
    const updatableFields = [
      "fullName",
      "contactNumber",
      "DOB",
      "gender",
      "district",
      "provinceOrState",
      "ruralAreaFlag",
      "technicalSkills",
      "softSkills",
      "digitalLiteracyLevel",
      "experienceYears",
      "previousInternships",
      "volunteeringExperience",
      "preferredInternshipType",
      "transportationAvailability",
      "internetAccess",
      "profileVisibility",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    // Education fields
    if (!profile.education) profile.education = {};
    const eduFields = [
      "highestQualification",
      "institutionName",
      "fieldOfStudy",
      "graduationYear",
    ];
    eduFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile.education[field] = req.body[field];
      }
    });

    const completeness = calculateProfileCompleteness(profile);
    const { level, score: strengthScore } = calculateProfileStrength(profile);
    const { eligibilityScore, participationEligibility } = calculateEligibility(
      completeness,
      strengthScore
    );
    const ruralSupportPriority = calculateRuralSupportPriority(profile);
    const suggestions = buildSuggestions(profile, completeness);

    profile.profileCompleteness = completeness;
    profile.profileStrengthLevel = level;
    profile.eligibilityScore = eligibilityScore;
    profile.participationEligibility = participationEligibility;
    profile.ruralSupportPriority = ruralSupportPriority;
    profile.suggestions = suggestions;

    await profile.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Upload or update CV / documents (metadata only)
// POST /profile/:userId/upload-cv
export const uploadCv = async (req, res) => {
  try {
    const { userId } = req.params;
    const requester = req.user;

    const isOwner = String(requester._id) === String(userId);
    const isAdmin = requester.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to upload documents" });
    }

    const profile = await YouthProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { fileName, url, sizeInBytes } = req.body;

    const { valid, message } = validateDocumentMetadata({ fileName, sizeInBytes });
    if (!valid) {
      return res.status(400).json({ message });
    }

    const doc = {
      fileName,
      url,
      sizeInBytes,
      uploadedAt: new Date(),
    };

    profile.documents.push(doc);
    await profile.save();

    return res.status(200).json({
      message: "Document uploaded successfully",
      documents: profile.documents,
    });
  } catch (error) {
    console.error("Error in uploadCv:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete profile
// DELETE /profile/:userId
export const deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requester = req.user;

    const isOwner = String(requester._id) === String(userId);
    const isAdmin = requester.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this profile" });
    }

    await YouthProfile.findOneAndDelete({ user: userId });

    return res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

