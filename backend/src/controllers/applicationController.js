import Application from '../models/Application.js';
import Internship from '../models/Internship.js';
import User from '../models/User.js';
import { calculateEligibilityScore } from '../services/matchingService.js';
import { PDFParse } from 'pdf-parse';



// POST /api/applications/apply/:internshipId
export const applyForInternship = async (req, res) => {
  try {
    const { youthId, name, email, phoneNumber } = req.body;
    const { internshipId } = req.params;

    if (!youthId) {
      return res.status(400).json({ message: 'youthId is required' });
    }

    if (!name || !email || !phoneNumber) {
      return res.status(400).json({
        message: 'Name, email and phone number are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'CV upload is required (PDF only)'
      });
    }

    const cvUrl = req.file.path;

    // ✅ FIX: declare variable correctly
    let extractedText = '';

    try {
      const response = await fetch(cvUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      extractedText = result.text || '';

      console.log('EXTRACTED TEXT LENGTH:', extractedText.length);
      console.log('EXTRACTED TEXT:', extractedText);

    } catch (err) {
      console.error('PDF extraction failed:', err.message);
    }

    // Internship validation
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    if (internship.status !== 'active') {
      return res.status(400).json({
        message: 'This internship is not active'
      });
    }

    // Duplicate check
    const existingApplication = await Application.findOne({
      youthId,
      internshipId
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied'
      });
    }

    // User validation
    const youth = await User.findById(youthId);
    if (!youth) {
      return res.status(404).json({ message: 'Youth not found' });
    }

    if (youth.role !== 'youth') {
      return res.status(400).json({
        message: 'User is not youth'
      });
    }

    // Score calculation
    const score = calculateEligibilityScore(
      youth.profile,
      internship.requirements
    );

    // ✅ CREATE APPLICATION
    const application = await Application.create({
      youthId,
      internshipId,
      name,
      email,
      phoneNumber,
      cvUrl,
      //cvText: extractedText,
      eligibilityScore: score.total,
      scoreBreakdown: score.breakdown,
      status: 'Applied'
    });

    // Increment applicant count
    await Internship.findByIdAndUpdate(internshipId, {
      $inc: { applicantCount: 1 }
    });

    res.status(201).json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error in applyForInternship:', error);
    res.status(500).json({ message: error.message });
  }
};


export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNumber } = req.body;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update text fields if provided
    if (name !== undefined) application.name = name;
    if (email !== undefined) application.email = email;
    if (phoneNumber !== undefined) application.phoneNumber = phoneNumber;

    // Update CV if uploaded
    if (req.file) {
      application.cvUrl = req.file.path; // assuming Cloudinary returns path
    }

    await application.save();

    res.status(200).json({
      message: "Application updated successfully",
      application
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// @desc    Get youth's applications
// @route   GET /api/applications/my-applications
export const getMyApplications = async (req, res) => {
  try {
    const youthId = req.query.youthId;

    if (!youthId) {
      return res.status(400).json({ message: 'youthId is required as query parameter' });
    }

    const applications = await Application.find({ youthId })
      .populate({
        path: 'internshipId',
        select: 'title organization description requirements status deadline',
        populate: {
          path: 'organizationId',
          select: 'name email'
        }
      })
      .sort({ appliedDate: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check application status
// @route   GET /api/applications/check/:internshipId
export const checkApplicationStatus = async (req, res) => {
  try {
    const youthId = req.query.youthId;
    const { internshipId } = req.params;

    if (!youthId) {
      return res.status(400).json({ message: 'youthId is required as query parameter' });
    }

    const application = await Application.findOne({
      youthId,
      internshipId
    });

    res.json({
      success: true,
      hasApplied: !!application,
      application: application || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('youthId', 'name email profile')
      .populate('internshipId', 'title organization description');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
export const withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'Applied') {
      return res.status(400).json({ 
        message: `Cannot withdraw application with status: ${application.status}` 
      });
    }

    await application.deleteOne();

    // Decrement applicant count
    await Internship.findByIdAndUpdate(application.internshipId, {
      $inc: { applicantCount: -1 }
    });

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};