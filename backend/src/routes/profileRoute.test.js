import request from "supertest";
import express from "express";

const app = express();
app.use(express.json());

// Dummy route (replace with your real route if needed)
app.get("/api/profile", (req, res) => {
  res.status(200).json({ message: "Profile fetched" });
});

app.post("/api/profile", (req, res) => {
  res.status(201).json({ message: "Profile created" });
});

describe("Profile API", () => {

  test("GET /api/profile", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.statusCode).toBe(200);
  });

  test("POST /api/profile", async () => {
    const res = await request(app)
      .post("/api/profile")
      .send({ name: "John" });

    expect(res.statusCode).toBe(201);
  });

});