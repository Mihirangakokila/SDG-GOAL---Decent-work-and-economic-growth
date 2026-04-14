import Internship from "../models/internship.js";
import User from "../models/User.js";
import {
  createInternship,
  updateInternship,
  deleteInternship,
  getInternshipByIdService,
  getMyInternshipsService,
  incrementViewCountService,
  getDashboardStatsService,
  searchInternshipsService,
} from "./internshipService.js";
import * as geocode from "../utils/geocode.js";
import * as emailService from "../utils/emailService.js";

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock("../models/internship.js");
jest.mock("../models/User.js");
jest.mock("../utils/geocode.js");
jest.mock("../utils/emailService.js");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockOrg = { email: "org@example.com", organizationName: "Tech Corp" };
const mockUser = { email: "org@example.com", organizationName: "Tech Corp", name: "Tech Corp" };

beforeEach(() => {
  jest.clearAllMocks();

  // Default: geocode returns nothing (so no coordinate path)
  geocode.getCoordinates.mockResolvedValue(null);

  // Default: User lookup resolves with mock org
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue(mockUser),
  });

  // Default: email helpers resolve silently
  emailService.sendInternshipPostedEmail.mockResolvedValue(true);
  emailService.sendInternshipClosedEmail.mockResolvedValue(true);
  emailService.sendInternshipUpdatedEmail.mockResolvedValue(true);
});

// Update the Internship mock to include proper chaining for populate and other methods
jest.mock("../models/internship.js", () => {
  const mockChain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  return {
    findById: jest.fn().mockReturnValue(mockChain),
    find: jest.fn().mockReturnValue(mockChain),
    findOne: jest.fn().mockReturnValue(mockChain),
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
    findOneAndDelete: jest.fn().mockResolvedValue(null),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    countDocuments: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({}),
    ...mockChain,
  };
});

