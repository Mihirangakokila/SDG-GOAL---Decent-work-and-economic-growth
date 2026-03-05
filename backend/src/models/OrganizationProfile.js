import mongoose from "mongoose";

const orgDocumentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    sizeInBytes: { type: Number, required: true },
    type: { type: String, trim: true }, // e.g. "logo", "verification"
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orgVersionSchema = new mongoose.Schema(
  {
    snapshot: { type: Object, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const organizationProfileSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    organizationName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    organizationType: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    website: { type: String, trim: true },

    offersRemoteInternships: { type: Boolean, default: false },
    internshipLocationType: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      default: "On-site",
    },

    profileCompletenessPercentage: { type: Number, default: 0 },
    readinessStatus: {
      type: String,
      enum: ["DRAFT", "READY"],
      default: "DRAFT",
    },
    canPostInternship: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },

    documents: [orgDocumentSchema],
    readinessSuggestions: [{ type: String }],
    versions: [orgVersionSchema],
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "organizations",
  }
);

const OrganizationProfile = mongoose.model(
  "OrganizationProfile",
  organizationProfileSchema
);

export default OrganizationProfile;
