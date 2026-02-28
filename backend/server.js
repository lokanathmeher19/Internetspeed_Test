require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
}));

// Middleware to prevent caching
app.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
});

// GET /ping - Simple ping endpoint for latency measurement
app.get('/ping', (req, res) => {
    res.send('pong');
});

// GET /download - Stream dummy data for download test
app.get('/download', (req, res) => {
    // We intentionally DO NOT set Content-Length to force 'Transfer-Encoding: chunked'
    res.header('Content-Type', 'application/octet-stream');

    const chunkSize = 1024 * 64; // 64K chunks
    const dummyBuffer = Buffer.alloc(chunkSize, '0'); // Sending zeros is fine, network doesn't compress automatically here as we don't use compression middleware

    const maxDuration = 15000; // 15 second maximum timeout as a safety fallback
    const startTime = Date.now();

    const streamData = () => {
        let ok = true;

        // Write chunks into the socket buffer only if there is room ('ok' flag)
        // This throttles specifically dynamically to network line capacity
        while (ok && !res.socket.destroyed && (Date.now() - startTime) < maxDuration) {
            ok = res.write(dummyBuffer);
        }

        if (res.socket.destroyed || (Date.now() - startTime) >= maxDuration) {
            res.end();
            return;
        }

        // If buffer is full, wait for it to drain before continuing to dump data into memory
        if (!ok) {
            res.once('drain', streamData);
        }
    };

    streamData();

    req.on('close', () => {
        res.end();
    });
});

// POST /upload - Accept uploaded data and consume it
// To avoid holding all data in memory, we stream it as it comes.
app.post('/upload', (req, res) => {
    let bytesReceived = 0;

    req.on('data', chunk => {
        bytesReceived += chunk.length;
    });

    req.on('end', () => {
        res.json({ receivedBytes: bytesReceived });
    });

    // Handle any stream errors
    req.on('error', (err) => {
        console.error('Upload stream error:', err);
        res.status(500).json({ error: 'Stream error', details: err.message });
    });
});

// GET /servers - Mock list of servers for advanced features
app.get('/servers', (req, res) => {
    res.json({
        servers: [
            { id: '1', name: 'US East (N. Virginia)', location: 'Ashburn, VA', lat: 39.0438, lon: -77.4874, distance: 0 },
            { id: '2', name: 'US West (Oregon)', location: 'Boardman, OR', lat: 45.8399, lon: -119.7006, distance: 0 },
            { id: '3', name: 'EU (Frankfurt)', location: 'Frankfurt, Germany', lat: 50.1109, lon: 8.6821, distance: 0 },
            { id: '4', name: 'Asia Pacific (Singapore)', location: 'Singapore', lat: 1.3521, lon: 103.8198, distance: 0 }
        ]
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Express Speedtest backend running on port ${port}`);
});
