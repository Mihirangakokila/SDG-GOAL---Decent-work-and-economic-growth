import request from "supertest";
import express from "express";

// ─── Mock all controllers ─────────────────────────────────────────────────────
jest.mock("../controllers/internshipController.js", () => ({
  createInternshipController: (req, res) =>
    res.status(201).json({ message: "Created", data: req.body }),

  updateInternshipController: (req, res) =>
    res.status(200).json({ message: "Updated", id: req.params.id }),

  deleteInternshipController: (req, res) =>
    res.status(200).json({ message: "Deleted", id: req.params.id }),

  getInternshipByIdController: (req, res) =>
    res.status(200).json({ id: req.params.id }),

  getMyInternships: (req, res) =>
    res.status(200).json({ internships: [], count: 0 }),

  incrementViewCountController: (req, res) =>
    res.status(200).json({ message: "View incremented", id: req.params.id }),

  getDashboardStats: (req, res) =>
    res.status(200).json({ stats: { totalInternships: 0, activeInternships: 0 } }),

  searchInternshipsController: (req, res) =>
    res.status(200).json({ results: [], total: 0, page: 1 }),

  getNearbyInternshipsController: (req, res) =>
    res.status(200).json({ internships: [], locationAvailable: true }),
}));

// ─── Mock middleware ──────────────────────────────────────────────────────────
jest.mock("../middleware/authMiddleware.js", () => ({
  protect: (req, res, next) => {
    req.user = { _id: "org123", role: "organization" };
    next();
  },
  authorizeRoles: () => (req, res, next) => next(),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import router from "./internshipRoute.js";

const app = express();
app.use(express.json());
app.use("/api/internships", router);

// ════════════════════════════════════════════════════════════════════════════════
describe("Internship API Integration Tests", () => {

  // ── POST /api/internships ───────────────────────────────────────────────────
  describe("POST /api/internships", () => {
    test("should create a new internship and return 201", async () => {
      const payload = { tittle: "Software Intern", description: "Build things", status: "Draft" };

      const res = await request(app)
        .post("/api/internships")
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Created");
      expect(res.body.data.tittle).toBe("Software Intern");
    });

    test("should accept Active status internship", async () => {
      const res = await request(app)
        .post("/api/internships")
        .send({ tittle: "Active Intern", status: "Active" });

      expect(res.statusCode).toBe(201);
    });
  });

  // ── PUT /api/internships/:id ────────────────────────────────────────────────
  describe("PUT /api/internships/:id", () => {
    test("should update internship and return 200", async () => {
      const res = await request(app)
        .put("/api/internships/int123")
        .send({ tittle: "Updated Title" });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Updated");
      expect(res.body.id).toBe("int123");
    });
  });

  // ── DELETE /api/internships/:id ─────────────────────────────────────────────
  describe("DELETE /api/internships/:id", () => {
    test("should delete internship and return 200", async () => {
      const res = await request(app)
        .delete("/api/internships/int123");

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Deleted");
      expect(res.body.id).toBe("int123");
    });
  });

  // ── GET /api/internships/my-internships ─────────────────────────────────────
  describe("GET /api/internships/my-internships", () => {
    test("should return organizations internship list", async () => {
      const res = await request(app)
        .get("/api/internships/my-internships");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.internships)).toBe(true);
      expect(res.body.count).toBe(0);
    });
  });

  // ── GET /api/internships/dashboard/stats ────────────────────────────────────
  describe("GET /api/internships/dashboard/stats", () => {
    test("should return dashboard statistics", async () => {
      const res = await request(app)
        .get("/api/internships/dashboard/stats");

      expect(res.statusCode).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats).toHaveProperty("totalInternships");
      expect(res.body.stats).toHaveProperty("activeInternships");
    });
  });

  // ── GET /api/internships/search ─────────────────────────────────────────────
  describe("GET /api/internships/search", () => {
    test("should return search results", async () => {
      const res = await request(app)
        .get("/api/internships/search");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.results)).toBe(true);
    });

    test("should accept keyword query param", async () => {
      const res = await request(app)
        .get("/api/internships/search?keyword=React");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("total");
    });

    test("should accept skills and location query params", async () => {
      const res = await request(app)
        .get("/api/internships/search?skills=React,Node.js&location=Colombo");

      expect(res.statusCode).toBe(200);
    });
  });

  // ── GET /api/internships/:id ────────────────────────────────────────────────
  describe("GET /api/internships/:id", () => {
    test("should return internship by id", async () => {
      const res = await request(app)
        .get("/api/internships/int123");

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe("int123");
    });
  });

  // ── PUT /api/internships/view/:id ───────────────────────────────────────────
  describe("PUT /api/internships/view/:id", () => {
    test("should increment view count", async () => {
      const res = await request(app)
        .put("/api/internships/view/int123");

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("View incremented");
    });
  });

});
