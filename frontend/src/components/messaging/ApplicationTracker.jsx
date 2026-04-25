/**
 * ApplicationTracker.jsx
 * Displays live application status with real-time Socket.IO updates.
 * 
 * Drop into MyApplicationsPage.jsx to replace static status badges.
 *
 * Props:
 *  application – the application object from the API
 */

import { useState, useEffect } from "react";
import { useSocketCtx } from "../../context/SocketContext";
import { CheckCircle2, Clock, XCircle, FileText, Zap } from "lucide-react";

const STATUS_CONFIG = {
  Applied: {
    label: "Applied",
    icon: FileText,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-400",
  },
  "Under Review": {
    label: "Under Review",
    icon: Clock,
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    dot: "bg-yellow-400",
  },
  Accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
  },
  Rejected: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-400",
  },
};

const STEPS = ["Applied", "Under Review", "Accepted"];

export default function ApplicationTracker({ application }) {
  const { socket } = useSocketCtx();
  const [status, setStatus] = useState(application?.status || "Applied");
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    if (!socket || !application?._id) return;

    const handler = (data) => {
      if (String(data.applicationId) !== String(application._id)) return;
      setStatus(data.status);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 3000);
    };

    socket.on("application:statusChanged", handler);
    return () => socket.off("application:statusChanged", handler);
  }, [socket, application?._id]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG["Applied"];
  const Icon = config.icon;
  const isRejected = status === "Rejected";
  const currentStep = STEPS.indexOf(status);

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300
        ${config.bg} ${config.border}
        ${justUpdated ? "ring-2 ring-offset-1 ring-emerald-400 scale-[1.01]" : ""}`}
    >
      {/* Status header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.text}`} />
          <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
        </div>
        {justUpdated && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium animate-pulse">
            <Zap className="w-3 h-3" /> Just updated
          </span>
        )}
      </div>

      {/* Progress bar (not shown if rejected) */}
      {!isRejected && (
        <div className="mt-1">
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
              const isDone = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  {/* Node */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                      ${isDone
                        ? "bg-emerald-500 shadow-sm shadow-emerald-200"
                        : "bg-gray-200"}`}
                  >
                    {isDone && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 transition-all duration-500 ${i < currentStep ? "bg-emerald-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {STEPS.map((step) => (
              <span key={step} className={`text-[9px] font-medium ${step === status ? config.text : "text-gray-400"}`}>
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {isRejected && (
        <p className="text-xs text-red-600 mt-1">
          This application was not successful. Keep applying — the right opportunity is out there!
        </p>
      )}
    </div>
  );
}
