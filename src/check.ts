import { readFileSync, writeFileSync } from 'fs';

import 'dotenv/config';

import { fileCollectionFromPath } from 'filelist-utils';
import {
  parseMzML,
  getPeaksFromEic,
  getPeak,
  calculateEic,
  findPeaks,
} from 'msut';

import { Metabolite, parseCsv } from './utilities/parseCsv';

const samplesPath = process.env.PATH_SAMPLES;
const samplesUrl = new URL(samplesPath, import.meta.url);

const low = false;

const metabolitesUrl = new URL(
  `../data/metabolites${low ? '-low' : ''}.csv`,
  import.meta.url,
);

const collection = (await fileCollectionFromPath(samplesUrl.pathname)).files;

const metabolites: Metabolite[] = parseCsv(
  readFileSync(metabolitesUrl, { encoding: 'utf8' }),
);

const lowConfig = {
  autoNoise: true,
  widthThreshold: 3,
  autoBaseline: true,
  intensityThreshold: 200,
};
const highConfig = {
  autoNoise: true,
  widthThreshold: 5,
  autoBaseline: true,
  intensityThreshold: 700,
};

const sampleName = 'covid19_biogune_MS_AA_PAI04_COVp21_220121_QC_20_4_15';
const targetMetabolite = 'Arginine';
const sampleNameSafe = sampleName.replace('_20_', ' ');

const metabolite = metabolites.find((item) => item.id === targetMetabolite);
console.log('sample name:', `${sampleNameSafe}.mzML`);
console.log(metabolite);
console.log(low ? 'LOW' : 'HIGH');
const item = collection.find((item) => item.name === `${sampleNameSafe}.mzML`);
const buffer = await item.arrayBuffer();
const file = parseMzML(buffer);
const eic = calculateEic(
  file,
  metabolite.mz,
  metabolite.rt - 1,
  metabolite.rt + 1,
);

const pks = findPeaks(eic.x, eic.y, low ? lowConfig : highConfig);

console.log(pks);

const peak = getPeak(
  eic.x,
  eic.y,
  metabolite.rt,
  metabolite.range,
  low ? lowConfig : highConfig,
);

console.log(peak);

const peaks = getPeaksFromEic(
  file,
  [
    {
      mz: metabolite.mz,
      range: metabolite.range,
      rt: metabolite.rt,
      id: metabolite.id,
    },
  ],
  0,
  5,
  low ? lowConfig : highConfig,
  10,
);

console.log(JSON.stringify(peaks[0]));
