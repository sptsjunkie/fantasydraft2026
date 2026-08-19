import { useState, useRef, useCallback, useEffect } from 'react';
import './PodcastTranscriber.css';

const MODELS = [
  { id: 'onnx-community/whisper-tiny.en', label: 'Tiny (fastest, ~75 MB)' },
  { id: 'onnx-community/whisper-base.en', label: 'Base (balanced, ~150 MB)' },
  { id: 'onnx-community/whisper-small.en', label: 'Small (best quality, ~500 MB)' },
];

function formatDuration(ms) {
  if (!ms) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function parseApplePodcastUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('podcasts.apple.com')) return null;
    const episodeId = parsed.searchParams.get('i');
    const pathMatch = parsed.pathname.match(/\/id(\d+)/);
    const podcastId = pathMatch ? pathMatch[1] : null;
    return { episodeId, podcastId };
  } catch {
    return null;
  }
}

function itunesLookup(id) {
  return new Promise((resolve, reject) => {
    const cb = '_itunes_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('iTunes API request timed out'));
    }, 15000);
    function cleanup() {
      clearTimeout(timeout);
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    window[cb] = (data) => {
      cleanup();
      resolve(data);
    };
    const script = document.createElement('script');
    script.src = `https://itunes.apple.com/lookup?id=${id}&entity=podcastEpisode&callback=${cb}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to reach iTunes API'));
    };
    document.head.appendChild(script);
  });
}

async function decodeAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const targetRate = 16000;
  const sourceRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const sourceLength = audioBuffer.length;

  const mono = new Float32Array(sourceLength);
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < sourceLength; i++) {
      mono[i] += channelData[i] / numChannels;
    }
  }

  await audioContext.close();

  if (sourceRate === targetRate) return mono;

  const ratio = sourceRate / targetRate;
  const targetLength = Math.floor(sourceLength / ratio);
  const resampled = new Float32Array(targetLength);
  for (let i = 0; i < targetLength; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, sourceLength - 1);
    const t = srcIdx - lo;
    resampled[i] = mono[lo] * (1 - t) + mono[hi] * t;
  }
  return resampled;
}

export default function PodcastTranscriber({ onBack }) {
  const [url, setUrl] = useState('');
  const [episodeInfo, setEpisodeInfo] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [status, setStatus] = useState('idle');
  const [modelLoadProgress, setModelLoadProgress] = useState({ loaded: 0, total: 0, name: '' });
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [timestamps, setTimestamps] = useState(null);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [corsFallback, setCorsFallback] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  function initWorker() {
    if (workerRef.current) return workerRef.current;
    const w = new Worker(new URL('./transcriptionWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = w;
    return w;
  }

  const fetchEpisodeInfo = useCallback(async () => {
    setError('');
    setCorsFallback(false);
    setEpisodeInfo(null);

    const parsed = parseApplePodcastUrl(url);
    if (!parsed) {
      setError('Please enter a valid Apple Podcasts URL (e.g. https://podcasts.apple.com/us/podcast/show-name/id123?i=456)');
      return;
    }
    if (!parsed.episodeId) {
      setError('This looks like a podcast show URL. Please navigate to a specific episode and copy that URL (it should contain "?i=" in it).');
      return;
    }

    setStatus('fetching');
    try {
      let data;
      try {
        data = await itunesLookup(parsed.episodeId);
      } catch {
        const res = await fetch(`https://itunes.apple.com/lookup?id=${parsed.episodeId}`);
        if (!res.ok) throw new Error(`iTunes API returned ${res.status}`);
        data = await res.json();
      }

      const episode = data.results?.find(r =>
        r.episodeUrl ||
        r.wrapperType === 'podcastEpisode' ||
        r.kind === 'podcast-episode' ||
        (r.collectionType === 'Podcast' && r.trackName)
      );
      if (!episode) throw new Error('Episode not found. Please check the URL and try again.');

      setEpisodeInfo({
        title: episode.trackName,
        showName: episode.collectionName || episode.artistName,
        artwork: episode.artworkUrl600 || episode.artworkUrl160 || episode.artworkUrl100,
        duration: episode.trackTimeMillis,
        audioUrl: episode.episodeUrl || episode.previewUrl,
        releaseDate: episode.releaseDate,
        description: episode.shortDescription || episode.description,
      });
      setStatus('idle');
    } catch (err) {
      setError(err.message || 'Failed to fetch episode info');
      setStatus('idle');
    }
  }, [url]);

  const handleFileUpload = useCallback((file) => {
    if (!file) return;
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/aac', 'video/mp4'];
    const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac', '.mp4'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError('Unsupported file format. Please upload an MP3, WAV, M4A, OGG, or WebM file.');
      return;
    }
    setAudioFile(file);
    setError('');
    setCorsFallback(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const startTranscription = useCallback(async (source) => {
    setError('');
    setTranscript('');
    setTimestamps(null);
    setTranscriptionProgress(0);

    let file = source;

    if (!file && episodeInfo?.audioUrl) {
      setStatus('downloading');
      try {
        const res = await fetch(episodeInfo.audioUrl);
        if (!res.ok) throw new Error('fetch-failed');
        const blob = await res.blob();
        file = new File([blob], 'episode.mp3', { type: blob.type || 'audio/mpeg' });
      } catch {
        setCorsFallback(true);
        setStatus('idle');
        return;
      }
    }

    if (!file) {
      setError('No audio source. Please upload an audio file or fetch an episode first.');
      setStatus('idle');
      return;
    }

    setStatus('decoding');
    let audioData;
    try {
      audioData = await decodeAudioFile(file);
    } catch (err) {
      setError(`Could not decode audio: ${err.message}. Try a different file format.`);
      setStatus('idle');
      return;
    }

    const durationSec = audioData.length / 16000;
    setStatus('loading-model');
    setModelLoadProgress({ loaded: 0, total: 0, name: '' });

    const worker = initWorker();

    await new Promise((resolve, reject) => {
      const handler = (e) => {
        const msg = e.data;
        if (msg.type === 'load-progress') {
          setModelLoadProgress(msg.data);
        } else if (msg.type === 'model-ready') {
          worker.removeEventListener('message', handler);
          resolve();
        } else if (msg.type === 'error') {
          worker.removeEventListener('message', handler);
          reject(new Error(msg.message));
        }
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'load', model: modelId });
    }).catch(err => {
      setError(err.message);
      setStatus('idle');
      throw err;
    });

    setStatus('transcribing');
    setTranscriptionProgress(0);

    const startTime = Date.now();

    await new Promise((resolve, reject) => {
      const handler = (e) => {
        const msg = e.data;
        if (msg.type === 'transcribe-progress') {
          setTranscriptionProgress(msg.progress);
        } else if (msg.type === 'transcribe-result') {
          worker.removeEventListener('message', handler);
          const result = msg.data;
          const text = typeof result === 'string' ? result : result.text || '';
          setTranscript(text.trim());
          if (result.chunks) {
            setTimestamps(result.chunks);
          }
          setTranscriptionProgress(1);
          setStatus('done');
          resolve();
        } else if (msg.type === 'error') {
          worker.removeEventListener('message', handler);
          reject(new Error(msg.message));
        }
      };
      worker.addEventListener('message', handler);

      const transferable = audioData.buffer instanceof ArrayBuffer ? [audioData.buffer] : [];
      worker.postMessage({ type: 'transcribe', audio: audioData }, transferable);
    }).catch(err => {
      setError(err.message);
      setStatus('idle');
    });
  }, [episodeInfo, modelId]);

  const copyTranscript = useCallback(() => {
    const textToCopy = showTimestamps && timestamps
      ? timestamps.map(c => {
          const t = c.timestamp;
          const start = formatTimestamp(t[0]);
          return `[${start}] ${c.text.trim()}`;
        }).join('\n')
      : transcript;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [transcript, timestamps, showTimestamps]);

  const downloadTranscript = useCallback(() => {
    const textToDownload = showTimestamps && timestamps
      ? timestamps.map(c => {
          const t = c.timestamp;
          const start = formatTimestamp(t[0]);
          return `[${start}] ${c.text.trim()}`;
        }).join('\n')
      : transcript;

    const title = episodeInfo?.title || 'transcript';
    const safeName = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcript, timestamps, showTimestamps, episodeInfo]);

  function formatTimestamp(seconds) {
    if (seconds == null) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const isWorking = ['fetching', 'downloading', 'decoding', 'loading-model', 'transcribing'].includes(status);
  const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;

  const progressPercent = (() => {
    if (status === 'loading-model' && modelLoadProgress.total > 0) {
      return Math.round((modelLoadProgress.loaded / modelLoadProgress.total) * 100);
    }
    if (status === 'transcribing') {
      return Math.round(transcriptionProgress * 100);
    }
    return 0;
  })();

  const statusLabel = (() => {
    switch (status) {
      case 'fetching': return 'Fetching episode info...';
      case 'downloading': return 'Downloading audio...';
      case 'decoding': return 'Decoding audio...';
      case 'loading-model': return modelLoadProgress.name
        ? `Loading model: ${modelLoadProgress.name.split('/').pop()}`
        : 'Loading transcription model (first time downloads the model)...';
      case 'transcribing': return 'Transcribing audio...';
      default: return '';
    }
  })();

  return (
    <div className="transcriber">
      {onBack && (
        <a className="back-link" onClick={onBack}>
          &#8592; Back
        </a>
      )}

      <div className="transcriber-header">
        <h1>Podcast Transcriber</h1>
        <p>Paste an Apple Podcasts episode link or upload an audio file to generate a full text transcript.</p>
      </div>

      <div className="card">
        <div className="input-group">
          <input
            type="text"
            placeholder="https://podcasts.apple.com/us/podcast/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isWorking && url.trim() && fetchEpisodeInfo()}
            disabled={isWorking}
          />
          <button
            className="btn btn-primary"
            onClick={fetchEpisodeInfo}
            disabled={isWorking || !url.trim()}
          >
            Fetch Episode
          </button>
        </div>

        <div className="divider">or upload audio directly</div>

        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="upload-icon">&#127925;</div>
          <div className="upload-label">
            {audioFile ? audioFile.name : 'Click or drag an audio file here'}
          </div>
          <p className="file-types">MP3, WAV, M4A, OGG, WebM, AAC</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac,.mp4"
            style={{ display: 'none' }}
            onChange={e => handleFileUpload(e.target.files[0])}
          />
        </div>

        {audioFile && (
          <div className="file-name-display">
            <span>&#128196; {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
            <span className="remove-file" onClick={() => setAudioFile(null)} title="Remove file">&times;</span>
          </div>
        )}
      </div>

      {episodeInfo && (
        <div className="card">
          <div className="episode-card">
            {episodeInfo.artwork && (
              <img src={episodeInfo.artwork} alt="Episode artwork" crossOrigin="anonymous" />
            )}
            <div className="episode-info">
              <h3>{episodeInfo.title}</h3>
              <div className="show-name">{episodeInfo.showName}</div>
              <div className="episode-meta">
                {episodeInfo.duration ? formatDuration(episodeInfo.duration) : ''}
                {episodeInfo.releaseDate && (
                  <>{episodeInfo.duration ? ' · ' : ''}{new Date(episodeInfo.releaseDate).toLocaleDateString()}</>
                )}
              </div>
            </div>
          </div>
          <div className="episode-actions">
            <button
              className="btn btn-primary"
              onClick={() => startTranscription(audioFile)}
              disabled={isWorking}
            >
              {audioFile ? 'Transcribe Uploaded File' : 'Transcribe This Episode'}
            </button>
          </div>

          {corsFallback && (
            <div className="cors-fallback">
              <p>&#9888;&#65039; Direct audio download was blocked by the podcast host. Follow these steps instead:</p>
              <ol className="steps">
                <li>
                  <a href={episodeInfo.audioUrl} target="_blank" rel="noopener noreferrer">
                    Click here to download the audio file
                  </a>
                </li>
                <li>Upload the downloaded file using the upload area above</li>
                <li>Click &quot;Transcribe Uploaded File&quot;</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {!episodeInfo && audioFile && !isWorking && status !== 'done' && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <button className="btn btn-primary" onClick={() => startTranscription(audioFile)}>
            Transcribe Uploaded File
          </button>
        </div>
      )}

      {isWorking && (
        <div className="card">
          <div className="model-selector">
            <label>Model:</label>
            <select value={modelId} onChange={e => setModelId(e.target.value)} disabled={isWorking}>
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="progress-section">
            <div className="progress-label">
              <span className="label-text">{statusLabel}</span>
              {(status === 'loading-model' && modelLoadProgress.total > 0) || status === 'transcribing' ? (
                <span className="label-pct">{progressPercent}%</span>
              ) : null}
            </div>
            <div className="progress-bar-track">
              <div
                className={`progress-bar-fill ${['fetching', 'downloading', 'decoding'].includes(status) ? 'indeterminate' : ''}`}
                style={{
                  width: ['fetching', 'downloading', 'decoding'].includes(status)
                    ? undefined
                    : `${progressPercent}%`,
                }}
              />
            </div>
            {status === 'transcribing' && (
              <div className="status-text">
                This may take several minutes for long episodes. Keep this tab active.
              </div>
            )}
            {status === 'loading-model' && (
              <div className="status-text">
                The model is downloaded once and cached in your browser for future use.
              </div>
            )}
          </div>
        </div>
      )}

      {!isWorking && (status === 'idle' || status === 'done') && !episodeInfo && !audioFile && (
        <div className="card">
          <div className="model-selector">
            <label>Transcription model:</label>
            <select value={modelId} onChange={e => setModelId(e.target.value)}>
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {status === 'done' && transcript && (
        <div className="card transcript-section">
          <div className="transcript-header">
            <h2>Transcript</h2>
            <div className="transcript-actions">
              {timestamps && (
                <button className="btn btn-outline" onClick={() => setShowTimestamps(s => !s)}>
                  {showTimestamps ? 'Hide Timestamps' : 'Show Timestamps'}
                </button>
              )}
              <button className="btn btn-success" onClick={copyTranscript}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button className="btn btn-outline" onClick={downloadTranscript}>
                Download .txt
              </button>
            </div>
          </div>
          <div className="transcript-text">
            {showTimestamps && timestamps
              ? timestamps.map((c, i) => {
                  const start = formatTimestamp(c.timestamp[0]);
                  return <div key={i}><strong>[{start}]</strong> {c.text.trim()}</div>;
                })
              : transcript}
          </div>
          <div className="word-count">{wordCount.toLocaleString()} words</div>
        </div>
      )}

      {copied && <div className="copied-toast">Copied to clipboard!</div>}
    </div>
  );
}
