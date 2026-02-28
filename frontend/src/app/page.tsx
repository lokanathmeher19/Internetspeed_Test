"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Download, Upload, Server, Wifi, Share2, MapPin, Globe, Layout, Info, User, ChevronDown } from 'lucide-react';
import Speedometer from '../components/Speedometer';
import LiveChart from '../components/LiveChart';

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle');
  const [ping, setPing] = useState<number>(0);
  const [jitter, setJitter] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [dataTransferred, setDataTransferred] = useState<number>(0);
  const [testDuration, setTestDuration] = useState<number>(0);

  const [currentValue, setCurrentValue] = useState<number>(0);
  const [maxValue, setMaxValue] = useState<number>(100);

  const [chartData, setChartData] = useState<{ time: number, speed: number }[]>([]);
  const [testActive, setTestActive] = useState(false);
  const [connType, setConnType] = useState('multi');

  // Change HOST as needed or use environment vars in prod
  const HOST = 'https://internetspeedtest-production.up.railway.app';


  useEffect(() => {
    // Basic IP fetch if desired, but we'll mock structural for now
  }, []);



  const startTest = async () => {
    setTestActive(true);
    setPing(0);
    setJitter(0);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setCurrentValue(0);
    setChartData([]);
    setDataTransferred(0);
    setTestDuration(0);

    const testStartTime = performance.now();

    try {
      // 1. PING PHASE
      setStatus('ping');
      setMaxValue(100);
      let totalPing = 0;
      let lastPing = 0;
      let totalJitter = 0;
      const pingIterations = 8;

      for (let i = 0; i < pingIterations; i++) {
        const start = performance.now();
        await fetch(`${HOST}/ping`, { cache: 'no-store' });
        const took = performance.now() - start;

        totalPing += took;
        if (i > 0) totalJitter += Math.abs(took - lastPing);
        lastPing = took;

        setCurrentValue(took);
        setPing(took);
        setChartData(prev => [...prev.slice(-20), { time: Date.now(), speed: took }]);
        await new Promise(r => setTimeout(r, 100)); // gap between pings
      }
      setPing(Math.round(totalPing / pingIterations));
      setJitter(Math.round(totalJitter / Math.max(pingIterations - 1, 1)));

      // 2. DOWNLOAD PHASE
      setStatus('download');
      setMaxValue(500);
      setChartData([]);
      await new Promise(r => setTimeout(r, 500)); // Visual pause
      await measureDownload();

      // 3. UPLOAD PHASE
      setStatus('upload');
      setMaxValue(500);
      setChartData([]);
      await new Promise(r => setTimeout(r, 500)); // Visual pause
      await measureUpload();

      setStatus('done');
      setCurrentValue(0);

    } catch (e) {
      console.error("Test failed", e);
      setStatus('idle');
      alert("Test configuration error or server unreachable.");
    } finally {
      setTestDuration(Math.round((performance.now() - testStartTime) / 1000));
      setTestActive(false);
    }
  };

  const measureDownload = async () => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const testDuration = 10000; // 10s max
        const warmupDuration = 2000; // 2 seconds TCP warmup
        const connections = connType === 'multi' ? 4 : 1;

        const abortController = new AbortController();
        const signal = abortController.signal;

        let validBytes = 0;
        const startTime = performance.now();
        let lastChartUpdate = startTime;

        const startStream = async () => {
          try {
            const response = await fetch(`${HOST}/download`, { signal, cache: 'no-store' });
            if (!response.body) return;
            const reader = response.body.getReader();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const now = performance.now();
              const totalElapsed = now - startTime;

              if (value) {
                setDataTransferred(prev => prev + (value.length / 1024 / 1024));
                // Ignore first 2 seconds for calculation (TCP Warmup)
                if (totalElapsed > warmupDuration) {
                  validBytes += value.length;
                }
              }

              // Update Speed every 100ms
              if (now - lastChartUpdate > 100 && totalElapsed > warmupDuration) {
                const elapsedValidSeconds = (now - (startTime + warmupDuration)) / 1000;
                if (elapsedValidSeconds > 0) {
                  const speedMbps = (validBytes * 8) / (1024 * 1024) / elapsedValidSeconds;
                  setCurrentValue(speedMbps);
                  setDownloadSpeed(speedMbps);

                  if (speedMbps > maxValue * 0.8 && maxValue < 10000) setMaxValue(maxValue * 1.5);

                  setChartData(prev => [...prev.slice(-30), { time: Date.now(), speed: speedMbps }]);
                  lastChartUpdate = now;
                }
              }

              if (totalElapsed >= testDuration) {
                abortController.abort();
                break;
              }
            }
          } catch (e: unknown) {
            const err = e as Error;
            if (err.name !== 'AbortError') console.error(err);
          }
        };

        const streams = Array(connections).fill(0).map(() => startStream());

        setTimeout(() => {
          abortController.abort();
          resolve();
        }, testDuration);

        await Promise.allSettled(streams);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  };

  const measureUpload = async () => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const testDurationMs = 10000;
      const sizeBytes = 30 * 1024 * 1024; // 30MB payload

      const buffer = new Uint8Array(sizeBytes);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });

      const startTime = performance.now();
      let lastChartUpdate = startTime;

      xhr.upload.onprogress = (event) => {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;

        if (elapsed > 0 && event.loaded > 0) {
          const xhrObj = xhr as unknown as { _lastLoaded?: number };
          const chunkLoaded = event.loaded - (xhrObj._lastLoaded || 0);
          setDataTransferred(prev => prev + (chunkLoaded / 1024 / 1024));
          xhrObj._lastLoaded = event.loaded;

          const speedMbps = (event.loaded * 8) / (1024 * 1024) / (elapsed / 1000);
          setCurrentValue(speedMbps);
          setUploadSpeed(speedMbps);

          if (speedMbps > maxValue * 0.8 && maxValue < 10000) setMaxValue(maxValue * 1.5);

          if (currentTime - lastChartUpdate > 100) {
            setChartData(prev => [...prev.slice(-30), { time: Date.now(), speed: speedMbps }]);
            lastChartUpdate = currentTime;
          }
        }

        if (elapsed > testDurationMs) {
          xhr.abort();
          resolve();
        }
      };

      xhr.onload = () => resolve();
      xhr.onerror = (e) => reject(e);
      xhr.onabort = () => resolve();

      xhr.open('POST', `${HOST}/upload`, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.send(blob);
    });
  };

  const chartColor = status === 'ping' ? 'var(--accent-ping)' : status === 'download' ? 'var(--accent-cyan)' : 'var(--accent-purple)';

  const getQualityRating = () => {
    if (downloadSpeed > 300 && ping < 20) return "Excellent for UHD Streaming & Gaming";
    if (downloadSpeed > 100 && ping < 50) return "Great for HD Streaming & Working";
    if (downloadSpeed > 25) return "Good for Standard Web Use";
    return "Poor - Network Optimization Suggested";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-brand">
          <Activity size={28} />
          SpeedTest
        </div>
        <div className="nav-links">
          <a className="nav-link">Apps</a>
          <a className="nav-link">CLI</a>
          <a className="nav-link">VPN</a>
          <a className="nav-link">Network Data</a>
          <a className="nav-link">Insights</a>
          <div className="nav-lang">
            <Globe size={16} style={{ marginRight: '4px' }} /> EN <ChevronDown size={14} />
          </div>
          <a className="nav-link" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} /> Login
          </a>
        </div>
      </nav>

      <main className="main-content">

        {/* Top Metrics Row (Always visible or partially visible based on state) */}
        <div className={`metrics-top phase-${status}`}>
          <div className="metric-card">
            <div className="metric-title ping"><Wifi size={16} className="icon" /> Ping ms</div>
            <div className="metric-value-container">
              <span className="metric-value ping">{ping === 0 && status !== 'ping' ? '—' : ping}</span>
            </div>
            {testActive && status === 'ping' && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Testing latency...</div>}
            {status === 'done' && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jitter: {jitter} ms</div>}
          </div>

          <div className="metric-card">
            <div className="metric-title download"><Download size={16} className="icon" /> Download Mbps</div>
            <div className="metric-value-container">
              <span className="metric-value download">{downloadSpeed === 0 && status !== 'download' && status !== 'done' ? '—' : downloadSpeed.toFixed(1)}</span>
            </div>
            {testActive && status === 'download' && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Testing download...</div>}
          </div>

          <div className="metric-card">
            <div className="metric-title upload"><Upload size={16} className="icon" /> Upload Mbps</div>
            <div className="metric-value-container">
              <span className="metric-value upload">{uploadSpeed === 0 && status !== 'upload' && status !== 'done' ? '—' : uploadSpeed.toFixed(1)}</span>
            </div>
            {testActive && status === 'upload' && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Testing upload...</div>}
          </div>
        </div>

        {/* Center Section: Start / Gauge / Server Info */}
        <div className="hero-section">

          {(status === 'idle' || status === 'done') ? (
            <div className="start-btn-container" onClick={!testActive ? startTest : undefined}>
              <div className="start-btn">
                {status === 'done' ? 'AGAIN' : 'START'}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '2rem' }}>
              <Speedometer value={currentValue} maxValue={maxValue} phase={status} />
              <div style={{ width: '100%', maxWidth: '400px', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <LiveChart data={chartData} color={chartColor} />
              </div>
            </div>
          )}

          {/* Connect Info Panels */}
          {status === 'idle' || status === 'done' ? (
            <div className="server-info-panel">
              <div className="server-info-row">

                <div className="info-block">
                  <div className="info-icon"><User size={24} /></div>
                  <div className="info-text">
                    <span className="info-label">Client</span>
                    <span className="info-value">172.16.254.1</span>
                    <span className="info-label" style={{ fontSize: '0.75rem', marginTop: '2px' }}>Vanderlay Industries ISP</span>
                  </div>
                </div>

                <div className="info-block">
                  <div className="info-icon"><Server size={24} /></div>
                  <div className="info-text">
                    <span className="info-label">Server</span>
                    <span className="info-value">Ashburn, VA</span>
                    <span className="info-label" style={{ fontSize: '0.75rem', marginTop: '2px' }}>SpeedTest Node 1 • Hosted by AwesomeNet</span>
                  </div>
                  <button className="info-action" style={{ alignSelf: 'center', marginLeft: '1rem' }}>Change Server</button>
                </div>

              </div>

              <div style={{ width: '100%', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="connection-toggle">
                  <span className="info-label" style={{ marginRight: '8px' }}>Connections:</span>
                  <span className={`toggle-option ${connType === 'multi' ? 'active' : ''}`} onClick={() => setConnType('multi')}>Multi</span>
                  <span className={`toggle-option ${connType === 'single' ? 'active' : ''}`} onClick={() => setConnType('single')}>Single</span>
                </div>
                <a href="#" style={{
                  fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <Info size={14} /> Result History
                </a>
              </div>
            </div>
          ) : null}

        </div>

        {/* Results Info Block (Shows only when done) */}
        {
          status === 'done' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '3rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', letterSpacing: '1px' }}>TEST SUMMARY</h3>
              <div className="results-grid">
                <div className="result-item">
                  <span className="label">Network Rating</span>
                  <span className="val" style={{ color: 'var(--accent-cyan)' }}>{getQualityRating()}</span>
                </div>
                <div className="result-item">
                  <span className="label">Data Transferred</span>
                  <span className="val">{dataTransferred.toFixed(1)} MB</span>
                </div>
                <div className="result-item">
                  <span className="label">Test Duration</span>
                  <span className="val">{testDuration} seconds</span>
                </div>
              </div>

              <button className="share-btn">
                <Share2 size={18} /> Share Your Results
              </button>
            </div>
          )
        }

      </main>

      {/* Feature Cards Section */}
      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon"><Layout size={24} /></div>
          <div className="feature-title">Native Desktop Apps</div>
          <div className="feature-desc">Download the SpeedTest app for Windows or macOS for background telemetry and no-browser tracking.</div>
          <a className="feature-link">Download <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} /></a>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Wifi size={24} /></div>
          <div className="feature-title">Troubleshoot WiFi</div>
          <div className="feature-desc">Explore tips to optimize your router placement, channels, and cut interference.</div>
          <a className="feature-link">Learn More <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} /></a>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><MapPin size={24} /></div>
          <div className="feature-title">Global Outage Map</div>
          <div className="feature-desc">Check if your area is affected by ISP outages using down detector metrics.</div>
          <a className="feature-link">View Map <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} /></a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <a className="footer-link">About</a>
          <a className="footer-link">Press</a>
          <a className="footer-link">Enterprise Data</a>
          <a className="footer-link">Developers</a>
          <a className="footer-link">Privacy Policy</a>
          <a className="footer-link">Terms of Use</a>
        </div>
        <div className="footer-text">
          © 2026 SpeedTest Corporation. Original robust measurement methodology.<br />
          Data collected helps measure global internet speed topologies.
        </div>
      </footer>
    </div>
  );
}
