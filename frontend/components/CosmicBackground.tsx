export default function CosmicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Starfield */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black" />

      {/* Animated stars */}
      <div className="stars-small" />
      <div className="stars-medium" />
      <div className="stars-large" />

      {/* Solar System - Left Side */}
      <div className="absolute left-[5%] top-[20%] w-[400px] h-[400px] opacity-30">
        {/* Sun */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 shadow-[0_0_60px_20px_rgba(251,191,36,0.4)] animate-pulse-slow" />

        {/* Mercury orbit */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/10 rounded-full animate-orbit-fast">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-400" />
        </div>

        {/* Venus orbit */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 border border-white/10 rounded-full animate-orbit-medium">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-200" />
        </div>

        {/* Earth orbit */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full animate-orbit-slow">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-green-400" />
        </div>

        {/* Mars orbit */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full animate-orbit-slower">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-400" />
        </div>

        {/* Jupiter orbit */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/10 rounded-full animate-orbit-slowest">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-300 via-amber-200 to-orange-400" />
        </div>

        {/* Saturn orbit */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full animate-orbit-saturn">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-200 to-amber-300" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-1 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent rounded-full rotate-12" />
          </div>
        </div>
      </div>

      {/* Black Hole - Right Side */}
      <div className="absolute right-[5%] bottom-[15%] w-[350px] h-[350px] opacity-40">
        {/* Event horizon */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-black shadow-[0_0_80px_40px_rgba(0,0,0,0.8)]" />

        {/* Accretion disk - outer ring */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border-[12px] border-transparent animate-spin-slow"
          style={{
            background: 'linear-gradient(transparent, transparent) padding-box, linear-gradient(135deg, #f97316, #eab308, #f97316, #dc2626, #f97316) border-box',
            filter: 'blur(2px)',
          }}
        />

        {/* Accretion disk - middle ring */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full border-[8px] border-transparent animate-spin-medium"
          style={{
            background: 'linear-gradient(transparent, transparent) padding-box, linear-gradient(135deg, #fbbf24, #f97316, #fbbf24, #ef4444, #fbbf24) border-box',
            filter: 'blur(1px)',
          }}
        />

        {/* Accretion disk - inner ring */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border-[4px] border-transparent animate-spin-fast"
          style={{
            background: 'linear-gradient(transparent, transparent) padding-box, linear-gradient(135deg, #fde047, #fbbf24, #fde047, #f97316, #fde047) border-box',
          }}
        />

        {/* Gravitational lensing effect */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle at 40% 40%, transparent 20%, rgba(139, 92, 246, 0.3) 40%, transparent 60%)',
          }}
        />

        {/* Light bending streaks */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 animate-spin-slower">
          <div className="absolute top-0 left-1/2 w-0.5 h-16 bg-gradient-to-b from-purple-400/50 to-transparent" />
          <div className="absolute bottom-0 left-1/2 w-0.5 h-16 bg-gradient-to-t from-blue-400/50 to-transparent" />
          <div className="absolute left-0 top-1/2 w-16 h-0.5 bg-gradient-to-r from-purple-400/50 to-transparent" />
          <div className="absolute right-0 top-1/2 w-16 h-0.5 bg-gradient-to-l from-blue-400/50 to-transparent" />
        </div>
      </div>

      {/* Floating nebula clouds */}
      <div className="absolute top-[10%] right-[30%] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-[20%] left-[20%] w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute top-[40%] right-[10%] w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-float-fast" />
    </div>
  );
}
