"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, ArrowLeftRight, RefreshCw } from 'lucide-react';
import Speedometer from '../components/Speedometer';

export interface HistoryRecord {
  id: string;
  date: string;
  ping: number;
  download: number;
  upload: number;
  server: string;
}

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle');
  const [ping, setPing] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);

  const [currentValue, setCurrentValue] = useState<number>(0);
  const [maxValue, setMaxValue] = useState<number>(100);

  const [testActive, setTestActive] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const finalResultsRef = useRef({ ping: 0, download: 0, upload: 0 });

  const [clientInfo, setClientInfo] = useState({ ip: '...', isp: '...', city: '...' });
  const HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const fetchGeoIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setClientInfo({
          ip: data.ip || 'Unknown IP',
          isp: data.org || 'Unknown ISP',
          city: `${data.city || 'Unknown'}, ${data.region_code || ''}`
        });
      } catch {
        setClientInfo({ ip: 'Offline', isp: 'Local Connection', city: 'Localhost' });
      }
    };

    const fetchServers = async () => {
      try {
        await fetch(`${HOST}/servers`);
        // Server fetch logic exists but is stripped of activeServer logic to match UI simplicity
      } catch (e) {
        console.error("Failed to load servers", e);
      }
    };

    fetchGeoIP();
    fetchServers();

    workerRef.current = new Worker(new URL('../workers/speedWorker.ts', import.meta.url));

    return () => {
      workerRef.current?.terminate();
    };
  }, [HOST]);

  const startTest = async () => {
    setTestActive(true);
    setPing(0);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setCurrentValue(0);

    try {
      // 1. PING PHASE
      setStatus('ping');
      setMaxValue(100);
      let totalPing = 0;
      const pingIterations = 8;

      for (let i = 0; i < pingIterations; i++) {
        const start = performance.now();
        await fetch(`${HOST}/ping`, { cache: 'no-store' });
        const took = performance.now() - start;
        totalPing += took;
        setCurrentValue(took);
        setPing(took);
        await new Promise(r => setTimeout(r, 100));
      }
      const finalPing = Math.round(totalPing / pingIterations);
      setPing(finalPing);
      finalResultsRef.current.ping = finalPing;

      // 2. DOWNLOAD PHASE
      setStatus('download');
      setMaxValue(500);
      await new Promise(r => setTimeout(r, 500));
      await measureDownload();

      // 3. UPLOAD PHASE
      setStatus('upload');
      setMaxValue(500);
      await new Promise(r => setTimeout(r, 500));
      await measureUpload();

      setStatus('done');
      setCurrentValue(0);

    } catch (e) {
      console.error("Test failed", e);
      setStatus('idle');
      alert("Test configuration error or server unreachable.");
    } finally {
      setTestActive(false);
    }
  };

  const measureDownload = async () => {
    return new Promise<void>((resolve, reject) => {
      if (!workerRef.current) return reject(new Error("Worker not initialized"));
      workerRef.current.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'PROGRESS') {
          setCurrentValue(payload.speedMbps);
          setDownloadSpeed(payload.speedMbps);
          setMaxValue(prevMax => payload.speedMbps > prevMax * 0.8 && prevMax < 10000 ? prevMax * 1.5 : prevMax);
        } else if (type === 'DONE') {
          resolve();
        } else if (type === 'ERROR') {
          reject();
        }
      };
      workerRef.current.postMessage({ type: 'START_DOWNLOAD', payload: { host: HOST, connections: 4, duration: 8000 } });
    });
  };

  const measureUpload = async () => {
    return new Promise<void>((resolve, reject) => {
      if (!workerRef.current) return reject(new Error("Worker not initialized"));
      workerRef.current.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'PROGRESS') {
          setCurrentValue(payload.speedMbps);
          setUploadSpeed(payload.speedMbps);
          setMaxValue(prevMax => payload.speedMbps > prevMax * 0.8 && prevMax < 10000 ? prevMax * 1.5 : prevMax);
        } else if (type === 'DONE') {
          resolve();
        } else if (type === 'ERROR') {
          reject();
        }
      };
      workerRef.current.postMessage({ type: 'START_UPLOAD', payload: { host: HOST, connections: 4, duration: 8000 } });
    });
  };

  const buttonText = status === 'idle' ? 'START TEST' : status === 'done' ? 'TEST AGAIN' : 'TESTING...';

  // ID generator for UI footer mock
  const generateTestId = () => Math.floor(10000 + Math.random() * 90000);

  return (
    <div className="app-wrapper">
      <nav className="velocity-nav">
        <div className="velocity-brand">Velocity <span>Labs</span></div>
        <div className="velocity-links">
          <a href="#">Home</a>
          <a href="#">History</a>
          <a href="#">About</a>
          <a href="#">Settings</a>
        </div>
      </nav>

      <div className="velocity-title-container">
        <h1>Velocity</h1>
        <p>Check your connection speed</p>
      </div>

      <div className="speedometer-wrapper">
        <Speedometer value={currentValue} maxValue={maxValue} phase={status} />
      </div>

      <button className="velocity-btn" onClick={!testActive ? startTest : undefined} disabled={testActive}>
        {buttonText} {status === 'done' && <RefreshCw size={18} />}
      </button>

      <div className="metrics-cards-container">
        <div className="velocity-card">
          <div className="velocity-card-header">
            <div className="velocity-icon-box"><ArrowLeftRight size={14} strokeWidth={3} /></div>
            <span className="velocity-label">PING</span>
            <div className="velocity-badge">ms</div>
          </div>
          <div className="velocity-value">
            {ping === 0 && status !== 'ping' ? '—' : ping} <span className="velocity-unit">ms</span>
          </div>
          <div className="velocity-sub">Stable</div>
        </div>

        <div className="velocity-card">
          <div className="velocity-card-header">
            <div className="velocity-icon-box"><ArrowDown size={14} strokeWidth={3} /></div>
            <span className="velocity-label">DOWNLOAD</span>
            <div className="velocity-badge blue-badge"><ArrowDown size={12} strokeWidth={3} /></div>
          </div>
          <div className="velocity-value">
            {downloadSpeed === 0 && status !== 'download' && status !== 'done' ? '—' : downloadSpeed.toFixed(1)} <span className="velocity-unit">Mbps</span>
          </div>
        </div>

        <div className="velocity-card">
          <div className="velocity-card-header">
            <div className="velocity-icon-box"><ArrowUp size={14} strokeWidth={3} /></div>
            <span className="velocity-label">UPLOAD</span>
            <div className="velocity-badge blue-badge"><ArrowUp size={12} strokeWidth={3} /></div>
          </div>
          <div className="velocity-value">
            {uploadSpeed === 0 && status !== 'upload' && status !== 'done' ? '—' : uploadSpeed.toFixed(1)} <span className="velocity-unit">Mbps</span>
          </div>
        </div>
      </div>

      <div className="velocity-footer">
        ISP: {clientInfo.isp} | {clientInfo.city} | Test ID: {generateTestId()}
      </div>

    </div>
  );
}
