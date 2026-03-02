import React, { useEffect, useState } from 'react';

interface SpeedometerProps {
    value: number;
    maxValue: number;
    phase: 'idle' | 'ping' | 'download' | 'upload' | 'done';
}

const Speedometer: React.FC<SpeedometerProps> = ({ value, maxValue, phase }) => {
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        let target = value / maxValue;
        if (target > 1) target = 1;
        if (target < 0) target = 0;
        setPercentage(target);
    }, [value, maxValue]);

    const radius = 130;
    const strokeWidth = 16;
    const cx = 160;
    const cy = 160;
    // Arc spans 220 degrees starting from 160 down to 20
    // Instead of complex math, we use strokeDasharray on a path
    // The path starts left bottom and goes to right bottom.

    // Angle = 230 degrees. 230 deg in radians = 230 * Math.PI / 180 = 4.014 rad
    // Circumference of 360: 2 * PI * r
    const arcLength = 2 * Math.PI * radius * (240 / 360);
    const circumference = 2 * Math.PI * radius;

    // Let's create an arc path
    // Let's use a circle rotated.
    // A circle starts at right=0. If we rotate it by 150deg, it starts at left bottom.
    // the arc length is 240 degrees.

    return (
        <div style={{ position: 'relative', width: 320, height: 320, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="320" height="320" viewBox="0 0 320 320" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                    <linearGradient id="velocityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#93b3f2" />
                        <stop offset="100%" stopColor="#7ee8d5" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Outer dashed track */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={radius + 20}
                    fill="none"
                    stroke="#d9e5f9"
                    strokeWidth="12"
                    strokeDasharray={`20 4`} // Dashed line
                    strokeDashoffset={circumference - (2 * Math.PI * (radius + 20) * (240 / 360))}
                    strokeLinecap="butt"
                    transform={`rotate(150 ${cx} ${cy})`}
                />

                {/* Background Arc */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke="rgba(147, 179, 242, 0.15)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${circumference}`}
                    transform={`rotate(150 ${cx} ${cy})`}
                    strokeLinecap="round"
                />

                {/* Active Arc */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke="url(#velocityGrad)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${circumference}`}
                    strokeDashoffset={arcLength - (percentage * arcLength)}
                    transform={`rotate(150 ${cx} ${cy})`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
                />

                {/* Thumb */}
                <circle
                    cx={cx + radius * Math.cos((150 + percentage * 240) * Math.PI / 180)}
                    cy={cy + radius * Math.sin((150 + percentage * 240) * Math.PI / 180)}
                    r="8"
                    fill="#ffffff"
                    stroke="#7ee8d5"
                    strokeWidth="4"
                    filter="url(#glow)"
                    style={{ transition: 'all 0.3s ease-out' }}
                />

                {/* Gauge Labels (0 and 100+) */}
                <text x={cx - 100} y={cy + 100} fill="var(--text-muted)" fontSize="12" fontWeight="600" textAnchor="middle">0</text>
                <text x={cx + 100} y={cy + 100} fill="var(--text-muted)" fontSize="12" fontWeight="600" textAnchor="middle">100+</text>
            </svg>

            {/* Inner white neumorphic circle - handled by parent UI, but we can put it here to keep Speedometer self-contained */}
            <div className="speedometer-inner-circle">
                <div className="speed-value-large">{value < 1 ? value.toFixed(1) : value.toFixed(1)}</div>
                <div className="speed-unit-large">mbps</div>
                <div className="speed-phase-label">{phase === 'done' ? 'DONE' : phase === 'idle' ? 'SPEED' : phase.toUpperCase()}</div>
            </div>
        </div>
    );
};

export default Speedometer;
