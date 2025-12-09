import { Peak } from '../types/peak';

export function peaksToTSV(peaks: Peak[]): string {
  const headers = [
    'name',
    'id',
    'mz',
    'ort',
    'rt',
    'from',
    'to',
    'intensity',
    'integral',
    'ratio',
    'is-rt',
    'is-intensity',
    'is-from',
    'is-to',
  ];
  const rows = peaks.map((peak) =>
    [
      peak.name ?? '',
      peak.id === 'beta-alanine'
        ? 'beta alanine'
        : peak.id === 'beta-aminoisobutyric acid'
          ? 'beta aminoisobutyric acid'
          : peak.id === 'alpha-aminobutyric acid'
            ? 'alpha aminobutyric acid'
            : peak.id === 'gamma-aminobutyric acid'
              ? 'gamma aminobutyric acid'
              : peak.id,
      peak.mz,
      peak.ort,
      peak.rt,
      peak.from,
      peak.to,
      peak.intensity,
      peak.integral,
      peak.ratio ?? '',
      peak.irt ?? '',
      peak.isin ?? '',
      peak.ifrom ?? '',
      peak.ito ?? '',
    ].join('\t'),
  );

  return [headers.join('\t'), ...rows].join('\n');
}
