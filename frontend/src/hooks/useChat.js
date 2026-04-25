import { useState, useEffect, useRef, useCallback } from "react";

const TYPING_TIMEOUT = 2500;

export function useChat(socket, conversationId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  /* Join room & load initial messages */
  useEffect(() => {
    if (!socket || !conversationId) return;

    setLoading(true);
    setMessages([]);
    setTypingUsers({});

    socket.emit("conversation:join", { conversationId }, (res) => {
      setLoading(false);
      if (res?.ok) {
        setMessages(res.messages || []);
        setHasMore((res.messages?.length || 0) === 50);
        socket.emit("messages:read", { conversationId });
      } else {
        console.error("Failed to join conversation:", res?.error);
      }
    });
  }, [socket, conversationId]);

  /* Real-time event listeners */
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      if (String(msg.conversationId) !== String(conversationId)) return;
      setMessages((prev) => {
        if (prev.find((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
      if (document.visibilityState === "visible") {
        socket.emit("messages:read", { conversationId });
      }
    };

    const onTypingStart = ({ userId, name, conversationId: cid }) => {
      if (String(cid) !== String(conversationId)) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: name }));
    };

    const onTypingStop = ({ userId, conversationId: cid }) => {
      if (String(cid) !== String(conversationId)) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    const onRead = ({ conversationId: cid, userId, readAt }) => {
      if (String(cid) !== String(conversationId)) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.readBy?.some((r) => String(r.userId) === String(userId))) return m;
          return { ...m, readBy: [...(m.readBy || []), { userId, readAt }] };
        })
      );
    };

    socket.on("message:new", onNewMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("messages:read", onRead);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("messages:read", onRead);
    };
  }, [socket, conversationId]);

  // FIX: declare stopTyping before startTyping so no hoisting issues
  const stopTyping = useCallback(() => {
    if (!socket || !isTypingRef.current) return;
    isTypingRef.current = false;
    clearTimeout(typingTimerRef.current);
    socket.emit("typing:stop", { conversationId });
  }, [socket, conversationId]);

  const startTyping = useCallback(() => {
    if (!socket || isTypingRef.current) return;
    isTypingRef.current = true;
    socket.emit("typing:start", { conversationId });
  }, [socket, conversationId]);

  const handleInputChange = useCallback(() => {
    startTyping();
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, TYPING_TIMEOUT);
  }, [startTyping, stopTyping]);

  const sendMessage = useCallback(
    (content, { messageType = "text", applicationId } = {}) => {
      if (!socket || !content?.trim()) return;
      stopTyping();
      socket.emit("message:send", {
        conversationId,
        content: content.trim(),
        messageType,
        applicationId,
      });
    },
    [socket, conversationId, stopTyping]
  );

  const loadMore = useCallback(() => {
    if (!socket || !hasMore || messages.length === 0) return;
    const oldest = messages[0];
    socket.emit(
      "messages:fetch",
      { conversationId, before: oldest.createdAt, limit: 30 },
      (res) => {
        if (res?.ok && res.messages.length > 0) {
          setMessages((prev) => [...res.messages, ...prev]);
          setHasMore(res.messages.length === 30);
        } else {
          setHasMore(false);
        }
      }
    );
  }, [socket, conversationId, hasMore, messages]);

  return { messages, typingUsers, loading, hasMore, sendMessage, handleInputChange, loadMore };
}
