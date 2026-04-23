import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import { useSocketCtx } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

export default function MessageButton({
  targetUserId,
  targetUserName,
  applicationId,
  internshipId,
  internshipTitle,
  variant = "primary",
  size = "md",
  className = "",
}) {
  const { socket, connected } = useSocketCtx();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!user) return null;
  if (String(user._id || user.id) === String(targetUserId)) return null;
  if (!targetUserId) return null;

  const handleClick = () => {
    if (!socket || !connected) {
      console.warn("Socket not connected yet");
      return;
    }

    setLoading(true);
    socket.emit(
      "conversation:open",
      { targetUserId, applicationId, internshipId, internshipTitle },
      (res) => {
        setLoading(false);
        if (res?.ok && res.conversation) {
          navigate(`/messages/${res.conversation._id}`);
        } else {
          console.error("Failed to open conversation:", res?.error);
        }
      }
    );
  };

  const sizeClasses = { sm: "text-xs px-2.5 py-1.5 gap-1", md: "text-sm px-3.5 py-2 gap-1.5" };
  const variantClasses = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm disabled:opacity-50",
    outline: "border border-emerald-500 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50",
    ghost: "text-emerald-600 hover:bg-emerald-50 disabled:opacity-50",
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || !connected}
      title={connected ? `Message ${targetUserName}` : "Connecting..."}
      className={`inline-flex items-center rounded-lg font-medium transition-colors
        ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {loading
        ? <Loader2 className={`animate-spin ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`} />
        : <MessageSquare className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      }
      {loading ? "Opening..." : `Message ${targetUserName?.split(" ")[0] || ""}`}
    </button>
  );
}
