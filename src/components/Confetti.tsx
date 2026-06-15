'use client';

import { useEffect, useRef } from 'react';
import { useFinanceStore } from '@/lib/financeStore';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  swaySpeed: number;
  swayOffset: number;
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiTrigger = useFinanceStore((state) => state.confettiTrigger);
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number | null>(null);

  const colors = [
    '#f43f5e', // Rose
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#eab308', // Yellow
    '#a855f7', // Purple
    '#ff7849', // Orange
    '#ec4899', // Pink
    '#06b6d4', // Cyan
  ];

  const spawnExplosion = (width: number, height: number) => {
    const numParticles = 120;
    const newParticles: Particle[] = [];

    // Left explosion source (bottom-left)
    for (let i = 0; i < numParticles / 2; i++) {
      const angle = (Math.PI / 4) + Math.random() * (Math.PI / 6); // Angle directed up-right
      const speed = 10 + Math.random() * 15;
      newParticles.push({
        x: 0,
        y: height,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: getRandomShape(),
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        opacity: 1,
        swaySpeed: 0.05 + Math.random() * 0.05,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    // Right explosion source (bottom-right)
    for (let i = 0; i < numParticles / 2; i++) {
      const angle = (Math.PI * 3 / 4) - Math.random() * (Math.PI / 6); // Angle directed up-left
      const speed = 10 + Math.random() * 15;
      newParticles.push({
        x: width,
        y: height,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: getRandomShape(),
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        opacity: 1,
        swaySpeed: 0.05 + Math.random() * 0.05,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  const getRandomShape = (): 'circle' | 'square' | 'triangle' => {
    const r = Math.random();
    if (r < 0.4) return 'circle';
    if (r < 0.8) return 'square';
    return 'triangle';
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (confettiTrigger === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    spawnExplosion(canvas.width, canvas.height);

    // Start loop if not already running
    if (animationIdRef.current === null) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const loop = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const particles = particlesRef.current;
          const remaining: Particle[] = [];

          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Apply gravity and physics
            p.vy += 0.25; // gravity
            p.vx *= 0.98; // air resistance
            p.vy *= 0.98; // air resistance
            p.x += p.vx + Math.sin(p.swayOffset) * 0.5;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.swayOffset += p.swaySpeed;

            // Slowly fade out when falling below 70% of screen height
            if (p.y > canvas.height * 0.7) {
              p.opacity -= 0.02;
            }

            if (p.y <= canvas.height && p.opacity > 0 && p.x >= -50 && p.x <= canvas.width + 50) {
              remaining.push(p);

              // Render Particle
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rotation);
              ctx.globalAlpha = p.opacity;
              ctx.fillStyle = p.color;

              ctx.beginPath();
              if (p.shape === 'circle') {
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              } else if (p.shape === 'square') {
                ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
              } else if (p.shape === 'triangle') {
                ctx.moveTo(0, -p.size / 2);
                ctx.lineTo(p.size / 2, p.size / 2);
                ctx.lineTo(-p.size / 2, p.size / 2);
                ctx.closePath();
              }
              ctx.fill();
              ctx.restore();
            }
          }

          particlesRef.current = remaining;

          if (remaining.length > 0) {
            animationIdRef.current = requestAnimationFrame(loop);
          } else {
            animationIdRef.current = null;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        };

        animationIdRef.current = requestAnimationFrame(loop);
      }
    }
  }, [confettiTrigger]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[10000] w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
