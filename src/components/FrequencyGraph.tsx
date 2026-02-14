import { useRef, useEffect } from 'react';

interface FrequencyGraphProps {
  getAnalyser: () => AnalyserNode | null;
  highlightFrequency: number | null;
  locked: boolean;
  active: boolean; // whether to run the animation loop
}

// Map from bin index to Hz for display range 100-1000 Hz
const MIN_HZ = 100;
const MAX_HZ = 1000;

export function FrequencyGraph({ getAnalyser, highlightFrequency, locked, active }: FrequencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hi-DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const pad = { top: 8, bottom: 20, left: 8, right: 8 };
    const gW = W - pad.left - pad.right;
    const gH = H - pad.top - pad.bottom;

    // Pre-allocate typed arrays
    let freqData: Uint8Array<ArrayBuffer> | null = null;
    let timeDomainData: Float32Array<ArrayBuffer> | null = null;

    const lineColor = locked ? '#22c55e' : '#3b82f6';
    const glowColor = locked ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.12)';
    const peakColor = locked ? '#22c55e' : '#f59e0b';

    const draw = () => {
      const analyser = getAnalyser();

      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (const frac of [0.25, 0.5, 0.75]) {
        const y = pad.top + gH * (1 - frac);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + gW, y);
        ctx.stroke();
      }

      // Frequency grid lines + labels
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      for (const hz of [200, 400, 600, 800]) {
        const x = pad.left + ((hz - MIN_HZ) / (MAX_HZ - MIN_HZ)) * gW;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + gH);
        ctx.stroke();
        ctx.fillText(`${hz}`, x, H - 4);
      }

      if (!analyser) {
        // Draw flat line when no analyser
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top + gH);
        ctx.lineTo(pad.left + gW, pad.top + gH);
        ctx.stroke();
        if (active) rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Allocate buffers once
      if (!freqData) {
        const ab1 = new ArrayBuffer(analyser.frequencyBinCount);
        freqData = new Uint8Array(ab1);
      }
      if (!timeDomainData) {
        const ab2 = new ArrayBuffer(analyser.fftSize * 4);
        timeDomainData = new Float32Array(ab2);
      }

      // Read live frequency data from AnalyserNode (smoothed by the browser)
      analyser.getByteFrequencyData(freqData);
      analyser.getFloatTimeDomainData(timeDomainData);

      // Compute audio level from time domain for the level bar
      let sumSq = 0;
      const tdLen = timeDomainData.length;
      const sampleCount = Math.min(4096, tdLen);
      for (let i = tdLen - sampleCount; i < tdLen; i++) {
        sumSq += timeDomainData[i] * timeDomainData[i];
      }
      const rms = Math.sqrt(sumSq / sampleCount);
      const audioLevel = Math.min(1, Math.max(0, Math.log10(rms * 100 + 1) / 2));

      // Map frequency bins to our display range
      const sampleRate = analyser.context.sampleRate;
      const binWidth = sampleRate / analyser.fftSize;
      const minBin = Math.floor(MIN_HZ / binWidth);
      const maxBin = Math.min(Math.ceil(MAX_HZ / binWidth), freqData.length - 1);
      const binRange = maxBin - minBin;

      // Build path from frequency data
      ctx.beginPath();
      let firstY = 0;
      for (let i = 0; i <= binRange; i++) {
        const bin = minBin + i;
        const val = freqData[bin] / 255; // 0-1
        const x = pad.left + (i / binRange) * gW;
        const y = pad.top + gH - val * gH;
        if (i === 0) {
          ctx.moveTo(x, y);
          firstY = y;
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Fill area under the curve
      const lastX = pad.left + gW;
      ctx.lineTo(lastX, pad.top + gH);
      ctx.lineTo(pad.left, pad.top + gH);
      ctx.lineTo(pad.left, firstY);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + gH);
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw the line on top
      ctx.beginPath();
      for (let i = 0; i <= binRange; i++) {
        const bin = minBin + i;
        const val = freqData[bin] / 255;
        const x = pad.left + (i / binRange) * gW;
        const y = pad.top + gH - val * gH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Glow effect — draw again wider and transparent
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;

      // Highlight detected frequency
      if (highlightFrequency && highlightFrequency >= MIN_HZ && highlightFrequency <= MAX_HZ) {
        const hx = pad.left + ((highlightFrequency - MIN_HZ) / (MAX_HZ - MIN_HZ)) * gW;

        // Dashed vertical line
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = peakColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(hx, pad.top);
        ctx.lineTo(hx, pad.top + gH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Glowing dot at top
        ctx.beginPath();
        ctx.arc(hx, pad.top + 8, 4, 0, Math.PI * 2);
        ctx.fillStyle = peakColor;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx, pad.top + 8, 8, 0, Math.PI * 2);
        ctx.fillStyle = peakColor.replace(')', ', 0.2)').replace('rgb', 'rgba');
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Audio level bar on left edge
      const levelH = Math.max(2, audioLevel * gH);
      ctx.fillStyle = lineColor;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.roundRect(1, pad.top + gH - levelH, 4, levelH, 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (active) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    if (active) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      // Draw one static frame
      draw();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [getAnalyser, highlightFrequency, locked, active]);

  return (
    <canvas
      ref={canvasRef}
      className="frequency-graph"
      style={{ width: '100%', maxWidth: 400, height: 160 }}
    />
  );
}
