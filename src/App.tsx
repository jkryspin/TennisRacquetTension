import { useState, useEffect, useCallback } from 'react';
import { SetupForm, TensionSettings } from './components/SetupForm';
import { FrequencyGraph } from './components/FrequencyGraph';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import {
  normalizeGaugeMm,
  calculateLinearDensity,
  estimateStringLength,
  calculateTension,
  parseStringPattern,
  crossStringMassLoadingFactor,
  MATERIAL_DENSITIES,
} from './lib/audioAnalysis';
import { lookupLinearDensity } from './lib/stringDatabase';

interface HistoryEntry {
  id: string;
  timestamp: number;
  frequencyHz: number;
  tensionLbs: number;
  tensionNewtons: number;
  stringKey: string;
  gaugeMm: string;
  material: string;
  headSizeSqIn: string;
  stringPattern: string;
  stringLengthMm: string;
}

type Screen = 'setup' | 'live' | 'result';

const DEFAULT_SETTINGS: TensionSettings = {
  material: 'Polyester',
  gaugeMm: '1.25',
  headSizeSqIn: '100',
  stringPattern: '16x19',
  stringKey: '',
  stringLengthMm: '',
};

function loadSettings(): TensionSettings {
  try {
    const stored = localStorage.getItem('tension-settings');
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem('tension-history');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function computeTension(settings: TensionSettings, frequencyHz: number) {
  const gaugeMm = normalizeGaugeMm(parseFloat(settings.gaugeMm) || 1.25);

  // Linear density: use measured DB value if available, else cylinder model
  let linearDensity: number;
  if (settings.stringKey) {
    const [brand, name] = settings.stringKey.split('|');
    const dbDensity = lookupLinearDensity(brand, name, gaugeMm);
    linearDensity = dbDensity ?? calculateLinearDensity(gaugeMm, MATERIAL_DENSITIES[settings.material] || 1380);
  } else {
    const density = MATERIAL_DENSITIES[settings.material] || 1380;
    linearDensity = calculateLinearDensity(gaugeMm, density);
  }

  // Apply cross-string mass loading correction
  const { crosses } = parseStringPattern(settings.stringPattern);
  linearDensity *= crossStringMassLoadingFactor(crosses);

  // String length: use measured value if provided, else estimate from head size
  const measuredMm = parseFloat(settings.stringLengthMm);
  const stringLength = measuredMm > 0
    ? measuredMm / 1000
    : estimateStringLength(parseFloat(settings.headSizeSqIn) || 100);

  return calculateTension(frequencyHz, stringLength, linearDensity);
}

function getStatusMessage(hasFreq: boolean, lockCount: number): string {
  if (lockCount >= 5) return 'Frequency locked!';
  if (lockCount > 0) return `Locking in... ${lockCount}/5 readings`;
  if (hasFreq) return 'Frequency detected — keep plucking';
  return 'Tap or pluck a string to begin';
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [settings, setSettings] = useState<TensionSettings>(loadSettings);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const { state, start, stop, reset, getAnalyser } = useAudioAnalyzer();

  // Persist settings
  useEffect(() => {
    localStorage.setItem('tension-settings', JSON.stringify(settings));
  }, [settings]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('tension-history', JSON.stringify(history));
  }, [history]);

  // Auto-transition to result on lock
  useEffect(() => {
    if (state.status === 'locked' && screen === 'live') {
      setScreen('result');
    }
  }, [state.status, screen]);

  const handleStart = useCallback(async () => {
    setScreen('live');
    await start((freq) => {
      const { tensionLbs } = computeTension(settings, freq);
      return tensionLbs >= 20 && tensionLbs <= 65;
    });
  }, [start, settings]);

  const handleStop = useCallback(() => {
    stop();
    setScreen('setup');
  }, [stop]);

  const handleTryAgain = useCallback(() => {
    reset();
    setScreen('live');
  }, [reset]);

  const handleSave = useCallback(() => {
    if (!state.frequency) return;
    const { tensionLbs, tensionNewtons } = computeTension(settings, state.frequency);
    const entry: HistoryEntry = {
      id: Date.now().toString(36),
      timestamp: Date.now(),
      frequencyHz: state.frequency,
      tensionLbs,
      tensionNewtons,
      stringKey: settings.stringKey,
      gaugeMm: settings.gaugeMm,
      material: settings.material,
      headSizeSqIn: settings.headSizeSqIn,
      stringPattern: settings.stringPattern,
      stringLengthMm: settings.stringLengthMm,
    };
    setHistory(h => [entry, ...h]);
    stop();
    setScreen('setup');
  }, [state.frequency, settings, stop]);

  const handleDeleteEntry = useCallback((id: string) => {
    setHistory(h => h.filter(e => e.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const tension = state.frequency ? computeTension(settings, state.frequency) : null;

  // Setup screen
  if (screen === 'setup') {
    return (
      <div className="app">
        <SetupForm settings={settings} onChange={setSettings} onStart={handleStart} />
        <details className="how-to">
          <summary>How to measure accurately</summary>
          <ol>
            <li><strong>Quiet environment</strong> — move away from fans, music, and conversation. Background noise makes it harder to isolate the string frequency.</li>
            <li><strong>Phone placement</strong> — hold your phone 6–12 inches from the string bed, microphone facing the racket.</li>
            <li><strong>Pluck the center main string</strong> — pull and release a single center main string (not a cross). This gives the cleanest fundamental tone.</li>
            <li><strong>One pluck at a time</strong> — let the string ring out fully before plucking again. Overlapping vibrations confuse the detector.</li>
            <li><strong>Consistent plucks</strong> — the app needs 5 readings within 3% of each other to lock in. Pluck the same string the same way each time.</li>
            <li><strong>Enter correct string info</strong> — tension is calculated from gauge, material, and head size. Wrong inputs give wrong numbers even with a perfect frequency reading.</li>
          </ol>
        </details>
        <details className="how-to">
          <summary>How it works</summary>
          <div className="how-to-body">
            <p>A tighter string vibrates at a higher pitch when plucked. This app listens to that pitch and works backwards to calculate the tension.</p>
            <p>Your mic picks up the sound, the app finds the vibration frequency, then uses a physics formula with your string's weight and length to get tension:</p>
            <p className="formula">T = μ × (2Lf)²</p>
            <p><strong>Selecting your string from the database</strong> uses real measured weights instead of estimating, which is much more accurate — especially for shaped strings like Hyper-G.</p>
            <p><strong>Measuring the string length</strong> with a tape measure (grommet to grommet, center main) removes another source of guesswork.</p>
            <p>The app waits for 5 consistent readings before locking in, and ignores anything outside 20–65 lbs to filter out noise.</p>
          </div>
        </details>
        {history.length > 0 && (
          <div className="history">
            <div className="history-header">
              <h3>History</h3>
              <button className="btn-text" onClick={handleClearHistory}>Clear</button>
            </div>
            {history.map(entry => {
              const [brand, model] = entry.stringKey
                ? entry.stringKey.split('|')
                : ['', ''];
              const stringLabel = brand
                ? `${brand} ${model}`
                : `${entry.material} ${entry.gaugeMm}mm`;
              return (
                <div key={entry.id} className="history-entry">
                  <div className="history-main">
                    <span className="history-tension">{entry.tensionLbs} lbs</span>
                    <span className="history-freq">{entry.frequencyHz} Hz</span>
                  </div>
                  <div className="history-details">
                    <span className="history-string">{stringLabel}</span>
                    <span className="history-meta">
                      {entry.gaugeMm}mm · {entry.stringPattern} · {entry.headSizeSqIn}sq in
                    </span>
                  </div>
                  <div className="history-footer">
                    <span className="history-date">
                      {new Date(entry.timestamp).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <button className="btn-text btn-delete" onClick={() => handleDeleteEntry(entry.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const isLive = screen === 'live' || screen === 'result';
  const statusMsg = getStatusMessage(
    state.frequency != null,
    state.lockReadings.length
  );

  return (
    <div className="app">
      <div className="live-screen">
        {/* Status indicator */}
        <div className="status-row">
          <div className={`pulse-dot ${state.status === 'locked' ? 'locked' : 'listening'}`} />
          <span className="status-text">{statusMsg}</span>
          <button className="btn-text" onClick={handleStop}>Cancel</button>
        </div>

        {/* Lock progress — 5 dots */}
        <div className="lock-dots">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`lock-dot ${state.lockReadings.length > i ? 'filled' : ''}`}
            />
          ))}
        </div>

        {/* Frequency display */}
        <div className="frequency-display">
          <span className="freq-value">
            {state.frequency != null ? state.frequency.toFixed(1) : '—'}
          </span>
          <span className="freq-unit">Hz</span>
        </div>

        {/* Tension display */}
        {tension && (
          <div className="tension-display">
            <span className="tension-value">{tension.tensionLbs.toFixed(1)}</span>
            <span className="tension-unit">lbs</span>
            <span className="tension-secondary">
              ({tension.tensionNewtons.toFixed(1)} N)
            </span>
          </div>
        )}

        {/* Graph — reads directly from AnalyserNode at 60fps */}
        <FrequencyGraph
          getAnalyser={getAnalyser}
          highlightFrequency={state.frequency}
          locked={state.status === 'locked'}
          active={isLive && state.status !== 'locked'}
        />

        {/* Error */}
        {state.error && (
          <div className="error-msg">{state.error}</div>
        )}

        {/* Result actions */}
        {screen === 'result' && (
          <div className="result-actions">
            <button className="btn-primary" onClick={handleSave}>Save Result</button>
            <button className="btn-secondary" onClick={handleTryAgain}>Try Again</button>
            <button className="btn-text" onClick={handleStop}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
