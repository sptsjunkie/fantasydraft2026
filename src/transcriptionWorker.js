import { pipeline } from '@huggingface/transformers';

let transcriber = null;

self.addEventListener('message', async (event) => {
  const { type } = event.data;

  if (type === 'load') {
    const { model } = event.data;
    try {
      transcriber = await pipeline('automatic-speech-recognition', model, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (progress) => {
          self.postMessage({ type: 'load-progress', data: progress });
        },
      });
      self.postMessage({ type: 'model-ready' });
    } catch (err) {
      self.postMessage({ type: 'error', message: `Failed to load model: ${err.message}` });
    }
  }

  if (type === 'transcribe') {
    if (!transcriber) {
      self.postMessage({ type: 'error', message: 'Model not loaded' });
      return;
    }
    const { audio } = event.data;
    try {
      const totalSamples = audio.length;
      const chunkLengthSamples = 30 * 16000;
      const totalChunks = Math.ceil(totalSamples / chunkLengthSamples);
      let chunksProcessed = 0;

      const result = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        chunk_callback: () => {
          chunksProcessed++;
          self.postMessage({
            type: 'transcribe-progress',
            progress: Math.min(chunksProcessed / totalChunks, 0.99),
          });
        },
      });

      self.postMessage({ type: 'transcribe-result', data: result });
    } catch (err) {
      self.postMessage({ type: 'error', message: `Transcription failed: ${err.message}` });
    }
  }
});
