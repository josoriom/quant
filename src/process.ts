import { readFileSync, writeFileSync } from 'node:fs';

import { fileCollectionFromPath } from 'filelist-utils';
import { xMedian, xMedianAbsoluteDeviation } from 'ml-spectra-processing';
import { Peak } from './types/peak';
import { peaksToTSV } from './utilities/peaksToTSV';

const path = '/Users/josoriom/github/josoriom/quant/data/output-mzml';
const url = new URL(path, import.meta.url);

const list: Analyte[] = JSON.parse(
  readFileSync('/Users/josoriom/github/josoriom/quant/data/metabolites.json', {
    encoding: 'utf8',
  }),
);

export interface Analyte {
  analyteName: string;
  rt: number;
  mean: number;
  mz: number;
  sd: number;
  is: string;
  type: 'sample' | 'IS';
}

const collection = (await fileCollectionFromPath(url.pathname)).files;
const result: Peak[] = [];
for (const file of collection) {
  const sample: Peak[] = JSON.parse(await file.text());
  for (const metabolite of list) {
    if (metabolite.type === 'IS') continue;
    for (const peak of sample) {
      if (peak.id === metabolite.analyteName) {
        const is = sample.find((item) => item.id === metabolite.is);
        if (is) {
          peak.ratio = peak.integral / is.integral;
          peak.isin = is.intensity;
          peak.irt = is.rt;
          peak.ifrom = is.from;
          peak.ito = is.to;
        }
        peak.name = file.name
          .replace('.json', '')
          .replace('disk2_MS-ARCHIVE-1_covid19_biogune_MS-AA-', '');
        result.push({ ...peak });
      }
    }
  }
}

const { clean, statsById } = purgeOutliersByRtIrt(result, {
  k: 15,
  requireIrt: true,
  minN: 5,
  epsilon: 0.003,
});

console.log(statsById);

writeFileSync(new URL('./mzml.tsv', import.meta.url), peaksToTSV(result));

type NonNullableNumber = number & {};

function isFiniteNumber(x: unknown): x is NonNullableNumber {
  return typeof x === 'number' && Number.isFinite(x);
}

type ClusterStats = {
  center: number;
  sd: number;
  n: number;
};

type RtIrtStats = {
  rt?: ClusterStats;
  irt?: ClusterStats;
};

function statsFrom(values: number[]): ClusterStats | undefined {
  const vals = values.filter(isFiniteNumber);
  if (vals.length === 0) return undefined;
  const center = xMedian(vals);
  const sd = xMedianAbsoluteDeviation(vals).mad;
  return { center, sd, n: vals.length };
}

export type PurgeOptions = {
  k?: number;
  requireIrt?: boolean;
  minN?: number;
  epsilon?: number;
};

export function purgeOutliersByRtIrt(
  peaks: Peak[],
  opts: PurgeOptions = {},
): { clean: Peak[]; statsById: Record<string, RtIrtStats> } {
  const { k = 1, requireIrt = true, minN = 3, epsilon = 0.001 } = opts;

  const rtMap = new Map<string, number[]>();
  const irtMap = new Map<string, number[]>();

  for (const p of peaks.filter((item) => item.name?.includes('Cal'))) {
    if (isFiniteNumber(p.rt)) {
      const a = rtMap.get(p.id) ?? [];
      a.push(p.rt);
      rtMap.set(p.id, a);
    }
    if (isFiniteNumber(p.irt)) {
      const a = irtMap.get(p.id) ?? [];
      a.push(p.irt);
      irtMap.set(p.id, a);
    }
  }

  const statsById: Record<string, RtIrtStats> = {};
  const ids = new Set<string>([...rtMap.keys(), ...irtMap.keys()]);
  for (const id of ids) {
    const rtVals = rtMap.get(id) ?? [];
    const irtVals = irtMap.get(id) ?? [];
    const rt = rtVals.length >= minN ? statsFrom(rtVals) : undefined;
    const irt = irtVals.length >= minN ? statsFrom(irtVals) : undefined;
    statsById[id] = { rt, irt };
  }

  const inBand = (value: number, s: ClusterStats): boolean =>
    Math.abs(value - s.center) <= Math.max(s.sd * k, epsilon);

  const clean: Peak[] = peaks.map((p) => {
    const st = statsById[p.id];

    let rtOk = true;
    if (isFiniteNumber(p.rt) && st.rt && st.rt.n >= minN)
      rtOk = inBand(p.rt, st.rt);

    let irtOk = true;
    if (requireIrt) {
      if (!isFiniteNumber(p.irt)) irtOk = false;
      else if (st.irt && st.irt.n >= minN) irtOk = inBand(p.irt, st.irt);
    } else {
      if (isFiniteNumber(p.irt) && st.irt && st.irt.n >= minN)
        irtOk = inBand(p.irt, st.irt);
    }

    return rtOk && irtOk ? { ...p } : { ...p, ratio: null };
  });

  return { clean, statsById };
}
