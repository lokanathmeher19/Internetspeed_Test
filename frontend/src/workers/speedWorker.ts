// Web Worker to offload speed test network requests from the main thread
export type WorkerMessage =
    | { type: 'START_DOWNLOAD'; payload: { host: string; connections: number; duration: number } }
    | { type: 'START_UPLOAD'; payload: { host: string; connections: number; duration: number } }
    | { type: 'STOP' };

export type WorkerResponse =
    | { type: 'PROGRESS'; payload: { speedMbps: number; dataTransferredMb: number; phase: 'download' | 'upload' } }
    | { type: 'DONE'; payload: { phase: 'download' | 'upload' } }
    | { type: 'ERROR'; payload: { error: string } }
    | { type: 'PACKET'; payload: { timestamp: number; message: string; phase: 'download' | 'upload' } };

let activeDownloads: AbortController[] = [];
let activeUploads: XMLHttpRequest[] = [];
let updateInterval: ReturnType<typeof setInterval> | null = null;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type } = e.data;

    if (type === 'STOP') {
        cleanup();
        return;
    }

    if (type === 'START_DOWNLOAD') {
        cleanup();
        const { host, connections, duration } = (e.data as { type: 'START_DOWNLOAD'; payload: { host: string; connections: number; duration: number } }).payload;
        runDownload(host, connections, duration);
    }

    if (type === 'START_UPLOAD') {
        cleanup();
        const { host, connections, duration } = (e.data as { type: 'START_UPLOAD'; payload: { host: string; connections: number; duration: number } }).payload;
        runUpload(host, connections, duration);
    }
};

function cleanup() {
    if (updateInterval) clearInterval(updateInterval);
    activeDownloads.forEach(c => c.abort());
    activeDownloads = [];
    activeUploads.forEach(x => x.abort());
    activeUploads = [];
}

async function runDownload(host: string, connections: number, duration: number) {
    const warmupDuration = 2000;
    let validBytes = 0;
    let totalBytes = 0;
    const startTime = performance.now();

    const controller = new AbortController();
    activeDownloads.push(controller);
    const signal = controller.signal;

    updateInterval = setInterval(() => {
        const now = performance.now();
        const totalElapsed = now - startTime;
        const dataTransferredMb = totalBytes / (1024 * 1024);

        if (totalElapsed > warmupDuration) {
            const elapsedValidSeconds = (now - (startTime + warmupDuration)) / 1000;
            if (elapsedValidSeconds > 0) {
                const speedMbps = (validBytes * 8) / elapsedValidSeconds / 1000000;
                self.postMessage({ type: 'PROGRESS', payload: { speedMbps, dataTransferredMb, phase: 'download' } });
            }
        } else {
            self.postMessage({ type: 'PROGRESS', payload: { speedMbps: 0, dataTransferredMb, phase: 'download' } });
        }

        if (totalElapsed >= duration) {
            cleanup();
            self.postMessage({ type: 'DONE', payload: { phase: 'download' } });
        }
    }, 100);

    const startStream = async () => {
        try {
            const response = await fetch(`${host}/download`, { signal, cache: 'no-store' });
            if (!response.body) return;
            const reader = response.body.getReader();

            let chunkCount = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (value) {
                    totalBytes += value.length;
                    const now = performance.now();
                    if (now - startTime > warmupDuration) {
                        validBytes += value.length;
                    }
                    chunkCount++;
                    if (chunkCount % 20 === 0) {
                        self.postMessage({ type: 'PACKET', payload: { timestamp: Date.now(), message: `Recv chunk: ${(value.length / 1024).toFixed(1)}KB | ptr: 0x${Math.floor(Math.random() * 16777215).toString(16)}`, phase: 'download' } });
                    }
                }
            }
        } catch (e: unknown) {
            const err = e as Error;
            if (err.name !== 'AbortError') {
                console.error(err);
            }
        }
    };

    for (let i = 0; i < connections; i++) {
        startStream();
    }
}

async function runUpload(host: string, connections: number, duration: number) {
    const sizeBytes = 5 * 1024 * 1024;
    const buffer = new Uint8Array(sizeBytes);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const startTime = performance.now();
    let totalBytesUploaded = 0;

    updateInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const dataTransferredMb = totalBytesUploaded / (1024 * 1024);

        if (elapsed > 0 && totalBytesUploaded > 0) {
            const speedMbps = (totalBytesUploaded * 8) / (elapsed / 1000) / 1000000;
            self.postMessage({ type: 'PROGRESS', payload: { speedMbps, dataTransferredMb, phase: 'upload' } });
        }

        if (elapsed >= duration) {
            cleanup();
            self.postMessage({ type: 'DONE', payload: { phase: 'upload' } });
        }
    }, 100);

    const startNextUpload = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed >= duration) return;

        const xhr = new XMLHttpRequest();
        activeUploads.push(xhr);

        let previousLoaded = 0;
        let callCount = 0;
        xhr.upload.onprogress = (event) => {
            const chunkLoaded = event.loaded - previousLoaded;
            totalBytesUploaded += chunkLoaded;
            previousLoaded = event.loaded;
            callCount++;
            if (callCount % 5 === 0) {
                self.postMessage({ type: 'PACKET', payload: { timestamp: Date.now(), message: `Sent buf: ${(chunkLoaded / 1024).toFixed(1)}KB | ptr: 0x${Math.floor(Math.random() * 16777215).toString(16)}`, phase: 'upload' } });
            }
        };

        xhr.onload = () => {
            activeUploads = activeUploads.filter(x => x !== xhr);
            startNextUpload();
        };

        xhr.onerror = () => {
            activeUploads = activeUploads.filter(x => x !== xhr);
            startNextUpload();
        };

        xhr.open('POST', `${host}/upload`, true);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.send(blob);
    };

    for (let i = 0; i < connections; i++) {
        startNextUpload();
    }
}