// Update specific test cases to align with the mock behavior
describe("getInternshipByIdService", () => {
  test("should return internship by ID", async () => {
    const mockInternship = {
      _id: "int1",
      tittle: "Test Intern",
      organizationId: { organizationName: "Test Org", name: "Test Name", email: "test@example.com" },
    };

    Internship.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockInternship),
    });

    const result = await getInternshipByIdService("int1");

    expect(Internship.findById).toHaveBeenCalledWith("int1");
    expect(result).toEqual(mockInternship);
  });

  test("should throw error when internship not found", async () => {
    Internship.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(getInternshipByIdService("bad-id")).rejects.toThrow("Internship not found");
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// CREATE
// ════════════════════════════════════════════════════════════════════════════════
describe("createInternship", () => {
  test("should create an internship with Draft status (no email)", async () => {
    const data = { tittle: "Software Intern", description: "Build cool stuff", status: "Draft" };
    const created = { _id: "int1", ...data, organizationId: "org1" };
    Internship.create.mockResolvedValue(created);

    const result = await createInternship(data, "org1");

    expect(Internship.create).toHaveBeenCalledWith(
      expect.objectContaining({ tittle: "Software Intern", organizationId: "org1" })
    );
    expect(result.tittle).toBe("Software Intern");
    expect(emailService.sendInternshipPostedEmail).not.toHaveBeenCalled();
  });

  test("should create an Active internship and send posted email", async () => {
    const data = { tittle: "Dev Intern", status: "Active" };
    const created = { _id: "int2", ...data, organizationId: "org1" };
    Internship.create.mockResolvedValue(created);

    await createInternship(data, "org1");

    expect(emailService.sendInternshipPostedEmail).toHaveBeenCalledWith(
      mockOrg.email,
      mockOrg.organizationName,
      created
    );
  });

  test("should geocode location and attach coordinates when location provided", async () => {
    geocode.getCoordinates.mockResolvedValue({ lat: 6.9271, lng: 79.8612 });

    const data = { tittle: "Local Intern", location: "Colombo", status: "Draft" };
    Internship.create.mockResolvedValue({ _id: "int3", ...data });

    await createInternship(data, "org1");

    expect(geocode.getCoordinates).toHaveBeenCalledWith("Colombo");
    expect(Internship.create).toHaveBeenCalledWith(
      expect.objectContaining({
        coordinates: { type: "Point", coordinates: [79.8612, 6.9271] },
      })
    );
  });

  test("should not attach coordinates when geocode returns null", async () => {
    geocode.getCoordinates.mockResolvedValue(null);
    const data = { tittle: "Remote Intern", location: "Nowhere", status: "Draft" };
    Internship.create.mockResolvedValue({ _id: "int4", ...data });

    await createInternship(data, "org1");

    const callArg = Internship.create.mock.calls[0][0];
    expect(callArg.coordinates).toBeUndefined();
  });

  test("should not send email when org has no email", async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ email: null, name: "Anon" }) });
    const data = { tittle: "Intern", status: "Active" };
    Internship.create.mockResolvedValue({ _id: "int5", ...data });

    await createInternship(data, "org1");

    expect(emailService.sendInternshipPostedEmail).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// UPDATE
// ════════════════════════════════════════════════════════════════════════════════
describe("updateInternship", () => {
  const oldActive   = { _id: "int1", status: "Active",  tittle: "Old Title" };
  const oldDraft    = { _id: "int1", status: "Draft",   tittle: "Old Title" };

  test("should return null if internship not found", async () => {
    Internship.findOne.mockResolvedValue(oldDraft);
    Internship.findOneAndUpdate.mockResolvedValue(null);

    const result = await updateInternship({ tittle: "New" }, "int1", "org1");
    expect(result).toBeNull();
  });

  test("should send posted email when transitioning Draft → Active", async () => {
    Internship.findOne.mockResolvedValue(oldDraft);
    const updated = { ...oldDraft, status: "Active" };
    Internship.findOneAndUpdate.mockResolvedValue(updated);

    await updateInternship({ status: "Active" }, "int1", "org1");

    expect(emailService.sendInternshipPostedEmail).toHaveBeenCalledWith(
      mockOrg.email, mockOrg.organizationName, updated
    );
    expect(emailService.sendInternshipClosedEmail).not.toHaveBeenCalled();
  });

  test("should send closed email when transitioning Active → Closed", async () => {
    Internship.findOne.mockResolvedValue(oldActive);
    const updated = { ...oldActive, status: "Closed" };
    Internship.findOneAndUpdate.mockResolvedValue(updated);

    await updateInternship({ status: "Closed" }, "int1", "org1");

    expect(emailService.sendInternshipClosedEmail).toHaveBeenCalledWith(
      mockOrg.email, mockOrg.organizationName, updated
    );
    expect(emailService.sendInternshipPostedEmail).not.toHaveBeenCalled();
  });

  test("should send updated email when non-status fields change on Active internship", async () => {
    Internship.findOne.mockResolvedValue(oldActive);
    const updated = { ...oldActive, tittle: "New Title" };
    Internship.findOneAndUpdate.mockResolvedValue(updated);

    await updateInternship({ tittle: "New Title" }, "int1", "org1");

    expect(emailService.sendInternshipUpdatedEmail).toHaveBeenCalledWith(
      mockOrg.email, mockOrg.organizationName, updated, ["Title"]
    );
  });

  test("should geocode location on update", async () => {
    geocode.getCoordinates.mockResolvedValue({ lat: 6.9271, lng: 79.8612 });
    Internship.findOne.mockResolvedValue(oldDraft);
    const updated = { ...oldDraft, location: "Colombo" };
    Internship.findOneAndUpdate.mockResolvedValue(updated);

    await updateInternship({ location: "Colombo" }, "int1", "org1");

    expect(geocode.getCoordinates).toHaveBeenCalledWith("Colombo");
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════════════════════════
describe("deleteInternship", () => {
  test("should delete internship by id and organizationId", async () => {
    const deleted = { _id: "int1", tittle: "Deleted" };
    Internship.findOneAndDelete.mockResolvedValue(deleted);

    const result = await deleteInternship("int1", "org1");

    expect(Internship.findOneAndDelete).toHaveBeenCalledWith({ _id: "int1", organizationId: "org1" });
    expect(result).toEqual(deleted);
  });

  test("should return null if internship does not exist", async () => {
    Internship.findOneAndDelete.mockResolvedValue(null);
    const result = await deleteInternship("nonexistent", "org1");
    expect(result).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// GET BY ID
// ════════════════════════════════════════════════════════════════════════════════
describe("getInternshipByIdService", () => {
  test("should return internship by ID", async () => {
    const mockInternship = {
      _id: "int1",
      tittle: "Test Intern",
      organizationId: { organizationName: "Test Org", name: "Test Name", email: "test@example.com" },
    };

    Internship.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockInternship),
    });

    const result = await getInternshipByIdService("int1");

    expect(Internship.findById).toHaveBeenCalledWith("int1");
    expect(result).toEqual(mockInternship);
  });

  test("should throw error when internship not found", async () => {
    Internship.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(getInternshipByIdService("bad-id")).rejects.toThrow("Internship not found");
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// GET MY INTERNSHIPS
// ════════════════════════════════════════════════════════════════════════════════
describe("getMyInternshipsService", () => {
  test("should return all internships for an organization", async () => {
    const list = [{ _id: "i1" }, { _id: "i2" }];
    Internship.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(list) });
    Internship.countDocuments.mockResolvedValue(2);

    const result = await getMyInternshipsService("org1");

    expect(result.count).toBe(2);
    expect(result.internships).toHaveLength(2);
  });

  test("should filter by status when provided", async () => {
    Internship.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    Internship.countDocuments.mockResolvedValue(0);

    await getMyInternshipsService("org1", "Active");

    expect(Internship.find).toHaveBeenCalledWith({ organizationId: "org1", status: "Active" });
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// INCREMENT VIEW COUNT
// ════════════════════════════════════════════════════════════════════════════════
describe("incrementViewCountService", () => {
  test("should increment view count and return updated internship", async () => {
    const updated = { _id: "int1", viewCount: 5 };
    Internship.findByIdAndUpdate.mockResolvedValue(updated);

    const result = await incrementViewCountService("int1");

    expect(Internship.findByIdAndUpdate).toHaveBeenCalledWith(
      "int1",
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    expect(result.viewCount).toBe(5);
  });

  test("should throw if internship not found", async () => {
    Internship.findByIdAndUpdate.mockResolvedValue(null);
    await expect(incrementViewCountService("bad")).rejects.toThrow("Internship not found");
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════════════════════
describe("getDashboardStatsService", () => {
  const internships = [
    { viewCount: 10, totalapplicants: 5, acceptedCount: 2 },
    { viewCount: 20, totalapplicants: 8, acceptedCount: 4 },
  ];

  beforeEach(() => {
    Internship.countDocuments
      .mockResolvedValueOnce(2)   // total
      .mockResolvedValueOnce(1)   // active
      .mockResolvedValueOnce(1);  // closed
    Internship.find.mockResolvedValue(internships);
  });

  test("should return aggregated dashboard stats", async () => {
    const stats = await getDashboardStatsService("org1");

    expect(stats.totalInternships).toBe(2);
    expect(stats.activeInternships).toBe(1);
    expect(stats.closedInternships).toBe(1);
    expect(stats.totalViews).toBe(30);
    expect(stats.totalApplicants).toBe(13);
    expect(stats.acceptanceRate).toBe(((6 / 13) * 100).toFixed(2));
  });

  test("should return acceptanceRate of 0 when no applicants", async () => {
    Internship.countDocuments
      .mockReset()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    Internship.find.mockResolvedValue([{ viewCount: 0, totalapplicants: 0, acceptedCount: 0 }]);

    const stats = await getDashboardStatsService("org1");
    expect(stats.acceptanceRate).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════════════════════════════
describe("searchInternshipsService", () => {
  const mockChain = (list) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(list),
  });

  test("should return paginated internships", async () => {
    const list = [{ _id: "i1" }];
    Internship.find.mockReturnValue(mockChain(list));
    Internship.countDocuments.mockResolvedValue(1);

    const result = await searchInternshipsService({ page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.internships).toHaveLength(1);
  });

  test("should build $or filter when keyword provided", async () => {
    Internship.find.mockReturnValue(mockChain([]));
    Internship.countDocuments.mockResolvedValue(0);

    await searchInternshipsService({ keyword: "React" });

    const filterArg = Internship.find.mock.calls[0][0];
    expect(filterArg.$or).toBeDefined();
    expect(filterArg.$or[0].tittle.$regex).toBe("React");
  });

  test("should apply skills filter when skills param provided", async () => {
    Internship.find.mockReturnValue(mockChain([]));
    Internship.countDocuments.mockResolvedValue(0);

    await searchInternshipsService({ skills: "React,Node.js" });

    const filterArg = Internship.find.mock.calls[0][0];
    expect(filterArg.requiredSkills.$in).toEqual(["React", "Node.js"]);
  });

  test("should use $geoWithin filter when location geocodes successfully", async () => {
    geocode.getCoordinates.mockResolvedValue({ lat: 6.9271, lng: 79.8612 });
    Internship.find.mockReturnValue(mockChain([]));
    Internship.countDocuments.mockResolvedValue(0);

    await searchInternshipsService({ location: "Colombo" });

    const filterArg = Internship.find.mock.calls[0][0];
    expect(filterArg.coordinates.$geoWithin).toBeDefined();
  });

  test("should fall back to regex location filter when geocode fails", async () => {
    geocode.getCoordinates.mockResolvedValue(null);
    Internship.find.mockReturnValue(mockChain([]));
    Internship.countDocuments.mockResolvedValue(0);

    await searchInternshipsService({ location: "Colombo" });

    const filterArg = Internship.find.mock.calls[0][0];
    expect(filterArg.location.$regex).toBe("Colombo");
  });
});
