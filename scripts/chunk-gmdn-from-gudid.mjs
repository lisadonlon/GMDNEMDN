import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const DEFAULT_CHUNK_SIZE = 1000;
const chunkSizeArg = Number.parseInt(process.argv[2] ?? '', 10);
const chunkSize = Number.isFinite(chunkSizeArg) && chunkSizeArg > 0 ? chunkSizeArg : DEFAULT_CHUNK_SIZE;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sourcePath = path.join(projectRoot, 'data', 'gmdnFromGUDID.ts');
const outputDir = path.join(projectRoot, 'exports', 'gmdn-from-gudid');

const ensureOutputDir = async () => {
  await fs.mkdir(outputDir, { recursive: true });
};

const toCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  const escaped = stringValue.replaceAll('"', '""');
  return `"${escaped}"`;
};

const readRecords = async () => {
  const raw = await fs.readFile(sourcePath, 'utf8');
  const cleaned = raw
    .replace(/import[^;]+;/g, '')
    .replace(/export function [^{]+{[\s\S]*?}\s*/g, '')
    .replace(/export const gmdnFromGUDID:\s*SecondaryCode\[\]\s*=\s*/m, 'module.exports = ');

  const context = { module: { exports: null } };
  vm.createContext(context);
  vm.runInContext(`${cleaned}\n;module.exports;`, context, { filename: 'gmdnFromGUDID.ts' });

  const records = context.module.exports;
  if (!Array.isArray(records)) {
    throw new Error('Failed to load gmdnFromGUDID records');
  }
  return records;
};

const buildCsv = (records) => {
  const header = ['code', 'description', 'relatedEmdnCodes'];
  const rows = records.map(({ code, description, relatedEmdnCodes }) => {
    const related = Array.isArray(relatedEmdnCodes) ? relatedEmdnCodes.join(';') : '';
    return [code, description, related].map(toCsvValue).join(',');
  });
  return [header.map(toCsvValue).join(','), ...rows].join('\n');
};

const writeChunks = async (records) => {
  await ensureOutputDir();

  const total = records.length;
  const chunkCount = Math.ceil(total / chunkSize);
  const tasks = [];

  for (let index = 0; index < chunkCount; index += 1) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, total);
    const slice = records.slice(start, end);
    const csv = buildCsv(slice);
    const fileName = `gmdn-from-gudid-part-${String(index + 1).padStart(3, '0')}.csv`;
    const filePath = path.join(outputDir, fileName);
    tasks.push(fs.writeFile(filePath, csv, 'utf8'));
  }

  const combinedCsv = buildCsv(records);
  const combinedPath = path.join(outputDir, 'gmdn-from-gudid-all.csv');
  tasks.push(fs.writeFile(combinedPath, combinedCsv, 'utf8'));

  await Promise.all(tasks);
  return { total, chunkCount, chunkSize };
};

const writeSummary = async ({ total, chunkCount }) => {
  const summary = {
    generatedAt: new Date().toISOString(),
    source: path.relative(projectRoot, sourcePath),
    totalRecords: total,
    chunkSize,
    chunks: chunkCount,
  };
  const summaryPath = path.join(outputDir, 'summary.json');
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
};

const main = async () => {
  const records = await readRecords();
  const stats = await writeChunks(records);
  await writeSummary(stats);
  console.log(`Exported ${stats.total} records into ${stats.chunkCount} chunk(s) of up to ${stats.chunkSize} rows.`);
  console.log(`Files written to ${path.relative(projectRoot, outputDir)}`);
};

main().catch((error) => {
  console.error('Failed to export GMDN CSV chunks');
  console.error(error);
  process.exitCode = 1;
});
