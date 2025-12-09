export interface Peak {
  name?: string;
  from: number;
  to: number;
  id: string;
  mz: number;
  rt: number;
  ort: number;
  intensity: number;
  integral: number;
  ratio?: number | null;
  isin?: number;
  ifrom?: number;
  ito?: number;
  irt?: number;
}
