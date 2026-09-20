import { useEffect, useRef } from 'react';

export default function DashboardAmbientBreeze() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle gentle ambient air breeze streams
    const streamCount = 20;
    const streams = Array.from({ length: streamCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 100 + Math.random() * 200,
      speed: 0.6 + Math.random() * 1.2,
      amplitude: 10 + Math.random() * 18,
      frequency: 0.004 + Math.random() * 0.008,
      thickness: 1 + Math.random() * 1.5,
      opacity: 0.08 + Math.random() * 0.16,
      hue: 155 + Math.random() * 30, // Soft Emerald to Cyan
    }));

    let step = 0;

    const render = () => {
      step += 0.012;
      ctx.clearRect(0, 0, width, height);

      streams.forEach((s) => {
        s.x += s.speed;
        if (s.x - s.length > width) {
          s.x = -s.length;
          s.y = Math.random() * height;
        }

        ctx.beginPath();
        ctx.strokeStyle = `hsla(${s.hue}, 80%, 45%, ${s.opacity})`;
        ctx.lineWidth = s.thickness;
        ctx.lineCap = 'round';

        const startX = s.x;
        const startY = s.y + Math.sin(step + startX * s.frequency) * s.amplitude;
        const endX = s.x + s.length;
        const endY = s.y + Math.sin(step + endX * s.frequency) * s.amplitude;

        const cpX = (startX + endX) / 2;
        const cpY = (startY + endY) / 2 + Math.cos(step) * 8;

        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.stroke();
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
    <div className="dashboard-ambient-breeze-wrap">
      <canvas ref={canvasRef} className="dashboard-ambient-breeze-canvas" />
      <style>{`
        .dashboard-ambient-breeze-wrap {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          background: radial-gradient(circle at 10% 20%, rgba(209, 250, 229, 0.45), transparent 45%),
                      radial-gradient(circle at 90% 80%, rgba(224, 242, 254, 0.4), transparent 45%);
        }
        .dashboard-ambient-breeze-canvas {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}
