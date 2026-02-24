import { 
  createInternship ,
  updateInternship,
  deleteInternship,
  getInternshipByIdService,
  getMyInternshipsService,
  incrementViewCountService,
  getDashboardStatsService
} from "../services/internshipService.js";

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

  // Controller to handle internship update
export const updateInternshipController = async (req, res) => {
  try{  
    const internship = await updateInternship(
      req.body,
      req.params.id,
      req.user.id,
    );  

    res.json(internship);
  } catch(error){
    res.status(500).json({message : error.message});
  }
};

// Controller to handle internship deletion
export const deleteInternshipController = async (req, res) => {
  try{
    const internship = await deleteInternship(
      req.params.id,
      req.user.id
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

//Get My Internships (Organization)
export const getMyInternships  = async (req, res) => {
  try {

    const {status} = req.query;

    const result = await getMyInternshipsService(req.user.id,status);

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

// ✅ Dashboard Analytics
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await getDashboardStatsService(
      req.user.id
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