import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const SocketContext = createContext(null);

export function SocketProvider({ children, user }) {
  const socketRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    if (socketRef.current?.connected) return;

    // Determine if we're connecting to a remote HTTPS server or local dev
    const isRemote = SOCKET_URL.startsWith("https://");

    const s = io(SOCKET_URL, {
      auth: { token },
      // For HTTPS Railway deployment, use polling first then upgrade to websocket
      // For local dev (http://), websocket works directly
      transports: isRemote ? ["polling", "websocket"] : ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      // Required for cross-origin requests to Railway
      withCredentials: false,
    });

    socketRef.current = s;

    s.on("connect", () => {
      console.log("[Socket] Connected:", s.id);
      setConnected(true);
      setSocket(s);
    });

    s.on("disconnect", (reason) => {
      console.warn("[Socket] Disconnected:", reason);
      setConnected(false);
    });

    s.on("connect_error", (err) => {
      console.warn("[Socket] connect_error:", err.message);
    });

    s.on("reconnect", () => {
      setConnected(true);
      setSocket(s);
    });

    s.on("user:online", ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    s.on("user:offline", ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    s.on("application:statusChanged", (data) => {
      const icons = { Accepted: "✅", Rejected: "❌", "Under Review": "🔍", Applied: "📋" };
      toast(`${icons[data.status] || "📋"} Application status: ${data.status}`, {
        duration: 5000,
        style: {
          background: data.status === "Accepted" ? "#ecfdf5" : "#fff",
          border: `1px solid ${data.status === "Accepted" ? "#10b981" : "#e2e8f0"}`,
        },
      });
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketCtx() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketCtx must be used within SocketProvider");
  return ctx;
}
