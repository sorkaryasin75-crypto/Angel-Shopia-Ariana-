/**
 * GEO Location Utility for European Countries
 */
export const EUROPEAN_COUNTRIES = {
  AL: "Albania", AD: "Andorra", AT: "Austria", BY: "Belarus", BE: "Belgium",
  BA: "Bosnia and Herzegovina", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
  CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
  DE: "Germany", GR: "Greece", HU: "Hungary", IS: "Iceland", IE: "Ireland",
  IT: "Italy", XK: "Kosovo", LV: "Latvia", LI: "Liechtenstein", LT: "Lithuania",
  LU: "Luxembourg", MT: "Malta", MD: "Moldova", MC: "Monaco", ME: "Montenegro",
  NL: "Netherlands", MK: "North Macedonia", NO: "Norway", PL: "Poland", PT: "Portugal",
  RO: "Romania", SM: "San Marino", RS: "Serbia", SK: "Slovakia", SI: "Slovenia",
  ES: "Spain", SE: "Sweden", CH: "Switzerland", UA: "Ukraine", GB: "United Kingdom",
  VA: "Vatican City"
};

export const DEFAULT_LOCATION = {
  countryCode: "GB",
  countryName: "United Kingdom",
  city: "London",
  region: "England",
  timezone: "Europe/London",
  language: "en"
};

export async function detectVisitorGeo() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('GEO HTTP service error');
    const data = await response.json();

    const isEuropean = Object.keys(EUROPEAN_COUNTRIES).includes(data.country_code);
    return {
      countryCode: data.country_code || DEFAULT_LOCATION.countryCode,
      countryName: data.country_name || DEFAULT_LOCATION.countryName,
      city: data.city || DEFAULT_LOCATION.city,
      region: data.region || DEFAULT_LOCATION.region,
      timezone: data.timezone || DEFAULT_LOCATION.timezone,
      language: (data.languages || 'en').split(',')[0].substring(0, 2),
      isEuropean: isEuropean
    };
  } catch (err) {
    console.warn("GEO detection fallback triggered:", err.message);
    const userLang = navigator.language ? navigator.language.substring(0, 2) : "en";
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_LOCATION.timezone;
    return {
      ...DEFAULT_LOCATION,
      language: userLang,
      timezone: userTz
    };
  }
}
