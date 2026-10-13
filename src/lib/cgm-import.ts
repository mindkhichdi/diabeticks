export interface CgmSample { recorded_at: string; value_mgdl: number }
export interface ParseResult { format: string; samples: CgmSample[]; skipped: number }

const MMOL_TO_MG = 18.0182;

const splitLine = (line: string, delim: string) => {
  const out: string[] = []; let cur = ''; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === delim && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
};

/** Parses dates like "2026-10-01T08:05:00", "2026-10-01 08:05", "10-01-2026 08:05" (MM-DD-YYYY) or "01/10/2026 08:05". */
export const parseDate = (s: string): Date | null => {
  const v = s.trim();
  if (!v) return null;
  const iso = /^\d{4}-\d{2}-\d{2}/.test(v) ? new Date(v.replace(' ', 'T')) : null;
  if (iso && !isNaN(iso.getTime())) return iso;
  const m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!m) return null;
  let [a, b] = [Number(m[1]), Number(m[2])];
  let hh = Number(m[4]);
  if (m[7]) { const pm = m[7].toUpperCase() === 'PM'; if (pm && hh < 12) hh += 12; if (!pm && hh === 12) hh = 0; }
  // LibreView US exports use MM-DD-YYYY; if first part > 12 it must be the day.
  let month = a, day = b;
  if (a > 12) { day = a; month = b; }
  const d = new Date(Number(m[3]), month - 1, day, hh, Number(m[5]), Number(m[6] ?? 0));
  return isNaN(d.getTime()) ? null : d;
};

const toMg = (v: number, mmol: boolean) => Math.round(mmol ? v * MMOL_TO_MG : v);

export const parseCgmCsv = (text: string): ParseResult => {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  const delim = (lines.slice(0, 5).join('').match(/\t/g)?.length ?? 0) > 3 ? '\t' : ',';

  // Find header row: first row containing a timestamp-ish and glucose-ish column.
  let headerIdx = -1; let header: string[] = [];
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cols = splitLine(lines[i], delim).map((c) => c.toLowerCase());
    if (cols.some((c) => /time|date/.test(c)) && cols.some((c) => /glucose|value|mg\/dl|mmol/.test(c))) {
      headerIdx = i; header = cols; break;
    }
  }
  if (headerIdx < 0) throw new Error('Could not find time and glucose columns in this file.');

  const joined = header.join('|');
  const format = joined.includes('dexcom') || joined.includes('event type')
    ? 'Dexcom Clarity'
    : joined.includes('historic glucose') || joined.includes('record type')
      ? 'FreeStyle Libre'
      : 'Generic CSV';
  const mmolHeader = /mmol/.test(joined);

  const timeIdx = header.findIndex((c) => /timestamp|device timestamp|date.?time|^time$|^date$|start/.test(c));
  const glucoseIdxs = header
    .map((c, i) => (/(historic|scan|egv|glucose value|blood glucose|^glucose|^value)/.test(c) && !/type|unit|trend|rate/.test(c) ? i : -1))
    .filter((i) => i >= 0);
  const eventIdx = header.findIndex((c) => c === 'event type');
  if (timeIdx < 0 || glucoseIdxs.length === 0) throw new Error('Could not find time and glucose columns in this file.');

  const seen = new Set<string>();
  const samples: CgmSample[] = []; let skipped = 0;
  for (const line of lines.slice(headerIdx + 1)) {
    const cols = splitLine(line, delim);
    if (eventIdx >= 0 && cols[eventIdx] && cols[eventIdx].toLowerCase() !== 'egv') { skipped++; continue; }
    const d = parseDate(cols[timeIdx] ?? '');
    const rawVal = glucoseIdxs.map((i) => cols[i]).find((v) => v && v.trim() !== '');
    if (!d || !rawVal) { skipped++; continue; }
    const lowered = rawVal.toLowerCase();
    const num = lowered === 'low' ? 40 : lowered === 'high' ? 400 : Number(rawVal.replace(',', '.'));
    if (!isFinite(num) || num <= 0) { skipped++; continue; }
    const mg = toMg(num, mmolHeader || num < 35);
    if (mg < 20 || mg > 600) { skipped++; continue; }
    const key = d.toISOString();
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);
    samples.push({ recorded_at: key, value_mgdl: mg });
  }
  samples.sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  return { format, samples, skipped };
};

export const timeInRange = (samples: { value_mgdl: number }[], min = 70, max = 180) => {
  if (!samples.length) return { low: 0, inRange: 0, high: 0 };
  const low = samples.filter((s) => s.value_mgdl < min).length;
  const high = samples.filter((s) => s.value_mgdl > max).length;
  const n = samples.length;
  return { low: Math.round((low / n) * 100), high: Math.round((high / n) * 100), inRange: Math.round(((n - low - high) / n) * 100) };
};
