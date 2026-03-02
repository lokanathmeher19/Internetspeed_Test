"use client";

import React, { useEffect, useRef } from 'react';

interface ParticleEngineProps {
    speed: number;
    status: 'idle' | 'ping' | 'download' | 'upload' | 'done';
}

export default function ParticleEngine({ speed, status }: ParticleEngineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const particles: { x: number; y: number; z: number; o: number, speedOffset: number }[] = [];

        let cw = window.innerWidth;
        let ch = window.innerHeight;

        const resize = () => {
            cw = window.innerWidth;
            ch = window.innerHeight;
            canvas.width = cw;
            canvas.height = ch;
        };

        window.addEventListener('resize', resize);
        resize();

        // Init particles
        const particleCount = 250;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: (Math.random() - 0.5) * cw * 2,
                y: (Math.random() - 0.5) * ch * 2,
                z: Math.random() * 1000,
                o: Math.random() * 0.5 + 0.1,
                speedOffset: Math.random() * 2 + 1
            });
        }

        const render = () => {
            // Clear canvas without trailing effect so we don't mess up CSS backgrounds
            ctx.clearRect(0, 0, cw, ch);

            const cx = cw / 2;
            const cy = ch / 2;

            // Base speed + warp speed
            let warpMultiplier = 0.5; // Idle
            if (status === 'ping') warpMultiplier = 2;
            if (status === 'download' || status === 'upload') {
                if (speed > 1000) warpMultiplier = 45;
                else if (speed > 500) warpMultiplier = 30;
                else if (speed > 100) warpMultiplier = 15;
                else warpMultiplier = 4 + (speed / 10);
            }

            particles.forEach(p => {
                p.z -= warpMultiplier * p.speedOffset;

                // Reset particle if it goes past the camera
                if (p.z <= 0) {
                    p.x = (Math.random() - 0.5) * cw * 2;
                    p.y = (Math.random() - 0.5) * ch * 2;
                    p.z = 1000;
                }

                const scale = 1000 / p.z;
                const x = p.x * scale + cx;
                const y = p.y * scale + cy;
                const size = Math.max(0.1, (1 - p.z / 1000) * 2.5);

                // Color based on phase
                let r = 255, g = 255, b = 255;
                if (status === 'download') { r = 0; g = 243; b = 255; }
                else if (status === 'upload') { r = 168; g = 85; b = 247; }
                else if (status === 'ping') { r = 122; g = 200; b = 255; }
                else if (status === 'idle') { r = 255; g = 255; b = 255; }

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.o * Math.min(1, scale / 1.5)})`;
                ctx.fill();

                // If warp speed is high, draw streaks
                if (warpMultiplier > 10) {
                    const prevScale = 1000 / (p.z + warpMultiplier * p.speedOffset * 2.5);
                    const prevX = p.x * prevScale + cx;
                    const prevY = p.y * prevScale + cy;

                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(prevX, prevY);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${p.o * 0.4})`;
                    ctx.lineWidth = size;
                    ctx.stroke();
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [speed, status]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0, // Behind content, above bg-pattern
                pointerEvents: 'none',
                opacity: status === 'done' ? 0 : 0.6,
                transition: 'opacity 1s ease-in-out'
            }}
        />
    );
}
