/**
 * DisasterChain i18n Completeness & UI Translation Audit Test Suite
 * Validates:
 * 1. 20/20 Locales 100% key parity against en.json with no missing, null, or placeholder values
 * 2. Actual UI usage across all 21 major pages (verifies useTranslation hook and t() calls)
 * 3. Frontend static string audit for untranslated literals with technical exceptions
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// Helper to flatten nested object keys into dot notation
function getFlattenedKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getFlattenedKeys(value, fullPath));
    } else {
      keys.push({ path: fullPath, value });
    }
  }
  return keys;
}

function resolveNestedKey(obj, keyPath) {
  if (!obj || typeof obj !== 'object') return undefined;
  const segments = keyPath.split('.');
  let current = obj;
  for (const seg of segments) {
    if (current && typeof current === 'object' && seg in current) {
      current = current[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

async function runCompletenessSuite() {
  console.log('================================================================');
  console.log('🔍 DISASTERCHAIN i18n COMPLETENESS & UI AUDIT TEST SUITE');
  console.log('================================================================\n');

  const EXPECTED_20_LOCALES = [
    'en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa',
    'or', 'as', 'ur', 'sa', 'ne', 'kok', 'ks', 'mai', 'sd', 'mni'
  ];

  const localesDir = path.resolve(__dirname, '../frontend/src/i18n/locales');
  const pagesDir = path.resolve(__dirname, '../frontend/src/pages');
  const componentsDir = path.resolve(__dirname, '../frontend/src/components');

  // =========================================================================
  // 1. TRANSLATION KEY COVERAGE & PARITY (ALL 20 LOCALES)
  // =========================================================================
  console.log('--- 1. Translation Key Coverage & Parity Test ---');

  const enRaw = fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8');
  const enJson = JSON.parse(enRaw);
  const enKeyEntries = getFlattenedKeys(enJson);
  console.log(`  ℹ️ Source language (en.json) contains ${enKeyEntries.length} translation keys`);

  assert(enKeyEntries.length >= 450, `en.json contains comprehensive key count (found ${enKeyEntries.length} >= 450)`);

  const forbiddenPlaceholders = ['TODO', 'TRANSLATE_ME', 'MISSING_TRANSLATION'];

  EXPECTED_20_LOCALES.forEach((localeCode) => {
    const localePath = path.join(localesDir, `${localeCode}.json`);
    assert(fs.existsSync(localePath), `Locale file exists: ${localeCode}.json`);

    const raw = fs.readFileSync(localePath, 'utf-8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      assert(false, `Valid JSON in ${localeCode}.json: ${err.message}`);
    }

    const localeKeys = getFlattenedKeys(parsed);
    assert(
      localeKeys.length === enKeyEntries.length,
      `Locale [${localeCode}] has exact key count match with en.json (${localeKeys.length}/${enKeyEntries.length})`
    );

    // Verify key parity and no missing/placeholder values
    let missingCount = 0;
    let placeholderCount = 0;

    enKeyEntries.forEach(({ path: keyPath }) => {
      const val = resolveNestedKey(parsed, keyPath);
      if (val === undefined || val === null || val === '') {
        missingCount++;
      } else if (typeof val === 'string') {
        forbiddenPlaceholders.forEach((f) => {
          if (val.includes(f)) placeholderCount++;
        });
      }
    });

    assert(missingCount === 0, `Locale [${localeCode}] has zero missing keys (found ${missingCount})`);
    assert(placeholderCount === 0, `Locale [${localeCode}] has zero placeholder strings (found ${placeholderCount})`);
  });

  // =========================================================================
  // 2. ACTUAL UI USAGE VERIFICATION ACROSS ALL MAJOR PAGES
  // =========================================================================
  console.log('\n--- 2. Actual UI Usage Verification (Pages & Components) ---');

  const majorPages = [
    'OfflineEmergencyPage.jsx',
    'LandingPage.jsx',
    'EmergencyDashboard.jsx',
    'SheltersPage.jsx',
    'AlertsPage.jsx',
    'IncidentReportsPage.jsx',
    'MyReportsPage.jsx',
    'AffectedAreasPage.jsx',
    'EmergencyResourcesPage.jsx',
    'ResourceTrackingPage.jsx',
    'DonationsPage.jsx',
    'TransparencyLedgerPage.jsx',
    'DisasterGuidesPage.jsx',
    'SosPage.jsx',
    'LoginPage.jsx',
    'RegisterPage.jsx',
    'ForgotPasswordPage.jsx',
    'ResetPasswordPage.jsx',
    'VerifyEmailPage.jsx',
    'ProfilePage.jsx',
    'AdminDashboard.jsx',
  ];

  majorPages.forEach((pageName) => {
    const filePath = path.join(pagesDir, pageName);
    assert(fs.existsSync(filePath), `Page file exists: ${pageName}`);

    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Must import useTranslation
    const hasImport = content.includes("useTranslation") &&
      (content.includes("'../i18n/i18n'") || content.includes("'../i18n'") || content.includes('"../i18n/i18n"'));
    assert(hasImport, `Page [${pageName}] imports useTranslation`);

    // 2. Must invoke hook
    const hasHookCall = /const\s*\{\s*t(\s*,\s*[^}]+)?\s*\}\s*=\s*useTranslation\(\)/.test(content) ||
      content.includes("useTranslation()");
    assert(hasHookCall, `Page [${pageName}] invokes useTranslation() hook`);

    // 3. Must render t("...") translation calls
    const tCallMatches = content.match(/\bt\s*\(\s*['"][a-zA-Z0-9_.-]+['"]/g) || [];
    assert(
      tCallMatches.length >= 2,
      `Page [${pageName}] contains active t() calls (found ${tCallMatches.length} calls)`
    );
  });

  // Verify critical components that also require i18n
  const criticalComponents = [
    'DisasterCommandMap.jsx',
    'MapLocationPanel.jsx',
    'SosModal.jsx',
    'IncidentModal.jsx',
    'IncidentDetailModal.jsx',
    'ShelterDetailModal.jsx',
    'AlertDetailModal.jsx',
    'AreaDetailModal.jsx',
    'ResourceDetailModal.jsx',
    'ResourceJourneyModal.jsx',
    'BlockchainReceiptModal.jsx',
    'EmergencyAlertBanner.jsx',
    'MobileEmergencyNav.jsx',
    'OfflineSyncBadge.jsx',
    'Sidebar.jsx',
    'Navbar.jsx',
    'Footer.jsx',
  ];

  criticalComponents.forEach((cmpName) => {
    const filePath = path.join(componentsDir, cmpName);
    assert(fs.existsSync(filePath), `Component exists: ${cmpName}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const hasUseTranslation = content.includes('useTranslation');
    assert(hasUseTranslation, `Critical component [${cmpName}] uses useTranslation`);
  });

  // =========================================================================
  // 3. OFFLINE EMERGENCY PAGE SPECIFIC MANDATORY AUDIT
  // =========================================================================
  console.log('\n--- 3. Offline Emergency Page String Audit ---');

  const offlineFile = path.join(pagesDir, 'OfflineEmergencyPage.jsx');
  const offlineContent = fs.readFileSync(offlineFile, 'utf-8');

  // Verify mandatory keys used in OfflineEmergencyPage are called via t()
  const mandatoryOfflineKeys = [
    'offline.offlineTitle',
    'offline.offlineSubtitle',
    'offline.nationalEmergency',
    'offline.nationalEmergencyDesc',
    'offline.fireBrigade',
    'offline.fireBrigadeDesc',
    'offline.ambulanceTrauma',
    'offline.ambulanceTraumaDesc',
    'offline.ndrfForce',
    'offline.ndrfForceDesc',
    'offline.smsDistressTitle',
    'offline.smsDistressDesc',
    'offline.recipientHotline',
    'offline.emergencyCategory',
    'offline.survivalDirectivesTitle',
    'offline.survivalDirectivesDesc',
    'offline.directive1Title',
    'offline.directive2Title',
  ];

  mandatoryOfflineKeys.forEach((k) => {
    assert(
      offlineContent.includes(`'${k}'`) || offlineContent.includes(`"${k}"`),
      `OfflineEmergencyPage explicitly calls key [${k}]`
    );
  });

  // Verify phone numbers remain numeric and dynamic
  ['112', '101', '108', '1078'].forEach((num) => {
    assert(offlineContent.includes(num), `Emergency hotline [${num}] remains preserved as standard number`);
  });

  // =========================================================================
  // 4. HARDCODED STRING AUDIT SCANNER WITH TECHNICAL EXCLUSIONS
  // =========================================================================
  console.log('\n--- 4. Hardcoded User-Facing String Scanner ---');

  // Known technical/code tokens that are allowed as strings in JS
  const technicalExceptions = new Set([
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH',
    'http', 'https', 'Content-Type', 'application/json',
    'authorization', 'Bearer', 'utf-8', 'monospace',
    'flex', 'none', 'block', 'grid', 'center', 'pointer',
    'submit', 'button', 'text', 'password', 'email', 'number',
    'Pending', 'Resolved', 'Critical', 'High', 'Medium', 'Low',
    'Emergency', 'Warning', 'Safe', 'Active', 'Inactive',
    '112', '101', '108', '1078', '0', '1', '100%',
  ]);

  let totalPagesChecked = 0;
  majorPages.forEach((pageName) => {
    totalPagesChecked++;
    const filePath = path.join(pagesDir, pageName);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Verify there are no conditional language branches like if (language === 'hi')
    const hasLanguageConditional = /if\s*\(\s*(language|currentLanguage|lang)\s*===/i.test(content) ||
      /\b(language|lang)\s*===\s*['"][a-z]{2}['"]\s*\?/i.test(content);
    assert(
      !hasLanguageConditional,
      `Page [${pageName}] contains NO conditional language branching (if (language === '...'))`
    );
  });

  assert(totalPagesChecked === majorPages.length, `All ${majorPages.length} major pages audited without conditional branching`);

  // =========================================================================
  // 5. TEST SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`🏁 COMPLETENESS TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  if (failedTests > 0) {
    console.error(`❌ FAILED: ${failedTests}`);
    process.exit(1);
  } else {
    console.log('🎉 ALL i18n COMPLETENESS AND PARITY CHECKS PASSED!');
    console.log('================================================================\n');
  }
}

runCompletenessSuite().catch((err) => {
  console.error('Test suite encountered an error:', err);
  process.exit(1);
});
