import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSourcePath = path.join(projectRoot, 'data', 'corrected-gmdn-emdn-mappings.psv');
const targetPath = path.join(projectRoot, 'public', 'gmdn-emdn-mappings', 'gmdn-emdn-mappings.json');

const [, , sourceArg, versionArg] = process.argv;
const sourcePath = path.isAbsolute(sourceArg ?? '')
  ? sourceArg
  : path.resolve(projectRoot, sourceArg ?? defaultSourcePath);
const outputVersion = versionArg ?? '4.0.0';

const parseLine = (line) => {
  const [codeRaw, descriptionRaw, emdnCodeRaw, emdnTermRaw] = line.split('|').map((part) => part?.trim() ?? '');
  if (!codeRaw || !descriptionRaw || !emdnCodeRaw || !emdnTermRaw) {
    throw new Error(`Invalid mapping line: ${line}`);
  }
  return {
    gmdnCode: codeRaw,
    gmdnDescription: descriptionRaw,
    emdnCode: emdnCodeRaw,
    emdnDescription: emdnTermRaw,
  };
};

const loadMappings = async () => {
  const raw = await fs.readFile(sourcePath, 'utf8');
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const header = lines.shift();
  if (!header?.toLowerCase().startsWith('correct gmdn code')) {
    throw new Error('Unexpected header row in corrected mappings file');
  }

  return lines.map(parseLine);
};

const buildMappingRecord = (entry) => ({
  gmdnCode: entry.gmdnCode,
  gmdnDescription: entry.gmdnDescription,
  emdnMatches: [
    {
      emdnCode: entry.emdnCode,
      emdnDescription: entry.emdnDescription,
      score: 100,
      category: entry.emdnCode.charAt(0),
    },
  ],
});

const consolidateMappings = (entries) => {
  const map = new Map();
  for (const entry of entries) {
    const existing = map.get(entry.gmdnCode);
    if (!existing) {
      map.set(entry.gmdnCode, buildMappingRecord(entry));
      continue;
    }

    if (existing.gmdnDescription !== entry.gmdnDescription) {
      console.warn(`Warning: gmdnCode ${entry.gmdnCode} has differing descriptions. Keeping "${existing.gmdnDescription}" and discarding "${entry.gmdnDescription}"`);
    }

    if (!existing.emdnMatches.some((match) => match.emdnCode === entry.emdnCode)) {
      existing.emdnMatches.push({
        emdnCode: entry.emdnCode,
        emdnDescription: entry.emdnDescription,
        score: 100,
        category: entry.emdnCode.charAt(0),
      });
    }
  }
  return map;
};

const loadExisting = async () => {
  try {
    const raw = await fs.readFile(targetPath, 'utf8');
    const parsed = JSON.parse(raw);
    const records = parsed?.mappings ?? {};
    return {
      map: new Map(Object.values(records).map((record) => [record.gmdnCode, record])),
      metadata: parsed?.metadata ?? {},
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { map: new Map(), metadata: {} };
    }
    throw error;
  }
};

const buildOutput = (recordsMap, baseMetadata) => {
  const entries = Array.from(recordsMap.values()).sort((a, b) => a.gmdnCode.localeCompare(b.gmdnCode));
  const metadata = {
    ...baseMetadata,
    generated: new Date().toISOString(),
    version: outputVersion,
    description: 'Corrected GMDN to EMDN device code mappings',
    stats: {
      totalGmdn: entries.length,
      mappedGmdn: entries.length,
      manualMappings: entries.length,
      automaticMappings: 0,
    },
  };

  const mappings = Object.fromEntries(entries.map((entry) => [entry.gmdnCode, entry]));
  return {
    metadata,
    mappings,
  };
};

const main = async () => {
  const parsed = await loadMappings();
  const consolidatedNew = consolidateMappings(parsed);
  const { map: existing, metadata: existingMetadata } = await loadExisting();

  let updated = 0;
  for (const [gmdnCode, record] of consolidatedNew.entries()) {
    const existingRecord = existing.get(gmdnCode);
    if (!existingRecord) {
      existing.set(gmdnCode, record);
      updated += 1;
      continue;
    }

    existingRecord.gmdnDescription = record.gmdnDescription;

    const matchCodes = new Set(existingRecord.emdnMatches.map((match) => match.emdnCode));
    let merged = false;
    for (const match of record.emdnMatches) {
      if (!matchCodes.has(match.emdnCode)) {
        existingRecord.emdnMatches.push(match);
        merged = true;
      }
    }
    if (merged) {
      updated += 1;
    }
  }

  const output = buildOutput(existing, existingMetadata);
  await fs.writeFile(targetPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Processed ${parsed.length} corrected mappings from ${path.relative(projectRoot, sourcePath)}`);
  console.log(`Dataset now contains ${existing.size} unique GMDN codes. Updated/merged ${updated} entries.`);
  console.log(`Output written to ${path.relative(projectRoot, targetPath)}`);
};

main().catch((error) => {
  console.error('Failed to apply corrected mappings');
  console.error(error);
  process.exitCode = 1;
});
