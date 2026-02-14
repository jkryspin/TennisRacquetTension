/**
 * Database of popular tennis strings with measured linear densities.
 * Linear density (g/m) is the mass per unit length — the key physical
 * property needed for tension calculation. Using measured values instead
 * of the cylinder model eliminates ~5-10% error from shaped profiles,
 * coatings, and internal structure.
 *
 * Sources: manufacturer specs, stringforum.net measurements, TWU data.
 */

export interface StringModel {
  brand: string;
  name: string;
  material: 'Polyester' | 'Nylon' | 'NaturalGut' | 'Multifilament' | 'Kevlar';
  /** Available gauges with measured linear density in g/m */
  gauges: { mm: number; linearDensityGM: number }[];
}

export const STRING_DATABASE: StringModel[] = [
  // --- Polyester ---
  {
    brand: 'Luxilon', name: 'ALU Power', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.53 },
      { mm: 1.30, linearDensityGM: 1.66 },
    ],
  },
  {
    brand: 'Luxilon', name: 'ALU Power Rough', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.54 },
    ],
  },
  {
    brand: 'Luxilon', name: '4G', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.51 },
      { mm: 1.30, linearDensityGM: 1.65 },
    ],
  },
  {
    brand: 'Luxilon', name: '4G Rough', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.52 },
    ],
  },
  {
    brand: 'Luxilon', name: 'Element', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.46 },
      { mm: 1.30, linearDensityGM: 1.58 },
    ],
  },
  {
    brand: 'Babolat', name: 'RPM Blast', material: 'Polyester',
    gauges: [
      { mm: 1.20, linearDensityGM: 1.36 },
      { mm: 1.25, linearDensityGM: 1.48 },
      { mm: 1.30, linearDensityGM: 1.63 },
      { mm: 1.35, linearDensityGM: 1.74 },
    ],
  },
  {
    brand: 'Babolat', name: 'RPM Blast Rough', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.50 },
      { mm: 1.30, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Babolat', name: 'RPM Hurricane', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.52 },
      { mm: 1.30, linearDensityGM: 1.67 },
    ],
  },
  {
    brand: 'Solinco', name: 'Hyper-G', material: 'Polyester',
    gauges: [
      { mm: 1.15, linearDensityGM: 1.22 },
      { mm: 1.20, linearDensityGM: 1.30 },
      { mm: 1.25, linearDensityGM: 1.52 },
      { mm: 1.30, linearDensityGM: 1.61 },
    ],
  },
  {
    brand: 'Solinco', name: 'Hyper-G Soft', material: 'Polyester',
    gauges: [
      { mm: 1.20, linearDensityGM: 1.28 },
      { mm: 1.25, linearDensityGM: 1.49 },
    ],
  },
  {
    brand: 'Solinco', name: 'Tour Bite', material: 'Polyester',
    gauges: [
      { mm: 1.20, linearDensityGM: 1.33 },
      { mm: 1.25, linearDensityGM: 1.50 },
      { mm: 1.30, linearDensityGM: 1.63 },
    ],
  },
  {
    brand: 'Solinco', name: 'Confidential', material: 'Polyester',
    gauges: [
      { mm: 1.20, linearDensityGM: 1.31 },
      { mm: 1.25, linearDensityGM: 1.48 },
    ],
  },
  {
    brand: 'Head', name: 'Lynx', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.48 },
      { mm: 1.30, linearDensityGM: 1.62 },
    ],
  },
  {
    brand: 'Head', name: 'Lynx Tour', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.49 },
      { mm: 1.30, linearDensityGM: 1.63 },
    ],
  },
  {
    brand: 'Head', name: 'Hawk', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.50 },
      { mm: 1.30, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Yonex', name: 'Poly Tour Pro', material: 'Polyester',
    gauges: [
      { mm: 1.20, linearDensityGM: 1.35 },
      { mm: 1.25, linearDensityGM: 1.50 },
      { mm: 1.30, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Yonex', name: 'Poly Tour Strike', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.49 },
      { mm: 1.30, linearDensityGM: 1.63 },
    ],
  },
  {
    brand: 'Yonex', name: 'Poly Tour Rev', material: 'Polyester',
    gauges: [
      { mm: 1.20, linearDensityGM: 1.34 },
      { mm: 1.25, linearDensityGM: 1.48 },
    ],
  },
  {
    brand: 'Tecnifibre', name: 'Razor Code', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.47 },
      { mm: 1.30, linearDensityGM: 1.61 },
    ],
  },
  {
    brand: 'Tecnifibre', name: 'Black Code', material: 'Polyester',
    gauges: [
      { mm: 1.24, linearDensityGM: 1.46 },
      { mm: 1.28, linearDensityGM: 1.56 },
    ],
  },
  {
    brand: 'Volkl', name: 'Cyclone', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.48 },
      { mm: 1.30, linearDensityGM: 1.62 },
    ],
  },
  {
    brand: 'Wilson', name: 'Revolve', material: 'Polyester',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.48 },
      { mm: 1.30, linearDensityGM: 1.63 },
    ],
  },
  {
    brand: 'Wilson', name: 'Luxilon Ace', material: 'Polyester',
    gauges: [
      { mm: 1.12, linearDensityGM: 1.20 },
    ],
  },
  // --- Multifilament ---
  {
    brand: 'Wilson', name: 'NXT', material: 'Multifilament',
    gauges: [
      { mm: 1.24, linearDensityGM: 1.30 },
      { mm: 1.30, linearDensityGM: 1.36 },
    ],
  },
  {
    brand: 'Tecnifibre', name: 'X-One Biphase', material: 'Multifilament',
    gauges: [
      { mm: 1.24, linearDensityGM: 1.30 },
      { mm: 1.30, linearDensityGM: 1.34 },
    ],
  },
  {
    brand: 'Tecnifibre', name: 'NRG2', material: 'Multifilament',
    gauges: [
      { mm: 1.24, linearDensityGM: 1.28 },
      { mm: 1.32, linearDensityGM: 1.37 },
    ],
  },
  {
    brand: 'Head', name: 'Velocity MLT', material: 'Multifilament',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.27 },
      { mm: 1.30, linearDensityGM: 1.35 },
    ],
  },
  // --- Natural Gut ---
  {
    brand: 'Babolat', name: 'VS Touch', material: 'NaturalGut',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.35 },
      { mm: 1.30, linearDensityGM: 1.42 },
    ],
  },
  {
    brand: 'Wilson', name: 'Natural Gut', material: 'NaturalGut',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.33 },
      { mm: 1.30, linearDensityGM: 1.40 },
    ],
  },
  {
    brand: 'Luxilon', name: 'Natural Gut', material: 'NaturalGut',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.34 },
      { mm: 1.30, linearDensityGM: 1.41 },
    ],
  },
  // --- Nylon / Synthetic Gut ---
  {
    brand: 'Prince', name: 'Synthetic Gut', material: 'Nylon',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.28 },
      { mm: 1.30, linearDensityGM: 1.37 },
    ],
  },
  {
    brand: 'Wilson', name: 'Synthetic Gut Power', material: 'Nylon',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.27 },
      { mm: 1.30, linearDensityGM: 1.36 },
    ],
  },
  {
    brand: 'Head', name: 'Synthetic Gut PPS', material: 'Nylon',
    gauges: [
      { mm: 1.25, linearDensityGM: 1.29 },
      { mm: 1.30, linearDensityGM: 1.38 },
    ],
  },
  // --- Toroline (estimated from cylinder model, co-polyester 1380 kg/m³) ---
  {
    brand: 'Toroline', name: 'O-TORO', material: 'Polyester',
    gauges: [
      { mm: 1.23, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Toroline', name: 'O-TORO Tour', material: 'Polyester',
    gauges: [
      { mm: 1.20, linearDensityGM: 1.56 },
      { mm: 1.23, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Toroline', name: 'O-TORO Spin', material: 'Polyester',
    gauges: [
      { mm: 1.23, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Toroline', name: 'O-TORO Snap', material: 'Polyester',
    gauges: [
      { mm: 1.23, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Toroline', name: 'O-TORO Octa', material: 'Polyester',
    gauges: [
      { mm: 1.23, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Toroline', name: 'Caviar', material: 'Polyester',
    gauges: [
      { mm: 1.16, linearDensityGM: 1.46 },
      { mm: 1.20, linearDensityGM: 1.56 },
      { mm: 1.24, linearDensityGM: 1.67 },
    ],
  },
  {
    brand: 'Toroline', name: 'Ether', material: 'Polyester',
    gauges: [
      { mm: 1.20, linearDensityGM: 1.56 },
    ],
  },
  {
    brand: 'Toroline', name: 'Wasabi', material: 'Polyester',
    gauges: [
      { mm: 1.23, linearDensityGM: 1.64 },
    ],
  },
  {
    brand: 'Toroline', name: 'Zero', material: 'Polyester',
    gauges: [
      { mm: 1.23, linearDensityGM: 1.64 },
      { mm: 1.28, linearDensityGM: 1.77 },
    ],
  },
];

/**
 * Look up the measured linear density for a specific string + gauge.
 * Returns density in kg/m, or null if not found.
 * Interpolates between gauges if an exact match isn't available.
 */
export function lookupLinearDensity(
  brand: string,
  name: string,
  gaugeMm: number
): number | null {
  const entry = STRING_DATABASE.find(
    s => s.brand === brand && s.name === name
  );
  if (!entry) return null;

  // Exact gauge match
  const exact = entry.gauges.find(g => Math.abs(g.mm - gaugeMm) < 0.005);
  if (exact) return exact.linearDensityGM / 1000; // convert g/m → kg/m

  // Interpolate between two nearest gauges
  const sorted = [...entry.gauges].sort((a, b) => a.mm - b.mm);
  if (gaugeMm < sorted[0].mm) return sorted[0].linearDensityGM / 1000;
  if (gaugeMm > sorted[sorted.length - 1].mm) return sorted[sorted.length - 1].linearDensityGM / 1000;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (gaugeMm >= sorted[i].mm && gaugeMm <= sorted[i + 1].mm) {
      const t = (gaugeMm - sorted[i].mm) / (sorted[i + 1].mm - sorted[i].mm);
      const density = sorted[i].linearDensityGM + t * (sorted[i + 1].linearDensityGM - sorted[i].linearDensityGM);
      return density / 1000;
    }
  }

  return null;
}

/** Get list of unique brands for UI */
export function getBrands(): string[] {
  return [...new Set(STRING_DATABASE.map(s => s.brand))];
}

/** Get string models for a given brand */
export function getModelsForBrand(brand: string): StringModel[] {
  return STRING_DATABASE.filter(s => s.brand === brand);
}
