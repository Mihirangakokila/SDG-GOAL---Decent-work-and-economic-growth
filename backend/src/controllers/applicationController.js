import Application from '../models/Application.js';
import Internship from '../models/internship.js';
import User from '../models/User.js';
import { calculateEligibilityScore } from '../services/matchingService.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

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

    // Get file from req.files (flexibleUpload uses .any())
    const file = req.files && req.files.length > 0 ? req.files[0] : null;

    if (!file) {
      return res.status(400).json({
        message: 'CV upload is required (PDF only)'
      });
    }

    const cvUrl = file.path;

    // Extract text from the uploaded PDF
    let extractedText = '';

    try {
      const response = await fetch(cvUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += pageText + ' ';
      }

      // Validate extracted text
      const trimmedText = extractedText.trim();
      if (trimmedText.length < 100) {
        console.warn('⚠️ Extracted text too short or empty');
        extractedText = ''; // Set to empty to trigger 0 score
      }

      console.log('EXTRACTED TEXT LENGTH:', extractedText.length);
      console.log('EXTRACTED TEXT (first 500 chars):', extractedText.substring(0, 500));

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
    const score = await calculateEligibilityScore(
      youth.profile,
      internship.requirements,
      extractedText
    );

    // ✅ CREATE APPLICATION
    const application = await Application.create({
      youthId,
      internshipId,
      name,
      email,
      phoneNumber,
      cvUrl,
      cvText: extractedText,
      eligibilityScore: score.total,
      scoreBreakdown: score.breakdown,
      aiReasoning: score.aiReasoning || '',
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

    const application = await Application.findById(id).populate('youthId').populate('internshipId');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update text fields if provided
    if (name !== undefined) application.name = name;
    if (email !== undefined) application.email = email;
    if (phoneNumber !== undefined) application.phoneNumber = phoneNumber;

    // Update CV if uploaded (flexibleUpload uses .any())
    if (req.files && req.files.length > 0) {
      application.cvUrl = req.files[0].path; // assuming Cloudinary returns path
      
      let extractedText = '';
      try {
        const response = await fetch(application.cvUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            extractedText += pageText + ' ';
          }

          const trimmedText = extractedText.trim();
          if (trimmedText.length < 100) {
            extractedText = ''; // Set to empty to trigger 0 score
          }
        }
      } catch (err) {
        console.error('PDF extraction failed during update:', err.message);
      }

      application.cvText = extractedText;

      // Recalculate score if youth and internship are populated properly
      if (application.youthId && application.internshipId) {
        const score = await calculateEligibilityScore(
          application.youthId.profile || {},
          application.internshipId.requirements || {},
          extractedText
        );
        application.eligibilityScore = score.total;
        application.scoreBreakdown = score.breakdown;
        application.aiReasoning = score.aiReasoning || '';
      }
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