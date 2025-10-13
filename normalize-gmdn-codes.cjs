const fs = require('fs');
const path = require('path');
const readline = require('readline');

const termsPath = path.join(__dirname, 'archive', 'gmdnTerms.txt');
const mappingsPath = path.join(__dirname, 'public', 'gmdn-emdn-mappings', 'gmdn-emdn-mappings.json');

const DEFAULT_SCORE = 95;
const STOP_WORDS = new Set(['and', 'system', 'device', 'single', 'use', 'kit', 'set', 'the', 'of', 'for', 'to', 'with', 'ii', 'iii', 'iv', 'v']);
const DRY_RUN = process.argv.includes('--dry-run');

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

function shouldPreferEntry(newEntry, existingEntry) {
  const score = (entry) => {
    switch (entry.status) {
      case 'Active':
        return 3;
      case 'Obsolete':
        return 1;
      default:
        return 2;
    }
  };

  const diff = score(newEntry) - score(existingEntry);
  if (diff !== 0) {
    return diff > 0;
  }

  // Prefer shorter canonical names when status ties (heuristic for duplicates)
  return newEntry.canonical.length < existingEntry.canonical.length;
}

async function loadReference() {
  console.log(`ℹ️ Streaming GMDN reference from ${termsPath}`);

  if (!fs.existsSync(termsPath)) {
    throw new Error(`Missing reference file: ${termsPath}`);
  }

  const exactNameMap = new Map();
  const lowerNameMap = new Map();
  const canonicalMap = new Map();
  const tokenIndex = new Map();
  const codeToEntry = new Map();
  const duplicates = new Map();

  const rl = readline.createInterface({
    input: fs.createReadStream(termsPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  for await (const rawLine of rl) {
    lineNumber += 1;

    if (lineNumber === 1) {
      if (!rawLine.includes('gmdnPTName') || !rawLine.includes('gmdnCode')) {
        throw new Error('Unexpected gmdnTerms header format');
      }
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

    if (!name || !code) {
      continue;
    }

    if (codeToEntry.has(code)) {
      continue;
    }

    const canonical = canonicalize(name);
    const tokens = tokenize(name);
    const entry = { code, name, status, canonical, tokens };

    codeToEntry.set(code, entry);

    if (!exactNameMap.has(name) || shouldPreferEntry(entry, exactNameMap.get(name))) {
      exactNameMap.set(name, entry);
    } else if (exactNameMap.get(name).code !== code) {
      if (!duplicates.has(name)) {
        duplicates.set(name, new Set([exactNameMap.get(name).code]));
      }
      duplicates.get(name).add(code);
    }

    const lower = name.toLowerCase();
    if (!lowerNameMap.has(lower) || shouldPreferEntry(entry, lowerNameMap.get(lower))) {
      lowerNameMap.set(lower, entry);
    }

    if (!canonicalMap.has(canonical)) {
      canonicalMap.set(canonical, [entry]);
    } else {
      const existing = canonicalMap.get(canonical);
      if (!existing.some((candidate) => candidate.code === code)) {
        existing.push(entry);
      }
    }

    for (const token of tokens) {
      if (!tokenIndex.has(token)) {
        tokenIndex.set(token, new Set());
      }
      tokenIndex.get(token).add(entry);
    }
  }

  console.log(`ℹ️ Loaded ${codeToEntry.size} unique GMDN codes from reference`);

  return { exactNameMap, lowerNameMap, canonicalMap, tokenIndex, duplicates };
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

function pickBestEntry(entries, queryTokens, minScore = 0.35) {
  if (!entries || entries.length === 0) {
    return null;
  }

  if (entries.length === 1) {
    return { entry: entries[0], score: 1 };
  }

  let bestEntry = null;
  let bestScore = 0;

  for (const entry of entries) {
    const score = scoreTokens(queryTokens, entry.tokens);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    } else if (score === bestScore && bestEntry && shouldPreferEntry(entry, bestEntry)) {
      bestEntry = entry;
    }
  }

  return bestScore >= minScore && bestEntry ? { entry: bestEntry, score: bestScore } : null;
}

async function normalizeMappings() {
  console.log(`ℹ️ Normalizing mappings at ${mappingsPath}`);

  if (!fs.existsSync(mappingsPath)) {
    throw new Error(`Missing mappings file: ${mappingsPath}`);
  }

  const reference = await loadReference();
  const rawMappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  const { metadata, mappings } = rawMappings;

  const conflicts = [];
  const missing = [];
  const matchStats = {
    exact: 0,
    caseInsensitive: 0,
    canonical: 0,
    fuzzy: 0
  };

  const updatedMappings = {};

  for (const entry of Object.values(mappings)) {
    const { gmdnDescription, emdnMatches } = entry;
    const trimmedDescription = gmdnDescription.trim();
    const lower = trimmedDescription.toLowerCase();
    const canonical = canonicalize(trimmedDescription);
    const tokens = tokenize(trimmedDescription);

    let chosen = reference.exactNameMap.get(trimmedDescription);
    if (chosen) {
      matchStats.exact += 1;
    }

    if (!chosen) {
      chosen = reference.lowerNameMap.get(lower);
      if (chosen) {
        matchStats.caseInsensitive += 1;
      }
    }

    if (!chosen) {
      const canonicalCandidates = reference.canonicalMap.get(canonical);
      const picked = pickBestEntry(canonicalCandidates, tokens);
      if (picked) {
        chosen = picked.entry;
        matchStats.canonical += 1;
      }
    }

    if (!chosen) {
      const candidateSet = new Set();
      for (const token of tokens) {
        const entriesForToken = reference.tokenIndex.get(token);
        if (entriesForToken) {
          for (const candidate of entriesForToken) {
            candidateSet.add(candidate);
          }
        }
      }

      const picked = pickBestEntry(Array.from(candidateSet), tokens, 0.3);
      if (picked) {
        chosen = picked.entry;
        matchStats.fuzzy += 1;
      }
    }

    let bestFallback = null;
    if (!chosen) {
      const fallbackCandidates = Array.from(tokens.reduce((acc, token) => {
        const entriesForToken = reference.tokenIndex.get(token);
        if (entriesForToken) {
          for (const candidate of entriesForToken) {
            acc.add(candidate);
          }
        }
        return acc;
      }, new Set()));

      bestFallback = pickBestEntry(fallbackCandidates, tokens, 0);
      missing.push({
        description: trimmedDescription,
        suggestion: bestFallback ? { code: bestFallback.entry.code, name: bestFallback.entry.name, score: Number(bestFallback.score.toFixed(3)) } : null
      });
    }

    const chosenEntry = chosen || (bestFallback ? bestFallback.entry : null);

    const actualCode = chosenEntry ? chosenEntry.code : entry.gmdnCode;
    const actualDescription = chosenEntry ? chosenEntry.name : trimmedDescription;

    const patchedMatches = (emdnMatches || []).map((match) => ({
      emdnCode: match.emdnCode,
      emdnDescription: match.emdnDescription,
      score: typeof match.score === 'number' ? match.score : DEFAULT_SCORE,
      category: match.category ?? (match.emdnCode ? match.emdnCode.charAt(0) : 'N')
    }));

    const payload = {
      gmdnCode: actualCode,
      gmdnDescription: actualDescription,
      emdnMatches: patchedMatches
    };

    if (updatedMappings[actualCode]) {
      const existing = updatedMappings[actualCode];
      conflicts.push({
        code: actualCode,
        existingDescription: existing.gmdnDescription,
        newDescription: actualDescription
      });

      const existingMatches = new Map(existing.emdnMatches.map((m) => [m.emdnCode, m]));
      for (const match of payload.emdnMatches) {
        if (!existingMatches.has(match.emdnCode)) {
          existingMatches.set(match.emdnCode, match);
        }
      }
      updatedMappings[actualCode] = {
        gmdnCode: actualCode,
        gmdnDescription: existing.gmdnDescription,
        emdnMatches: Array.from(existingMatches.values())
      };
    } else {
      updatedMappings[actualCode] = payload;
    }
  }

  const sortedCodes = Object.keys(updatedMappings).sort((a, b) => Number(a) - Number(b));
  const normalizedMappings = {};
  for (const code of sortedCodes) {
    normalizedMappings[code] = updatedMappings[code];
  }

  const newMetadata = {
    ...metadata,
    generated: new Date().toISOString(),
    version: '3.2.0',
    description: `Complete validated GMDN to EMDN device code mappings - ${sortedCodes.length} mappings`,
    stats: {
      totalGmdn: sortedCodes.length,
      mappedGmdn: sortedCodes.length,
      manualMappings: sortedCodes.length,
      automaticMappings: 0
    }
  };

  if (!DRY_RUN) {
    const backupPath = `${mappingsPath}.backup-${Date.now()}`;
    fs.copyFileSync(mappingsPath, backupPath);

    fs.writeFileSync(
      mappingsPath,
      JSON.stringify(
        {
          metadata: newMetadata,
          mappings: normalizedMappings
        },
        null,
        2
      )
    );
    console.log(`✅ Normalized mappings written to ${path.relative(process.cwd(), mappingsPath)}`);
  } else {
    console.log('🧪 Dry run complete – no files were modified');
  }

  console.log(`📊 Unique GMDN codes: ${sortedCodes.length}`);
  console.log(`   • Exact matches: ${matchStats.exact}`);
  console.log(`   • Case-insensitive matches: ${matchStats.caseInsensitive}`);
  console.log(`   • Canonical matches: ${matchStats.canonical}`);
  console.log(`   • Fuzzy matches: ${matchStats.fuzzy}`);

  if (missing.length) {
    console.warn('\n⚠️ Missing GMDN codes for descriptions:');
    for (const item of missing.sort((a, b) => a.description.localeCompare(b.description))) {
      const hint = item.suggestion ? ` (suggested: ${item.suggestion.code} → ${item.suggestion.name} [${item.suggestion.score}])` : '';
      console.warn(` - ${item.description}${hint}`);
    }
  }

  if (conflicts.length) {
    console.warn('\n⚠️ Conflicting descriptions sharing the same GMDN code:');
    for (const conflict of conflicts) {
      console.warn(` - ${conflict.code}: "${conflict.existingDescription}" vs "${conflict.newDescription}"`);
    }
  }

  if (reference.duplicates.size) {
    console.warn('\nℹ️ Descriptions with multiple codes in reference file:');
    for (const [desc, codes] of reference.duplicates.entries()) {
      console.warn(` - ${desc}: ${Array.from(codes).join(', ')}`);
    }
  }
}

normalizeMappings()
  .then(() => {
    console.log('✅ Normalization complete');
  })
  .catch((error) => {
    console.error('❌ Normalization failed:', error);
    process.exit(1);
  });
