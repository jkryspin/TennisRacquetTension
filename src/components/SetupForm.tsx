import { STRING_DATABASE, getBrands, getModelsForBrand } from '../lib/stringDatabase';

export interface TensionSettings {
  material: string;
  gaugeMm: string;
  headSizeSqIn: string;
  stringPattern: string;
  /** "brand|name" key into STRING_DATABASE, or empty for custom */
  stringKey: string;
  /** Optional measured grommet-to-grommet length in mm */
  stringLengthMm: string;
}

const HEAD_SIZES = ['95', '97', '98', '100', '102', '104', '110'];
const PATTERNS = ['16x19', '16x18', '18x20', '16x20'];
const BRANDS = getBrands();

interface SetupFormProps {
  settings: TensionSettings;
  onChange: (settings: TensionSettings) => void;
  onStart: () => void;
}

export function SetupForm({ settings, onChange, onStart }: SetupFormProps) {
  const update = (key: keyof TensionSettings, value: string) => {
    onChange({ ...settings, [key]: value });
  };

  // Parse current string selection
  const [selectedBrand, selectedModel] = settings.stringKey
    ? settings.stringKey.split('|')
    : ['', ''];
  const models = selectedBrand ? getModelsForBrand(selectedBrand) : [];
  const selectedEntry = selectedBrand && selectedModel
    ? STRING_DATABASE.find(s => s.brand === selectedBrand && s.name === selectedModel)
    : null;

  // Available gauges for selected string
  const availableGauges = selectedEntry
    ? selectedEntry.gauges.map(g => g.mm.toString())
    : [];

  const handleBrandChange = (brand: string) => {
    if (!brand) {
      onChange({ ...settings, stringKey: '' });
      return;
    }
    const brandModels = getModelsForBrand(brand);
    if (brandModels.length > 0) {
      const model = brandModels[0];
      const gauge = model.gauges[0]?.mm.toString() || settings.gaugeMm;
      onChange({
        ...settings,
        stringKey: `${brand}|${model.name}`,
        material: model.material,
        gaugeMm: gauge,
      });
    }
  };

  const handleModelChange = (modelName: string) => {
    const model = STRING_DATABASE.find(
      s => s.brand === selectedBrand && s.name === modelName
    );
    if (model) {
      const gauge = model.gauges[0]?.mm.toString() || settings.gaugeMm;
      onChange({
        ...settings,
        stringKey: `${selectedBrand}|${modelName}`,
        material: model.material,
        gaugeMm: gauge,
      });
    }
  };

  const handleGaugeChip = (gauge: string) => {
    update('gaugeMm', gauge);
  };

  const isCustom = !settings.stringKey;

  return (
    <div className="setup-form">
      <h1 className="app-title">String Tension<br/>Analyzer</h1>

      {/* String selection */}
      <div className="field">
        <label>String</label>
        <select
          className="select-field"
          value={selectedBrand}
          onChange={e => handleBrandChange(e.target.value)}
        >
          <option value="">Custom / not listed</option>
          {BRANDS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {selectedBrand && models.length > 0 && (
        <div className="field">
          <label>Model</label>
          <div className="chips">
            {models.map(m => (
              <button
                key={m.name}
                className={`chip ${selectedModel === m.name ? 'active' : ''}`}
                onClick={() => handleModelChange(m.name)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gauge — chips if from DB, free input if custom */}
      <div className="field">
        <label>Gauge (mm)</label>
        {availableGauges.length > 0 ? (
          <div className="chips">
            {availableGauges.map(g => (
              <button
                key={g}
                className={`chip ${settings.gaugeMm === g ? 'active' : ''}`}
                onClick={() => handleGaugeChip(g)}
              >
                {g}
              </button>
            ))}
          </div>
        ) : (
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
        )}
      </div>

      {/* Material — only shown for custom strings */}
      {isCustom && (
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
      )}

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
