import request from "supertest";
import express from "express";

// ✅ MOCK ALL CONTROLLERS
jest.mock("../controllers/internshipController.js", () => ({
  createInternshipController: (req, res) =>
    res.status(201).json({ message: "Created" }),

  updateInternshipController: (req, res) =>
    res.status(200).json({ message: "Updated" }),

  deleteInternshipController: (req, res) =>
    res.status(200).json({ message: "Deleted" }),

  getInternshipByIdController: (req, res) =>
    res.status(200).json({ id: req.params.id }),

  getMyInternships: (req, res) =>
    res.status(200).json({ internships: [] }),

  incrementViewCountController: (req, res) =>
    res.status(200).json({ message: "View incremented" }),

  getDashboardStats: (req, res) =>
    res.status(200).json({ stats: {} }),

  searchInternshipsController: (req, res) =>
    res.status(200).json({ results: [] }),
}));

// ✅ MOCK MIDDLEWARE
jest.mock("../middleware/authMiddleware.js", () => ({
  protect: (req, res, next) => next(),
  authorizeRoles: () => (req, res, next) => next(),
}));

// ✅ IMPORT AFTER MOCKS
import router from "./internshipRoute.js";

const app = express();
app.use(express.json());
app.use("/api/internships", router);

describe("Internship Routes - Integration Tests", () => {

  test("POST /api/internships", async () => {
    const res = await request(app)
      .post("/api/internships")
      .send({ tittle: "Intern", description: "Test" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Created");
  });

  test("PUT /api/internships/:id", async () => {
    const res = await request(app)
      .put("/api/internships/123")
      .send({ tittle: "Updated" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Updated");
  });

  test("GET /api/internships/:id", async () => {
    const res = await request(app)
      .get("/api/internships/123");

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe("123");
  });

  test("GET /api/internships/search", async () => {
    const res = await request(app)
      .get("/api/internships/search");

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toEqual([]);
  });

});