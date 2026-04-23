import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MessageSquare, Send, ChevronLeft, Check,
  CheckCheck, Circle, Loader2, RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocketCtx } from "../context/SocketContext";
import { useChat } from "../hooks/useChat";
import { format, isToday, isYesterday } from "date-fns";

function formatMsgTime(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "dd MMM, HH:mm");
}

function formatConvoTime(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd MMM");
}

function roleBadge(role) {
  const map = {
    organization: { label: "HR", bg: "bg-blue-100 text-blue-700" },
    youth: { label: "Student", bg: "bg-green-100 text-green-700" },
    admin: { label: "Admin", bg: "bg-purple-100 text-purple-700" },
  };
  const { label, bg } = map[role] || { label: role, bg: "bg-gray-100 text-gray-600" };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${bg}`}>{label}</span>;
}

function ConversationItem({ convo, isActive, currentUserId, onlineUsers, onClick }) {
  const other = convo.participants?.find((p) => String(p.userId) !== currentUserId);
  const isOnline = other && onlineUsers.has(String(other.userId));
  const unread = convo.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100
        ${isActive ? "bg-emerald-50 border-l-4 border-l-emerald-500" : ""}`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
          {other?.name?.[0]?.toUpperCase() || "?"}
        </div>
        {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-sm text-gray-900 truncate">{other?.name || "Unknown"}</span>
            {other?.role && roleBadge(other.role)}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{formatConvoTime(convo.lastMessageAt)}</span>
        </div>
        {convo.internshipTitle && (
          <p className="text-[10px] text-emerald-600 truncate mt-0.5">📋 {convo.internshipTitle}</p>
        )}
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-gray-500 truncate">{convo.lastMessage || "No messages yet"}</p>
          {unread > 0 && (
            <span className="flex-shrink-0 ml-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMine, isLastFromSender }) {
  const readByOther = msg.readBy?.some((r) => String(r.userId) !== String(msg.senderId));
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm
        ${isMine ? "bg-emerald-500 text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"}`}>
        {!isMine && <p className="text-[10px] font-semibold text-emerald-600 mb-0.5">{msg.senderName}</p>}
        {msg.messageType === "application_update" && (
          <div className={`text-[10px] font-semibold mb-1 ${isMine ? "text-emerald-100" : "text-emerald-600"}`}>
            📋 Application Update
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? "text-emerald-100" : "text-gray-400"}`}>
          <span className="text-[10px]">{formatMsgTime(msg.createdAt)}</span>
          {isMine && isLastFromSender && (readByOther ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
        </div>
      </div>
    </div>
  );
}

function TypingBubble({ names }) {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm flex items-center gap-2">
        <span className="text-xs text-gray-500 italic">{names.join(", ")} {names.length === 1 ? "is" : "are"} typing</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      </div>
    </div>
  );
}

function ChatThread({ socket, conversationId, currentUserId, onlineUsers, otherUser }) {
  const { messages, typingUsers, loading, hasMore, sendMessage, handleInputChange, loadMore } =
    useChat(socket, conversationId);

  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isOnline = otherUser && onlineUsers.has(String(otherUser.userId));
  const typingNames = Object.values(typingUsers);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            {otherUser?.name?.[0]?.toUpperCase() || "?"}
          </div>
          {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            {otherUser?.name || "Loading..."}
            {otherUser?.role && roleBadge(otherUser.role)}
          </p>
          <p className="text-xs text-gray-500">{isOnline ? "🟢 Online" : "⚪ Offline"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-0.5">
        {hasMore && (
          <div className="flex justify-center mb-3">
            <button onClick={loadMore} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Load older messages
            </button>
          </div>
        )}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMine = String(msg.senderId) === currentUserId;
          const isLast = idx === messages.length - 1 || String(messages[idx + 1]?.senderId) !== String(msg.senderId);
          return <MessageBubble key={msg._id} msg={msg} isMine={isMine} isLastFromSender={isLast} />;
        })}
        {typingNames.length > 0 && <TypingBubble names={typingNames} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); handleInputChange(); }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 max-h-32 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagingPage() {
  const { user } = useAuth();
  const { socket, connected, onlineUsers } = useSocketCtx();
  const { conversationId: paramConvoId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(paramConvoId || null);
  const [loadingConvos, setLoadingConvos] = useState(false);

  const currentUserId = String(user?._id || user?.id || "");

  // FIX: use socket directly from context (now reactive state, not stale ref)
  const loadConversations = useCallback(() => {
    if (!socket) return;
    setLoadingConvos(true);
    socket.emit("conversations:get", {}, (res) => {
      setLoadingConvos(false);
      if (res?.ok) setConversations(res.conversations || []);
    });
  }, [socket]);

  // Load when socket becomes available or reconnects
  useEffect(() => {
    if (socket && connected) loadConversations();
  }, [socket, connected, loadConversations]);

  // Update sidebar on new messages
  useEffect(() => {
    if (!socket) return;
    const handler = ({ conversationId, lastMessage, lastMessageAt }) => {
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(conversationId)
            ? { ...c, lastMessage, lastMessageAt }
            : c
        )
      );
    };
    socket.on("conversation:updated", handler);
    return () => socket.off("conversation:updated", handler);
  }, [socket]);

  // Sync URL
  useEffect(() => {
    if (activeConvoId) navigate(`/messages/${activeConvoId}`, { replace: true });
  }, [activeConvoId, navigate]);

  const activeConvo = conversations.find((c) => String(c._id) === String(activeConvoId));
  const otherUser = activeConvo?.participants?.find((p) => String(p.userId) !== currentUserId);

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-gray-200 bg-white ${activeConvoId ? "hidden md:flex w-80" : "flex w-full md:w-80"}`}>
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-gray-900">Messages</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className={`w-2 h-2 ${connected ? "text-green-400 fill-green-400" : "text-gray-300 fill-gray-300"}`} />
            <span className="text-xs text-gray-500">{connected ? "Connected" : "Connecting…"}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvos && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            </div>
          )}
          {!loadingConvos && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1 text-center px-6">
                Start a conversation from an application or internship page.
              </p>
            </div>
          )}
          {conversations.map((c) => (
            <ConversationItem
              key={c._id}
              convo={c}
              isActive={String(c._id) === String(activeConvoId)}
              currentUserId={currentUserId}
              onlineUsers={onlineUsers}
              onClick={() => setActiveConvoId(String(c._id))}
            />
          ))}
        </div>
      </aside>

      {/* Main chat */}
      <main className={`flex-1 flex flex-col ${activeConvoId ? "flex" : "hidden md:flex"}`}>
        {activeConvoId ? (
          <>
            <button
              className="md:hidden flex items-center gap-1 px-3 py-2 text-sm text-emerald-600 border-b border-gray-200 hover:bg-gray-50"
              onClick={() => setActiveConvoId(null)}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {socket ? (
              <ChatThread
                socket={socket}
                conversationId={activeConvoId}
                currentUserId={currentUserId}
                onlineUsers={onlineUsers}
                otherUser={otherUser}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="ml-2 text-sm text-gray-500">Connecting to chat...</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-200" />
            <p className="text-lg font-medium text-gray-500">Select a conversation</p>
            <p className="text-sm mt-1 text-center max-w-xs">
              Choose a conversation from the sidebar or start one from an application page.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
