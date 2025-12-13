import { readFileSync, writeFileSync } from 'fs';
import 'dotenv/config';

import { fileCollectionFromPath } from 'filelist-utils';
import { convertBinToMzml, convertMzmlToBin, parseBin } from 'msut';

// const samplesPath = process.env.PATH_SAMPLES;
const samplePath =
  '/Users/josoriom/github/josoriom/quant/data/output-bin/covid19_biogune_MS_AA_PAI04_COVp20_220121_COV02001_19S20575_21.b32';
const sampleUrl = new URL(samplePath, import.meta.url);

const bmz = readFileSync(sampleUrl);
const bin = parseBin(bmz);
const mzml = convertBinToMzml(bin);

writeFileSync(new URL('./test-mzml.mzML', import.meta.url), mzml);
