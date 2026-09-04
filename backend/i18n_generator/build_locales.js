const fs = require('fs');
const path = require('path');

const part1 = require('./locales_data_part1');
const part2 = require('./locales_data_part2');

const allNewTranslations = { ...part1, ...part2 };
const localesDir = path.resolve(__dirname, '../../frontend/src/i18n/locales');

const ALL_LANGUAGES = [
  'en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa',
  'or', 'as', 'ur', 'sa', 'ne', 'kok', 'ks', 'mai', 'sd', 'mni'
];

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

console.log('Merging expanded locales into', localesDir);

ALL_LANGUAGES.forEach((lang) => {
  const filePath = path.join(localesDir, `${lang}.json`);
  let existing = {};
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  const additions = allNewTranslations[lang] || {};
  const merged = deepMerge(existing, additions);

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`✓ Updated locale [${lang}]`);
});

// Verification step
console.log('\nVerifying 100% key parity against en.json...');
const enData = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = getAllKeys(enData);
console.log(`Total keys in en.json: ${enKeys.length}`);

let hasErrors = false;
ALL_LANGUAGES.forEach((lang) => {
  const langData = JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf-8'));
  const missing = [];
  const invalid = [];

  enKeys.forEach((key) => {
    const segments = key.split('.');
    let curr = langData;
    for (const seg of segments) {
      if (curr && typeof curr === 'object') {
        curr = curr[seg];
      } else {
        curr = undefined;
        break;
      }
    }

    if (curr === undefined) {
      missing.push(key);
    } else if (typeof curr !== 'string' || curr.trim() === '' || curr === 'TODO' || curr === 'TRANSLATE_ME') {
      invalid.push(key);
    }
  });

  if (missing.length > 0) {
    console.error(`❌ [${lang}] has ${missing.length} missing keys:`, missing.slice(0, 5));
    hasErrors = true;
  }
  if (invalid.length > 0) {
    console.error(`❌ [${lang}] has ${invalid.length} invalid keys:`, invalid.slice(0, 5));
    hasErrors = true;
  }
  if (missing.length === 0 && invalid.length === 0) {
    console.log(`✅ [${lang}] 100% key coverage (${enKeys.length}/${enKeys.length} valid)`);
  }
});

if (hasErrors) {
  console.error('\nParity verification failed!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL 20 LOCALES SUCCESSFULLY UPDATED WITH 100% KEY COVERAGE!');
}
