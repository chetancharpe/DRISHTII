/**
 * GoWow Internationalization (i18n) Key Parity Verification Script
 * Validates 1:1 key parity and non-empty translation strings between
 * English (client/src/i18n/en/common.ts) and Hindi (client/src/i18n/hi/common.ts).
 */

const fs = require('fs');
const path = require('path');

function extractObject(filePath) {
  const fullPath = path.resolve(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const equalsIndex = content.indexOf('= {');
  if (equalsIndex === -1) {
    throw new Error(`Could not find object declaration in: ${filePath}`);
  }
  const startIndex = equalsIndex + 2;
  const endIndex = content.lastIndexOf('}') + 1;
  const objCode = content.substring(startIndex, endIndex);
  try {
    return eval('(' + objCode + ')');
  } catch (err) {
    throw new Error(`Failed to parse dictionary from ${filePath}: ${err.message}`);
  }
}

function collectKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(collectKeys(v, fullKey));
    } else {
      keys.push({ key: fullKey, value: v });
    }
  }
  return keys;
}

function verifyParity() {
  console.log('🔍 Checking GoWow i18n English vs Hindi translation key parity...\n');

  const enDict = extractObject('../src/i18n/en/common.ts');
  const hiDict = extractObject('../src/i18n/hi/common.ts');

  const enEntries = collectKeys(enDict);
  const hiEntries = collectKeys(hiDict);

  const enKeyMap = new Map(enEntries.map(e => [e.key, e.value]));
  const hiKeyMap = new Map(hiEntries.map(e => [e.key, e.value]));

  const missingInHindi = [];
  const missingInEnglish = [];
  const emptyHindiValues = [];
  const emptyEnglishValues = [];

  for (const [key, val] of enKeyMap.entries()) {
    if (!hiKeyMap.has(key)) {
      missingInHindi.push(key);
    } else {
      const hiVal = hiKeyMap.get(key);
      if (typeof hiVal !== 'string' || !hiVal.trim()) {
        emptyHindiValues.push(key);
      }
    }
    if (typeof val !== 'string' || !val.trim()) {
      emptyEnglishValues.push(key);
    }
  }

  for (const key of hiKeyMap.keys()) {
    if (!enKeyMap.has(key)) {
      missingInEnglish.push(key);
    }
  }

  // Print namespace breakdown
  console.log('📊 Namespace Breakdown:');
  for (const ns of Object.keys(enDict)) {
    const count = enEntries.filter(e => e.key.startsWith(ns + '.')).length;
    console.log(`   - ${ns.padEnd(16)} : ${count} keys`);
  }
  console.log(`\nTotal translation keys: ${enEntries.length}\n`);

  let hasError = false;

  if (missingInHindi.length > 0) {
    console.error(`❌ Missing in Hindi (${missingInHindi.length} keys):`);
    missingInHindi.forEach(k => console.error(`   - ${k}`));
    hasError = true;
  }

  if (missingInEnglish.length > 0) {
    console.error(`❌ Unexpected extra keys in Hindi (${missingInEnglish.length} keys):`);
    missingInEnglish.forEach(k => console.error(`   - ${k}`));
    hasError = true;
  }

  if (emptyHindiValues.length > 0) {
    console.error(`❌ Empty Hindi strings (${emptyHindiValues.length} keys):`);
    emptyHindiValues.forEach(k => console.error(`   - ${k}`));
    hasError = true;
  }

  if (emptyEnglishValues.length > 0) {
    console.error(`❌ Empty English strings (${emptyEnglishValues.length} keys):`);
    emptyEnglishValues.forEach(k => console.error(`   - ${k}`));
    hasError = true;
  }

  if (hasError) {
    console.error('\n❌ i18n parity check FAILED. Please resolve missing/empty keys above.\n');
    process.exit(1);
  }

  console.log('✅ PERFECT 1:1 KEY PARITY CONFIRMED!');
  console.log('   All English and Hindi translation tokens match with 100% parity.\n');
}

verifyParity();
