/**
 * PERSCOM Advance — Frontend Unit Configuration
 * Fetches unit branding and feature flags from the backend.
 * Falls back to Vite env vars or defaults if unavailable.
 */

export const DEFAULT_CONFIG = {
  unitName: import.meta.env.VITE_UNIT_NAME || 'PERSCOM',
  unitAbbreviation: import.meta.env.VITE_UNIT_ABBREVIATION || 'PCM',
  unitLogo: '/uploads/logo.png',
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#1e40af',
  accentColor: '#3b82f6',
  theme: 'dark',
  features: {
    operations: true,
    evaluations: true,
    orbat: true,
    documents: true,
    gearLoadouts: true,
    attendance: true,
    spotlights: true,
  },
  welcomeMessage: 'Welcome to PERSCOM.',
};

let _cachedConfig = null;

export async function getUnitConfig() {
  if (_cachedConfig) return _cachedConfig;
  try {
    const res = await fetch('/api/settings/unit-config');
    if (!res.ok) throw new Error('Failed to fetch unit config');
    _cachedConfig = await res.json();
    return _cachedConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function getCachedConfig() {
  return _cachedConfig || DEFAULT_CONFIG;
}
