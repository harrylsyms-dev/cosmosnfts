import Head from 'next/head';
import { useState, useEffect } from 'react';

interface ComingSoonProps {
  title?: string;
  message?: string;
  launchDate?: string | null;
}

export default function ComingSoon({ title, message, launchDate }: ComingSoonProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!launchDate) return;

    const target = new Date(launchDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(interval);
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [launchDate]);

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    // In production, this would subscribe the email
    setSubmitted(true);
  }

  return (
    <>
      <Head>
        <title>{title || 'CosmoNFT - Coming Soon'}</title>
        <meta name="description" content="CosmoNFT - Own a piece of the universe. Coming soon." />
      </Head>

      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold gradient-text">CosmoNFT</h1>
            <p className="text-gray-400 mt-2 text-lg">Own a piece of the universe</p>
          </div>

          {/* Main message */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title || 'Coming Soon'}
          </h2>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            {message || 'Celestial objects immortalized as NFTs. Scientifically scored. Dynamically priced. 30% supports space exploration.'}
          </p>

          {/* Countdown */}
          {launchDate && (
            <div className="flex justify-center gap-4 mb-8">
              <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-lg p-4 min-w-[80px]">
                <div className="text-3xl font-bold text-white">{countdown.days}</div>
                <div className="text-gray-400 text-sm">Days</div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-lg p-4 min-w-[80px]">
                <div className="text-3xl font-bold text-white">{countdown.hours}</div>
                <div className="text-gray-400 text-sm">Hours</div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-lg p-4 min-w-[80px]">
                <div className="text-3xl font-bold text-white">{countdown.minutes}</div>
                <div className="text-gray-400 text-sm">Minutes</div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-lg p-4 min-w-[80px]">
                <div className="text-3xl font-bold text-white">{countdown.seconds}</div>
                <div className="text-gray-400 text-sm">Seconds</div>
              </div>
            </div>
          )}

          {/* Email signup */}
          {!submitted ? (
            <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-all"
              >
                Notify Me
              </button>
            </form>
          ) : (
            <div className="bg-green-900/30 border border-green-600 text-green-400 px-6 py-3 rounded-lg inline-block">
              Thanks! We'll notify you when we launch.
            </div>
          )}

          {/* Features preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-bold text-white mb-2">20,000 Unique NFTs</h3>
              <p className="text-gray-400 text-sm">Stars, galaxies, nebulae, and more - each one scientifically verified and uniquely generated.</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">🔬</div>
              <h3 className="font-bold text-white mb-2">Cosmic Scoring</h3>
              <p className="text-gray-400 text-sm">5-factor scientific scoring system determines rarity and value of each celestial object.</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-bold text-white mb-2">30% for Space</h3>
              <p className="text-gray-400 text-sm">30% of proceeds support space exploration initiatives.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} CosmoNFT. All rights reserved.
        </div>
      </div>

      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes animStar {
          from { transform: translateY(0px); }
          to { transform: translateY(-2000px); }
        }

        .stars, .stars2, .stars3 {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 200%;
          background: transparent;
        }

        .stars {
          background-image:
            radial-gradient(1px 1px at 20px 30px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 50px 160px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 90px 40px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 130px 80px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 160px 120px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 200px 50px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 250px 100px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 300px 150px, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 350px 60px, white, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 400px 400px;
          animation: animStar 150s linear infinite;
          opacity: 0.5;
        }

        .stars2 {
          background-image:
            radial-gradient(1.5px 1.5px at 100px 200px, white, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 200px 100px, white, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 300px 300px, white, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 400px 250px, white, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 500px 50px, white, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 600px 600px;
          animation: animStar 100s linear infinite;
          opacity: 0.4;
        }

        .stars3 {
          background-image:
            radial-gradient(2px 2px at 150px 350px, white, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 350px 150px, white, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 550px 450px, white, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 800px 800px;
          animation: animStar 200s linear infinite;
          opacity: 0.3;
        }
      `}</style>
    </>
  );
}
