import { 
  createInternship ,
  updateInternship,
  deleteInternship,
  getInternshipByIdService,
  getMyInternshipsService,
  incrementViewCountService,
  getDashboardStatsService,
  searchInternshipsService,
  getNearbyInternshipsService
} from "../services/internshipService.js";
import YouthProfile from "../models/YouthProfile.js";


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
// Get all internships for the logged-in organization
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
// Get dashboard stats for the logged-in organization
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

// ════════════════════════════════════════════════════════════════════════════════
// GET NEARBY  GET /internships/nearby
// Protected — only youth role. Reads coordinates from their own profile.
// ════════════════════════════════════════════════════════════════════════════════
export const getNearbyInternshipsController = async (req, res) => {
  try {
    const userId = req.user._id;
    const radiusKm = Number(req.query.radius) || 50;
    const limit = Number(req.query.limit) || 10;

    // Load the youth's profile to get their saved coordinates
    const profile = await YouthProfile.findOne({ user: userId }).select("coordinates");

    if (
      !profile ||
      !profile.coordinates ||
      !Array.isArray(profile.coordinates.coordinates) ||
      profile.coordinates.coordinates.length < 2
    ) {
      // Profile has no geocoded location — return empty so frontend can handle gracefully
      return res.status(200).json({ internships: [], locationAvailable: false });
    }

    const [lng, lat] = profile.coordinates.coordinates;

    const internships = await getNearbyInternshipsService(lng, lat, radiusKm, limit);

    return res.status(200).json({
      internships,
      locationAvailable: true,
      center: { lng, lat },
    });
  } catch (error) {
    console.error("getNearbyInternshipsController error:", error);
    res.status(500).json({ message: error.message });
  }
};