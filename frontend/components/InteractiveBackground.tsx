'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles - more particles and better visibility for light mode
    const particleCount = isDark ? 50 : 60;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: isDark ? Math.random() * 3 + 2 : Math.random() * 2.5 + 1.5, // Larger particles in dark mode
      opacity: isDark ? Math.random() * 0.5 + 0.5 : Math.random() * 0.6 + 0.3, // Higher opacity in dark mode (0.5-1.0)
    }));

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle with glow effect
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        if (isDark) {
          // Brighter, more vibrant colors for dark mode
          const darkColors = [
            `rgba(191, 219, 254, ${particle.opacity})`, // Light blue (brighter)
            `rgba(165, 243, 252, ${particle.opacity})`, // Cyan
            `rgba(196, 181, 253, ${particle.opacity})`, // Light purple
            `rgba(255, 255, 255, ${particle.opacity * 0.8})`, // White (slightly transparent)
          ];
          ctx.fillStyle = darkColors[Math.floor((particle.x + particle.y) / 100) % darkColors.length];
          
          // Add glow effect for dark mode particles
          ctx.shadowBlur = 12;
          ctx.shadowColor = ctx.fillStyle;
        } else {
          // More vibrant colors for light mode
          const colors = [
            `rgba(59, 130, 246, ${particle.opacity})`, // Blue
            `rgba(139, 92, 246, ${particle.opacity})`, // Purple
            `rgba(236, 72, 153, ${particle.opacity})`, // Pink
            `rgba(34, 197, 94, ${particle.opacity})`,  // Green
          ];
          ctx.fillStyle = colors[Math.floor((particle.x + particle.y) / 100) % colors.length];
          
          // Add glow effect
          ctx.shadowBlur = 8;
          ctx.shadowColor = ctx.fillStyle;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections
        particlesRef.current.slice(index + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < (isDark ? 140 : 140)) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            const maxDistance = isDark ? 140 : 140;
            const opacity = (1 - distance / maxDistance);
            
            if (isDark) {
              // Brighter connection lines for dark mode
              ctx.strokeStyle = `rgba(191, 219, 254, ${0.3 * opacity})`; // Increased from 0.15 to 0.3
            } else {
              // Gradient lines for light mode
              const gradient = ctx.createLinearGradient(
                particle.x,
                particle.y,
                otherParticle.x,
                otherParticle.y
              );
              gradient.addColorStop(0, `rgba(59, 130, 246, ${0.3 * opacity})`);
              gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.25 * opacity})`);
              gradient.addColorStop(1, `rgba(236, 72, 153, ${0.3 * opacity})`);
              ctx.strokeStyle = gradient;
            }
            ctx.lineWidth = isDark ? 0.8 : 0.8; // Increased from 0.5 to 0.8 for dark mode
            ctx.stroke();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}

