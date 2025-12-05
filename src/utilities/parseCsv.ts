export interface Metabolite {
  id: string;
  mz: number;
  rt: number;
  range: number;
}

const NAME_COL = 1;
const MZ_COL = 2;
const RT_COL = 4;
const RANGE_COL = 5;

export function parseCsv(csv: string): Metabolite[] {
  const lines = csv.split(/\r?\n/);
  const out: Metabolite[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseCsvRow(line);
    if (row.length <= RANGE_COL) continue;

    const id = row[NAME_COL];
    const mz = Number(row[MZ_COL]);
    const rt = Number(row[RT_COL]);
    const range = Number(row[RANGE_COL]);

    if (
      !id ||
      !Number.isFinite(mz) ||
      !Number.isFinite(rt) ||
      !Number.isFinite(range)
    ) {
      continue;
    }

    out.push({ id, mz, rt, range });
  }

  return out;
}

function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}
