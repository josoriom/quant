import { readFileSync, writeFileSync } from 'fs';

import 'dotenv/config';
import { fileCollectionFromPath } from 'filelist-utils';
import { parseMzML, getPeaksFromEic, getPeak, calculateEic } from 'msut';

import { Metabolite, parseCsv } from './utilities/parseCsv';

const samplesPath = process.env.PATH_SAMPLES;

const low = false;

const samplesUrl = new URL(samplesPath, import.meta.url);
const metabolitesUrl = new URL(
  `../data/metabolites${low ? '-low' : ''}.csv`,
  import.meta.url,
);
const outputUrl = new URL(
  `../data/output${low ? '-low' : '-high'}/`,
  import.meta.url,
);

const collection = (await fileCollectionFromPath(samplesUrl.pathname)).files;

const metabolites: Metabolite[] = parseCsv(
  readFileSync(metabolitesUrl, { encoding: 'utf8' }),
);
let counter = 0;
console.time('Whole run:');
const lowConfig = {
  autoNoise: true,
  widthThreshold: 3,
  autoBaseline: true,
  intensityThreshold: 200,
};
const highConfig = {
  autoNoise: true,
  widthThreshold: 8,
  autoBaseline: true,
  intensityThreshold: 1000,
};
for (const item of collection) {
  const name = item.name;
  console.time(`${counter}-${name}`);
  const buffer = await item.arrayBuffer();
  const file = parseMzML(buffer);
  const peaks = getPeaksFromEic(
    file,
    metabolites,
    0.5,
    5,
    low ? lowConfig : highConfig,
    2,
  );
  console.timeEnd(`${counter}-${name}`);
  writeFileSync(
    new URL(
      `${name.replaceAll(' ', '_20_').replace('.mzML', '.json')}`,
      outputUrl,
    ),
    JSON.stringify(peaks, null, 2),
  );
  counter++;
}
console.timeEnd('Whole run:');
