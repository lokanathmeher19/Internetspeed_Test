import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface ChartData {
    time: number;
    speed: number;
}

interface LiveChartProps {
    data: ChartData[];
    color: string;
}

const LiveChart: React.FC<LiveChartProps> = ({ data, color }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: 120, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--panel-border)', borderTop: '1px solid var(--panel-border)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.5 }}>AWAITING TELEMETRY</span>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                        <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
                            <feMerge>
                                <feMergeNode in="blur2" />
                                <feMergeNode in="blur1" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <XAxis dataKey="time" hide={true} />
                    <YAxis hide={true} domain={['dataMin', 'auto']} />
                    <Area
                        type="monotone"
                        dataKey="speed"
                        stroke={color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSpeed)"
                        isAnimationActive={false}
                        style={{ filter: 'url(#neon)' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LiveChart;
