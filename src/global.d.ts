import type { DesktopBridge } from "./shared/model";
declare global {
  interface Window {
    lanes?: DesktopBridge;
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}
declare module "fft.js" {
  export default class FFT {
    constructor(size: number);
    createComplexArray(): number[];
    realTransform(out: number[], data: Float32Array): void;
  }
}
