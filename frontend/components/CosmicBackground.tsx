import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
  active: boolean;
}

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    // Initialize stars
    const initStars = () => {
      const starCount = Math.floor((canvas.width * canvas.height) / 3000);
      starsRef.current = [];

      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.02 + 0.005,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }

      // Initialize shooting stars pool
      shootingStarsRef.current = Array(5).fill(null).map(() => ({
        x: 0,
        y: 0,
        length: 0,
        speed: 0,
        opacity: 0,
        angle: 0,
        active: false,
      }));
    };

    // Create shooting star
    const createShootingStar = () => {
      const inactive = shootingStarsRef.current.find(s => !s.active);
      if (inactive && Math.random() < 0.002) {
        inactive.x = Math.random() * canvas.width;
        inactive.y = Math.random() * (canvas.height * 0.5);
        inactive.length = Math.random() * 80 + 40;
        inactive.speed = Math.random() * 15 + 10;
        inactive.opacity = 1;
        inactive.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
        inactive.active = true;
      }
    };

    // Draw nebula clouds
    const drawNebula = (time: number) => {
      // Purple nebula - top right
      const gradient1 = ctx.createRadialGradient(
        canvas.width * 0.8 + Math.sin(time * 0.0003) * 50,
        canvas.height * 0.2 + Math.cos(time * 0.0004) * 30,
        0,
        canvas.width * 0.8,
        canvas.height * 0.2,
        canvas.width * 0.4
      );
      gradient1.addColorStop(0, 'rgba(147, 51, 234, 0.15)');
      gradient1.addColorStop(0.3, 'rgba(124, 58, 237, 0.08)');
      gradient1.addColorStop(0.6, 'rgba(79, 70, 229, 0.04)');
      gradient1.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Blue nebula - left side
      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.15 + Math.cos(time * 0.0002) * 40,
        canvas.height * 0.4 + Math.sin(time * 0.0003) * 40,
        0,
        canvas.width * 0.15,
        canvas.height * 0.4,
        canvas.width * 0.35
      );
      gradient2.addColorStop(0, 'rgba(59, 130, 246, 0.12)');
      gradient2.addColorStop(0.4, 'rgba(37, 99, 235, 0.06)');
      gradient2.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pink/magenta accent - bottom
      const gradient3 = ctx.createRadialGradient(
        canvas.width * 0.6 + Math.sin(time * 0.00025) * 60,
        canvas.height * 0.85,
        0,
        canvas.width * 0.6,
        canvas.height * 0.85,
        canvas.width * 0.3
      );
      gradient3.addColorStop(0, 'rgba(236, 72, 153, 0.08)');
      gradient3.addColorStop(0.5, 'rgba(219, 39, 119, 0.04)');
      gradient3.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cyan accent - center top
      const gradient4 = ctx.createRadialGradient(
        canvas.width * 0.5 + Math.cos(time * 0.00035) * 30,
        canvas.height * 0.1,
        0,
        canvas.width * 0.5,
        canvas.height * 0.1,
        canvas.width * 0.25
      );
      gradient4.addColorStop(0, 'rgba(34, 211, 238, 0.06)');
      gradient4.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient4;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Draw stars
    const drawStars = (time: number) => {
      starsRef.current.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
        const currentOpacity = star.opacity * twinkle;

        // Star glow
        const glow = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        glow.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
        glow.addColorStop(0.3, `rgba(200, 220, 255, ${currentOpacity * 0.4})`);
        glow.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Star core
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();
      });
    };

    // Draw shooting stars
    const drawShootingStars = () => {
      shootingStarsRef.current.forEach(star => {
        if (!star.active) return;

        const endX = star.x + Math.cos(star.angle) * star.length;
        const endY = star.y + Math.sin(star.angle) * star.length;

        const gradient = ctx.createLinearGradient(star.x, star.y, endX, endY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        gradient.addColorStop(0.3, `rgba(200, 220, 255, ${star.opacity * 0.6})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        // Update position
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.opacity -= 0.015;

        if (star.opacity <= 0 || star.x > canvas.width || star.y > canvas.height) {
          star.active = false;
        }
      });
    };

    // Animation loop
    const animate = (timestamp: number) => {
      timeRef.current = timestamp;

      // Clear with dark space color
      ctx.fillStyle = '#030014';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw layers
      drawNebula(timestamp);
      drawStars(timestamp);
      createShootingStar();
      drawShootingStars();

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Test div - should show a visible gradient if component mounts */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -2,
          background: 'linear-gradient(135deg, #1a0030 0%, #000020 50%, #001a1a 100%)'
        }}
      />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
      />
    </>
  );
}
