import Application from '../models/Application.js';
import Internship from '../models/internship.js';
import User from '../models/User.js';
import { calculateEligibilityScore } from '../services/matchingService.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { sendNewApplicationNotification } from '../utils/emailService.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const extractTextFromPDF = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  let text = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + ' ';
  }

  const trimmed = text.trim();
  if (trimmed.length < 100) {
    console.warn('⚠️ Extracted text too short or empty');
    return '';
  }
  return trimmed;
};

const buildRequirements = (internship) => ({
  skills:    internship.requiredSkills,
  education: { level: internship.requiredEducation },
  location:  { district: internship.location },
});

// ── POST /api/applications/apply/:internshipId ────────────────────────────────

export const applyForInternship = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const { internshipId } = req.params;
    const youthId = req.user.id;

    if (!name || !email || !phoneNumber) {
      return res.status(400).json({ message: 'Name, email and phone number are required' });
    }

    const file = req.files && req.files.length > 0 ? req.files[0] : null;
    if (!file) {
      return res.status(400).json({ message: 'CV upload is required (PDF only)' });
    }

    const cvUrl = file.path;

    let extractedText = '';
    try {
      extractedText = await extractTextFromPDF(cvUrl);
    } catch (err) {
      console.error('PDF extraction failed:', err.message);
    }

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    if (internship.status !== 'Active') {
      return res.status(400).json({ message: 'This internship is not active' });
    }

    const existingApplication = await Application.findOne({ youthId, internshipId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied' });
    }

    const youth = req.user;
    if (youth.role !== 'youth') {
      return res.status(400).json({ message: 'User is not youth' });
    }

    const score = await calculateEligibilityScore(
      youth.profile,
      buildRequirements(internship),
      extractedText
    );

    console.log(`📊 Final score for ${name}: ${score.total} | Reasoning: ${score.aiReasoning}`);

    const application = await Application.create({
      youthId,
      internshipId,
      name,
      email,
      phoneNumber,
      cvUrl,
      cvText:           extractedText,
      eligibilityScore: score.total,
      scoreBreakdown:   score.breakdown,
      aiReasoning:      score.aiReasoning || '',
      status:           'Applied',
    });

    await Internship.findByIdAndUpdate(internshipId, { $inc: { totalapplicants: 1 } });

    try {
      const orgUser = await User.findById(internship.organizationId).select('email name');
      if (orgUser?.email) {
        await sendNewApplicationNotification(
          orgUser.email,
          orgUser.name,
          internship.tittle,
          name,
          email
        );
      }
    } catch (emailErr) {
      console.error('Failed to send application notification email:', emailErr.message);
    }

    res.status(201).json({ success: true, data: application });

  } catch (error) {
    console.error('Error in applyForInternship:', error);
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/applications/:id ─────────────────────────────────────────────────

export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNumber } = req.body;

    const application = await Application.findById(id)
      .populate('youthId')
      .populate('internshipId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.youthId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    if (name        !== undefined) application.name        = name;
    if (email       !== undefined) application.email       = email;
    if (phoneNumber !== undefined) application.phoneNumber = phoneNumber;

    if (req.files && req.files.length > 0) {
      application.cvUrl = req.files[0].path;

      let extractedText = '';
      try {
        extractedText = await extractTextFromPDF(application.cvUrl);
      } catch (err) {
        console.error('PDF extraction failed during update:', err.message);
      }

      application.cvText = extractedText;

      if (application.youthId && application.internshipId) {
        const score = await calculateEligibilityScore(
          application.youthId.profile || {},
          buildRequirements(application.internshipId),
          extractedText
        );

        console.log(`📊 Updated score: ${score.total} | Reasoning: ${score.aiReasoning}`);

        application.eligibilityScore = score.total;
        application.scoreBreakdown   = score.breakdown;
        application.aiReasoning      = score.aiReasoning || '';
      }
    }

    await application.save();

    res.status(200).json({ message: 'Application updated successfully', application });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/applications/my ──────────────────────────────────────────────────

export const getMyApplications = async (req, res) => {
  try {
    const youthId = req.user.id;

    const applications = await Application.find({ youthId })
      .populate({
        path: 'internshipId',
        select: 'tittle organizationId description requiredSkills requiredEducation location status',
        populate: {
          path: 'organizationId',
          select: 'name email organizationName',
        },
      })
      .sort({ appliedDate: -1 });

    res.json({ success: true, count: applications.length, data: applications });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/applications/status/:internshipId ────────────────────────────────

export const checkApplicationStatus = async (req, res) => {
  try {
    const youthId = req.user.id;
    const { internshipId } = req.params;

    const application = await Application.findOne({ youthId, internshipId });

    res.json({ success: true, hasApplied: !!application, application: application || null });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/applications/:id ─────────────────────────────────────────────────

export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('youthId', 'name email profile')
      .populate('internshipId', 'title organization description');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const isOwner = application.youthId._id.toString() === req.user.id;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'organization';

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json({ success: true, data: application });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /api/applications/:id ──────────────────────────────────────────────

export const withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.youthId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to withdraw this application' });
    }

    if (application.status !== 'Applied') {
      return res.status(400).json({
        message: `Cannot withdraw application with status: ${application.status}`,
      });
    }

    await application.deleteOne();

    await Internship.findByIdAndUpdate(application.internshipId, {
      $inc: { totalapplicants: -1 },
    });

    res.json({ success: true, message: 'Application withdrawn successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/applications/internship/:internshipId ────────────────────────────────
export const getApplicationsByInternship = async (req, res) => {
  try {
    const { internshipId } = req.params
    const applications = await Application.find({ internshipId })
      .select('name email phoneNumber status eligibilityScore appliedDate cvUrl')
      .sort({ appliedDate: -1 })
    res.json({ success: true, data: applications })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}