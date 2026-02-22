import Internship from "../models/internship.js";

// Service function to create a new internship
export const createInternship = async (data, organizationId) => {
  const newInternship = await Internship.create({
    ...data,
    organizationId,
  });

  return newInternship;
};