import { 
  createInternship ,
  updateInternship,
  deleteInternship,
  getInternshipByIdService,
  getMyInternshipsService,
  incrementViewCountService,
  getDashboardStatsService,
  searchInternshipsService
} from "../services/internshipService.js";

// Controller to handle internship creation
// Requires: Authentication (protect middleware) and organization role
// The req.user.id is the authenticated organization's User ID
export const createInternshipController = async (req, res) => {
  try{
    const internship = await createInternship(
      req.body,
      req.user._id // Using authenticated organization's User ID
    );
    res.status(201).json(internship);
  } catch(error){
    res.status(500).json({message :  error.message});
  }
    
  };

  // Controller to handle internship update
  // Requires: Authentication (protect middleware) and organization role
export const updateInternshipController = async (req, res) => {
  try{  
    const internship = await updateInternship(
      req.body,
      req.params.id,
      req.user._id,
    );  

    res.json(internship);
  } catch(error){
    res.status(500).json({message : error.message});
  }
};

// Controller to handle internship deletion
// Requires: Authentication (protect middleware) and organization role
export const deleteInternshipController = async (req, res) => {
  try{
    const internship = await deleteInternship(
      req.params.id,
      req.user._id
    );  
    res.json({message : "Internship deleted successfully"});
  } catch(error){
    res.status(500).json({message : error.message});
  } 
};

//Get Single Internship
export const getInternshipByIdController = async (req, res) => {
  try {
    const internship = await getInternshipByIdService(req.params.id);
    res.json(internship);
  } catch(error){
    res.status(500).json({message : error.message});
  }
};

// Requires: Authentication (protect middleware) and organization role
export const getMyInternships  = async (req, res) => {
  try {

    const {status} = req.query;

    const result = await getMyInternshipsService(req.user._id, status);

    res.json(result);
  }
    catch(error){ 
    res.status(500).json({message : error.message});
  }
};

//Get increament view count
export const incrementViewCountController = async (req, res) => {
  try {
    const internship = await incrementViewCountService(req.params.id);

    res.json({
      success: true,
      data: internship
    });

  } catch(error){
    res.status(500).json({
      success: false,
      message : error.message
    });
  }   
};

// Requires: Authentication (protect middleware) and organization role
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await getDashboardStatsService(
      req.user._id
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Search Internships
export const searchInternshipsController = async (req, res) => {
  try {
    const result = await searchInternshipsService(req.query);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
