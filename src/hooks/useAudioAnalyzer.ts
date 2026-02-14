import { useState, useRef, useCallback } from 'react';
import { detectFundamentalFrequency } from '../lib/audioAnalysis';

export interface AnalyzerState {
  status: 'idle' | 'requesting' | 'listening' | 'locked';
  frequency: number | null;
  lockReadings: number[];
  error: string | null;
}

const LOCK_THRESHOLD = 0.03;
const LOCK_COUNT = 5;
const MIN_SIGNAL_RMS = 0.004;
const DETECTION_INTERVAL_MS = 350;

/**
 * Called for each detected frequency. Return true if the reading
 * should count toward lock-in, false to discard it.
 */
export type ValidateFrequency = (frequencyHz: number) => boolean;

export function useAudioAnalyzer() {
  const [state, setState] = useState<AnalyzerState>({
    status: 'idle',
    frequency: null,
    lockReadings: [],
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef(0);
  const lockReadingsRef = useRef<number[]>([]);
  const lockedRef = useRef(false);
  const lastDetectionRef = useRef(0);
  const validateRef = useRef<ValidateFrequency | null>(null);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  const stopLoop = () => {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = 0;
  };

  const startLoop = (analyser: AnalyserNode, ctx: AudioContext) => {
    stopLoop();
    const timeDomainBuf = new Float32Array(analyser.fftSize);

    const tick = () => {
      if (lockedRef.current) return;

      const now = performance.now();
      if (now - lastDetectionRef.current >= DETECTION_INTERVAL_MS) {
        lastDetectionRef.current = now;

        analyser.getFloatTimeDomainData(timeDomainBuf);

        // Find the region with the strongest signal — on iOS the buffer may
        // contain stale/quiet data at the start. Scan in chunks to find the
        // loudest region, then run RMS and FFT on that portion.
        const analysisSize = 16384;
        const len = timeDomainBuf.length;
        let bestOffset = Math.max(0, len - analysisSize);
        let bestRms = 0;

        // Check a few candidate windows (end, mid, start)
        for (let off = Math.max(0, len - analysisSize); off >= 0; off -= 4096) {
          let sumSq = 0;
          const checkLen = Math.min(4096, len - off);
          for (let i = off; i < off + checkLen; i++) {
            sumSq += timeDomainBuf[i] * timeDomainBuf[i];
          }
          const rms = Math.sqrt(sumSq / checkLen);
          if (rms > bestRms) {
            bestRms = rms;
            bestOffset = off;
          }
        }

        // Extract the best window for analysis
        const windowStart = Math.max(0, Math.min(bestOffset, len - analysisSize));
        const analysisBuf = timeDomainBuf.subarray(windowStart, windowStart + analysisSize);

        let freq: number | null = null;
        if (bestRms >= MIN_SIGNAL_RMS) {
          freq = detectFundamentalFrequency(analysisBuf, ctx.sampleRate);
        }

        if (freq) {
          // If a validator is set, skip readings that produce out-of-range tension
          if (validateRef.current && !validateRef.current(freq)) {
            // Show the frequency but don't count it
            setState(s => ({ ...s, frequency: Math.round(freq! * 10) / 10 }));
            rafIdRef.current = requestAnimationFrame(tick);
            return;
          }

          const readings = lockReadingsRef.current;
          const isConsistent = readings.length === 0 || readings.every(
            r => Math.abs(r - freq!) / r < LOCK_THRESHOLD
          );

          if (isConsistent) {
            readings.push(freq);
            navigator.vibrate?.(30);
          } else {
            readings.length = 0;
            readings.push(freq);
          }

          if (readings.length >= LOCK_COUNT) {
            const avgFreq = readings.reduce((a, b) => a + b, 0) / readings.length;
            lockedRef.current = true;
            navigator.vibrate?.([50, 50, 100]);
            setState({
              status: 'locked',
              frequency: Math.round(avgFreq * 10) / 10,
              lockReadings: [...readings],
              error: null,
            });
            return;
          }

          setState(s => ({
            ...s,
            frequency: Math.round(freq! * 10) / 10,
            lockReadings: [...readings],
          }));
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  };

  const stop = useCallback(() => {
    stopLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    lockReadingsRef.current = [];
    lockedRef.current = false;
    lastDetectionRef.current = 0;
    validateRef.current = null;
    setState({ status: 'idle', frequency: null, lockReadings: [], error: null });
  }, []);

  const start = useCallback(async (validate?: ValidateFrequency) => {
    try {
      stop();

      if (validate) validateRef.current = validate;

      if (!navigator.mediaDevices?.getUserMedia) {
        setState(s => ({
          ...s,
          status: 'idle',
          error: 'Microphone requires HTTPS. Open this page with https:// on your phone.',
        }));
        return;
      }

      setState(s => ({ ...s, status: 'requesting', error: null }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32768;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      lockedRef.current = false;
      lockReadingsRef.current = [];
      lastDetectionRef.current = 0;

      setState({ status: 'listening', frequency: null, lockReadings: [], error: null });

      startLoop(analyser, ctx);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setState(s => ({ ...s, status: 'idle', error: message }));
    }
  }, [stop]);

  const reset = useCallback(() => {
    lockReadingsRef.current = [];
    lastDetectionRef.current = 0;
    lockedRef.current = false;
    setState({ status: 'listening', frequency: null, lockReadings: [], error: null });

    if (analyserRef.current && audioContextRef.current) {
      startLoop(analyserRef.current, audioContextRef.current);
    }
  }, []);

  return { state, start, stop, reset, getAnalyser };
}
