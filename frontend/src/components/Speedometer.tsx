import React, { useEffect, useState } from 'react';

interface SpeedometerProps {
    value: number;
    maxValue: number;
    phase: 'idle' | 'ping' | 'download' | 'upload' | 'done';
}

const Speedometer: React.FC<SpeedometerProps> = ({ value, maxValue, phase }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        setAnimatedValue(value);
    }, [value]);

    const percentage = Math.min(Math.max(animatedValue / maxValue, 0), 1);
    const strokeWidth = 16;
    const radius = 100;
    const center = { x: 125, y: 125 };

    const sweepAngle = 240;
    const startAngle = 150;

    const arcLength = 2 * Math.PI * radius * (sweepAngle / 360);
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = arcLength - (arcLength * percentage);

    return (
        <div style={{ position: 'relative', width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            <svg width="250" height="250" viewBox="0 0 250 250" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--accent-blue)" />
                        <stop offset="50%" stopColor="var(--accent-cyan)" />
                        <stop offset="100%" stopColor="var(--accent-green)" />
                    </linearGradient>
                    <filter id="thumbShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--accent-green)" floodOpacity="0.5" />
                    </filter>
                </defs>

                {/* Background track fill (faint) */}
                <circle
                    cx={center.x}
                    cy={center.y}
                    r={radius}
                    fill="none"
                    stroke="var(--neumorphic-dark)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${circumference}`}
                    strokeLinecap="round"
                    transform={`rotate(${startAngle} ${center.x} ${center.y})`}
                />

                {/* Thick active gradient arc */}
                <circle
                    cx={center.x}
                    cy={center.y}
                    r={radius}
                    fill="none"
                    stroke="url(#trackGrad)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(${startAngle} ${center.x} ${center.y})`}
                    style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
                />

                {/* Segment separating lines to replicate the design ticks */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    const angle = startAngle + (sweepAngle / 5) * i;
                    return (
                        <g key={i} transform={`rotate(${angle} ${center.x} ${center.y})`}>
                            <line x1={center.x + radius - strokeWidth / 2} y1={center.y} x2={center.x + radius + strokeWidth / 2} y2={center.y} stroke="var(--bg-color)" strokeWidth="4" />
                        </g>
                    );
                })}

                {/* Thumb Indicator */}
                <g
                    transform={`rotate(${startAngle + (sweepAngle * percentage)} ${center.x} ${center.y})`}
                    style={{ transition: 'transform 0.3s ease-out' }}
                >
                    <circle
                        cx={center.x + radius}
                        cy={center.y}
                        r={strokeWidth * 0.6}
                        fill="#ffffff"
                        filter="url(#thumbShadow)"
                    />
                </g>

                {/* Bottom scale text "0" and "100+" */}
                <text x={center.x - radius * 0.8} y={center.y + radius * 0.6} fill="var(--text-main)" fontSize="12" fontWeight="600" textAnchor="end">0</text>
                <text x={center.x + radius * 0.8} y={center.y + radius * 0.6} fill="var(--text-main)" fontSize="12" fontWeight="600" textAnchor="start">100+</text>
            </svg>

            {/* Inner White Neumorphic Circle */}
            <div style={{
                width: 155, height: 155, borderRadius: '50%',
                background: 'var(--bg-color)',
                boxShadow: '10px 10px 20px var(--neumorphic-dark), -10px -10px 20px var(--neumorphic-light)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', zIndex: 10
            }}>
                <span style={{ fontSize: '3.2rem', fontWeight: 700, fontFamily: 'var(--font-h)', color: 'var(--text-main)', lineHeight: 1.1, letterSpacing: '-1px' }}>
                    {value > 0 ? value.toFixed(1) : '—'}
                </span>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 500, margin: '2px 0 6px 0' }}>mbps</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    {phase === 'done' ? 'Complete' : phase !== 'idle' ? phase : 'Ready'}
                </span>
            </div>
        </div>
    );
}; 

export default Speedometer; 