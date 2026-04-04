import OrganizationProfile from "../models/OrganizationProfile.js";
import {
  calculateOrgProfileCompleteness,
  determineReadinessStatus,
  determineCanPostInternship,
  buildReadinessSuggestions,
  validateOrgDocumentMetadata,
  createOrgVersionSnapshot,
} from "../services/organizationService.js";

// POST /organizations
export const createOrganizationProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await OrganizationProfile.findOne({ user: userId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Organization profile already exists for this user" });
    }

    const payload = {
      organizationId: req.body.organizationId,
      user: userId,
      organizationName: req.body.organizationName,
      contactNumber: req.body.contactNumber,
      industry: req.body.industry,
      organizationType: req.body.organizationType,
      location: req.body.location,
      description: req.body.description,
      website: req.body.website,
      offersRemoteInternships: req.body.offersRemoteInternships || false,
      internshipLocationType: req.body.internshipLocationType || "On-site",
      documents: [],
    };

    const completeness = calculateOrgProfileCompleteness(payload);
    const verified = false;
    const readinessStatus = determineReadinessStatus(completeness, verified);
    const canPostInternship = determineCanPostInternship(readinessStatus, verified);
    const readinessSuggestions = buildReadinessSuggestions(
      payload,
      completeness,
      verified
    );

    payload.profileCompletenessPercentage = completeness;
    payload.readinessStatus = readinessStatus;
    payload.canPostInternship = canPostInternship;
    payload.verified = verified;
    payload.readinessSuggestions = readinessSuggestions;

    const profile = await OrganizationProfile.create(payload);

    return res.status(201).json({
      message: "Organization profile created successfully",
      organization: profile,
    });
  } catch (error) {
    console.error("Error in createOrganizationProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /organizations/:id
export const getOrganizationProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const organization = await OrganizationProfile.findById(id).populate(
      "user",
      "name email role"
    );

    if (!organization) {
      return res.status(404).json({ message: "Organization profile not found" });
    }

    return res.status(200).json({ organization });
  } catch (error) {
    console.error("Error in getOrganizationProfileById:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /organizations
export const getOrganizationProfiles = async (req, res) => {
  try {
    const requester = req.user;
    let query = {};

    if (requester.role === "organization") {
      query = { user: requester._id };
    } else if (requester.role === "admin") {
      query = {};
    } else {
      return res.status(403).json({ message: "Not authorized to view organizations" });
    }

    const organizations = await OrganizationProfile.find(query).populate(
      "user",
      "name email role"
    );

    return res.status(200).json({ organizations });
  } catch (error) {
    console.error("Error in getOrganizationProfiles:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /organizations/:id
export const updateOrganizationProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    const organization = await OrganizationProfile.findById(id);
    if (!organization) {
      return res.status(404).json({ message: "Organization profile not found" });
    }

    const isOwner = String(organization.user) === String(requester._id);
    const isAdmin = requester.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this organization profile" });
    }

    const snapshot = createOrgVersionSnapshot(organization);
    if (snapshot) {
      organization.versions.push({
        snapshot,
        changedBy: requester._id,
      });
    }

    const updatableFields = [
      "organizationId",
      "organizationName",
      "contactNumber",
      "industry",
      "organizationType",
      "location",
      "description",
      "website",
      "offersRemoteInternships",
      "internshipLocationType",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        organization[field] = req.body[field];
      }
    });

    // Verified can only be changed by admin
    if (req.body.verified !== undefined && isAdmin) {
      organization.verified = Boolean(req.body.verified);
    }

    const completeness = calculateOrgProfileCompleteness(organization);
    const readinessStatus = determineReadinessStatus(
      completeness,
      organization.verified
    );
    const canPostInternship = determineCanPostInternship(
      readinessStatus,
      organization.verified
    );
    const readinessSuggestions = buildReadinessSuggestions(
      organization,
      completeness,
      organization.verified
    );

    organization.profileCompletenessPercentage = completeness;
    organization.readinessStatus = readinessStatus;
    organization.canPostInternship = canPostInternship;
    organization.readinessSuggestions = readinessSuggestions;

    await organization.save();

    return res.status(200).json({
      message: "Organization profile updated successfully",
      organization,
    });
  } catch (error) {
    console.error("Error in updateOrganizationProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /organizations/:id/documents
export const uploadOrganizationDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    const organization = await OrganizationProfile.findById(id);
    if (!organization) {
      return res.status(404).json({ message: "Organization profile not found" });
    }

    const isOwner = String(organization.user) === String(requester._id);
    const isAdmin = requester.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to upload documents for this organization" });
    }

    const { fileName, url, sizeInBytes, type } = req.body;

    const { valid, message } = validateOrgDocumentMetadata({ fileName, sizeInBytes });
    if (!valid) {
      return res.status(400).json({ message });
    }

    const doc = {
      fileName,
      url,
      sizeInBytes,
      type,
      uploadedAt: new Date(),
    };

    organization.documents.push(doc);
    await organization.save();

    return res.status(200).json({
      message: "Document uploaded successfully",
      documents: organization.documents,
    });
  } catch (error) {
    console.error("Error in uploadOrganizationDocument:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /organizations/:id
export const deleteOrganizationProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    const organization = await OrganizationProfile.findById(id);
    if (!organization) {
      return res.status(404).json({ message: "Organization profile not found" });
    }

    const isOwner = String(organization.user) === String(requester._id);
    const isAdmin = requester.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this organization profile" });
    }

    await OrganizationProfile.findByIdAndDelete(id);

    return res.status(200).json({ message: "Organization profile deleted successfully" });
  } catch (error) {
    console.error("Error in deleteOrganizationProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

