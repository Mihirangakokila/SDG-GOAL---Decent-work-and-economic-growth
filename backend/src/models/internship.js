import mongoose from 'mongoose';

const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  organization: {
    type: String,
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    skills: [String],
    education: {
      level: String,
      field: String,
    },
    location: {
      district: String,
      state: String,
      preferRural: {
        type: Boolean,
        default: false,
      },
    },
    experience: String,
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active',
  },
  applicantCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deadline: Date,
});

export default mongoose.model('Internship', internshipSchema);
