"use client";

export default function LoadingSpinner({ message = "loading..." }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50/70 backdrop-blur-sm transition-all duration-300 z-50">
      <div className="relative flex items-center justify-center mb-4">
        {/* Decorative Outer Pulsing Ring */}
        <div className="absolute w-16 h-16 rounded-full border-4 border-emerald-500/20 animate-ping duration-1000" />
        
        {/* Main Spinning Wheel */}
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-emerald-600 animate-spin" />
      </div>
      
      {/* Animated Text Message */}
      <p className="text-sm font-medium text-gray-600 tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
}