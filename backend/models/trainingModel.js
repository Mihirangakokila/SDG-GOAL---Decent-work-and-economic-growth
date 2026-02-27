import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    requiredSkills: [{ type: String, trim: true }],
    duration: { type: String, trim: true },
    mode: {
      type: String,
      enum: ['Online', 'Physical'],
      required: true,
    },
    location: { type: String, trim: true },
    certificateAvailable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Active', 'Closed', 'Inactive'],
      default: 'Active',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Training = mongoose.model('Training', trainingSchema);

export default Training;

