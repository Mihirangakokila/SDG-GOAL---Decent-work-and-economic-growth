import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    sizeInBytes: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema(
  {
    snapshot: { type: Object, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const youthProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Basic info
    fullName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    DOB: { type: Date, required: true },
    gender: { type: String, trim: true },
    district: { type: String, trim: true },
    provinceOrState: { type: String, trim: true },
    ruralAreaFlag: { type: Boolean, default: false },

    // Education
    education: {
      highestQualification: { type: String, trim: true },
      institutionName: { type: String, trim: true },
      fieldOfStudy: { type: String, trim: true },
      graduationYear: { type: Number },
    },

    // Skills
    technicalSkills: [{ type: String, trim: true }],
    softSkills: [{ type: String, trim: true }],
    digitalLiteracyLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Experience
    experienceYears: { type: Number, default: 0 },
    previousInternships: [{ type: String, trim: true }],
    volunteeringExperience: [{ type: String, trim: true }],

    // Accessibility & preferences
    preferredInternshipType: {
      type: String,
      enum: ["remote", "onsite", "hybrid", "any"],
      default: "any",
    },
    transportationAvailability: { type: Boolean, default: false },
    internetAccess: { type: Boolean, default: false },

    // Settings / Calculations
    profileVisibility: {
      type: String,
      enum: ["public", "private", "restricted"],
      default: "public",
    },
    profileCompleteness: { type: Number, default: 0 }, // percentage 0-100
    profileStrengthLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    participationEligibility: { type: Boolean, default: false },
    eligibilityScore: { type: Number, default: 0 }, // 0-100
    ruralSupportPriority: { type: Boolean, default: false },

    // Documents / CVs
    documents: [documentSchema],

    // Suggestions & notifications
    suggestions: [{ type: String }],
    notifications: [{ type: String }],

    // Versioning / audit
    versions: [versionSchema],
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "YouthProfile",
  }
);

const YouthProfile = mongoose.model("YouthProfile", youthProfileSchema);

export default YouthProfile;
