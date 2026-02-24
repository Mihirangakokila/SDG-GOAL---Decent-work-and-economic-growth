
import Internship from "../models/internship.js";

// Service function to create a new internship
export const createInternship = async (data, organizationId) => {
  const internship = await Internship.create({
    ...data,
    organizationId,
  });

  return internship;
};

// Service function to update an existing internship
export const updateInternship = async (
  data, 
  internshipId,
  organizationId
) => {
  const internship = await Internship.findOneAndUpdate(
    {_id : internshipId, organizationId},
    data,
    {new: true}
  );
  return internship;
};

//Service function to delete an internship
export const deleteInternship = async (
  internshipId,
   organizationId
  ) => {
  const internship = await Internship.findOneAndDelete(
    {_id : internshipId, organizationId}
  );
  return internship;
};

//Get Single Internship
export const getInternshipByIdService = async (internshipId) => {
  const internship = await Internship.findById(internshipId);
  
  if (!internship) {
    throw new Error("Internship not found");
  }

  return internship;
};

//Get All Internships
export const getMyInternshipsService = async (organizationId,status) => {
  const filter = { organizationId };

  if(status){
    filter.status = status;
  }

  const [internships,count] = await Promise.all([
    (await Internship.find(filter)).toSorted({createdAt : -1}),
    Internship.countDocuments(filter)
  ]);
  return {
    internships,
    count
  };
};