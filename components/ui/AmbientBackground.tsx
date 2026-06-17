"use client";

import React from "react";

export const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* 🌊 Deep Sea Base */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* 🧪 Kinetic Mesh Gradients (No Purple!) — CSS animated */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] animate-ambient-drift"
      />

      <div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-azure-500/10 blur-[100px] animate-ambient-drift-reverse"
      />

      <div
        className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 animate-noise-pulse"
      />

      {/* 🏙️ Subsurface Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />

      <style jsx>{`
        @keyframes ambientDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(100px, 50px) scale(1.2); }
        }
        .animate-ambient-drift {
          animation: ambientDrift 20s linear infinite;
        }
        @keyframes ambientDriftReverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 100px) scale(1.1); }
        }
        .animate-ambient-drift-reverse {
          animation: ambientDriftReverse 25s linear infinite;
        }
        @keyframes noisePulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-noise-pulse {
          animation: noisePulse 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
