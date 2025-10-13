const fs = require('fs');
const path = require('path');
const readline = require('readline');

const termsPath = path.join(__dirname, 'archive', 'gmdnTerms.txt');

const STOP_WORDS = new Set(['and', 'system', 'device', 'single', 'use', 'kit', 'set', 'the', 'of', 'for', 'to', 'with', 'ii', 'iii', 'iv', 'v']);

function canonicalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return canonicalize(text)
    .split(' ')
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));
}

function scoreTokens(queryTokens, candidateTokens) {
  const querySet = new Set(queryTokens);
  const candidateSet = new Set(candidateTokens);
  let intersection = 0;
  for (const token of querySet) {
    if (candidateSet.has(token)) {
      intersection += 1;
    }
  }
  if (intersection === 0) {
    return 0;
  }
  const union = querySet.size + candidateSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

async function loadEntries() {
  if (!fs.existsSync(termsPath)) {
    throw new Error(`Missing reference file: ${termsPath}`);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(termsPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const entries = [];
  const seenCodes = new Set();
  let lineNumber = 0;

  for await (const rawLine of rl) {
    lineNumber += 1;

    if (lineNumber === 1) {
      continue;
    }

    if (!rawLine || !rawLine.trim()) {
      continue;
    }

    const parts = rawLine.split('|');
    if (parts.length < 6) {
      continue;
    }

    const [, gmdnPTName, , gmdnCode, gmdnStatus] = parts;
    const name = gmdnPTName.trim();
    const code = gmdnCode.trim();
    const status = (gmdnStatus || '').trim();

    if (!name || !code || seenCodes.has(code)) {
      continue;
    }

    seenCodes.add(code);
    entries.push({
      code,
      name,
      status,
      tokens: tokenize(name)
    });
  }

  return entries;
}

async function main() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.error('Usage: node inspect-gmdn.cjs "<descriptor>"');
    process.exit(1);
  }

  const entries = await loadEntries();
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    console.error('Query yielded no tokens');
    process.exit(1);
  }

  const scored = entries
    .map((entry) => ({
      ...entry,
      score: scoreTokens(queryTokens, entry.tokens)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  if (!scored.length) {
    console.log('No candidates found');
    return;
  }

  for (const candidate of scored) {
    console.log(`${candidate.score.toFixed(3)} | ${candidate.code} | ${candidate.status || 'Unknown'} | ${candidate.name}`);
  }
}

main().catch((error) => {
  console.error('Failed to inspect GMDN terms:', error);
  process.exit(1);
});
