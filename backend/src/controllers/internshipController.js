import { createInternship } from "../services/internshipService.js";

// Controller to handle internship creation
export const createInternshipController = async (req, res) => {
  try{
    const internship = await createInternship(
      req.body,
      req.user.id // Assuming req.user is set by authentication middleware
    );
    res.status(201).json(internship);
  } catch(error){
    res.status(500).json({message :  error.message});
  }
    
  };
  