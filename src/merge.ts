import { writeFileSync } from 'fs';
import 'dotenv/config';
import { fileCollectionFromPath } from 'filelist-utils';

const highUrl = new URL('../data/output-high/', import.meta.url);
const lowUrl = new URL('../data/output-low/', import.meta.url);
const outUrl = new URL('../data/output/', import.meta.url);

const highCollection = await fileCollectionFromPath(highUrl.pathname);
const lowCollection = await fileCollectionFromPath(lowUrl.pathname);

const highFiles = highCollection.files;
const lowFiles = lowCollection.files;

for (const highFile of highFiles) {
  const name = highFile.name;

  let lowFile: (typeof lowFiles)[number] | undefined;
  for (const candidate of lowFiles) {
    if (candidate.name === name) {
      lowFile = candidate;
      break;
    }
  }

  if (!lowFile) {
    continue;
  }

  const highJson = JSON.parse(await highFile.text()) as Peak[];
  const lowJson = JSON.parse(await lowFile.text()) as Peak[];

  for (const lowPeak of lowJson) {
    for (let i = 0; i < highJson.length; i++) {
      const highPeak = highJson[i];
      if (highPeak.id === lowPeak.id) {
        highJson[i] = lowPeak;
        break;
      }
    }
  }

  const safeName = name.replace(/ /g, '_20_');
  const fileUrl = new URL(safeName, outUrl);
  writeFileSync(fileUrl, JSON.stringify(highJson, null, 2));
}

interface Peak {
  id: string;
  from: number;
  to: number;
  rt: number;
  ort: number;
  mz: number;
  integral: number;
  intensity: number;
  noise: number;
  [key: string]: unknown;
}
