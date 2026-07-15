import React from "react";

export const GlobalAmbient = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      {/* 🌊 Deep Sea Base */}
      <div className="bg-background absolute inset-0" />

      {/* 🧪 Kinetic Mesh Gradients (Aqua) - Using CSS Animations for zero JS overhead */}
      <div className="bg-primary/10 animate-kinetic-1 absolute top-[-20%] left-[-20%] h-[80%] w-[80%] rounded-full blur-[150px]" />

      <div className="bg-primary/10 animate-kinetic-2 absolute right-[-10%] bottom-[-10%] h-[70%] w-[70%] rounded-full blur-[120px]" />

      {/* 🌫️ Subsurface Noise Scrim */}
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay brightness-100 contrast-125" />

      {/* Dynamic Scrim based on scroll to fade the top/bottom */}
      <div className="from-background to-background absolute inset-0 bg-gradient-to-b via-transparent opacity-80" />
    </div>
  );
};
