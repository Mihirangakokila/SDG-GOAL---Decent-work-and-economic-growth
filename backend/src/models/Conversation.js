import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Exactly two participants for DM; expandable later
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: { type: String, required: true },
        role: {
          type: String,
          enum: ["youth", "organization", "admin"],
          required: true,
        },
      },
    ],

    // Optional link to a specific internship application
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      default: null,
    },
    internshipTitle: { type: String, default: null },

    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Unread counts per user
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure unique conversation per pair of users
conversationSchema.index(
  { "participants.userId": 1 },
  { unique: false }
);

export default mongoose.model("Conversation", conversationSchema);
