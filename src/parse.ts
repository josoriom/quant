import { writeFileSync } from 'fs';
import 'dotenv/config';

import { fileCollectionFromPath } from 'filelist-utils';
import { binToJson, convertMzmlToBin, parseBin, parseMzML } from 'msut';

const samplesPath = process.env.PATH_SAMPLES;
const outputPath = '/Users/josoriom/github/josoriom/quant/data/output-bin';
const samplesUrl = new URL(samplesPath!, import.meta.url);
const outputUrl = new URL(outputPath, import.meta.url);

const collection = (await fileCollectionFromPath(samplesUrl.pathname)).files;

const CONCURRENCY = 10;

async function processItem(item: any, index: number) {
  const name = item.name.replace('mzML', 'b32');
  console.log(name);
  console.time(`Fetching... ${index}`);
  const buffer = await item.arrayBuffer();
  console.timeEnd(`Fetching... ${index}`);

  const label = `${index}- ${name}`;
  console.time(label);
  const bin = convertMzmlToBin(buffer, 5);
  console.timeEnd(label);
  console.time(`writing... ${index}`);
  writeFileSync(new URL(name, outputUrl), bin);
  console.timeEnd(`writing... ${index}`);
}

console.time('Whole process');

// simple worker-pool pattern
let index = 0;

const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (true) {
    const current = index++;
    if (current >= collection.length) break;

    const item = collection[current];
    await processItem(item, current);
  }
});

await Promise.all(workers);

console.timeEnd('Whole process');
