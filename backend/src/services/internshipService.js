import Internship from "../models/internship.js";
import { getCoordinates } from "../utils/geocode.js";
import {
  sendInternshipPostedEmail,
  sendInternshipClosedEmail,
  sendInternshipUpdatedEmail,
} from "../utils/emailService.js";

// ─── Helper: fetch organization email + name from the User model ──────────────
import User from "../models/User.js";

const getOrgDetails = async (organizationId) => {
  try {
    const user = await User.findById(organizationId).select("email organizationName name");
    return {
      email: user?.email ?? null,
      name:  user?.organizationName ?? user?.name ?? "Organization",
    };
  } catch {
    return { email: null, name: "Organization" };
  }
};

// ─── Track which fields are being changed (for the update email) ──────────────
const WATCHED_FIELDS = ["tittle", "description", "location", "duration", "requiredSkills", "status"];

const detectChangedFields = (updateData) =>
  WATCHED_FIELDS.filter((f) => updateData[f] !== undefined).map((f) => {
    const labels = {
      tittle:         "Title",
      description:    "Description",
      location:       "Location",
      duration:       "Duration",
      requiredSkills: "Required Skills",
      status:         "Status",
    };
    return labels[f] ?? f;
  });

// ════════════════════════════════════════════════════════════════════════════════
// CREATE
// ════════════════════════════════════════════════════════════════════════════════
export const createInternship = async (data, organizationId) => {
  let coordinates;

  if (data.location) {
    const coords = await getCoordinates(data.location);
    if (coords) {
      coordinates = {
        type: "Point",
        coordinates: [coords.lng, coords.lat],
      };
    }
  }

  const internship = await Internship.create({
    ...data,
    organizationId,
    ...(coordinates && { coordinates }),
  });

  // ── EMAIL: only send when status is Active (not Draft) ───────────────────────
  if (internship.status === "Active") {
    const org = await getOrgDetails(organizationId);
    if (org.email) {
      await sendInternshipPostedEmail(org.email, org.name, internship);
    }
  }

  return internship;
};

// ════════════════════════════════════════════════════════════════════════════════
// UPDATE
// ════════════════════════════════════════════════════════════════════════════════
export const updateInternship = async (data, internshipId, organizationId) => {
  const oldInternship = await Internship.findOne({ _id: internshipId, organizationId });

  if (data.location) {
    const coords = await getCoordinates(data.location);
    if (coords) {
      data.coordinates = {
        type: "Point",
        coordinates: [coords.lng, coords.lat],
      };
    }
  }

  const internship = await Internship.findOneAndUpdate(
    { _id: internshipId, organizationId },
    data,
    { returnDocument: "after" }
  );

  if (!internship) return internship;

  const org = await getOrgDetails(organizationId);

  if (org.email) {
    const oldStatus = oldInternship?.status;
    const newStatus = internship.status;

    if (oldStatus !== "Active" && newStatus === "Active") {
      await sendInternshipPostedEmail(org.email, org.name, internship);
    } else if (oldStatus === "Active" && newStatus === "Closed") {
      await sendInternshipClosedEmail(org.email, org.name, internship);
    } else {
      const changedFields = detectChangedFields(data);
      const nonStatusChanges = changedFields.filter((f) => f !== "Status");
      if (nonStatusChanges.length > 0) {
        await sendInternshipUpdatedEmail(org.email, org.name, internship, nonStatusChanges);
      }
    }
  }

  return internship;
};

// ════════════════════════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════════════════════════
export const deleteInternship = async (internshipId, organizationId) => {
  const internship = await Internship.findOneAndDelete({ _id: internshipId, organizationId });
  return internship;
};

// ════════════════════════════════════════════════════════════════════════════════
// GET SINGLE — populate org name for detail page
// ════════════════════════════════════════════════════════════════════════════════
export const getInternshipByIdService = async (internshipId) => {
  const internship = await Internship.findById(internshipId)
    .populate("organizationId", "organizationName name email");
  if (!internship) throw new Error("Internship not found");
  return internship;
};

