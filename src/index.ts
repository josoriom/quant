import { readFileSync, writeFileSync } from 'fs';

import 'dotenv/config';
import { fileCollectionFromPath } from 'filelist-utils';
import { parseMzML, getPeaksFromEic } from 'msut';

import { Metabolite, parseCsv } from './utilities/parseCsv';

const samplesPath = process.env.PATH_SAMPLES;

const samplesUrl = new URL(samplesPath, import.meta.url);
const metabolitesUrl = new URL('../data/metabolites.csv', import.meta.url);
const outputUrl = new URL('../output/', import.meta.url);

const collection = (await fileCollectionFromPath(samplesUrl.pathname)).files;

const metabolites: Metabolite[] = parseCsv(
  readFileSync(metabolitesUrl, { encoding: 'utf8' }),
);

for (const item of collection) {
  const name = item.name;
  const buffer = await item.arrayBuffer();
  const file = parseMzML(buffer);
  const peaks = getPeaksFromEic(
    file,
    metabolites,
    0.5,
    5,
    { autoNoise: true, widthThreshold: 9, autoBaseline: true },
    10,
  );
  writeFileSync(
    new URL(`${name}.json`, outputUrl),
    JSON.stringify(peaks, null, 2),
  );
}
