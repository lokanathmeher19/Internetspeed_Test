"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface RadarMapProps {
    clientLat: number;
    clientLon: number;
    serverLat: number;
    serverLon: number;
    status: 'idle' | 'ping' | 'download' | 'upload' | 'done';
    onLocationUpdate?: (lat: number, lon: number) => void;
}

// Helper component that automatically pans the map when the props center changes dynamically
const MapUpdater: React.FC<{ lat: number, lon: number, zoom: number }> = ({ lat, lon, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (lat !== 0 && lon !== 0) {
            map.flyTo([lat, lon], zoom, { animate: true, duration: 2.0 });
        }
    }, [lat, lon, map, zoom]);
    return null;
};

// Exposes map click events to allow the user to manually set their accurate location
const ClickHandler: React.FC<{ onLocationUpdate?: (lat: number, lon: number) => void }> = ({ onLocationUpdate }) => {
    useMapEvents({
        click(e) {
            if (onLocationUpdate) {
                onLocationUpdate(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
};

const RadarMap: React.FC<RadarMapProps> = ({ clientLat, clientLon, serverLat, serverLon, status, onLocationUpdate }) => {
    const [mounted, setMounted] = useState(false);
    const [towers, setTowers] = useState<{ lat: number, lon: number, ratio: number, type: string }[]>([]);

    useEffect(() => {
        setMounted(true);
        // Fix leaflet marker icon issue in Next.js
        import('leaflet').then(L => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        });
    }, []);

    // Generate nearby towers when client location is known
    useEffect(() => {
        if (clientLat !== 0 && clientLon !== 0) {
            // Seed a consistent but pseudo-random set of towers based on client coords
            const rand = (seed: number) => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };

            const networkProviders = ['Jio 5G Node', 'Airtel Mast', 'Vi Cellular Node', 'BSNL Tower', 'Ethernet Hub'];

            const numTowers = Math.floor(rand(clientLat) * 15) + 10; // Generate between 10 to 25 nearby towers

            const mockTowers = Array.from({ length: numTowers }).map((_, i) => {
                // Spread across a tight local radius specifically around your neighborhood/city
                const latOffset = (rand(clientLat + i) - 0.5) * 0.08;
                const lonOffset = (rand(clientLon + i) - 0.5) * 0.08;
                return {
                    lat: clientLat + latOffset,
                    lon: clientLon + lonOffset,
                    ratio: Math.floor(rand(i * 99) * 45) + 55, // 55% to 100% capacity/signal ratio
                    type: networkProviders[Math.floor(rand(i * 123) * networkProviders.length)]
                };
            });
            setTowers(mockTowers);
        }
    }, [clientLat, clientLon]);

    if (!mounted || clientLat === 0) return (
        <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(128,128,128,0.05)', borderRadius: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.5 }}>CALIBRATING RADAR TELEMETRY...</span>
        </div>
    );

    // Center specifically on the user's Live Location so they can clearly navigate their city/neighborhood
    const centerLat = clientLat;
    const centerLon = clientLon;

    const isTesting = status !== 'idle' && status !== 'done';
    const lineColor = isTesting ? "var(--accent-cyan)" : "var(--text-muted)";

    return (
        <div style={{ width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden', zIndex: 1, position: 'relative', marginTop: '1rem', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)' }}>
            {/* Absolute overlay to tint map based on theme */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, pointerEvents: 'none', background: 'var(--panel-bg)', opacity: 0.2 }}></div>

            {/* Tower count floating overlay */}
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 405, background: 'rgba(11, 17, 32, 0.85)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,42,42,0.3)', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff2a2a', boxShadow: '0 0 8px #ff2a2a' }} className="radar-ping"></span>
                <span style={{ color: '#ff2a2a', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                    {towers.length} ACTIVE TOWERS NEAR YOU
                </span>
            </div>

            <MapContainer
                center={[centerLat, centerLon]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={true} // Allow users to scroll wheel into their live location easily
                dragging={true} // Enabled dragging for better view
                touchZoom={true}
                doubleClickZoom={true}
                attributionControl={false}
            >
                {/* Dynamically fly to user's real high-accuracy GPS coordinates once loaded */}
                <MapUpdater lat={centerLat} lon={centerLon} zoom={15} />

                {/* Allow user to click to perfectly set their location if hardware GPS is slightly off or unavailable */}
                <ClickHandler onLocationUpdate={onLocationUpdate} />

                {/* Real Google Maps Tile Layer */}
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                />

                {/* Nearby Internet Towers as Red Dots */}
                {towers.map((tower, idx) => (
                    <React.Fragment key={idx}>
                        <CircleMarker
                            center={[tower.lat, tower.lon]}
                            pathOptions={{ color: '#ff2a2a', fillColor: '#ff2a2a', fillOpacity: 0.8 }}
                            radius={5}
                        >
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.2' }}>
                                    <strong style={{ color: '#ff2a2a' }}>{tower.type}</strong><br />
                                    Live Ratio: {tower.ratio}%
                                </div>
                            </Tooltip>
                        </CircleMarker>
                        {/* Live ping animation layer for the tower */}
                        <CircleMarker
                            center={[tower.lat, tower.lon]}
                            pathOptions={{ color: '#ff2a2a', fillColor: 'transparent', className: 'tower-pulse' }}
                            radius={15}
                        />
                    </React.Fragment>
                ))}

                {/* Client Position */}
                <CircleMarker center={[clientLat, clientLon]} pathOptions={{ color: '#00BFFF', fillColor: '#00BFFF', fillOpacity: 0.8 }} radius={15}>
                    <Tooltip direction="right" offset={[15, 0]} opacity={1} permanent>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 'bold', color: '#111' }}>
                            🔵 YOUR LIVE LOCATION
                        </div>
                    </Tooltip>
                    {isTesting && (
                        <CircleMarker center={[clientLat, clientLon]} pathOptions={{ color: '#00BFFF', fillColor: 'transparent', className: 'radar-ping' }} radius={35} />
                    )}
                </CircleMarker>

                {/* Server Position */}
                {(serverLat !== 0 && serverLon !== 0) && (
                    <CircleMarker center={[serverLat, serverLon]} pathOptions={{ color: 'var(--accent-blue)', fillColor: 'var(--accent-blue)', fillOpacity: 1 }} radius={6} />
                )}

                {/* Connection Line */}
                {(serverLat !== 0 && serverLon !== 0) && (
                    <Polyline
                        positions={[[clientLat, clientLon], [serverLat, serverLon]]}
                        pathOptions={{
                            color: lineColor,
                            weight: isTesting ? 3 : 1,
                            dashArray: isTesting ? '5, 10' : 'none',
                            className: isTesting ? 'radar-line-animate' : ''
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default RadarMap;
