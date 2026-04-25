import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

const onlineUsers = new Map();

function addOnlineUser(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnlineUser(userId, socketId) {
  if (!onlineUsers.has(userId)) return;
  const sockets = onlineUsers.get(userId);
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
}

export function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}

function emitToUser(io, userId, event, data) {
  const sockets = onlineUsers.get(String(userId));
  if (!sockets) return;
  for (const sid of sockets) {
    io.to(sid).emit(event, data);
  }
}

// FIX: Mongoose Map becomes a plain object after .lean() — use plain object access
function getUnreadCount(convo, userId) {
  if (!convo.unreadCounts) return 0;
  // .lean() converts Map to plain object, so use bracket notation
  if (typeof convo.unreadCounts.get === "function") {
    return convo.unreadCounts.get(String(userId)) || 0;
  }
  return convo.unreadCounts[String(userId)] || 0;
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  /* Auth middleware */
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token;

      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).lean();
      if (!user) return next(new Error("User not found"));

      socket.user = {
        id: String(user._id),
        name: user.name,
        role: user.role,
      };
      next();
    } catch (err) {
      next(new Error("Invalid token: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const { id: userId, name, role } = socket.user;

    addOnlineUser(userId, socket.id);
    socket.join(`user:${userId}`);
    io.emit("user:online", { userId, name });

    /* 1. Get conversation list */
    socket.on("conversations:get", async (_, ack) => {
      try {
        const convos = await Conversation.find({
          "participants.userId": userId,
        })
          .sort({ lastMessageAt: -1 })
          .lean();

        const enriched = convos.map((c) => ({
          ...c,
          unreadCount: getUnreadCount(c, userId),
        }));

        if (typeof ack === "function") ack({ ok: true, conversations: enriched });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    /* 2. Open / create a conversation */
    socket.on("conversation:open", async ({ targetUserId, applicationId, internshipId, internshipTitle }, ack) => {
      try {
        const targetUser = await User.findById(targetUserId).lean();
        if (!targetUser) throw new Error("Target user not found");

        let convo = await Conversation.findOne({
          "participants.userId": { $all: [userId, targetUserId] },
          ...(applicationId ? { applicationId } : {}),
        });

        if (!convo) {
          convo = await Conversation.create({
            participants: [
              { userId, name, role },
              { userId: targetUserId, name: targetUser.name, role: targetUser.role },
            ],
            applicationId: applicationId || null,
            internshipId: internshipId || null,
            internshipTitle: internshipTitle || null,
            unreadCounts: { [userId]: 0, [targetUserId]: 0 },
          });
        }

        socket.join(`conv:${convo._id}`);

        if (typeof ack === "function") ack({ ok: true, conversation: convo });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    /* 3. Join an existing conversation room */
    socket.on("conversation:join", async ({ conversationId }, ack) => {
      try {
        const convo = await Conversation.findById(conversationId).lean();
        if (!convo) throw new Error("Conversation not found");

        const isMember = convo.participants.some((p) => String(p.userId) === userId);
        if (!isMember) throw new Error("Not a member of this conversation");

        socket.join(`conv:${conversationId}`);

        const messages = await Message.find({ conversationId })
          .sort({ createdAt: 1 })
          .limit(50)
          .lean();

        if (typeof ack === "function") ack({ ok: true, messages });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    /* 4. Send message */
    socket.on("message:send", async ({ conversationId, content, messageType = "text", applicationId }, ack) => {
      try {
        if (!content?.trim()) throw new Error("Empty message");

        // FIX: do NOT use .lean() here so we can call .get() on the Map
        const convo = await Conversation.findById(conversationId);
        if (!convo) throw new Error("Conversation not found");

        const isMember = convo.participants.some((p) => String(p.userId) === userId);
        if (!isMember) throw new Error("Not authorised");

        const message = await Message.create({
          conversationId,
          senderId: userId,
          senderName: name,
          senderRole: role,
          content: content.trim(),
          messageType,
          applicationId: applicationId || null,
          readBy: [{ userId, readAt: new Date() }],
        });

        // FIX: safely read from Map (non-lean document has real .get())
        const updateUnread = {};
        convo.participants.forEach((p) => {
          const pid = String(p.userId);
          if (pid !== userId) {
            const current = typeof convo.unreadCounts?.get === "function"
              ? (convo.unreadCounts.get(pid) || 0)
              : (convo.unreadCounts?.[pid] || 0);
            updateUnread[`unreadCounts.${pid}`] = current + 1;
          }
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: content.trim().substring(0, 100),
          lastMessageAt: new Date(),
          lastMessageSenderId: userId,
          ...updateUnread,
        });

        // Broadcast to room
        io.to(`conv:${conversationId}`).emit("message:new", message);

        // Push conversation update to all participants
        convo.participants.forEach((p) => {
          emitToUser(io, p.userId, "conversation:updated", {
            conversationId,
            lastMessage: content.trim().substring(0, 100),
            lastMessageAt: message.createdAt,
          });
        });

        if (typeof ack === "function") ack({ ok: true, message });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    /* 5. Typing indicators */
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", { userId, name, conversationId });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:stop", { userId, conversationId });
    });

    /* 6. Read receipts */
    socket.on("messages:read", async ({ conversationId }, ack) => {
      try {
        const now = new Date();

        await Message.updateMany(
          { conversationId, "readBy.userId": { $ne: userId } },
          { $push: { readBy: { userId, readAt: now } } }
        );

        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCounts.${userId}`]: 0,
        });

        socket.to(`conv:${conversationId}`).emit("messages:read", {
          conversationId,
          userId,
          readAt: now,
        });

        if (typeof ack === "function") ack({ ok: true });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    /* 7. Load older messages */
    socket.on("messages:fetch", async ({ conversationId, before, limit = 30 }, ack) => {
      try {
        const query = { conversationId };
        if (before) query.createdAt = { $lt: new Date(before) };

        const messages = await Message.find(query)
          .sort({ createdAt: -1 })
          .limit(Number(limit))
          .lean();

        if (typeof ack === "function") ack({ ok: true, messages: messages.reverse() });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    /* 8. Online status query */
    socket.on("users:online", ({ userIds }, ack) => {
      const result = {};
      userIds.forEach((id) => { result[id] = onlineUsers.has(String(id)); });
      if (typeof ack === "function") ack({ ok: true, onlineStatus: result });
    });

    /* Disconnect */
    socket.on("disconnect", () => {
      removeOnlineUser(userId, socket.id);
      if (!onlineUsers.has(userId)) {
        io.emit("user:offline", { userId, lastSeen: new Date() });
      }
    });
  });

  return io;
}

export function pushApplicationUpdate(io, applicantId, data) {
  emitToUser(io, applicantId, "application:statusChanged", data);
}
