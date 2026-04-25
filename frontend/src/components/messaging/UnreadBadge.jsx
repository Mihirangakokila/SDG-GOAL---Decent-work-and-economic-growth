import { useState, useEffect } from "react";
import { useSocketCtx } from "../../context/SocketContext";

export default function UnreadBadge() {
  const { socket, connected } = useSocketCtx();
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnread = () => {
    if (!socket) return;
    socket.emit("conversations:get", {}, (res) => {
      if (res?.ok) {
        const total = (res.conversations || []).reduce(
          (sum, c) => sum + (c.unreadCount || 0), 0
        );
        setTotalUnread(total);
      }
    });
  };

  useEffect(() => {
    if (!socket || !connected) return;
    fetchUnread();

    socket.on("conversation:updated", fetchUnread);
    socket.on("message:new", fetchUnread);

    return () => {
      socket.off("conversation:updated", fetchUnread);
      socket.off("message:new", fetchUnread);
    };
  }, [socket, connected]);

  if (totalUnread === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
      {totalUnread > 99 ? "99+" : totalUnread}
    </span>
  );
}
