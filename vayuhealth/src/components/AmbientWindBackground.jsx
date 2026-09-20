import { useEffect, useRef } from 'react';

/**
 * AmbientWindBackground Component
 * Renders a lightweight, dynamic light-theme ambient background featuring:
 * 1. Looping HTML5 video of wind blowing leaves / green atmosphere
 * 2. Canvas-driven flowing wind stream currents & glowing breeze particles
 * 3. Soft emerald-cyan frosted glass gradient overlay
 */
export default function AmbientWindBackground({ children, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Flowing wind stream particles & glowing floating orbs
    const streamCount = 32;
    const streams = Array.from({ length: streamCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 80 + Math.random() * 160,
      speed: 1.2 + Math.random() * 2.4,
      amplitude: 14 + Math.random() * 22,
      frequency: 0.006 + Math.random() * 0.012,
      thickness: 1.2 + Math.random() * 2,
      opacity: 0.18 + Math.random() * 0.35,
      hue: 155 + Math.random() * 25, // Soft Emerald to Teal
    }));

    const orbs = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2 + Math.random() * 4,
      speedX: 0.4 + Math.random() * 1.2,
      speedY: (Math.random() - 0.5) * 0.6,
      opacity: 0.2 + Math.random() * 0.4,
      hue: 160 + Math.random() * 30,
    }));

    let step = 0;

    const render = () => {
      step += 0.018;
      ctx.clearRect(0, 0, width, height);

      // Draw flowing wind streamline curves
      streams.forEach((s) => {
        s.x += s.speed;
        if (s.x - s.length > width) {
          s.x = -s.length;
          s.y = Math.random() * height;
        }

        ctx.beginPath();
        ctx.strokeStyle = `hsla(${s.hue}, 85%, 45%, ${s.opacity})`;
        ctx.lineWidth = s.thickness;
        ctx.lineCap = 'round';

        const startX = s.x;
        const startY = s.y + Math.sin(step + startX * s.frequency) * s.amplitude;
        const endX = s.x + s.length;
        const endY = s.y + Math.sin(step + endX * s.frequency) * s.amplitude;

        const cpX = (startX + endX) / 2;
        const cpY = (startY + endY) / 2 + Math.cos(step) * 12;

        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.stroke();

        // Glowing breeze head dot
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 95%, 55%, ${s.opacity * 1.4})`;
        ctx.arc(endX, endY, s.thickness * 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw floating clean air oxygen orbs
      orbs.forEach((o) => {
        o.x += o.speedX;
        o.y += o.speedY;

        if (o.x > width + 20) {
          o.x = -20;
          o.y = Math.random() * height;
        }
        if (o.y < 0) o.y = height;
        if (o.y > height) o.y = 0;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${o.hue}, 90%, 50%, ${o.opacity})`;
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`ambient-wind-container ${className}`}>
      {/* Dynamic Nature / Flowing Breeze Video */}
      <video
        className="ambient-wind-video"
        autoPlay
        loop
        muted
        playsInline
        poster="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop"
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-sun-shining-through-tree-branches-in-a-forest-42416-large.mp4"
          type="video/mp4"
        />
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-wind-blowing-the-leaves-of-a-tree-41551-large.mp4"
          type="video/mp4"
        />
      </video>

      {/* Canvas Flowing Wind Particles */}
      <canvas ref={canvasRef} className="ambient-wind-canvas" />

      {/* Light Theme Emerald Frosted Glass Gradient Overlay */}
      <div className="ambient-wind-overlay" />

      {/* Dynamic Content Container */}
      <div className="ambient-wind-content">
        {children}
      </div>

      <style>{`
        .ambient-wind-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, #e6f9f0 0%, #d1fae5 50%, #e0f2fe 100%);
        }

        .ambient-wind-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.38;
          filter: saturate(1.3) contrast(1.05) brightness(1.06);
          z-index: 1;
        }

        .ambient-wind-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }

        .ambient-wind-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            145deg,
            rgba(240, 253, 244, 0.72) 0%,
            rgba(236, 253, 245, 0.65) 50%,
            rgba(240, 249, 255, 0.75) 100%
          );
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 3;
        }

        .ambient-wind-content {
          position: relative;
          z-index: 4;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }
      `}</style>
    </div>
  );
}
