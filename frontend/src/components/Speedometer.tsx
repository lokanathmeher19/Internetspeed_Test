import React, { useMemo } from 'react';

interface SpeedometerProps {
    value: number; // Current speed
    maxValue: number; // Max bound of the gauge (e.g., 100, 1000)
    phase: 'idle' | 'ping' | 'download' | 'upload' | 'done';
}

const Speedometer: React.FC<SpeedometerProps> = ({ value, maxValue, phase }) => {
    const radius = 100;
    const strokeWidth = 12;
    const center = { x: 120, y: 120 };

    // Calculate gauge angle logic
    // The gauge will go from -120deg to +120deg.
    // 0 is -120, max is +120

    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

    // Calculate stroke dash array for the SVG circle (circumference)
    const circumference = 2 * Math.PI * radius;
    // We only want an arc, let's say 240 degrees (4/3 PI)
    const arcLength = (240 / 360) * circumference;

    const percentage = clamp(value / maxValue, 0, 1);
    const strokeDashoffset = arcLength - (percentage * arcLength);

    // Map phase to color
    const getColor = () => {
        if (phase === 'download') return 'var(--accent-cyan)';
        if (phase === 'upload') return 'var(--accent-purple)';
        if (phase === 'ping') return 'var(--accent-ping)';
        return 'var(--text-muted)';
    };

    const activeColor = getColor();

    // Draw ticks
    const ticks = useMemo(() => {
        const list = [];
        for (let i = 0; i <= 10; i++) {
            // -120 to +120 degrees
            const angle = -120 + (240 / 10) * i;
            const rad = (angle - 90) * (Math.PI / 180);

            const innerRadius = radius - 15;
            const outerRadius = radius - 5;

            const x1 = center.x + innerRadius * Math.cos(rad);
            const y1 = center.y + innerRadius * Math.sin(rad);
            const x2 = center.x + outerRadius * Math.cos(rad);
            const y2 = center.y + outerRadius * Math.sin(rad);

            let tickVal = Math.round((maxValue / 10) * i);
            // Position for text label
            const textRadius = radius - 35;
            const tx = center.x + textRadius * Math.cos(rad);
            const ty = center.y + textRadius * Math.sin(rad) + 4; // micro adjust Y

            list.push({ x1, y1, x2, y2, tx, ty, val: i % 2 === 0 ? tickVal : null });
        }
        return list;
    }, [maxValue, center.x, center.y, radius]);

    // Pointer calculate
    const pointerAngle = -120 + (percentage * 240);
    const pointerRad = (pointerAngle - 90) * (Math.PI / 180);

    const pointerLen = radius - 20;
    const pX = center.x + pointerLen * Math.cos(pointerRad);
    const pY = center.y + pointerLen * Math.sin(pointerRad);

    return (
        <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="240" height="240" viewBox="0 0 240 240" className="gauge-svg">
                <defs>
                    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={activeColor} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={activeColor} stopOpacity="0.2" />
                    </linearGradient>
                    <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Background Arc */}
                <circle
                    cx={center.x}
                    cy={center.y}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${circumference}`}
                    transform={`rotate(150 ${center.x} ${center.y})`}
                    strokeLinecap="round"
                />

                {/* Active Arc */}
                <circle
                    cx={center.x}
                    cy={center.y}
                    r={radius}
                    fill="none"
                    stroke={activeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(150 ${center.x} ${center.y})`}
                    strokeLinecap="round"
                    filter="url(#neon-glow)"
                />

                {/* Dynamic Ticks */}
                {ticks.map((tick, i) => (
                    <g key={i}>
                        <line
                            x1={tick.x1} y1={tick.y1}
                            x2={tick.x2} y2={tick.y2}
                            stroke={percentage * 10 >= i ? activeColor : "rgba(255,255,255,0.15)"}
                            strokeWidth="2"
                        />
                        {tick.val !== null && (
                            <text x={tick.tx} y={tick.ty} fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontWeight="600">
                                {tick.val >= 1000 ? (tick.val / 1000).toFixed(1) + 'G' : tick.val}
                            </text>
                        )}
                    </g>
                ))}

                {/* Needle */}
                <line
                    x1={center.x} y1={center.y}
                    x2={pX} y2={pY}
                    stroke={activeColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#neon-glow)"
                    style={{ transition: 'x2 0.1s linear, y2 0.1s linear, stroke 0.3s ease' }}
                />
                {/* Center dot */}
                <circle cx={center.x} cy={center.y} r="8" fill="var(--bg-dark)" stroke={activeColor} strokeWidth="3" />
            </svg>

            {/* Absolute center text overlay for the current big number if needed, 
          though user prompt has real-time values below tachometer, we can put it inside */}
            <div style={{ position: 'absolute', bottom: '30px', textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '2rem', fontWeight: 300, color: activeColor, textShadow: `0 0 10px ${activeColor}`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {value.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                    {phase === 'ping' ? 'ms' : 'Mbps'}
                </div>
            </div>
        </div>
    );
};

export default Speedometer;