// ════════════════════════════════════════════════════════════════════════════════
// GET ALL (org's own)
// ════════════════════════════════════════════════════════════════════════════════
export const getMyInternshipsService = async (organizationId, status) => {
  const filter = { organizationId };
  if (status) filter.status = status;

  const internships = await Internship.find(filter).sort({ createdAt: -1 });
  const count       = await Internship.countDocuments(filter);

  return { count, internships };
};

// ════════════════════════════════════════════════════════════════════════════════
// INCREMENT VIEW COUNT
// ════════════════════════════════════════════════════════════════════════════════
export const incrementViewCountService = async (internshipId) => {
  const internship = await Internship.findByIdAndUpdate(
    internshipId,
    { $inc: { viewCount: 1 } },
    { new: true }
  );
  if (!internship) throw new Error("Internship not found");
  return internship;
};

// ════════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════════════════════
export const getDashboardStatsService = async (organizationId) => {
  const totalInternships  = await Internship.countDocuments({ organizationId });
  const activeInternships = await Internship.countDocuments({ organizationId, status: "Active" });
  const closedInternships = await Internship.countDocuments({ organizationId, status: "Closed" });

  const internships = await Internship.find({ organizationId });

  const totalViews      = internships.reduce((sum, i) => sum + i.viewCount, 0);
  const totalApplicants = internships.reduce((sum, i) => sum + (i.totalapplicants ?? 0), 0);
  const acceptedCount   = internships.reduce((sum, i) => sum + (i.acceptedCount   ?? 0), 0);
  const acceptanceRate  =
    totalApplicants > 0
      ? ((acceptedCount / totalApplicants) * 100).toFixed(2)
      : 0;

  return {
    totalInternships,
    activeInternships,
    closedInternships,
    totalViews,
    totalApplicants,
    acceptanceRate,
  };
};

// ════════════════════════════════════════════════════════════════════════════════
// SEARCH — populate org name so InternshipCard can show "By OrgName"
// ════════════════════════════════════════════════════════════════════════════════
export const searchInternshipsService = async (queryParams) => {
  const {
    keyword,
    skills,
    education,
    status,
    location,
    page   = 1,
    limit  = 10,
    sortBy = "createdAt",
    order  = "desc",
  } = queryParams;

  const filter = {};

  if (keyword) {
    filter.$or = [
      { tittle:      { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ];
  }

  if (skills)    filter.requiredSkills    = { $in: skills.split(",") };
  if (education) filter.requiredEducation = education;
  if (status)    filter.status            = status;

  if (location) {
    const coords = await getCoordinates(location);
    if (coords) {
      const radiusInRadians = 50 / 6378.1;
      filter.coordinates = {
        $geoWithin: {
          $centerSphere: [[coords.lng, coords.lat], radiusInRadians],
        },
      };
    } else {
      filter.location = { $regex: location, $options: "i" };
    }
  }

  const skip      = (page - 1) * limit;
  const sortOrder = order === "asc" ? 1 : -1;

  const internships = await Internship.find(filter)
    .populate("organizationId", "organizationName name")  // ← added
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Internship.countDocuments(filter);

  return {
    total,
    page:       parseInt(page),
    totalPages: Math.ceil(total / limit),
    internships,
  };
};

// ════════════════════════════════════════════════════════════════════════════════
// GET NEARBY — populate org name so NearbyCard can show "By OrgName"
// ════════════════════════════════════════════════════════════════════════════════
export const getNearbyInternshipsService = async (lng, lat, radiusKm = 50, limit = 10) => {
  if (lng == null || lat == null) return [];

  const radiusInRadians = radiusKm / 6378.1;

  const internships = await Internship.find({
    status: "Active",
    "coordinates.coordinates": { $exists: true },
    coordinates: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radiusInRadians],
      },
    },
  })
    .populate("organizationId", "organizationName name")  // ← added
    .sort({ createdAt: -1 })
    .limit(limit);

  return internships;
};
