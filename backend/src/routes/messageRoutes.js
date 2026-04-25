/**
 * messageRoutes.js
 * REST endpoints as a fallback / supplement to Socket.IO:
 *   GET  /api/messages/conversations          – list all convos for the logged-in user
 *   GET  /api/messages/conversations/:id      – single convo + last 50 messages
 *   POST /api/messages/conversations          – create or find a convo with a user
 *   GET  /api/messages/conversations/:id/messages – paginated message history
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const router = express.Router();

// All routes require auth
router.use(protect);

/* ─ List conversations ─ */
router.get("/conversations", async (req, res) => {
  try {
    const userId = String(req.user._id);
    const convos = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    const enriched = convos.map((c) => ({
      ...c,
      unreadCount: c.unreadCounts?.[userId] || 0,
    }));

    res.json({ ok: true, conversations: enriched });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─ Create or find conversation ─ */
router.post("/conversations", async (req, res) => {
  try {
    const { targetUserId, applicationId, internshipId, internshipTitle } = req.body;
    const userId = String(req.user._id);

    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser)
      return res.status(404).json({ ok: false, error: "Target user not found" });

    let convo = await Conversation.findOne({
      "participants.userId": { $all: [userId, targetUserId] },
      ...(applicationId ? { applicationId } : {}),
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [
          { userId, name: req.user.name, role: req.user.role },
          { userId: targetUserId, name: targetUser.name, role: targetUser.role },
        ],
        applicationId: applicationId || null,
        internshipId: internshipId || null,
        internshipTitle: internshipTitle || null,
        unreadCounts: { [userId]: 0, [targetUserId]: 0 },
      });
    }

    res.json({ ok: true, conversation: convo });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─ Single conversation with messages ─ */
router.get("/conversations/:id", async (req, res) => {
  try {
    const userId = String(req.user._id);
    const convo = await Conversation.findById(req.params.id).lean();
    if (!convo) return res.status(404).json({ ok: false, error: "Not found" });

    const isMember = convo.participants.some((p) => String(p.userId) === userId);
    if (!isMember) return res.status(403).json({ ok: false, error: "Forbidden" });

    const messages = await Message.find({ conversationId: convo._id })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    res.json({ ok: true, conversation: convo, messages });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─ Paginated message history ─ */
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const userId = String(req.user._id);
    const convo = await Conversation.findById(req.params.id).lean();
    if (!convo) return res.status(404).json({ ok: false, error: "Not found" });

    const isMember = convo.participants.some((p) => String(p.userId) === userId);
    if (!isMember) return res.status(403).json({ ok: false, error: "Forbidden" });

    const { before, limit = 30 } = req.query;
    const query = { conversationId: req.params.id };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ ok: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
