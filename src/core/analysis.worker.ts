import { analyze } from "./analysis";
self.onmessage = (
  event: MessageEvent<{ samples: Float32Array; sampleRate: number }>,
) => {
  try {
    self.postMessage({
      result: analyze(event.data.samples, event.data.sampleRate),
    });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
