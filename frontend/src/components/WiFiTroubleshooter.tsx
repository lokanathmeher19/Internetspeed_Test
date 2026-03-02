"use client";

import React, { useState } from 'react';
import { Wifi, Router, Radio, Shield, Zap, Info, ArrowRight } from 'lucide-react';

const tips = [
    {
        id: 'placement',
        icon: <Router size={24} color="var(--accent-cyan)" />,
        title: 'Optimal Router Placement',
        summary: 'Move your router to a central, elevated location.',
        details: [
            'Avoid placing routers in closets, under desks, or behind TVs.',
            'Elevate the router on a shelf to broadcast signals outward and downward.',
            'Keep away from thick walls (concrete, brick) and large metal objects like refrigerators or mirrors.'
        ]
    },
    {
        id: 'channels',
        icon: <Radio size={24} color="var(--accent-purple)" />,
        title: 'Change WiFi Channels',
        summary: 'Switch to a less congested channel to avoid neighborhood interference.',
        details: [
            'If you live in an apartment, your neighbors\' WiFi might be interfering with yours.',
            'For 2.4GHz, stick to channels 1, 6, or 11 as they do not overlap.',
            'Use a WiFi analyzer app on your phone to find the least crowded channel and set it in your router admin panel.'
        ]
    },
    {
        id: 'frequency',
        icon: <Zap size={24} color="#f59e0b" />,
        title: '5GHz vs 2.4GHz',
        summary: 'Use 5GHz for speed, 2.4GHz for range.',
        details: [
            'Connect demanding devices (smart TVs, gaming consoles, PCs) to the 5GHz band.',
            'Keep smart home devices (IoT) or devices physically far from the router on the 2.4GHz band.',
            'If your router supports Band Steering (Smart Connect), enable it to let the router decide automatically.'
        ]
    },
    {
        id: 'interference',
        icon: <Shield size={24} color="#10b981" />,
        title: 'Cut Signal Interference',
        summary: 'Identify and remove physical and electronic roadblocks.',
        details: [
            'Microwaves, cordless phones, and Bluetooth devices operate on the 2.4GHz band and can cause lag spikes.',
            'Fish tanks and large plants absorb WiFi signals (water is highly dense to RF waves).',
            'If using a mesh system, ensure nodes have a clear line of sight to each other or are connected via Ethernet backhaul.'
        ]
    }
];

const WiFiTroubleshooter = () => {
    const [activeTip, setActiveTip] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>

            <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ background: 'rgba(14, 165, 233, 0.15)', padding: '12px', borderRadius: '50%' }}>
                    <Wifi size={28} color="var(--accent-cyan)" />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>Diagnostic Guide: Eliminating Network Bottlenecks</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        Even with an ultra-fast ISP connection, poor local network conditions can drastically reduce your speed and increase ping.
                        Review the critical optimization pillars below to maximize your actual throughput.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {tips.map(tip => {
                    const isActive = activeTip === tip.id;
                    return (
                        <div
                            key={tip.id}
                            onClick={() => setActiveTip(isActive ? null : tip.id)}
                            style={{
                                background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-glass)',
                                border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.05)'}`,
                                borderRadius: '16px',
                                padding: '24px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isActive ? '0 0 20px rgba(14, 165, 233, 0.1)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                {tip.icon}
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{tip.title}</div>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: isActive ? '16px' : '0' }}>
                                {tip.summary}
                            </div>

                            <div style={{
                                maxHeight: isActive ? '500px' : '0',
                                overflow: 'hidden',
                                transition: 'max-height 0.3s ease-in-out',
                                opacity: isActive ? 1 : 0
                            }}>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
                                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                        {tip.details.map((detail, idx) => (
                                            <li key={idx}>{detail}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {!isActive && (
                                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                                    <Info size={14} /> Tap to expand <ArrowRight size={14} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

        </div >
    );
};

export default WiFiTroubleshooter;
