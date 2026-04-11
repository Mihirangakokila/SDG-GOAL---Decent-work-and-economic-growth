import { describe, test, expect } from "@jest/globals";

// Dummy function (replace with your real function if available)
const createProfile = (data) => {
  return { id: 1, ...data };
};

describe("Profile Service", () => {
  test("should create profile", () => {
    const result = createProfile({ name: "John" });
    expect(result.name).toBe("John");
  });
});