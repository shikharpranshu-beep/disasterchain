/**
 * DisasterChain Supported Languages Configuration
 * 20 Indian languages + English as authoritative fallback
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isRtl: false,
    fontFamily: 'inherit',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    isRtl: false,
    fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    isRtl: false,
    fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    isRtl: false,
    fontFamily: "'Noto Sans Telugu', 'Nirmala UI', sans-serif",
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    isRtl: false,
    fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    isRtl: false,
    fontFamily: "'Noto Sans Tamil', 'Nirmala UI', sans-serif",
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    isRtl: false,
    fontFamily: "'Noto Sans Gujarati', 'Nirmala UI', sans-serif",
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    isRtl: false,
    fontFamily: "'Noto Sans Kannada', 'Nirmala UI', sans-serif",
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    isRtl: false,
    fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif",
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    isRtl: false,
    fontFamily: "'Noto Sans Gurmukhi', 'Nirmala UI', sans-serif",
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    isRtl: false,
    fontFamily: "'Noto Sans Oriya', 'Nirmala UI', sans-serif",
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    isRtl: false,
    fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    isRtl: true,
    fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
  },
  {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    isRtl: false,
    fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    isRtl: false,
    fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
  },
  {
    code: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    isRtl: false,
    fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
  },
  {
    code: 'ks',
    name: 'Kashmiri',
    nativeName: 'कॉशुर / کٲشُر',
    isRtl: true,
    fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Noto Sans Devanagari', sans-serif",
  },
  {
    code: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    isRtl: false,
    fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', sans-serif",
  },
  {
    code: 'sd',
    name: 'Sindhi',
    nativeName: 'सिन्धी / سنڌي',
    isRtl: true,
    fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Noto Sans Devanagari', sans-serif",
  },
  {
    code: 'mni',
    name: 'Manipuri',
    nativeName: 'মৈতৈলোন্ / ꯃꯤꯇꯩꯂꯣꯟ',
    isRtl: false,
    fontFamily: "'Noto Sans Bengali', 'Noto Sans Meetei Mayek', 'Nirmala UI', sans-serif",
  },
];

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_STORAGE_KEY = 'disasterchain_language';

export const RTL_LANGUAGES = ['ur', 'ks', 'sd'];

export const getLanguageConfig = (code) => {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ||
    SUPPORTED_LANGUAGES.find((lang) => lang.code === DEFAULT_LANGUAGE)
  );
};

export const isValidLanguageCode = (code) => {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
};
