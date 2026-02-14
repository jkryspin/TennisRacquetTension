export interface TensionSettings {
  material: string;
  gaugeMm: string;
  headSizeSqIn: string;
  stringPattern: string;
  /** Optional measured grommet-to-grommet length in mm */
  stringLengthMm: string;
}

const HEAD_SIZES = ['95', '97', '98', '100', '102', '104', '110'];
const PATTERNS = ['16x19', '16x18', '18x20', '16x20'];

interface SetupFormProps {
  settings: TensionSettings;
  onChange: (settings: TensionSettings) => void;
  onStart: () => void;
}

export function SetupForm({ settings, onChange, onStart }: SetupFormProps) {
  const update = (key: keyof TensionSettings, value: string) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="setup-form">
      <h1 className="app-title">String Tension<br/>Analyzer</h1>

      {/* Material */}
      <div className="field">
        <label>Material</label>
        <div className="chips">
          {['Polyester', 'Nylon', 'NaturalGut', 'Multifilament', 'Kevlar'].map(m => (
            <button
              key={m}
              className={`chip ${settings.material === m ? 'active' : ''}`}
              onClick={() => update('material', m)}
            >
              {m === 'NaturalGut' ? 'Gut' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Gauge */}
      <div className="field">
        <label>Gauge (mm)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.05"
          min="0.9"
          max="1.8"
          placeholder="1.25"
          value={settings.gaugeMm}
          onChange={e => update('gaugeMm', e.target.value)}
        />
      </div>

      {/* Head size */}
      <div className="field">
        <label>Head Size (sq in)</label>
        <div className="chips">
          {HEAD_SIZES.map(s => (
            <button
              key={s}
              className={`chip ${settings.headSizeSqIn === s ? 'active' : ''}`}
              onClick={() => update('headSizeSqIn', s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* String pattern */}
      <div className="field">
        <label>String Pattern</label>
        <div className="chips">
          {PATTERNS.map(p => (
            <button
              key={p}
              className={`chip ${settings.stringPattern === p ? 'active' : ''}`}
              onClick={() => update('stringPattern', p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Optional measured string length */}
      <div className="field">
        <label>Measured String Length (optional)</label>
        <input
          type="number"
          inputMode="decimal"
          step="1"
          min="250"
          max="420"
          placeholder="e.g. 330 — measure grommet to grommet in mm"
          value={settings.stringLengthMm}
          onChange={e => update('stringLengthMm', e.target.value)}
        />
        <span className="field-hint">
          For best accuracy, measure center main string grommet-to-grommet with a tape measure
        </span>
      </div>

      <button className="btn-primary" onClick={onStart}>
        Start Measuring
      </button>
      <span className="version">v1.0.0 · {__BUILD_DATE__}</span>
    </div>
  );
}
