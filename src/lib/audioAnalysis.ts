// Material densities in kg/m³
export const MATERIAL_DENSITIES: Record<string, number> = {
  Polyester: 1380,
  Nylon: 1140,
  NaturalGut: 1320,
  Multifilament: 1150,
  Kevlar: 1440,
};

// Gauge number → diameter in mm (common tennis string gauges)
const GAUGE_TO_MM: Record<number, number> = {
  15: 1.45,
  16: 1.30,
  17: 1.20,
  18: 1.10,
  19: 1.00,
};

/**
 * Convert a gauge value to mm diameter.
 * If the value looks like a gauge number (15-19), map it to mm.
 * Half gauges (e.g. 15.5 = "15L", 16.5 = "16L") are interpolated.
 * Values already in mm (< 3) are returned as-is.
 */
export function normalizeGaugeMm(value: number): number {
  if (value < 3) return value; // already in mm
  const floored = Math.floor(value);
  const mm = GAUGE_TO_MM[floored];
  if (mm) {
    if (value !== floored) {
      const nextMm = GAUGE_TO_MM[floored + 1];
      if (nextMm) return mm + (nextMm - mm) * (value - floored);
    }
    return mm;
  }
  return 1.25; // fallback
}

// --- Cooley-Tukey radix-2 FFT ---

function fft(re: number[], im: number[]): void {
  const n = re.length;
  if (n <= 1) return;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      let tmp = re[i]; re[i] = re[j]; re[j] = tmp;
      tmp = im[i]; im[i] = im[j]; im[j] = tmp;
    }
  }

  // FFT butterfly
  for (let len = 2; len <= n; len *= 2) {
    const halfLen = len / 2;
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let j = 0; j < halfLen; j++) {
        const idx = i + j;
        const idx2 = idx + halfLen;
        const tRe = curRe * re[idx2] - curIm * im[idx2];
        const tIm = curRe * im[idx2] + curIm * re[idx2];
        re[idx2] = re[idx] - tRe;
        im[idx2] = im[idx] - tIm;
        re[idx] += tRe;
        im[idx] += tIm;
        const newCurRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = newCurRe;
      }
    }
  }
}

/**
 * Detect fundamental frequency from audio samples using FFT + peak detection.
 * Looks for dominant frequency in the 200-900 Hz range (typical tennis string range).
 */
export function detectFundamentalFrequency(
  samples: Float32Array | number[],
  sampleRate: number
): number | null {
  // Always use 32768-point FFT for fine frequency resolution (~1.46 Hz/bin
  // at 48kHz). If the input is shorter (e.g. 16384 from the signal scanner),
  // the Hann-windowed samples are zero-padded to 32768, which preserves the
  // spectral resolution needed for accurate parabolic interpolation.
  const fftSize = 32768;
  const windowSize = Math.min(samples.length, fftSize);

  // Take samples from the end of the buffer (most recent audio)
  const startOffset = Math.max(0, samples.length - windowSize);

  // Apply Hann window
  const re: number[] = new Array(fftSize).fill(0);
  const im: number[] = new Array(fftSize).fill(0);
  for (let i = 0; i < windowSize; i++) {
    const hannWindow = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
    re[i] = samples[startOffset + i] * hannWindow;
  }

  fft(re, im);

  // Find peak in 200-750 Hz range
  const minBin = Math.floor((200 * fftSize) / sampleRate);
  const maxBin = Math.min(
    Math.ceil((750 * fftSize) / sampleRate),
    fftSize / 2 - 1
  );

  let maxMag = 0;
  let maxIndex = -1;
  for (let i = minBin; i <= maxBin; i++) {
    const mag = re[i] * re[i] + im[i] * im[i];
    if (mag > maxMag) {
      maxMag = mag;
      maxIndex = i;
    }
  }

  if (maxIndex < 0) return null;

  // Parabolic interpolation for sub-bin accuracy
  const prevMag = maxIndex > 0
    ? Math.sqrt(re[maxIndex - 1] * re[maxIndex - 1] + im[maxIndex - 1] * im[maxIndex - 1])
    : 0;
  const curMag = Math.sqrt(maxMag);
  const nextMag = maxIndex < fftSize / 2 - 1
    ? Math.sqrt(re[maxIndex + 1] * re[maxIndex + 1] + im[maxIndex + 1] * im[maxIndex + 1])
    : 0;
  const denom = prevMag - 2 * curMag + nextMag;
  const delta = denom !== 0 ? (0.5 * (prevMag - nextMag)) / denom : 0;

  return ((maxIndex + delta) * sampleRate) / fftSize;
}

/**
 * Calculate linear density (kg/m) from string gauge and material density.
 */
export function calculateLinearDensity(
  gaugeMm: number,
  materialDensity: number
): number {
  const radiusM = (gaugeMm / 2) / 1000;
  const crossSectionArea = Math.PI * radiusM * radiusM;
  return crossSectionArea * materialDensity;
}

/**
 * Estimate vibrating string length from head size.
 * Uses an elliptical head model with ~1.45:1 length-to-width ratio.
 * Applies a 0.96 grommet correction — the vibrating length (grommet to
 * grommet) is shorter than the full internal head length because grommets
 * sit ~8mm inside the frame on each end.
 */
export function estimateStringLength(headSizeSqIn: number): number {
  const areaM2 = headSizeSqIn * 0.00064516;
  const ratio = 1.45;
  const semiMajor = Math.sqrt((areaM2 * ratio) / Math.PI);
  const fullLength = 2 * semiMajor;
  return fullLength * 0.96;
}

/**
 * Parse a string pattern like "16x19" into mains and crosses.
 */
export function parseStringPattern(pattern: string): { mains: number; crosses: number } {
  const match = pattern.match(/^(\d+)\s*x\s*(\d+)$/);
  if (match) return { mains: parseInt(match[1]), crosses: parseInt(match[2]) };
  return { mains: 16, crosses: 19 }; // fallback
}

/**
 * Compute the effective linear density correction for cross-string mass loading.
 *
 * Each point where a cross string contacts the vibrating main string couples
 * a small segment of cross-string mass into the main's vibration. The effect
 * is a slight increase in effective linear density, which means the simple
 * formula T = μ(2Lf)² overestimates tension if uncorrected.
 *
 * The correction models each intersection as adding ~0.15% to the effective
 * linear density. This is calibrated against ERT-300 reference measurements
 * across 16x16 through 18x20 patterns.
 *
 * Returns a multiplier to apply to the base linear density (>= 1.0).
 * Normalized so 16x19 (the most common pattern) = 1.0.
 */
export function crossStringMassLoadingFactor(crosses: number): number {
  const baseline = 19; // 16x19 is the reference pattern
  const perCross = 0.0015; // ~0.15% per cross string
  return 1 + (crosses - baseline) * perCross;
}

/**
 * Calculate tension using the wave equation: T = μ × (2Lf)²
 */
export function calculateTension(
  frequencyHz: number,
  stringLengthM: number,
  linearDensityKgM: number
): { tensionNewtons: number; tensionLbs: number } {
  const tensionNewtons = linearDensityKgM * Math.pow(2 * stringLengthM * frequencyHz, 2);
  const tensionLbs = tensionNewtons * 0.224809;
  return {
    tensionNewtons: Math.round(tensionNewtons * 100) / 100,
    tensionLbs: Math.round(tensionLbs * 100) / 100,
  };
}
