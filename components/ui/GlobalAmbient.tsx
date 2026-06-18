import React from "react";

export const GlobalAmbient = () => {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* 🌊 Deep Sea Base */}
      <div className="absolute inset-0 bg-background" />

      {/* 🧪 Kinetic Mesh Gradients (Aqua) - Using CSS Animations for zero JS overhead */}
      <div
        className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[150px] animate-kinetic-1"
      />

      <div
        className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[120px] animate-kinetic-2"
      />

      {/* 🌫️ Subsurface Noise Scrim */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-125 brightness-100 mix-blend-overlay" />
      
      {/* Dynamic Scrim based on scroll to fade the top/bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-80" />
    </div>
  );
};

