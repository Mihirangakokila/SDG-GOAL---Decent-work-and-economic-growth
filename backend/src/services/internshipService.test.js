import mongoose from "mongoose";
import Internship from "../models/internship.js";
import {
  createInternship,
  getInternshipByIdService,
} from "./internshipService.js";

// Mock dependencies
jest.mock("../models/internship.js");

describe("Internship Service - Unit Tests", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ✅ CREATE TEST
  test("should create internship successfully", async () => {
    const mockData = {
      tittle: "Software Intern",
      description: "Test Description",
      status: "Draft"
    };

    const mockResponse = { _id: "123", ...mockData };

    Internship.create.mockResolvedValue(mockResponse);

    const result = await createInternship(mockData, "org123");

    expect(Internship.create).toHaveBeenCalled();
    expect(result.tittle).toBe("Software Intern");
  });

  // ✅ GET BY ID TEST
  test("should return internship by ID", async () => {
    const mockInternship = { _id: "123", tittle: "Intern" };

    Internship.findById.mockResolvedValue(mockInternship);

    const result = await getInternshipByIdService("123");

    expect(Internship.findById).toHaveBeenCalledWith("123");
    expect(result).toEqual(mockInternship);
  });

  // ❌ ERROR CASE
  test("should throw error if internship not found", async () => {
    Internship.findById.mockResolvedValue(null);

    await expect(getInternshipByIdService("123"))
      .rejects
      .toThrow("Internship not found");
  });

});